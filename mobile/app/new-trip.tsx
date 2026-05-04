import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, MapPin, Cloud } from 'lucide-react-native';
import api from '../src/services/api';
import { fetchWeather } from '../src/services/api';

export default function NewTripScreen() {
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tripType, setTripType] = useState('leisure');
  const [loading, setLoading] = useState(false);
  const [weatherPreview, setWeatherPreview] = useState<string | null>(null);
  
  const router = useRouter();

  // Simple weather preview debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (destination.length > 3) {
        try {
          const response = await fetchWeather(destination);
          if (response.success && response.data && response.data.days && response.data.days.length > 0) {
            const day = response.data.days[0];
            const forecast = day.noon || day.morning || day.night;
            if (forecast) {
              setWeatherPreview(`${forecast.condition}, ${Math.round(forecast.temp)}°C`);
            }
          } else {
            setWeatherPreview(null);
          }
        } catch (e) {
          setWeatherPreview(null);
        }
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [destination]);

  const handleSubmit = async () => {
    if (!destination || !startDate || !endDate) {
      Alert.alert('Missing Fields', 'Please fill in all details.');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      Alert.alert('Invalid Date', 'End date cannot be before start date.');
      return;
    }

    setLoading(true);
    try {
      let weatherSummary = weatherPreview || "Weather data unavailable for this location";
      
      let hasRain = false;
      if (!weatherPreview) {
        try {
          const response = await fetchWeather(destination);
          if (response.success && response.data && response.data.days && response.data.days.length > 0) {
            const day = response.data.days[0];
            const forecast = day.noon || day.morning || day.night;
            if (forecast) {
              weatherSummary = `${forecast.condition}, ${Math.round(forecast.temp)}°C`;
            }
            hasRain = response.data.days.some(d => d.morning?.hasRain || d.noon?.hasRain || d.night?.hasRain);
          }
        } catch (e) {}
      }

      if (hasRain) {
        weatherSummary += " (Rain is expected! Ensure raincoat and umbrella are packed.)";
      }

      // Instead of running Gemini on client, the backend's /trips endpoint
      // should handle AI generation if we pass the right data, or we just pass basic items.
      const initialItems = [
        { name: 'Passport', category: 'Documents' },
        { name: 'Phone Charger', category: 'Electronics' },
        { name: 'Walking Shoes', category: 'Clothing' }
      ];
      if (hasRain) {
        initialItems.push({ name: 'Umbrella', category: 'Essentials' });
        initialItems.push({ name: 'Raincoat', category: 'Clothing' });
      }

      const { data } = await api.post('/trips', {
        destination,
        start_date: startDate,
        end_date: endDate,
        trip_type: tripType,
        weather_summary: weatherSummary,
        items: initialItems
      });

      router.replace(`/trip/${data.id}`);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to create trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>Cancel</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Plan New Trip</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Where are you going?</Text>
          <View style={styles.inputIconWrapper}>
            <Search size={20} color="#9ca3af" style={styles.inputIcon} />
            <TextInput 
              style={[styles.input, { paddingLeft: 44 }]}
              placeholder="Search city or country..."
              value={destination}
              onChangeText={setDestination}
            />
          </View>
        </View>

        {weatherPreview && (
          <View style={styles.weatherBox}>
            <Cloud size={24} color="#3b82f6" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.weatherTitle}>WEATHER PREVIEW</Text>
              <Text style={styles.weatherText}>{weatherPreview}</Text>
            </View>
          </View>
        )}

        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Start Date</Text>
            <TextInput 
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={startDate}
              onChangeText={setStartDate}
            />
          </View>
          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>End Date</Text>
            <TextInput 
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={endDate}
              onChangeText={setEndDate}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Trip Type</Text>
          <View style={styles.typeGrid}>
            {['business', 'leisure', 'hiking', 'beach', 'winter'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.typeButton, tripType === type && styles.typeButtonActive]}
                onPress={() => setTripType(type)}
              >
                <Text style={[styles.typeText, tripType === type && styles.typeTextActive]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Create Trip</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    padding: 24,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 24,
  },
  backText: {
    color: '#6b7280',
    fontSize: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 32,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputIconWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  weatherBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  weatherTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3b82f6',
    letterSpacing: 1,
    marginBottom: 4,
  },
  weatherText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e3a8a',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  typeButtonActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  typeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  typeTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 16,
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
