import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, Award, Briefcase, Calendar, CheckCircle2, ShieldAlert } from 'lucide-react-native';
import api from '../src/services/api';

export default function StatsScreen() {
  const router = useRouter();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');

  const fetchUserDataAndTrips = async () => {
    setLoading(true);
    try {
      // Get user email
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserEmail(user.email || 'traveler@packingpal.com');
      }

      // Get trips
      const { data } = await api.get('/trips');
      setTrips(data);
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserDataAndTrips();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // 1. Core aggregates
  const totalTrips = trips.length;
  let totalItemsCount = 0;
  let totalPackedCount = 0;

  let hasRainTrip = false;
  let hasHandcarryTrip = false;
  let hasCheckedTrip = false;
  let hasPerfectTrip = false;

  let flightCount = 0;
  let trainCount = 0;
  let roadTripCount = 0;
  let cruiseCount = 0;

  trips.forEach(t => {
    totalItemsCount += (t.total_items || 0);
    totalPackedCount += (t.packed_items || 0);

    // Dynamic achievement checks
    if (t.weather_summary?.toLowerCase().includes('rain')) hasRainTrip = true;
    if (t.luggage_type === 'handcarry') hasHandcarryTrip = true;
    if (t.luggage_type === 'checked') hasCheckedTrip = true;
    if (t.total_items > 0 && t.packed_items === t.total_items) hasPerfectTrip = true;

    // Method counts
    const method = t.travel_method?.toLowerCase() || 'flight';
    if (method === 'flight') flightCount++;
    else if (method === 'train') trainCount++;
    else if (method === 'road_trip') roadTripCount++;
    else if (method === 'cruise') cruiseCount++;
  });

  const completionRate = totalItemsCount === 0 ? 0 : Math.round((totalPackedCount / totalItemsCount) * 100);

  // 2. Avatar calculations
  let avatarLevel = 1;
  let avatarTitle = 'Novice Backpacker';
  let avatarEmoji = '🎒';
  let avatarSubtext = 'Just started your packing journey!';

  if (totalTrips >= 4) {
    avatarLevel = 3;
    avatarTitle = 'Elite Globe Trotter';
    avatarEmoji = '✈️';
    avatarSubtext = 'A world class adventurer! Luggage is in perfect shape!';
  } else if (totalTrips >= 2) {
    avatarLevel = 2;
    avatarTitle = 'Wandering Explorer';
    avatarEmoji = '🚶';
    avatarSubtext = 'Getting the hang of it! Exploring new borders.';
  }

  // 3. Luggage splits
  const totalLuggageTrips = (hasHandcarryTrip ? 1 : 0) + (hasCheckedTrip ? 1 : 0);
  const handcarryPercent = totalTrips === 0 ? 50 : Math.round((trips.filter(t => t.luggage_type === 'handcarry').length / totalTrips) * 100);
  const checkedPercent = 100 - handcarryPercent;

  // 4. Method percentages
  const maxMethodCount = Math.max(flightCount, trainCount, roadTripCount, cruiseCount, 1);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Travel Guild Analytics</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Profile Card & Avatar Game */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{avatarEmoji}</Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>LV {avatarLevel}</Text>
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileEmail}>{userEmail}</Text>
            <Text style={styles.profileTitle}>{avatarTitle}</Text>
            <Text style={styles.profileSubtext}>{avatarSubtext}</Text>
          </View>
        </View>

        {/* Dynamic Aggregates Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{totalTrips}</Text>
            <Text style={styles.statLbl}>Trips Planned</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{completionRate}%</Text>
            <Text style={styles.statLbl}>Items Packed</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{totalPackedCount}/{totalItemsCount}</Text>
            <Text style={styles.statLbl}>Total Items</Text>
          </View>
        </View>

        {/* Visual Achievement Badges section */}
        <Text style={styles.sectionTitle}>Adventure Badges</Text>
        <View style={styles.badgesGrid}>
          {[
            { id: 'master', title: 'Master Packer 🏆', desc: 'Packed 100% of items on a trip', unlocked: hasPerfectTrip },
            { id: 'rain', title: 'Rain Survivor ☔', desc: 'Planned a trip with rain forecasted', unlocked: hasRainTrip },
            { id: 'light', title: 'Light Traveler 🎒', desc: 'Planned a handcarry only trip', unlocked: hasHandcarryTrip },
            { id: 'heavy', title: 'Heavy Lifter 🧳', desc: 'Planned a checked luggage trip', unlocked: hasCheckedTrip },
          ].map(badge => (
            <View key={badge.id} style={[styles.badgeCard, badge.unlocked ? styles.badgeUnlocked : styles.badgeLocked]}>
              <View style={styles.badgeIconWrapper}>
                <Award size={24} color={badge.unlocked ? '#d97706' : '#9ca3af'} />
              </View>
              <View style={styles.badgeInfo}>
                <Text style={[styles.badgeTitle, badge.unlocked ? styles.badgeTitleUnlocked : styles.badgeTitleLocked]}>
                  {badge.title}
                </Text>
                <Text style={styles.badgeDesc}>{badge.desc}</Text>
              </View>
              <View style={styles.badgeStatus}>
                <Text style={[styles.badgeStatusText, badge.unlocked ? styles.statusUnlockedText : styles.statusLockedText]}>
                  {badge.unlocked ? 'UNLOCKED' : 'LOCKED'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Data Visualization Charts */}
        <Text style={styles.sectionTitle}>Luggage Preference</Text>
        <View style={styles.chartCard}>
          <View style={styles.luggageSplitRow}>
            <Text style={styles.luggageLabel}>🎒 Handcarry ({handcarryPercent}%)</Text>
            <Text style={styles.luggageLabel}>🧳 Checked ({checkedPercent}%)</Text>
          </View>
          <View style={styles.luggageSplitBarBg}>
            <View style={[styles.luggageSplitBarHand, { width: `${handcarryPercent}%` }]} />
            <View style={[styles.luggageSplitBarChecked, { width: `${checkedPercent}%` }]} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Travel Methods</Text>
        <View style={styles.chartCard}>
          {[
            { label: '✈️ Flight', count: flightCount, color: '#3b82f6' },
            { label: '🚆 Train', count: trainCount, color: '#10b981' },
            { label: '🚗 Road Trip', count: roadTripCount, color: '#f59e0b' },
            { label: '🛳️ Cruise', count: cruiseCount, color: '#8b5cf6' },
          ].map(item => {
            const barWidth = Math.max((item.count / maxMethodCount) * 100, 5);
            return (
              <View key={item.label} style={styles.methodRow}>
                <Text style={styles.methodLabel}>{item.label}</Text>
                <View style={styles.methodBarContainer}>
                  <View style={[styles.methodBarFill, { width: `${barWidth}%`, backgroundColor: item.color }]} />
                  <Text style={styles.methodCountText}>{item.count}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#fff',
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  scroll: {
    padding: 20,
  },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: '#000',
    padding: 20,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 36,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#000',
  },
  levelBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileEmail: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 2,
  },
  profileTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileSubtext: {
    color: '#d1d5db',
    fontSize: 11,
    lineHeight: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  statVal: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  statLbl: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
    marginTop: 8,
  },
  badgesGrid: {
    marginBottom: 24,
    gap: 12,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  badgeUnlocked: {
    backgroundColor: '#fffbeb',
    borderColor: '#fef3c7',
  },
  badgeLocked: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
    opacity: 0.6,
  },
  badgeIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  badgeTitleUnlocked: {
    color: '#92400e',
  },
  badgeTitleLocked: {
    color: '#4b5563',
  },
  badgeDesc: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  badgeStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  badgeStatusText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  statusUnlockedText: {
    color: '#d97706',
  },
  statusLockedText: {
    color: '#9ca3af',
  },
  chartCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    marginBottom: 24,
  },
  luggageSplitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  luggageLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  luggageSplitBarBg: {
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  luggageSplitBarHand: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  luggageSplitBarChecked: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  methodRow: {
    marginBottom: 14,
  },
  methodLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  methodBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  methodBarFill: {
    height: 10,
    borderRadius: 5,
  },
  methodCountText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: 'bold',
  },
});
