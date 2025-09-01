// Mock veri katmanı - gerçek projede Firebase/API'den gelecek
export interface Job {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  price: number;
  date: string;
  time: string;
  status: 'active' | 'completed' | 'in-progress';
  employerName: string;
  employerId: string;
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

export interface Conversation {
  id: string;
  participantName: string;
  participantId: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  jobTitle: string;
}

export const mockCategories: Category[] = [
  { id: '1', name: 'Temizlik', icon: '🧽', color: '#3B82F6' },
  { id: '2', name: 'Taşıma', icon: '📦', color: '#10B981' },
  { id: '3', name: 'Montaj', icon: '🔧', color: '#F59E0B' },
  { id: '4', name: 'Grafik', icon: '🎨', color: '#EF4444' },
  { id: '5', name: 'Yazılım', icon: '💻', color: '#8B5CF6' },
  { id: '6', name: 'Eğitim', icon: '📚', color: '#06B6D4' },
  { id: '7', name: 'Bakım', icon: '⚙️', color: '#84CC16' },
  { id: '8', name: 'Diğer', icon: '📋', color: '#6B7280' },
];

export const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Ev Temizliği - Haftalık',
    description: '3+1 dairede haftalık genel temizlik. Mutfak, banyo ve odaların temizlenmesi. Temizlik malzemeleri tarafımızdan sağlanacak.',
    category: 'Temizlik',
    location: 'Kadıköy, İstanbul',
    price: 150,
    date: '2025-01-15',
    time: '10:00',
    status: 'active',
    employerName: 'Ayşe Yılmaz',
    employerId: 'emp1',
    createdAt: new Date('2025-01-10'),
  },
  {
    id: '2',
    title: 'Logo Tasarımı',
    description: 'Yeni kurduğumuz şirket için modern ve profesyönel logo tasarımı. AI, PSD ve PNG formatlarında teslim edilmesi gerekiyor.',
    category: 'Grafik',
    location: 'Online',
    price: 500,
    date: '2025-01-20',
    time: '14:00',
    status: 'active',
    employerName: 'Mehmet Can',
    employerId: 'emp2',
    createdAt: new Date('2025-01-12'),
  },
  {
    id: '3',
    title: 'Mobilya Montajı',
    description: 'IKEA\'dan aldığım yatak odası takımının montajı. Yaklaşık 4-5 saatlik iş. Tüm parçalar ve vidalar mevcut.',
    category: 'Montaj',
    location: 'Şişli, İstanbul',
    price: 200,
    date: '2025-01-18',
    time: '09:00',
    status: 'in-progress',
    employerName: 'Zehra Kaya',
    employerId: 'emp3',
    createdAt: new Date('2025-01-11'),
  },
  {
    id: '4',
    title: 'İngilizce Özel Ders',
    description: 'Üniversite öğrencisiyim. IELTS sınavına hazırlanıyorum. Haftada 2 gün online İngilizce dersi.',
    category: 'Eğitim',
    location: 'Online',
    price: 100,
    date: '2025-01-16',
    time: '19:00',
    status: 'completed',
    employerName: 'Burak Özkan',
    employerId: 'emp4',
    createdAt: new Date('2025-01-13'),
  },
  {
    id: '5',
    title: 'Ofis Taşıma',
    description: 'Küçük ofisimizi taşıyacağız. Yaklaşık 20 koli ve birkaç ofis mobilyası var. Araç sizden.',
    category: 'Taşıma',
    location: 'Beşiktaş → Levent',
    price: 300,
    date: '2025-01-22',
    time: '08:00',
    status: 'active',
    employerName: 'Selin Ak',
    employerId: 'emp5',
    createdAt: new Date('2025-01-14'),
  },
];

export const mockConversations: Conversation[] = [
  {
    id: '1',
    participantName: 'Ayşe Yılmaz',
    participantId: 'emp1',
    lastMessage: 'Yarın gelmeyi planladığınız saat uygun mu?',
    lastMessageTime: new Date('2025-01-14T15:30:00'),
    unreadCount: 2,
    jobTitle: 'Ev Temizliği - Haftalık',
  },
  {
    id: '2',
    participantName: 'Mehmet Can',
    participantId: 'emp2',
    lastMessage: 'Logo örneklerini beğendim, değişiklik önerim var.',
    lastMessageTime: new Date('2025-01-14T12:15:00'),
    unreadCount: 0,
    jobTitle: 'Logo Tasarımı',
  },
  {
    id: '3',
    participantName: 'Zehra Kaya',
    participantId: 'emp3',
    lastMessage: 'Montaj tamamlandı, çok teşekkürler!',
    lastMessageTime: new Date('2025-01-13T16:45:00'),
    unreadCount: 0,
    jobTitle: 'Mobilya Montajı',
  },
];

export const mockUserProfile = {
  id: 'user1',
  name: 'Ali Demir',
  email: 'ali.demir@email.com',
  phone: '0532 123 45 67',
  location: 'İstanbul',
  rating: 4.8,
  completedJobs: 23,
  totalEarnings: 3450,
  memberSince: new Date('2024-06-15'),
  skills: ['Temizlik', 'Montaj', 'Taşıma'],
  bio: 'Güvenilir ve titiz çalışan biriyim. Müşteri memnuniyeti önceliğimdir.',
};

// Utility functions
export const getJobsByCategory = (categoryName: string): Job[] => {
  return mockJobs.filter(job => job.category === categoryName);
};

export const getActiveJobs = (): Job[] => {
  return mockJobs.filter(job => job.status === 'active');
};

export const getJobById = (id: string): Job | undefined => {
  return mockJobs.find(job => job.id === id);
};

export const formatPrice = (price: number): string => {
  return `${price.toLocaleString('tr-TR')} TL`;
};

export const formatDate = (date: string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('tr-TR', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
};
