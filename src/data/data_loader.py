"""
Data Loader for Indian Crime Datasets
Downloads and loads crime data from NCRB (National Crime Records Bureau)
"""

import os
import pandas as pd
import requests
from pathlib import Path
from typing import Dict, List, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CrimeDataLoader:
    """Load and manage Indian crime datasets from various sources"""
    
    def __init__(self, data_dir: str = "data/raw"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        # Dataset URLs from data.gov.in and other sources
        self.dataset_urls = {
            "state_ipc_crimes": "https://data.gov.in/resource/stateut-wise-number-indian-penal-code-ipc-crimes-2020-2022",
            "city_violent_crimes": "https://data.gov.in/resource/city-wise-number-violent-crimes",
            # Add more dataset URLs as needed
        }
    
    def download_dataset(self, dataset_name: str, url: str, force_download: bool = False) -> Path:
        """
        Download a dataset from URL
        
        Args:
            dataset_name: Name of the dataset
            url: URL to download from
            force_download: Force re-download even if file exists
            
        Returns:
            Path to downloaded file
        """
        file_path = self.data_dir / f"{dataset_name}.csv"
        
        if file_path.exists() and not force_download:
            logger.info(f"Dataset {dataset_name} already exists at {file_path}")
            return file_path
        
        try:
            logger.info(f"Downloading {dataset_name} from {url}")
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            with open(file_path, 'wb') as f:
                f.write(response.content)
            
            logger.info(f"Successfully downloaded {dataset_name}")
            return file_path
            
        except Exception as e:
            logger.error(f"Failed to download {dataset_name}: {str(e)}")
            raise
    
    def load_csv(self, file_path: str, **kwargs) -> pd.DataFrame:
        """
        Load CSV file into pandas DataFrame
        
        Args:
            file_path: Path to CSV file
            **kwargs: Additional arguments for pd.read_csv
            
        Returns:
            DataFrame with loaded data
        """
        try:
            df = pd.read_csv(file_path, **kwargs)
            logger.info(f"Loaded {len(df)} records from {file_path}")
            return df
        except Exception as e:
            logger.error(f"Failed to load {file_path}: {str(e)}")
            raise
    
    def load_state_crimes(self, file_path: Optional[str] = None) -> pd.DataFrame:
        """
        Load state-wise IPC crime data
        
        Args:
            file_path: Optional path to CSV file. If None, uses default location
            
        Returns:
            DataFrame with state-wise crime data
        """
        if file_path is None:
            file_path = self.data_dir / "state_ipc_crimes.csv"
        
        df = self.load_csv(file_path)
        
        # Basic data validation
        logger.info(f"Columns: {df.columns.tolist()}")
        logger.info(f"Shape: {df.shape}")
        
        return df
    
    def load_city_crimes(self, file_path: Optional[str] = None) -> pd.DataFrame:
        """
        Load city-wise crime data
        
        Args:
            file_path: Optional path to CSV file
            
        Returns:
            DataFrame with city-wise crime data
        """
        if file_path is None:
            file_path = self.data_dir / "city_violent_crimes.csv"
        
        df = self.load_csv(file_path)
        
        logger.info(f"Columns: {df.columns.tolist()}")
        logger.info(f"Shape: {df.shape}")
        
        return df
    
    def load_all_datasets(self) -> Dict[str, pd.DataFrame]:
        """
        Load all available datasets
        
        Returns:
            Dictionary mapping dataset names to DataFrames
        """
        datasets = {}
        
        # List all CSV files in data directory
        csv_files = list(self.data_dir.glob("*.csv"))
        
        for csv_file in csv_files:
            dataset_name = csv_file.stem
            try:
                datasets[dataset_name] = self.load_csv(csv_file)
                logger.info(f"Loaded dataset: {dataset_name}")
            except Exception as e:
                logger.warning(f"Could not load {dataset_name}: {str(e)}")
        
        return datasets
    
    def get_dataset_info(self, df: pd.DataFrame) -> Dict:
        """
        Get basic information about a dataset
        
        Args:
            df: DataFrame to analyze
            
        Returns:
            Dictionary with dataset information
        """
        info = {
            "shape": df.shape,
            "columns": df.columns.tolist(),
            "dtypes": df.dtypes.to_dict(),
            "missing_values": df.isnull().sum().to_dict(),
            "memory_usage": df.memory_usage(deep=True).sum() / 1024**2,  # MB
        }
        
        return info


def main():
    """Example usage"""
    loader = CrimeDataLoader()
    
    # Load datasets
    print("Loading crime datasets...")
    datasets = loader.load_all_datasets()
    
    for name, df in datasets.items():
        print(f"\n{name}:")
        print(f"  Shape: {df.shape}")
        print(f"  Columns: {df.columns.tolist()[:5]}...")  # First 5 columns
        print(f"  Sample:\n{df.head(2)}")


if __name__ == "__main__":
    main()
