export interface ForecastItem {
  temp: number;
  condition: string;
  hasRain: boolean;
  time: string;
}

export interface DayForecast {
  date: string;
  morning?: ForecastItem;
  noon?: ForecastItem;
  night?: ForecastItem;
}

export interface WeatherForecast {
  cityName: string;
  days: DayForecast[];
}

export interface WeatherResponse {
  success: boolean;
  data?: WeatherForecast;
  error?: string;
}
