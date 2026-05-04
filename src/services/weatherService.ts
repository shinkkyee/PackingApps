import axios from 'axios';
import { ForecastItem, WeatherForecast, DayForecast } from '../types/weather';

export class WeatherServiceError extends Error {
  constructor(public message: string, public status: number) {
    super(message);
    this.name = 'WeatherServiceError';
  }
}

export async function fetchWeather(city: string): Promise<WeatherForecast> {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    throw new WeatherServiceError('OpenWeather API key is missing', 500);
  }

  try {
    const response = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
      params: {
        q: city,
        appid: apiKey,
        units: 'metric',
      },
    });

    const data = response.data;
    const daysMap = new Map<string, DayForecast>();

    for (const item of data.list) {
      const [date, time] = item.dt_txt.split(' ');
      const hour = parseInt(time.split(':')[0], 10);
      
      if (!daysMap.has(date)) {
        daysMap.set(date, { date, morning: undefined, noon: undefined, night: undefined });
      }

      const dayData = daysMap.get(date)!;
      const weatherId = item.weather[0]?.id;
      const hasRain = weatherId >= 200 && weatherId <= 531;
      
      const forecast: ForecastItem = {
        temp: item.main.temp,
        condition: item.weather[0]?.main,
        hasRain,
        time: time
      };

      // Morning: 6 AM - 11 AM (closest to 9 AM)
      if (hour >= 6 && hour < 12) {
        if (!dayData.morning || Math.abs(hour - 9) < Math.abs(parseInt(dayData.morning.time.split(':')[0], 10) - 9)) {
          dayData.morning = forecast;
        }
      } 
      // Noon: 12 PM - 5 PM (closest to 3 PM)
      else if (hour >= 12 && hour < 18) {
        if (!dayData.noon || Math.abs(hour - 15) < Math.abs(parseInt(dayData.noon.time.split(':')[0], 10) - 15)) {
          dayData.noon = forecast;
        }
      }
      // Night: 6 PM - 5 AM (closest to 9 PM)
      else {
        if (!dayData.night || Math.abs(hour - 21) < Math.abs(parseInt(dayData.night.time.split(':')[0], 10) - 21)) {
          dayData.night = forecast;
        }
      }
    }

    // Filter out days that don't have at least one of our target slots
    const dailyForecasts = Array.from(daysMap.values()).filter(
      day => day.morning || day.noon || day.night
    );

    return {
      cityName: data.city.name,
      days: dailyForecasts,
    };
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new WeatherServiceError('City not found', 404);
      }
      if (!error.response) {
        throw new WeatherServiceError('Network failure', 502);
      }
      const message = error.response.data?.message || 'Weather API error';
      throw new WeatherServiceError(message, error.response.status);
    }
    throw new WeatherServiceError('An unexpected error occurred', 500);
  }
}
