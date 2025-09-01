import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { mockCategories, mockJobs, getActiveJobs, formatPrice, formatDate, Job, mockNotifications } from '../data/mockData';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [jobs, setJobs] = useState<Job[]>(getActiveJobs());
  const [refreshing, setRefreshing] = useState(false);

  const handleCategorySelect = (categoryName: string) => {
    if (selectedCategory === categoryName) {
      setSelectedCategory('');
      setJobs(getActiveJobs());
    } else {
      setSelectedCategory(categoryName);
      setJobs(getActiveJobs().filter(job => job.category === categoryName));
    }
  };



  const onRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setJobs(getActiveJobs());
      setRefreshing(false);
    }, 1000);
  };

  const renderCategory = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.categoryCard,
        { backgroundColor: item.color },
        selectedCategory === item.name && styles.categoryCardSelected
      ]}
      onPress={() => handleCategorySelect(item.name)}
    >
      <Text style={styles.categoryIcon}>{item.icon}</Text>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

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
      
      <View style={styles.jobFooter}>
        <View style={styles.jobRating}>
          <Text style={styles.jobRatingIcon}>⭐</Text>
          <Text style={styles.jobRatingText}>4.8</Text>
        </View>
        <Text style={styles.jobDistance}>2.5 km uzaklıkta</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.welcomeText}>Merhaba! 👋</Text>
              <Text style={styles.title}>Bugün hangi işi yapacaksın?</Text>
            </View>
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Text style={styles.notificationIcon}>🔔</Text>
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {mockNotifications.filter(n => !n.isRead).length}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <TouchableOpacity 
          style={styles.searchContainer}
          onPress={() => navigation.navigate('Search')}
        >
          <View style={styles.searchInputContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <Text style={styles.searchInput}>
              İş ara... (temizlik, montaj, vb.)
            </Text>
            <Text style={styles.searchArrow}>▶</Text>
          </View>
        </TouchableOpacity>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kategoriler</Text>
          <FlatList
            data={mockCategories}
            renderItem={renderCategory}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        {/* Jobs List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory ? `${selectedCategory} İşleri` : 'Yakındaki İşleri'}
            </Text>
            <Text style={styles.jobCount}>{jobs.length} iş</Text>
          </View>
          
          {jobs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Bu kategoride iş bulunamadı</Text>
              <Text style={styles.emptyStateSubtext}>Farklı bir kategori deneyin</Text>
            </View>
          ) : (
            <View style={styles.jobsList}>
              {jobs.map((job) => (
                <View key={job.id}>
                  {renderJob({ item: job })}
                </View>
              ))}
            </View>
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
    padding: 20,
    paddingTop: 60,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationIcon: {
    fontSize: 24,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  welcomeText: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
    color: '#9CA3AF',
  },
  clearButton: {
    padding: 8,
    marginRight: 8,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  searchArrow: {
    fontSize: 16,
    color: '#6B7280',
    marginRight: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  jobCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
  categoryCard: {
    width: 80,
    height: 80,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryCardSelected: {
    transform: [{ scale: 0.95 }],
    opacity: 0.8,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  jobsList: {
    paddingHorizontal: 20,
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
    marginBottom: 12,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
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
    color: '#6B7280',
    fontWeight: '600',
  },
  jobDistance: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});


