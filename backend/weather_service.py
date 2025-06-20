import random
import math
from datetime import datetime, timedelta
from typing import List, Dict, Any
from models import WeatherReading, WeatherCondition

class WeatherService:
    def __init__(self):
        self.base_conditions = {
            'temperature': 22.0,
            'humidity': 60,
            'pressure': 1013.25,
            'wind_speed': 10.0
        }

    def generate_mock_data(self, hours: int) -> List[Dict[str, Any]]:
        """Generate realistic mock weather data"""
        data = []
        now = datetime.now()
        
        # Evolving base conditions
        temp_base = self.base_conditions['temperature'] + random.uniform(-10, 15)
        humidity_base = self.base_conditions['humidity'] + random.uniform(-20, 20)
        pressure_base = self.base_conditions['pressure'] + random.uniform(-30, 30)
        
        for i in range(hours):
            timestamp = now - timedelta(hours=hours-i-1)
            hour_of_day = timestamp.hour
            
            # Daily temperature cycle
            temp_cycle = 8 * math.sin((hour_of_day - 6) * math.pi / 12)
            temperature = temp_base + temp_cycle + random.uniform(-3, 3)
            
            # Humidity inversely related to temperature
            humidity = max(20, min(100, humidity_base - (temperature - temp_base) * 2 + random.uniform(-10, 10)))
            
            # Pressure with slow variations
            pressure = pressure_base + random.uniform(-5, 5)
            
            # Wind speed
            wind_speed = max(0, 5 + random.uniform(-3, 15))
            wind_direction = random.uniform(0, 360)
            
            # Determine weather condition
            condition = self._determine_condition(temperature, humidity, pressure)
            
            # Precipitation based on condition
            precipitation = self._calculate_precipitation(condition)
            
            # UV index based on time and condition
            uv_index = self._calculate_uv_index(hour_of_day, condition)
            
            # Visibility based on condition
            visibility = self._calculate_visibility(condition, precipitation)
            
            data.append({
                'timestamp': timestamp,
                'temperature': round(temperature, 1),
                'humidity': int(humidity),
                'pressure': round(pressure, 1),
                'wind_speed': round(wind_speed, 1),
                'wind_direction': round(wind_direction, 1),
                'precipitation': round(precipitation, 1),
                'condition': condition,
                'uv_index': round(uv_index, 1),
                'visibility': round(visibility, 1),
                'location': 'Simulated Location'
            })
            
            # Gradually evolve base conditions
            temp_base += random.uniform(-0.5, 0.5)
            humidity_base += random.uniform(-1, 1)
            pressure_base += random.uniform(-0.5, 0.5)
        
        return data

    def _determine_condition(self, temperature: float, humidity: float, pressure: float) -> WeatherCondition:
        """Determine weather condition based on metrics"""
        if pressure < 990 and humidity > 80:
            return WeatherCondition.STORMY
        elif humidity > 75 and pressure < 1005:
            return WeatherCondition.RAINY
        elif temperature < 0 and humidity > 70:
            return WeatherCondition.SNOWY
        elif humidity > 60 or pressure < 1010:
            return WeatherCondition.CLOUDY
        else:
            return WeatherCondition.SUNNY

    def _calculate_precipitation(self, condition: WeatherCondition) -> float:
        """Calculate precipitation based on weather condition"""
        if condition == WeatherCondition.STORMY:
            return random.uniform(5, 25)
        elif condition == WeatherCondition.RAINY:
            return random.uniform(1, 15)
        elif condition == WeatherCondition.SNOWY:
            return random.uniform(2, 20)
        else:
            return 0.0

    def _calculate_uv_index(self, hour: int, condition: WeatherCondition) -> float:
        """Calculate UV index based on time and weather"""
        if 6 <= hour <= 18:  # Daylight hours
            base_uv = 8 * math.sin((hour - 6) * math.pi / 12)
            if condition == WeatherCondition.SUNNY:
                return max(0, base_uv + random.uniform(-1, 2))
            elif condition == WeatherCondition.CLOUDY:
                return max(0, base_uv * 0.7 + random.uniform(-1, 1))
            else:
                return max(0, base_uv * 0.3 + random.uniform(-0.5, 0.5))
        return 0.0

    def _calculate_visibility(self, condition: WeatherCondition, precipitation: float) -> float:
        """Calculate visibility based on weather conditions"""
        if condition == WeatherCondition.STORMY:
            return random.uniform(1, 5)
        elif condition == WeatherCondition.RAINY:
            return max(2, 10 - precipitation * 0.5)
        elif condition == WeatherCondition.SNOWY:
            return random.uniform(1, 8)
        elif condition == WeatherCondition.CLOUDY:
            return random.uniform(8, 15)
        else:
            return random.uniform(15, 50)

    def calculate_statistics(self, readings: List[WeatherReading]) -> Dict[str, Any]:
        """Calculate comprehensive statistics from weather readings"""
        if not readings:
            return {}

        temperatures = [r.temperature for r in readings]
        humidities = [r.humidity for r in readings]
        pressures = [r.pressure for r in readings]
        wind_speeds = [r.wind_speed for r in readings]
        precipitations = [r.precipitation for r in readings]
        
        # Count conditions
        condition_counts = {}
        for reading in readings:
            condition = reading.condition.value
            condition_counts[condition] = condition_counts.get(condition, 0) + 1
        
        most_common_condition = max(condition_counts, key=condition_counts.get)

        return {
            'period_hours': len(readings),
            'total_readings': len(readings),
            'temperature': {
                'avg': sum(temperatures) / len(temperatures),
                'min': min(temperatures),
                'max': max(temperatures),
                'std': self._calculate_std(temperatures)
            },
            'humidity': {
                'avg': sum(humidities) / len(humidities),
                'min': min(humidities),
                'max': max(humidities),
                'std': self._calculate_std(humidities)
            },
            'pressure': {
                'avg': sum(pressures) / len(pressures),
                'min': min(pressures),
                'max': max(pressures),
                'std': self._calculate_std(pressures)
            },
            'wind_speed': {
                'avg': sum(wind_speeds) / len(wind_speeds),
                'min': min(wind_speeds),
                'max': max(wind_speeds),
                'std': self._calculate_std(wind_speeds)
            },
            'precipitation': {
                'total': sum(precipitations),
                'avg': sum(precipitations) / len(precipitations),
                'max': max(precipitations)
            },
            'most_common_condition': most_common_condition,
            'condition_distribution': condition_counts
        }

    def _calculate_std(self, values: List[float]) -> float:
        """Calculate standard deviation"""
        if len(values) < 2:
            return 0.0
        
        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / (len(values) - 1)
        return math.sqrt(variance)