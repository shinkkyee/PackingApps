import axios from 'axios';
import { WeatherResponse } from '../types/weather';

export async function fetchWeather(city: string): Promise<WeatherResponse> {
  try {
    const response = await axios.get<WeatherResponse>(`/api/weather/${encodeURIComponent(city)}`);
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
