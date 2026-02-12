"""
Geocoder for Indian Locations
Converts city/district names to latitude/longitude coordinates
"""

import pandas as pd
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
import time
import json
from pathlib import Path
from typing import Dict, Tuple, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class IndianGeocoder:
    """Geocode Indian cities and districts to coordinates"""
    
    def __init__(self, cache_file: str = "data/geocoded/geocode_cache.json"):
        self.geolocator = Nominatim(user_agent="geocrime_ai")
        self.cache_file = Path(cache_file)
        self.cache_file.parent.mkdir(parents=True, exist_ok=True)
        self.cache = self._load_cache()
    
    def _load_cache(self) -> Dict:
        """Load geocoding cache from file"""
        if self.cache_file.exists():
            with open(self.cache_file, 'r') as f:
                return json.load(f)
        return {}
    
    def _save_cache(self):
        """Save geocoding cache to file"""
        with open(self.cache_file, 'w') as f:
            json.dump(self.cache, f, indent=2)
    
    def geocode_location(self, location: str, country: str = "India", 
                        retry_count: int = 3) -> Optional[Tuple[float, float]]:
        """
        Geocode a location to (latitude, longitude)
        
        Args:
            location: Location name (city, district, state)
            country: Country name (default: India)
            retry_count: Number of retries on failure
            
        Returns:
            Tuple of (latitude, longitude) or None if geocoding fails
        """
        # Check cache first
        cache_key = f"{location}, {country}"
        if cache_key in self.cache:
            coords = self.cache[cache_key]
            return (coords["lat"], coords["lon"])
        
        # Try geocoding
        for attempt in range(retry_count):
            try:
                query = f"{location}, {country}"
                location_data = self.geolocator.geocode(query, timeout=10)
                
                if location_data:
                    lat, lon = location_data.latitude, location_data.longitude
                    
                    # Cache the result
                    self.cache[cache_key] = {"lat": lat, "lon": lon}
                    self._save_cache()
                    
                    logger.info(f"Geocoded {location}: ({lat}, {lon})")
                    return (lat, lon)
                else:
                    logger.warning(f"Could not geocode {location}")
                    return None
                
            except (GeocoderTimedOut, GeocoderServiceError) as e:
                logger.warning(f"Geocoding attempt {attempt + 1} failed for {location}: {str(e)}")
                time.sleep(1)  # Wait before retry
        
        return None
    
    def geocode_dataframe(self, df: pd.DataFrame, location_column: str = "city",
                         state_column: Optional[str] = None) -> pd.DataFrame:
        """
        Add latitude and longitude columns to DataFrame
        
        Args:
            df: Input DataFrame
            location_column: Column containing location names
            state_column: Optional column containing state names
            
        Returns:
            DataFrame with added 'latitude' and 'longitude' columns
        """
        df = df.copy()
        
        latitudes = []
        longitudes = []
        
        for idx, row in df.iterrows():
            location = row[location_column]
            
            # Include state if available for better accuracy
            if state_column and state_column in df.columns:
                location = f"{location}, {row[state_column]}"
            
            coords = self.geocode_location(location)
            
            if coords:
                latitudes.append(coords[0])
                longitudes.append(coords[1])
            else:
                latitudes.append(None)
                longitudes.append(None)
            
            # Rate limiting (Nominatim requires 1 request per second)
            time.sleep(1)
        
        df["latitude"] = latitudes
        df["longitude"] = longitudes
        
        # Report success rate
        success_rate = (df["latitude"].notna().sum() / len(df)) * 100
        logger.info(f"Geocoding success rate: {success_rate:.1f}%")
        
        return df
    
    def get_indian_cities_coordinates(self) -> Dict[str, Tuple[float, float]]:
        """
        Get predefined coordinates for major Indian cities
        
        Returns:
            Dictionary mapping city names to (lat, lon) tuples
        """
        major_cities = {
            "Mumbai": (19.0760, 72.8777),
            "Delhi": (28.7041, 77.1025),
            "Bangalore": (12.9716, 77.5946),
            "Hyderabad": (17.3850, 78.4867),
            "Chennai": (13.0827, 80.2707),
            "Kolkata": (22.5726, 88.3639),
            "Pune": (18.5204, 73.8567),
            "Ahmedabad": (23.0225, 72.5714),
            "Jaipur": (26.9124, 75.7873),
            "Surat": (21.1702, 72.8311),
            "Lucknow": (26.8467, 80.9462),
            "Kanpur": (26.4499, 80.3319),
            "Nagpur": (21.1458, 79.0882),
            "Indore": (22.7196, 75.8577),
            "Thane": (19.2183, 72.9781),
            "Bhopal": (23.2599, 77.4126),
            "Visakhapatnam": (17.6868, 83.2185),
            "Pimpri-Chinchwad": (18.6298, 73.7997),
            "Patna": (25.5941, 85.1376),
            "Vadodara": (22.3072, 73.1812),
        }
        
        return major_cities
    
    def fill_missing_coordinates(self, df: pd.DataFrame, 
                                 city_column: str = "city") -> pd.DataFrame:
        """
        Fill missing coordinates using predefined city coordinates
        
        Args:
            df: DataFrame with latitude/longitude columns
            city_column: Column containing city names
            
        Returns:
            DataFrame with filled coordinates
        """
        df = df.copy()
        major_cities = self.get_indian_cities_coordinates()
        
        for idx, row in df.iterrows():
            if pd.isna(row.get("latitude")) or pd.isna(row.get("longitude")):
                city = row[city_column]
                if city in major_cities:
                    df.at[idx, "latitude"] = major_cities[city][0]
                    df.at[idx, "longitude"] = major_cities[city][1]
                    logger.info(f"Filled coordinates for {city}")
        
        return df


def main():
    """Example usage"""
    geocoder = IndianGeocoder()
    
    # Test geocoding
    print("Testing geocoding...")
    coords = geocoder.geocode_location("Mumbai")
    print(f"Mumbai coordinates: {coords}")
    
    # Test with DataFrame
    sample_data = {
        "city": ["Delhi", "Bangalore", "Chennai"],
        "state": ["Delhi", "Karnataka", "Tamil Nadu"],
        "crimes": [100, 150, 120]
    }
    df = pd.DataFrame(sample_data)
    
    print("\nGeocoding DataFrame...")
    df_geocoded = geocoder.geocode_dataframe(df, location_column="city", state_column="state")
    print(df_geocoded)


if __name__ == "__main__":
    main()
