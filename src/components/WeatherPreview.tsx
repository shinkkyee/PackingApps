import React, { useMemo } from 'react';
import { CloudRain, Loader2, AlertCircle, Cloud, Sun, Thermometer } from 'lucide-react';
import { useWeather } from '../hooks/useWeather';
import { ForecastItem } from '../types/weather';

interface WeatherPreviewProps {
  city: string;
}

export const WeatherPreview: React.FC<WeatherPreviewProps> = ({ city }) => {
  const { loading, data, error, refetch } = useWeather(city);

  // Group forecasts by day to display a genuine 5-day summary rather than 3-hour intervals
  const dailyForecasts = useMemo(() => {
    if (!data?.forecasts) return [];
    
    const uniqueDays = new Map<string, ForecastItem>();
    
    data.forecasts.forEach(item => {
      // Date format is typically "YYYY-MM-DD HH:mm:ss"
      const dateKey = item.date.split(' ')[0];
      if (!uniqueDays.has(dateKey)) {
        uniqueDays.set(dateKey, item);
      }
    });
    
    return Array.from(uniqueDays.values()).slice(0, 5);
  }, [data]);

  if (!city) {
    return null;
  }

  return (
    <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Thermometer className="text-blue-500" />
          5-Day Forecast
        </h2>
        
        {data && (
          <span className="text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-3 py-1 rounded-full">
            {data.city}
          </span>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
          <p>Loading weather for {city}...</p>
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-8 text-red-500 bg-red-50 dark:bg-red-900/10 rounded-xl p-4">
          <AlertCircle className="w-10 h-10 mb-2" />
          <p className="text-center font-medium">{error}</p>
          <button 
            onClick={refetch}
            className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-100 rounded-lg text-sm transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {dailyForecasts.map((day, idx) => {
            const dateObj = new Date(day.date);
            const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(dateObj);
            
            return (
              <div 
                key={idx} 
                className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-blue-50 transition-colors"
              >
                <span className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-2">
                  {dayName}
                </span>
                
                <div className="my-2 h-10 w-10 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-sm">
                  {day.hasRain ? (
                    <CloudRain className="w-6 h-6 text-blue-500" />
                  ) : day.condition.toLowerCase().includes('cloud') ? (
                     <Cloud className="w-6 h-6 text-gray-400" />
                  ) : (
                    <Sun className="w-6 h-6 text-yellow-500" />
                  )}
                </div>
                
                <span className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                  {Math.round(day.temp)}°
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize text-center">
                  {day.condition}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
