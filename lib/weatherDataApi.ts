import { apiClient, ApiWeatherData, ApiWeatherForecast } from './apiClient';
import { WeatherData, WeatherForecast } from './weatherData';

// Convert API data to frontend format
export function convertApiWeatherData(apiData: ApiWeatherData): WeatherData {
  return {
    id: apiData.id.toString(),
    timestamp: new Date(apiData.timestamp),
    temperature: apiData.temperature,
    humidity: apiData.humidity,
    pressure: apiData.pressure,
    windSpeed: apiData.wind_speed,
    windDirection: apiData.wind_direction,
    precipitation: apiData.precipitation,
    condition: apiData.condition,
    uvIndex: apiData.uv_index,
    visibility: apiData.visibility,
  };
}

export function convertApiForecastData(apiData: ApiWeatherForecast): WeatherForecast {
  return {
    date: new Date(apiData.date),
    high: apiData.high_temperature,
    low: apiData.low_temperature,
    condition: apiData.condition,
    precipitation: apiData.precipitation_probability,
    humidity: apiData.humidity,
  };
}

export class WeatherDataService {
  // Fetch real weather data from API
  static async fetchWeatherData(hours: number = 168): Promise<WeatherData[]> {
    try {
      const apiData = await apiClient.getWeatherReadings({ limit: hours });
      return apiData.map(convertApiWeatherData);
    } catch (error) {
      console.error('Failed to fetch weather data from API:', error);
      // Fallback to mock data if API is unavailable
      const { generateMockWeatherData } = await import('./weatherData');
      return generateMockWeatherData(hours);
    }
  }

  // Fetch weather forecast from API
  static async fetchWeatherForecast(days: number = 7): Promise<WeatherForecast[]> {
    try {
      const apiData = await apiClient.getWeatherForecast(days);
      return apiData.map(convertApiForecastData);
    } catch (error) {
      console.error('Failed to fetch forecast from API:', error);
      // Fallback to mock data if API is unavailable
      const { generateWeatherForecast } = await import('./weatherData');
      return generateWeatherForecast(days);
    }
  }

  // Get latest weather reading
  static async fetchLatestWeather(): Promise<WeatherData | null> {
    try {
      const apiData = await apiClient.getLatestWeather();
      return convertApiWeatherData(apiData);
    } catch (error) {
      console.error('Failed to fetch latest weather:', error);
      return null;
    }
  }

  // Initialize database with sample data
  static async initializeSampleData(): Promise<void> {
    try {
      await apiClient.simulateWeatherData(168); // Generate 7 days of data
      console.log('Sample data initialized successfully');
    } catch (error) {
      console.error('Failed to initialize sample data:', error);
    }
  }

  // Check API health
  static async checkApiHealth(): Promise<boolean> {
    try {
      await apiClient.healthCheck();
      return true;
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  }
}