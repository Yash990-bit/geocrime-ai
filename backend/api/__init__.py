
from fastapi import APIRouter, HTTPException
from backend.schemas import PredictionRequest, PredictionResponse, HotspotResponse
from src.models.classification_model import RiskClassificationModel
from src.models.clustering_model import HotspotClusteringModel
import pandas as pd
import numpy as np

router = APIRouter()

# Load models (Global valid for simple use case; for prod use lifespan)
risk_model = RiskClassificationModel()
risk_model.load()

# Load clustered data for hotspots
try:
    clustered_data = pd.read_csv("data/processed/clustered_crime_data.csv")
except Exception:
    clustered_data = pd.DataFrame() # Fallback

@router.post("/predict", response_model=PredictionResponse)
def predict_risk(request: PredictionRequest):
    try:
        # Preprocess input (matches training logic)
        dt = pd.to_datetime(request.date)
        input_data = pd.DataFrame([{
            "latitude": request.latitude,
            "longitude": request.longitude,
            "hour": dt.hour,
            "day_of_week": dt.dayofweek,
            "month": dt.month
        }])
        
        # Predict
        risk_prob = risk_model.predict_proba(input_data)[0][1] # Probability of High Risk
        risk_label = "High Risk" if risk_prob > 0.5 else "Low Risk"
        
        return {
            "risk_level": risk_label,
            "risk_score": float(risk_prob)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/hotspots")
def get_hotspots():
    """Return centroids of high-density clusters"""
    if clustered_data.empty:
        return {"clusters": []}
        
    # Group by cluster and calculate mean lat/lon
    # Filter out noise (-1)
    valid_clusters = clustered_data[clustered_data["cluster"] != -1]
    centroids = valid_clusters.groupby("cluster")[["latitude", "longitude"]].mean().reset_index()
    
    # Add count per cluster for weight
    counts = valid_clusters.groupby("cluster").size().reset_index(name="count")
    result = pd.merge(centroids, counts, on="cluster")
    
    return {"clusters": result.to_dict(orient="records")}

@router.get("/heatmap-data")
def get_heatmap_data(
    crime_type: str = None,
    start_date: str = None,
    end_date: str = None
):
    """Return filtered points for heatmap"""
    if clustered_data.empty:
        return []
    
    df = clustered_data.copy()
    
    # Apply filters
    if crime_type and crime_type != "All":
        df = df[df["crime_type"] == crime_type]
        
    if start_date:
        df = df[df["date"] >= start_date]
        
    if end_date:
        df = df[df["date"] <= end_date]
        
    return df[["latitude", "longitude", "severity"]].to_dict(orient="records")

@router.get("/analytics")
def get_analytics(lat: float = None, lon: float = None):
    """Return aggregated crime statistics, optionally filtered by location"""
    if clustered_data.empty:
        return {}
        
    df = clustered_data.copy()
    
    # Filter by location if provided (approx 5km radius ~ 0.05 degrees)
    if lat is not None and lon is not None:
        df = df[
            (df["latitude"] >= lat - 0.05) & (df["latitude"] <= lat + 0.05) &
            (df["longitude"] >= lon - 0.05) & (df["longitude"] <= lon + 0.05)
        ]
        
    # If no data found for location, warn but don't crash (return empty stats)
    if df.empty:
         return {
            "hourly_trends": [],
            "crime_types": [],
            "daily_trends": []
        }

    df['date'] = pd.to_datetime(df['date'])
    
    # 1. Hourly Trends
    df['hour'] = df['date'].dt.hour
    hourly = df.groupby('hour').size().reset_index(name='count')
    
    # 2. Crime Types
    types = df['crime_type'].value_counts().reset_index()
    types.columns = ['type', 'count']
    
    # 3. Daily Trends (Day of Week)
    df['day'] = df['date'].dt.day_name()
    # Sort by day order
    days_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    daily = df['day'].value_counts().reindex(days_order).reset_index()
    daily.columns = ['day', 'count']
    
    return {
        "hourly_trends": hourly.to_dict(orient="records"),
        "crime_types": types.to_dict(orient="records"),
        "daily_trends": daily.to_dict(orient="records")
    }

@router.get("/live-feed")
def get_live_feed(lat: float = 28.7041, lon: float = 77.1025):
    """Simulate live incoming crime reports near a specific location"""
    import random
    from datetime import datetime

    # Simulation Config
    center_lat, center_lon = lat, lon
    crime_types = ["Theft", "Assault", "Burglary", "Vandalism", "Fraud", "Harassment"]
    
    # Generate 1-2 random events
    events = []
    if random.random() > 0.2: # 80% chance of new event (High Activity)
        count = random.randint(1, 3)
        for _ in range(count):
            # Generate within ~5km radius (approx 0.05 degrees)
            events.append({
                "latitude": center_lat + random.uniform(-0.05, 0.05),
                "longitude": center_lon + random.uniform(-0.05, 0.05),
                "crime_type": random.choice(crime_types),
                "severity": random.randint(1, 5),
                "timestamp": datetime.now().isoformat()
            })
            
    return events
