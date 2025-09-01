import React, { useState } from 'react';
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState({
    pushNotifications: true,
    emailNotifications: false,
    smsNotifications: false,
    jobAlerts: true,
    messageNotifications: true,
  });

  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    showLocation: true,
    showPhone: false,
    showEmail: false,
  });

  // Profil görünürlük ayarları state'leri
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [visibilitySettings, setVisibilitySettings] = useState({
    profileVisibility: 'public', // public, employers, categories, private
    showContactInfo: true,
    showLocation: true,
    showEarnings: true,
    showPortfolio: true,
    visibleCategories: ['Ev Temizliği', 'Bahçe Bakımı', 'Temizlik']
  });

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const handlePrivacyChange = (key: string, value: any) => {
    setPrivacy(prev => ({ ...prev, [key]: value }));
  };

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
              // Navigate to splash screen
              navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
            } catch (error) {
              Alert.alert('Hata', 'Veriler temizlenirken bir hata oluştu.');
            }
          }
        }
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Veri Dışa Aktarma',
      'Bu özellik yakında eklenecek.',
      [{ text: 'Tamam' }]
    );
  };

  // Görünürlük ayarları fonksiyonları
  const handleVisibilityChange = (setting: string, value: any) => {
    setVisibilitySettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const toggleCategoryVisibility = (category: string) => {
    setVisibilitySettings(prev => ({
      ...prev,
      visibleCategories: prev.visibleCategories.includes(category)
        ? prev.visibleCategories.filter(c => c !== category)
        : [...prev.visibleCategories, category]
    }));
  };

  const saveVisibilitySettings = async () => {
    try {
      await AsyncStorage.setItem('visibilitySettings', JSON.stringify(visibilitySettings));
      Alert.alert('Başarılı', 'Görünürlük ayarları kaydedildi!');
      setShowVisibilityModal(false);
    } catch (error) {
      Alert.alert('Hata', 'Ayarlar kaydedilemedi.');
    }
  };

  const renderSettingItem = (
    title: string, 
    subtitle?: string, 
    rightComponent?: React.ReactNode,
    onPress?: () => void
  ) => (
    <TouchableOpacity 
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightComponent && (
        <View style={styles.settingRight}>
          {rightComponent}
        </View>
      )}
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
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Geri</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ayarlar</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bildirimler</Text>
          
          {renderSettingItem(
            'Push Bildirimleri',
            'Uygulama içi bildirimler',
            <Switch
              value={notifications.pushNotifications}
              onValueChange={(value) => handleNotificationChange('pushNotifications', value)}
              trackColor={{ false: '#E5E7EB', true: '#DBEAFE' }}
              thumbColor={notifications.pushNotifications ? '#2563EB' : '#9CA3AF'}
            />
          )}

          {renderSettingItem(
            'E-posta Bildirimleri',
            'E-posta ile bildirim al',
            <Switch
              value={notifications.emailNotifications}
              onValueChange={(value) => handleNotificationChange('emailNotifications', value)}
              trackColor={{ false: '#E5E7EB', true: '#DBEAFE' }}
              thumbColor={notifications.emailNotifications ? '#2563EB' : '#9CA3AF'}
            />
          )}

          {renderSettingItem(
            'SMS Bildirimleri',
            'SMS ile bildirim al',
            <Switch
              value={notifications.smsNotifications}
              onValueChange={(value) => handleNotificationChange('smsNotifications', value)}
              trackColor={{ false: '#E5E7EB', true: '#DBEAFE' }}
              thumbColor={notifications.smsNotifications ? '#2563EB' : '#9CA3AF'}
            />
          )}

          {renderSettingItem(
            'İş Uyarıları',
            'Yeni iş ilanları hakkında bilgilendir',
            <Switch
              value={notifications.jobAlerts}
              onValueChange={(value) => handleNotificationChange('jobAlerts', value)}
              trackColor={{ false: '#E5E7EB', true: '#DBEAFE' }}
              thumbColor={notifications.jobAlerts ? '#2563EB' : '#9CA3AF'}
            />
          )}

          {renderSettingItem(
            'Mesaj Bildirimleri',
            'Yeni mesajlar hakkında bilgilendir',
            <Switch
              value={notifications.messageNotifications}
              onValueChange={(value) => handleNotificationChange('messageNotifications', value)}
              trackColor={{ false: '#E5E7EB', true: '#DBEAFE' }}
              thumbColor={notifications.messageNotifications ? '#2563EB' : '#9CA3AF'}
            />
          )}
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gizlilik</Text>
          
          {renderSettingItem(
            'Profil Görünürlüğü',
            'Profilinizi kimler görebilir',
            <Text style={styles.settingValue}>
              {visibilitySettings.profileVisibility === 'public' ? 'Herkese Açık' : 
               visibilitySettings.profileVisibility === 'employers' ? 'Sadece İşverenler' :
               visibilitySettings.profileVisibility === 'categories' ? 'Seçilen Kategoriler' : 'Gizli'}
            </Text>,
            () => setShowVisibilityModal(true)
          )}

          {renderSettingItem(
            'Konum Gösterimi',
            'Konumunuzu diğer kullanıcılara göster',
            <Switch
              value={privacy.showLocation}
              onValueChange={(value) => handlePrivacyChange('showLocation', value)}
              trackColor={{ false: '#E5E7EB', true: '#DBEAFE' }}
              thumbColor={privacy.showLocation ? '#2563EB' : '#9CA3AF'}
            />
          )}

          {renderSettingItem(
            'Telefon Gösterimi',
            'Telefon numaranızı diğer kullanıcılara göster',
            <Switch
              value={privacy.showPhone}
              onValueChange={(value) => handlePrivacyChange('showPhone', value)}
              trackColor={{ false: '#E5E7EB', true: '#DBEAFE' }}
              thumbColor={privacy.showPhone ? '#2563EB' : '#9CA3AF'}
            />
          )}

          {renderSettingItem(
            'E-posta Gösterimi',
            'E-posta adresinizi diğer kullanıcılara göster',
            <Switch
              value={privacy.showEmail}
              onValueChange={(value) => handlePrivacyChange('showEmail', value)}
              trackColor={{ false: '#E5E7EB', true: '#DBEAFE' }}
              thumbColor={privacy.showEmail ? '#2563EB' : '#9CA3AF'}
            />
          )}
        </View>

        {/* Data Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Veri Yönetimi</Text>
          
          {renderSettingItem(
            'Veri Dışa Aktar',
            'Kişisel verilerinizi dışa aktarın',
            <Text style={styles.settingValue}>PDF</Text>,
            handleExportData
          )}

          {renderSettingItem(
            'Veri Temizle',
            'Tüm uygulama verilerini silin',
            <Text style={styles.settingValue}>⚠️</Text>,
            handleClearData
          )}
        </View>

        {/* App Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Uygulama Bilgileri</Text>
          
          {renderSettingItem(
            'Versiyon',
            'Uygulama sürümü',
            <Text style={styles.settingValue}>1.0.0</Text>
          )}

          {renderSettingItem(
            'Geliştirici',
            'Uygulama geliştiricisi',
            <Text style={styles.settingValue}>İşinOlsun Team</Text>
          )}

          {renderSettingItem(
            'Lisans',
            'Kullanım lisansı',
            <Text style={styles.settingValue}>MIT</Text>
          )}
        </View>
      </ScrollView>

      {/* Profil Görünürlük Ayarları Modal */}
      <Modal
        visible={showVisibilityModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowVisibilityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.visibilityModalContent}>
            <Text style={styles.modalTitle}>Profil Görünürlük Ayarları</Text>
            
            <ScrollView 
              style={styles.visibilityFormScrollView}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.visibilityFormScrollContent}
            >
              <View style={styles.visibilityFormContainer}>
                <Text style={styles.formLabel}>Profil Görünürlüğü</Text>
                <View style={styles.visibilitySelector}>
                  {[
                    { value: 'public', label: 'Herkese Açık', icon: '🌍' },
                    { value: 'employers', label: 'Sadece İşverenler', icon: '👔' },
                    { value: 'categories', label: 'Seçilen Kategoriler', icon: '📂' },
                    { value: 'private', label: 'Gizli', icon: '🔒' }
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.visibilityOption,
                        visibilitySettings.profileVisibility === option.value && styles.visibilityOptionSelected
                      ]}
                      onPress={() => handleVisibilityChange('profileVisibility', option.value)}
                    >
                      <Text style={styles.visibilityOptionIcon}>{option.icon}</Text>
                      <Text style={[
                        styles.visibilityOptionText,
                        visibilitySettings.profileVisibility === option.value && styles.visibilityOptionTextSelected
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {visibilitySettings.profileVisibility === 'categories' && (
                  <>
                    <Text style={styles.formLabel}>Görünür Kategoriler</Text>
                    <View style={styles.categoryVisibilitySelector}>
                      {['Ev Temizliği', 'Bahçe Bakımı', 'Temizlik', 'Diğer'].map((category) => (
                        <TouchableOpacity
                          key={category}
                          style={[
                            styles.categoryVisibilityOption,
                            visibilitySettings.visibleCategories.includes(category) && styles.categoryVisibilityOptionSelected
                          ]}
                          onPress={() => toggleCategoryVisibility(category)}
                        >
                          <Text style={[
                            styles.categoryVisibilityText,
                            visibilitySettings.visibleCategories.includes(category) && styles.categoryVisibilityTextSelected
                          ]}>
                            {category}
                          </Text>
                          {visibilitySettings.visibleCategories.includes(category) && (
                            <Text style={styles.categoryVisibilityCheck}>✓</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                <Text style={styles.formLabel}>Detay Görünürlüğü</Text>
                <View style={styles.detailVisibilityContainer}>
                  {[
                    { key: 'showContactInfo', label: 'İletişim Bilgileri', icon: '📞' },
                    { key: 'showLocation', label: 'Adres Bilgisi', icon: '📍' },
                    { key: 'showEarnings', label: 'Kazanç Bilgileri', icon: '💰' },
                    { key: 'showPortfolio', label: 'Portföy ve Referanslar', icon: '📁' }
                  ].map((detail) => (
                    <TouchableOpacity
                      key={detail.key}
                      style={[
                        styles.detailVisibilityOption,
                        visibilitySettings[detail.key as keyof typeof visibilitySettings] && styles.detailVisibilityOptionSelected
                      ]}
                      onPress={() => handleVisibilityChange(detail.key, !visibilitySettings[detail.key as keyof typeof visibilitySettings])}
                    >
                      <Text style={styles.detailVisibilityIcon}>{detail.icon}</Text>
                      <Text style={styles.detailVisibilityLabel}>{detail.label}</Text>
                      <View style={[
                        styles.detailVisibilityToggle,
                        visibilitySettings[detail.key as keyof typeof visibilitySettings] && styles.detailVisibilityToggleActive
                      ]}>
                        <Text style={styles.detailVisibilityToggleText}>
                          {visibilitySettings[detail.key as keyof typeof visibilitySettings] ? 'ON' : 'OFF'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton} 
                onPress={() => setShowVisibilityModal(false)}
              >
                <Text style={styles.modalCancelText}>İptal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalSaveButton} 
                onPress={saveVisibilitySettings}
              >
                <Text style={styles.modalSaveText}>Kaydet</Text>
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
  placeholder: {
    width: 60,
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
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  settingRight: {
    alignItems: 'flex-end',
  },
  settingValue: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  // Modal stilleri
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
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
  modalCancelText: {
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
  modalSaveText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Profil görünürlük modal stilleri
  visibilityModalContent: {
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
  visibilityFormScrollView: {
    maxHeight: 450,
    marginBottom: 20,
  },
  visibilityFormScrollContent: {
    paddingBottom: 10,
  },
  visibilityFormContainer: {
    gap: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  visibilitySelector: {
    gap: 12,
  },
  visibilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
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
  visibilityOptionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  visibilityOptionText: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '500',
  },
  visibilityOptionTextSelected: {
    color: '#2563EB',
    fontWeight: '600',
  },
  categoryVisibilitySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryVisibilityOption: {
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
  categoryVisibilityOptionSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  categoryVisibilityText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  categoryVisibilityTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  categoryVisibilityCheck: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  detailVisibilityContainer: {
    gap: 12,
  },
  detailVisibilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailVisibilityOptionSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  detailVisibilityIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  detailVisibilityLabel: {
    flex: 1,
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '500',
  },
  detailVisibilityToggle: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 50,
    alignItems: 'center',
  },
  detailVisibilityToggleActive: {
    backgroundColor: '#10B981',
  },
  detailVisibilityToggleText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
});
