from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from enum import Enum

class WeatherCondition(str, Enum):
    SUNNY = "sunny"
    CLOUDY = "cloudy"
    RAINY = "rainy"
    STORMY = "stormy"
    SNOWY = "snowy"

class WeatherDataCreate(BaseModel):
    temperature: float = Field(..., ge=-50, le=60, description="Temperature in Celsius")
    humidity: int = Field(..., ge=0, le=100, description="Humidity percentage")
    pressure: float = Field(..., ge=800, le=1200, description="Atmospheric pressure in hPa")
    wind_speed: float = Field(..., ge=0, le=200, description="Wind speed in km/h")
    wind_direction: float = Field(..., ge=0, le=360, description="Wind direction in degrees")
    precipitation: float = Field(default=0.0, ge=0, description="Precipitation in mm")
    condition: WeatherCondition
    uv_index: float = Field(default=0.0, ge=0, le=15, description="UV index")
    visibility: float = Field(default=10.0, ge=0, le=50, description="Visibility in km")
    location: Optional[str] = Field(default="Unknown", max_length=100)

class WeatherDataResponse(BaseModel):
    id: int
    timestamp: datetime
    temperature: float
    humidity: int
    pressure: float
    wind_speed: float
    wind_direction: float
    precipitation: float
    condition: WeatherCondition
    uv_index: float
    visibility: float
    location: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class WeatherForecastResponse(BaseModel):
    date: datetime
    high_temperature: float
    low_temperature: float
    condition: WeatherCondition
    precipitation_probability: float
    humidity: int
    description: str

class TrendAnalysis(BaseModel):
    metric: str
    slope: float
    direction: str
    strength: float
    prediction: float
    confidence: float

class SeasonalAnalysis(BaseModel):
    metric: str
    period_hours: Optional[int]
    amplitude: Optional[float]
    pattern_detected: bool
    description: str

class WeatherStatistics(BaseModel):
    period_hours: int
    total_readings: int
    temperature: dict
    humidity: dict
    pressure: dict
    wind_speed: dict
    precipitation: dict
    most_common_condition: str