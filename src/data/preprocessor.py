"""
Data Preprocessor for Crime Datasets
Cleans, standardizes, and prepares crime data for analysis
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CrimeDataPreprocessor:
    """Preprocess and clean crime datasets"""
    
    def __init__(self):
        self.crime_type_mapping = self._create_crime_type_mapping()
    
    def _create_crime_type_mapping(self) -> Dict[str, str]:
        """Create standardized crime type categories"""
        return {
            # Violent crimes
            "murder": "violent",
            "rape": "violent",
            "kidnapping": "violent",
            "assault": "violent",
            "robbery": "violent",
            
            # Property crimes
            "theft": "property",
            "burglary": "property",
            "dacoity": "property",
            "cheating": "property",
            
            # Cyber crimes
            "cyber": "cyber",
            "fraud": "cyber",
            
            # Other
            "other": "other"
        }
    
    def clean_column_names(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Standardize column names
        
        Args:
            df: Input DataFrame
            
        Returns:
            DataFrame with cleaned column names
        """
        df = df.copy()
        
        # Convert to lowercase and replace spaces with underscores
        df.columns = df.columns.str.lower().str.replace(' ', '_').str.replace('/', '_')
        
        logger.info(f"Cleaned column names: {df.columns.tolist()}")
        return df
    
    def handle_missing_values(self, df: pd.DataFrame, strategy: str = "drop") -> pd.DataFrame:
        """
        Handle missing values in dataset
        
        Args:
            df: Input DataFrame
            strategy: Strategy for handling missing values ('drop', 'fill_zero', 'fill_mean')
            
        Returns:
            DataFrame with handled missing values
        """
        df = df.copy()
        
        missing_before = df.isnull().sum().sum()
        
        if strategy == "drop":
            df = df.dropna()
        elif strategy == "fill_zero":
            df = df.fillna(0)
        elif strategy == "fill_mean":
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].mean())
        
        missing_after = df.isnull().sum().sum()
        logger.info(f"Missing values: {missing_before} -> {missing_after}")
        
        return df
    
    def remove_outliers(self, df: pd.DataFrame, columns: List[str], method: str = "iqr") -> pd.DataFrame:
        """
        Remove outliers from specified columns
        
        Args:
            df: Input DataFrame
            columns: Columns to check for outliers
            method: Method for outlier detection ('iqr' or 'zscore')
            
        Returns:
            DataFrame with outliers removed
        """
        df = df.copy()
        rows_before = len(df)
        
        for col in columns:
            if col not in df.columns:
                continue
            
            if method == "iqr":
                Q1 = df[col].quantile(0.25)
                Q3 = df[col].quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                df = df[(df[col] >= lower_bound) & (df[col] <= upper_bound)]
            
            elif method == "zscore":
                z_scores = np.abs((df[col] - df[col].mean()) / df[col].std())
                df = df[z_scores < 3]
        
        rows_after = len(df)
        logger.info(f"Removed {rows_before - rows_after} outlier rows")
        
        return df
    
    def standardize_state_names(self, df: pd.DataFrame, state_column: str = "state") -> pd.DataFrame:
        """
        Standardize state/UT names
        
        Args:
            df: Input DataFrame
            state_column: Name of the state column
            
        Returns:
            DataFrame with standardized state names
        """
        df = df.copy()
        
        if state_column not in df.columns:
            logger.warning(f"Column {state_column} not found")
            return df
        
        # Standardize state names
        state_mapping = {
            "delhi": "Delhi",
            "mumbai": "Maharashtra",
            "bengaluru": "Karnataka",
            "chennai": "Tamil Nadu",
            "kolkata": "West Bengal",
            # Add more mappings as needed
        }
        
        df[state_column] = df[state_column].str.strip().str.title()
        df[state_column] = df[state_column].replace(state_mapping)
        
        return df
    
    def categorize_crime_types(self, df: pd.DataFrame, crime_column: str = "crime_type") -> pd.DataFrame:
        """
        Categorize crime types into broader categories
        
        Args:
            df: Input DataFrame
            crime_column: Name of the crime type column
            
        Returns:
            DataFrame with crime category column added
        """
        df = df.copy()
        
        if crime_column not in df.columns:
            logger.warning(f"Column {crime_column} not found")
            return df
        
        def map_crime_category(crime: str) -> str:
            """Map crime to category"""
            crime_lower = str(crime).lower()
            for key, category in self.crime_type_mapping.items():
                if key in crime_lower:
                    return category
            return "other"
        
        df["crime_category"] = df[crime_column].apply(map_crime_category)
        
        logger.info(f"Crime categories: {df['crime_category'].value_counts().to_dict()}")
        
        return df
    
    def calculate_crime_rate(self, df: pd.DataFrame, crime_column: str = "total_crimes", 
                            population_column: str = "population") -> pd.DataFrame:
        """
        Calculate crime rate per 100,000 population
        
        Args:
            df: Input DataFrame
            crime_column: Column with crime counts
            population_column: Column with population data
            
        Returns:
            DataFrame with crime_rate column added
        """
        df = df.copy()
        
        if crime_column in df.columns and population_column in df.columns:
            df["crime_rate"] = (df[crime_column] / df[population_column]) * 100000
            logger.info(f"Calculated crime rate: mean={df['crime_rate'].mean():.2f}")
        else:
            logger.warning(f"Could not calculate crime rate: missing columns")
        
        return df
    
    def preprocess_pipeline(self, df: pd.DataFrame, 
                          remove_outliers: bool = True,
                          outlier_columns: Optional[List[str]] = None) -> pd.DataFrame:
        """
        Run full preprocessing pipeline
        
        Args:
            df: Input DataFrame
            remove_outliers: Whether to remove outliers
            outlier_columns: Columns to check for outliers
            
        Returns:
            Fully preprocessed DataFrame
        """
        logger.info("Starting preprocessing pipeline...")
        
        # Clean column names
        df = self.clean_column_names(df)
        
        # Handle missing values
        df = self.handle_missing_values(df, strategy="fill_zero")
        
        # Standardize state names if state column exists
        if "state" in df.columns or "state_ut" in df.columns:
            state_col = "state" if "state" in df.columns else "state_ut"
            df = self.standardize_state_names(df, state_col)
        
        # Remove outliers if requested
        if remove_outliers and outlier_columns:
            df = self.remove_outliers(df, outlier_columns)
        
        logger.info(f"Preprocessing complete. Final shape: {df.shape}")
        
        return df
    
    def save_processed_data(self, df: pd.DataFrame, output_path: str):
        """
        Save processed data to CSV
        
        Args:
            df: DataFrame to save
            output_path: Path to save file
        """
        df.to_csv(output_path, index=False)
        logger.info(f"Saved processed data to {output_path}")


def main():
    """Example usage"""
    # Create sample data
    sample_data = {
        "State": ["Delhi", "Mumbai", "Bangalore"],
        "Crime Type": ["Murder", "Theft", "Cyber Fraud"],
        "Total Crimes": [150, 300, 100],
        "Population": [20000000, 18000000, 12000000]
    }
    df = pd.DataFrame(sample_data)
    
    # Preprocess
    preprocessor = CrimeDataPreprocessor()
    df_processed = preprocessor.preprocess_pipeline(df)
    
    print("\nProcessed Data:")
    print(df_processed)


if __name__ == "__main__":
    main()
