import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
} from 'react-native';
import { mockCategories } from '../data/mockData';

export default function PostJobScreen({ navigation }: any) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    price: '',
    date: '',
    time: '',
    photos: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [searchCategory, setSearchCategory] = useState('');

  const addPhoto = () => {
    // Mock fotoğraf ekleme - gerçek projede kamera/galeri entegrasyonu olacak
    const mockPhoto = `https://picsum.photos/300/200?random=${Date.now()}`;
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, mockPhoto]
    }));
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;
    
    // Saat formatı: 1112 -> 11:12
    if (field === 'time') {
      const cleanValue = value.replace(/[^0-9]/g, '');
      if (cleanValue.length <= 2) {
        formattedValue = cleanValue;
      } else if (cleanValue.length <= 4) {
        formattedValue = cleanValue.slice(0, 2) + ':' + cleanValue.slice(2);
      } else {
        formattedValue = cleanValue.slice(0, 2) + ':' + cleanValue.slice(2, 4);
      }
    }
    
    // Tarih formatı: 11122025 -> 11/12/2025
    if (field === 'date') {
      const cleanValue = value.replace(/[^0-9]/g, '');
      if (cleanValue.length <= 2) {
        formattedValue = cleanValue;
      } else if (cleanValue.length <= 4) {
        formattedValue = cleanValue.slice(0, 2) + '/' + cleanValue.slice(2);
      } else if (cleanValue.length <= 6) {
        formattedValue = cleanValue.slice(0, 2) + '/' + cleanValue.slice(2, 4) + '/' + cleanValue.slice(4);
      } else {
        formattedValue = cleanValue.slice(0, 2) + '/' + cleanValue.slice(2, 4) + '/' + cleanValue.slice(4, 8);
      }
    }
    
    // Fiyat formatı: 1000 -> 1.000
    if (field === 'price') {
      const cleanValue = value.replace(/[^0-9]/g, '');
      if (cleanValue === '') {
        formattedValue = '';
      } else {
        const number = parseInt(cleanValue);
        formattedValue = number.toLocaleString('tr-TR');
      }
    }
    
    setFormData(prev => ({ ...prev, [field]: formattedValue }));
  };

  const handleCategorySelect = (categoryName: string) => {
    setFormData(prev => ({ ...prev, category: categoryName }));
  };

  const selectCategory = (category: string) => {
    setFormData(prev => ({ ...prev, category }));
    setShowCategoryModal(false);
    setSearchCategory('');
  };

  const filteredCategories = mockCategories.filter(cat =>
    cat.name.toLowerCase().includes(searchCategory.toLowerCase())
  );

  const handleSubmit = () => {
    const { title, description, category, location, price, date, time } = formData;
    
    if (!title || !description || !category || !location || !price || !date || !time) {
      Alert.alert('Hata', 'Tüm alanları doldurun');
      return;
    }

    // Fiyat validasyonu - nokta ve virgülleri temizle
    const cleanPrice = price.replace(/[.,]/g, '');
    if (isNaN(Number(cleanPrice))) {
      Alert.alert('Hata', 'Fiyat sayısal olmalı');
      return;
    }

    setLoading(true);
    // Mock post job - gerçek projede API'ye gönderilecek
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Başarılı', 'İlanınız yayınlandı!', [
        { text: 'Tamam', onPress: () => navigation.navigate('Home') }
      ]);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>İş İlanı Oluştur</Text>
            <Text style={styles.subtitle}>Hizmetinizi paylaşın ve işçi bulun</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>İş Başlığı</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: Ev temizliği, logo tasarımı..."
                value={formData.title}
                onChangeText={(value) => handleInputChange('title', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Kategori</Text>
              <TouchableOpacity
                style={[styles.input, styles.categoryInput]}
                onPress={() => setShowCategoryModal(true)}
              >
                <Text style={formData.category ? styles.categoryText : styles.placeholderText}>
                  {formData.category || 'Kategori seçin'}
                </Text>
                <Text style={styles.categoryArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Açıklama</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="İş detaylarını açıklayın..."
                value={formData.description}
                onChangeText={(value) => handleInputChange('description', value)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Fotoğraflar (Opsiyonel)</Text>
              <View style={styles.photosContainer}>
                {formData.photos.map((photo, index) => (
                  <View key={index} style={styles.photoItem}>
                    <Image source={{ uri: photo }} style={styles.photo} />
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => removePhoto(index)}
                    >
                      <Text style={styles.removePhotoText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {formData.photos.length < 5 && (
                  <TouchableOpacity style={styles.addPhotoButton} onPress={addPhoto}>
                    <Text style={styles.addPhotoText}>📷</Text>
                    <Text style={styles.addPhotoLabel}>Fotoğraf Ekle</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.photoHint}>
                Maksimum 5 fotoğraf ekleyebilirsiniz
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Konum</Text>
              <TextInput
                style={styles.input}
                placeholder="İlçe, Şehir"
                value={formData.location}
                onChangeText={(value) => handleInputChange('location', value)}
              />
            </View>

                         <View style={styles.row}>
               <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                 <Text style={styles.label}>Tarih</Text>
                                   <TextInput
                    style={styles.input}
                    placeholder="12/1/2025"
                    value={formData.date}
                    onChangeText={(value) => handleInputChange('date', value)}
                    keyboardType="numeric"
                  />
                 <Text style={styles.inputHint}>Örnek: 12/1/2025</Text>
               </View>

               <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                 <Text style={styles.label}>Saat</Text>
                                   <TextInput
                    style={styles.input}
                    placeholder="11:25"
                    value={formData.time}
                    onChangeText={(value) => handleInputChange('time', value)}
                    keyboardType="numeric"
                  />
                 <Text style={styles.inputHint}>Örnek: 11:25</Text>
               </View>
             </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Fiyat (TL)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                value={formData.price}
                onChangeText={(value) => handleInputChange('price', value)}
                keyboardType="numeric"
              />
              <Text style={styles.inputHint}>Örnek: 1.000, 2.500, 10.000</Text>
            </View>

            <TouchableOpacity 
              style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'İlan Oluşturuluyor...' : 'İlanı Yayınla'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Category Selection Modal */}
        <Modal
          visible={showCategoryModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Kategori Seçin</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowCategoryModal(false)}
                >
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={styles.searchInput}
                placeholder="Kategori ara..."
                value={searchCategory}
                onChangeText={setSearchCategory}
              />
              
              <ScrollView style={styles.categoriesList}>
                {filteredCategories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={styles.categoryItem}
                    onPress={() => selectCategory(category.name)}
                  >
                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  form: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
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
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  categoriesContainer: {
    maxHeight: 60,
  },
  categoryOption: {
    width: 70,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryOptionSelected: {
    transform: [{ scale: 0.95 }],
    opacity: 0.8,
  },
  categoryOptionIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  categoryOptionText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  submitButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#2563EB',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  inputHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    fontStyle: 'italic',
  },
  // Category Input Styles
  categoryInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryText: {
    color: '#1F2937',
    fontSize: 16,
  },
  placeholderText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  categoryArrow: {
    color: '#6B7280',
    fontSize: 16,
  },
  // Photo Styles
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  photoItem: {
    position: 'relative',
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhotoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  addPhotoText: {
    fontSize: 24,
    marginBottom: 4,
  },
  addPhotoLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  photoHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    fontStyle: 'italic',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 20,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  categoriesList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  categoryName: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
});


