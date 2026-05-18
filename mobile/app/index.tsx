import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Plus, Package, Briefcase, ChevronRight, Calendar, Trash2, LogOut, Bell, BarChart2 } from 'lucide-react-native';
import api from '../src/services/api';

export default function DashboardScreen() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);

  const getNotifications = () => {
    const list: any[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    trips.forEach(trip => {
      const start = new Date(trip.start_date);
      start.setHours(0, 0, 0, 0);
      const diffTime = start.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        list.push({
          id: `time-${trip.id}`,
          icon: '⏰',
          title: `Trip to ${trip.destination.split(',')[0]} starts tomorrow!`,
          body: `Don't forget to double-check your checklist! You've packed ${trip.packed_items || 0}/${trip.total_items || 0} items.`,
          type: 'reminder'
        });
      } else if (diffDays > 1 && diffDays <= 3) {
        list.push({
          id: `time-${trip.id}`,
          icon: '⏰',
          title: `Trip to ${trip.destination.split(',')[0]} in ${diffDays} days!`,
          body: `Start planning your gear early so you don't miss anything.`,
          type: 'reminder'
        });
      }

      if (trip.weather_summary?.toLowerCase().includes('rain')) {
        list.push({
          id: `weather-${trip.id}`,
          icon: '☔',
          title: `Rain forecast in ${trip.destination.split(',')[0]}!`,
          body: `We detected rain forecast during your stay. Make sure you pack an umbrella or raincoat!`,
          type: 'weather'
        });
      }

      if (trip.travel_method === 'flight') {
        list.push({
          id: `flight-${trip.id}`,
          icon: '✈️',
          title: `Flight restrictions for ${trip.destination.split(',')[0]}`,
          body: `Airline rules: Power banks, laptops, and lithium batteries MUST be in your handcarry, NOT in checked luggage!`,
          type: 'flight'
        });
      }
    });

    if (list.length === 0) {
      list.push({
        id: 'welcome',
        icon: '🎉',
        title: 'Welcome to Packing Pal!',
        body: 'Create a new trip to generate smart checklists and receive real-time weather and flight rule notifications.',
        type: 'general'
      });
    }

    return list;
  };

  const notificationsList = getNotifications();
  const hasUnread = notificationsList.length > 0 && notificationsList[0].id !== 'welcome';

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Logout', 
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            router.replace('/login');
          } catch (e) {
            console.error(e);
          }
        }
      }
    ]);
  };

  const checkAuthAndFetch = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/login');
        return;
      }
      fetchTrips();
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      checkAuthAndFetch();
    }, [])
  );

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/trips');
      setTrips(data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        AsyncStorage.removeItem('token');
        router.replace('/login');
      } else {
        Alert.alert('Error', 'Failed to fetch trips. Check your backend connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteTrip = async (id: number) => {
    Alert.alert('Delete Trip', 'Are you sure you want to delete this trip?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/trips/${id}`);
            setTrips(trips.filter(t => t.id !== id));
          } catch (err) {
            Alert.alert('Error', 'Failed to delete trip');
          }
        }
      }
    ]);
  };

  const now = new Date();
  const upcomingTrips = trips.filter(trip => new Date(trip.end_date) >= now);
  const pastTrips = trips.filter(trip => new Date(trip.end_date) < now);

  const TripCard = ({ trip }: { trip: any }) => {
    const getCountdown = (startDateStr: string, endDateStr: string) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const start = new Date(startDateStr);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDateStr);
      end.setHours(0, 0, 0, 0);

      const diffTimeStart = start.getTime() - today.getTime();
      const diffDaysStart = Math.ceil(diffTimeStart / (1000 * 60 * 60 * 24));

      if (today >= start && today <= end) {
        return { text: 'Happening now', color: '#2563eb', bg: '#eff6ff' };
      } else if (today > end) {
        return { text: 'Completed', color: '#059669', bg: '#ecfdf5' };
      } else {
        if (diffDaysStart === 1) {
          return { text: 'Tomorrow', color: '#d97706', bg: '#fef3c7' };
        }
        return { text: `In ${diffDaysStart} days`, color: '#4b5563', bg: '#f3f4f6' };
      }
    };

    const getTravelIcon = (method: string) => {
      switch (method?.toLowerCase()) {
        case 'flight': return '✈️';
        case 'train': return '🚆';
        case 'road_trip': return '🚗';
        case 'cruise': return '🛳️';
        default: return '🧳';
      }
    };

    const countdown = getCountdown(trip.start_date, trip.end_date);
    const totalItems = trip.total_items ?? 0;
    const packedItems = trip.packed_items ?? 0;
    const progress = totalItems === 0 ? 0 : Math.round((packedItems / totalItems) * 100);

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => router.push(`/trip/${trip.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={styles.iconBox}>
              <Text style={{ fontSize: 20 }}>{getTravelIcon(trip.travel_method)}</Text>
            </View>
            <View style={[styles.countdownBadge, { backgroundColor: countdown.bg }]}>
              <Text style={[styles.countdownText, { color: countdown.color }]}>{countdown.text}</Text>
            </View>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity onPress={() => deleteTrip(trip.id)} style={styles.deleteBtn}>
              <Trash2 size={16} color="#ef4444" />
            </TouchableOpacity>
            <ChevronRight size={20} color="#9ca3af" />
          </View>
        </View>
        <Text style={styles.tripTitle}>{trip.destination}</Text>
        
        {totalItems > 0 && (
          <View style={styles.progressRow}>
            <View style={styles.progressMiniBarBg}>
              <View style={[styles.progressMiniBarFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressMiniText}>{packedItems}/{totalItems} packed</Text>
          </View>
        )}

        <View style={styles.tripMeta}>
          <View style={styles.metaRow}>
            <Calendar size={14} color="#6b7280" />
            <Text style={styles.metaText}>{new Date(trip.start_date).toLocaleDateString()}</Text>
          </View>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{trip.trip_type.toUpperCase()}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Notification Center Modal */}
      <Modal visible={showNotifications} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Smart Notification Center</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <Text style={styles.modalCloseTextHeader}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.notificationScroll}>
              {notificationsList.map(item => (
                <View key={item.id} style={styles.notificationCard}>
                  <View style={styles.notificationIconWrapper}>
                    <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                  </View>
                  <View style={styles.notificationBodyWrapper}>
                    <Text style={styles.notificationTitle}>{item.title}</Text>
                    <Text style={styles.notificationBody}>{item.body}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>My Trips</Text>
            <Text style={styles.subtitle}>Plan your next adventure</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity 
              onPress={() => setShowNotifications(true)} 
              style={styles.iconHeaderBtn}
              activeOpacity={0.7}
            >
              <Bell size={22} color="#4b5563" />
              {hasUnread && <View style={styles.redDot} />}
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => router.push('/stats')} 
              style={styles.iconHeaderBtn}
              activeOpacity={0.7}
            >
              <BarChart2 size={22} color="#4b5563" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleLogout} 
              style={styles.iconHeaderBtn} 
              activeOpacity={0.7}
            >
              <LogOut size={22} color="#4b5563" />
            </TouchableOpacity>
          </View>
        </View>

        {trips.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={48} color="#d1d5db" style={{ marginBottom: 16 }} />
            <Text style={styles.emptyText}>No trips planned yet.</Text>
          </View>
        ) : (
          <>
            {upcomingTrips.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Upcoming Trips</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{upcomingTrips.length}</Text>
                  </View>
                </View>
                {upcomingTrips.map(trip => <TripCard key={trip.id} trip={trip} />)}
              </View>
            )}

            {pastTrips.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Past Trips</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{pastTrips.length}</Text>
                  </View>
                </View>
                {pastTrips.map(trip => <TripCard key={trip.id} trip={trip} />)}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/new-trip')}
      >
        <Plus size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Space for FAB
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  iconHeaderBtn: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    position: 'relative',
  },
  redDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  modalCloseTextHeader: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3b82f6',
  },
  notificationScroll: {
    gap: 12,
    paddingBottom: 24,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    alignItems: 'flex-start',
    gap: 12,
  },
  notificationIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  notificationBodyWrapper: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  logoutBtn: {
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#e5e7eb',
    borderRadius: 24,
    marginTop: 20,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  countBadge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconBox: {
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  progressMiniBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressMiniBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  progressMiniText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    width: 80,
    textAlign: 'right',
  },
  countdownBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  countdownText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteBtn: {
    padding: 4,
  },
  tripTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  tripMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#6b7280',
  },
  typeBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
});
