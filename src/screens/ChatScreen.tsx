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
} from 'react-native';
import { mockConversations, mockUserProfile } from '../data/mockData';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  isOwn: boolean;
}

export default function ChatScreen({ route, navigation }: any) {
  const { conversationId } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [conversation, setConversation] = useState<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Mock conversation data
    const conv = mockConversations.find(c => c.id === conversationId);
    setConversation(conv);

    // Mock messages
    const mockMessages: Message[] = [
      {
        id: '1',
        text: 'Merhaba! İş hakkında bilgi alabilir miyim?',
        senderId: 'emp1',
        senderName: 'Ayşe Yılmaz',
        timestamp: new Date('2025-01-14T15:30:00'),
        isOwn: false,
      },
      {
        id: '2',
        text: 'Tabii ki! Hangi konuda yardıma ihtiyacınız var?',
        senderId: 'user1',
        senderName: mockUserProfile.name,
        timestamp: new Date('2025-01-14T15:32:00'),
        isOwn: true,
      },
      {
        id: '3',
        text: 'Yarın gelmeyi planladığınız saat uygun mu?',
        senderId: 'emp1',
        senderName: 'Ayşe Yılmaz',
        timestamp: new Date('2025-01-14T15:35:00'),
        isOwn: false,
      },
    ];
    setMessages(mockMessages);
  }, [conversationId]);

  const sendMessage = () => {
    if (inputText.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: inputText.trim(),
        senderId: 'user1',
        senderName: mockUserProfile.name,
        timestamp: new Date(),
        isOwn: true,
      };
      
      setMessages(prev => [...prev, newMessage]);
      setInputText('');
      
      // Auto-scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.isOwn ? styles.ownMessage : styles.otherMessage
    ]}>
      <View style={[
        styles.messageBubble,
        item.isOwn ? styles.ownBubble : styles.otherBubble
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

  if (!conversation) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Konuşma bulunamadı</Text>
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
          <Text style={styles.backButtonText}>← Geri</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{conversation.participantName}</Text>
          <Text style={styles.headerJob}>{conversation.jobTitle}</Text>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View key={message.id}>
              {renderMessage({ item: message })}
            </View>
          ))}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Mesajınızı yazın..."
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendButtonText}>📤</Text>
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
  headerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerJob: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  keyboardView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 80, // Input alanı için alt boşluk
    paddingTop: 8, // Üstten de az boşluk
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
  ownBubble: {
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 6,
  },
  otherBubble: {
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
    padding: 4, // 8'den 4'e düşürüldü
    paddingTop: 2, // 4'ten 2'ye düşürüldü
    paddingBottom: 20, // Telefon butonları ile iç içe girmesin
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'flex-end',
    position: 'absolute', // Mutlak pozisyon
    bottom: 0, // En altta
    left: 0,
    right: 0,
    zIndex: 1000, // Üstte görünmesi için
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 4, // 6'dan 4'e düşürüldü
    maxHeight: 60, // 80'den 60'a düşürüldü
    fontSize: 16,
    marginRight: 12,
  },
  sendButton: {
    width: 36, // 40'tan 36'ya düşürüldü
    height: 36, // 40'tan 36'ya düşürüldü
    borderRadius: 18, // 20'den 18'e düşürüldü
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
});
