import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockUserProfile } from '../data/mockData';

export default function ProfileEditScreen({ navigation }: any) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        setFormData({
          name: userData.name || mockUserProfile.name,
          email: userData.email || mockUserProfile.email,
          phone: userData.phone || mockUserProfile.phone,
          location: userData.location || mockUserProfile.location,
          bio: userData.bio || mockUserProfile.bio,
        });
      } else {
        // Fallback to mock data
        setFormData({
          name: mockUserProfile.name,
          email: mockUserProfile.email,
          phone: mockUserProfile.phone,
          location: mockUserProfile.location,
          bio: mockUserProfile.bio,
        });
      }
    } catch (error) {
      console.log('Kullanıcı verisi yüklenemedi:', error);
      // Fallback to mock data
      setFormData({
        name: mockUserProfile.name,
        email: mockUserProfile.email,
        phone: mockUserProfile.phone,
        location: mockUserProfile.location,
        bio: mockUserProfile.bio,
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Hata', 'Ad alanı boş olamaz');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Hata', 'E-posta alanı boş olamaz');
      return false;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Hata', 'Telefon alanı boş olamaz');
      return false;
    }
    if (!formData.location.trim()) {
      Alert.alert('Hata', 'Konum alanı boş olamaz');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Get existing user data
      const existingUserDataString = await AsyncStorage.getItem('userData');
      let existingUserData = {};
      
      if (existingUserDataString) {
        existingUserData = JSON.parse(existingUserDataString);
      }

      // Merge with new data
      const updatedUserData = {
        ...existingUserData,
        ...formData,
        updatedAt: new Date().toISOString(),
      };

      // Save to AsyncStorage
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));

      setLoading(false);
      Alert.alert(
        'Başarılı',
        'Profil bilgileriniz güncellendi!',
        [
          { 
            text: 'Tamam', 
            onPress: () => navigation.goBack() 
          }
        ]
      );
    } catch (error) {
      setLoading(false);
      Alert.alert('Hata', 'Profil güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'İptal Et',
      'Değişiklikler kaydedilmeyecek. Emin misiniz?',
      [
        { text: 'Devam Et', style: 'cancel' },
        { text: 'İptal Et', onPress: () => navigation.goBack() }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleCancel}
            >
              <Text style={styles.backButtonText}>← İptal</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profili Düzenle</Text>
            <TouchableOpacity 
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={[styles.saveButtonText, loading && styles.saveButtonTextDisabled]}>
                {loading ? 'Kaydediliyor...' : 'Kaydet'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ad Soyad</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholder="Adınızı ve soyadınızı girin"
                maxLength={50}
              />
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-posta</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                placeholder="E-posta adresinizi girin"
                keyboardType="email-address"
                autoCapitalize="none"
                maxLength={100}
              />
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Telefon</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                placeholder="Telefon numaranızı girin"
                keyboardType="phone-pad"
                maxLength={15}
              />
            </View>

            {/* Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Konum</Text>
              <TextInput
                style={styles.input}
                value={formData.location}
                onChangeText={(value) => handleInputChange('location', value)}
                placeholder="Şehir veya ilçe"
                maxLength={50}
              />
            </View>

            {/* Bio */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hakkımda</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.bio}
                onChangeText={(value) => handleInputChange('bio', value)}
                placeholder="Kendiniz hakkında kısa bir açıklama yazın..."
                multiline
                numberOfLines={4}
                maxLength={200}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>
                {formData.bio.length}/200
              </Text>
            </View>

            {/* Skills Section */}
            <View style={styles.skillsSection}>
              <Text style={styles.sectionTitle}>Yetenekler</Text>
              <Text style={styles.skillsInfo}>
                Yeteneklerinizi güncellemek için profil sayfasına gidin
              </Text>
            </View>
          </View>
        </ScrollView>
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
    paddingBottom: 120,
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
    color: '#6B7280',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  saveButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: '#9CA3AF',
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  skillsSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  skillsInfo: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});
