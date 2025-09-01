import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp,
  onSnapshot,
  Unsubscribe,
  doc,
  getDoc,
  updateDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Message {
  id?: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  content: string;
  timestamp: Date | Timestamp;
  read: boolean;
  jobId?: string;
  jobTitle?: string;
}

// Chat mesajları için yeni interface
export interface ChatMessage {
  id?: string;
  text: string;
  senderId: string;
  senderName: string;
  chatRoomId: string;
  timestamp: Date | Timestamp;
  jobId?: string;
  jobTitle?: string;
}

export interface ChatRoom {
  id: string;
  participants: string[];
  participantNames: string[];
  lastMessage: string;
  lastMessageTime: Date | Timestamp;
  unreadCount: number;
  jobId?: string;
  jobTitle?: string;
}

export class MessageService {
  // Yeni mesaj gönder (eski interface için)
  static async sendMessage(messageData: Omit<Message, 'id' | 'timestamp' | 'read'>): Promise<string> {
    try {
      const messageWithTimestamp = {
        ...messageData,
        timestamp: Timestamp.now(),
        read: false
      };
      
      const docRef = await addDoc(collection(db, 'messages'), messageWithTimestamp);
      return docRef.id;
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      throw error;
    }
  }

  // Chat mesajı gönder (yeni interface için)
  static async sendChatMessage(messageData: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<string> {
    try {
      const messageWithTimestamp = {
        ...messageData,
        timestamp: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, 'messages'), messageWithTimestamp);
      return docRef.id;
    } catch (error) {
      console.error('Chat mesajı gönderme hatası:', error);
      throw error;
    }
  }

  // Chat room'u ID ile al
  static async getChatRoom(chatRoomId: string): Promise<ChatRoom | null> {
    try {
      const docRef = doc(db, 'chatRooms', chatRoomId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as ChatRoom;
      }
      return null;
    } catch (error) {
      console.error('Chat room alma hatası:', error);
      return null;
    }
  }

  // Yeni chat room oluştur
  static async createChatRoom(user1Id: string, user2Id: string, jobId: string, jobTitle: string): Promise<ChatRoom> {
    try {
      const chatRoomData = {
        participants: [user1Id, user2Id],
        participantNames: [user1Id.split('@')[0], user2Id.split('@')[0]],
        lastMessage: '',
        lastMessageTime: Timestamp.now(),
        unreadCount: 0,
        jobId,
        jobTitle
      };

      const docRef = await addDoc(collection(db, 'chatRooms'), chatRoomData);
      
      return {
        id: docRef.id,
        ...chatRoomData
      } as ChatRoom;
    } catch (error) {
      console.error('Chat room oluşturma hatası:', error);
      throw error;
    }
  }

  // Chat room'u güncelle
  static async updateChatRoom(chatRoomId: string, updates: Partial<ChatRoom>): Promise<void> {
    try {
      const docRef = doc(db, 'chatRooms', chatRoomId);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Chat room güncelleme hatası:', error);
      throw error;
    }
  }

  // İki kullanıcı arasındaki mesajları al
  static async getMessagesBetweenUsers(user1Id: string, user2Id: string, limitCount: number = 50): Promise<Message[]> {
    try {
      const q = query(
        collection(db, 'messages'),
        where('senderId', 'in', [user1Id, user2Id]),
        where('receiverId', 'in', [user1Id, user2Id]),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const messages: Message[] = [];
      
      querySnapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data()
        } as Message);
      });
      
      // Mesajları tarihe göre sırala (en eski önce)
      return messages.reverse();
    } catch (error) {
      console.error('Mesajları alma hatası:', error);
      return [];
    }
  }

  // Kullanıcının tüm sohbet odalarını al
  static async getUserChatRooms(userId: string): Promise<ChatRoom[]> {
    try {
      const q = query(
        collection(db, 'messages'),
        where('senderId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const chatRooms = new Map<string, ChatRoom>();
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const chatRoomId = data.chatRoomId || `${userId}_${data.receiverId}`;
        
        if (!chatRooms.has(chatRoomId)) {
          chatRooms.set(chatRoomId, {
            id: chatRoomId,
            participants: [userId, data.receiverId],
            participantNames: [userId.split('@')[0], data.receiverName],
            lastMessage: data.content,
            lastMessageTime: data.timestamp,
            unreadCount: 0,
            jobId: data.jobId,
            jobTitle: data.jobTitle
          });
        }
      });
      
      return Array.from(chatRooms.values());
    } catch (error) {
      console.error('Chat room\'ları alma hatası:', error);
      return [];
    }
  }

  // Kullanıcının tüm chat room'larını al (yeni method)
  static async getChatRooms(userId: string): Promise<ChatRoom[]> {
    try {
      const q = query(
        collection(db, 'chatRooms'),
        where('participants', 'array-contains', userId),
        orderBy('lastMessageTime', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const chatRooms: ChatRoom[] = [];
      
      querySnapshot.forEach((doc) => {
        chatRooms.push({
          id: doc.id,
          ...doc.data()
        } as ChatRoom);
      });
      
      return chatRooms;
    } catch (error) {
      console.error('Chat room\'ları alma hatası:', error);
      return [];
    }
  }

  // Mesajları chat room ID ile al
  static async getMessagesByChatRoom(chatRoomId: string, limitCount: number = 50): Promise<ChatMessage[]> {
    try {
      const q = query(
        collection(db, 'messages'),
        where('chatRoomId', '==', chatRoomId),
        orderBy('timestamp', 'asc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const messages: ChatMessage[] = [];
      
      querySnapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data()
        } as ChatMessage);
      });
      
      return messages;
    } catch (error) {
      console.error('Chat room mesajlarını alma hatası:', error);
      return [];
    }
  }

  // Mesajı okundu olarak işaretle
  static async markMessageAsRead(messageId: string): Promise<void> {
    try {
      const docRef = doc(db, 'messages', messageId);
      await updateDoc(docRef, { read: true });
    } catch (error) {
      console.error('Mesaj okundu işaretleme hatası:', error);
      throw error;
    }
  }

  // Kullanıcının okunmamış mesaj sayısını al
  static async getUnreadMessageCount(userId: string): Promise<number> {
    try {
      const q = query(
        collection(db, 'messages'),
        where('receiverId', '==', userId),
        where('read', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Okunmamış mesaj sayısı alma hatası:', error);
      return 0;
    }
  }

  // Real-time mesaj dinleme
  static listenToMessages(chatRoomId: string, callback: (messages: ChatMessage[]) => void): Unsubscribe {
    const q = query(
      collection(db, 'messages'),
      where('chatRoomId', '==', chatRoomId),
      orderBy('timestamp', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data()
        } as ChatMessage);
      });
      callback(messages);
    });
  }

  // Real-time chat room dinleme
  static listenToChatRooms(userId: string, callback: (chatRooms: ChatRoom[]) => void): Unsubscribe {
    const q = query(
      collection(db, 'chatRooms'),
      where('participants', 'array-contains', userId),
      orderBy('lastMessageTime', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const chatRooms: ChatRoom[] = [];
      snapshot.forEach((doc) => {
        chatRooms.push({
          id: doc.id,
          ...doc.data()
        } as ChatRoom);
      });
      callback(chatRooms);
    });
  }
}
