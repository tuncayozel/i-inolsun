import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { auth } from '../config/firebase';
import { onAuthStateChanged, User, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  location: string;
  memberSince: Date;
  rating: number;
  completedJobs: number;
  totalEarnings: number;
  activeJobs: number;
  skills: Array<{
    name: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    experience: string;
    description: string;
    certificates: string[];
  }>;
  phone: string;
  profileImage: string | null;
  monthlyEarnings: number[];
  categoryStats: Array<{
    category: string;
    count: number;
    earnings: number;
  }>;
  badges: Array<{
    name: string;
    icon: string;
    earned: boolean;
  }>;
  portfolio: Array<{
    id: number;
    title: string;
    description: string;
    category: string;
    completedDate: Date;
    earnings: number;
    photos: string[];
    rating: number;
    customerComment: string;
    customerName: string;
  }>;
}

export default function ProfileScreen({ navigation }: any) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    location: '',
    phone: '',
    skills: ''
  });

  // Auth state'i dinle
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        fetchUserProfile(user.uid);
      } else {
        setLoading(false);
        Alert.alert('Hata', 'Profil bilgilerini görüntülemek için giriş yapmanız gerekiyor!');
        navigation.navigate('Login');
      }
    });

    return () => unsubscribe();
  }, [navigation]);

  // Kullanıcı profili değiştiğinde yeniden yükle
  useFocusEffect(
    React.useCallback(() => {
      if (currentUser) {
        fetchUserProfile(currentUser.uid);
      }
    }, [currentUser])
  );

  // Firebase'den kullanıcı profilini al
  const fetchUserProfile = async (userId: string) => {
    try {
      setLoading(true);
      console.log('👤 Firebase\'den kullanıcı profili alınıyor...');
      
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        const profile: UserProfile = {
          id: userDoc.id,
          name: data.name || currentUser?.email?.split('@')[0] || 'Kullanıcı',
          email: data.email || currentUser?.email || '',
          location: data.location || 'Konum belirtilmemiş',
          memberSince: data.memberSince?.toDate() || new Date(),
          rating: data.rating || 0,
          completedJobs: data.completedJobs || 0,
          totalEarnings: data.totalEarnings || 0,
          activeJobs: data.activeJobs || 0,
          skills: data.skills || [],
          phone: data.phone || 'Telefon belirtilmemiş',
          profileImage: data.profileImage || null,
          monthlyEarnings: data.monthlyEarnings || [0, 0, 0, 0, 0, 0],
          categoryStats: data.categoryStats || [],
          badges: data.badges || [],
          portfolio: data.portfolio || []
        };
        
        setUserProfile(profile);
        console.log('✅ Kullanıcı profili alındı:', profile);
      } else {
        // Yeni profil oluştur
        await createDefaultProfile(userId);
      }
    } catch (error: any) {
      console.error('❌ Kullanıcı profili alma hatası:', error);
      Alert.alert('Hata', 'Profil bilgileri alınamadı: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  // Varsayılan profil oluştur
  const createDefaultProfile = async (userId: string) => {
    try {
      console.log('🆕 Varsayılan profil oluşturuluyor...');
      
      const defaultProfile: UserProfile = {
        id: userId,
        name: currentUser?.email?.split('@')[0] || 'Kullanıcı',
        email: currentUser?.email || '',
        location: 'Konum belirtilmemiş',
        memberSince: new Date(),
        rating: 0,
        completedJobs: 0,
        totalEarnings: 0,
        activeJobs: 0,
        skills: [],
        phone: 'Telefon belirtilmemiş',
        profileImage: null,
        monthlyEarnings: [0, 0, 0, 0, 0, 0],
        categoryStats: [],
        badges: [
          { name: 'İlk İş', icon: '🎯', earned: false },
          { name: '1000 TL', icon: '💰', earned: false },
          { name: '5 Yıldız', icon: '⭐', earned: false },
          { name: 'Hızlı İşçi', icon: '⚡', earned: false }
        ],
        portfolio: []
      };

      await setDoc(doc(db, 'users', userId), defaultProfile);
      setUserProfile(defaultProfile);
      console.log('✅ Varsayılan profil oluşturuldu');
    } catch (error: any) {
      console.error('❌ Varsayılan profil oluşturma hatası:', error);
      Alert.alert('Hata', 'Profil oluşturulamadı: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  // Profil fotoğrafı seç
  const pickImage = async () => {
    if (!currentUser) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfileImage(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('❌ Resim seçme hatası:', error);
      Alert.alert('Hata', 'Resim seçilemedi: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  // Profil fotoğrafını Storage'a yükle
  const uploadProfileImage = async (imageUri: string) => {
    if (!currentUser) return;

    try {
      setSaving(true);
      console.log('📸 Profil fotoğrafı yükleniyor...');
      
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      const imageRef = ref(storage, `profiles/${currentUser.uid}/profile.jpg`);
      await uploadBytes(imageRef, blob);
      
      const downloadURL = await getDownloadURL(imageRef);
      
      // Firestore'da profil güncelle
      await updateDoc(doc(db, 'users', currentUser.uid), {
        profileImage: downloadURL
      });
      
      // Auth profilini güncelle
      await updateProfile(currentUser, {
        photoURL: downloadURL
      });
      
      // Local state'i güncelle
      setUserProfile(prev => prev ? { ...prev, profileImage: downloadURL } : null);
      
      console.log('✅ Profil fotoğrafı yüklendi');
      Alert.alert('Başarılı', 'Profil fotoğrafı güncellendi!');
    } catch (error: any) {
      console.error('❌ Profil fotoğrafı yükleme hatası:', error);
      Alert.alert('Hata', 'Profil fotoğrafı yüklenemedi: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setSaving(false);
    }
  };

  // Profil bilgilerini güncelle
  const updateProfileInfo = async () => {
    if (!currentUser || !userProfile) return;

    try {
      setSaving(true);
      console.log('📝 Profil bilgileri güncelleniyor...');
      
             const skillsArray = editData.skills.split(',').map(skill => skill.trim()).filter(Boolean).map(skillName => ({
         name: skillName,
         level: 'beginner' as const,
         experience: '1 yıl',
         description: `${skillName} hizmeti`,
         certificates: []
       }));
       
       const updates = {
         name: editData.name,
         location: editData.location,
         phone: editData.phone,
         skills: skillsArray
       };

      await updateDoc(doc(db, 'users', currentUser.uid), updates);
      
      // Local state'i güncelle
      setUserProfile(prev => prev ? { ...prev, ...updates } : null);
      
      console.log('✅ Profil bilgileri güncellendi');
      Alert.alert('Başarılı', 'Profil bilgileri güncellendi!');
      setEditModalVisible(false);
    } catch (error: any) {
      console.error('❌ Profil güncelleme hatası:', error);
      Alert.alert('Hata', 'Profil güncellenemedi: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setSaving(false);
    }
  };

  // Çıkış yap
  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigation.navigate('Login');
    } catch (error: any) {
      console.error('❌ Çıkış hatası:', error);
      Alert.alert('Hata', 'Çıkış yapılamadı: ' + (error.message || 'Bilinmeyen hata'));
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

  if (loading || !userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Profil yükleniyor...</Text>
          <Text style={styles.loadingSubtext}>Firebase'den veriler alınıyor</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>👤 Profil</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Çıkış</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <TouchableOpacity style={styles.profileImageContainer} onPress={pickImage}>
            {userProfile.profileImage ? (
              <Image source={{ uri: userProfile.profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileImageText}>{userProfile.name[0]}</Text>
              </View>
            )}
            {saving && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
          
          <Text style={styles.profileName}>{userProfile.name}</Text>
          <Text style={styles.profileEmail}>{userProfile.email}</Text>
          
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={() => {
              setEditData({
                name: userProfile.name,
                location: userProfile.location,
                phone: userProfile.phone,
                skills: userProfile.skills.map(s => s.name).join(', ')
              });
              setEditModalVisible(true);
            }}
          >
            <Text style={styles.editProfileButtonText}>Profili Düzenle</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{userProfile.rating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Puan</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{userProfile.completedJobs}</Text>
            <Text style={styles.statLabel}>Tamamlanan İş</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{userProfile.activeJobs}</Text>
            <Text style={styles.statLabel}>Aktif İş</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{userProfile.totalEarnings.toLocaleString('tr-TR')} TL</Text>
            <Text style={styles.statLabel}>Toplam Kazanç</Text>
          </View>
        </View>

        {/* Bronze Level */}
        <View style={styles.bronzeSection}>
          <Text style={styles.bronzeTitle}>🥉 Bronz Seviye</Text>
          <Text style={styles.bronzeDescription}>
            Henüz yeni başladınız! Daha fazla iş yaparak seviye atlayın.
          </Text>
        </View>

        {/* Skills */}
        {userProfile.skills.length > 0 && (
          <View style={styles.skillsSection}>
            <Text style={styles.sectionTitle}>🛠️ Yetenekler</Text>
            {userProfile.skills.map((skill, index) => (
              <View key={index} style={styles.skillCard}>
                <Text style={styles.skillName}>{skill.name}</Text>
                <Text style={styles.skillLevel}>{skill.level}</Text>
                <Text style={styles.skillExperience}>{skill.experience}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Portfolio */}
        {userProfile.portfolio.length > 0 && (
          <View style={styles.portfolioSection}>
            <Text style={styles.sectionTitle}>📁 Portföy</Text>
            {userProfile.portfolio.map((item) => (
              <View key={item.id} style={styles.portfolioCard}>
                <Text style={styles.portfolioTitle}>{item.title}</Text>
                <Text style={styles.portfolioDescription}>{item.description}</Text>
                <Text style={styles.portfolioEarnings}>{item.earnings} TL</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Profili Düzenle</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Ad Soyad"
              value={editData.name}
              onChangeText={(text) => setEditData(prev => ({ ...prev, name: text }))}
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="Konum"
              value={editData.location}
              onChangeText={(text) => setEditData(prev => ({ ...prev, location: text }))}
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="Telefon"
              value={editData.phone}
              onChangeText={(text) => setEditData(prev => ({ ...prev, phone: text }))}
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="Yetenekler (virgülle ayırın)"
              value={editData.skills}
              onChangeText={(text) => setEditData(prev => ({ ...prev, skills: text }))}
              multiline
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>İptal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalSaveButton, saving && styles.modalSaveButtonDisabled]}
                onPress={updateProfileInfo}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveButtonText}>Kaydet</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    paddingBottom: 120, // Alt navigasyon için boşluk
  },
  header: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  logoutButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  profileImageText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
    flexWrap: 'nowrap',
  },
  profileEmail: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
    flexWrap: 'nowrap',
  },
  editProfileButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editProfileButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minHeight: 80,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 14,
    flexWrap: 'wrap',
  },
  bronzeSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  bronzeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  bronzeDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  skillsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  skillCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  skillName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  skillLevel: {
    fontSize: 14,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  skillExperience: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  portfolioSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  portfolioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  portfolioTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  portfolioDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 16,
  },
  portfolioEarnings: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 300,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'center',
    alignSelf: 'stretch',
    marginBottom: 16,
  },
  modalCancelButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  modalCancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSaveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalSaveButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});


