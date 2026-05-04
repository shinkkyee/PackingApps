import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchWeather } from '../services/api';
import { WeatherForecast } from '../types/weather';

export function useWeather(city: string | null) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WeatherForecast | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const performFetch = async (targetCity: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWeather(targetCity);
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
      performFetch(city);
    }
  }, [city]);

  useEffect(() => {
    if (!city || city.trim().length === 0) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      performFetch(city);
    }, 500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [city]);

  return { loading, data, error, refetch };
}
