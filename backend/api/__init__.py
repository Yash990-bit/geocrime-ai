
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
def get_heatmap_data():
    """Return all points for heatmap"""
    if clustered_data.empty:
        return []
        
    return clustered_data[["latitude", "longitude", "severity"]].to_dict(orient="records")
