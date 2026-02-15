
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from backend.schemas import PredictionRequest, PredictionResponse, HotspotResponse
from src.models.classification_model import RiskClassificationModel
from src.models.clustering_model import HotspotClusteringModel
from src.models.anomaly_detector import AnomalyDetector
from src.features.risk_engine import RiskEngine
import pandas as pd
import numpy as np
from datetime import datetime

router = APIRouter()

# Load models
risk_model = RiskClassificationModel()
risk_model.load()

anomaly_detector = AnomalyDetector()
# anomaly_detector.load() # Optional: load if trained

risk_engine = RiskEngine(hotspot_model=None)

# Load clustered data for hotspots
try:
    clustered_data = pd.read_csv("data/processed/clustered_crime_data.csv")
except Exception:
    clustered_data = pd.DataFrame() # Fallback

def generate_synthetic_data(lat, lon, count=100):
    """Generate deterministic synthetic historical crime data based on location"""
    import random
    import hashlib
    from datetime import datetime, timedelta
    
    # Deterministic seed based on location
    seed = int(hashlib.md5(f"{lat:.4f}{lon:.4f}".encode()).hexdigest(), 16) % (2**32)
    rng = random.Random(seed)
    
    crime_types = ["Theft", "Assault", "Burglary", "Vandalism", "Fraud", "Harassment"]
    data = []
    base_date = datetime(2024, 1, 1) # Fixed base date for consistency
    
    for _ in range(count):
        # Cluster around center
        offset_lat = rng.gauss(0, 0.02)
        offset_lon = rng.gauss(0, 0.02)
        
        # Bias time towards night
        hour = rng.choice([0,1,2,3,4,18,19,20,21,22,23] * 3 + list(range(5, 18)))
        random_days = rng.randint(0, 365)
        dt = base_date + timedelta(days=random_days, hours=hour)
        
        data.append({
            "latitude": lat + offset_lat,
            "longitude": lon + offset_lon,
            "crime_type": rng.choice(crime_types),
            "severity": rng.randint(1, 5),
            "date": dt.isoformat()
        })
    return pd.DataFrame(data)

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
    end_date: str = None,
    lat: float = None,
    lon: float = None
):
    """Return filtered points for heatmap with global fallback"""
    df = clustered_data.copy() if not clustered_data.empty else pd.DataFrame()
    
    # Filter by location first to see if we have real data
    has_real_data = False
    if lat is not None and lon is not None:
        local_df = df[
            (df["latitude"] >= lat - 0.05) & (df["latitude"] <= lat + 0.05) &
            (df["longitude"] >= lon - 0.05) & (df["longitude"] <= lon + 0.05)
        ]
        if not local_df.empty:
            df = local_df
            has_real_data = True
        else:
            df = generate_synthetic_data(lat, lon)
    
    if df.empty and (lat is None or lon is None):
        return []
    
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
        return {
            "hourly_trends": [],
            "crime_types": [],
            "daily_trends": []
        }
        
    df = clustered_data.copy()
    
    # Filter by location if provided (approx 5km radius ~ 0.05 degrees)
    if lat is not None and lon is not None:
        df = df[
            (df["latitude"] >= lat - 0.05) & (df["latitude"] <= lat + 0.05) &
            (df["longitude"] >= lon - 0.05) & (df["longitude"] <= lon + 0.05)
        ]
        
    # If no data found for location, use simulation fallback
    if df.empty:
         df = generate_synthetic_data(lat, lon, count=150)

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
            
@router.get("/risk-index")
def get_risk_index(lat: float, lon: float):
    """Calculate real-time risk index for a location"""
    return risk_engine.calculate_score(lat, lon)

@router.post("/detect-anomalies")
def detect_anomalies(data: List[Dict[str, Any]]):
    """Identify unusual incidents in a set of reports"""
    if not data:
        return {"anomalies": []}
        
    df = pd.DataFrame(data)
    # Use Lat, Long, and Severity for anomaly detection
    features = df[["latitude", "longitude", "severity"]].values
    labels = anomaly_detector.fit_predict(features)
    
    anomalies = [data[i] for i in range(len(labels)) if labels[i] == -1]
    return {"anomalies": anomalies}
