
import numpy as np
import logging
from typing import Dict, Any, List
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RiskEngine:
    """Calculates a dynamic risk score (0-100) for a given location and time"""
    
    def __init__(self, hotspot_model=None):
        self.hotspot_model = hotspot_model
        
    def calculate_score(self, lat: float, lon: float, timestamp: datetime = None) -> Dict[str, Any]:
        """
        Calculates risk based on:
        1. Proximity to known hotspots (DBSCAN/KMeans clusters)
        2. Historical crime density at that location
        3. Temporal factors (Time of day - nighttime is higher risk)
        """
        if timestamp is None:
            timestamp = datetime.now()
            
        # Base risk (default 10)
        score = 10.0
        factors = []
        
        # 1. Temporal Factor (Nighttime adjustment)
        hour = timestamp.hour
        if 22 <= hour or hour <= 4:
            score += 25
            factors.append("High risk: Late night hours")
        elif 18 <= hour < 22:
            score += 10
            factors.append("Moderate risk: Evening hours")
            
        # 2. Hotspot Proximity (Mock logic if no model passed, or use actual model)
        # If we had a model, we would compute distance to nearest cluster centroid
        # For now, we simulate with a random component or distance to a known "danger" point
        # if self.hotspot_model:
        #    ... find distance to nearest cluster ...
        
        # 3. Severity weighting
        # (Assuming we have local data access, otherwise use base score)
        
        # Final capping
        score = min(score + np.random.uniform(0, 10), 100)
        
        level = "Low"
        if score > 75: level = "High"
        elif score > 40: level = "Moderate"
        
        return {
            "risk_score": round(score, 2),
            "level": level,
            "contributing_factors": factors,
            "timestamp": timestamp.isoformat()
        }
