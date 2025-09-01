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
} from 'react-native';
import { mockCategories, mockJobs, getActiveJobs, formatPrice, formatDate, Job } from '../data/mockData';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [jobs, setJobs] = useState<Job[]>(getActiveJobs());

  const handleCategorySelect = (categoryName: string) => {
    if (selectedCategory === categoryName) {
      setSelectedCategory('');
      setJobs(getActiveJobs());
    } else {
      setSelectedCategory(categoryName);
      setJobs(getActiveJobs().filter(job => job.category === categoryName));
    }
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    const filteredJobs = getActiveJobs().filter(job =>
      job.title.toLowerCase().includes(text.toLowerCase()) ||
      job.description.toLowerCase().includes(text.toLowerCase())
    );
    setJobs(filteredJobs);
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
        <Text style={styles.jobTitle}>{item.title}</Text>
        <Text style={styles.jobPrice}>{formatPrice(item.price)}</Text>
      </View>
      <Text style={styles.jobCategory}>{item.category}</Text>
      <Text style={styles.jobLocation}>📍 {item.location}</Text>
      <Text style={styles.jobDate}>📅 {formatDate(item.date)} - {item.time}</Text>
      <Text style={styles.jobEmployer}>👤 {item.employerName}</Text>
      <Text style={styles.jobDescription} numberOfLines={2}>
        {item.description}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Merhaba! 👋</Text>
          <Text style={styles.title}>Bugün hangi işi yapacaksın?</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="İş ara... (temizlik, montaj, vb.)"
            value={searchText}
            onChangeText={handleSearch}
          />
        </View>

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
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
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
    marginBottom: 4,
  },
  jobEmployer: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  jobDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
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


