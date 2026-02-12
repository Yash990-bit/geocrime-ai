
import React, { useState } from 'react';
import MapComponent from './Map';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { MapPin, AlertTriangle, Activity } from 'lucide-react';

const Dashboard = () => {
    const [prediction, setPrediction] = useState(null);
    const [formData, setFormData] = useState({
        latitude: 28.7041,
        longitude: 77.1025,
        date: new Date().toISOString()
    });

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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Control Panel */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                        <Activity className="mr-2" /> Risk Prediction
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Latitude</label>
                            <input
                                type="number"
                                value={formData.latitude}
                                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Longitude</label>
                            <input
                                type="number"
                                value={formData.longitude}
                                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Date</label>
                            <input
                                type="datetime-local"
                                onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value).toISOString() })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                            />
                        </div>

                        <button
                            onClick={handlePredict}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
                        >
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

                {/* Map View */}
                <div className="col-span-2 bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Live Crime Heatmap</h2>
                    <MapComponent />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
