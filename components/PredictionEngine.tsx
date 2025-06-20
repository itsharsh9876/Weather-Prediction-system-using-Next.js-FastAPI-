"use client";

import { WeatherData } from '@/lib/weatherData';
import { TimeSeriesAnalyzer } from '@/lib/timeSeriesAnalysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap, 
  Brain, 
  Target, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Thermometer,
  Droplets,
  Gauge
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useState, useEffect } from 'react';

interface PredictionEngineProps {
  weatherData: WeatherData[];
}

interface Prediction {
  metric: string;
  current: number;
  predicted: number;
  confidence: number;
  change: 'increase' | 'decrease' | 'stable';
  severity: 'low' | 'medium' | 'high';
}

interface WeatherAlert {
  type: 'temperature' | 'humidity' | 'pressure' | 'general';
  message: string;
  severity: 'info' | 'warning' | 'danger';
  probability: number;
}

export function PredictionEngine({ weatherData }: PredictionEngineProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [modelAccuracy, setModelAccuracy] = useState(0);
  const [activeTab, setActiveTab] = useState('predictions');

  useEffect(() => {
    if (weatherData.length > 12) {
      generatePredictions();
      generateAlerts();
      calculateModelAccuracy();
    }
  }, [weatherData]);

  const generatePredictions = () => {
    const metrics = ['temperature', 'humidity', 'pressure'] as const;
    const newPredictions: Prediction[] = [];

    metrics.forEach(metric => {
      const timeSeries = TimeSeriesAnalyzer.extractTimeSeries(weatherData, metric);
      const trend = TimeSeriesAnalyzer.linearRegression(timeSeries);
      const current = timeSeries[timeSeries.length - 1]?.value || 0;
      
      // Simple prediction based on trend
      const predicted = trend.prediction;
      const confidence = Math.min(95, trend.strength * 100);
      
      let change: 'increase' | 'decrease' | 'stable' = 'stable';
      let severity: 'low' | 'medium' | 'high' = 'low';
      
      const changeAmount = Math.abs(predicted - current);
      
      if (trend.direction === 'increasing') {
        change = 'increase';
      } else if (trend.direction === 'decreasing') {
        change = 'decrease';
      }
      
      // Determine severity based on change magnitude
      if (metric === 'temperature' && changeAmount > 5) severity = 'high';
      else if (metric === 'humidity' && changeAmount > 20) severity = 'high';
      else if (metric === 'pressure' && changeAmount > 10) severity = 'high';
      else if (changeAmount > 2) severity = 'medium';

      newPredictions.push({
        metric,
        current,
        predicted,
        confidence,
        change,
        severity
      });
    });

    setPredictions(newPredictions);
  };

  const generateAlerts = () => {
    const newAlerts: WeatherAlert[] = [];
    const latest = weatherData[weatherData.length - 1];
    
    if (!latest) return;

    // Temperature alerts
    if (latest.temperature > 35) {
      newAlerts.push({
        type: 'temperature',
        message: 'Extreme heat warning - temperature above 35°C',
        severity: 'danger',
        probability: 95
      });
    } else if (latest.temperature < 0) {
      newAlerts.push({
        type: 'temperature',
        message: 'Freezing conditions detected',
        severity: 'warning',
        probability: 98
      });
    }

    // Humidity alerts
    if (latest.humidity > 90) {
      newAlerts.push({
        type: 'humidity',
        message: 'Very high humidity may cause discomfort',
        severity: 'info',
        probability: 85
      });
    }

    // Pressure alerts
    if (latest.pressure < 980) {
      newAlerts.push({
        type: 'pressure',
        message: 'Low pressure system - storm possible',
        severity: 'warning',
        probability: 75
      });
    } else if (latest.pressure > 1030) {
      newAlerts.push({
        type: 'pressure',
        message: 'High pressure - stable weather expected',
        severity: 'info',
        probability: 80
      });
    }

    // Precipitation alert
    if (latest.precipitation > 15) {
      newAlerts.push({
        type: 'general',
        message: 'Heavy precipitation detected',
        severity: 'warning',
        probability: 95
      });
    }

    setAlerts(newAlerts);
  };

  const calculateModelAccuracy = () => {
    // Simulate model accuracy based on data quality and quantity
    const dataQuality = Math.min(100, (weatherData.length / 100) * 100);
    const baseAccuracy = 75;
    const accuracy = Math.min(95, baseAccuracy + (dataQuality * 0.2));
    setModelAccuracy(accuracy);
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'temperature': return <Thermometer className="w-4 h-4 text-red-500" />;
      case 'humidity': return <Droplets className="w-4 h-4 text-blue-500" />;
      case 'pressure': return <Gauge className="w-4 h-4 text-green-500" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getChangeIcon = (change: string) => {
    switch (change) {
      case 'increase': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'decrease': return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
      default: return <Target className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'danger': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800';
      default: return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800';
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'danger': return <AlertTriangle className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      default: return <CheckCircle className="w-5 h-5" />;
    }
  };

  const getUnit = (metric: string) => {
    switch (metric) {
      case 'temperature': return '°C';
      case 'humidity': return '%';
      case 'pressure': return 'hPa';
      default: return '';
    }
  };

  // Prepare chart data for visualization
  const chartData = weatherData.slice(-24).map((data, index) => ({
    time: data.timestamp.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
    temperature: data.temperature,
    humidity: data.humidity,
    pressure: data.pressure / 10, // Scale for visualization
    index
  }));

  return (
    <div className="space-y-6">
      {/* Model Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Model Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Accuracy:</span>
                <span className="font-semibold">{modelAccuracy.toFixed(1)}%</span>
              </div>
              <Progress value={modelAccuracy} className="h-2" />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Data Points:</span>
                <span className="font-medium">{weatherData.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Next Update
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">5:00</div>
              <div className="text-sm text-muted-foreground">minutes remaining</div>
              <Badge className="mt-2 bg-green-100 text-green-800">
                Active Monitoring
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{alerts.length}</div>
              <div className="text-sm text-muted-foreground">active alerts</div>
              <Badge className={alerts.length > 0 ? 'bg-orange-100 text-orange-800 mt-2' : 'bg-green-100 text-green-800 mt-2'}>
                {alerts.length > 0 ? 'Attention Required' : 'All Clear'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="analysis">Model Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-6">
          {/* Predictions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {predictions.map((prediction, index) => (
              <Card key={index}>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getMetricIcon(prediction.metric)}
                    {prediction.metric.charAt(0).toUpperCase() + prediction.metric.slice(1)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Current:</span>
                      <span className="font-semibold">{prediction.current.toFixed(1)} {getUnit(prediction.metric)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Predicted:</span>
                      <span className="font-semibold text-blue-600">{prediction.predicted.toFixed(1)} {getUnit(prediction.metric)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Confidence:</span>
                      <span className="font-semibold">{prediction.confidence.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Trend:</span>
                      <div className="flex items-center gap-2">
                        {getChangeIcon(prediction.change)}
                        <Badge className={getSeverityColor(prediction.severity)}>
                          {prediction.severity.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Active Alerts</h3>
                <p className="text-muted-foreground">Weather conditions are normal. System is monitoring continuously.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert, index) => (
                <Card key={index} className={`border-l-4 ${getAlertColor(alert.severity)}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {getAlertIcon(alert.severity)}
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{alert.message}</h4>
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="outline">
                            {alert.type.toUpperCase()}
                          </Badge>
                          <span>Probability: {alert.probability}%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Prediction Model Analysis</CardTitle>
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
                    {predictions.length > 0 && (
                      <ReferenceLine 
                        x={chartData.length - 1} 
                        stroke="#f59e0b" 
                        strokeDasharray="5 5" 
                        label="Prediction Point"
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}