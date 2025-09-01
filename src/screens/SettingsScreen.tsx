import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import { onAuthStateChanged, User, signOut, deleteUser, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Timestamp } from 'firebase/firestore';

interface UserSettings {
  userId: string;
  notifications: {
    pushNotifications: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    jobAlerts: boolean;
    messageNotifications: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'employers' | 'categories' | 'private';
    showContactInfo: boolean;
    showLocation: boolean;
    showEarnings: boolean;
    showPortfolio: boolean;
    visibleCategories: string[];
  };
  preferences: {
    language: 'tr' | 'en';
    theme: 'light' | 'dark' | 'auto';
    currency: 'TRY' | 'USD' | 'EUR';
    timezone: string;
  };
  lastUpdated: Date | Timestamp;
}

export default function SettingsScreen({ navigation }: any) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Auth state'i dinle
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        loadUserSettings(user.uid);
      } else {
        setLoading(false);
        Alert.alert('Hata', 'Ayarlarınızı görüntülemek için giriş yapmanız gerekiyor!');
        navigation.navigate('Login');
      }
    });

    return () => unsubscribe();
  }, [navigation]);

  // Kullanıcı ayarlarını yükle
  const loadUserSettings = async (userId: string) => {
    try {
      console.log('⚙️ Firebase\'den kullanıcı ayarları yükleniyor...');
      
      const settingsDoc = await getDoc(doc(db, 'userSettings', userId));
      
      if (settingsDoc.exists()) {
        const data = settingsDoc.data() as any;
        setUserSettings(data);
        console.log('✅ Kullanıcı ayarları yüklendi');
      } else {
        // Varsayılan ayarları oluştur
        await createDefaultSettings(userId);
      }
    } catch (error: any) {
      console.error('❌ Kullanıcı ayarları yükleme hatası:', error);
      // Varsayılan ayarları oluştur
      await createDefaultSettings(userId);
    } finally {
      setLoading(false);
    }
  };

  // Varsayılan ayarları oluştur
  const createDefaultSettings = async (userId: string) => {
    try {
      const defaultSettings: UserSettings = {
        userId,
        notifications: {
          pushNotifications: true,
          emailNotifications: false,
          smsNotifications: false,
          jobAlerts: true,
          messageNotifications: true,
        },
        privacy: {
          profileVisibility: 'public',
          showContactInfo: true,
          showLocation: true,
          showEarnings: true,
          showPortfolio: true,
          visibleCategories: ['Ev Temizliği', 'Bahçe Bakımı', 'Temizlik', 'Nakliye', 'Teknik Servis']
        },
        preferences: {
          language: 'tr',
          theme: 'light',
          currency: 'TRY',
          timezone: 'Europe/Istanbul'
        },
        lastUpdated: Timestamp.now()
      };
      
      await setDoc(doc(db, 'userSettings', userId), defaultSettings);
      setUserSettings(defaultSettings);
      console.log('✅ Varsayılan ayarlar oluşturuldu');
    } catch (error: any) {
      console.error('❌ Varsayılan ayarlar oluşturma hatası:', error);
    }
  };

  // Bildirim ayarlarını güncelle
  const handleNotificationChange = async (key: string, value: boolean) => {
    if (!currentUser || !userSettings) return;
    
    try {
      const updatedSettings = {
        ...userSettings,
        notifications: {
          ...userSettings.notifications,
          [key]: value
        },
        lastUpdated: Timestamp.now()
      };
      
      await updateDoc(doc(db, 'userSettings', currentUser.uid), {
        notifications: updatedSettings.notifications,
        lastUpdated: updatedSettings.lastUpdated
      });
      
      setUserSettings(updatedSettings);
      console.log('✅ Bildirim ayarları güncellendi:', key, value);
    } catch (error: any) {
      console.error('❌ Bildirim ayarları güncelleme hatası:', error);
      Alert.alert('Hata', 'Ayarlar güncellenemedi: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  // Gizlilik ayarlarını güncelle
  const handlePrivacyChange = async (key: string, value: any) => {
    if (!currentUser || !userSettings) return;
    
    try {
      const updatedSettings = {
        ...userSettings,
        privacy: {
          ...userSettings.privacy,
          [key]: value
        },
        lastUpdated: Timestamp.now()
      };
      
      await updateDoc(doc(db, 'userSettings', currentUser.uid), {
        privacy: updatedSettings.privacy,
        lastUpdated: updatedSettings.lastUpdated
      });
      
      setUserSettings(updatedSettings);
      console.log('✅ Gizlilik ayarları güncellendi:', key, value);
    } catch (error: any) {
      console.error('❌ Gizlilik ayarları güncelleme hatası:', error);
      Alert.alert('Hata', 'Ayarlar güncellenemedi: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  // Görünürlük ayarlarını güncelle
  const handleVisibilityChange = async (setting: string, value: any) => {
    if (!currentUser || !userSettings) return;
    
    try {
      const updatedSettings = {
        ...userSettings,
        privacy: {
          ...userSettings.privacy,
          [setting]: value
        },
        lastUpdated: Timestamp.now()
      };
      
      await updateDoc(doc(db, 'userSettings', currentUser.uid), {
        privacy: updatedSettings.privacy,
        lastUpdated: updatedSettings.lastUpdated
      });
      
      setUserSettings(updatedSettings);
      console.log('✅ Görünürlük ayarları güncellendi:', setting, value);
    } catch (error: any) {
      console.error('❌ Görünürlük ayarları güncelleme hatası:', error);
      Alert.alert('Hata', 'Ayarlar güncellenemedi: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  // Kategori görünürlüğünü değiştir
  const toggleCategoryVisibility = async (category: string) => {
    if (!currentUser || !userSettings) return;
    
    try {
      const updatedCategories = userSettings.privacy.visibleCategories.includes(category)
        ? userSettings.privacy.visibleCategories.filter(c => c !== category)
        : [...userSettings.privacy.visibleCategories, category];
      
      const updatedSettings = {
        ...userSettings,
        privacy: {
          ...userSettings.privacy,
          visibleCategories: updatedCategories
        },
        lastUpdated: Timestamp.now()
      };
      
      await updateDoc(doc(db, 'userSettings', currentUser.uid), {
        privacy: updatedSettings.privacy,
        lastUpdated: updatedSettings.lastUpdated
      });
      
      setUserSettings(updatedSettings);
      console.log('✅ Kategori görünürlüğü güncellendi:', category);
    } catch (error: any) {
      console.error('❌ Kategori görünürlüğü güncelleme hatası:', error);
      Alert.alert('Hata', 'Ayarlar güncellenemedi: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  // Görünürlük ayarlarını kaydet
  const saveVisibilitySettings = async () => {
    if (!currentUser || !userSettings) return;
    
    try {
      setSaving(true);
      console.log('💾 Görünürlük ayarları kaydediliyor...');
      
      await updateDoc(doc(db, 'userSettings', currentUser.uid), {
        privacy: userSettings.privacy,
        lastUpdated: Timestamp.now()
      });
      
      console.log('✅ Görünürlük ayarları kaydedildi');
      setShowVisibilityModal(false);
      Alert.alert('Başarılı', 'Görünürlük ayarlarınız kaydedildi!');
    } catch (error: any) {
      console.error('❌ Görünürlük ayarları kaydetme hatası:', error);
      Alert.alert('Hata', 'Ayarlar kaydedilemedi: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setSaving(false);
    }
  };

  // Şifre değiştir
  const handleChangePassword = async () => {
    if (!currentUser) return;
    
    if (newPassword !== confirmPassword) {
      Alert.alert('Hata', 'Yeni şifreler eşleşmiyor!');
      return;
    }
    
    if (newPassword.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır!');
      return;
    }

    try {
      setSaving(true);
      console.log('🔐 Şifre değiştiriliyor...');
      
      // Kullanıcıyı yeniden doğrula
      const credential = EmailAuthProvider.credential(currentUser.email!, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      
      // Şifreyi güncelle
      await updatePassword(currentUser, newPassword);
      
      console.log('✅ Şifre değiştirildi');
      Alert.alert('Başarılı', 'Şifreniz başarıyla değiştirildi!');
      
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('❌ Şifre değiştirme hatası:', error);
      
      if (error.code === 'auth/wrong-password') {
        Alert.alert('Hata', 'Mevcut şifre yanlış!');
      } else if (error.code === 'auth/weak-password') {
        Alert.alert('Hata', 'Şifre çok zayıf!');
      } else {
        Alert.alert('Hata', 'Şifre değiştirilemedi: ' + (error.message || 'Bilinmeyen hata'));
      }
    } finally {
      setSaving(false);
    }
  };

  // Hesabı sil
  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    
    try {
      setSaving(true);
      console.log('🗑️ Hesap siliniyor...');
      
      // Kullanıcı verilerini sil
      await deleteDoc(doc(db, 'userSettings', currentUser.uid));
      await deleteDoc(doc(db, 'userBalances', currentUser.uid));
      
      // Kullanıcı hesabını sil
      await deleteUser(currentUser);
      
      console.log('✅ Hesap silindi');
      Alert.alert('Başarılı', 'Hesabınız başarıyla silindi!');
      
      setShowDeleteModal(false);
      navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
    } catch (error: any) {
      console.error('❌ Hesap silme hatası:', error);
      Alert.alert('Hata', 'Hesap silinemedi: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setSaving(false);
    }
  };

  // Çıkış yap
  const handleLogout = async () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkış yapmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Çıkış Yap', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              console.log('✅ Kullanıcı çıkış yaptı');
              navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
            } catch (error: any) {
              console.error('❌ Çıkış yapma hatası:', error);
              Alert.alert('Hata', 'Çıkış yapılamadı: ' + (error.message || 'Bilinmeyen hata'));
            }
          }
        }
      ]
    );
  };

  // Veri temizle
  const handleClearData = () => {
    Alert.alert(
      'Veri Temizleme',
      'Tüm uygulama verileri silinecek. Bu işlem geri alınamaz. Emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Temizle', 
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Başarılı', 'Tüm veriler temizlendi. Uygulama yeniden başlatılacak.');
              navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
            } catch (error) {
              Alert.alert('Hata', 'Veriler temizlenirken bir hata oluştu.');
            }
          }
        }
      ]
    );
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

  if (loading || !userSettings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Ayarlar yükleniyor...</Text>
          <Text style={styles.loadingSubtext}>Firebase'den veriler alınıyor</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>⚙️ Ayarlar</Text>
          <Text style={styles.subtitle}>Uygulama tercihlerinizi özelleştirin</Text>
        </View>

        {/* Bildirim Ayarları */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 Bildirimler</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Push Bildirimleri</Text>
            <Switch
              value={userSettings.notifications.pushNotifications}
              onValueChange={(value) => handleNotificationChange('pushNotifications', value)}
              trackColor={{ false: '#E0E0E0', true: '#2563EB' }}
              thumbColor={userSettings.notifications.pushNotifications ? '#FFFFFF' : '#F4F3F4'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>E-posta Bildirimleri</Text>
            <Switch
              value={userSettings.notifications.emailNotifications}
              onValueChange={(value) => handleNotificationChange('emailNotifications', value)}
              trackColor={{ false: '#E0E0E0', true: '#2563EB' }}
              thumbColor={userSettings.notifications.emailNotifications ? '#FFFFFF' : '#F4F3F4'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>SMS Bildirimleri</Text>
            <Switch
              value={userSettings.notifications.smsNotifications}
              onValueChange={(value) => handleNotificationChange('smsNotifications', value)}
              trackColor={{ false: '#E0E0E0', true: '#2563EB' }}
              thumbColor={userSettings.notifications.smsNotifications ? '#FFFFFF' : '#F4F3F4'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>İş Uyarıları</Text>
            <Switch
              value={userSettings.notifications.jobAlerts}
              onValueChange={(value) => handleNotificationChange('jobAlerts', value)}
              trackColor={{ false: '#E0E0E0', true: '#2563EB' }}
              thumbColor={userSettings.notifications.jobAlerts ? '#FFFFFF' : '#F4F3F4'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Mesaj Bildirimleri</Text>
            <Switch
              value={userSettings.notifications.messageNotifications}
              onValueChange={(value) => handleNotificationChange('messageNotifications', value)}
              trackColor={{ false: '#E0E0E0', true: '#2563EB' }}
              thumbColor={userSettings.notifications.messageNotifications ? '#FFFFFF' : '#F4F3F4'}
            />
          </View>
        </View>

        {/* Gizlilik Ayarları */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔒 Gizlilik</Text>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowVisibilityModal(true)}
          >
            <Text style={styles.settingLabel}>Profil Görünürlüğü</Text>
            <Text style={styles.settingValue}>
              {userSettings.privacy.profileVisibility === 'public' ? 'Herkese Açık' :
               userSettings.privacy.profileVisibility === 'employers' ? 'Sadece İşverenler' :
               userSettings.privacy.profileVisibility === 'categories' ? 'Kategori Bazlı' : 'Gizli'}
            </Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>İletişim Bilgileri</Text>
            <Switch
              value={userSettings.privacy.showContactInfo}
              onValueChange={(value) => handlePrivacyChange('showContactInfo', value)}
              trackColor={{ false: '#E0E0E0', true: '#2563EB' }}
              thumbColor={userSettings.privacy.showContactInfo ? '#FFFFFF' : '#F4F3F4'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Konum Bilgisi</Text>
            <Switch
              value={userSettings.privacy.showLocation}
              onValueChange={(value) => handlePrivacyChange('showLocation', value)}
              trackColor={{ false: '#E0E0E0', true: '#2563EB' }}
              thumbColor={userSettings.privacy.showLocation ? '#FFFFFF' : '#F4F3F4'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Kazanç Bilgisi</Text>
            <Switch
              value={userSettings.privacy.showEarnings}
              onValueChange={(value) => handlePrivacyChange('showEarnings', value)}
              trackColor={{ false: '#E0E0E0', true: '#2563EB' }}
              thumbColor={userSettings.privacy.showEarnings ? '#FFFFFF' : '#F4F3F4'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Portföy</Text>
            <Switch
              value={userSettings.privacy.showPortfolio}
              onValueChange={(value) => handlePrivacyChange('showPortfolio', value)}
              trackColor={{ false: '#E0E0E0', true: '#2563EB' }}
              thumbColor={userSettings.privacy.showPortfolio ? '#FFFFFF' : '#F4F3F4'}
            />
          </View>
        </View>

        {/* Hesap Ayarları */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Hesap</Text>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowPasswordModal(true)}
          >
            <Text style={styles.settingLabel}>Şifre Değiştir</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleLogout}
          >
            <Text style={styles.settingLabel}>Çıkış Yap</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Veri Yönetimi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💾 Veri Yönetimi</Text>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleClearData}
          >
            <Text style={styles.settingLabel}>Verileri Temizle</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.settingItem, styles.dangerItem]}
            onPress={() => setShowDeleteModal(true)}
          >
            <Text style={[styles.settingLabel, styles.dangerText]}>Hesabı Sil</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Görünürlük Ayarları Modal */}
      <Modal
        visible={showVisibilityModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowVisibilityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>👁️ Profil Görünürlüğü</Text>
            
            <View style={styles.visibilityOptions}>
              {[
                { key: 'public', label: 'Herkese Açık', description: 'Tüm kullanıcılar profilinizi görebilir' },
                { key: 'employers', label: 'Sadece İşverenler', description: 'Sadece işverenler profilinizi görebilir' },
                { key: 'categories', label: 'Kategori Bazlı', description: 'Sadece seçili kategorilerde görünürsünüz' },
                { key: 'private', label: 'Gizli', description: 'Profiliniz hiçbir kullanıcıya görünmez' }
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.visibilityOption,
                    userSettings.privacy.profileVisibility === option.key && styles.visibilityOptionSelected
                  ]}
                  onPress={() => handleVisibilityChange('profileVisibility', option.key)}
                >
                  <Text style={[
                    styles.visibilityOptionLabel,
                    userSettings.privacy.profileVisibility === option.key && styles.visibilityOptionLabelSelected
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={[
                    styles.visibilityOptionDescription,
                    userSettings.privacy.profileVisibility === option.key && styles.visibilityOptionDescriptionSelected
                  ]}>
                    {option.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {userSettings.privacy.profileVisibility === 'categories' && (
              <View style={styles.categoriesSection}>
                <Text style={styles.categoriesTitle}>Görünür Kategoriler:</Text>
                {['Ev Temizliği', 'Bahçe Bakımı', 'Temizlik', 'Nakliye', 'Teknik Servis', 'Bakım', 'Diğer'].map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryItem,
                      userSettings.privacy.visibleCategories.includes(category) && styles.categoryItemSelected
                    ]}
                    onPress={() => toggleCategoryVisibility(category)}
                  >
                    <Text style={[
                      styles.categoryItemText,
                      userSettings.privacy.visibleCategories.includes(category) && styles.categoryItemTextSelected
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowVisibilityModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>İptal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalSaveButton, saving && styles.modalSaveButtonDisabled]}
                onPress={saveVisibilitySettings}
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

      {/* Şifre Değiştirme Modal */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🔐 Şifre Değiştir</Text>
            
            <Text style={styles.modalLabel}>Mevcut Şifre:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Mevcut şifrenizi girin"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />
            
            <Text style={styles.modalLabel}>Yeni Şifre:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Yeni şifrenizi girin"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            
            <Text style={styles.modalLabel}>Yeni Şifre (Tekrar):</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Yeni şifrenizi tekrar girin"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowPasswordModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>İptal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalSaveButton, saving && styles.modalSaveButtonDisabled]}
                onPress={handleChangePassword}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveButtonText}>Değiştir</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Hesap Silme Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🗑️ Hesabı Sil</Text>
            
            <Text style={styles.modalWarning}>
              ⚠️ Bu işlem geri alınamaz! Tüm verileriniz, işleriniz ve mesajlarınız kalıcı olarak silinecektir.
            </Text>
            
            <Text style={styles.modalLabel}>
              Hesabınızı silmek istediğinizden emin misiniz?
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>İptal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalDeleteButton, saving && styles.modalDeleteButtonDisabled]}
                onPress={handleDeleteAccount}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalDeleteButtonText}>Hesabı Sil</Text>
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
  scrollView: {
    flex: 1,
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
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  settingValue: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  settingArrow: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  dangerItem: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  dangerText: {
    color: '#991B1B',
  },
  // Modal stilleri
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
    width: '90%',
    maxWidth: 350,
    maxHeight: '85%',
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
    marginBottom: 20,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 16,
  },
  modalWarning: {
    fontSize: 12,
    color: '#991B1B',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalSaveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalSaveButtonDisabled: {
    backgroundColor: '#A0C4FF',
    opacity: 0.7,
  },
  modalDeleteButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalDeleteButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalDeleteButtonDisabled: {
    backgroundColor: '#FCA5A5',
    opacity: 0.7,
  },
  // Profil görünürlük modal stilleri
  visibilityOptions: {
    gap: 12,
  },
  visibilityOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  visibilityOptionSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
    borderStyle: 'solid',
  },
  visibilityOptionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  visibilityOptionLabelSelected: {
    color: '#2563EB',
    fontWeight: '600',
  },
  visibilityOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  visibilityOptionDescriptionSelected: {
    color: '#2563EB',
    fontWeight: '600',
  },
  categoriesSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  categoriesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  categoryItem: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryItemSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  categoryItemText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  categoryItemTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
