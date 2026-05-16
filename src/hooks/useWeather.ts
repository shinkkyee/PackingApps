import { useState, useEffect } from 'react';
import { fetchWeather } from '../services/weatherApi';
import { ForecastData } from '../types/weather';

export function useWeather(city: string) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ForecastData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadWeather = async (targetCity: string) => {
    if (!targetCity.trim()) {
      setData(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    const response = await fetchWeather(targetCity);
    
    if (response.success && response.data) {
      setData(response.data);
      setError(null);
    } else {
      setData(null);
      setError(response.error || 'Failed to fetch weather');
    }
    
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadWeather(city);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [city]);

  const refetch = () => {
    loadWeather(city);
  };

  return { loading, data, error, refetch };
}
