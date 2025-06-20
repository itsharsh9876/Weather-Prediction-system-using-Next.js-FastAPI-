from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import uvicorn
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

from database import get_db, engine
from models import Base, WeatherReading
from schemas import WeatherDataCreate, WeatherDataResponse, WeatherForecastResponse
from weather_service import WeatherService
from prediction_service import PredictionService

# Load environment variables
load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Weather Prediction API",
    description="Advanced weather forecasting API with time series analysis",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
weather_service = WeatherService()
prediction_service = PredictionService()

@app.get("/")
async def root():
    return {"message": "Weather Prediction API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}

@app.post("/weather/", response_model=WeatherDataResponse)
async def create_weather_reading(
    weather_data: WeatherDataCreate,
    db: Session = Depends(get_db)
):
    """Create a new weather reading"""
    try:
        db_weather = WeatherReading(**weather_data.dict())
        db.add(db_weather)
        db.commit()
        db.refresh(db_weather)
        return db_weather
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/weather/", response_model=List[WeatherDataResponse])
async def get_weather_readings(
    skip: int = 0,
    limit: int = 100,
    hours: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get weather readings with optional time filtering"""
    query = db.query(WeatherReading)
    
    if hours:
        cutoff_time = datetime.now() - timedelta(hours=hours)
        query = query.filter(WeatherReading.timestamp >= cutoff_time)
    
    readings = query.order_by(WeatherReading.timestamp.desc()).offset(skip).limit(limit).all()
    return readings

@app.get("/weather/latest", response_model=WeatherDataResponse)
async def get_latest_weather(db: Session = Depends(get_db)):
    """Get the most recent weather reading"""
    latest = db.query(WeatherReading).order_by(WeatherReading.timestamp.desc()).first()
    if not latest:
        raise HTTPException(status_code=404, detail="No weather data found")
    return latest

@app.get("/weather/statistics")
async def get_weather_statistics(
    hours: int = 24,
    db: Session = Depends(get_db)
):
    """Get weather statistics for the specified time period"""
    cutoff_time = datetime.now() - timedelta(hours=hours)
    readings = db.query(WeatherReading).filter(
        WeatherReading.timestamp >= cutoff_time
    ).all()
    
    if not readings:
        raise HTTPException(status_code=404, detail="No data found for the specified period")
    
    return weather_service.calculate_statistics(readings)

@app.get("/weather/forecast", response_model=List[WeatherForecastResponse])
async def get_weather_forecast(
    days: int = 7,
    db: Session = Depends(get_db)
):
    """Generate weather forecast based on historical data"""
    # Get recent data for prediction
    recent_data = db.query(WeatherReading).order_by(
        WeatherReading.timestamp.desc()
    ).limit(168).all()  # Last 7 days
    
    if len(recent_data) < 24:
        raise HTTPException(
            status_code=400, 
            detail="Insufficient data for forecast generation"
        )
    
    forecast = prediction_service.generate_forecast(recent_data, days)
    return forecast

@app.get("/weather/analysis/trend")
async def get_trend_analysis(
    metric: str = "temperature",
    hours: int = 48,
    db: Session = Depends(get_db)
):
    """Analyze trends for a specific weather metric"""
    cutoff_time = datetime.now() - timedelta(hours=hours)
    readings = db.query(WeatherReading).filter(
        WeatherReading.timestamp >= cutoff_time
    ).order_by(WeatherReading.timestamp.asc()).all()
    
    if len(readings) < 10:
        raise HTTPException(
            status_code=400,
            detail="Insufficient data for trend analysis"
        )
    
    analysis = prediction_service.analyze_trend(readings, metric)
    return analysis

@app.get("/weather/analysis/seasonal")
async def get_seasonal_analysis(
    metric: str = "temperature",
    db: Session = Depends(get_db)
):
    """Detect seasonal patterns in weather data"""
    # Get last 30 days of data
    cutoff_time = datetime.now() - timedelta(days=30)
    readings = db.query(WeatherReading).filter(
        WeatherReading.timestamp >= cutoff_time
    ).order_by(WeatherReading.timestamp.asc()).all()
    
    if len(readings) < 100:
        raise HTTPException(
            status_code=400,
            detail="Insufficient data for seasonal analysis"
        )
    
    analysis = prediction_service.detect_seasonality(readings, metric)
    return analysis

@app.post("/weather/simulate")
async def simulate_weather_data(
    hours: int = 24,
    db: Session = Depends(get_db)
):
    """Generate and store simulated weather data for testing"""
    simulated_data = weather_service.generate_mock_data(hours)
    
    for data in simulated_data:
        db_weather = WeatherReading(**data)
        db.add(db_weather)
    
    db.commit()
    return {"message": f"Generated {len(simulated_data)} weather readings"}

@app.delete("/weather/cleanup")
async def cleanup_old_data(
    days: int = 30,
    db: Session = Depends(get_db)
):
    """Remove weather data older than specified days"""
    cutoff_time = datetime.now() - timedelta(days=days)
    deleted_count = db.query(WeatherReading).filter(
        WeatherReading.timestamp < cutoff_time
    ).delete()
    db.commit()
    
    return {"message": f"Deleted {deleted_count} old weather readings"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )