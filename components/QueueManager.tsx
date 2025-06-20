"use client";

import { WeatherData } from '@/lib/weatherData';
import { WeatherDataQueue } from '@/lib/weatherQueue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Database, 
  Play, 
  Pause, 
  Trash2, 
  BarChart3, 
  Clock,
  Thermometer,
  Droplets,
  Gauge,
  Activity
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';

interface QueueManagerProps {
  queue: WeatherDataQueue;
  queueData: WeatherData[];
  onDataUpdate: (data: WeatherData[]) => void;
}

export function QueueManager({ queue, queueData, onDataUpdate }: QueueManagerProps) {
  const [isProcessing, setIsProcessing] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [processedCount, setProcessedCount] = useState(0);

  useEffect(() => {
    const statistics = queue.getStatistics();
    setStats(statistics);
  }, [queueData, queue]);

  const handleToggleProcessing = () => {
    setIsProcessing(!isProcessing);
  };

  const handleClearQueue = () => {
    queue.clear();
    onDataUpdate([]);
    setProcessedCount(0);
  };

  const handleProcessData = () => {
    if (queue.size() > 0) {
      const processed = queue.dequeue();
      if (processed) {
        setProcessedCount(prev => prev + 1);
        onDataUpdate([...queue.getAll()]);
      }
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

  const chartData = queueData.slice(-20).map((data, index) => ({
    index: index + 1,
    temperature: data.temperature,
    humidity: data.humidity,
    pressure: data.pressure / 10, // Scale for better visualization
    time: data.timestamp.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
  }));

  return (
    <div className="space-y-6">
      {/* Queue Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="w-5 h-5" />
              Queue Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Size:</span>
                <Badge variant="secondary">{queue.size()}/50</Badge>
              </div>
              <Progress value={(queue.size() / 50) * 100} className="h-2" />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={isProcessing ? "destructive" : "default"}
                  onClick={handleToggleProcessing}
                  className="flex-1"
                >
                  {isProcessing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClearQueue}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Processing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Processed:</span>
                <span className="font-semibold">{processedCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge className={isProcessing ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {isProcessing ? 'Active' : 'Paused'}
                </Badge>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleProcessData}
                disabled={queue.isEmpty()}
                className="w-full"
              >
                Process Next
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Timing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Oldest Reading:</div>
              <div className="text-sm font-medium">
                {stats?.oldestReading?.toLocaleTimeString() || 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground">Newest Reading:</div>
              <div className="text-sm font-medium">
                {stats?.newestReading?.toLocaleTimeString() || 'N/A'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-red-500" />
                  <span className="text-sm">{stats.temperature.avg.toFixed(1)}°C</span>
                </div>
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">{stats.humidity.avg.toFixed(1)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-green-500" />
                  <span className="text-sm">{stats.pressure.avg.toFixed(1)} hPa</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Queue Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Real-time Data Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="temperature" 
                  stackId="1"
                  stroke="#ef4444" 
                  fill="#ef4444"
                  fillOpacity={0.3}
                  name="Temperature (°C)"
                />
                <Area 
                  type="monotone" 
                  dataKey="humidity" 
                  stackId="2"
                  stroke="#3b82f6" 
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  name="Humidity (%)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Queue Items */}
      <Card>
        <CardHeader>
          <CardTitle>Queue Contents ({queueData.length} items)</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {queueData.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Queue is empty</p>
              ) : (
                queueData.map((data, index) => (
                  <div key={data.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <div>
                        <div className="font-medium">
                          {data.temperature.toFixed(1)}°C, {data.humidity}%, {data.pressure.toFixed(1)} hPa
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {data.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <Badge className={getConditionColor(data.condition)}>
                      {data.condition}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}