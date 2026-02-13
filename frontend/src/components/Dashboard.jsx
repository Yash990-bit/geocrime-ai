import React, { useState, useEffect } from 'react';
import MapComponent from './Map';
import AnalyticsDashboard from './AnalyticsDashboard';
import axios from 'axios';
import { MapPin, AlertTriangle, Activity, Filter, Clock, Radio, Search, Shield } from 'lucide-react';

const Dashboard = () => {
    // UI State
    const [hasSearched, setHasSearched] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Data State
    const [prediction, setPrediction] = useState(null);
    const [filters, setFilters] = useState({
        crimeType: 'All',
        startDate: '',
        endDate: ''
    });
    const [mapData, setMapData] = useState([]);

    // Live Mode State
    const [isLiveMode, setIsLiveMode] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [liveEvents, setLiveEvents] = useState([]);

    // Prediction Form State
    const [formData, setFormData] = useState({
        latitude: 28.7041,
        longitude: 77.1025,
        date: new Date().toISOString()
    });

    // Clock Effect
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Live Feed Polling
    useEffect(() => {
        let interval;
        if (isLiveMode) {
            const fetchLive = async () => {
                try {
                    // Use current form data (search location) for live feed
                    const { latitude, longitude } = formData;
                    const res = await axios.get(`http://localhost:8000/api/live-feed?lat=${latitude}&lon=${longitude}`);
                    if (res.data && res.data.length > 0) {
                        setLiveEvents(prev => [...res.data, ...prev].slice(0, 20));
                    }
                } catch (e) {
                    console.error("Live feed error:", e);
                }
            };
            fetchLive();
            interval = setInterval(fetchLive, 5000);
            // setFormData(prev => ({...prev, date: new Date().toISOString()})); // Removed auto-date reset on user request
        }
        return () => clearInterval(interval);
    }, [isLiveMode, formData.latitude, formData.longitude]);

    // Fetch filtered map data
    useEffect(() => {
        if (!hasSearched) return;

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
    }, [filters, hasSearched]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            // Geocoding via Nominatim
            const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}`);
            if (res.data && res.data.length > 0) {
                const { lat, lon } = res.data[0];
                setFormData({
                    ...formData,
                    latitude: parseFloat(lat),
                    longitude: parseFloat(lon)
                });
                setHasSearched(true);
            } else {
                alert("Location not found. Please try again.");
            }
        } catch (error) {
            console.error("Geocoding failed:", error);
            alert("Search failed. Please check your connection.");
        } finally {
            setIsSearching(false);
        }
    };

    const handlePredict = async () => {
        try {
            const response = await axios.post('http://localhost:8000/api/predict', formData);
            setPrediction(response.data);
        } catch (error) {
            console.error("Prediction failed:", error);
        }
    };

    // --- LANDING PAGE VIEW ---
    if (!hasSearched) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-slate-100 relative overflow-hidden">
                {/* Background Animation */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black opacity-80"></div>
                </div>

                <div className="z-10 text-center max-w-2xl w-full">
                    <div className="mb-8 flex justify-center">
                        <div className="p-6 bg-cyan-500/10 rounded-full border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.2)]">
                            <Shield className="size-16 text-cyan-400" />
                        </div>
                    </div>

                    <h1 className="text-5xl md:text-6xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 tracking-tight">
                        GeoCrime AI
                    </h1>

                    <p className="text-xl text-slate-400 mb-12">
                        Advanced Predictive Analytics & Live Threat Monitoring System
                    </p>

                    <form onSubmit={handleSearch} className="relative max-w-lg mx-auto mb-12 group">
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
                        <div className="relative flex items-center bg-slate-800 rounded-xl border border-slate-700 shadow-2xl overflow-hidden">
                            <Search className="ml-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Enter city or area to analyze (e.g., Delhi, Mumbai)..."
                                className="w-full bg-transparent border-none p-4 text-lg text-white placeholder-slate-500 focus:ring-0"
                            />
                            <button
                                type="submit"
                                disabled={isSearching}
                                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 px-8 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSearching ? 'SCANNING...' : 'INITIALIZE'}
                            </button>
                        </div>
                    </form>

                    <div className="grid grid-cols-3 gap-4 text-center text-slate-500 text-sm font-mono">
                        <div className="p-4 glass-card">
                            <Activity className="mx-auto mb-2 text-blue-400" />
                            PREDICTIVE AI
                        </div>
                        <div className="p-4 glass-card">
                            <Clock className="mx-auto mb-2 text-purple-400" />
                            REAL-TIME DATA
                        </div>
                        <div className="p-4 glass-card">
                            <MapPin className="mx-auto mb-2 text-red-400" />
                            HOTSPOT MAPPING
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- MAIN DASHBOARD VIEW ---
    return (
        <div className="p-6 min-h-screen text-slate-100 animate-in fade-in duration-700">
            <header className="mb-8 flex flex-col md:flex-row justify-between items-center glass-card p-6">
                <div className="flex items-center mb-4 md:mb-0 cursor-pointer" onClick={() => setHasSearched(false)}>
                    <div className="p-3 bg-cyan-500/10 rounded-full mr-4 border border-cyan-500/30">
                        <MapPin className="size-8 text-cyan-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-tight">
                            GeoCrime AI
                        </h1>
                        <p className="text-slate-400 text-sm tracking-wide uppercase">Active Sector: {searchQuery}</p>
                    </div>
                </div>

                <div className="flex items-center space-x-6">
                    <div className="text-right hidden md:block">
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">System Time</p>
                        <p className="text-xl font-mono font-bold text-cyan-400 flex items-center justify-end">
                            <Clock className="mr-2 size-5" />
                            {currentTime.toLocaleTimeString()}
                        </p>
                    </div>

                    <button
                        onClick={() => setIsLiveMode(!isLiveMode)}
                        className={`relative overflow-hidden group flex items-center px-6 py-2 rounded-full font-bold transition-all duration-300 border ${isLiveMode
                            ? 'bg-red-500/10 border-red-500 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                            : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700 hover:text-white'
                            }`}
                    >
                        <span className={`absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer ${isLiveMode ? 'animate-shimmer' : ''}`} />
                        <Radio className={`mr-2 transition-transform ${isLiveMode ? 'animate-pulse' : ''}`} />
                        {isLiveMode ? 'LIVE FEED ACTIVE' : 'ACTIVATE LIVE FEED'}
                    </button>
                </div>
            </header>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

                {/* Left Column: Controls & Filters */}
                <div className="space-y-6">
                    {/* Prediction Panel */}
                    <div className="glass-card p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full -mr-4 -mt-4 pointer-events-none" />

                        <h2 className="text-xl font-semibold mb-6 flex items-center text-blue-400">
                            <Activity className="mr-3" /> Risk Prediction Engine
                        </h2>

                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Latitude</label>
                                    <input
                                        type="number"
                                        value={formData.latitude}
                                        onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                                        className="w-full rounded-lg p-2.5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Longitude</label>
                                    <input
                                        type="number"
                                        value={formData.longitude}
                                        onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                                        className="w-full rounded-lg p-2.5"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Date & Time</label>
                                <input
                                    type="datetime-local"
                                    value={isLiveMode ? currentTime.toISOString().slice(0, 16) : formData.date.slice(0, 16)}
                                    onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value).toISOString() })}
                                    className="w-full rounded-lg p-2.5"
                                />
                            </div>

                            <button
                                onClick={handlePredict}
                                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 transform hover:-translate-y-0.5"
                            >
                                ANALYZE RISK
                            </button>
                        </div>

                        {prediction && (
                            <div className={`mt-6 p-4 rounded-lg border backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 z-10 relative ${prediction.risk_level === 'High Risk'
                                ? 'bg-red-500/10 border-red-500/50 text-red-200'
                                : 'bg-green-500/10 border-green-500/50 text-green-200'
                                }`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center font-bold text-lg">
                                        <AlertTriangle className={`mr-2 ${prediction.risk_level === 'High Risk' ? 'text-red-500' : 'text-green-500'}`} />
                                        {prediction.risk_level.toUpperCase()}
                                    </div>
                                    <span className="text-sm opacity-75">Confidence</span>
                                </div>
                                <div className="w-full bg-slate-900/50 rounded-full h-2.5 mb-1">
                                    <div
                                        className={`h-2.5 rounded-full transition-all duration-1000 ${prediction.risk_level === 'High Risk' ? 'bg-red-500' : 'bg-green-500'}`}
                                        style={{ width: `${prediction.risk_score * 100}%` }}
                                    ></div>
                                </div>
                                <p className="text-right text-xs font-mono">{(prediction.risk_score * 100).toFixed(1)}%</p>
                            </div>
                        )}
                    </div>

                    {/* Filters Panel */}
                    <div className="glass-card p-6">
                        <h2 className="text-xl font-semibold mb-6 flex items-center text-purple-400">
                            <Filter className="mr-3" /> Data Filters
                        </h2>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Crime Type</label>
                                <select
                                    value={filters.crimeType}
                                    onChange={(e) => setFilters({ ...filters, crimeType: e.target.value })}
                                    className="w-full rounded-lg p-2.5"
                                >
                                    <option value="All">All Categories</option>
                                    <option value="Theft">Theft</option>
                                    <option value="Assault">Assault</option>
                                    <option value="Burglary">Burglary</option>
                                    <option value="Vandalism">Vandalism</option>
                                    <option value="Fraud">Fraud</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Start Date</label>
                                    <input type="date" onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} className="w-full rounded-lg p-2.5" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">End Date</label>
                                    <input type="date" onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} className="w-full rounded-lg p-2.5" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Map */}
                <div className="col-span-1 lg:col-span-2 glass-card p-1 rounded-2xl shadow-2xl h-[600px] flex flex-col relative group">
                    <div className="absolute top-4 left-4 z-[400] bg-slate-900/80 backdrop-blur px-4 py-2 rounded-lg border border-slate-700 pointer-events-none">
                        <h2 className="text-lg font-bold text-slate-100 flex items-center">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2"></span>
                            Live Geospatial Feed
                        </h2>
                    </div>

                    <MapComponent
                        heatmapData={mapData}
                        liveEvents={liveEvents}
                        center={hasSearched ? [formData.latitude, formData.longitude] : null}
                    />
                </div>
            </div>

            {/* Analytics Section */}
            <AnalyticsDashboard
                location={hasSearched ? { lat: formData.latitude, lon: formData.longitude } : null}
            />
        </div>
    );
};

export default Dashboard;
