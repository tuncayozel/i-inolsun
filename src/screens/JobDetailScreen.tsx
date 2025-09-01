import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Image,
  RefreshControl,
  TextInput,
} from 'react-native';
import { auth } from '../config/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Timestamp } from 'firebase/firestore';
import { JobService, Job } from '../services/jobService';
import { MessageService } from '../services/messageService';

interface JobApplication {
  id: string;
  jobId: string;
  userId: string;
  userEmail: string;
  userName: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  appliedAt: Date | Timestamp | undefined;
  message?: string;
  price?: number | null;
  estimatedTime?: string;
  jobOwnerId: string;
}

const JobDetailScreen = ({ route, navigation }: any) => {
  const { jobId, job: initialJob }: { jobId: string; job?: Job } = route.params;
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [application, setApplication] = useState<JobApplication | null>(null);
  const [applying, setApplying] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyData, setApplyData] = useState({
    message: '',
    price: '',
    estimatedTime: ''
  });

  // Auth state'i dinle
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        // Eğer initialJob varsa onu kullan, yoksa Firebase'den al
        if (initialJob) {
          setJob(initialJob);
          setLoading(false);
          checkUserApplication(user.uid);
        } else {
          fetchJobDetails();
          checkUserApplication(user.uid);
        }
      } else {
        setLoading(false);
        Alert.alert('Hata', 'İş detaylarını görüntülemek için giriş yapmanız gerekiyor!');
        navigation.navigate('Login');
      }
    });

    return () => unsubscribe();
  }, [navigation, jobId, initialJob]);

  // İş detaylarını al
  const fetchJobDetails = async () => {
    if (!jobId) {
      console.log('⚠️ jobId bulunamadı, iş detayları alınamıyor');
      setLoading(false);
      Alert.alert('Hata', 'İş ID bulunamadı!');
      navigation.goBack();
      return;
    }
    
    try {
      setLoading(true);
      console.log('📋 Firebase\'den iş detayları alınıyor...');
      
      const jobDoc = await getDoc(doc(db, 'jobs', jobId));
      
      if (jobDoc.exists()) {
        const data = jobDoc.data();
        const jobData: Job = {
          id: jobDoc.id,
          title: data.title,
          description: data.description,
          category: data.category,
          location: data.location,
          price: data.price,
          priceType: data.priceType,
          ownerId: data.ownerId,
          employerName: data.employerName,
          status: data.status,
          createdAt: data.createdAt,
          requirements: data.requirements || [],
          images: data.images || [],
          workerId: data.workerId,
          workerName: data.workerName,
          completedAt: data.completedAt,
          rating: data.rating,
          review: data.review
        };
        
        setJob(jobData);
        console.log('✅ İş detayları alındı:', jobData);
      } else {
        Alert.alert('Hata', 'İş bulunamadı!');
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('❌ İş detayları alma hatası:', error);
      Alert.alert('Hata', 'İş detayları alınamadı: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  // Kullanıcının başvurusunu kontrol et
  const checkUserApplication = async (userId: string) => {
    if (!jobId) {
      console.log('⚠️ jobId bulunamadı, başvuru kontrol edilemiyor');
      return;
    }
    
    try {
      console.log('🔍 Kullanıcı başvurusu kontrol ediliyor...');
      
      const applicationsQuery = query(
        collection(db, 'jobApplications'),
        where('jobId', '==', jobId),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(applicationsQuery);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const appData = doc.data();
                 const applicationData: JobApplication = {
           id: doc.id,
           jobId: appData.jobId,
           userId: appData.userId,
           userEmail: appData.userEmail,
           userName: appData.userName,
           status: appData.status,
           appliedAt: appData.appliedAt,
           message: appData.message,
           price: appData.price,
           estimatedTime: appData.estimatedTime,
           jobOwnerId: appData.jobOwnerId || ''
         };
        
        setApplication(applicationData);
        setHasApplied(true);
        console.log('✅ Kullanıcı başvurusu bulundu:', applicationData);
      } else {
        setHasApplied(false);
        console.log('ℹ️ Kullanıcı başvurusu bulunamadı');
      }
    } catch (error: any) {
      console.error('❌ Başvuru kontrol hatası:', error);
    }
  };

  // İşe başvur
  const handleApplyJob = async () => {
    if (!currentUser || !job || !jobId) return;

    try {
      setApplying(true);
      console.log('📝 İş başvurusu gönderiliyor...');
      
      const applicationData = {
        jobId: jobId,
        userId: currentUser.uid,
        userEmail: currentUser.email || '',
        userName: currentUser.email?.split('@')[0] || 'Kullanıcı',
        status: 'pending' as const,
        appliedAt: Timestamp.now(),
        message: applyData.message,
        price: applyData.price && applyData.price.trim() ? parseFloat(applyData.price) : (applyData.price === '' ? null : undefined),
        estimatedTime: applyData.estimatedTime,
        jobOwnerId: job.ownerId
      };

      // Firestore'a başvuru kaydet
      const docRef = doc(collection(db, 'jobApplications'));
      await setDoc(docRef, applicationData);
      
      // İş verenine bildirim gönder
      await sendNotificationToEmployer(job.ownerId, {
        title: 'Yeni İş Başvurusu',
        message: `${currentUser.email?.split('@')[0]} adlı kullanıcı "${job.title}" işine başvurdu.`,
        type: 'job_application',
        data: {
          jobId: jobId,
          applicationId: docRef.id
        }
      });

      // Local state'i güncelle
      setApplication({
        id: docRef.id,
        ...applicationData
      });
      setHasApplied(true);
      setShowApplyModal(false);
      
      console.log('✅ İş başvurusu gönderildi');
      Alert.alert('Başarılı', 'Başvurunuz gönderildi! İşveren sizinle iletişime geçecektir.');
    } catch (error: any) {
      console.error('❌ İş başvurusu hatası:', error);
      Alert.alert('Hata', 'Başvuru gönderilemedi: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setApplying(false);
    }
  };

  // İşverene bildirim gönder
  const sendNotificationToEmployer = async (employerId: string, notificationData: any) => {
    try {
      await setDoc(doc(collection(db, 'notifications')), {
        userId: employerId,
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

  // İşveren ile mesajlaş
  const handleMessageEmployer = () => {
    if (!currentUser || !job) return;

    // Chat room oluştur veya mevcut olanı bul
          const chatRoomId = `${currentUser.uid}_${job.ownerId}_${jobId}`;
    
    navigation.navigate('Chat', {
      conversationId: chatRoomId,
              otherUserId: job.ownerId,
      jobId: jobId,
      jobTitle: job.title
    });
  };

  // Başvuruyu geri çek
  const handleWithdrawApplication = async () => {
    if (!application) return;

    Alert.alert(
      'Başvuruyu Geri Çek',
      'Bu başvuruyu geri çekmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Geri Çek', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('↩️ Başvuru geri çekiliyor...');
              
              await updateDoc(doc(db, 'jobApplications', application.id), {
                status: 'withdrawn'
              });
              
              setApplication(prev => prev ? { ...prev, status: 'withdrawn' } : null);
              setHasApplied(false);
              
              console.log('✅ Başvuru geri çekildi');
              Alert.alert('Başarılı', 'Başvurunuz geri çekildi!');
            } catch (error: any) {
              console.error('❌ Başvuru geri çekme hatası:', error);
              Alert.alert('Hata', 'Başvuru geri çekilemedi: ' + (error.message || 'Bilinmeyen hata'));
            }
          }
        }
      ]
    );
  };

  // Sayfayı yenile
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJobDetails();
    if (currentUser) {
      await checkUserApplication(currentUser.uid);
    }
    setRefreshing(false);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'in_progress': return 'Devam Ediyor';
      case 'completed': return 'Tamamlandı';
      case 'cancelled': return 'İptal Edildi';
      default: return status;
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'active': return { backgroundColor: '#DBEAFE' };
      case 'in_progress': return { backgroundColor: '#FEF3C7' };
      case 'completed': return { backgroundColor: '#D1FAE5' };
      case 'cancelled': return { backgroundColor: '#FEE2E2' };
      default: return { backgroundColor: '#F3F4F6' };
    }
  };

  const getStatusTextStyle = (status: string) => {
    switch (status) {
      case 'active': return { color: '#1D4ED8' };
      case 'in_progress': return { color: '#D97706' };
      case 'completed': return { color: '#059669' };
      case 'cancelled': return { color: '#DC2626' };
      default: return { color: '#6B7280' };
    }
  };

  const getApplicationStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Beklemede';
      case 'accepted': return 'Kabul Edildi';
      case 'rejected': return 'Reddedildi';
      case 'withdrawn': return 'Geri Çekildi';
      default: return status;
    }
  };

  const getApplicationStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'accepted': return '#10B981';
      case 'rejected': return '#EF4444';
      case 'withdrawn': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const formatTime = (timestamp: Date | Timestamp | undefined) => {
    if (!timestamp) return '';
    
    let date: Date;
    
    try {
      if (timestamp instanceof Date) {
        date = timestamp;
      } else if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
        date = timestamp.toDate();
      } else {
        date = new Date(timestamp);
      }
      
      if (isNaN(date.getTime())) {
        return '';
      }

      return date.toLocaleDateString('tr-TR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Tarih formatı hatası:', error);
      return '';
    }
  };

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

  if (loading || !job) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>İş detayları yükleniyor...</Text>
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
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Geri</Text>
          </TouchableOpacity>
          
          <View style={styles.header}>
            <Text style={styles.title}>{job.title}</Text>
            <View style={[styles.statusBadge, getStatusBadgeStyle(job.status)]}>
              <Text style={[styles.statusText, getStatusTextStyle(job.status)]}>
                {getStatusLabel(job.status)}
              </Text>
            </View>
          </View>

          {/* İş Resimleri */}
          {job.images && job.images.length > 0 && (
            <View style={styles.imagesSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {job.images.map((imageUrl, index) => (
                  <Image
                    key={index}
                    source={{ uri: imageUrl }}
                    style={styles.jobImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Kategori:</Text>
              <Text style={styles.infoValue}>{job.category}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Konum:</Text>
              <Text style={styles.infoValue}>{job.location}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Fiyat:</Text>
              <Text style={styles.infoValue}>
                {job.price.toLocaleString('tr-TR')} TL ({job.priceType === 'hourly' ? 'Saatlik' : 'Sabit'})
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>İşveren:</Text>
              <Text style={styles.infoValue}>{job.employerName}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>İlan Tarihi:</Text>
              <Text style={styles.infoValue}>{formatTime(job.createdAt)}</Text>
            </View>
            

          </View>

          {/* Gereksinimler */}
          {job.requirements && job.requirements.length > 0 && (
            <View style={styles.requirementsSection}>
              <Text style={styles.sectionTitle}>Gereksinimler</Text>
              {job.requirements.map((req, index) => (
                <View key={index} style={styles.requirementItem}>
                  <Text style={styles.requirementText}>• {req}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Açıklama */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>İş Açıklaması</Text>
            <Text style={styles.descriptionText}>{job.description}</Text>
          </View>

          {/* Başvuru Durumu */}
          {hasApplied && application && (
            <View style={styles.applicationSection}>
              <Text style={styles.sectionTitle}>Başvuru Durumu</Text>
              <View style={styles.applicationCard}>
                <View style={styles.applicationHeader}>
                  <Text style={styles.applicationStatus}>
                    {getApplicationStatusLabel(application.status)}
                  </Text>
                  <View style={[
                    styles.applicationStatusBadge,
                    { backgroundColor: getApplicationStatusColor(application.status) }
                  ]} />
                </View>
                
                {application.appliedAt && (
                  <Text style={styles.applicationDate}>
                    Başvuru Tarihi: {formatTime(application.appliedAt)}
                  </Text>
                )}
                
                {application.message && (
                  <Text style={styles.applicationMessage}>
                    Mesajınız: {application.message}
                  </Text>
                )}
                
                {application.status === 'pending' && (
                  <TouchableOpacity
                    style={styles.withdrawButton}
                    onPress={handleWithdrawApplication}
                  >
                    <Text style={styles.withdrawButtonText}>Başvuruyu Geri Çek</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Aksiyon Butonları */}
          <View style={styles.actionsSection}>
            {!hasApplied ? (
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowApplyModal(true)}
              >
                <Text style={styles.applyButtonText}>İşe Başvur</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.appliedActions}>
                <TouchableOpacity
                  style={styles.messageButton}
                  onPress={handleMessageEmployer}
                >
                  <Text style={styles.messageButtonText}>İşveren ile Mesajlaş</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Başvuru Modal */}
      {showApplyModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>İşe Başvur</Text>
            
            <Text style={styles.modalLabel}>Mesajınız (Opsiyonel):</Text>
            <TextInput
              style={styles.modalTextArea}
              placeholder="İşverene mesajınızı yazın..."
              value={applyData.message}
              onChangeText={(text) => setApplyData(prev => ({ ...prev, message: text }))}
              multiline
              numberOfLines={4}
            />
            
            <Text style={styles.modalLabel}>Teklif Fiyatınız (Opsiyonel):</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="TL cinsinden"
              value={applyData.price}
              onChangeText={(text) => setApplyData(prev => ({ ...prev, price: text }))}
              keyboardType="numeric"
            />
            
            <Text style={styles.modalLabel}>Tahmini Süre (Opsiyonel):</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Örn: 2 saat, 1 gün"
              value={applyData.estimatedTime}
              onChangeText={(text) => setApplyData(prev => ({ ...prev, estimatedTime: text }))}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowApplyModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>İptal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalApplyButton, applying && styles.modalApplyButtonDisabled]}
                onPress={handleApplyJob}
                disabled={applying}
              >
                {applying ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalApplyButtonText}>Başvur</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    position: 'relative', // Footer için relative pozisyon
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40, // Footer artık ScrollView içinde, az boşluk yeterli
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '600',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
    lineHeight: 32,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  imagesSection: {
    height: 200,
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  jobImage: {
    width: 150,
    height: '100%',
    marginRight: 10,
    borderRadius: 8,
  },
  infoSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  infoLabel: {
    fontSize: 16,
    color: '#6C757D',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  priceValue: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  requirementsSection: {
    marginBottom: 24,
  },
  requirementItem: {
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 16,
    color: '#495057',
    lineHeight: 24,
  },
  descriptionSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    color: '#495057',
    lineHeight: 24,
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
  },
  applicationSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  applicationCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  applicationStatus: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  applicationStatusBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  applicationDate: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 12,
  },
  applicationMessage: {
    fontSize: 16,
    color: '#495057',
    marginBottom: 12,
  },
  withdrawButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  withdrawButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  actionsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  appliedActions: {
    flex: 1,
    alignItems: 'center',
  },
  messageButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  messageButtonText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 25,
    width: '90%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 18,
    color: '#495057',
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  modalTextArea: {
    width: '100%',
    height: 120,
    borderColor: '#E9ECEF',
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
    color: '#1A1A1A',
  },
  modalInput: {
    width: '100%',
    height: 50,
    borderColor: '#E9ECEF',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
    color: '#1A1A1A',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalCancelButton: {
    backgroundColor: '#6C757D',
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  modalCancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalApplyButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  modalApplyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalApplyButtonDisabled: {
    backgroundColor: '#A0C4FF',
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 18,
    color: '#1A1A1A',
    marginTop: 10,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 5,
  },
});

export default JobDetailScreen;
