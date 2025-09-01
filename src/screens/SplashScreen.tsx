import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

const { width, height } = Dimensions.get('window');

const SplashScreen: React.FC<any> = ({ navigation }) => {
  const [showButtons, setShowButtons] = useState(false);
  const [loading, setLoading] = useState(true);
  const [firebaseStatus, setFirebaseStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Logo ve metin animasyonu
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(logoScaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Animasyon tamamlandıktan sonra Firebase bağlantısını kontrol et
      setTimeout(() => checkFirebaseConnection(), 300);
    });

    // Pulse animasyonu
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Firebase bağlantısını kontrol et
  const checkFirebaseConnection = async () => {
    try {
      console.log('🔌 Firebase bağlantısı kontrol ediliyor...');
      setFirebaseStatus('checking');
      
      // Firebase Auth state'ini dinle
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
        
        if (user) {
          console.log('✅ Firebase bağlantısı başarılı, kullanıcı giriş yapmış');
          setFirebaseStatus('connected');
          
          // Kullanıcı giriş yapmış, ana ekrana yönlendir
          setTimeout(() => {
            if (navigation) {
              navigation.replace('Main');
            }
          }, 1000);
        } else {
          console.log('ℹ️ Firebase bağlantısı başarılı, kullanıcı giriş yapmamış');
          setFirebaseStatus('connected');
          
          // Kullanıcı giriş yapmamış, butonları göster
          setTimeout(() => {
            setShowButtons(true);
            setLoading(false);
          }, 500);
        }
      }, (error) => {
        console.error('❌ Firebase bağlantı hatası:', error);
        setFirebaseStatus('error');
        setLoading(false);
        setShowButtons(true);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('❌ Firebase bağlantı kontrolü hatası:', error);
      setFirebaseStatus('error');
      setLoading(false);
      setShowButtons(true);
    }
  };

  const handleLogin = () => {
    if (navigation) {
      navigation.navigate('Login');
    }
  };

  const handleRegister = () => {
    if (navigation) {
      navigation.navigate('Register');
    }
  };

  const handleRetryConnection = () => {
    setFirebaseStatus('checking');
    setLoading(true);
    setShowButtons(false);
    checkFirebaseConnection();
  };

  const getStatusMessage = () => {
    switch (firebaseStatus) {
      case 'checking':
        return 'Firebase bağlantısı kontrol ediliyor...';
      case 'connected':
        return currentUser ? 'Giriş yapılıyor...' : 'Bağlantı başarılı';
      case 'error':
        return 'Bağlantı hatası oluştu';
      default:
        return 'Bağlanıyor...';
    }
  };

  const getStatusColor = () => {
    switch (firebaseStatus) {
      case 'checking':
        return '#F59E0B';
      case 'connected':
        return '#10B981';
      case 'error':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo ve uygulama adı */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: logoScaleAnim }
            ],
          },
        ]}
      >
        <Animated.View 
          style={[
            styles.logoPlaceholder,
            {
              transform: [{ scale: pulseAnim }]
            }
          ]}
        >
          <Text style={styles.logoText}>İO</Text>
        </Animated.View>
        <Text style={styles.appName}>İşinOlsun</Text>
        <Text style={styles.slogan}>İşi bul, işi yaptır, güvenle kazan</Text>
      </Animated.View>

      {/* Firebase Bağlantı Durumu */}
      <Animated.View
        style={[
          styles.statusContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.statusIndicator}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          <Text style={styles.statusText}>{getStatusMessage()}</Text>
        </View>
        
        {firebaseStatus === 'checking' && (
          <ActivityIndicator 
            size="small" 
            color={getStatusColor()} 
            style={styles.statusSpinner}
          />
        )}
      </Animated.View>

      {/* Hata Durumunda Yeniden Dene Butonu */}
      {firebaseStatus === 'error' && (
        <Animated.View
          style={[
            styles.retryContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetryConnection}
          >
            <Text style={styles.retryButtonText}>🔄 Yeniden Dene</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Giriş ve Kayıt butonları */}
      {showButtons && (
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
          >
            <Text style={styles.loginButtonText}>Giriş Yap</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleRegister}
          >
            <Text style={styles.registerButtonText}>Kayıt Ol</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Loading Overlay */}
      {loading && (
        <Animated.View
          style={[
            styles.loadingOverlay,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Uygulama hazırlanıyor...</Text>
            <Text style={styles.loadingSubtext}>
              {firebaseStatus === 'checking' ? 'Firebase bağlantısı kuruluyor' :
               firebaseStatus === 'connected' ? 'Veriler yükleniyor' :
               'Bağlantı bekleniyor'}
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
    fontFamily: 'Roboto',
  },
  slogan: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Inter',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  loginButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#2563EB',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Roboto',
  },
  registerButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2563EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  registerButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2563EB',
    fontFamily: 'Roboto',
  },
  statusContainer: {
    position: 'absolute',
    top: height * 0.3, // Adjust as needed
    alignItems: 'center',
    zIndex: 1,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0E7FF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '500',
  },
  statusSpinner: {
    marginTop: 5,
  },
  retryContainer: {
    position: 'absolute',
    bottom: height * 0.1, // Adjust as needed
    alignItems: 'center',
    zIndex: 1,
  },
  retryButton: {
    width: '80%',
    height: 56,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  retryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Roboto',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 10,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 5,
  },
});

export default SplashScreen;
