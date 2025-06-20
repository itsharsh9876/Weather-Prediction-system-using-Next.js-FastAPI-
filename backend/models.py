from sqlalchemy import Column, Integer, Float, String, DateTime, Enum
from sqlalchemy.sql import func
from database import Base
import enum

class WeatherCondition(enum.Enum):
    SUNNY = "sunny"
    CLOUDY = "cloudy"
    RAINY = "rainy"
    STORMY = "stormy"
    SNOWY = "snowy"

class WeatherReading(Base):
    __tablename__ = "weather_readings"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=func.now(), index=True)
    temperature = Column(Float, nullable=False)
    humidity = Column(Integer, nullable=False)
    pressure = Column(Float, nullable=False)
    wind_speed = Column(Float, nullable=False)
    wind_direction = Column(Float, nullable=False)
    precipitation = Column(Float, default=0.0)
    condition = Column(Enum(WeatherCondition), nullable=False)
    uv_index = Column(Float, default=0.0)
    visibility = Column(Float, default=10.0)
    location = Column(String(100), default="Unknown")
    
    # Metadata
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<WeatherReading(id={self.id}, temp={self.temperature}°C, time={self.timestamp})>"