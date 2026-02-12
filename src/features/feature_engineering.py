"""
Feature Engineering for Crime Prediction
Creates temporal, spatial, and statistical features from crime data
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Optional
from sklearn.preprocessing import LabelEncoder, StandardScaler
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CrimeFeatureEngineer:
    """Create features for crime prediction models"""
    
    def __init__(self):
        self.label_encoders = {}
        self.scaler = StandardScaler()
    
    def extract_temporal_features(self, df: pd.DataFrame, 
                                  date_column: str = "date") -> pd.DataFrame:
        """
        Extract temporal features from date column
        
        Args:
            df: Input DataFrame
            date_column: Name of date column
            
        Returns:
            DataFrame with added temporal features
        """
        df = df.copy()
        
        if date_column not in df.columns:
            logger.warning(f"Date column {date_column} not found")
            return df
        
        # Convert to datetime
        df[date_column] = pd.to_datetime(df[date_column], errors='coerce')
        
        # Extract features
        df["year"] = df[date_column].dt.year
        df["month"] = df[date_column].dt.month
        df["quarter"] = df[date_column].dt.quarter
        df["day_of_week"] = df[date_column].dt.dayofweek
        df["day_of_month"] = df[date_column].dt.day
        df["week_of_year"] = df[date_column].dt.isocalendar().week
        
        # Cyclical encoding for month (to capture seasonality)
        df["month_sin"] = np.sin(2 * np.pi * df["month"] / 12)
        df["month_cos"] = np.cos(2 * np.pi * df["month"] / 12)
        
        logger.info("Extracted temporal features")
        return df
    
    def create_location_features(self, df: pd.DataFrame,
                                 state_column: str = "state",
                                 city_column: Optional[str] = None) -> pd.DataFrame:
        """
        Encode location features
        
        Args:
            df: Input DataFrame
            state_column: Name of state column
            city_column: Optional name of city column
            
        Returns:
            DataFrame with encoded location features
        """
        df = df.copy()
        
        # Encode state
        if state_column in df.columns:
            if state_column not in self.label_encoders:
                self.label_encoders[state_column] = LabelEncoder()
                df[f"{state_column}_encoded"] = self.label_encoders[state_column].fit_transform(df[state_column])
            else:
                df[f"{state_column}_encoded"] = self.label_encoders[state_column].transform(df[state_column])
        
        # Encode city
        if city_column and city_column in df.columns:
            if city_column not in self.label_encoders:
                self.label_encoders[city_column] = LabelEncoder()
                df[f"{city_column}_encoded"] = self.label_encoders[city_column].fit_transform(df[city_column])
            else:
                df[f"{city_column}_encoded"] = self.label_encoders[city_column].transform(df[city_column])
        
        logger.info("Created location features")
        return df
    
    def calculate_crime_density(self, df: pd.DataFrame,
                                crime_column: str = "total_crimes",
                                area_column: Optional[str] = None) -> pd.DataFrame:
        """
        Calculate crime density metrics
        
        Args:
            df: Input DataFrame
            crime_column: Column with crime counts
            area_column: Optional column with area in sq km
            
        Returns:
            DataFrame with crime density features
        """
        df = df.copy()
        
        if crime_column in df.columns:
            # Crime density per area
            if area_column and area_column in df.columns:
                df["crime_density"] = df[crime_column] / df[area_column]
            
            # Crime intensity (normalized)
            df["crime_intensity"] = (df[crime_column] - df[crime_column].min()) / \
                                   (df[crime_column].max() - df[crime_column].min())
        
        logger.info("Calculated crime density features")
        return df
    
    def create_aggregation_features(self, df: pd.DataFrame,
                                   group_columns: List[str],
                                   agg_column: str = "total_crimes") -> pd.DataFrame:
        """
        Create aggregation features (rolling averages, totals, etc.)
        
        Args:
            df: Input DataFrame
            group_columns: Columns to group by
            agg_column: Column to aggregate
            
        Returns:
            DataFrame with aggregation features
        """
        df = df.copy()
        
        # Group-level statistics
        for col in group_columns:
            if col in df.columns and agg_column in df.columns:
                # Mean crimes per group
                group_mean = df.groupby(col)[agg_column].transform('mean')
                df[f"{col}_mean_crimes"] = group_mean
                
                # Total crimes per group
                group_sum = df.groupby(col)[agg_column].transform('sum')
                df[f"{col}_total_crimes"] = group_sum
                
                # Crime rank within group
                df[f"{col}_crime_rank"] = df.groupby(col)[agg_column].rank(ascending=False)
        
        logger.info("Created aggregation features")
        return df
    
    def create_crime_type_features(self, df: pd.DataFrame,
                                   crime_type_column: str = "crime_type") -> pd.DataFrame:
        """
        Create features from crime type distribution
        
        Args:
            df: Input DataFrame
            crime_type_column: Column with crime types
            
        Returns:
            DataFrame with crime type features
        """
        df = df.copy()
        
        if crime_type_column in df.columns:
            # One-hot encode crime types
            crime_dummies = pd.get_dummies(df[crime_type_column], prefix="crime")
            df = pd.concat([df, crime_dummies], axis=1)
            
            # Encode crime type
            if crime_type_column not in self.label_encoders:
                self.label_encoders[crime_type_column] = LabelEncoder()
                df[f"{crime_type_column}_encoded"] = self.label_encoders[crime_type_column].fit_transform(
                    df[crime_type_column]
                )
            else:
                df[f"{crime_type_column}_encoded"] = self.label_encoders[crime_type_column].transform(
                    df[crime_type_column]
                )
        
        logger.info("Created crime type features")
        return df
    
    def create_risk_label(self, df: pd.DataFrame,
                         crime_column: str = "total_crimes",
                         threshold_percentile: float = 75) -> pd.DataFrame:
        """
        Create binary risk label (High Risk / Low Risk)
        
        Args:
            df: Input DataFrame
            crime_column: Column with crime counts
            threshold_percentile: Percentile threshold for high risk
            
        Returns:
            DataFrame with risk_label column
        """
        df = df.copy()
        
        if crime_column in df.columns:
            threshold = df[crime_column].quantile(threshold_percentile / 100)
            df["risk_label"] = (df[crime_column] > threshold).astype(int)
            df["risk_category"] = df["risk_label"].map({0: "Low Risk", 1: "High Risk"})
            
            logger.info(f"Created risk labels with threshold={threshold:.2f}")
            logger.info(f"Risk distribution: {df['risk_category'].value_counts().to_dict()}")
        
        return df
    
    def create_geospatial_features(self, df: pd.DataFrame,
                                   lat_column: str = "latitude",
                                   lon_column: str = "longitude") -> pd.DataFrame:
        """
        Create geospatial features from coordinates
        
        Args:
            df: Input DataFrame
            lat_column: Latitude column
            lon_column: Longitude column
            
        Returns:
            DataFrame with geospatial features
        """
        df = df.copy()
        
        if lat_column in df.columns and lon_column in df.columns:
            # Coordinate bins (for clustering)
            df["lat_bin"] = pd.cut(df[lat_column], bins=10, labels=False)
            df["lon_bin"] = pd.cut(df[lon_column], bins=10, labels=False)
            
            # Distance from center (approximate)
            center_lat = df[lat_column].mean()
            center_lon = df[lon_column].mean()
            df["distance_from_center"] = np.sqrt(
                (df[lat_column] - center_lat)**2 + 
                (df[lon_column] - center_lon)**2
            )
        
        logger.info("Created geospatial features")
        return df
    
    def feature_engineering_pipeline(self, df: pd.DataFrame,
                                    date_column: Optional[str] = None,
                                    state_column: Optional[str] = None,
                                    city_column: Optional[str] = None,
                                    crime_column: str = "total_crimes",
                                    create_risk: bool = True) -> pd.DataFrame:
        """
        Run full feature engineering pipeline
        
        Args:
            df: Input DataFrame
            date_column: Date column name
            state_column: State column name
            city_column: City column name
            crime_column: Crime count column name
            create_risk: Whether to create risk labels
            
        Returns:
            DataFrame with all engineered features
        """
        logger.info("Starting feature engineering pipeline...")
        
        # Temporal features
        if date_column and date_column in df.columns:
            df = self.extract_temporal_features(df, date_column)
        
        # Location features
        if state_column:
            df = self.create_location_features(df, state_column, city_column)
        
        # Crime density
        df = self.calculate_crime_density(df, crime_column)
        
        # Geospatial features
        if "latitude" in df.columns and "longitude" in df.columns:
            df = self.create_geospatial_features(df)
        
        # Risk labels
        if create_risk:
            df = self.create_risk_label(df, crime_column)
        
        logger.info(f"Feature engineering complete. Final shape: {df.shape}")
        logger.info(f"Feature columns: {df.columns.tolist()}")
        
        return df
    
    def get_feature_columns(self, df: pd.DataFrame, 
                           exclude_columns: Optional[List[str]] = None) -> List[str]:
        """
        Get list of feature columns for modeling
        
        Args:
            df: DataFrame with features
            exclude_columns: Columns to exclude
            
        Returns:
            List of feature column names
        """
        if exclude_columns is None:
            exclude_columns = ["date", "state", "city", "crime_type", "risk_label", "risk_category"]
        
        feature_cols = [col for col in df.columns if col not in exclude_columns]
        
        # Only numeric columns
        feature_cols = df[feature_cols].select_dtypes(include=[np.number]).columns.tolist()
        
        return feature_cols


def main():
    """Example usage"""
    # Create sample data
    sample_data = {
        "date": pd.date_range("2020-01-01", periods=100, freq="D"),
        "state": np.random.choice(["Delhi", "Maharashtra", "Karnataka"], 100),
        "city": np.random.choice(["Mumbai", "Delhi", "Bangalore"], 100),
        "total_crimes": np.random.randint(50, 500, 100),
        "latitude": np.random.uniform(12, 28, 100),
        "longitude": np.random.uniform(72, 88, 100),
    }
    df = pd.DataFrame(sample_data)
    
    # Feature engineering
    engineer = CrimeFeatureEngineer()
    df_features = engineer.feature_engineering_pipeline(
        df,
        date_column="date",
        state_column="state",
        city_column="city"
    )
    
    print("\nEngineered Features:")
    print(df_features.head())
    print(f"\nFeature columns: {engineer.get_feature_columns(df_features)}")


if __name__ == "__main__":
    main()
