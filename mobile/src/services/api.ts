import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeatherForecast } from '../types/weather';

/**
 * Central API client.
 * You must set EXPO_PUBLIC_API_URL in your mobile/.env file.
 * Example: EXPO_PUBLIC_API_URL=http://192.168.1.10:3000
 */
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.224.208.189:3000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.error("Error reading token", e);
  }
  return config;
});

export async function fetchWeather(city: string): Promise<{ success: boolean; data?: WeatherForecast; error?: string }> {
  try {
    const response = await api.get(`/weather/${encodeURIComponent(city)}`);
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      return {
        success: false,
        error: error.response.data?.error || `Error ${error.response.status}: Failed to fetch weather`,
      };
    }
    return {
      success: false,
      error: 'A network or unexpected error occurred',
    };
  }
}

export default api;
