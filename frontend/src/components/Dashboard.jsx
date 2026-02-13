import React, { useState, useEffect } from 'react';
import MapComponent from './Map';
import AnalyticsDashboard from './AnalyticsDashboard';
import axios from 'axios';
import { MapPin, AlertTriangle, Activity, Filter, Clock, Radio, Search, Shield, Database, Layout, ChevronRight, Calendar, BarChart2 } from 'lucide-react';

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

    // Logic State
    const [currentTime, setCurrentTime] = useState(new Date());

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

    // Fetch filtered map data
    useEffect(() => {
        if (!hasSearched) return;

        const fetchMapData = async () => {
            try {
                let url = 'http://localhost:8000/api/heatmap-data?';
                if (filters.crimeType !== 'All') url += `crime_type = ${filters.crimeType}& `;
                if (filters.startDate) url += `start_date = ${filters.startDate}& `;
                if (filters.endDate) url += `end_date = ${filters.endDate} `;

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
            const response = await axios.post('/api/predict', formData);
            setPrediction(response.data);
        } catch (error) {
            console.error("Prediction failed:", error);
        }
    };

    // Memoized center to prevent unnecessary map resets
    const memoizedCenter = React.useMemo(() => {
        if (!hasSearched) return null;
        return [formData.latitude, formData.longitude];
    }, [hasSearched, formData.latitude, formData.longitude]);

    // --- LANDING PAGE VIEW ---
    if (!hasSearched) {
        return (
            <div className="relative min-h-screen flex flex-col items-center justify-center bg-white overflow-hidden font-sans">
                {/* Refined Background - Clean & Subtle */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.05)_0%,rgba(255,255,255,0)_50%)]"></div>
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

                <div className="z-10 text-center max-w-4xl w-full px-6">
                    <div className="mb-12 flex justify-center">
                        <div className="p-5 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 shadow-sm">
                            <MapPin className="size-10 text-emerald-600" />
                        </div>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tight text-slate-900">
                        GeoCrime <span className="text-emerald-600 text-shadow-sm">Intelligence</span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-600 mb-14 font-medium max-w-2xl mx-auto leading-relaxed">
                        A sophisticated archival system for geospatial threat analysis and risk mitigation.
                        Enter a location to initialize strategic data mapping.
                    </p>

                    <form onSubmit={handleSearch} className="relative max-w-3xl mx-auto mb-20">
                        <div className="relative flex items-center bg-white rounded-3xl border border-slate-200 p-2 shadow-xl transition-all duration-300 focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-500/50">
                            <div className="flex items-center flex-1 px-5">
                                <Search className="text-slate-400 group-focus-within:text-emerald-500 transition-colors size-6" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search location (e.g., London, Dubai)..."
                                    className="w-full bg-transparent border-none p-5 text-xl text-slate-900 placeholder-slate-400 focus:ring-0 font-semibold"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSearching}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-12 rounded-2xl transition-all duration-300 disabled:opacity-50 shadow-lg shadow-emerald-200"
                            >
                                {isSearching ? (
                                    <div className="flex items-center">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                                        SYNCING
                                    </div>
                                ) : 'EXPLORE'}
                            </button>
                        </div>
                    </form>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                        <div className="p-8 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all group">
                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 transition-transform group-hover:scale-110">
                                <Activity size={24} />
                            </div>
                            <h3 className="text-base font-bold text-slate-900 mb-3">Risk Assessment</h3>
                            <p className="text-sm text-slate-500 leading-relaxed font-medium">Detailed modeling of regional threat potential and historical density.</p>
                        </div>
                        <div className="p-8 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all group">
                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 transition-transform group-hover:scale-110">
                                <Database size={24} />
                            </div>
                            <h3 className="text-base font-bold text-slate-900 mb-3">Data Repository</h3>
                            <p className="text-sm text-slate-500 leading-relaxed font-medium">Secure access to normalized geospatial crime statistics.</p>
                        </div>
                        <div className="p-8 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all group">
                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 transition-transform group-hover:scale-110">
                                <Shield size={24} />
                            </div>
                            <h3 className="text-base font-bold text-slate-900 mb-3">Threat Mitigation</h3>
                            <p className="text-sm text-slate-500 leading-relaxed font-medium">Strategic insights for effective resource allocation and safety planning.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }


    // --- MAIN DASHBOARD VIEW ---
    return (
        <div className="p-8 min-h-screen bg-[#f8fafc] text-slate-900 animate-in fade-in slide-in-from-bottom-2 duration-1000 font-sans">
            <header className="mb-10 flex flex-col md:flex-row justify-between items-center glass-card p-6 bg-white/80 border-slate-100 shadow-sm">
                <div className="flex items-center mb-6 md:mb-0 cursor-pointer group" onClick={() => setHasSearched(false)}>
                    <div className="p-4 bg-emerald-50 rounded-2xl mr-5 border border-emerald-100 group-hover:border-emerald-200 transition-all duration-300">
                        <MapPin className="size-8 text-emerald-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                            GeoCrime <span className="text-emerald-600">Intelligence</span>
                        </h1>
                        <p className="text-slate-500 text-xs tracking-[0.2em] font-mono mt-1 uppercase flex items-center font-bold">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2"></span>
                            Sector: {searchQuery}
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-10">
                    <div className="text-right hidden md:block">
                        <p className="text-[10px] text-slate-400 uppercase tracking-[0.3em] font-bold mb-1">Operation Clock</p>
                        <p className="text-2xl font-mono font-bold text-slate-900 flex items-center justify-end">
                            <Clock className="mr-3 size-5 text-emerald-500" />
                            {currentTime.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                    </div>
                </div>
            </header>


            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">

                {/* Left Column: UI Controls (Span 4) */}
                <div className="lg:col-span-4 space-y-8">

                    {/* Prediction Panel */}
                    <div className="glass-card p-8 group relative overflow-hidden bg-white border-slate-100 shadow-sm">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full transition-all duration-700 group-hover:bg-emerald-500/10 pointer-events-none" />

                        <h2 className="text-xl font-extrabold mb-8 flex items-center text-slate-900 tracking-tight">
                            <span className="bg-emerald-50 p-2 rounded-lg mr-4 text-emerald-600"><Activity className="size-5" /></span>
                            Risk Prediction
                        </h2>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Latitude</label>
                                    <input
                                        type="number"
                                        value={formData.latitude}
                                        onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                                        className="w-full p-4 font-mono text-sm bg-slate-50 border-slate-200 text-slate-900"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Longitude</label>
                                    <input
                                        type="number"
                                        value={formData.longitude}
                                        onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                                        className="w-full p-4 font-mono text-sm bg-slate-50 border-slate-200 text-slate-900"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Temporal Anchor</label>
                                <input
                                    type="datetime-local"
                                    value={formData.date.slice(0, 16)}
                                    onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value).toISOString() })}
                                    className="w-full p-4 font-mono text-sm bg-slate-50 border-slate-200 text-slate-900"
                                />
                            </div>

                            <button
                                onClick={handlePredict}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-5 px-6 rounded-2xl shadow-lg shadow-emerald-100 transition-all duration-500 transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                            >
                                <Shield className="size-5" />
                                Run Prediction
                            </button>
                        </div>

                        {prediction && (
                            <div className={`mt-10 p-6 rounded-2xl border backdrop-blur-md animate-in zoom-in-95 duration-500 relative ${prediction.risk_level === 'High Risk'
                                ? 'bg-red-500/5 border-red-500/20 text-red-200'
                                : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-200'
                                }`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center font-bold text-xs uppercase tracking-[0.2em]">
                                        <div className={`mr-3 p-1.5 rounded-md ${prediction.risk_level === 'High Risk' ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
                                            <AlertTriangle className={`size-4 ${prediction.risk_level === 'High Risk' ? 'text-red-400' : 'text-emerald-400'}`} />
                                        </div>
                                        {prediction.risk_level}
                                    </div>
                                    <span className="text-[10px] uppercase font-mono text-slate-500">Confidence</span>
                                </div>
                                <div className="w-full bg-black/40 rounded-full h-3 mb-2 p-0.5 border border-white/5">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.1)] ${prediction.risk_level === 'High Risk' ? 'bg-gradient-to-r from-red-500 to-rose-400' : 'bg-gradient-to-r from-emerald-500 to-teal-400'}`}
                                        style={{ width: `${prediction.risk_score * 100}%` }}
                                    ></div>
                                </div>
                                <p className="text-right text-sm font-mono font-bold tracking-tighter">{(prediction.risk_score * 100).toFixed(1)}%</p>
                            </div>
                        )}
                    </div>

                    {/* Filters Panel */}
                    <div className="glass-card p-8 bg-white border-slate-100 shadow-sm">
                        <h2 className="text-xl font-extrabold mb-8 flex items-center text-slate-900 tracking-tight">
                            <span className="bg-emerald-50 p-2 rounded-lg mr-4 text-emerald-600"><Filter className="size-5" /></span>
                            Data Filters
                        </h2>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Classification</label>
                                <select
                                    value={filters.crimeType}
                                    onChange={(e) => setFilters({ ...filters, crimeType: e.target.value })}
                                    className="w-full p-4 font-semibold bg-slate-50 border-slate-200 text-slate-900 appearance-none rounded-xl focus:ring-emerald-500/20"
                                >
                                    <option value="All">All Categories</option>
                                    <option value="Theft">Theft (Larceny)</option>
                                    <option value="Assault">Assault (Physical)</option>
                                    <option value="Burglary">Burglary (Residential)</option>
                                    <option value="Vandalism">Vandalism</option>
                                    <option value="Fraud">Fraud & Identity</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Range Start</label>
                                    <input type="date" onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} className="w-full p-4 font-mono text-sm bg-slate-50 border-slate-200" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Range End</label>
                                    <input type="date" onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} className="w-full p-4 font-mono text-sm bg-slate-50 border-slate-200" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Tactical Map (Span 8) */}
                <div className="lg:col-span-8 glass-card p-2 rounded-3xl shadow-xl h-[700px] flex flex-col relative group overflow-hidden border border-slate-100 bg-white">
                    <div className="absolute top-6 right-6 z-[400] bg-white/90 backdrop-blur-xl px-4 py-2.5 rounded-xl border border-slate-100 pointer-events-none shadow-lg">
                        <h2 className="text-xs font-extrabold text-slate-900 flex items-center tracking-widest uppercase">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse mr-3 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                            Tactical HUD Active
                        </h2>
                    </div>

                    <MapComponent
                        heatmapData={mapData}
                        center={memoizedCenter}
                    />
                </div>
            </div>

            {/* Analytics Section */}
            <div className="animate-in slide-in-from-bottom-8 duration-1000 delay-300">
                <AnalyticsDashboard
                    location={hasSearched ? { lat: formData.latitude, lon: formData.longitude } : null}
                />
            </div>
        </div>
    );
};


export default Dashboard;
