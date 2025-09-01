# 🔥 Firebase Kurulum Rehberi

## 📋 **Adım 1: Firebase Console'da Proje Oluşturma**

✅ **Proje zaten mevcut!** `isinolsun-5aa3f` projesi kurulmuş.

1. [Firebase Console](https://console.firebase.google.com/) adresine gidin
2. **"isinolsun-5aa3f"** projesini seçin
3. Proje ayarlarını kontrol edin

## 🔐 **Adım 2: Authentication Kurulumu**

1. Sol menüden **"Authentication"** seçin
2. **"Başlayın"** butonuna tıklayın
3. **"Sign-in method"** sekmesine gidin
4. **"Email/Password"** sağlayıcısını etkinleştirin
5. **"Kaydet"** butonuna tıklayın

## 🗄️ **Adım 3: Firestore Database Kurulumu**

1. Sol menüden **"Firestore Database"** seçin
2. **"Veritabanı oluştur"** butonuna tıklayın
3. **"Test modunda başlat"** seçeneğini seçin
4. Bölge olarak **"europe-west3"** (Frankfurt) seçin
5. **"Bitti"** butonuna tıklayın

## 📱 **Adım 4: Android Uygulaması Kurulumu**

✅ **Android uygulaması zaten kurulu!** `com.isinolsun` paket adı ile kurulmuş.

1. Proje genel bakış sayfasında **"Android"** simgesine tıklayın
2. Mevcut uygulama bilgilerini kontrol edin
3. Gerekirse ek konfigürasyon yapın

## ⚙️ **Adım 5: Konfigürasyon Bilgilerini Alma**

✅ **Konfigürasyon tamamlandı!** `google-services.json` dosyasından bilgiler alındı.

Mevcut konfigürasyon:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBbXE8wdDyaipQwS5ZbfIeWHWwtO9P1qiA",
  authDomain: "isinolsun-5aa3f.firebaseapp.com",
  projectId: "isinolsun-5aa3f",
  storageBucket: "isinolsun-5aa3f.firebasestorage.app",
  messagingSenderId: "653698538472",
  appId: "1:653698538472:android:e2ecb937bf24f521e2a25d",
  databaseURL: "https://isinolsun-5aa3f-default-rtdb.firebaseio.com"
};
```

## 🔧 **Adım 6: Konfigürasyon Dosyasını Güncelleme**

✅ **Konfigürasyon dosyası güncellendi!** `src/config/firebase.ts` dosyası `google-services.json`'daki bilgilerle otomatik olarak güncellendi.

## 🚀 **Adım 7: Güvenlik Kuralları**

Firestore Database > Rules sekmesinde aşağıdaki kuralları ekleyin:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Kullanıcılar kendi verilerini okuyabilir ve yazabilir
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // İşler herkes tarafından okunabilir, sadece sahibi yazabilir
    match /jobs/{jobId} {
      allow read: if true;
      allow write: if request.auth != null && 
        (request.auth.uid == resource.data.employerId || 
         request.auth.uid == resource.data.workerId);
    }
    
    // Mesajlar sadece katılımcılar tarafından okunabilir ve yazılabilir
    match /messages/{messageId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.senderId || 
         request.auth.uid == resource.data.receiverId);
    }
  }
}
```

## 📊 **Adım 8: Test Verilerini Ekleme**

Uygulamayı test etmek için örnek veriler ekleyin:

### Kullanıcı Örneği:
```javascript
{
  "uid": "test-user-1",
  "email": "test@example.com",
  "name": "Test Kullanıcı",
  "memberSince": "2024-01-01T00:00:00Z",
  "rating": 4.8,
  "completedJobs": 12,
  "totalEarnings": 2500,
  "activeJobs": 3,
  "skills": []
}
```

### İş Örneği:
```javascript
{
  "title": "Ev Temizliği",
  "description": "3+1 ev temizliği gerekli",
  "category": "Ev Temizliği",
  "location": "İstanbul, Kadıköy",
  "price": 200,
  "priceType": "fixed",
  "employerId": "test-user-1",
  "employerName": "Test Kullanıcı",
  "status": "active",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

## ✅ **Adım 9: Test Etme**

1. Uygulamayı başlatın: `npx expo start`
2. Kayıt olun ve giriş yapın
3. Verilerin Firebase'e kaydedildiğini kontrol edin
4. Firestore Console'da verileri görüntüleyin

## 🚀 **Hızlı Test**

Firebase konfigürasyonu hazır! Şimdi test edebilirsiniz:

```bash
# Uygulamayı başlat
npx expo start

# QR kodu tarayın ve test edin
```

## 🚨 **Önemli Notlar**

- **Test modunda** başlattığınız için güvenlik kuralları geçerli değil
- **Production** için güvenlik kurallarını güncelleyin
- **API anahtarlarını** güvenli tutun
- **Firebase planını** kullanım miktarına göre seçin

## 🔗 **Faydalı Linkler**

- [Firebase Dokümantasyonu](https://firebase.google.com/docs)
- [Firebase Pricing](https://firebase.google.com/pricing)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
