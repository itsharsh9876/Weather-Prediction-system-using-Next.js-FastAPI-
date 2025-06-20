export interface WeatherData {
  id: string;
  timestamp: Date;
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';
  uvIndex: number;
  visibility: number;
}

export interface WeatherForecast {
  date: Date;
  high: number;
  low: number;
  condition: WeatherData['condition'];
  precipitation: number;
  humidity: number;
}

export function generateMockWeatherData(hours: number): WeatherData[] {
  const data: WeatherData[] = [];
  const now = new Date();
  
  // Base conditions that evolve over time
  let baseTemp = 22 + Math.random() * 15; // 22-37°C
  let baseHumidity = 40 + Math.random() * 40; // 40-80%
  let basePressure = 1013 + (Math.random() - 0.5) * 50; // 988-1038 hPa
  
  for (let i = 0; i < hours; i++) {
    const timestamp = new Date(now.getTime() - (hours - i) * 60 * 60 * 1000);
    
    // Add seasonal and daily variations
    const hourOfDay = timestamp.getHours();
    const dayTemp = baseTemp + Math.sin((hourOfDay - 6) * Math.PI / 12) * 8; // Daily temperature cycle
    
    // Add some randomness but keep it realistic
    const temperature = dayTemp + (Math.random() - 0.5) * 4;
    const humidity = Math.max(20, Math.min(100, baseHumidity + (Math.random() - 0.5) * 20));
    const pressure = basePressure + (Math.random() - 0.5) * 5;
    
    // Determine condition based on humidity and pressure
    let condition: WeatherData['condition'] = 'sunny';
    if (humidity > 80 && pressure < 1000) condition = 'stormy';
    else if (humidity > 70) condition = 'rainy';
    else if (humidity > 60 || pressure < 1005) condition = 'cloudy';
    else if (temperature < 0) condition = 'snowy';
    
    const precipitation = condition === 'rainy' ? Math.random() * 10 : 
                         condition === 'stormy' ? Math.random() * 25 : 0;
    
    data.push({
      id: `weather-${timestamp.getTime()}`,
      timestamp,
      temperature: Math.round(temperature * 10) / 10,
      humidity: Math.round(humidity),
      pressure: Math.round(pressure * 10) / 10,
      windSpeed: Math.random() * 25,
      windDirection: Math.random() * 360,
      precipitation,
      condition,
      uvIndex: Math.max(0, Math.min(11, (12 - hourOfDay) * (temperature / 30) + Math.random() * 2)),
      visibility: condition === 'stormy' ? 2 + Math.random() * 3 : 8 + Math.random() * 7
    });
    
    // Gradually change base conditions
    baseTemp += (Math.random() - 0.5) * 0.5;
    baseHumidity += (Math.random() - 0.5) * 2;
    basePressure += (Math.random() - 0.5) * 1;
  }
  
  return data;
}

export function generateWeatherForecast(days: number): WeatherForecast[] {
  const forecast: WeatherForecast[] = [];
  const now = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const baseTemp = 20 + Math.random() * 20;
    
    forecast.push({
      date,
      high: Math.round(baseTemp + Math.random() * 10),
      low: Math.round(baseTemp - Math.random() * 10),
      condition: ['sunny', 'cloudy', 'rainy'][Math.floor(Math.random() * 3)] as WeatherData['condition'],
      precipitation: Math.random() * 15,
      humidity: 40 + Math.random() * 40
    });
  }
  
  return forecast;
}