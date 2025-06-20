"use client";

import { useState, useEffect } from 'react';
import { WeatherDashboard } from '@/components/WeatherDashboard';
import { TimeSeriesAnalysis } from '@/components/TimeSeriesAnalysis';
import { QueueManager } from '@/components/QueueManager';
import { PredictionEngine } from '@/components/PredictionEngine';
import { LocationSearch } from '@/components/LocationSearch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WeatherDataQueue } from '@/lib/weatherQueue';
import { WeatherDataService } from '@/lib/weatherDataApi';
import { generateMockWeatherData, WeatherData } from '@/lib/weatherData';
import { Cloud, TrendingUp, Database, Zap, Wifi, WifiOff, RefreshCw } from 'lucide-react';

export default function Home() {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [currentLocation, setCurrentLocation] = useState('New York, NY');
  const [weatherQueue] = useState(() => new WeatherDataQueue());
  const [queueData, setQueueData] = useState<WeatherData[]>([]);
  const [apiConnected, setApiConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    setIsLoading(true);
    
    // Check API health
    const apiHealthy = await WeatherDataService.checkApiHealth();
    setApiConnected(apiHealthy);

    if (apiHealthy) {
      try {
        // Try to fetch real data from API
        const apiData = await WeatherDataService.fetchWeatherData(168);
        
        if (apiData.length === 0) {
          // Initialize with sample data if database is empty
          await WeatherDataService.initializeSampleData();
          const newData = await WeatherDataService.fetchWeatherData(168);
          setWeatherData(newData);
        } else {
          setWeatherData(apiData);
        }
      } catch (error) {
        console.error('Failed to load API data:', error);
        // Fallback to mock data
        const mockData = generateMockWeatherData(168);
        setWeatherData(mockData);
      }
    } else {
      // Use mock data when API is not available
      const mockData = generateMockWeatherData(168);
      setWeatherData(mockData);
    }

    setIsLoading(false);
    
    // Start real-time simulation
    startRealTimeSimulation();
  };

  const startRealTimeSimulation = () => {
    const interval = setInterval(async () => {
      if (apiConnected) {
        try {
          // Fetch latest data from API
          const latest = await WeatherDataService.fetchLatestWeather();
          if (latest) {
            weatherQueue.enqueue(latest);
            setQueueData([...weatherQueue.getAll()]);
            
            // Update main data
            setWeatherData(prev => [...prev.slice(1), latest]);
          }
        } catch (error) {
          console.error('Failed to fetch real-time data:', error);
        }
      } else {
        // Fallback to mock data generation
        const newReading = generateMockWeatherData(1)[0];
        weatherQueue.enqueue(newReading);
        setQueueData([...weatherQueue.getAll()]);
        setWeatherData(prev => [...prev.slice(1), newReading]);
      }
    }, 5000);

    return () => clearInterval(interval);
  };

  const handleRefreshData = async () => {
    await initializeData();
  };

  const handleInitializeSampleData = async () => {
    if (apiConnected) {
      try {
        await WeatherDataService.initializeSampleData();
        const newData = await WeatherDataService.fetchWeatherData(168);
        setWeatherData(newData);
      } catch (error) {
        console.error('Failed to initialize sample data:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center">
        <Card className="p-8">
          <CardContent className="flex items-center gap-4">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold">Loading Weather System</h3>
              <p className="text-muted-foreground">Connecting to services...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Weather Prediction System
            </h1>
            <div className="flex items-center gap-2">
              {apiConnected ? (
                <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                  <Wifi className="w-3 h-3" />
                  API Connected
                </Badge>
              ) : (
                <Badge className="bg-orange-100 text-orange-800 flex items-center gap-1">
                  <WifiOff className="w-3 h-3" />
                  Mock Mode
                </Badge>
              )}
            </div>
          </div>
          <p className="text-xl text-muted-foreground mb-6">
            Advanced weather forecasting using time series analysis and queue-based data processing
          </p>
          <div className="flex items-center justify-center gap-4 mb-6">
            <LocationSearch onLocationChange={setCurrentLocation} />
            <Button onClick={handleRefreshData} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            {apiConnected && (
              <Button onClick={handleInitializeSampleData} variant="outline" size="sm">
                <Database className="w-4 h-4 mr-2" />
                Generate Sample Data
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Cloud className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Time Series
            </TabsTrigger>
            <TabsTrigger value="queue" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Data Queue
            </TabsTrigger>
            <TabsTrigger value="predictions" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Predictions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <WeatherDashboard 
              weatherData={weatherData} 
              location={currentLocation}
            />
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <TimeSeriesAnalysis weatherData={weatherData} />
          </TabsContent>

          <TabsContent value="queue" className="space-y-6">
            <QueueManager 
              queue={weatherQueue} 
              queueData={queueData}
              onDataUpdate={setQueueData}
            />
          </TabsContent>

          <TabsContent value="predictions" className="space-y-6">
            <PredictionEngine weatherData={weatherData} />
          </TabsContent>
        </Tabs>

        <Card className="mt-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-center">System Architecture</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="space-y-2">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto">
                  <Cloud className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold">Next.js Frontend</h3>
                <p className="text-sm text-muted-foreground">React-based UI with real-time updates</p>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
              <div className="space-y-2">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                  <Zap className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold">FastAPI Backend</h3>
                <p className="text-sm text-muted-foreground">Python API for data processing</p>
                <Badge className={apiConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {apiConnected ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto">
                  <Database className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-semibold">MySQL Database</h3>
                <p className="text-sm text-muted-foreground">Persistent storage for weather data</p>
                <Badge className={apiConnected ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                  {apiConnected ? 'Connected' : 'Mock Data'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}