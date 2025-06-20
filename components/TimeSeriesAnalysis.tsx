"use client";

import { WeatherData } from '@/lib/weatherData';
import { TimeSeriesAnalyzer, TimeSeriesPoint } from '@/lib/timeSeriesAnalysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Activity, Target } from 'lucide-react';
import { useState, useEffect } from 'react';

interface TimeSeriesAnalysisProps {
  weatherData: WeatherData[];
}

export function TimeSeriesAnalysis({ weatherData }: TimeSeriesAnalysisProps) {
  const [activeMetric, setActiveMetric] = useState<'temperature' | 'humidity' | 'pressure'>('temperature');
  const [analysis, setAnalysis] = useState<any>(null);
  const [forecast, setForecast] = useState<TimeSeriesPoint[]>([]);

  useEffect(() => {
    if (weatherData.length > 0) {
      const timeSeries = TimeSeriesAnalyzer.extractTimeSeries(weatherData, activeMetric);
      const trendAnalysis = TimeSeriesAnalyzer.linearRegression(timeSeries);
      const seasonalPattern = TimeSeriesAnalyzer.detectSeasonality(timeSeries);
      const movingAvg = TimeSeriesAnalyzer.movingAverage(timeSeries, 6);
      const forecastData = TimeSeriesAnalyzer.forecast(timeSeries, 12);

      setAnalysis({
        trend: trendAnalysis,
        seasonal: seasonalPattern,
        movingAverage: movingAvg,
        timeSeries
      });
      setForecast(forecastData);
    }
  }, [weatherData, activeMetric]);

  if (!analysis) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Loading time series analysis...</p>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'decreasing': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  }

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'increasing': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'decreasing': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const chartData = analysis.timeSeries.map((point: TimeSeriesPoint, index: number) => {
    const movingAvgPoint = analysis.movingAverage.find((ma: TimeSeriesPoint) => 
      ma.timestamp.getTime() === point.timestamp.getTime()
    );
    
    return {
      time: point.timestamp.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
      actual: point.value,
      movingAverage: movingAvgPoint?.value || null,
      timestamp: point.timestamp.getTime()
    };
  });

  const forecastData = forecast.map(point => ({
    time: point.timestamp.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
    forecast: point.value,
    timestamp: point.timestamp.getTime()
  }));

  const combinedData = [...chartData, ...forecastData.map(f => ({
    ...f,
    actual: null,
    movingAverage: null
  }))];

  const getMetricUnit = (metric: string) => {
    switch (metric) {
      case 'temperature': return '°C';
      case 'humidity': return '%';
      case 'pressure': return 'hPa';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Metric Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Time Series Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeMetric} onValueChange={(value) => setActiveMetric(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="temperature">Temperature</TabsTrigger>
              <TabsTrigger value="humidity">Humidity</TabsTrigger>
              <TabsTrigger value="pressure">Pressure</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Trend Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Trend Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <Badge className={getTrendColor(analysis.trend.direction)}>
                <div className="flex items-center gap-2">
                  {getTrendIcon(analysis.trend.direction)}
                  {analysis.trend.direction.toUpperCase()}
                </div>
              </Badge>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Strength</div>
                <div className="font-semibold">{(analysis.trend.strength * 100).toFixed(1)}%</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Slope:</span>
                <span className="font-medium">{analysis.trend.slope.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Next Hour:</span>
                <span className="font-medium">
                  {analysis.trend.prediction.toFixed(1)} {getMetricUnit(activeMetric)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Seasonal Pattern</CardTitle>
          </CardHeader>
          <CardContent>
            {analysis.seasonal ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Period:</span>
                  <span className="font-medium">{analysis.seasonal.period} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amplitude:</span>
                  <span className="font-medium">{analysis.seasonal.amplitude.toFixed(2)}</span>
                </div>
                <Badge className="w-full justify-center bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Pattern Detected
                </Badge>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <p>No clear seasonal pattern detected in the current data window.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-4 h-4" />
              Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Data Points:</span>
                <span className="font-medium">{analysis.timeSeries.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Current:</span>
                <span className="font-medium">
                  {analysis.timeSeries[analysis.timeSeries.length - 1]?.value.toFixed(1)} {getMetricUnit(activeMetric)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Average:</span>
                <span className="font-medium">
                  {(analysis.timeSeries.reduce((sum: number, p: TimeSeriesPoint) => sum + p.value, 0) / analysis.timeSeries.length).toFixed(1)} {getMetricUnit(activeMetric)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Series Chart */}
      <Card>
        <CardHeader>
          <CardTitle>
            {activeMetric.charAt(0).toUpperCase() + activeMetric.slice(1)} Time Series with Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={combinedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time"
                  interval="preserveStartEnd"
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(label) => `Time: ${label}`}
                  formatter={(value: any, name: string) => [
                    value ? `${value.toFixed(2)} ${getMetricUnit(activeMetric)}` : 'N/A',
                    name === 'actual' ? 'Actual' : name === 'movingAverage' ? 'Moving Average' : 'Forecast'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Actual"
                  connectNulls={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="movingAverage" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Moving Average"
                  connectNulls={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="forecast" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Forecast"
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}