import React, { useState, useEffect } from 'react';
import MapComponent from './Map';
import AnalyticsDashboard from './AnalyticsDashboard';
import axios from 'axios';
import { MapPin, AlertTriangle, Activity, Filter } from 'lucide-react';

const Dashboard = () => {
    const [prediction, setPrediction] = useState(null);
    const [filters, setFilters] = useState({
        crimeType: 'All',
        startDate: '',
        endDate: ''
    });
    const [mapData, setMapData] = useState([]);

    // Prediction Form State
    const [formData, setFormData] = useState({
        latitude: 28.7041,
        longitude: 77.1025,
        date: new Date().toISOString()
    });

    // Fetch filtered map data
    useEffect(() => {
        const fetchMapData = async () => {
            try {
                let url = 'http://localhost:8000/api/heatmap-data?';
                if (filters.crimeType !== 'All') url += `crime_type=${filters.crimeType}&`;
                if (filters.startDate) url += `start_date=${filters.startDate}&`;
                if (filters.endDate) url += `end_date=${filters.endDate}`;

                const response = await axios.get(url);
                setMapData(response.data);
            } catch (error) {
                console.error("Error fetching map data:", error);
            }
        };
        fetchMapData();
    }, [filters]);

    const handlePredict = async () => {
        try {
            const response = await axios.post('http://localhost:8000/api/predict', formData);
            setPrediction(response.data);
        } catch (error) {
            console.error("Prediction failed:", error);
        }
    };

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                    <MapPin className="mr-2" /> GeoCrime AI
                </h1>
                <p className="text-gray-600">Crime Hotspot Prediction & Analysis System</p>
            </header>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

                {/* Left Column: Controls & Filters */}
                <div className="space-y-6">
                    {/* Prediction Panel */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4 flex items-center">
                            <Activity className="mr-2" /> Risk Prediction
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Latitude</label>
                                <input type="number" value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Longitude</label>
                                <input type="number" value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Date</label>
                                <input type="datetime-local" onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value).toISOString() })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                            </div>
                            <button onClick={handlePredict} className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition">
                                Predict Risk
                            </button>
                        </div>
                        {prediction && (
                            <div className={`mt-6 p-4 rounded-md ${prediction.risk_level === 'High Risk' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                <div className="flex items-center">
                                    <AlertTriangle className="mr-2" />
                                    <span className="font-bold text-lg">{prediction.risk_level}</span>
                                </div>
                                <p className="mt-1">Risk Score: {(prediction.risk_score * 100).toFixed(1)}%</p>
                            </div>
                        )}
                    </div>

                    {/* Filters Panel */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4 flex items-center">
                            <Filter className="mr-2" /> Map Filters
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Crime Type</label>
                                <select
                                    value={filters.crimeType}
                                    onChange={(e) => setFilters({ ...filters, crimeType: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                                >
                                    <option value="All">All Crimes</option>
                                    <option value="Theft">Theft</option>
                                    <option value="Assault">Assault</option>
                                    <option value="Burglary">Burglary</option>
                                    <option value="Vandalism">Vandalism</option>
                                    <option value="Fraud">Fraud</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                                <input type="date" onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">End Date</label>
                                <input type="date" onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Map */}
                <div className="col-span-1 lg:col-span-2 bg-white p-6 rounded-lg shadow-md h-[600px]">
                    <h2 className="text-xl font-semibold mb-4">Live Crime Heatmap</h2>
                    <MapComponent heatmapData={mapData} />
                </div>
            </div>

            {/* Analytics Section */}
            <AnalyticsDashboard />
        </div>
    );
};

export default Dashboard;
