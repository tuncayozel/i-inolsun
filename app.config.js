module.exports = {
  expo: {
    name: "İşin Olsun",
    slug: "isinolsun",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.isinolsun.app",
      buildNumber: "1.0.0",
      infoPlist: {
        NSCameraUsageDescription: "İş ilanlarına fotoğraf eklemek için kamera erişimi gerekiyor",
        NSPhotoLibraryUsageDescription: "İş ilanlarına fotoğraf eklemek için galeri erişimi gerekiyor"
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      },
      package: "com.isinolsun.app",
      versionCode: 1,
      permissions: [
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE"
      ]
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    plugins: [
      "expo-build-properties"
    ],
    extra: {
      eas: {
        projectId: "fbc8d669-043d-4d3a-a597-c050fb422c4d"
      }
    }
  }
};
