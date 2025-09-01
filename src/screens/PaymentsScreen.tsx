import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { auth } from '../config/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot, doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Timestamp } from 'firebase/firestore';

interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'job_payment' | 'commission' | 'refund';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  createdAt: Date | Timestamp;
  completedAt?: Date | Timestamp;
  paymentMethod?: string;
  reference?: string;
}

interface UserBalance {
  userId: string;
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
  pendingAmount: number;
  lastUpdated: Date | Timestamp;
}

export default function PaymentsScreen({ navigation }: any) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  // Auth state'i dinle
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        setupDataListener(user.uid);
      } else {
        setLoading(false);
        Alert.alert('Hata', 'Ödeme bilgilerinizi görüntülemek için giriş yapmanız gerekiyor!');
        navigation.navigate('Login');
      }
    });

    return () => unsubscribe();
  }, [navigation]);

  // Real-time data dinleme
  const setupDataListener = (userId: string) => {
    console.log('💰 Firebase\'den ödeme verileri dinleniyor...');
    
    // Kullanıcı bakiyesini dinle
    const balanceUnsubscribe = onSnapshot(doc(db, 'userBalances', userId), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as any;
        const balanceData: UserBalance = {
          userId: data.userId,
          balance: data.balance || 0,
          totalEarned: data.totalEarned || 0,
          totalWithdrawn: data.totalWithdrawn || 0,
          pendingAmount: data.pendingAmount || 0,
          lastUpdated: data.lastUpdated
        };
        setUserBalance(balanceData);
        console.log('✅ Kullanıcı bakiyesi alındı:', balanceData);
      } else {
        // Bakiye yoksa oluştur
        createDefaultBalance(userId);
      }
    });

    // İşlem geçmişini dinle
    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const transactionsUnsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
      const transactionList: Transaction[] = [];
      
      snapshot.docs.forEach((doc) => {
        const data = doc.data() as any;
        const transaction: Transaction = {
          id: doc.id,
          userId: data.userId,
          type: data.type,
          amount: data.amount,
          status: data.status,
          description: data.description,
          createdAt: data.createdAt,
          completedAt: data.completedAt,
          paymentMethod: data.paymentMethod,
          reference: data.reference
        };
        transactionList.push(transaction);
      });
      
      setTransactions(transactionList);
      console.log('✅ İşlem geçmişi alındı:', transactionList.length, 'işlem');
      setLoading(false);
    }, (error) => {
      console.error('❌ İşlem geçmişi alma hatası:', error);
      setLoading(false);
    });

    return () => {
      balanceUnsubscribe();
      transactionsUnsubscribe();
    };
  };

  // Varsayılan bakiye oluştur
  const createDefaultBalance = async (userId: string) => {
    try {
      const defaultBalance: UserBalance = {
        userId,
        balance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
        pendingAmount: 0,
        lastUpdated: Timestamp.now()
      };
      
      await setDoc(doc(db, 'userBalances', userId), defaultBalance);
      setUserBalance(defaultBalance);
      console.log('✅ Varsayılan bakiye oluşturuldu');
    } catch (error: any) {
      console.error('❌ Varsayılan bakiye oluşturma hatası:', error);
    }
  };

  // Para çekme
  const handleWithdraw = async () => {
    if (!currentUser || !userBalance) return;
    
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Hata', 'Geçerli bir miktar giriniz!');
      return;
    }
    
    if (amount > userBalance.balance) {
      Alert.alert('Hata', 'Yetersiz bakiye!');
      return;
    }

    try {
      setProcessing(true);
      console.log('💸 Para çekme işlemi başlatılıyor...');
      
      const transactionId = `withdraw_${Date.now()}`;
      const transaction: Transaction = {
        id: transactionId,
        userId: currentUser.uid,
        type: 'withdrawal',
        amount: amount,
        status: 'pending',
        description: 'Para çekme talebi',
        createdAt: Timestamp.now(),
        paymentMethod: 'bank_transfer'
      };

      // İşlemi kaydet
      await setDoc(doc(db, 'transactions', transactionId), transaction);
      
      // Bakiyeyi güncelle
      await updateDoc(doc(db, 'userBalances', currentUser.uid), {
        balance: userBalance.balance - amount,
        pendingAmount: userBalance.pendingAmount + amount,
        lastUpdated: Timestamp.now()
      });

      // İşverene bildirim gönder
      await sendNotificationToUser(currentUser.uid, {
        title: 'Para Çekme Talebi',
        message: `${amount.toLocaleString('tr-TR')} TL para çekme talebiniz alındı. 1-3 iş günü içinde işleme alınacaktır.`,
        type: 'payment',
        data: { transactionId, amount }
      });

      console.log('✅ Para çekme talebi gönderildi');
      Alert.alert('Başarılı', 'Para çekme talebiniz alındı! 1-3 iş günü içinde işleme alınacaktır.');
      
      setShowWithdrawModal(false);
      setWithdrawAmount('');
    } catch (error: any) {
      console.error('❌ Para çekme hatası:', error);
      Alert.alert('Hata', 'Para çekme talebi gönderilemedi: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setProcessing(false);
    }
  };

  // Para yatırma
  const handleDeposit = async () => {
    if (!currentUser) return;
    
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Hata', 'Geçerli bir miktar giriniz!');
      return;
    }

    try {
      setProcessing(true);
      console.log('💳 Para yatırma işlemi başlatılıyor...');
      
      const transactionId = `deposit_${Date.now()}`;
      const transaction: Transaction = {
        id: transactionId,
        userId: currentUser.uid,
        type: 'deposit',
        amount: amount,
        status: 'pending',
        description: 'Para yatırma talebi',
        createdAt: Timestamp.now(),
        paymentMethod: 'credit_card'
      };

      // İşlemi kaydet
      await setDoc(doc(db, 'transactions', transactionId), transaction);
      
      // Bakiyeyi güncelle
      if (userBalance) {
        await updateDoc(doc(db, 'userBalances', currentUser.uid), {
          balance: userBalance.balance + amount,
          lastUpdated: Timestamp.now()
        });
      }

      console.log('✅ Para yatırma talebi gönderildi');
      Alert.alert('Başarılı', 'Para yatırma talebiniz alındı! Kredi kartınızdan tahsilat yapılacaktır.');
      
      setShowDepositModal(false);
      setDepositAmount('');
    } catch (error: any) {
      console.error('❌ Para yatırma hatası:', error);
      Alert.alert('Hata', 'Para yatırma talebi gönderilemedi: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setProcessing(false);
    }
  };

  // Kullanıcıya bildirim gönder
  const sendNotificationToUser = async (userId: string, notificationData: any) => {
    try {
      await setDoc(doc(collection(db, 'notifications')), {
        userId: userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        isRead: false,
        timestamp: Timestamp.now(),
        data: notificationData.data
      });
    } catch (error) {
      console.error('❌ Bildirim gönderme hatası:', error);
    }
  };

  // Sayfayı yenile
  const onRefresh = async () => {
    setRefreshing(true);
    if (currentUser) {
      await setupDataListener(currentUser.uid);
    }
    setRefreshing(false);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return '💳';
      case 'withdrawal': return '💸';
      case 'job_payment': return '💰';
      case 'commission': return '🏦';
      case 'refund': return '↩️';
      default: return '💱';
    }
  };

  const getTransactionStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'completed': return '#10B981';
      case 'failed': return '#EF4444';
      case 'cancelled': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getTransactionStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Beklemede';
      case 'completed': return 'Tamamlandı';
      case 'failed': return 'Başarısız';
      case 'cancelled': return 'İptal Edildi';
      default: return status;
    }
  };

  const formatTime = (timestamp: Date | Timestamp) => {
    if (!timestamp) return '';
    
    let date: Date;
    
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }

    return date.toLocaleDateString('tr-TR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionHeader}>
        <Text style={styles.transactionIcon}>{getTransactionIcon(item.type)}</Text>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDescription}>{item.description}</Text>
          <Text style={styles.transactionDate}>{formatTime(item.createdAt)}</Text>
        </View>
        <View style={styles.transactionAmount}>
          <Text style={[
            styles.amountText,
            { color: item.type === 'withdrawal' ? '#EF4444' : '#10B981' }
          ]}>
            {item.type === 'withdrawal' ? '-' : '+'}{item.amount.toLocaleString('tr-TR')} TL
          </Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getTransactionStatusColor(item.status) }
          ]}>
            <Text style={styles.statusText}>
              {getTransactionStatusLabel(item.status)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Giriş yapılıyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Ödeme bilgileri yükleniyor...</Text>
          <Text style={styles.loadingSubtext}>Firebase'den veriler alınıyor</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>💰 Ödemeler</Text>
          <Text style={styles.subtitle}>Kazançlarınız ve işlem geçmişiniz</Text>
        </View>

        {/* Bakiye Kartı */}
        {userBalance && (
          <View style={styles.balanceCard}>
            <Text style={styles.balanceTitle}>Mevcut Bakiye</Text>
            <Text style={styles.balanceAmount}>
              {userBalance.balance.toLocaleString('tr-TR')} TL
            </Text>
            
            <View style={styles.balanceStats}>
              <View style={styles.balanceStat}>
                <Text style={styles.statLabel}>Toplam Kazanç</Text>
                <Text style={styles.statValue}>
                  {userBalance.totalEarned.toLocaleString('tr-TR')} TL
                </Text>
              </View>
              
              <View style={styles.balanceStat}>
                <Text style={styles.statLabel}>Toplam Çekilen</Text>
                <Text style={styles.statValue}>
                  {userBalance.totalWithdrawn.toLocaleString('tr-TR')} TL
                </Text>
              </View>
              
              <View style={styles.balanceStat}>
                <Text style={styles.statLabel}>Bekleyen</Text>
                <Text style={styles.statValue}>
                  {userBalance.pendingAmount.toLocaleString('tr-TR')} TL
                </Text>
              </View>
            </View>

            <View style={styles.balanceActions}>
              <TouchableOpacity
                style={styles.depositButton}
                onPress={() => setShowDepositModal(true)}
              >
                <Text style={styles.depositButtonText}>💳 Para Yatır</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.withdrawButton,
                  userBalance.balance <= 0 && styles.withdrawButtonDisabled
                ]}
                onPress={() => setShowWithdrawModal(true)}
                disabled={userBalance.balance <= 0}
              >
                <Text style={styles.withdrawButtonText}>💸 Para Çek</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* İşlem Geçmişi */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>İşlem Geçmişi</Text>
          
          {transactions.length === 0 ? (
            <View style={styles.emptyTransactions}>
              <Text style={styles.emptyTransactionsIcon}>📊</Text>
              <Text style={styles.emptyTransactionsText}>Henüz işlem geçmişiniz yok</Text>
              <Text style={styles.emptyTransactionsSubtext}>
                İş yaparak kazanç elde ettiğinizde burada görünecek
              </Text>
            </View>
          ) : (
            transactions.map((transaction) => (
              <View key={transaction.id}>
                {renderTransactionItem({ item: transaction })}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Para Çekme Modal */}
      <Modal
        visible={showWithdrawModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWithdrawModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>💸 Para Çek</Text>
            
            <Text style={styles.modalLabel}>Çekmek istediğiniz miktar (TL):</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="0.00"
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              keyboardType="numeric"
            />
            
            <Text style={styles.modalInfo}>
              Mevcut bakiye: {userBalance?.balance.toLocaleString('tr-TR')} TL
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowWithdrawModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>İptal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalConfirmButton, processing && styles.modalConfirmButtonDisabled]}
                onPress={handleWithdraw}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmButtonText}>Çek</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Para Yatırma Modal */}
      <Modal
        visible={showDepositModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDepositModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>💳 Para Yatır</Text>
            
            <Text style={styles.modalLabel}>Yatırmak istediğiniz miktar (TL):</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="0.00"
              value={depositAmount}
              onChangeText={setDepositAmount}
              keyboardType="numeric"
            />
            
            <Text style={styles.modalInfo}>
              Kredi kartınızdan tahsilat yapılacaktır
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowDepositModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>İptal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalConfirmButton, processing && styles.modalConfirmButtonDisabled]}
                onPress={handleDeposit}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmButtonText}>Yatır</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 18, color: '#333', marginTop: 10 },
  loadingSubtext: { fontSize: 14, color: '#666', marginTop: 5 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },
  header: { alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#2563EB' },
  subtitle: { fontSize: 16, color: '#555', marginTop: 5 },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
    width: '100%',
  },
  balanceTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  balanceAmount: { fontSize: 48, fontWeight: 'bold', color: '#2563EB' },
  balanceStats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 15 },
  balanceStat: { alignItems: 'center' },
  statLabel: { fontSize: 14, color: '#555' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#2563EB' },
  balanceActions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
  depositButton: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 25,
    alignItems: 'center',
    width: '45%',
  },
  depositButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  withdrawButton: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 25,
    alignItems: 'center',
    width: '45%',
  },
  withdrawButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  withdrawButtonDisabled: {
    backgroundColor: '#E0E0E0',
    opacity: 0.7,
  },
  transactionsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
    width: '100%',
  },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  transactionItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 15,
    marginBottom: 15,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  transactionIcon: { fontSize: 28, marginRight: 10 },
  transactionInfo: { flex: 1, marginLeft: 10 },
  transactionDescription: { fontSize: 16, fontWeight: 'bold' },
  transactionDate: { fontSize: 12, color: '#555', marginTop: 2 },
  transactionAmount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountText: { fontSize: 18, fontWeight: 'bold' },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  emptyTransactions: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyTransactionsIcon: { fontSize: 50, color: '#CCCCCC', marginBottom: 10 },
  emptyTransactionsText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  emptyTransactionsSubtext: { fontSize: 14, color: '#666', marginTop: 5, textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 25,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#2563EB' },
  modalLabel: { fontSize: 16, marginBottom: 10, color: '#333' },
  modalInput: {
    width: '100%',
    height: 50,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 18,
  },
  modalInfo: { fontSize: 14, color: '#555', marginBottom: 20 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  modalCancelButton: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 25,
    alignItems: 'center',
    width: '40%',
  },
  modalCancelButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  modalConfirmButton: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 25,
    alignItems: 'center',
    width: '40%',
  },
  modalConfirmButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  modalConfirmButtonDisabled: {
    backgroundColor: '#E0E0E0',
    opacity: 0.7,
  },
});


