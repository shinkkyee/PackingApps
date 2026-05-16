import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchWeather } from '../services/api';
import { WeatherForecast } from '../types/weather';

export function useWeather(city: string | null, lat?: number, lon?: number) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WeatherForecast | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const performFetch = async (targetCity: string, targetLat?: number, targetLon?: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWeather(targetCity, targetLat, targetLon);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Failed to fetch weather');
        setData(null);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const refetch = useCallback(() => {
    if (city) {
      performFetch(city, lat, lon);
    }
  }, [city, lat, lon]);

  useEffect(() => {
    if (!city || city.trim().length === 0) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      performFetch(city, lat, lon);
    }, 500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [city, lat, lon]);

  return { loading, data, error, refetch };
}
