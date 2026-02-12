
from pydantic import BaseModel
from typing import List, Optional

class PredictionRequest(BaseModel):
    latitude: float
    longitude: float
    date: str # ISO format
    
class PredictionResponse(BaseModel):
    risk_level: str
    risk_score: float
    
class HotspotResponse(BaseModel):
    clusters: List[dict]

class AnalyticsResponse(BaseModel):
    hourly_trends: List[dict]
    crime_types: List[dict]
    daily_trends: List[dict]

class FilterRequest(BaseModel):
    crime_type: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
