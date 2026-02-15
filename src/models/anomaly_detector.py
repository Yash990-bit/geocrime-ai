
import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import IsolationForest
from typing import Dict, Any, List, Optional
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AnomalyDetector:
    """Uses Isolation Forest to detect unusual or high-risk outlier crime incidents"""
    
    def __init__(self, contamination: float = 0.05, model_path: str = "models/anomaly_model.joblib"):
        """
        contamination: The proportion of outliers in the data set.
        """
        self.model = IsolationForest(contamination=contamination, random_state=42)
        self.model_path = model_path
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        
    def fit_predict(self, data: np.ndarray) -> np.ndarray:
        """
        Fit the model and predict outliers.
        Returns: 1 for normal incidents, -1 for anomalies.
        """
        logger.info(f"Running Anomaly Detection on {len(data)} records...")
        labels = self.model.fit_predict(data)
        n_anomalies = np.sum(labels == -1)
        logger.info(f"Detected {n_anomalies} anomalous incidents")
        return labels
        
    def get_anomaly_scores(self, data: np.ndarray) -> np.ndarray:
        """
        Returns anomaly scores (lower means more anomalous).
        """
        return self.model.decision_function(data)
        
    def save(self):
        """Save the anomaly detection model"""
        joblib.dump(self.model, self.model_path)
        logger.info(f"Anomaly model saved to {self.model_path}")
        
    def load(self):
        """Load the anomaly detection model"""
        if os.path.exists(self.model_path):
            self.model = joblib.load(self.model_path)
            logger.info(f"Anomaly model loaded from {self.model_path}")
        else:
            logger.warning(f"No anomaly model found at {self.model_path}")
