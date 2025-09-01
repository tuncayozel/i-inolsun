# 🚀 İşin Olsun - Production Deployment Rehberi

## 📋 **Ön Gereksinimler**

### **1. Firebase Console Temizliği**
- [ ] Test verilerini sil (jobs, users, chatRooms, messages)
- [ ] Test resimleri Storage'dan sil
- [ ] Test kullanıcıları Authentication'dan sil

### **2. Firebase Güvenlik Kuralları**
- [ ] Firestore Rules: `firestore.rules`
- [ ] Storage Rules: `storage.rules`
- [ ] Realtime Database Rules: `database.rules.json`

## 🔐 **Firebase Güvenlik Kurallarını Deploy Et**

### **Firestore Rules:**
```bash
firebase deploy --only firestore:rules
```

### **Storage Rules:**
```bash
firebase deploy --only storage
```

### **Realtime Database Rules:**
```bash
firebase deploy --only database
```

## 🏗️ **Production Build**

### **Android Build:**
```bash
eas build --platform android --profile production
```

### **iOS Build:**
```bash
eas build --platform ios --profile production
```

### **Web Build:**
```bash
npm run build
```

## 📱 **App Store Deployment**

### **Google Play Console:**
1. APK/AAB dosyasını yükle
2. Store listing hazırla
3. Content rating al
4. Pricing & distribution ayarla
5. Release to production

### **Apple App Store:**
1. Xcode ile archive oluştur
2. App Store Connect'e yükle
3. App review sürecini başlat
4. Release to App Store

## 🛡️ **Güvenlik Kontrol Listesi**

- [ ] Auth != null tüm endpoint'lerde
- [ ] Kullanıcı sadece kendi verilerini değiştirebilir
- [ ] İlan sahibi sadece kendi ilanını düzenleyebilir
- [ ] Chat room'lara sadece katılımcılar erişebilir
- [ ] Storage'da sadece yetkili kullanıcılar dosya yükleyebilir

## 📊 **Monitoring & Analytics**

- [ ] Firebase Analytics aktif
- [ ] Crashlytics kurulu
- [ ] Performance monitoring aktif
- [ ] Error tracking aktif

## 🔄 **CI/CD Pipeline**

- [ ] GitHub Actions kurulu
- [ ] Automatic testing
- [ ] Automatic deployment
- [ ] Rollback mechanism

## 📞 **Support & Maintenance**

- [ ] User feedback system
- [ ] Bug reporting system
- [ ] Update mechanism
- [ ] Backup strategy
