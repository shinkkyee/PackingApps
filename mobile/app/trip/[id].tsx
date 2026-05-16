import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, Trash2, Plus, CheckCircle, Circle } from 'lucide-react-native';
import api from '../../src/services/api';
import { useWeather } from '../../src/hooks/useWeather';
import { WeatherPreview } from '../../src/components/WeatherPreview';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState('');
  const [newCategory, setNewCategory] = useState('All');

  useEffect(() => {
    fetchTrip();
  }, [id]);

  const fetchTrip = async () => {
    try {
      const { data } = await api.get(`/trips/${id}`);
      setTrip(data);
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch trip details');
      router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = async (itemId: number, currentStatus: number) => {
    // Optimistic update
    const updatedStatus = currentStatus ? 0 : 1;
    setTrip((prev: any) => ({
      ...prev,
      items: prev.items.map((item: any) => 
        item.id === itemId ? { ...item, is_packed: updatedStatus } : item
      )
    }));

    try {
      await api.patch(`/items/${itemId}`, { is_packed: updatedStatus });
    } catch (err) {
      // Revert on error
      setTrip((prev: any) => ({
        ...prev,
        items: prev.items.map((item: any) => 
          item.id === itemId ? { ...item, is_packed: currentStatus } : item
        )
      }));
      Alert.alert('Error', 'Failed to update item status');
    }
  };

  const addItem = async () => {
    if (!newItem.trim()) return;

    try {
      const { data } = await api.post(`/trips/${id}/items`, { 
        name: newItem, 
        category: newCategory === 'All' ? 'Essentials' : newCategory 
      });
      setTrip((prev: any) => ({
        ...prev,
        items: [...prev.items, data]
      }));
      setNewItem('');
    } catch (err) {
      Alert.alert('Error', 'Failed to add item');
    }
  };

  const deleteItem = async (itemId: number) => {
    try {
      await api.delete(`/items/${itemId}`);
      setTrip((prev: any) => ({
        ...prev,
        items: prev.items.filter((item: any) => item.id !== itemId)
      }));
    } catch (err) {
      Alert.alert('Error', 'Failed to delete item');
    }
  };

  const deleteTrip = () => {
    Alert.alert('Delete Trip', 'Are you sure you want to delete this trip?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/trips/${id}`);
            router.replace('/');
          } catch (err) {
            Alert.alert('Error', 'Failed to delete trip');
          }
        }
      }
    ]);
  };

  const { data: weatherData } = useWeather(trip?.destination || null);
  const isRaining = weatherData?.days?.some(d => d.morning?.hasRain || d.noon?.hasRain || d.night?.hasRain) ?? false;

  if (loading || !trip) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  const packedCount = trip.items.filter((i: any) => i.is_packed).length;
  const progress = trip.items.length === 0 ? 0 : Math.round((packedCount / trip.items.length) * 100);
  
  // Member 2 Logic: Filtering categories based on selection
  const allCategories = Array.from(new Set(trip.items.map((i: any) => i.category || 'Other')));
  const filteredCategories = newCategory === 'All' 
    ? allCategories 
    : [newCategory];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={deleteTrip} style={styles.deleteTripBtn}>
            <Trash2 size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.tripHeader}>
            <View>
              <Text style={styles.destination}>{trip.destination}</Text>
              <View style={styles.dateRow}>
                <Calendar size={14} color="#6b7280" />
                <Text style={styles.dateText}>
                  {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                </Text>
              </View>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{trip.trip_type.toUpperCase()}</Text>
            </View>
          </View>

          {/* Weather Integration */}
          <WeatherPreview 
            city={trip.destination} 
            startDate={trip.start_date} 
            endDate={trip.end_date} 
            lat={trip.lat}
            lon={trip.lon}
          />
          {isRaining && (
            <View style={styles.rainWarning}>
              <Text style={styles.rainWarningText}>☔ Rain Forecasted! Pack your umbrella.</Text>
            </View>
          )}

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Packing Progress</Text>
              <Text style={styles.progressValue}>{progress}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>
          </View>

          <View style={styles.addItemSection}>
            <TextInput 
              style={styles.addItemInput}
              placeholder="Add an item..."
              value={newItem}
              onChangeText={setNewItem}
            />
            <TouchableOpacity style={styles.addItemBtn} onPress={addItem}>
              <Plus size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {['All', 'Essentials', 'Clothing', 'Electronics', 'Documents', 'Toiletries', 'Other'].map(cat => (
              <TouchableOpacity 
                key={cat}
                style={[styles.categoryTab, newCategory === cat && styles.categoryTabActive]}
                onPress={() => setNewCategory(cat)}
              >
                <Text style={[styles.categoryTabText, newCategory === cat && styles.categoryTabTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {filteredCategories.map((category: any) => {
            const categoryItems = trip.items.filter((i: any) => (i.category || 'Other') === category);
            if (categoryItems.length === 0) return null;
            return (
              <View key={`cat-${category}`} style={styles.categoryGroup}>
                <Text style={styles.categoryTitle}>{category}</Text>
                {categoryItems.map((item: any) => (
                  <View key={item.id} style={styles.itemRow}>
                    <TouchableOpacity 
                      style={styles.itemToggle} 
                      onPress={() => toggleItem(item.id, item.is_packed)}
                    >
                      {item.is_packed ? (
                        <CheckCircle size={24} color="#10b981" />
                      ) : (
                        <Circle size={24} color="#d1d5db" />
                      )}
                      <Text style={[styles.itemName, item.is_packed && styles.itemNamePacked]}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteItem(item.id)} style={styles.itemDelete}>
                      <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  deleteTripBtn: {
    padding: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
  },
  scroll: {
    padding: 20,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  destination: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    color: '#6b7280',
    fontSize: 14,
  },
  badge: {
    backgroundColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  progressSection: {
    marginBottom: 24,
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressTitle: {
    fontWeight: '600',
    color: '#374151',
  },
  progressValue: {
    fontWeight: 'bold',
    color: '#000',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  addItemSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  addItemInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  addItemBtn: {
    backgroundColor: '#000',
    width: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryScroll: {
    marginBottom: 24,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  categoryTabActive: {
    backgroundColor: '#000',
  },
  categoryTabText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryTabTextActive: {
    color: '#fff',
  },
  categoryGroup: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: '#374151',
  },
  itemNamePacked: {
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  itemDelete: {
    padding: 8,
  },
  rainWarning: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  rainWarningText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
