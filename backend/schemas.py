
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
