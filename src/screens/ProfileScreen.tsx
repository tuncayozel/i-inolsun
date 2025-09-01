import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatPrice } from '../data/mockData';

export default function ProfileScreen({ navigation }: any) {
  const [user, setUser] = useState({
    name: 'Test Kullanıcı',
    email: 'test@email.com',
    location: 'İstanbul, Türkiye',
    memberSince: new Date(),
    rating: 4.8,
    completedJobs: 12,
    totalEarnings: 2500,
    skills: ['Ev Temizliği', 'Bahçe Bakımı', 'Temizlik'],
    phone: '0532 123 45 67'
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(prev => ({
          ...prev,
          name: parsedUser.name,
          email: parsedUser.email,
          phone: parsedUser.phone
        }));
      }
    } catch (error) {
      console.log('Kullanıcı verisi yüklenemedi:', error);
    }
  };

  const handleEditProfile = () => {
    Alert.alert('Düzenle', 'Profil düzenleme özelliği geliştirilme aşamasında...');
  };

  const handleSettings = () => {
    Alert.alert('Ayarlar', 'Ayarlar özelliği geliştirilme aşamasında...');
  };

  const handleLogout = async () => {
    Alert.alert(
      'Çıkış Yap',
      'Çıkış yapmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Çıkış Yap', 
          onPress: async () => {
            try {
              // AsyncStorage'dan kullanıcı verilerini temizle
              await AsyncStorage.removeItem('userToken');
              await AsyncStorage.removeItem('userData');
              
              // Splash ekranına yönlendir
              navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
            } catch (error) {
              console.log('Çıkış yapılırken hata:', error);
              navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
            }
          }
        }
      ]
    );
  };

  const formatMemberSince = (date: Date) => {
    return date.toLocaleDateString('tr-TR', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const menuItems = [
    { icon: '⚙️', title: 'Ayarlar', onPress: handleSettings },
    { icon: '📋', title: 'İş Geçmişi', onPress: () => navigation.navigate('MyJobs') },
    { icon: '💳', title: 'Ödemeler', onPress: () => Alert.alert('Ödemeler', 'Ödeme geçmişi özelliği geliştirilme aşamasında...') },
    { icon: '🔔', title: 'Bildirimler', onPress: () => Alert.alert('Bildirimler', 'Bildirim ayarları özelliği geliştirilme aşamasında...') },
    { icon: '❓', title: 'Yardım', onPress: () => Alert.alert('Yardım', 'Yardım merkezi özelliği geliştirilme aşamasında...') },
    { icon: '🚪', title: 'Çıkış Yap', onPress: handleLogout, isLogout: true },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.name[0]}</Text>
            </View>
            <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
              <Text style={styles.editButtonText}>✏️</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <Text style={styles.location}>📍 {user.location}</Text>
          <Text style={styles.memberSince}>
            {formatMemberSince(user.memberSince)} tarihinden beri üye
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{user.rating}</Text>
            <Text style={styles.statLabel}>⭐ Puan</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{user.completedJobs}</Text>
            <Text style={styles.statLabel}>✅ Tamamlanan</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{formatPrice(user.totalEarnings)}</Text>
            <Text style={styles.statLabel}>💰 Kazanç</Text>
          </View>
        </View>

        {/* Skills */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yetenekler</Text>
          <View style={styles.skillsContainer}>
            {user.skills.map((skill, index) => (
              <View key={index} style={styles.skillTag}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bio */}
        {user.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hakkında</Text>
            <Text style={styles.bio}>{user.bio}</Text>
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.section}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, item.isLogout && styles.logoutItem]}
              onPress={item.onPress}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={[styles.menuTitle, item.isLogout && styles.logoutText]}>
                {item.title}
              </Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
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
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
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
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  editButtonText: {
    fontSize: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  skillText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  bio: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  logoutItem: {
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  logoutText: {
    color: '#DC2626',
  },
  menuArrow: {
    fontSize: 18,
    color: '#9CA3AF',
  },
});


