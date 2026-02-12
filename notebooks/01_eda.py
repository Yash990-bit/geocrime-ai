
import pandas as pd
import folium
import matplotlib.pyplot as plt
import seaborn as sns
from src.data.data_loader import CrimeDataLoader

# Load data
loader = CrimeDataLoader()
df = pd.read_csv("data/raw/synthetic_crime_data.csv")

# Basic Stats
print("Dataset Shape:", df.shape)
print("Columns:", df.columns.tolist())
print(df.head())

# Visualizing Crime Types
plt.figure(figsize=(10, 6))
sns.countplot(y="crime_type", data=df, order=df['crime_type'].value_counts().index)
plt.title("Distribution of Crime Types")
plt.show()

# Map
m = folium.Map(location=[20.5937, 78.9629], zoom_start=5)
from folium.plugins import HeatMap
data = [[row['latitude'], row['longitude']] for index, row in df.iterrows()]
HeatMap(data).add_to(m)
m.save("crime_heatmap.html")
print("Map saved to crime_heatmap.html")
