import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Plus, Package, Briefcase, ChevronRight, Calendar, Trash2 } from 'lucide-react-native';
import api from '../src/services/api';

export default function DashboardScreen() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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

  const TripCard = ({ trip }: { trip: any }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push(`/trip/${trip.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <Briefcase size={20} color="#000" />
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => deleteTrip(trip.id)} style={styles.deleteBtn}>
            <Trash2 size={16} color="#ef4444" />
          </TouchableOpacity>
          <ChevronRight size={20} color="#9ca3af" />
        </View>
      </View>
      <Text style={styles.tripTitle}>{trip.destination}</Text>
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

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>My Trips</Text>
            <Text style={styles.subtitle}>Plan your next adventure</Text>
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
