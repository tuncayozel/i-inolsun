import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Job, formatPrice, formatDate } from '../data/mockData';

const JobDetailScreen = ({ route, navigation }: any) => {
  const { job }: { job: Job } = route.params;

  const handleApplyJob = () => {
    Alert.alert(
      'İş Başvurusu',
      `"${job.title}" işine başvurmak istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Başvur', 
          onPress: () => {
            Alert.alert('Başarılı', 'Başvurunuz gönderildi! İşveren sizinle iletişime geçecektir.');
          }
        }
      ]
    );
  };

  const handleMessageEmployer = () => {
    Alert.alert('Mesaj', 'Mesajlaşma özelliği geliştirilme aşamasında...');
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'in-progress': return 'Devam Ediyor';
      case 'completed': return 'Tamamlandı';
      default: return status;
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'active': return { backgroundColor: '#DBEAFE' };
      case 'in-progress': return { backgroundColor: '#FEF3C7' };
      case 'completed': return { backgroundColor: '#D1FAE5' };
      default: return { backgroundColor: '#F3F4F6' };
    }
  };

  const getStatusTextStyle = (status: string) => {
    switch (status) {
      case 'active': return { color: '#1D4ED8' };
      case 'in-progress': return { color: '#D97706' };
      case 'completed': return { color: '#059669' };
      default: return { color: '#6B7280' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{job.title}</Text>
            <View style={[styles.statusBadge, getStatusBadgeStyle(job.status)]}>
              <Text style={[styles.statusText, getStatusTextStyle(job.status)]}>
                {getStatusLabel(job.status)}
              </Text>
            </View>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Kategori:</Text>
              <Text style={styles.infoValue}>{job.category}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Konum:</Text>
              <Text style={styles.infoValue}>{job.location}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tarih:</Text>
              <Text style={styles.infoValue}>{job.date}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Saat:</Text>
              <Text style={styles.infoValue}>{job.time}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Fiyat:</Text>
              <Text style={styles.priceValue}>{formatPrice(job.price)}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>İşveren:</Text>
              <Text style={styles.infoValue}>{job.employerName}</Text>
            </View>
          </View>

          {job.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Açıklama</Text>
              <Text style={styles.description}>{job.description}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.messageButton}
          onPress={handleMessageEmployer}
        >
          <Text style={styles.messageButtonText}>💬 Mesaj Gönder</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.applyButton}
          onPress={handleApplyJob}
        >
          <Text style={styles.applyButtonText}>Başvur</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
    lineHeight: 32,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  infoLabel: {
    fontSize: 16,
    color: '#6C757D',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  priceValue: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  descriptionSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#495057',
    lineHeight: 24,
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    gap: 12,
  },
  messageButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  messageButtonText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default JobDetailScreen;
