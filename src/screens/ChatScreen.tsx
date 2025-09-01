import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MessageService, Message, ChatRoom } from '../services/messageService';
import { auth } from '../config/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { onSnapshot, collection, query, where, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Timestamp } from 'firebase/firestore';

interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Date | Timestamp;
  isOwn: boolean;
}

export default function ChatScreen({ route, navigation }: any) {
  const { conversationId, otherUserId, jobId, jobTitle } = route.params;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [conversation, setConversation] = useState<ChatRoom | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  // Auth state'i dinle
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        Alert.alert('Hata', 'Mesajlaşmak için giriş yapmanız gerekiyor!');
        navigation.navigate('Login');
      } else {
        fetchConversation();
        setupMessageListener();
      }
    });

    return () => unsubscribe();
  }, [navigation]);

  // Konuşma bilgilerini al
  const fetchConversation = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      console.log('💬 Konuşma bilgileri alınıyor...');
      
      const chatRoom = await MessageService.getChatRoom(conversationId);
      if (chatRoom) {
        setConversation(chatRoom);
        console.log('✅ Konuşma bilgileri alındı:', chatRoom);
      } else {
        // Yeni konuşma oluştur
        const newChatRoom = await MessageService.createChatRoom(
          currentUser.uid,
          otherUserId,
          jobId,
          jobTitle
        );
        setConversation(newChatRoom);
        console.log('✅ Yeni konuşma oluşturuldu:', newChatRoom);
      }
    } catch (error: any) {
      console.error('❌ Konuşma bilgileri alma hatası:', error);
      Alert.alert('Hata', 'Konuşma bilgileri alınamadı: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  // Real-time mesaj dinleme
  const setupMessageListener = () => {
    if (!conversationId) return;

    console.log('🔔 Real-time mesaj dinleme başlatılıyor...');
    
    const messagesQuery = query(
      collection(db, 'messages'),
      where('chatRoomId', '==', conversationId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const newMessages: ChatMessage[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const message: ChatMessage = {
          id: doc.id,
          text: data.text,
          senderId: data.senderId,
          senderName: data.senderName,
          timestamp: data.timestamp,
          isOwn: data.senderId === currentUser?.uid
        };
        newMessages.push(message);
      });

      console.log('🔄 Real-time mesaj güncelleme:', newMessages.length, 'mesaj');
      setMessages(newMessages);
      
      // Otomatik scroll
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, (error) => {
      console.error('❌ Real-time mesaj dinleme hatası:', error);
    });

    return () => {
      console.log('🔕 Real-time mesaj dinleme durduruldu');
      unsubscribe();
    };
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !currentUser || !conversationId) return;

    try {
      setSending(true);
      console.log('📤 Mesaj gönderiliyor...');
      
      const messageData = {
        text: inputText.trim(),
        senderId: currentUser.uid,
        senderName: currentUser.email?.split('@')[0] || 'Kullanıcı',
        chatRoomId: conversationId,
        timestamp: serverTimestamp(),
        jobId: jobId,
        jobTitle: jobTitle
      };

      // Firestore'a mesaj kaydet
      await MessageService.sendChatMessage(messageData);
      
      // Chat room'u güncelle
      if (conversation) {
        await MessageService.updateChatRoom(conversationId, {
          lastMessage: inputText.trim(),
          lastMessageTime: Timestamp.now(),
          unreadCount: (conversation.unreadCount || 0) + 1
        });
      }

      console.log('✅ Mesaj gönderildi');
      setInputText('');
      
    } catch (error: any) {
      console.error('❌ Mesaj gönderme hatası:', error);
      Alert.alert('Hata', 'Mesaj gönderilemedi: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: Date | Timestamp) => {
    if (!timestamp) return '';
    
    let date: Date;
    
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }

    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[
      styles.messageContainer,
      item.isOwn ? styles.ownMessage : styles.otherMessage
    ]}>
      <View style={[
        styles.messageBubble,
        item.isOwn ? styles.ownMessageBubble : styles.otherMessageBubble
      ]}>
        <Text style={[
          styles.messageText,
          item.isOwn ? styles.ownMessageText : styles.otherMessageText
        ]}>
          {item.text}
        </Text>
        <Text style={[
          styles.messageTime,
          item.isOwn ? styles.ownMessageTime : styles.otherMessageTime
        ]}>
          {formatTime(item.timestamp)}
        </Text>
      </View>
    </View>
  );

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Giriş yapılıyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Konuşma yükleniyor...</Text>
          <Text style={styles.loadingSubtext}>Firebase'den veriler alınıyor</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            {conversation?.participantNames?.find(name => name !== currentUser?.email?.split('@')[0]) || 'Kullanıcı'}
          </Text>
          <Text style={styles.headerSubtitle}>{jobTitle || 'İş'}</Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        ref={flatListRef}
        showsVerticalScrollIndicator={false}
      />

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Mesajınızı yazın..."
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.sendButtonText}>📤</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 160, // Input alanı için çok daha fazla alt boşluk
    paddingTop: 8,
  },
  messageContainer: {
    marginBottom: 8, // 12'den 8'e düşürüldü
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
  },
  ownMessageBubble: {
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 6,
  },
  otherMessageBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#1F2937',
  },
  messageTime: {
    fontSize: 12,
    alignSelf: 'flex-end',
  },
  ownMessageTime: {
    color: '#DBEAFE',
  },
  otherMessageTime: {
    color: '#9CA3AF',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 12,
    paddingBottom: 80, // Telefon butonları ile arasında çok daha fazla boşluk
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'flex-end',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flex: 1,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 80,
    fontSize: 16,
    marginRight: 12,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  sendButtonText: {
    fontSize: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: '#1F2937',
  },
  loadingSubtext: {
    marginTop: 5,
    fontSize: 14,
    color: '#6B7280',
  },
});
