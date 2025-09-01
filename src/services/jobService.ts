import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy,
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Job {
  id?: string;
  title: string;
  description: string;
  category: string;
  location: string;
  price: number;
  priceType: 'hourly' | 'fixed';
  ownerId: string;
  employerName: string;
  status: 'active' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Date | Timestamp;

  requirements?: string[];
  images?: string[];
  workerId?: string;
  workerName?: string;
  completedAt?: Date;
  rating?: number;
  review?: string;
}

export class JobService {
  // Yeni iş oluştur
  static async createJob(jobData: Omit<Job, 'id' | 'createdAt'>): Promise<string> {
    try {
      const jobWithTimestamp = {
        ...jobData,
        createdAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, 'jobs'), jobWithTimestamp);
      return docRef.id;
    } catch (error) {
      console.error('İş oluşturma hatası:', error);
      throw error;
    }
  }

  // Tüm aktif işleri al
  static async getActiveJobs(): Promise<Job[]> {
    try {
      const q = query(
        collection(db, 'jobs'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const jobs: Job[] = [];
      
      querySnapshot.forEach((doc) => {
        jobs.push({
          id: doc.id,
          ...doc.data()
        } as Job);
      });
      
      return jobs;
    } catch (error) {
      console.error('Aktif işleri alma hatası:', error);
      return [];
    }
  }

  // Kategoriye göre işleri al
  static async getJobsByCategory(category: string): Promise<Job[]> {
    try {
      const q = query(
        collection(db, 'jobs'),
        where('category', '==', category),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const jobs: Job[] = [];
      
      querySnapshot.forEach((doc) => {
        jobs.push({
          id: doc.id,
          ...doc.data()
        } as Job);
      });
      
      return jobs;
    } catch (error) {
      console.error('Kategori işleri alma hatası:', error);
      return [];
    }
  }

  // Kullanıcının işlerini al
  static async getUserJobs(userId: string, type: 'employer' | 'worker'): Promise<Job[]> {
    try {
      let field = type === 'employer' ? 'employerId' : 'workerId';
      const q = query(
        collection(db, 'jobs'),
        where(field, '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const jobs: Job[] = [];
      
      querySnapshot.forEach((doc) => {
        jobs.push({
          id: doc.id,
          ...doc.data()
        } as Job);
      });
      
      return jobs;
    } catch (error) {
      console.error('Kullanıcı işleri alma hatası:', error);
      return [];
    }
  }

  // İş detayını al
  static async getJobById(jobId: string): Promise<Job | null> {
    try {
      const docRef = doc(db, 'jobs', jobId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Job;
      }
      
      return null;
    } catch (error) {
      console.error('İş detayı alma hatası:', error);
      return null;
    }
  }

  // İş durumunu güncelle
  static async updateJobStatus(jobId: string, status: Job['status'], workerId?: string, workerName?: string): Promise<void> {
    try {
      const jobRef = doc(db, 'jobs', jobId);
      const updateData: any = { status };
      
      if (workerId && workerName) {
        updateData.workerId = workerId;
        updateData.workerName = workerName;
      }
      
      if (status === 'completed') {
        updateData.completedAt = Timestamp.now();
      }
      
      await updateDoc(jobRef, updateData);
    } catch (error) {
      console.error('İş durumu güncelleme hatası:', error);
      throw error;
    }
  }

  // İşi iptal et
  static async cancelJob(jobId: string): Promise<void> {
    try {
      const jobRef = doc(db, 'jobs', jobId);
      await updateDoc(jobRef, { status: 'cancelled' });
    } catch (error) {
      console.error('İş iptal hatası:', error);
      throw error;
    }
  }

  // İşi sil
  static async deleteJob(jobId: string): Promise<void> {
    try {
      const jobRef = doc(db, 'jobs', jobId);
      await deleteDoc(jobRef);
    } catch (error) {
      console.error('İş silme hatası:', error);
      throw error;
    }
  }
}
