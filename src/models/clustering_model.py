
import pandas as pd
import numpy as np
import joblib
from sklearn.cluster import DBSCAN, KMeans
from typing import Dict, Any, List, Optional
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class HotspotClusteringModel:
    """Clustering to detect crime hotspots using KMeans or DBSCAN"""
    
    def __init__(self, algorithm: str = "dbscan", params: Optional[Dict[str, Any]] = None, model_path: str = "models/hotspot_model.joblib"):
        self.algorithm = algorithm.lower()
        self.params = params or {}
        self.model_path = model_path
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        
        if self.algorithm == "dbscan":
            eps = self.params.get("eps", 0.01) # ~1.1km
            min_samples = self.params.get("min_samples", 5)
            self.model = DBSCAN(eps=eps, min_samples=min_samples)
        elif self.algorithm == "kmeans":
            n_clusters = self.params.get("n_clusters", 5)
            self.model = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        else:
            raise ValueError(f"Unsupported algorithm: {self.algorithm}")
        
    def fit_predict(self, data: np.ndarray) -> np.ndarray:
        """
        Fit model and return cluster labels.
        Data should be [latitude, longitude] or [latitude, longitude, density]
        """
        logger.info(f"Clustering {len(data)} points with {self.algorithm.upper()}...")
        
        # If density is provided, we can use it as a weight for KMeans
        # or just as an additional dimension for DBSCAN if that's desired.
        # However, typically density is used to filter or weight.
        
        if self.algorithm == "kmeans" and data.shape[1] == 3:
            # Use density (column 2) as sample weights for KMeans
            coords = data[:, :2]
            weights = data[:, 2]
            labels = self.model.fit_predict(coords, sample_weight=weights)
        else:
            labels = self.model.fit_predict(data)
            
        n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
        logger.info(f"Found {n_clusters} clusters")
        return labels
        
    def save(self):
        """Save model and metadata to disk"""
        metadata = {
            "algorithm": self.algorithm,
            "params": self.params,
            "model": self.model
        }
        joblib.dump(metadata, self.model_path)
        logger.info(f"Model and metadata saved to {self.model_path}")
        
    def load(self):
        """Load model and metadata from disk"""
        if os.path.exists(self.model_path):
            data = joblib.load(self.model_path)
            self.algorithm = data.get("algorithm", "dbscan")
            self.params = data.get("params", {})
            self.model = data.get("model")
            logger.info(f"Model ({self.algorithm}) loaded from {self.model_path}")
        else:
            logger.warning(f"Model file not found at {self.model_path}")
