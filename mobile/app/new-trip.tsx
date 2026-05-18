import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, MapPin, Calendar as CalendarIcon } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../src/services/api';
import { fetchWeather } from '../src/services/api';
import { generatePackingList } from '../src/services/packingLogic';
import { WeatherPreview } from '../src/components/WeatherPreview';

export default function NewTripScreen() {
  const [destination, setDestination] = useState('');
  const [selectedCoords, setSelectedCoords] = useState<{lat: number, lon: number} | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 86400000));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  
  const [tripType, setTripType] = useState('leisure');
  const [travelMethod, setTravelMethod] = useState('flight');
  const [luggageType, setLuggageType] = useState('checked');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [skipNextSearch, setSkipNextSearch] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (destination.length > 2 && !skipNextSearch) {
        try {
          const { data } = await api.get(`/geocode?q=${destination}`);
          setSuggestions(data);
          setShowSuggestions(true);
        } catch (e) {
          setSuggestions([]);
        }
      }
      setSkipNextSearch(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [destination]);

  const selectDestination = (item: any) => {
    Keyboard.dismiss();
    const name = `${item.name}${item.state ? `, ${item.state}` : ''}, ${item.country}`;
    setSelectedCoords({ lat: item.lat, lon: item.lon });
    setSkipNextSearch(true);
    setDestination(name);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleDateChange = (event: any, selectedDate: any, type: 'start' | 'end') => {
    if (type === 'start') {
      setShowStartPicker(Platform.OS === 'ios'); // Keep open for iOS modal until "Confirm"
      if (selectedDate) {
        setStartDate(selectedDate);
        if (endDate < selectedDate) setEndDate(selectedDate);
      }
      if (Platform.OS === 'android') setShowStartPicker(false);
    } else {
      setShowEndPicker(Platform.OS === 'ios');
      if (selectedDate) setEndDate(selectedDate);
      if (Platform.OS === 'android') setShowEndPicker(false);
    }
  };

  const handleSubmit = async () => {
    if (!destination) {
      Alert.alert('Missing Fields', 'Please select a destination.');
      return;
    }
    setLoading(true);
    try {
      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];
      let weatherSummary = "Weather data unavailable";
      let fullWeatherData = null;
      
      try {
        const cleanName = destination.split(',')[0].replace('Municipality', '').replace('City', '').trim();
        const weatherResponse = await fetchWeather(cleanName, selectedCoords?.lat, selectedCoords?.lon);
        if (weatherResponse && weatherResponse.success && weatherResponse.data) {
          fullWeatherData = weatherResponse.data;
          const day = weatherResponse.data.days[0];
          const forecast = day.noon || day.morning || day.night;
          if (forecast) weatherSummary = `${forecast.condition}, ${Math.round(forecast.temp)}°C`;
          if (weatherResponse.data.days.some((d: any) => d.morning?.hasRain || d.noon?.hasRain || d.night?.hasRain)) {
            weatherSummary += " (Rain expected!)";
          }
        }
      } catch (e) { console.warn("Weather error", e); }

      const initialItems = generatePackingList(tripType, fullWeatherData, startStr, endStr, destination, travelMethod, luggageType);
      const { data } = await api.post('/trips', {
        destination,
        start_date: startStr,
        end_date: endStr,
        trip_type: tripType,
        weather_summary: weatherSummary,
        items: initialItems,
        lat: selectedCoords?.lat,
        lon: selectedCoords?.lon,
        travel_method: travelMethod,
        luggage_type: luggageType
      });
      router.replace(`/trip/${data.id}`);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to create trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="always">
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
              placeholder="Search destination..."
              value={destination}
              onChangeText={(text) => {
                setDestination(text);
                if (text.length <= 2) setShowSuggestions(false);
              }}
            />
          </View>
          {showSuggestions && suggestions.length > 0 && (
            <View style={styles.suggestionsList}>
              {suggestions.map((item, index) => (
                <TouchableOpacity key={index} style={styles.suggestionItem} onPress={() => selectDestination(item)}>
                  <MapPin size={16} color="#6b7280" />
                  <Text style={styles.suggestionText}>{item.name}{item.state ? `, ${item.state}` : ''}, {item.country}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {destination.length > 3 && !showSuggestions && (
          <View style={styles.weatherBox}>
            <WeatherPreview 
              city={destination} 
              startDate={startDate.toISOString().split('T')[0]} 
              endDate={endDate.toISOString().split('T')[0]} 
              lat={selectedCoords?.lat}
              lon={selectedCoords?.lon}
            />
          </View>
        )}

        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Start Date</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartPicker(true)}>
              <CalendarIcon size={18} color="#6b7280" style={{ marginRight: 8 }} />
              <Text style={styles.dateButtonText}>{startDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>End Date</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndPicker(true)}>
              <CalendarIcon size={18} color="#6b7280" style={{ marginRight: 8 }} />
              <Text style={styles.dateButtonText}>{endDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Picker Modals */}
        <Modal visible={showStartPicker && Platform.OS === 'ios'} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Start Date</Text>
              <DateTimePicker value={startDate} mode="date" display="inline" onChange={(e, d) => handleDateChange(e, d, 'start')} />
              <TouchableOpacity onPress={() => setShowStartPicker(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>Confirm Date</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={showEndPicker && Platform.OS === 'ios'} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>End Date</Text>
              <DateTimePicker value={endDate} mode="date" display="inline" minimumDate={startDate} onChange={(e, d) => handleDateChange(e, d, 'end')} />
              <TouchableOpacity onPress={() => setShowEndPicker(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>Confirm Date</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {Platform.OS === 'android' && showStartPicker && (
          <DateTimePicker value={startDate} mode="date" display="default" onChange={(e, d) => handleDateChange(e, d, 'start')} />
        )}
        {Platform.OS === 'android' && showEndPicker && (
          <DateTimePicker value={endDate} mode="date" display="default" minimumDate={startDate} onChange={(e, d) => handleDateChange(e, d, 'end')} />
        )}

        <View style={[styles.formGroup, { marginTop: 10 }]}>
          <Text style={styles.label}>Trip Type</Text>
          <View style={styles.typeGrid}>
            {['business', 'leisure', 'hiking', 'beach', 'winter'].map((type) => (
              <TouchableOpacity key={type} style={[styles.typeButton, tripType === type && styles.typeButtonActive]} onPress={() => setTripType(type)}>
                <Text style={[styles.typeText, tripType === type && styles.typeTextActive]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.formGroup, { marginTop: 10 }]}>
          <Text style={styles.label}>Travel Method</Text>
          <View style={styles.typeGrid}>
            {[
              { id: 'flight', label: '✈️ Flight' },
              { id: 'train', label: '🚆 Train' },
              { id: 'road_trip', label: '🚗 Road Trip' },
              { id: 'cruise', label: '🛳️ Cruise' }
            ].map((method) => (
              <TouchableOpacity key={method.id} style={[styles.typeButton, travelMethod === method.id && styles.typeButtonActive]} onPress={() => setTravelMethod(method.id)}>
                <Text style={[styles.typeText, travelMethod === method.id && styles.typeTextActive]}>{method.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.formGroup, { marginTop: 10 }]}>
          <Text style={styles.label}>Luggage Type</Text>
          <View style={styles.typeGrid}>
            {[
              { id: 'handcarry', label: '🎒 Handcarry Only' },
              { id: 'checked', label: '🧳 Checked Baggage' }
            ].map((lug) => (
              <TouchableOpacity key={lug.id} style={[styles.typeButton, luggageType === lug.id && styles.typeButtonActive]} onPress={() => setLuggageType(lug.id)}>
                <Text style={[styles.typeText, luggageType === lug.id && styles.typeTextActive]}>{lug.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Create Trip</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 24, paddingTop: 60 },
  backButton: { marginBottom: 24 },
  backText: { color: '#6b7280', fontSize: 16 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#000', marginBottom: 32 },
  formGroup: { marginBottom: 24 },
  label: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 },
  inputIconWrapper: { position: 'relative', justifyContent: 'center' },
  inputIcon: { position: 'absolute', left: 12, zIndex: 1 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 16, fontSize: 16, backgroundColor: '#f9fafb' },
  suggestionsList: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginTop: 4, elevation: 4 },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  suggestionText: { marginLeft: 12, fontSize: 14, color: '#374151' },
  dateButton: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 16, backgroundColor: '#f9fafb' },
  dateButtonText: { fontSize: 14, color: '#374151' },
  weatherBox: { padding: 16, backgroundColor: '#fff', borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#eee' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff' },
  typeButtonActive: { backgroundColor: '#000', borderColor: '#000' },
  typeText: { fontSize: 14, fontWeight: '500', color: '#6b7280', textTransform: 'capitalize' },
  typeTextActive: { color: '#fff' },
  submitButton: { backgroundColor: '#000', borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 16 },
  submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 20, width: '95%', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', textAlign: 'center', marginBottom: 10 },
  modalCloseBtn: { marginTop: 10, backgroundColor: '#007AFF', paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  modalCloseText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
