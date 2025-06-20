import math
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from models import WeatherReading, WeatherCondition
from schemas import WeatherForecastResponse, TrendAnalysis, SeasonalAnalysis

class PredictionService:
    def __init__(self):
        pass

    def generate_forecast(self, historical_data: List[WeatherReading], days: int) -> List[WeatherForecastResponse]:
        """Generate weather forecast based on historical data"""
        if len(historical_data) < 24:
            raise ValueError("Insufficient historical data for forecast")

        forecasts = []
        base_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Analyze recent trends
        temp_trend = self._calculate_trend([r.temperature for r in historical_data[-48:]])
        humidity_trend = self._calculate_trend([r.humidity for r in historical_data[-48:]])
        
        for day in range(days):
            forecast_date = base_date + timedelta(days=day)
            
            # Base predictions on recent averages with trend
            recent_temps = [r.temperature for r in historical_data[-24:]]
            recent_humidity = [r.humidity for r in historical_data[-24:]]
            
            base_temp = sum(recent_temps) / len(recent_temps)
            base_humidity = sum(recent_humidity) / len(recent_humidity)
            
            # Apply trend
            temp_change = temp_trend * day * 0.5  # Gradual change
            humidity_change = humidity_trend * day * 0.3
            
            # Add seasonal and random variations
            seasonal_temp = 3 * math.sin((day + 180) * math.pi / 182.5)  # Yearly cycle
            daily_temp_range = 8 + abs(seasonal_temp)
            
            high_temp = base_temp + temp_change + seasonal_temp + daily_temp_range/2
            low_temp = base_temp + temp_change + seasonal_temp - daily_temp_range/2
            
            forecast_humidity = max(20, min(100, base_humidity + humidity_change))
            
            # Determine condition based on trends and randomness
            condition = self._predict_condition(high_temp, low_temp, forecast_humidity, day)
            
            # Calculate precipitation probability
            precip_prob = self._calculate_precipitation_probability(condition, forecast_humidity)
            
            forecasts.append(WeatherForecastResponse(
                date=forecast_date,
                high_temperature=round(high_temp, 1),
                low_temperature=round(low_temp, 1),
                condition=condition,
                precipitation_probability=precip_prob,
                humidity=int(forecast_humidity),
                description=self._generate_description(condition, high_temp, precip_prob)
            ))
        
        return forecasts

    def analyze_trend(self, readings: List[WeatherReading], metric: str) -> TrendAnalysis:
        """Analyze trend for a specific weather metric"""
        if len(readings) < 10:
            raise ValueError("Insufficient data for trend analysis")

        # Extract values for the specified metric
        values = []
        for reading in readings:
            if metric == "temperature":
                values.append(reading.temperature)
            elif metric == "humidity":
                values.append(float(reading.humidity))
            elif metric == "pressure":
                values.append(reading.pressure)
            elif metric == "wind_speed":
                values.append(reading.wind_speed)
            else:
                raise ValueError(f"Unsupported metric: {metric}")

        # Calculate linear regression
        n = len(values)
        x = list(range(n))
        
        sum_x = sum(x)
        sum_y = sum(values)
        sum_xy = sum(x[i] * values[i] for i in range(n))
        sum_x2 = sum(xi ** 2 for xi in x)
        
        # Calculate slope and intercept
        denominator = n * sum_x2 - sum_x ** 2
        if abs(denominator) < 1e-10:
            slope = 0
            intercept = sum_y / n
        else:
            slope = (n * sum_xy - sum_x * sum_y) / denominator
            intercept = (sum_y - slope * sum_x) / n

        # Calculate correlation coefficient (strength)
        y_mean = sum_y / n
        ss_tot = sum((yi - y_mean) ** 2 for yi in values)
        ss_res = sum((values[i] - (slope * x[i] + intercept)) ** 2 for i in range(n))
        
        if ss_tot == 0:
            r_squared = 0
        else:
            r_squared = 1 - (ss_res / ss_tot)
        
        strength = max(0, r_squared)
        
        # Determine direction
        if abs(slope) < 0.01:
            direction = "stable"
        elif slope > 0:
            direction = "increasing"
        else:
            direction = "decreasing"
        
        # Predict next value
        next_x = n
        prediction = slope * next_x + intercept
        
        # Calculate confidence based on data consistency
        confidence = min(95, strength * 100)
        
        return TrendAnalysis(
            metric=metric,
            slope=slope,
            direction=direction,
            strength=strength,
            prediction=prediction,
            confidence=confidence
        )

    def detect_seasonality(self, readings: List[WeatherReading], metric: str) -> SeasonalAnalysis:
        """Detect seasonal patterns in weather data"""
        if len(readings) < 48:  # Need at least 2 days of data
            return SeasonalAnalysis(
                metric=metric,
                period_hours=None,
                amplitude=None,
                pattern_detected=False,
                description="Insufficient data for seasonal analysis"
            )

        # Extract values
        values = []
        for reading in readings:
            if metric == "temperature":
                values.append(reading.temperature)
            elif metric == "humidity":
                values.append(float(reading.humidity))
            elif metric == "pressure":
                values.append(reading.pressure)
            else:
                values.append(reading.wind_speed)

        # Simple autocorrelation for period detection
        best_period = None
        best_correlation = 0
        
        # Test periods from 6 to 48 hours
        for period in range(6, min(48, len(values) // 2)):
            correlation = self._calculate_autocorrelation(values, period)
            if abs(correlation) > abs(best_correlation):
                best_correlation = correlation
                best_period = period

        pattern_detected = abs(best_correlation) > 0.3
        
        if pattern_detected:
            # Calculate amplitude
            amplitude = self._calculate_amplitude(values, best_period)
            description = f"Detected {best_period}-hour cycle with correlation {best_correlation:.2f}"
        else:
            amplitude = None
            description = "No significant seasonal pattern detected"

        return SeasonalAnalysis(
            metric=metric,
            period_hours=best_period if pattern_detected else None,
            amplitude=amplitude,
            pattern_detected=pattern_detected,
            description=description
        )

    def _calculate_trend(self, values: List[float]) -> float:
        """Calculate simple trend slope"""
        if len(values) < 2:
            return 0
        
        n = len(values)
        x = list(range(n))
        sum_x = sum(x)
        sum_y = sum(values)
        sum_xy = sum(x[i] * values[i] for i in range(n))
        sum_x2 = sum(xi ** 2 for xi in x)
        
        denominator = n * sum_x2 - sum_x ** 2
        if abs(denominator) < 1e-10:
            return 0
        
        return (n * sum_xy - sum_x * sum_y) / denominator

    def _predict_condition(self, high_temp: float, low_temp: float, humidity: float, day_offset: int) -> WeatherCondition:
        """Predict weather condition based on temperature and humidity"""
        avg_temp = (high_temp + low_temp) / 2
        
        # Add some randomness based on day offset
        random_factor = (day_offset * 17) % 100 / 100  # Pseudo-random 0-1
        
        if humidity > 80 and random_factor > 0.3:
            return WeatherCondition.RAINY if avg_temp > 5 else WeatherCondition.SNOWY
        elif humidity > 70 and random_factor > 0.5:
            return WeatherCondition.STORMY if avg_temp > 15 else WeatherCondition.RAINY
        elif humidity > 60 or random_factor > 0.7:
            return WeatherCondition.CLOUDY
        else:
            return WeatherCondition.SUNNY

    def _calculate_precipitation_probability(self, condition: WeatherCondition, humidity: float) -> float:
        """Calculate precipitation probability based on condition and humidity"""
        base_prob = {
            WeatherCondition.SUNNY: 5,
            WeatherCondition.CLOUDY: 20,
            WeatherCondition.RAINY: 80,
            WeatherCondition.STORMY: 95,
            WeatherCondition.SNOWY: 85
        }
        
        prob = base_prob.get(condition, 10)
        
        # Adjust based on humidity
        if humidity > 70:
            prob += 10
        elif humidity < 40:
            prob -= 10
        
        return max(0, min(100, prob))

    def _generate_description(self, condition: WeatherCondition, temp: float, precip_prob: float) -> str:
        """Generate human-readable weather description"""
        condition_desc = {
            WeatherCondition.SUNNY: "Clear and sunny",
            WeatherCondition.CLOUDY: "Partly cloudy",
            WeatherCondition.RAINY: "Rain expected",
            WeatherCondition.STORMY: "Thunderstorms likely",
            WeatherCondition.SNOWY: "Snow expected"
        }
        
        base_desc = condition_desc.get(condition, "Variable conditions")
        
        if temp > 30:
            temp_desc = "Very warm"
        elif temp > 20:
            temp_desc = "Pleasant"
        elif temp > 10:
            temp_desc = "Cool"
        else:
            temp_desc = "Cold"
        
        if precip_prob > 70:
            precip_desc = "High chance of precipitation"
        elif precip_prob > 30:
            precip_desc = "Possible precipitation"
        else:
            precip_desc = "Low chance of precipitation"
        
        return f"{base_desc}. {temp_desc} temperatures. {precip_desc}."

    def _calculate_autocorrelation(self, values: List[float], lag: int) -> float:
        """Calculate autocorrelation at given lag"""
        if len(values) <= lag:
            return 0
        
        n = len(values) - lag
        mean = sum(values) / len(values)
        
        numerator = sum((values[i] - mean) * (values[i + lag] - mean) for i in range(n))
        denominator = sum((x - mean) ** 2 for x in values)
        
        if denominator == 0:
            return 0
        
        return numerator / denominator

    def _calculate_amplitude(self, values: List[float], period: int) -> float:
        """Calculate amplitude of periodic signal"""
        if len(values) < period * 2:
            return 0
        
        # Simple amplitude calculation as standard deviation
        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        return math.sqrt(variance)