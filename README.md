# 🚓 GeoCrime AI - Crime Hotspot Prediction System

**A geospatial machine learning system that analyzes historical crime data from India and predicts high-risk zones using advanced ML models and interactive visualizations.**

---

## 🎯 Problem Statement

Police departments across India face critical challenges:
- **Where to deploy patrol teams?**
- **Which areas have high crime probability?**
- **How do crime patterns change over time?**

GeoCrime AI solves these problems by analyzing historical crime data from India's National Crime Records Bureau (NCRB) and providing actionable insights through predictive models and interactive visualizations.

---

## ✨ Key Features

✅ **Real Indian Crime Data** - Uses official NCRB datasets from data.gov.in  
✅ **ML-Powered Predictions** - Random Forest classification for risk assessment  
✅ **Spatio-Temporal Clustering** - Advanced ST-DBSCAN for emerging hotspots  
✅ **Anomaly Detection** - Isolation Forest for flagging unusual crime incidents  
✅ **Dynamic Risk Index** - Real-time safety scoring based on live & historical data  
✅ **Interactive Maps** - Leaflet-based visualization of crime density  
✅ **REST API** - FastAPI backend with advanced predictive endpoints  

---

## 🛠 Tech Stack

### Backend & ML
- **Python 3.9+** - Core language
- **Pandas & NumPy** - Data processing
- **Scikit-learn** - ML models (Random Forest, Logistic Regression)
- **XGBoost** - Advanced classification
- **GeoPandas** - Geospatial data handling
- **Folium** - Interactive heatmaps
- **GeoPy** - Geocoding Indian locations
- **FastAPI** - REST API framework
- **Uvicorn** - ASGI server

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **React Leaflet** - Map integration
- **Recharts** - Data visualization
- **Axios** - API communication

---

## 📊 Project Architecture

```
geocrime-ai/
├── backend/              # FastAPI application
├── frontend/             # React dashboard
├── src/
│   ├── data/            # Data loading & preprocessing
│   ├── features/        # Feature engineering
│   ├── models/          # ML models
│   └── visualization/   # Heatmap generation
├── notebooks/           # Jupyter notebooks for EDA
├── data/               # Raw & processed datasets
├── models/             # Trained model files
└── scripts/            # Utility scripts
```

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/geocrime-ai.git
cd geocrime-ai
```

### 2. Set Up Python Environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Download Datasets
```bash
python scripts/download_datasets.py
```

### 4. Run EDA Notebooks
```bash
jupyter notebook notebooks/01_eda.ipynb
```

### 5. Train Models
```bash
python src/models/classification_model.py --train
python src/models/clustering_model.py --train
```

### 6. Start Backend API
```bash
cd backend
uvicorn main:app --reload
```

### 7. Start Frontend Dashboard
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` to see the dashboard!

---

## 📈 Machine Learning Models

### 1. Classification Model (Risk Prediction)
**Objective**: Predict if an area is High Risk or Low Risk

**Models Compared**:
- Logistic Regression (baseline)
- Random Forest Classifier ⭐ (primary)
- XGBoost (advanced)

**Features**: Crime rate, population density, historical trends, crime type distribution  
**Target**: Binary classification (High Risk if crime rate > 75th percentile)

### 2. Clustering Model (Hotspot Detection)
**Objective**: Identify crime hotspot clusters

**Algorithms**:
- **ST-DBSCAN** ⭐ - Spatio-Temporal clustering for emerging hotspots
- **DBSCAN** - Density-based clustering for irregular geospatial shapes
- **Weighted KMeans** - Partitioning the map into exactly $N$ strategic zones

**Features**: Latitude, longitude, date/time, crime density  
**Output**: Cluster labels and emerging threat alerts

### 3. Anomaly Detection (Outlier Detection)
**Objective**: Flag unusual or high-risk incidents
**Algorithm**: Isolation Forest
**Why**: Automatically identifies incidents that deviate from historical patterns (e.g., high-severity crime in a low-risk zone).

### 3. Time Series Model (Future Prediction)
**Objective**: Forecast crime trends

**Algorithm**: ARIMA or Prophet  
**Output**: Monthly crime predictions for next 3-6 months

---

## 🗺 Visualization Examples

### Crime Heatmap
Interactive Folium heatmap showing crime density across India with:
- Color-coded risk zones
- Crime type filters
- Temporal slider
- Click-to-view details

### Statistics Dashboard
- Crime frequency by state/city
- Time-based trends (hourly, daily, monthly)
- Crime type distribution
- Year-over-year comparisons

---

## 🔌 API Endpoints

```
GET  /api/risk-index     # Calculate real-time risk index
POST /api/detect-anomalies # Detect outliers in crime reports
POST /api/predict          # Predict risk level for location
GET  /api/hotspots         # Get current hotspot clusters
GET  /api/analytics        # Get aggregated crime statistics
GET  /api/live-feed        # Simulate incoming crime reports
```

---

## 📚 Data Sources

- **National Crime Records Bureau (NCRB)** - [data.gov.in](https://data.gov.in/catalog/crime-india-2022)
- **India Data Portal** - [indiadataportal.com](https://indiadataportal.com/crime-statistics)
- Datasets include:
  - State/UT-wise IPC crimes (2020-2023)
  - City-wise violent crimes
  - District-level crime statistics

---

## 🎓 Interview Talking Points

### Elevator Pitch
> "I built a geospatial machine learning system that analyzes historical crime data from India's National Crime Records Bureau and predicts high-risk zones using Random Forest classification and DBSCAN clustering. The system visualizes crime hotspots through interactive Folium heatmaps and provides a FastAPI backend with a React dashboard for real-time predictions."

### Technical Highlights
1. **Data Engineering**: Processed 4+ years of NCRB data with temporal feature scaling
2. **Feature Engineering**: Implemented weighted features for spatial clustering
3. **ML Models**: Used Random Forest for risk and Isolation Forest for Anomaly Detection
4. **Geospatial Analysis**: Advanced ST-DBSCAN for spatio-temporal hotspot detection
5. **Full-Stack Logic**: Dynamic Risk Index calculating real-time safety scores

### Challenges Solved
- Geocoding Indian cities/districts without precise coordinates
- Handling imbalanced crime data across states
- Optimizing heatmap rendering for large datasets
- Creating interpretable risk predictions for law enforcement

---

## 📝 Future Enhancements

- [ ] Real-time crime data integration
- [ ] Mobile app for police officers
- [ ] Advanced deep learning models (LSTM for time-series)
- [ ] Multi-language support (Hindi, regional languages)
- [ ] Integration with police dispatch systems
- [ ] Predictive patrol route optimization

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👨‍💻 Author

**Yash Raghubanshi**

Built as a placement-ready project demonstrating:
- Machine Learning & Data Science
- Geospatial Analysis
- Full-Stack Development
- Real-World Problem Solving

---

## 🙏 Acknowledgments

- National Crime Records Bureau (NCRB) for open crime data
- Open Government Data Platform India
- Scikit-learn and GeoPandas communities
