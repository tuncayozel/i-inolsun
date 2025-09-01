import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { auth } from '../config/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Timestamp } from 'firebase/firestore';
import { JobService, Job } from '../services/jobService';

interface UserJob extends Job {
  applicationId?: string;
  applicationStatus?: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  appliedAt?: Date | Timestamp;
}

export default function MyJobsScreen({ navigation }: any) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userJobs, setUserJobs] = useState<UserJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'active' | 'in_progress' | 'completed' | 'all'>('all');

  // Auth state'i dinle
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        setupJobsListener(user.uid);
      } else {
        setLoading(false);
        Alert.alert('Hata', 'İşlerinizi görüntülemek için giriş yapmanız gerekiyor!');
        navigation.navigate('Login');
      }
    });

    return () => unsubscribe();
  }, [navigation]);

  // Real-time jobs dinleme
  const setupJobsListener = (userId: string) => {
    console.log('📋 Firebase\'den kullanıcı işleri dinleniyor...');
    
    // Kullanıcının başvurduğu işleri al
    const applicationsQuery = query(
      collection(db, 'jobApplications'),
      where('userId', '==', userId),
      orderBy('appliedAt', 'desc')
    );

    const unsubscribe = onSnapshot(applicationsQuery, async (snapshot) => {
      try {
        const jobs: UserJob[] = [];
        
        for (const docSnapshot of snapshot.docs) {
          const appData = docSnapshot.data();
          
          // İş detaylarını al
          const jobDocRef = doc(db, 'jobs', appData.jobId);
          const jobDoc = await getDoc(jobDocRef);
          
          if (jobDoc.exists()) {
            const jobData = jobDoc.data() as any;
            const userJob: UserJob = {
              id: jobDoc.id,
              title: jobData.title,
              description: jobData.description,
              category: jobData.category,
              location: jobData.location,
              price: jobData.price,
              priceType: jobData.priceType,
              employerId: jobData.employerId,
              employerName: jobData.employerName,
              status: jobData.status,
              createdAt: jobData.createdAt,
              deadline: jobData.deadline,
              requirements: jobData.requirements || [],
              images: jobData.images || [],
              workerId: jobData.workerId,
              workerName: jobData.workerName,
              completedAt: jobData.completedAt,
              rating: jobData.rating,
              review: jobData.review,
              applicationId: docSnapshot.id,
              applicationStatus: appData.status,
              appliedAt: appData.appliedAt
            };
            
            jobs.push(userJob);
          }
        }
        
        console.log('✅ Kullanıcı işleri alındı:', jobs.length, 'iş');
        setUserJobs(jobs);
        setLoading(false);
      } catch (error: any) {
        console.error('❌ Kullanıcı işleri alma hatası:', error);
        setLoading(false);
      }
    }, (error) => {
      console.error('❌ Real-time jobs dinleme hatası:', error);
      setLoading(false);
    });

    return () => {
      console.log('🔕 Real-time jobs dinleme durduruldu');
      unsubscribe();
    };
  };

  // Sayfayı yenile
  const onRefresh = async () => {
    setRefreshing(true);
    if (currentUser) {
      await setupJobsListener(currentUser.uid);
    }
    setRefreshing(false);
  };

  // İş durumunu güncelle
  const updateJobStatus = async (jobId: string, newStatus: string) => {
    try {
      console.log('📝 İş durumu güncelleniyor...');
      
      await updateDoc(doc(db, 'jobs', jobId), {
        status: newStatus,
        ...(newStatus === 'completed' && { completedAt: Timestamp.now() })
      });
      
      console.log('✅ İş durumu güncellendi');
      Alert.alert('Başarılı', 'İş durumu güncellendi!');
    } catch (error: any) {
      console.error('❌ İş durumu güncelleme hatası:', error);
      Alert.alert('Hata', 'İş durumu güncellenemedi: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  // İşi tamamla
  const handleCompleteJob = (job: UserJob) => {
    Alert.alert(
      'İşi Tamamla',
      `"${job.title}" işini tamamlandı olarak işaretlemek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Tamamla', 
          onPress: () => updateJobStatus(job.id!, 'completed')
        }
      ]
    );
  };

  // İşi iptal et
  const handleCancelJob = (job: UserJob) => {
    Alert.alert(
      'İşi İptal Et',
      `"${job.title}" işini iptal etmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'İptal Et', 
          style: 'destructive',
          onPress: () => updateJobStatus(job.id!, 'cancelled')
        }
      ]
    );
  };

  // Filtrelenmiş işleri al
  const getFilteredJobs = () => {
    if (selectedFilter === 'all') return userJobs;
    return userJobs.filter(job => job.status === selectedFilter);
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
      year: 'numeric'
    });
  };

  const renderJobCard = ({ item }: { item: UserJob }) => (
    <TouchableOpacity 
      style={styles.jobCard}
      onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
    >
      <View style={styles.jobHeader}>
        <Text style={styles.jobTitle}>{item.title}</Text>
        <Text style={styles.jobPrice}>
          {item.price.toLocaleString('tr-TR')} TL ({item.priceType === 'hourly' ? 'Saatlik' : 'Sabit'})
        </Text>
      </View>
      
      <Text style={styles.jobCategory}>{item.category}</Text>
      <Text style={styles.jobLocation}>📍 {item.location}</Text>
      <Text style={styles.jobDate}>📅 {formatTime(item.createdAt)}</Text>
      
      {/* Başvuru Durumu */}
      {item.applicationStatus && (
        <View style={styles.applicationStatusContainer}>
          <Text style={styles.applicationStatusLabel}>Başvuru:</Text>
          <View style={[
            styles.applicationStatusBadge,
            { backgroundColor: getApplicationStatusColor(item.applicationStatus) }
          ]}>
            <Text style={styles.applicationStatusText}>
              {getApplicationStatusLabel(item.applicationStatus)}
            </Text>
          </View>
        </View>
      )}
      
      {/* İş Durumu */}
      <View style={styles.statusContainer}>
        <View style={[styles.statusBadge, getStatusBadgeStyle(item.status)]}>
          <Text style={[styles.statusText, getStatusTextStyle(item.status)]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      {/* Aksiyon Butonları */}
      {item.status === 'in_progress' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => handleCompleteJob(item)}
          >
            <Text style={styles.completeButtonText}>İşi Tamamla</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelJob(item)}
          >
            <Text style={styles.cancelButtonText}>İptal Et</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
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
          <Text style={styles.loadingText}>İşleriniz yükleniyor...</Text>
          <Text style={styles.loadingSubtext}>Firebase'den veriler alınıyor</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredJobs = getFilteredJobs();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>📋 İşlerim</Text>
          <Text style={styles.subtitle}>Devam eden ve tamamlanan işleriniz</Text>
        </View>

        <View style={styles.filterContainer}>
          {(['all', 'active', 'in_progress', 'completed'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                selectedFilter === filter && styles.filterButtonActive
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[
                styles.filterText,
                selectedFilter === filter && styles.filterTextActive
              ]} numberOfLines={1}>
                {filter === 'all' ? 'Tümü' : getStatusLabel(filter)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {filteredJobs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📋</Text>
            <Text style={styles.emptyStateTitle}>
              {selectedFilter === 'all' ? 'Henüz iş başvurunuz yok' : 
               selectedFilter === 'active' ? 'Aktif işiniz yok' :
               selectedFilter === 'in_progress' ? 'Devam eden işiniz yok' : 'Tamamlanan işiniz yok'}
            </Text>
            <Text style={styles.emptyStateSubtitle}>
              {selectedFilter === 'all' ? 'İş ilanlarına başvuru yaparak işlerinizi burada takip edebilirsiniz' :
               selectedFilter === 'active' ? 'Aktif işler burada görünecek' :
               selectedFilter === 'in_progress' ? 'Devam eden işler burada görünecek' : 'Tamamlanan işler burada görünecek'}
            </Text>
            
            <TouchableOpacity
              style={styles.browseJobsButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.browseJobsButtonText}>İş İlanlarını Görüntüle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredJobs}
            renderItem={renderJobCard}
            keyExtractor={(item) => item.id!}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
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
  scrollContent: {
    paddingBottom: 120, // Alt navigasyon için boşluk
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 44,
  },
  filterButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  jobsList: {
    paddingHorizontal: 20,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  jobPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  jobCategory: {
    fontSize: 14,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  jobLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  jobDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  statusContainer: {
    alignItems: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  applicationStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  applicationStatusLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  applicationStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
  },
  applicationStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  completeButton: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
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
  browseJobsButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginTop: 20,
  },
  browseJobsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    fontSize: 18,
    color: '#1F2937',
    marginTop: 10,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 5,
  },
});


