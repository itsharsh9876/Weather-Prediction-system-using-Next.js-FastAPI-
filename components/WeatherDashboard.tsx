"use client";

import { WeatherData, WeatherForecast, generateWeatherForecast } from '@/lib/weatherData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Thermometer, 
  Droplets, 
  Gauge, 
  Wind, 
  Eye, 
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';

interface WeatherDashboardProps {
  weatherData: WeatherData[];
  location: string;
}

export function WeatherDashboard({ weatherData, location }: WeatherDashboardProps) {
  const [forecast, setForecast] = useState<WeatherForecast[]>([]);
  
  useEffect(() => {
    setForecast(generateWeatherForecast(7));
  }, []);

  const currentWeather = weatherData[weatherData.length - 1];
  const last24Hours = weatherData.slice(-24);

  if (!currentWeather) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Loading weather data...</p>
        </CardContent>
      </Card>
    );
  }

  const getWeatherIcon = (condition: WeatherData['condition']) => {
    const iconProps = { className: "w-8 h-8" };
    switch (condition) {
      case 'sunny': return <Sun {...iconProps} className="w-8 h-8 text-yellow-500" />;
      case 'cloudy': return <Cloud {...iconProps} className="w-8 h-8 text-gray-500" />;
      case 'rainy': return <CloudRain {...iconProps} className="w-8 h-8 text-blue-500" />;
      case 'stormy': return <Zap {...iconProps} className="w-8 h-8 text-purple-500" />;
      case 'snowy': return <CloudSnow {...iconProps} className="w-8 h-8 text-blue-200" />;
      default: return <Sun {...iconProps} />;
    }
  };

  const getConditionColor = (condition: WeatherData['condition']) => {
    switch (condition) {
      case 'sunny': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cloudy': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'rainy': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'stormy': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'snowy': return 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const chartData = last24Hours.map(data => ({
    time: data.timestamp.getHours() + ':00',
    temperature: data.temperature,
    humidity: data.humidity,
    pressure: data.pressure / 10 // Scale down for better visualization
  }));

  return (
    <div className="space-y-6">
      {/* Current Weather */}
      <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Current Weather - {location}</span>
            <Badge className={getConditionColor(currentWeather.condition)}>
              {currentWeather.condition.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              {getWeatherIcon(currentWeather.condition)}
              <div>
                <div className="text-4xl font-bold">{Math.round(currentWeather.temperature)}°C</div>
                <div className="text-muted-foreground">
                  Feels like {Math.round(currentWeather.temperature + (currentWeather.humidity - 50) / 10)}°C
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">
                {currentWeather.timestamp.toLocaleTimeString()}
              </div>
              <div className="text-sm text-muted-foreground">
                {currentWeather.timestamp.toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="flex items-center space-x-2">
              <Droplets className="w-5 h-5 text-blue-500" />
              <div>
                <div className="text-sm text-muted-foreground">Humidity</div>
                <div className="font-semibold">{currentWeather.humidity}%</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Gauge className="w-5 h-5 text-green-500" />
              <div>
                <div className="text-sm text-muted-foreground">Pressure</div>
                <div className="font-semibold">{currentWeather.pressure} hPa</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Wind className="w-5 h-5 text-gray-500" />
              <div>
                <div className="text-sm text-muted-foreground">Wind</div>
                <div className="font-semibold">{Math.round(currentWeather.windSpeed)} km/h</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Eye className="w-5 h-5 text-purple-500" />
              <div>
                <div className="text-sm text-muted-foreground">Visibility</div>
                <div className="font-semibold">{Math.round(currentWeather.visibility)} km</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Sun className="w-5 h-5 text-orange-500" />
              <div>
                <div className="text-sm text-muted-foreground">UV Index</div>
                <div className="font-semibold">{Math.round(currentWeather.uvIndex)}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <CloudRain className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-sm text-muted-foreground">Precipitation</div>
                <div className="font-semibold">{Math.round(currentWeather.precipitation)} mm</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 24-Hour Chart */}
      <Card>
        <CardHeader>
          <CardTitle>24-Hour Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="temperature" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="Temperature (°C)"
                />
                <Line 
                  type="monotone" 
                  dataKey="humidity" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Humidity (%)"
                />
                <Line 
                  type="monotone" 
                  dataKey="pressure" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Pressure (×10 hPa)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 7-Day Forecast */}
      <Card>
        <CardHeader>
          <CardTitle>7-Day Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {forecast.map((day, index) => (
              <div key={index} className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground mb-2">
                  {index === 0 ? 'Today' : day.date.toLocaleDateString('en', { weekday: 'short' })}
                </div>
                <div className="flex justify-center mb-2">
                  {getWeatherIcon(day.condition)}
                </div>
                <div className="font-semibold mb-1">
                  {day.high}° / {day.low}°
                </div>
                <div className="text-xs text-muted-foreground">
                  {Math.round(day.precipitation)}mm
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}