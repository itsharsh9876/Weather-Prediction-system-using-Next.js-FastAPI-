import { WeatherData } from './weatherData';

export interface TimeSeriesPoint {
  timestamp: Date;
  value: number;
}

export interface TrendAnalysis {
  slope: number;
  direction: 'increasing' | 'decreasing' | 'stable';
  strength: number;
  prediction: number;
}

export interface SeasonalPattern {
  period: number;
  amplitude: number;
  phase: number;
}

export class TimeSeriesAnalyzer {
  // Calculate moving average
  static movingAverage(data: TimeSeriesPoint[], windowSize: number): TimeSeriesPoint[] {
    const result: TimeSeriesPoint[] = [];
    
    for (let i = windowSize - 1; i < data.length; i++) {
      const window = data.slice(i - windowSize + 1, i + 1);
      const avg = window.reduce((sum, point) => sum + point.value, 0) / windowSize;
      
      result.push({
        timestamp: data[i].timestamp,
        value: avg
      });
    }
    
    return result;
  }

  // Linear regression for trend analysis
  static linearRegression(data: TimeSeriesPoint[]): TrendAnalysis {
    const n = data.length;
    if (n < 2) {
      return { slope: 0, direction: 'stable', strength: 0, prediction: 0 };
    }

    // Convert timestamps to numerical values (hours since first point)
    const startTime = data[0].timestamp.getTime();
    const x = data.map(point => (point.timestamp.getTime() - startTime) / (1000 * 60 * 60));
    const y = data.map(point => point.value);

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);

    // Check for division by zero in slope calculation
    const denominator = n * sumXX - sumX * sumX;
    let slope = 0;
    let intercept = 0;
    
    if (Math.abs(denominator) > Number.EPSILON) {
      slope = (n * sumXY - sumX * sumY) / denominator;
      intercept = (sumY - slope * sumX) / n;
    } else {
      // All x values are the same or very close, no meaningful slope
      slope = 0;
      intercept = sumY / n;
    }

    // Ensure slope is finite
    if (!isFinite(slope)) {
      slope = 0;
    }
    if (!isFinite(intercept)) {
      intercept = sumY / n;
    }

    // Calculate correlation coefficient for strength
    const yMean = sumY / n;
    const totalSumSquares = y.reduce((acc, yi) => acc + (yi - yMean) ** 2, 0);
    
    let strength = 0;
    if (totalSumSquares > Number.EPSILON) {
      const residualSumSquares = y.reduce((acc, yi, i) => {
        const predicted = slope * x[i] + intercept;
        return acc + (yi - predicted) ** 2;
      }, 0);
      
      strength = Math.max(0, 1 - residualSumSquares / totalSumSquares);
    }

    // Ensure strength is finite and within valid range
    if (!isFinite(strength) || strength < 0) {
      strength = 0;
    }
    if (strength > 1) {
      strength = 1;
    }

    // Predict next value (1 hour ahead)
    const nextX = x[x.length - 1] + 1;
    let prediction = slope * nextX + intercept;
    
    // Ensure prediction is finite
    if (!isFinite(prediction)) {
      prediction = y[y.length - 1]; // Use last known value as fallback
    }

    let direction: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (Math.abs(slope) > 0.1) {
      direction = slope > 0 ? 'increasing' : 'decreasing';
    }

    return { slope, direction, strength, prediction };
  }

  // Detect seasonal patterns using simple autocorrelation
  static detectSeasonality(data: TimeSeriesPoint[], maxPeriod: number = 24): SeasonalPattern | null {
    if (data.length < maxPeriod * 2) return null;

    const values = data.map(d => d.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    
    let bestPeriod = 0;
    let bestCorrelation = 0;

    // Test different periods
    for (let period = 2; period <= Math.min(maxPeriod, data.length / 2); period++) {
      let correlation = 0;
      let count = 0;

      for (let i = 0; i < values.length - period; i++) {
        correlation += (values[i] - mean) * (values[i + period] - mean);
        count++;
      }

      if (count > 0) {
        correlation /= count;
      }
      
      if (Math.abs(correlation) > Math.abs(bestCorrelation)) {
        bestCorrelation = correlation;
        bestPeriod = period;
      }
    }

    if (Math.abs(bestCorrelation) < 0.3) return null; // Weak correlation

    // Calculate amplitude and phase
    const amplitude = Math.sqrt(Math.abs(bestCorrelation));
    const phase = 0; // Simplified - would need FFT for accurate phase

    return {
      period: bestPeriod,
      amplitude,
      phase
    };
  }

  // Forecast future values using trend and seasonality
  static forecast(data: TimeSeriesPoint[], hours: number): TimeSeriesPoint[] {
    if (data.length < 5) return [];

    const trend = this.linearRegression(data);
    const seasonal = this.detectSeasonality(data);
    
    const forecast: TimeSeriesPoint[] = [];
    const lastTimestamp = data[data.length - 1].timestamp;
    const startTime = data[0].timestamp.getTime();

    for (let h = 1; h <= hours; h++) {
      const futureTime = new Date(lastTimestamp.getTime() + h * 60 * 60 * 1000);
      const hoursFromStart = (futureTime.getTime() - startTime) / (1000 * 60 * 60);
      
      // Base prediction from trend
      let prediction = trend.slope * hoursFromStart + 
                      (data.reduce((sum, d) => sum + d.value, 0) / data.length);

      // Add seasonal component if detected
      if (seasonal) {
        const seasonalComponent = seasonal.amplitude * 
          Math.sin(2 * Math.PI * hoursFromStart / seasonal.period + seasonal.phase);
        prediction += seasonalComponent;
      }

      // Ensure prediction is finite
      if (!isFinite(prediction)) {
        prediction = data[data.length - 1].value; // Use last known value as fallback
      }

      forecast.push({
        timestamp: futureTime,
        value: prediction
      });
    }

    return forecast;
  }

  // Extract time series from weather data
  static extractTimeSeries(weatherData: WeatherData[], metric: keyof WeatherData): TimeSeriesPoint[] {
    return weatherData
      .filter(data => typeof data[metric] === 'number')
      .map(data => ({
        timestamp: data.timestamp,
        value: data[metric] as number
      }));
  }
}