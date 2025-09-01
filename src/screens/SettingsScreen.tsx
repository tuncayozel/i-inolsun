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
              {privacy.profileVisibility === 'public' ? 'Herkese Açık' : 'Sadece Arkadaşlar'}
            </Text>,
            () => {
              const newValue = privacy.profileVisibility === 'public' ? 'friends' : 'public';
              handlePrivacyChange('profileVisibility', newValue);
            }
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
});
