"""
Classification Model for Crime Risk Prediction
Predicts if an area is High Risk or Low Risk
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, f1_score
import xgboost as xgb
import joblib
from pathlib import Path
from typing import Tuple, Dict, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CrimeRiskClassifier:
    """Classification model for predicting crime risk levels"""
    
    def __init__(self, model_type: str = "random_forest"):
        """
        Initialize classifier
        
        Args:
            model_type: Type of model ('logistic', 'random_forest', 'xgboost')
        """
        self.model_type = model_type
        self.model = self._create_model()
        self.feature_importance = None
    
    def _create_model(self):
        """Create model based on type"""
        if self.model_type == "logistic":
            return LogisticRegression(max_iter=1000, random_state=42)
        elif self.model_type == "random_forest":
            return RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                min_samples_split=5,
                random_state=42,
                n_jobs=-1
            )
        elif self.model_type == "xgboost":
            return xgb.XGBClassifier(
                n_estimators=100,
                max_depth=6,
                learning_rate=0.1,
                random_state=42,
                n_jobs=-1
            )
        else:
            raise ValueError(f"Unknown model type: {self.model_type}")
    
    def prepare_data(self, df: pd.DataFrame, 
                    feature_columns: list,
                    target_column: str = "risk_label",
                    test_size: float = 0.2) -> Tuple:
        """
        Prepare data for training
        
        Args:
            df: Input DataFrame
            feature_columns: List of feature column names
            target_column: Target column name
            test_size: Proportion of data for testing
            
        Returns:
            Tuple of (X_train, X_test, y_train, y_test)
        """
        # Remove rows with missing values
        df_clean = df[feature_columns + [target_column]].dropna()
        
        X = df_clean[feature_columns]
        y = df_clean[target_column]
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y
        )
        
        logger.info(f"Training set: {X_train.shape}, Test set: {X_test.shape}")
        logger.info(f"Class distribution - Train: {y_train.value_counts().to_dict()}")
        logger.info(f"Class distribution - Test: {y_test.value_counts().to_dict()}")
        
        return X_train, X_test, y_train, y_test
    
    def train(self, X_train: pd.DataFrame, y_train: pd.Series) -> None:
        """
        Train the model
        
        Args:
            X_train: Training features
            y_train: Training labels
        """
        logger.info(f"Training {self.model_type} model...")
        self.model.fit(X_train, y_train)
        
        # Store feature importance
        if hasattr(self.model, 'feature_importances_'):
            self.feature_importance = pd.DataFrame({
                'feature': X_train.columns,
                'importance': self.model.feature_importances_
            }).sort_values('importance', ascending=False)
            
            logger.info("\nTop 10 Important Features:")
            logger.info(self.feature_importance.head(10).to_string())
        
        logger.info("Training complete!")
    
    def evaluate(self, X_test: pd.DataFrame, y_test: pd.Series) -> Dict:
        """
        Evaluate model performance
        
        Args:
            X_test: Test features
            y_test: Test labels
            
        Returns:
            Dictionary with evaluation metrics
        """
        y_pred = self.model.predict(X_test)
        
        accuracy = accuracy_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred, average='weighted')
        
        logger.info("\n" + "="*50)
        logger.info(f"Model: {self.model_type}")
        logger.info("="*50)
        logger.info(f"Accuracy: {accuracy:.4f}")
        logger.info(f"F1 Score: {f1:.4f}")
        logger.info("\nClassification Report:")
        logger.info("\n" + classification_report(y_test, y_pred, 
                                                 target_names=["Low Risk", "High Risk"]))
        logger.info("\nConfusion Matrix:")
        logger.info(confusion_matrix(y_test, y_pred))
        
        return {
            "accuracy": accuracy,
            "f1_score": f1,
            "classification_report": classification_report(y_test, y_pred, output_dict=True),
            "confusion_matrix": confusion_matrix(y_test, y_pred).tolist()
        }
    
    def cross_validate(self, X: pd.DataFrame, y: pd.Series, cv: int = 5) -> Dict:
        """
        Perform cross-validation
        
        Args:
            X: Features
            y: Labels
            cv: Number of cross-validation folds
            
        Returns:
            Dictionary with cross-validation scores
        """
        logger.info(f"Performing {cv}-fold cross-validation...")
        
        scores = cross_val_score(self.model, X, y, cv=cv, scoring='accuracy')
        f1_scores = cross_val_score(self.model, X, y, cv=cv, scoring='f1_weighted')
        
        logger.info(f"Cross-validation Accuracy: {scores.mean():.4f} (+/- {scores.std():.4f})")
        logger.info(f"Cross-validation F1 Score: {f1_scores.mean():.4f} (+/- {f1_scores.std():.4f})")
        
        return {
            "cv_accuracy_mean": scores.mean(),
            "cv_accuracy_std": scores.std(),
            "cv_f1_mean": f1_scores.mean(),
            "cv_f1_std": f1_scores.std()
        }
    
    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """
        Make predictions
        
        Args:
            X: Features
            
        Returns:
            Array of predictions
        """
        return self.model.predict(X)
    
    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        """
        Get prediction probabilities
        
        Args:
            X: Features
            
        Returns:
            Array of prediction probabilities
        """
        return self.model.predict_proba(X)
    
    def save_model(self, filepath: str) -> None:
        """
        Save model to file
        
        Args:
            filepath: Path to save model
        """
        Path(filepath).parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.model, filepath)
        logger.info(f"Model saved to {filepath}")
    
    def load_model(self, filepath: str) -> None:
        """
        Load model from file
        
        Args:
            filepath: Path to load model from
        """
        self.model = joblib.load(filepath)
        logger.info(f"Model loaded from {filepath}")


def compare_models(X_train, X_test, y_train, y_test) -> pd.DataFrame:
    """
    Compare different classification models
    
    Args:
        X_train, X_test, y_train, y_test: Train/test splits
        
    Returns:
        DataFrame with model comparison results
    """
    models = ["logistic", "random_forest", "xgboost"]
    results = []
    
    for model_type in models:
        logger.info(f"\n{'='*60}")
        logger.info(f"Training {model_type.upper()} model")
        logger.info(f"{'='*60}")
        
        classifier = CrimeRiskClassifier(model_type=model_type)
        classifier.train(X_train, y_train)
        metrics = classifier.evaluate(X_test, y_test)
        
        results.append({
            "model": model_type,
            "accuracy": metrics["accuracy"],
            "f1_score": metrics["f1_score"]
        })
    
    results_df = pd.DataFrame(results).sort_values("f1_score", ascending=False)
    
    logger.info("\n" + "="*60)
    logger.info("MODEL COMPARISON RESULTS")
    logger.info("="*60)
    logger.info("\n" + results_df.to_string(index=False))
    
    return results_df


def main():
    """Example usage"""
    # Create sample data
    np.random.seed(42)
    n_samples = 1000
    
    sample_data = {
        "crime_rate": np.random.uniform(0, 100, n_samples),
        "population_density": np.random.uniform(100, 10000, n_samples),
        "crime_intensity": np.random.uniform(0, 1, n_samples),
        "month": np.random.randint(1, 13, n_samples),
        "year": np.random.choice([2020, 2021, 2022], n_samples),
    }
    df = pd.DataFrame(sample_data)
    
    # Create risk label (high risk if crime_rate > 75th percentile)
    threshold = df["crime_rate"].quantile(0.75)
    df["risk_label"] = (df["crime_rate"] > threshold).astype(int)
    
    # Prepare data
    feature_columns = ["crime_rate", "population_density", "crime_intensity", "month", "year"]
    
    classifier = CrimeRiskClassifier(model_type="random_forest")
    X_train, X_test, y_train, y_test = classifier.prepare_data(df, feature_columns)
    
    # Train and evaluate
    classifier.train(X_train, y_train)
    classifier.evaluate(X_test, y_test)
    
    # Compare models
    print("\n\nComparing all models...")
    compare_models(X_train, X_test, y_train, y_test)


if __name__ == "__main__":
    main()
