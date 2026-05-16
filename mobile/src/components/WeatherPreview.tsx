import React from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { CloudRain, Sun, Cloud, RefreshCcw } from 'lucide-react-native';
import { useWeather } from '../hooks/useWeather';
import { DayForecast, ForecastItem } from '../types/weather';

interface WeatherPreviewProps {
  city: string;
  startDate?: string;
  endDate?: string;
  lat?: number;
  lon?: number;
}

export const WeatherPreview: React.FC<WeatherPreviewProps> = ({ city, startDate, endDate, lat, lon }) => {
  const { loading, data, error, refetch } = useWeather(city, lat, lon);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const WeatherIcon = ({ forecast }: { forecast?: ForecastItem }) => {
    if (!forecast) return <Text style={{ fontSize: 10, color: '#d1d5db' }}>-</Text>;
    
    if (forecast.hasRain) return <CloudRain size={18} color="#3b82f6" />;
    if (forecast.condition.toLowerCase().includes('clear')) return <Sun size={18} color="#eab308" />;
    return <Cloud size={18} color="#9ca3af" />;
  };

  const renderDayItem = ({ item }: { item: DayForecast }) => (
    <View style={styles.dayCard}>
      <Text style={styles.dateText}>{formatDate(item.date)}</Text>
      
      <View style={styles.sessionsRow}>
        {/* Morning */}
        <View style={styles.session}>
          <Text style={styles.sessionLabel}>MORNING</Text>
          <View style={styles.iconWrapper}>
            <WeatherIcon forecast={item.morning} />
          </View>
          <Text style={styles.sessionTemp}>{item.morning ? `${Math.round(item.morning.temp)}°` : '-'}</Text>
        </View>

        {/* Noon */}
        <View style={[styles.session, styles.sessionBorder]}>
          <Text style={styles.sessionLabel}>NOON</Text>
          <View style={styles.iconWrapper}>
            <WeatherIcon forecast={item.noon} />
          </View>
          <Text style={styles.sessionTemp}>{item.noon ? `${Math.round(item.noon.temp)}°` : '-'}</Text>
        </View>

        {/* Night */}
        <View style={styles.session}>
          <Text style={styles.sessionLabel}>NIGHT</Text>
          <View style={styles.iconWrapper}>
            <WeatherIcon forecast={item.night} />
          </View>
          <Text style={styles.sessionTemp}>{item.night ? `${Math.round(item.night.temp)}°` : '-'}</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="small" color="#000" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorCard}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity onPress={refetch} style={styles.retryButton}>
          <RefreshCcw size={14} color="#fff" />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!data || !data.days || data.days.length === 0) {
    return (
      <View style={{ padding: 10, backgroundColor: '#f3f4f6', borderRadius: 8 }}>
        <Text style={{ color: '#9ca3af', fontSize: 12 }}>No forecast available for {city}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>5-Day Forecast</Text>
        <Text style={styles.cityText}>{data.cityName}</Text>
      </View>
      
      <FlatList
        data={data.days}
        renderItem={renderDayItem}
        keyExtractor={(item) => item.date}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  centerContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  cityText: {
    fontSize: 12,
    color: '#9ca3af',
    textTransform: 'capitalize',
  },
  listContent: {
    paddingVertical: 4,
  },
  dayCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    width: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dateText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  sessionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  session: {
    flex: 1,
    alignItems: 'center',
  },
  sessionBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#f3f4f6',
  },
  sessionLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#9ca3af',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  iconWrapper: {
    height: 24,
    justifyContent: 'center',
    marginBottom: 4,
  },
  sessionTemp: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
  },
  errorCard: {
    padding: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fee2e2',
    alignItems: 'center',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
