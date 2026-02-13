
import pandas as pd
from sklearn.model_selection import train_test_split
from src.data.data_loader import CrimeDataLoader
from src.features.feature_engineering import CrimeFeatureEngineer
from src.models.classification_model import RiskClassificationModel
from src.models.clustering_model import HotspotClusteringModel
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    # 1. Load Data
    loader = CrimeDataLoader()
    # Ensure synthetic data exists
    if not (loader.data_dir / "synthetic_crime_data.csv").exists():
        loader.generate_synthetic_data()
    
    df = pd.read_csv(loader.data_dir / "synthetic_crime_data.csv")
    
    # 2. Feature Engineering
    engineer = CrimeFeatureEngineer()
    df_processed = engineer.feature_engineering_pipeline(
        df,
        date_column="date",
        state_column=None, # Not in synthetic data
        city_column="city",
        crime_column="severity", # Proxy for crime density/risk in this synthetic set
        create_risk=True
    )
    
    # 3. Train Classification Model (Risk Prediction)
    logger.info("--- Training Classification Model ---")
    
    # Prepare features for classification
    # We want to predict 'risk_label'
    feature_cols = engineer.get_feature_columns(df_processed, exclude_columns=[
        "date", "city", "crime_type", "risk_label", "risk_category", 
        "city_encoded", "month_sin", "month_cos" # Using raw numeric features for simplicity first
    ])
    
    # Select specific relevant features for the sample
    selected_features = ["latitude", "longitude", "hour", "day_of_week", "month"]
    # Ensure these columns exist (hour needs to be extracted if not already)
    # The feature pipeline extracted: year, month, day_of_week. 
    # Let's check if 'hour' is extracted. 
    # Ah, the current feature_engineering.py extracts day_of_week, month, but 'hour' might be missing in extraction
    # Let's fix that in feature pipeline or just extract here for now.
    
    df_processed["hour"] = pd.to_datetime(df["date"]).dt.hour
    
    X = df_processed[selected_features]
    y = df_processed["risk_label"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    clf_model = RiskClassificationModel()
    clf_model.train(X_train, y_train)
    
    # --- EVALUATION ---
    try:
        from sklearn.metrics import classification_report, confusion_matrix
        import json
        
        print("\n" + "="*40)
        print("🤖 MODEL EVALUATION REPORT")
        print("="*40)
        
        # Predictions
        y_pred = clf_model.predict(X_test)
        
        # 1. Classification Report (Precision, Recall, F1)
        report_dict = classification_report(y_test, y_pred, output_dict=True)
        print("\n📊 Detailed Metrics:")
        print(classification_report(y_test, y_pred))
        
        # 2. Confusion Matrix
        cm = confusion_matrix(y_test, y_pred)
        print("\n🧩 Confusion Matrix:")
        print(cm)
        
        # Save Metrics to JSON for Documentation/Frontend
        metrics = {
            "accuracy": report_dict["accuracy"],
            "class_high_risk": report_dict.get("High Risk", {}),
            "class_low_risk": report_dict.get("Low Risk", {}),
            "confusion_matrix": cm.tolist()
        }
        
        with open("model_metrics.json", "w") as f:
            json.dump(metrics, f, indent=4)
            
        print(f"\n✅ Metrics saved to model_metrics.json")
    except ImportError:
        print("⚠️ sklearn not installed, skipping advanced metrics.")
    
    clf_model.save()
    
    # 4. Train Clustering Model (Hotspot Detection)
    logger.info("--- Training Clustering Model ---")
    
    # Use only lat/lon for geospatial clustering
    coords = df_processed[["latitude", "longitude"]].values
    
    cluster_model = HotspotClusteringModel(eps=0.01, min_samples=5) # Adjust eps for degree scale
    labels = cluster_model.fit_predict(coords)
    cluster_model.save()
    
    # Save clustered data for verification
    df_processed["cluster"] = labels
    df_processed.to_csv("data/processed/clustered_crime_data.csv", index=False)
    logger.info("Saved clustered data to data/processed/clustered_crime_data.csv")

if __name__ == "__main__":
    main()
