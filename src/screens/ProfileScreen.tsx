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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatPrice } from '../data/mockData';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen({ navigation }: any) {
  const [user, setUser] = useState({
    name: 'Test Kullanıcı',
    email: 'test@email.com',
    location: 'İstanbul, Türkiye',
    memberSince: new Date(),
    rating: 4.8,
    completedJobs: 12,
    totalEarnings: 2500,
    activeJobs: 3,
    skills: [
      { 
        name: 'Ev Temizliği', 
        level: 'advanced', 
        experience: '5+ yıl',
        description: 'Profesyonel ev temizliği hizmetleri',
        certificates: ['Temizlik Sertifikası', 'Sağlık Belgesi']
      },
      { 
        name: 'Bahçe Bakımı', 
        level: 'intermediate', 
        experience: '3 yıl',
        description: 'Bahçe düzenleme ve bitki bakımı',
        certificates: ['Bahçe Bakım Sertifikası']
      },
      { 
        name: 'Temizlik', 
        level: 'beginner', 
        experience: '1 yıl',
        description: 'Genel temizlik hizmetleri',
        certificates: []
      }
    ],
    phone: '0532 123 45 67',
    profileImage: null, // Profil fotoğrafı
    // Gelişmiş istatistikler
    monthlyEarnings: [1200, 1800, 2100, 2500, 2800, 2500], // Son 6 ay
    categoryStats: [
      { category: 'Ev Temizliği', count: 8, earnings: 1600 },
      { category: 'Bahçe Bakımı', count: 3, earnings: 600 },
      { category: 'Temizlik', count: 1, earnings: 300 }
    ],
         badges: [
       { name: 'İlk İş', icon: '🎯', earned: true },
       { name: '1000 TL', icon: '💰', earned: true },
       { name: '5 Yıldız', icon: '⭐', earned: true },
       { name: 'Hızlı İşçi', icon: '⚡', earned: false }
     ],
     // Portföy ve referanslar
     portfolio: [
       {
         id: 1,
         title: 'Ev Temizliği - Kadıköy',
         description: '3+1 ev temizliği, derin temizlik hizmeti',
         category: 'Ev Temizliği',
         completedDate: new Date('2024-01-15'),
         earnings: 450,
         photos: ['https://example.com/photo1.jpg'],
         rating: 5,
         customerComment: 'Çok temiz ve düzenli iş yaptı, kesinlikle tavsiye ederim!',
         customerName: 'Ayşe K.'
       },
       {
         id: 2,
         title: 'Bahçe Bakımı - Beşiktaş',
         description: 'Villa bahçesi düzenleme ve bitki bakımı',
         category: 'Bahçe Bakımı',
         completedDate: new Date('2024-01-10'),
         earnings: 800,
         photos: ['https://example.com/photo2.jpg'],
         rating: 5,
         customerComment: 'Bahçe çok güzel oldu, profesyonel iş çıkardı.',
         customerName: 'Mehmet A.'
       },
       {
         id: 3,
         title: 'Ofis Temizliği - Şişli',
         description: '200m² ofis alanı temizliği',
         category: 'Temizlik',
         completedDate: new Date('2024-01-05'),
         earnings: 600,
         photos: [],
         rating: 4,
         customerComment: 'İyi iş çıkardı, zamanında tamamladı.',
         customerName: 'Fatma S.'
       }
     ]
  });

  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Portföy ekleme form state'leri
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRating, setSelectedRating] = useState(0);
  
  // Beceri ekleme form state'leri
  const [selectedSkillLevel, setSelectedSkillLevel] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const profileImage = await AsyncStorage.getItem('profileImage');
      
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(prev => ({
          ...prev,
          name: parsedUser.name,
          email: parsedUser.email,
          phone: parsedUser.phone,
          location: parsedUser.location,
          bio: parsedUser.bio
        }));
      }
      
      if (profileImage) {
        setUser(prev => ({ ...prev, profileImage }));
      }
    } catch (error) {
      console.log('Kullanıcı verisi yüklenemedi:', error);
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('ProfileEdit');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
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

  // Fotoğraf yükleme fonksiyonları
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Galeri erişimi için izin gerekiyor.');
      return false;
    }
    return true;
  };

  const requestCameraPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Kamera erişimi için izin gerekiyor.');
      return false;
    }
    return true;
  };

  const pickImageFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      setUploading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setUser(prev => ({ ...prev, profileImage: imageUri }));
        await AsyncStorage.setItem('profileImage', imageUri);
        Alert.alert('Başarılı', 'Profil fotoğrafı güncellendi!');
      }
    } catch (error) {
      Alert.alert('Hata', 'Fotoğraf yüklenirken bir hata oluştu.');
    } finally {
      setUploading(false);
      setShowImagePicker(false);
    }
  };

  const takePhotoWithCamera = async () => {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return;

    try {
      setUploading(true);
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setUser(prev => ({ ...prev, profileImage: imageUri }));
        await AsyncStorage.setItem('profileImage', imageUri);
        Alert.alert('Başarılı', 'Profil fotoğrafı çekildi!');
      }
    } catch (error) {
      Alert.alert('Hata', 'Fotoğraf çekilirken bir hata oluştu.');
    } finally {
      setUploading(false);
      setShowImagePicker(false);
    }
  };

  const removeProfileImage = async () => {
    Alert.alert(
      'Fotoğrafı Kaldır',
      'Profil fotoğrafını kaldırmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kaldır',
          style: 'destructive',
          onPress: async () => {
            setUser(prev => ({ ...prev, profileImage: null }));
            await AsyncStorage.removeItem('profileImage');
            Alert.alert('Başarılı', 'Profil fotoğrafı kaldırıldı.');
          }
        }
      ]
    );
  };

  // Beceri yönetimi fonksiyonları
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return '#10B981'; // Yeşil
      case 'intermediate': return '#F59E0B'; // Turuncu
      case 'advanced': return '#EF4444'; // Kırmızı
      default: return '#6B7280';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'beginner': return 'Başlangıç';
      case 'intermediate': return 'Orta';
      case 'advanced': return 'İleri';
      default: return 'Bilinmiyor';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'beginner': return '🌱';
      case 'intermediate': return '🌿';
      case 'advanced': return '🌳';
      default: return '❓';
    }
  };

  // Portföy yardımcı fonksiyonları
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={[
          styles.star,
          i <= rating ? styles.starFilled : styles.starEmpty
        ]}>
          {i <= rating ? '⭐' : '☆'}
        </Text>
      );
    }
    return stars;
  };

  // Portföy ekleme fonksiyonları
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };

  const handleRatingSelect = (rating: number) => {
    setSelectedRating(rating);
  };

  const resetPortfolioForm = () => {
    setSelectedCategory('');
    setSelectedRating(0);
  };

  // Beceri ekleme fonksiyonları
  const handleSkillLevelSelect = (level: string) => {
    setSelectedSkillLevel(level);
  };

  const resetSkillForm = () => {
    setSelectedSkillLevel('');
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
            <TouchableOpacity 
              style={styles.avatar} 
              onPress={() => {
                if (user.profileImage) {
                  setShowImageModal(true);
                } else {
                  setShowImagePicker(true);
                }
              }}
              disabled={uploading}
            >
              {user.profileImage ? (
                <Image source={{ uri: user.profileImage }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{user.name[0]}</Text>
              )}
              {uploading && <View style={styles.uploadingOverlay} />}
            </TouchableOpacity>
            
            <View style={styles.avatarButtons}>
              <TouchableOpacity 
                style={styles.editButton} 
                onPress={() => setShowImagePicker(true)}
                disabled={uploading}
              >
                <Text style={styles.editButtonText}>📸</Text>
              </TouchableOpacity>
              
              {user.profileImage && (
                <TouchableOpacity 
                  style={styles.removeButton} 
                  onPress={removeProfileImage}
                  disabled={uploading}
                >
                  <Text style={styles.removeButtonText}>🗑️</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <Text style={styles.location}>📍 {user.location}</Text>
          <Text style={styles.memberSince}>
            {formatMemberSince(user.memberSince)} tarihinden beri üye
          </Text>
        </View>

        {/* Ana İstatistikler */}
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
            <Text style={styles.statNumber}>{user.activeJobs}</Text>
            <Text style={styles.statLabel}>🔄 Aktif</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{formatPrice(user.totalEarnings)}</Text>
            <Text style={styles.statLabel}>💰 Toplam</Text>
          </View>
        </View>

        {/* Aylık Kazanç Grafiği */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Aylık Kazanç Trendi</Text>
          <View style={styles.chartContainer}>
            <View style={styles.chart}>
              {user.monthlyEarnings.map((earning, index) => {
                const maxEarning = Math.max(...user.monthlyEarnings);
                const height = (earning / maxEarning) * 100;
                return (
                  <View key={index} style={styles.chartBar}>
                    <View style={[styles.bar, { height: `${height}%` }]} />
                    <Text style={styles.barLabel}>{formatPrice(earning)}</Text>
                    <Text style={styles.monthLabel}>
                      {['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz'][index]}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Kategori Bazlı İstatistikler */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Kategori Performansı</Text>
          <View style={styles.categoryStatsContainer}>
            {user.categoryStats.map((stat, index) => (
              <View key={index} style={styles.categoryStatCard}>
                <Text style={styles.categoryName}>{stat.category}</Text>
                <View style={styles.categoryStatsRow}>
                  <View style={styles.categoryStatItem}>
                    <Text style={styles.categoryStatNumber}>{stat.count}</Text>
                    <Text style={styles.categoryStatLabel}>İş</Text>
                  </View>
                  <View style={styles.categoryStatItem}>
                    <Text style={styles.categoryStatNumber}>{formatPrice(stat.earnings)}</Text>
                    <Text style={styles.categoryStatLabel}>Kazanç</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Başarı Rozetleri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Başarı Rozetleri</Text>
          <View style={styles.badgesContainer}>
            {user.badges.map((badge, index) => (
              <View key={index} style={[
                styles.badge,
                badge.earned ? styles.badgeEarned : styles.badgeLocked
              ]}>
                <Text style={styles.badgeIcon}>{badge.icon}</Text>
                <Text style={[
                  styles.badgeName,
                  badge.earned ? styles.badgeNameEarned : styles.badgeNameLocked
                ]}>
                  {badge.name}
                </Text>
                {badge.earned && <Text style={styles.badgeCheck}>✓</Text>}
              </View>
            ))}
          </View>
        </View>

                 {/* Skills */}
         <View style={styles.section}>
           <View style={styles.sectionHeader}>
             <Text style={styles.sectionTitle}>Yetenekler</Text>
             <TouchableOpacity 
               style={styles.addSkillButton}
               onPress={() => setShowSkillsModal(true)}
             >
               <Text style={styles.addSkillButtonText}>+ Ekle</Text>
             </TouchableOpacity>
           </View>
           <View style={styles.skillsContainer}>
             {user.skills.map((skill, index) => (
               <View key={index} style={styles.skillCard}>
                 <View style={styles.skillHeader}>
                   <View style={styles.skillInfo}>
                     <Text style={styles.skillName}>{skill.name}</Text>
                     <View style={styles.skillLevelContainer}>
                       <Text style={styles.skillLevelIcon}>
                         {getLevelIcon(skill.level)}
                       </Text>
                       <Text style={[
                         styles.skillLevelText,
                         { color: getLevelColor(skill.level) }
                       ]}>
                         {getLevelText(skill.level)}
                       </Text>
                     </View>
                   </View>
                   <Text style={styles.skillExperience}>{skill.experience}</Text>
                 </View>
                 
                 <Text style={styles.skillDescription}>{skill.description}</Text>
                 
                 {skill.certificates.length > 0 && (
                   <View style={styles.certificatesContainer}>
                     <Text style={styles.certificatesTitle}>Sertifikalar:</Text>
                     {skill.certificates.map((cert, certIndex) => (
                       <View key={certIndex} style={styles.certificateTag}>
                         <Text style={styles.certificateText}>📜 {cert}</Text>
                       </View>
                     ))}
                   </View>
                 )}
               </View>
             ))}
           </View>
         </View>

         {/* Portföy ve Referanslar */}
         <View style={styles.section}>
           <View style={styles.sectionHeader}>
             <Text style={styles.sectionTitle}>Portföy ve Referanslar</Text>
             <TouchableOpacity 
               style={styles.addPortfolioButton}
               onPress={() => setShowPortfolioModal(true)}
             >
               <Text style={styles.addPortfolioButtonText}>+ Ekle</Text>
             </TouchableOpacity>
           </View>
           <View style={styles.portfolioContainer}>
             {user.portfolio.map((item, index) => (
               <View key={index} style={styles.portfolioCard}>
                 <View style={styles.portfolioHeader}>
                   <View style={styles.portfolioInfo}>
                     <Text style={styles.portfolioTitle}>{item.title}</Text>
                     <View style={styles.portfolioMeta}>
                       <Text style={styles.portfolioCategory}>{item.category}</Text>
                       <Text style={styles.portfolioDate}>
                         {formatDate(item.completedDate)}
                       </Text>
                     </View>
                   </View>
                   <View style={styles.portfolioEarnings}>
                     <Text style={styles.earningsAmount}>
                       {formatPrice(item.earnings)}
                     </Text>
                   </View>
                 </View>
                 
                 <Text style={styles.portfolioDescription}>{item.description}</Text>
                 
                 {/* Müşteri Yorumu */}
                 <View style={styles.reviewContainer}>
                   <View style={styles.reviewHeader}>
                     <Text style={styles.customerName}>{item.customerName}</Text>
                     <View style={styles.ratingContainer}>
                       {renderStars(item.rating)}
                     </View>
                   </View>
                   <Text style={styles.customerComment}>{item.customerComment}</Text>
                 </View>
                 
                 {/* Fotoğraflar */}
                 {item.photos.length > 0 && (
                   <View style={styles.photosContainer}>
                     <Text style={styles.photosTitle}>İş Fotoğrafları:</Text>
                     <View style={styles.photoGrid}>
                       {item.photos.map((photo, photoIndex) => (
                         <View key={photoIndex} style={styles.photoItem}>
                           <Text style={styles.photoPlaceholder}>📷</Text>
                         </View>
                       ))}
                     </View>
                   </View>
                 )}
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

      {/* Fotoğraf Seçim Modal */}
      <Modal
        visible={showImagePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowImagePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Profil Fotoğrafı</Text>
            
            <TouchableOpacity 
              style={styles.modalOption} 
              onPress={takePhotoWithCamera}
              disabled={uploading}
            >
              <Text style={styles.modalOptionIcon}>📸</Text>
              <Text style={styles.modalOptionText}>Kamera ile Çek</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalOption} 
              onPress={pickImageFromGallery}
              disabled={uploading}
            >
              <Text style={styles.modalOptionIcon}>🖼️</Text>
              <Text style={styles.modalOptionText}>Galeriden Seç</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalCancelButton} 
              onPress={() => setShowImagePicker(false)}
              disabled={uploading}
            >
              <Text style={styles.modalCancelText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

             {/* Fotoğraf Büyütme Modal */}
       <Modal
         visible={showImageModal}
         transparent={true}
         animationType="fade"
         onRequestClose={() => setShowImageModal(false)}
       >
         <View style={styles.imageModalOverlay}>
           <TouchableOpacity 
             style={styles.imageModalCloseButton}
             onPress={() => setShowImageModal(false)}
           >
             <Text style={styles.imageModalCloseText}>✕</Text>
           </TouchableOpacity>
           
           <Image 
             source={{ uri: user.profileImage }} 
             style={styles.imageModalImage}
             resizeMode="contain"
           />
           
           <View style={styles.imageModalActions}>
             <TouchableOpacity 
               style={styles.imageModalActionButton}
               onPress={() => {
                 setShowImageModal(false);
                 setShowImagePicker(true);
               }}
             >
               <Text style={styles.imageModalActionIcon}>📸</Text>
               <Text style={styles.imageModalActionText}>Değiştir</Text>
             </TouchableOpacity>
             
             <TouchableOpacity 
               style={styles.imageModalActionButton}
               onPress={() => {
                 setShowImageModal(false);
                 removeProfileImage();
               }}
             >
               <Text style={styles.imageModalActionIcon}>🗑️</Text>
               <Text style={styles.imageModalActionText}>Sil</Text>
             </TouchableOpacity>
           </View>
         </View>
       </Modal>

               {/* Beceri Ekleme Modal */}
        <Modal
          visible={showSkillsModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowSkillsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Yeni Beceri Ekle</Text>
              
              <View style={styles.skillFormContainer}>
                <Text style={styles.formLabel}>Beceri Adı</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Örn: Ev Temizliği"
                  placeholderTextColor="#9CA3AF"
                />
                
                                 <Text style={styles.formLabel}>Deneyim Seviyesi</Text>
                 <View style={styles.levelSelector}>
                   {['beginner', 'intermediate', 'advanced'].map((level) => (
                     <TouchableOpacity
                       key={level}
                       style={[
                         styles.levelOption,
                         { borderColor: getLevelColor(level) },
                         selectedSkillLevel === level && styles.levelOptionSelected
                       ]}
                       onPress={() => handleSkillLevelSelect(level)}
                     >
                       <Text style={styles.levelOptionIcon}>
                         {getLevelIcon(level)}
                       </Text>
                       <Text style={[
                         styles.levelOptionText,
                         selectedSkillLevel === level && styles.levelOptionTextSelected
                       ]}>
                         {getLevelText(level)}
                       </Text>
                     </TouchableOpacity>
                   ))}
                 </View>
                
                <Text style={styles.formLabel}>Deneyim Süresi</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Örn: 3 yıl"
                  placeholderTextColor="#9CA3AF"
                />
                
                <Text style={styles.formLabel}>Açıklama</Text>
                <TextInput
                  style={styles.formTextArea}
                  placeholder="Beceri hakkında detaylı açıklama..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                />
              </View>
              
              <View style={styles.modalButtons}>
                                 <TouchableOpacity 
                   style={styles.modalCancelButton} 
                   onPress={() => {
                     setShowSkillsModal(false);
                     resetSkillForm();
                   }}
                 >
                   <Text style={styles.modalCancelText}>İptal</Text>
                 </TouchableOpacity>
                 
                 <TouchableOpacity 
                   style={styles.modalSaveButton} 
                   onPress={() => {
                     // Beceri ekleme işlemi burada yapılacak
                     setShowSkillsModal(false);
                     resetSkillForm();
                     Alert.alert('Başarılı', 'Yeni beceri eklendi!');
                   }}
                 >
                   <Text style={styles.modalSaveText}>Ekle</Text>
                 </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Portföy Ekleme Modal */}
        <Modal
          visible={showPortfolioModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowPortfolioModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.portfolioModalContent}>
              <Text style={styles.modalTitle}>Yeni Portföy Ekle</Text>
              
              <ScrollView 
                style={styles.portfolioFormScrollView}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.portfolioFormScrollContent}
              >
                <View style={styles.portfolioFormContainer}>
                  <Text style={styles.formLabel}>İş Başlığı</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Örn: Ev Temizliği - Kadıköy"
                    placeholderTextColor="#9CA3AF"
                  />
                  
                  <Text style={styles.formLabel}>Kategori</Text>
                  <View style={styles.categorySelector}>
                    {['Ev Temizliği', 'Bahçe Bakımı', 'Temizlik', 'Diğer'].map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.categoryOption,
                          selectedCategory === category && styles.categoryOptionSelected
                        ]}
                        onPress={() => handleCategorySelect(category)}
                      >
                        <Text style={[
                          styles.categoryOptionText,
                          selectedCategory === category && styles.categoryOptionTextSelected
                        ]}>
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  
                  <Text style={styles.formLabel}>Tamamlanma Tarihi</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Örn: 15 Ocak 2024"
                    placeholderTextColor="#9CA3AF"
                  />
                  
                  <Text style={styles.formLabel}>Kazanılan Tutar (TL)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Örn: 450"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                  
                  <Text style={styles.formLabel}>İş Açıklaması</Text>
                  <TextInput
                    style={styles.formTextArea}
                    placeholder="Tamamlanan iş hakkında detaylı açıklama..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={3}
                  />
                  
                  <Text style={styles.formLabel}>Müşteri Yorumu</Text>
                  <TextInput
                    style={styles.formTextArea}
                    placeholder="Müşterinin yorumu (opsiyonel)..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={2}
                  />
                  
                  <Text style={styles.formLabel}>Müşteri Adı</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Örn: Ayşe K. (anonim olabilir)"
                    placeholderTextColor="#9CA3AF"
                  />
                  
                  <Text style={styles.formLabel}>Değerlendirme (1-5)</Text>
                  <View style={styles.ratingSelector}>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <TouchableOpacity
                        key={rating}
                        style={[
                          styles.ratingOption,
                          selectedRating === rating && styles.ratingOptionSelected
                        ]}
                        onPress={() => handleRatingSelect(rating)}
                      >
                        <Text style={[
                          styles.ratingOptionText,
                          selectedRating === rating && styles.ratingOptionTextSelected
                        ]}>
                          ⭐
                        </Text>
                        <Text style={[
                          styles.ratingOptionNumber,
                          selectedRating === rating && styles.ratingOptionNumberSelected
                        ]}>
                          {rating}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.modalCancelButton} 
                  onPress={() => {
                    setShowPortfolioModal(false);
                    resetPortfolioForm();
                  }}
                >
                  <Text style={styles.modalCancelText}>İptal</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.modalSaveButton} 
                  onPress={() => {
                    // Portföy ekleme işlemi burada yapılacak
                    setShowPortfolioModal(false);
                    resetPortfolioForm();
                    Alert.alert('Başarılı', 'Yeni portföy eklendi!');
                  }}
                >
                  <Text style={styles.modalSaveText}>Ekle</Text>
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
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
  avatarButtons: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
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
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
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
  removeButtonText: {
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
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  // Grafik stilleri
  chartContainer: {
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
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingHorizontal: 8,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  bar: {
    width: 20,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    marginBottom: 8,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  monthLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  // Kategori istatistikleri
  categoryStatsContainer: {
    gap: 12,
  },
  categoryStatCard: {
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
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  categoryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  categoryStatItem: {
    alignItems: 'center',
  },
  categoryStatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 4,
  },
  categoryStatLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  // Rozet stilleri
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badge: {
    flex: 1,
    minWidth: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
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
  badgeEarned: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  badgeLocked: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  badgeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeNameEarned: {
    color: '#10B981',
  },
  badgeNameLocked: {
    color: '#9CA3AF',
  },
  badgeCheck: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: 'bold',
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
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalOptionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  modalOptionText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  modalCancelButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  // Beceri ekleme modal stilleri
  skillFormContainer: {
    gap: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  formInput: {
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
  },
  formTextArea: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
    textAlignVertical: 'top',
    textAlign: 'center',
    minHeight: 80,
    alignSelf: 'stretch',
  },
  levelSelector: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    alignItems: 'stretch',
    width: '100%',
  },
  levelOption: {
    flex: 1,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    minHeight: 80,
    minWidth: 90,
    maxWidth: '32%',
    flexShrink: 0,
  },
  levelOptionSelected: {
    borderStyle: 'solid',
    backgroundColor: '#F0FDF4',
  },
  levelOptionIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  levelOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
    numberOfLines: 1,
    flexShrink: 1,
  },
  levelOptionTextSelected: {
    color: '#10B981',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Portföy ekleme modal stilleri
  portfolioFormContainer: {
    gap: 16,
  },
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryOptionSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  categoryOptionText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  categoryOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  ratingSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingOption: {
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 50,
  },
  ratingOptionSelected: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  ratingOptionText: {
    fontSize: 16,
    marginBottom: 2,
  },
  ratingOptionTextSelected: {
    fontSize: 18,
  },
  ratingOptionNumber: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  ratingOptionNumberSelected: {
    color: '#F59E0B',
    fontWeight: '600',
  },
  // Portföy modal özel stilleri
  portfolioModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 350,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  portfolioFormScrollView: {
    maxHeight: 400,
    marginBottom: 20,
  },
  portfolioFormScrollContent: {
    paddingBottom: 10,
  },
  // Fotoğraf büyütme modal stilleri
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  imageModalCloseText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  imageModalImage: {
    width: '90%',
    height: '70%',
    borderRadius: 12,
  },
  imageModalActions: {
    position: 'absolute',
    bottom: 50,
    flexDirection: 'row',
    gap: 20,
  },
  imageModalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  imageModalActionIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  imageModalActionText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
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
  // Beceri stilleri
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addSkillButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addSkillButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  skillsContainer: {
    gap: 12,
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
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  skillInfo: {
    flex: 1,
  },
  skillName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  skillLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  skillLevelIcon: {
    fontSize: 14,
  },
  skillLevelText: {
    fontSize: 12,
    fontWeight: '500',
  },
  skillExperience: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  skillDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  certificatesContainer: {
    gap: 8,
  },
  certificatesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  certificateTag: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  certificateText: {
    fontSize: 12,
    color: '#065F46',
  },
  // Portföy stilleri
  addPortfolioButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addPortfolioButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  portfolioContainer: {
    gap: 16,
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
  portfolioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  portfolioInfo: {
    flex: 1,
  },
  portfolioTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  portfolioMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  portfolioCategory: {
    fontSize: 12,
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '500',
  },
  portfolioDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  portfolioEarnings: {
    alignItems: 'flex-end',
  },
  earningsAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  portfolioDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 16,
  },
  reviewContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  star: {
    fontSize: 16,
  },
  starFilled: {
    color: '#F59E0B',
  },
  starEmpty: {
    color: '#D1D5DB',
  },
  customerComment: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  photosContainer: {
    gap: 8,
  },
  photosTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  photoGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  photoItem: {
    width: 60,
    height: 60,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  photoPlaceholder: {
    fontSize: 24,
    color: '#9CA3AF',
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


