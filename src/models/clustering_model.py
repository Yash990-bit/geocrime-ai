
import pandas as pd
import numpy as np
import joblib
from sklearn.cluster import DBSCAN
from typing import Dict, Any, List
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class HotspotClusteringModel:
    """DBSCAN Clustering to detect crime hotspots"""
    
    def __init__(self, eps: float = 0.01, min_samples: int = 5, model_path: str = "models/hotspot_model.joblib"):
        # eps is roughly 1.1km (0.01 degrees)
        self.model = DBSCAN(eps=eps, min_samples=min_samples)
        self.model_path = model_path
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        
    def fit_predict(self, coords: np.ndarray) -> np.ndarray:
        """Fit model and return cluster labels"""
        logger.info(f"Clustering {len(coords)} points with DBSCAN...")
        labels = self.model.fit_predict(coords)
        n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
        logger.info(f"Found {n_clusters} clusters")
        return labels
        
    def save(self):
        """Save model to disk (DBSCAN doesn't really predict, but we can save params/result)"""
        # For DBSCAN, we primarily save the parameters or the fitted object if needed for consistent attribute access
        # but DBSCAN is transductive, it doesn't predict on new data. 
        # We might just save the fitted model for inspection.
        joblib.dump(self.model, self.model_path)
        logger.info(f"Model saved to {self.model_path}")
        
    def load(self):
        """Load model from disk"""
        if os.path.exists(self.model_path):
            self.model = joblib.load(self.model_path)
            logger.info(f"Model loaded from {self.model_path}")
        else:
            logger.warning(f"Model file not found at {self.model_path}")
