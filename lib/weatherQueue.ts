import { WeatherData } from './weatherData';

export class WeatherDataQueue {
  private queue: WeatherData[] = [];
  private maxSize: number;

  constructor(maxSize: number = 50) {
    this.maxSize = maxSize;
  }

  enqueue(data: WeatherData): void {
    this.queue.push(data);
    
    // Remove oldest data if queue exceeds max size
    if (this.queue.length > this.maxSize) {
      this.queue.shift();
    }
  }

  dequeue(): WeatherData | undefined {
    return this.queue.shift();
  }

  peek(): WeatherData | undefined {
    return this.queue[0];
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  size(): number {
    return this.queue.length;
  }

  getAll(): WeatherData[] {
    return [...this.queue];
  }

  clear(): void {
    this.queue = [];
  }

  // Get recent data within a time window
  getRecentData(minutes: number): WeatherData[] {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
    return this.queue.filter(data => data.timestamp >= cutoffTime);
  }

  // Get statistics from queue data
  getStatistics() {
    if (this.queue.length === 0) {
      return null;
    }

    const temperatures = this.queue.map(d => d.temperature);
    const humidities = this.queue.map(d => d.humidity);
    const pressures = this.queue.map(d => d.pressure);

    return {
      temperature: {
        avg: temperatures.reduce((a, b) => a + b, 0) / temperatures.length,
        min: Math.min(...temperatures),
        max: Math.max(...temperatures)
      },
      humidity: {
        avg: humidities.reduce((a, b) => a + b, 0) / humidities.length,
        min: Math.min(...humidities),
        max: Math.max(...humidities)
      },
      pressure: {
        avg: pressures.reduce((a, b) => a + b, 0) / pressures.length,
        min: Math.min(...pressures),
        max: Math.max(...pressures)
      },
      totalReadings: this.queue.length,
      oldestReading: this.queue[0]?.timestamp,
      newestReading: this.queue[this.queue.length - 1]?.timestamp
    };
  }
}