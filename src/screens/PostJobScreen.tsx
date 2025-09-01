import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { JobService, Job } from '../services/jobService';
import { auth } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';

export default function PostJobScreen({ navigation }: any) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    price: '',
    priceType: 'fixed' as 'fixed' | 'hourly',
    requirements: '',
    photos: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [searchCategory, setSearchCategory] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [uploading, setUploading] = useState(false);

  // Kategoriler
  const categories = [
    { id: '1', name: 'Temizlik', icon: '🧽' },
    { id: '2', name: 'Taşıma', icon: '📦' },
    { id: '3', name: 'Montaj', icon: '🔧' },
    { id: '4', name: 'Grafik', icon: '🎨' },
    { id: '5', name: 'Yazılım', icon: '💻' },
    { id: '6', name: 'Eğitim', icon: '📚' },
    { id: '7', name: 'Bakım', icon: '⚙️' },
    { id: '8', name: 'Diğer', icon: '📋' },
  ];

  // Auth state'i dinle
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        Alert.alert('Hata', 'İş eklemek için giriş yapmanız gerekiyor!');
        navigation.navigate('Login');
      }
    });

    return () => unsubscribe();
  }, [navigation]);

  // Kamera/galeri izinlerini kontrol et
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Fotoğraf seçmek için galeri izni gerekiyor!');
      return false;
    }
    return true;
  };

  // Fotoğraf seç
  const pickImage = async () => {
    if (!(await requestPermissions())) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setFormData(prev => ({
          ...prev,
          photos: [...prev.photos, imageUri]
        }));
      }
    } catch (error) {
      console.error('Fotoğraf seçme hatası:', error);
      Alert.alert('Hata', 'Fotoğraf seçilirken bir hata oluştu!');
    }
  };

  // Kamera ile fotoğraf çek
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Fotoğraf çekmek için kamera izni gerekiyor!');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setFormData(prev => ({
          ...prev,
          photos: [...prev.photos, imageUri]
        }));
      }
    } catch (error) {
      console.error('Fotoğraf çekme hatası:', error);
      Alert.alert('Hata', 'Fotoğraf çekilirken bir hata oluştu!');
    }
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;
    
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

  // Fotoğrafları Firebase Storage'a yükle
  const uploadPhotos = async (): Promise<string[]> => {
    if (formData.photos.length === 0) return [];

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < formData.photos.length; i++) {
        const photoUri = formData.photos[i];
        
        // Local URI'yi blob'a çevir
        const response = await fetch(photoUri);
        const blob = await response.blob();
        
        // Storage referansı oluştur
        const photoRef = ref(storage, `jobs/${currentUser?.uid}/${Date.now()}_${i}.jpg`);
        
        // Upload
        await uploadBytes(photoRef, blob);
        
        // Download URL al
        const downloadURL = await getDownloadURL(photoRef);
        uploadedUrls.push(downloadURL);
        
        console.log(`📸 Fotoğraf ${i + 1} yüklendi:`, downloadURL);
      }
    } catch (error) {
      console.error('❌ Fotoğraf yükleme hatası:', error);
      throw new Error('Fotoğraflar yüklenirken bir hata oluştu!');
    } finally {
      setUploading(false);
    }

    return uploadedUrls;
  };

  // Form validasyonu
  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      Alert.alert('Hata', 'İş başlığı gereklidir!');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Hata', 'İş açıklaması gereklidir!');
      return false;
    }
    if (!formData.category) {
      Alert.alert('Hata', 'Kategori seçimi gereklidir!');
      return false;
    }
    if (!formData.location.trim()) {
      Alert.alert('Hata', 'Konum bilgisi gereklidir!');
      return false;
    }
    if (!formData.price.trim()) {
      Alert.alert('Hata', 'Fiyat bilgisi gereklidir!');
      return false;
    }
    if (!currentUser) {
      Alert.alert('Hata', 'Giriş yapmanız gerekiyor!');
      return false;
    }
    return true;
  };

  // İşi Firebase'e kaydet
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      console.log('🚀 İş kaydediliyor...');
      
      // Fotoğrafları yükle
      const photoUrls = await uploadPhotos();
      console.log('📸 Fotoğraflar yüklendi:', photoUrls.length);
      
      // İş verilerini hazırla
      const jobData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        location: formData.location.trim(),
        price: parseInt(formData.price.replace(/[^0-9]/g, '')),
        priceType: formData.priceType,
                 ownerId: currentUser!.uid,
         employerName: currentUser!.email?.split('@')[0] || 'Bilinmeyen',
        status: 'active' as const,
        createdAt: Timestamp.now(),
        images: photoUrls,
        requirements: formData.requirements.trim() ? [formData.requirements.trim()] : [],

      };

      console.log('📝 İş verileri hazırlandı:', jobData);
      
      // Firebase'e kaydet
      const jobId = await JobService.createJob(jobData);
      console.log('✅ İş başarıyla kaydedildi, ID:', jobId);
      
      // Başarı mesajı
      Alert.alert(
        'Başarılı! 🎉',
        'İş ilanınız başarıyla yayınlandı!',
        [
          {
            text: 'Tamam',
            onPress: () => {
              // Formu temizle
              setFormData({
                title: '',
                description: '',
                category: '',
                location: '',
                price: '',
                priceType: 'fixed',
                requirements: '',
                photos: [],
              });
              // Ana sayfaya dön
              navigation.navigate('Home');
            }
          }
        ]
      );
      
    } catch (error: any) {
      console.error('❌ İş kaydetme hatası:', error);
      Alert.alert(
        'Hata! ❌',
        'İş kaydedilirken bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'),
        [{ text: 'Tamam' }]
      );
    } finally {
      setLoading(false);
    }
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
                  <View style={styles.photoButtonsContainer}>
                    <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
                      <Text style={styles.addPhotoText}>📷</Text>
                      <Text style={styles.addPhotoLabel}>Galeri'den Seç</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.addPhotoButton} onPress={takePhoto}>
                      <Text style={styles.addPhotoText}>📱</Text>
                      <Text style={styles.addPhotoLabel}>Kamera ile Çek</Text>
                    </TouchableOpacity>
                  </View>
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

                                      <View style={styles.inputGroup}>
               <Text style={styles.label}>Fiyat Türü</Text>
               <View style={styles.priceTypeContainer}>
                 <TouchableOpacity
                   style={[
                     styles.priceTypeButton,
                     formData.priceType === 'fixed' && styles.priceTypeButtonActive
                   ]}
                   onPress={() => setFormData(prev => ({ ...prev, priceType: 'fixed' }))}
                 >
                   <Text style={[
                     styles.priceTypeButtonText,
                     formData.priceType === 'fixed' && styles.priceTypeButtonTextActive
                   ]}>Sabit</Text>
                 </TouchableOpacity>
                 <TouchableOpacity
                   style={[
                     styles.priceTypeButton,
                     formData.priceType === 'hourly' && styles.priceTypeButtonActive
                   ]}
                   onPress={() => setFormData(prev => ({ ...prev, priceType: 'hourly' }))}
                 >
                   <Text style={[
                     styles.priceTypeButtonText,
                     formData.priceType === 'hourly' && styles.priceTypeButtonTextActive
                   ]}>Saatlik</Text>
                 </TouchableOpacity>
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
                {categories.map((category) => (
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
     noCategoriesText: {
     textAlign: 'center',
     paddingVertical: 20,
     color: '#6B7280',
   },
   priceTypeContainer: {
     flexDirection: 'row',
     gap: 10,
   },
   priceTypeButton: {
     flex: 1,
     paddingVertical: 12,
     paddingHorizontal: 16,
     borderRadius: 8,
     borderWidth: 1,
     borderColor: '#E5E7EB',
     backgroundColor: '#FFFFFF',
     alignItems: 'center',
   },
   priceTypeButtonActive: {
     backgroundColor: '#2563EB',
     borderColor: '#2563EB',
   },
   priceTypeButtonText: {
     fontSize: 14,
     fontWeight: '500',
     color: '#6B7280',
   },
   priceTypeButtonTextActive: {
     color: '#FFFFFF',
   },
   photoButtonsContainer: {
     flexDirection: 'row',
     gap: 10,
     marginTop: 10,
   },
});


