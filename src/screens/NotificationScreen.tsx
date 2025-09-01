import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { auth } from '../config/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Timestamp } from 'firebase/firestore';

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'job_application' | 'message' | 'system' | 'reminder' | 'payment' | 'job_update';
  isRead: boolean;
  timestamp: Date | Timestamp;
  data?: {
    jobId?: string;
    messageId?: string;
    amount?: number;
    [key: string]: any;
  };
}

export default function NotificationScreen({ navigation }: any) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  // Auth state'i dinle
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        setupNotificationsListener(user.uid);
      } else {
        setLoading(false);
        Alert.alert('Hata', 'Bildirimleri görüntülemek için giriş yapmanız gerekiyor!');
        navigation.navigate('Login');
      }
    });

    return () => unsubscribe();
  }, [navigation]);

  // Real-time notifications dinleme
  const setupNotificationsListener = (userId: string) => {
    console.log('🔔 Real-time notifications dinleme başlatılıyor...');
    
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const newNotifications: Notification[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const notification: Notification = {
          id: doc.id,
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
          isRead: data.isRead || false,
          timestamp: data.timestamp,
          data: data.data || {}
        };
        newNotifications.push(notification);
      });

      console.log('🔄 Real-time notifications güncelleme:', newNotifications.length, 'bildirim');
      setNotifications(newNotifications);
      setLoading(false);
    }, (error) => {
      console.error('❌ Real-time notifications dinleme hatası:', error);
      setLoading(false);
    });

    return () => {
      console.log('🔕 Real-time notifications dinleme durduruldu');
      unsubscribe();
    };
  };

  const onRefresh = async () => {
    if (!currentUser) return;
    
    setRefreshing(true);
    try {
      console.log('🔄 Bildirimler yenileniyor...');
      // Real-time listener zaten aktif, sadece loading state'i güncelle
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('✅ Bildirimler yenilendi');
    } catch (error: any) {
      console.error('❌ Bildirim yenileme hatası:', error);
      Alert.alert('Hata', 'Bildirimler yenilenemedi: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setRefreshing(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!currentUser) return;

    try {
      console.log('📖 Bildirim okundu olarak işaretleniyor...');
      
      await updateDoc(doc(db, 'notifications', notificationId), {
        isRead: true
      });
      
      console.log('✅ Bildirim okundu olarak işaretlendi');
    } catch (error: any) {
      console.error('❌ Bildirim işaretleme hatası:', error);
      Alert.alert('Hata', 'Bildirim işaretlenemedi: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  const markAllAsRead = async () => {
    if (!currentUser) return;

    Alert.alert(
      'Tümünü Okundu İşaretle',
      'Tüm bildirimleri okundu olarak işaretlemek istiyor musunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Evet', 
          onPress: async () => {
            try {
              console.log('📖 Tüm bildirimler okundu olarak işaretleniyor...');
              
              const unreadNotifications = notifications.filter(n => !n.isRead);
              const updatePromises = unreadNotifications.map(notification =>
                updateDoc(doc(db, 'notifications', notification.id), {
                  isRead: true
                })
              );
              
              await Promise.all(updatePromises);
              
              console.log('✅ Tüm bildirimler okundu olarak işaretlendi');
              Alert.alert('Başarılı', 'Tüm bildirimler okundu olarak işaretlendi!');
            } catch (error: any) {
              console.error('❌ Toplu bildirim işaretleme hatası:', error);
              Alert.alert('Hata', 'Bildirimler işaretlenemedi: ' + (error.message || 'Bilinmeyen hata'));
            }
          }
        }
      ]
    );
  };

  const deleteNotification = async (notificationId: string) => {
    if (!currentUser) return;

    Alert.alert(
      'Bildirimi Sil',
      'Bu bildirimi silmek istiyor musunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Bildirim siliniyor...');
              
              await deleteDoc(doc(db, 'notifications', notificationId));
              
              console.log('✅ Bildirim silindi');
            } catch (error: any) {
              console.error('❌ Bildirim silme hatası:', error);
              Alert.alert('Hata', 'Bildirim silinemedi: ' + (error.message || 'Bilinmeyen hata'));
            }
          }
        }
      ]
    );
  };

  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.isRead);
      case 'read':
        return notifications.filter(n => n.isRead);
      default:
        return notifications;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'job_application':
        return '💼';
      case 'message':
        return '💬';
      case 'system':
        return '⚙️';
      case 'reminder':
        return '⏰';
      case 'payment':
        return '💰';
      case 'job_update':
        return '📋';
      default:
        return '🔔';
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

    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Az önce';
    if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} saat önce`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)} gün önce`;
    
    return date.toLocaleDateString('tr-TR', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const handleNotificationPress = (notification: Notification) => {
    // Bildirimi okundu olarak işaretle
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Bildirim tipine göre yönlendirme
    switch (notification.type) {
      case 'job_application':
        if (notification.data?.jobId) {
          navigation.navigate('JobDetail', { jobId: notification.data.jobId });
        }
        break;
      case 'message':
        if (notification.data?.messageId) {
          navigation.navigate('Messages');
        }
        break;
      case 'payment':
        navigation.navigate('Payments');
        break;
      case 'job_update':
        if (notification.data?.jobId) {
          navigation.navigate('JobDetail', { jobId: notification.data.jobId });
        }
        break;
      default:
        // Sistem bildirimleri için bir şey yapma
        break;
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Bildirimler yükleniyor...</Text>
          <Text style={styles.loadingSubtext}>Firebase'den veriler alınıyor</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredNotifications = getFilteredNotifications();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔔 Bildirimler</Text>
        {notifications.some(n => !n.isRead) && (
          <TouchableOpacity style={styles.markAllReadButton} onPress={markAllAsRead}>
            <Text style={styles.markAllReadButtonText}>Tümünü Okundu İşaretle</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
            Tümü ({notifications.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'unread' && styles.filterTabActive]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.filterTabText, filter === 'unread' && styles.filterTabTextActive]}>
            Okunmamış ({notifications.filter(n => !n.isRead).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'read' && styles.filterTabActive]}
          onPress={() => setFilter('read')}
        >
          <Text style={[styles.filterTabText, filter === 'read' && styles.filterTabTextActive]}>
            Okunmuş ({notifications.filter(n => n.isRead).length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <ScrollView
        style={styles.notificationsList}
        contentContainerStyle={styles.notificationsContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🔔</Text>
            <Text style={styles.emptyStateTitle}>
              {filter === 'all' ? 'Henüz bildirim yok' : 
               filter === 'unread' ? 'Okunmamış bildirim yok' : 'Okunmuş bildirim yok'}
            </Text>
            <Text style={styles.emptyStateSubtitle}>
              {filter === 'all' ? 'Yeni işler, mesajlar ve güncellemeler burada görünecek' :
               filter === 'unread' ? 'Tüm bildirimler okundu olarak işaretlendi' : 'Okunmuş bildirimler burada görünecek'}
            </Text>
          </View>
        ) : (
          filteredNotifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                !notification.isRead && styles.unreadNotification
              ]}
              onPress={() => handleNotificationPress(notification)}
            >
              <View style={styles.notificationHeader}>
                <Text style={styles.notificationIcon}>
                  {getNotificationIcon(notification.type)}
                </Text>
                <View style={styles.notificationInfo}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.notificationTime}>
                    {formatTime(notification.timestamp)}
                  </Text>
                </View>
                {!notification.isRead && (
                  <View style={styles.unreadIndicator} />
                )}
              </View>
              
              <Text style={styles.notificationMessage}>{notification.message}</Text>
              
              <View style={styles.notificationActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => markAsRead(notification.id)}
                >
                  <Text style={styles.actionButtonText}>
                    {notification.isRead ? 'Okundu' : 'Okundu İşaretle'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => deleteNotification(notification.id)}
                >
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Sil</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  loadingSubtext: {
    marginTop: 5,
    fontSize: 14,
    color: '#9CA3AF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  markAllReadButton: {
    padding: 8,
  },
  markAllReadButtonText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#2563EB',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  notificationsList: {
    flex: 1,
  },
  notificationsContent: {
    paddingBottom: 20, // Add some padding at the bottom for the filter tabs
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  unreadNotification: {
    backgroundColor: '#F8FAFC',
    borderColor: '#2563EB',
    borderWidth: 2,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationIcon: {
    fontSize: 32,
    width: 40,
    textAlign: 'center',
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  notificationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  deleteButtonText: {
    color: '#FFFFFF',
  },
  unreadIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
