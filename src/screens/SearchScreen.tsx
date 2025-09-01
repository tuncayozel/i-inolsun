import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { JobService, Job } from '../services/jobService';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import { Timestamp } from 'firebase/firestore';

interface FilterState {
  searchText: string;
  selectedCategory: string;
  priceRange: { min: string; max: string };
  selectedLocation: string;
  selectedDate: string;
  sortBy: 'recent' | 'price_high' | 'price_low' | 'distance';
}

export default function SearchScreen({ navigation }: any) {
  const [filterState, setFilterState] = useState<FilterState>({
    searchText: '',
    selectedCategory: '',
    priceRange: { min: '', max: '' },
    selectedLocation: '',
    selectedDate: '',
    sortBy: 'recent',
  });
  
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [jobImages, setJobImages] = useState<{[key: string]: string}>({});

  // Kategoriler
  const categories = [
    { id: '1', name: 'Temizlik', icon: '🧽', color: '#3B82F6' },
    { id: '2', name: 'Taşıma', icon: '📦', color: '#10B981' },
    { id: '3', name: 'Montaj', icon: '🔧', color: '#F59E0B' },
    { id: '4', name: 'Grafik', icon: '🎨', color: '#EF4444' },
    { id: '5', name: 'Yazılım', icon: '💻', color: '#8B5CF6' },
    { id: '6', name: 'Eğitim', icon: '📚', color: '#06B6D4' },
    { id: '7', name: 'Bakım', icon: '⚙️', color: '#84CC16' },
    { id: '8', name: 'Diğer', icon: '📋', color: '#6B7280' },
  ];

  // Konum listesi
  const locations = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Online'];
  
  // Tarih seçenekleri
  const dateOptions = [
    { label: 'Bugün', value: 'today' },
    { label: 'Yarın', value: 'tomorrow' },
    { label: 'Bu Hafta', value: 'this_week' },
    { label: 'Bu Ay', value: 'this_month' },
  ];

  // Firebase'den tüm işleri al
  const fetchAllJobs = async () => {
    try {
      setLoading(true);
      console.log('🔍 Firebase\'den tüm işler alınıyor...');
      
      const jobs = await JobService.getActiveJobs();
      console.log('✅ Firebase\'den alınan işler:', jobs.length);
      
      if (jobs && jobs.length > 0) {
        setAllJobs(jobs);
        setFilteredJobs(jobs);
        
        // İş resimlerini yükle
        await loadJobImages(jobs);
      } else {
        console.log('⚠️ Firebase\'de iş bulunamadı');
        setAllJobs([]);
        setFilteredJobs([]);
      }
    } catch (error: any) {
      console.error('❌ İşleri alma hatası:', error);
      Alert.alert('Hata', 'İşler yüklenirken bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
      setAllJobs([]);
      setFilteredJobs([]);
    } finally {
      setLoading(false);
    }
  };

  // İş resimlerini Storage'dan yükle
  const loadJobImages = async (jobsList: Job[]) => {
    try {
      console.log('🖼️ İş resimleri yükleniyor...');
      const imagePromises = jobsList.map(async (job) => {
        if (job.images && job.images.length > 0) {
          try {
            const imageUrl = await getDownloadURL(ref(storage, job.images[0]));
            return { [job.id!]: imageUrl };
          } catch (error) {
            console.log(`⚠️ Resim yüklenemedi (${job.id}):`, error);
            return {};
          }
        }
        return {};
      });

      const imageResults = await Promise.all(imagePromises);
      const newJobImages = imageResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      setJobImages(newJobImages);
      console.log('🖼️ Resimler yüklendi:', Object.keys(newJobImages).length);
    } catch (error) {
      console.error('❌ Resim yükleme hatası:', error);
    }
  };

  // Component mount olduğunda işleri yükle
  useEffect(() => {
    fetchAllJobs();
  }, []);

  // Filtreleri uygula
  useEffect(() => {
    applyFilters();
  }, [filterState, allJobs]);

  const applyFilters = () => {
    let filtered = [...allJobs];

    // Arama metni filtresi
    if (filterState.searchText.trim()) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(filterState.searchText.toLowerCase()) ||
        job.description.toLowerCase().includes(filterState.searchText.toLowerCase()) ||
        job.employerName.toLowerCase().includes(filterState.searchText.toLowerCase())
      );
    }

    // Kategori filtresi
    if (filterState.selectedCategory) {
      filtered = filtered.filter(job => job.category === filterState.selectedCategory);
    }

    // Fiyat aralığı filtresi
    if (filterState.priceRange.min && !isNaN(Number(filterState.priceRange.min))) {
      filtered = filtered.filter(job => job.price >= Number(filterState.priceRange.min));
    }
    if (filterState.priceRange.max && !isNaN(Number(filterState.priceRange.max))) {
      filtered = filtered.filter(job => job.price <= Number(filterState.priceRange.max));
    }

    // Konum filtresi
    if (filterState.selectedLocation) {
      filtered = filtered.filter(job => 
        job.location.toLowerCase().includes(filterState.selectedLocation.toLowerCase())
      );
    }

    // Tarih filtresi
    if (filterState.selectedDate) {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      filtered = filtered.filter(job => {
        const jobDate = job.createdAt instanceof Date 
          ? job.createdAt 
          : (job.createdAt as Timestamp)?.toDate?.() || new Date();
        
        switch (filterState.selectedDate) {
          case 'today':
            return jobDate.toDateString() === today.toDateString();
          case 'tomorrow':
            return jobDate.toDateString() === tomorrow.toDateString();
          case 'this_week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return jobDate >= weekAgo;
          case 'this_month':
            return jobDate.getMonth() === today.getMonth() && 
                   jobDate.getFullYear() === today.getFullYear();
          default:
            return true;
        }
      });
    }

    // Sıralama
    switch (filterState.sortBy) {
      case 'recent':
        filtered.sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt : (a.createdAt as Timestamp)?.toDate?.() || new Date();
          const dateB = b.createdAt instanceof Date ? b.createdAt : (b.createdAt as Timestamp)?.toDate?.() || new Date();
          return dateB.getTime() - dateA.getTime();
        });
        break;
      case 'price_high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'price_low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'distance':
        // Mesafe sıralaması için basit alfabetik sıralama
        filtered.sort((a, b) => a.location.localeCompare(b.location));
        break;
    }

    setFilteredJobs(filtered);
  };

  const handleInputChange = (field: keyof FilterState, value: string | { min: string; max: string }) => {
    setFilterState(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilterState({
      searchText: '',
      selectedCategory: '',
      priceRange: { min: '', max: '' },
      selectedLocation: '',
      selectedDate: '',
      sortBy: 'recent',
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllJobs();
    setRefreshing(false);
  };

  const renderJob = ({ item }: { item: Job }) => (
                  <TouchableOpacity 
                style={styles.jobCard}
                onPress={() => navigation.navigate('JobDetail', { jobId: item.id, job: item })}
              >
      {/* İş Resmi */}
      {jobImages[item.id!] && (
        <View style={styles.jobImageContainer}>
          <Image 
            source={{ uri: jobImages[item.id!] }} 
            style={styles.jobImage}
            resizeMode="cover"
          />
        </View>
      )}
      
      <View style={styles.jobContent}>
        <View style={styles.jobHeader}>
          <View style={styles.jobTitleContainer}>
            <Text style={styles.jobTitle}>{item.title}</Text>
            <View style={styles.jobStatusBadge}>
              <Text style={styles.jobStatusText}>Aktif</Text>
            </View>
          </View>
          <Text style={styles.jobPrice}>
            {item.price.toLocaleString('tr-TR')} TL
          </Text>
        </View>
        
        <View style={styles.jobCategoryContainer}>
          <Text style={styles.jobCategory}>{item.category}</Text>
        </View>
        
        <View style={styles.jobDetails}>
          <View style={styles.jobDetailItem}>
            <Text style={styles.jobDetailIcon}>📍</Text>
            <Text style={styles.jobDetailText}>{item.location}</Text>
          </View>
          <View style={styles.jobDetailItem}>
            <Text style={styles.jobDetailIcon}>👤</Text>
            <Text style={styles.jobDetailText}>{item.employerName}</Text>
          </View>
          <View style={styles.jobDetailItem}>
            <Text style={styles.jobDetailIcon}>📅</Text>
            <Text style={styles.jobDetailText}>
              {item.createdAt instanceof Date 
                ? item.createdAt.toLocaleDateString('tr-TR')
                : (item.createdAt as Timestamp)?.toDate?.()?.toLocaleDateString('tr-TR') || 'Tarih yok'
              }
            </Text>
          </View>
        </View>
        
        <Text style={styles.jobDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.jobFooter}>
          <View style={styles.jobRating}>
            <Text style={styles.jobRatingIcon}>⭐</Text>
            <Text style={styles.jobRatingText}>4.8</Text>
          </View>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => navigation.navigate('JobDetail', { jobId: item.id, job: item })}
          >
            <Text style={styles.applyButtonText}>Başvur</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>İşler yükleniyor...</Text>
          <Text style={styles.loadingSubtext}>Firebase'den veriler alınıyor</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔍 İş Ara</Text>
        <Text style={styles.subtitle}>İstediğiniz işi bulun</Text>
      </View>

      {/* Arama Çubuğu */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="İş ara... (temizlik, montaj, vb.)"
          value={filterState.searchText}
          onChangeText={(value) => handleInputChange('searchText', value)}
        />
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={styles.filterButtonText}>🔧</Text>
        </TouchableOpacity>
      </View>

      {/* Filtreler */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {/* Kategori Filtresi */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Kategori</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      filterState.selectedCategory === category.name && styles.categoryChipSelected
                    ]}
                    onPress={() => handleInputChange('selectedCategory', 
                      filterState.selectedCategory === category.name ? '' : category.name
                    )}
                  >
                    <Text style={styles.categoryChipIcon}>{category.icon}</Text>
                    <Text style={[
                      styles.categoryChipText,
                      filterState.selectedCategory === category.name && styles.categoryChipTextSelected
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Fiyat Filtresi */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Fiyat Aralığı</Text>
              <View style={styles.priceInputContainer}>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Min"
                  value={filterState.priceRange.min}
                  onChangeText={(value) => handleInputChange('priceRange', { ...filterState.priceRange, min: value })}
                  keyboardType="numeric"
                />
                <Text style={styles.priceSeparator}>-</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Max"
                  value={filterState.priceRange.max}
                  onChangeText={(value) => handleInputChange('priceRange', { ...filterState.priceRange, max: value })}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Konum Filtresi */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Konum</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {locations.map((location) => (
                  <TouchableOpacity
                    key={location}
                    style={[
                      styles.locationChip,
                      filterState.selectedLocation === location && styles.locationChipSelected
                    ]}
                    onPress={() => handleInputChange('selectedLocation', 
                      filterState.selectedLocation === location ? '' : location
                    )}
                  >
                    <Text style={[
                      styles.locationChipText,
                      filterState.selectedLocation === location && styles.locationChipTextSelected
                    ]}>
                      {location}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Tarih Filtresi */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Tarih</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {dateOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.dateChip,
                      filterState.selectedDate === option.value && styles.dateChipSelected
                    ]}
                    onPress={() => handleInputChange('selectedDate', 
                      filterState.selectedDate === option.value ? '' : option.value
                    )}
                  >
                    <Text style={[
                      styles.dateChipText,
                      filterState.selectedDate === option.value && styles.dateChipTextSelected
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Sıralama */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Sıralama</Text>
              <View style={styles.sortContainer}>
                <TouchableOpacity
                  style={[
                    styles.sortButton,
                    filterState.sortBy === 'recent' && styles.sortButtonActive
                  ]}
                  onPress={() => handleInputChange('sortBy', 'recent')}
                >
                  <Text style={[
                    styles.sortButtonText,
                    filterState.sortBy === 'recent' && styles.sortButtonTextActive
                  ]}>Yeni</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortButton,
                    filterState.sortBy === 'price_low' && styles.sortButtonActive
                  ]}
                  onPress={() => handleInputChange('sortBy', 'price_low')}
                >
                  <Text style={[
                    styles.sortButtonText,
                    filterState.sortBy === 'price_low' && styles.sortButtonTextActive
                  ]}>Ucuz</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortButton,
                    filterState.sortBy === 'price_high' && styles.sortButtonActive
                  ]}
                  onPress={() => handleInputChange('sortBy', 'price_high')}
                >
                  <Text style={[
                    styles.sortButtonText,
                    filterState.sortBy === 'price_high' && styles.sortButtonTextActive
                  ]}>Pahalı</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Filtreleri Temizle */}
          <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>Filtreleri Temizle</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Sonuç Sayısı */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredJobs.length} iş bulundu
        </Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Text style={styles.refreshButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* İş Listesi */}
      {filteredJobs.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>🔍</Text>
          <Text style={styles.emptyStateText}>
            {filterState.searchText || filterState.selectedCategory || filterState.selectedLocation
              ? 'Arama kriterlerinize uygun iş bulunamadı'
              : 'Henüz iş ilanı yok'
            }
          </Text>
          <TouchableOpacity 
            style={styles.emptyStateButton}
            onPress={clearFilters}
          >
            <Text style={styles.emptyStateButtonText}>Filtreleri Temizle</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredJobs}
          renderItem={renderJob}
          keyExtractor={(item) => item.id || Math.random().toString()}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.jobsList}
        />
      )}
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
    fontSize: 18,
    color: '#1F2937',
    marginTop: 10,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 5,
  },
  header: {
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  filterButton: {
    padding: 10,
  },
  filterButtonText: {
    fontSize: 24,
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChipIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryChipSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  priceSeparator: {
    fontSize: 18,
    color: '#6B7280',
    marginHorizontal: 12,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locationChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  locationChipSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  locationChipTextSelected: {
    color: '#FFFFFF',
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
     dateChipSelected: {
     backgroundColor: '#2563EB',
     borderColor: '#2563EB',
   },
   dateChipTextSelected: {
     color: '#FFFFFF',
   },
  sortContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  sortButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: '#FFFFFF',
  },
  clearFiltersButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 16,
  },
  clearFiltersText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  refreshButton: {
    padding: 8,
  },
  refreshButtonText: {
    fontSize: 20,
  },
  jobsList: {
    paddingHorizontal: 16,
    paddingBottom: 120, // Alt navigasyon için boşluk
  },
  jobCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  jobImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 16,
  },
  jobImage: {
    width: '100%',
    height: '100%',
  },
  jobContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  jobTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  jobStatusBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  jobStatusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  jobPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  jobCategoryContainer: {
    marginBottom: 8,
  },
  jobCategory: {
    fontSize: 14,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    fontWeight: '500',
  },
  jobDetails: {
    marginBottom: 8,
  },
  jobDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  jobDetailIcon: {
    fontSize: 16,
    marginRight: 8,
    width: 20,
  },
  jobDetailText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  jobDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  jobRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobRatingIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  jobRatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  applyButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyStateButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
