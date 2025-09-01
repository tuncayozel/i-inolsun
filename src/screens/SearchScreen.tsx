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
} from 'react-native';
import { 
  mockCategories, 
  mockJobs, 
  getActiveJobs, 
  formatPrice, 
  formatDate, 
  Job 
} from '../data/mockData';

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
  
  const [filteredJobs, setFilteredJobs] = useState<Job[]>(getActiveJobs());
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Konum listesi
  const locations = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Online'];
  
  // Tarih seçenekleri
  const dateOptions = [
    { label: 'Bugün', value: 'today' },
    { label: 'Yarın', value: 'tomorrow' },
    { label: 'Bu Hafta', value: 'this_week' },
    { label: 'Bu Ay', value: 'this_month' },
  ];

  useEffect(() => {
    applyFilters();
  }, [filterState]);

  const applyFilters = () => {
    let filtered = getActiveJobs();

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
        const jobDate = new Date(job.date);
        switch (filterState.selectedDate) {
          case 'today':
            return jobDate.toDateString() === today.toDateString();
          case 'tomorrow':
            return jobDate.toDateString() === tomorrow.toDateString();
          case 'this_week':
            const weekFromNow = new Date(today);
            weekFromNow.setDate(weekFromNow.getDate() + 7);
            return jobDate >= today && jobDate <= weekFromNow;
          case 'this_month':
            return jobDate.getMonth() === today.getMonth() && 
                   jobDate.getFullYear() === today.getFullYear();
          default:
            return true;
        }
      });
    }

    // Sıralama
    filtered.sort((a, b) => {
      switch (filterState.sortBy) {
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'price_high':
          return b.price - a.price;
        case 'price_low':
          return a.price - b.price;
        case 'distance':
          // Mock distance - gerçek projede gerçek konum hesaplaması yapılacak
          return 0;
        default:
          return 0;
      }
    });

    setFilteredJobs(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      applyFilters();
      setRefreshing(false);
    }, 1000);
  };

  const clearAllFilters = () => {
    setFilterState({
      searchText: '',
      selectedCategory: '',
      priceRange: { min: '', max: '' },
      selectedLocation: '',
      selectedDate: '',
      sortBy: 'recent',
    });
  };

  const handleInputChange = (field: keyof FilterState, value: any) => {
    if (field === 'priceRange') {
      setFilterState(prev => ({
        ...prev,
        priceRange: { ...prev.priceRange, ...value }
      }));
    } else {
      setFilterState(prev => ({ ...prev, [field]: value }));
    }
  };

  const renderJob = ({ item }: { item: Job }) => (
    <TouchableOpacity
      style={styles.jobCard}
      onPress={() => navigation.navigate('JobDetail', { job: item })}
    >
      <View style={styles.jobHeader}>
        <View style={styles.jobTitleContainer}>
          <Text style={styles.jobTitle}>{item.title}</Text>
          <View style={styles.jobStatusBadge}>
            <Text style={styles.jobStatusText}>Aktif</Text>
          </View>
        </View>
        <Text style={styles.jobPrice}>{formatPrice(item.price)}</Text>
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
          <Text style={styles.jobDetailIcon}>📅</Text>
          <Text style={styles.jobDetailText}>{formatDate(item.date)} - {item.time}</Text>
        </View>
        <View style={styles.jobDetailItem}>
          <Text style={styles.jobDetailIcon}>👤</Text>
          <Text style={styles.jobDetailText}>{item.employerName}</Text>
        </View>
      </View>
      
      <Text style={styles.jobDescription} numberOfLines={2}>
        {item.description}
      </Text>
    </TouchableOpacity>
  );

  const renderFilterSection = () => (
    <View style={styles.filtersContainer}>
      {/* Kategori Filtresi */}
      <View style={styles.filterSection}>
        <Text style={styles.filterSectionTitle}>Kategori</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              !filterState.selectedCategory && styles.filterChipActive
            ]}
            onPress={() => handleInputChange('selectedCategory', '')}
          >
            <Text style={[
              styles.filterChipText,
              !filterState.selectedCategory && styles.filterChipTextActive
            ]}>
              Tümü
            </Text>
          </TouchableOpacity>
          {mockCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.filterChip,
                filterState.selectedCategory === category.name && styles.filterChipActive
              ]}
              onPress={() => handleInputChange('selectedCategory', category.name)}
            >
              <Text style={[
                styles.filterChipText,
                filterState.selectedCategory === category.name && styles.filterChipTextActive
              ]}>
                {category.icon} {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Fiyat Aralığı */}
      <View style={styles.filterSection}>
        <Text style={styles.filterSectionTitle}>Fiyat Aralığı (TL)</Text>
        <View style={styles.priceRangeContainer}>
          <TextInput
            style={styles.priceInput}
            placeholder="Min"
            value={filterState.priceRange.min}
            onChangeText={(value) => handleInputChange('priceRange', { min: value })}
            keyboardType="numeric"
          />
          <Text style={styles.priceRangeSeparator}>-</Text>
          <TextInput
            style={styles.priceInput}
            placeholder="Max"
            value={filterState.priceRange.max}
            onChangeText={(value) => handleInputChange('priceRange', { max: value })}
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Konum Filtresi */}
      <View style={styles.filterSection}>
        <Text style={styles.filterSectionTitle}>Konum</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              !filterState.selectedLocation && styles.filterChipActive
            ]}
            onPress={() => handleInputChange('selectedLocation', '')}
          >
            <Text style={[
              styles.filterChipText,
              !filterState.selectedLocation && styles.filterChipTextActive
            ]}>
              Tümü
            </Text>
          </TouchableOpacity>
          {locations.map((location) => (
            <TouchableOpacity
              key={location}
              style={[
                styles.filterChip,
                filterState.selectedLocation === location && styles.filterChipActive
              ]}
              onPress={() => handleInputChange('selectedLocation', location)}
            >
              <Text style={[
                styles.filterChipText,
                filterState.selectedLocation === location && styles.filterChipTextActive
              ]}>
                📍 {location}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tarih Filtresi */}
      <View style={styles.filterSection}>
        <Text style={styles.filterSectionTitle}>Tarih</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              !filterState.selectedDate && styles.filterChipActive
            ]}
            onPress={() => handleInputChange('selectedDate', '')}
          >
            <Text style={[
              styles.filterChipText,
              !filterState.selectedDate && styles.filterChipTextActive
            ]}>
              Tümü
            </Text>
          </TouchableOpacity>
          {dateOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.filterChip,
                filterState.selectedDate === option.value && styles.filterChipActive
              ]}
              onPress={() => handleInputChange('selectedDate', option.value)}
            >
              <Text style={[
                styles.filterChipText,
                filterState.selectedDate === option.value && styles.filterChipTextActive
              ]}>
                📅 {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Sıralama */}
      <View style={styles.filterSection}>
        <Text style={styles.filterSectionTitle}>Sıralama</Text>
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
            ]}>
              En Yeni
            </Text>
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
            ]}>
              Fiyat ↓
            </Text>
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
            ]}>
              Fiyat ↑
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Geri</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Arama & Filtreleme</Text>
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={clearAllFilters}
          >
            <Text style={styles.clearButtonText}>Temizle</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="İş, kategori veya işveren ara..."
              value={filterState.searchText}
              onChangeText={(value) => handleInputChange('searchText', value)}
              placeholderTextColor="#9CA3AF"
            />
            {filterState.searchText.length > 0 && (
              <TouchableOpacity 
                style={styles.clearSearchButton}
                onPress={() => handleInputChange('searchText', '')}
              >
                <Text style={styles.clearSearchButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filters Toggle */}
        <View style={styles.filtersToggleContainer}>
          <TouchableOpacity
            style={styles.filtersToggleButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Text style={styles.filtersToggleIcon}>
              {showFilters ? '🔽' : '🔼'}
            </Text>
            <Text style={styles.filtersToggleText}>
              {showFilters ? 'Filtreleri Gizle' : 'Filtreleri Göster'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filters */}
        {showFilters && renderFilterSection()}

        {/* Results Header */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>
            {filteredJobs.length} iş bulundu
          </Text>
          {Object.values(filterState).some(value => 
            value && (typeof value === 'string' ? value !== '' : 
            typeof value === 'object' ? Object.values(value).some(v => v !== '') : false)
          ) && (
            <Text style={styles.activeFiltersText}>
              Aktif filtreler var
            </Text>
          )}
        </View>

        {/* Jobs List */}
        <View style={styles.jobsList}>
          {filteredJobs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🔍</Text>
              <Text style={styles.emptyStateText}>
                {filterState.searchText ? 'Arama sonucu bulunamadı' : 'Bu kriterlere uygun iş bulunamadı'}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Farklı filtreler deneyin veya arama metnini değiştirin
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={clearAllFilters}
              >
                <Text style={styles.emptyStateButtonText}>Filtreleri Temizle</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredJobs.map((job) => (
              <View key={job.id}>
                {renderJob({ item: job })}
              </View>
            ))
          )}
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    fontSize: 18,
    marginLeft: 16,
    color: '#6B7280',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  clearSearchButton: {
    padding: 8,
    marginRight: 8,
  },
  clearSearchButtonText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: 'bold',
  },
  filtersToggleContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filtersToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  filtersToggleIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  filtersToggleText: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '600',
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
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  priceRangeContainer: {
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
  priceRangeSeparator: {
    fontSize: 18,
    color: '#6B7280',
    marginHorizontal: 12,
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
  resultsHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  activeFiltersText: {
    fontSize: 14,
    color: '#2563EB',
    marginTop: 4,
  },
  jobsList: {
    paddingHorizontal: 16,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
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
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  jobCategoryContainer: {
    marginBottom: 12,
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
    marginBottom: 12,
  },
  jobDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
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
