import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile,
  User,
  UserCredential 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export interface UserData {
  uid: string;
  email: string;
  name: string;
  phone?: string;
  location?: string;
  memberSince: Date;
  rating: number;
  completedJobs: number;
  totalEarnings: number;
  activeJobs: number;
  skills: Array<{
    name: string;
    level: string;
    experience: string;
    description: string;
    certificates: string[];
  }>;
  profileImage?: string;
}

export class AuthService {
  // Kullanıcı kaydı
  static async register(email: string, password: string, name: string): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Kullanıcı profilini güncelle
      await updateProfile(userCredential.user, {
        displayName: name
      });

      // Firestore'da kullanıcı dokümanı oluştur
      const userData: UserData = {
        uid: userCredential.user.uid,
        email: email,
        name: name,
        memberSince: new Date(),
        rating: 0,
        completedJobs: 0,
        totalEarnings: 0,
        activeJobs: 0,
        skills: []
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userData);

      return userCredential;
    } catch (error) {
      console.error('Kayıt hatası:', error);
      throw error;
    }
  }

  // Kullanıcı girişi
  static async login(email: string, password: string): Promise<UserCredential> {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Giriş hatası:', error);
      throw error;
    }
  }

  // Kullanıcı çıkışı
  static async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Çıkış hatası:', error);
      throw error;
    }
  }

  // Mevcut kullanıcıyı al
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // Kullanıcı verilerini Firestore'dan al
  static async getUserData(uid: string): Promise<UserData | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserData;
      }
      return null;
    } catch (error) {
      console.error('Kullanıcı verisi alma hatası:', error);
      return null;
    }
  }

  // Kullanıcı verilerini güncelle
  static async updateUserData(uid: string, data: Partial<UserData>): Promise<void> {
    try {
      await setDoc(doc(db, 'users', uid), data, { merge: true });
    } catch (error) {
      console.error('Kullanıcı verisi güncelleme hatası:', error);
      throw error;
    }
  }
}
