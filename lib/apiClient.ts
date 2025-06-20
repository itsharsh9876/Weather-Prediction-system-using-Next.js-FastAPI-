const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ApiWeatherData {
  id: number;
  timestamp: string;
  temperature: number;
  humidity: number;
  pressure: number;
  wind_speed: number;
  wind_direction: number;
  precipitation: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';
  uv_index: number;
  visibility: number;
  location: string;
}

export interface ApiWeatherForecast {
  date: string;
  high_temperature: number;
  low_temperature: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';
  precipitation_probability: number;
  humidity: number;
  description: string;
}

export interface ApiTrendAnalysis {
  metric: string;
  slope: number;
  direction: string;
  strength: number;
  prediction: number;
  confidence: number;
}

export interface ApiWeatherStatistics {
  period_hours: number;
  total_readings: number;
  temperature: {
    avg: number;
    min: number;
    max: number;
    std: number;
  };
  humidity: {
    avg: number;
    min: number;
    max: number;
    std: number;
  };
  pressure: {
    avg: number;
    min: number;
    max: number;
    std: number;
  };
  wind_speed: {
    avg: number;
    min: number;
    max: number;
    std: number;
  };
  precipitation: {
    total: number;
    avg: number;
    max: number;
  };
  most_common_condition: string;
  condition_distribution: Record<string, number>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request('/health');
  }

  // Weather data endpoints
  async getWeatherReadings(params?: {
    skip?: number;
    limit?: number;
    hours?: number;
  }): Promise<ApiWeatherData[]> {
    const searchParams = new URLSearchParams();
    if (params?.skip) searchParams.append('skip', params.skip.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.hours) searchParams.append('hours', params.hours.toString());
    
    const query = searchParams.toString();
    return this.request(`/weather/${query ? `?${query}` : ''}`);
  }

  async getLatestWeather(): Promise<ApiWeatherData> {
    return this.request('/weather/latest');
  }

  async createWeatherReading(data: Omit<ApiWeatherData, 'id' | 'timestamp' | 'created_at' | 'updated_at'>): Promise<ApiWeatherData> {
    return this.request('/weather/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Statistics and analysis
  async getWeatherStatistics(hours: number = 24): Promise<ApiWeatherStatistics> {
    return this.request(`/weather/statistics?hours=${hours}`);
  }

  async getTrendAnalysis(metric: string = 'temperature', hours: number = 48): Promise<ApiTrendAnalysis> {
    return this.request(`/weather/analysis/trend?metric=${metric}&hours=${hours}`);
  }

  async getSeasonalAnalysis(metric: string = 'temperature'): Promise<any> {
    return this.request(`/weather/analysis/seasonal?metric=${metric}`);
  }

  // Forecast
  async getWeatherForecast(days: number = 7): Promise<ApiWeatherForecast[]> {
    return this.request(`/weather/forecast?days=${days}`);
  }

  // Utility endpoints
  async simulateWeatherData(hours: number = 24): Promise<{ message: string }> {
    return this.request('/weather/simulate', {
      method: 'POST',
      body: JSON.stringify({ hours }),
    });
  }

  async cleanupOldData(days: number = 30): Promise<{ message: string }> {
    return this.request(`/weather/cleanup?days=${days}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();