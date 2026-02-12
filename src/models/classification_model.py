
import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
from typing import Dict, Any
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RiskClassificationModel:
    """Random Forest Model to predict crime risk level"""
    
    def __init__(self, model_path: str = "models/risk_model.joblib"):
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.model_path = model_path
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        
    def train(self, X: pd.DataFrame, y: pd.Series):
        """Train the model"""
        logger.info("Training Random Forest Classifier...")
        self.model.fit(X, y)
        logger.info("Training complete.")
        
    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """Make predictions"""
        return self.model.predict(X)
        
    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        """Make probability predictions"""
        return self.model.predict_proba(X)
        
    def evaluate(self, X_test: pd.DataFrame, y_test: pd.Series) -> Dict[str, Any]:
        """Evaluate model performance"""
        y_pred = self.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        report = classification_report(y_test, y_pred, output_dict=True)
        
        logger.info(f"Model Accuracy: {accuracy:.4f}")
        return {"accuracy": accuracy, "report": report}
        
    def save(self):
        """Save model to disk"""
        joblib.dump(self.model, self.model_path)
        logger.info(f"Model saved to {self.model_path}")
        
    def load(self):
        """Load model from disk"""
        if os.path.exists(self.model_path):
            self.model = joblib.load(self.model_path)
            logger.info(f"Model loaded from {self.model_path}")
        else:
            logger.warning(f"Model file not found at {self.model_path}")
