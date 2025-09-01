import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { MessageService, ChatRoom } from '../services/messageService';

export default function MessagesScreen({ navigation }: any) {
  const [conversations, setConversations] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Auth state'i dinle
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        console.log('👤 Kullanıcı giriş yapmış, konuşmalar yükleniyor...');
        fetchConversations(user.uid);
      } else {
        console.log('❌ Kullanıcı giriş yapmamış');
        setConversations([]);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const fetchConversations = async (userId: string) => {
    try {
      console.log('🔍 Konuşmalar Firebase\'den alınıyor...');
      setLoading(true);

      // Chat rooms'ları real-time dinle
      const q = query(
        collection(db, 'chatRooms'),
        where('participants', 'array-contains', userId),
        orderBy('lastMessageTime', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const chatRooms: ChatRoom[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          const chatRoom: ChatRoom = {
            id: doc.id,
            participants: data.participants || [],
            participantNames: data.participantNames || [],
            lastMessage: data.lastMessage || '',
            lastMessageTime: data.lastMessageTime || Timestamp.now(),
            unreadCount: data.unreadCount || 0,
            jobId: data.jobId || '',
            jobTitle: data.jobTitle || ''
          };
          chatRooms.push(chatRoom);
        });

        console.log('✅ Konuşmalar alındı:', chatRooms.length, 'konuşma');
        setConversations(chatRooms);
        setLoading(false);
      }, (error) => {
        console.error('❌ Konuşmalar alma hatası:', error);
        setLoading(false);
      });

      return unsubscribe;
    } catch (error: any) {
      console.error('❌ Konuşmalar alma hatası:', error);
      setLoading(false);
    }
  };

  const onRefresh = () => {
    if (currentUser) {
      setRefreshing(true);
      fetchConversations(currentUser.uid).then(() => {
        setRefreshing(false);
      });
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Az önce';
    
    let date: Date;
    
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Az önce';
    if (hours < 24) return `${hours} saat önce`;
    
    const diffInDays = Math.floor(hours / 24);
    if (diffInDays < 7) return `${diffInDays} gün önce`;
    
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
  };

  const getParticipantName = (chatRoom: ChatRoom) => {
    if (!currentUser) return 'Kullanıcı';
    
    const otherParticipant = chatRoom.participants.find(id => id !== currentUser.uid);
    if (otherParticipant) {
      // Email'den kullanıcı adını çıkar
      return otherParticipant.split('@')[0];
    }
    return 'Kullanıcı';
  };

  const renderConversation = ({ item }: { item: ChatRoom }) => (
    <TouchableOpacity
      style={styles.conversationCard}
      onPress={() => {
        console.log('💬 Konuşma açılıyor:', item.id);
        navigation.navigate('Chat', { 
          conversationId: item.id,
          otherUserId: item.participants.find(id => id !== currentUser?.uid) || '',
          participantName: getParticipantName(item),
          jobId: item.jobId,
          jobTitle: item.jobTitle
        });
      }}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {getParticipantName(item).charAt(0).toUpperCase()}
        </Text>
      </View>
      
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.participantName} numberOfLines={1}>
            {getParticipantName(item)}
          </Text>
          <Text style={styles.timestamp}>
            {formatTime(item.lastMessageTime)}
          </Text>
        </View>
        
        {item.jobTitle && (
          <Text style={styles.jobTitle} numberOfLines={1}>
            {item.jobTitle}
          </Text>
        )}
        
        <Text style={styles.lastMessage} numberOfLines={2}>
          {item.lastMessage || 'Henüz mesaj yok'}
        </Text>
      </View>
      
      {item.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadCount}>
            {item.unreadCount > 99 ? '99+' : item.unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>💬 Mesajlar</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Konuşmalar yükleniyor...</Text>
          <Text style={styles.loadingSubtext}>Firebase'den veriler alınıyor</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>💬 Mesajlar</Text>
        <Text style={styles.subtitle}>
          {conversations.length} konuşma
        </Text>
      </View>

      {/* Conversations List */}
      {conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTitle}>Henüz mesajınız yok</Text>
          <Text style={styles.emptySubtext}>
            İş başvuruları yapın veya ilan verin, mesajlaşmaya başlayın
          </Text>
          
          <View style={styles.emptyActions}>
            <TouchableOpacity
              style={styles.emptyActionButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.emptyActionButtonText}>İş Ara</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.emptyActionButton}
              onPress={() => navigation.navigate('PostJob')}
            >
              <Text style={styles.emptyActionButtonText}>İlan Aç</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => `chat-${item.id}`}
          contentContainerStyle={styles.conversationsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2563EB']}
              tintColor="#2563EB"
            />
          }
        />
      )}
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
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  conversationsList: {
    paddingHorizontal: 20,
  },
  conversationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  timestamp: {
    fontSize: 12,
    color: '#6B7280',
  },
  jobTitle: {
    fontSize: 12,
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyActions: {
    flexDirection: 'row',
    marginTop: 20,
    width: '100%',
    justifyContent: 'space-around',
  },
  emptyActionButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyActionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 10,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 5,
  },
});


