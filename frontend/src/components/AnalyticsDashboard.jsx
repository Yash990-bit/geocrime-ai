
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { Activity, BarChart2, Calendar } from 'lucide-react';

const AnalyticsDashboard = ({ location }) => {
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                let url = '/api/analytics';
                if (location) {
                    url += `?lat=${location.lat}&lon=${location.lon}`;
                }
                const response = await axios.get(url);
                setData(response.data);
            } catch (error) {
                console.error("Failed to fetch analytics:", error);
            }
        };
        fetchAnalytics();
    }, [location]);

    if (!data) return (
        <div className="p-20 flex flex-col items-center justify-center space-y-6">
            <div className="w-16 h-16 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin"></div>
            <div className="text-center">
                <p className="font-sans text-sm font-bold text-slate-900 tracking-tight">Syncing Intelligence</p>
                <p className="text-xs text-slate-500 mt-1">Retrieving centralized geospatial statistics...</p>
            </div>
        </div>
    );

    return (
        <div className="mt-16 space-y-12">
            <div className="flex items-end justify-between border-b border-slate-100 pb-8">
                <div>
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-600">Analytics Sync: Nominal</span>
                    </div>
                    <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
                        Strategic Metrics
                    </h2>
                </div>
                <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[10px] text-slate-500 uppercase tracking-widest leading-none">
                    Local Archive 221-B
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                {/* Hourly Trends */}
                <div className="glass-card p-10 group bg-white shadow-sm border-slate-100">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-10 flex items-center">
                        <Activity className="mr-3 size-4 text-emerald-500" /> Temporal Intensity
                    </h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.hourly_trends}>
                                <defs>
                                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis
                                    dataKey="hour"
                                    stroke="#94a3b8"
                                    fontSize={10}
                                    tickFormatter={(val) => `${val}:00`}
                                    fontFamily="JetBrains Mono"
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    fontSize={10}
                                    fontFamily="JetBrains Mono"
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        borderColor: '#e2e8f0',
                                        borderRadius: '16px',
                                        fontSize: '12px',
                                        fontFamily: 'JetBrains Mono',
                                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#10b981"
                                    fill="url(#lineGradient)"
                                    strokeWidth={3}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#10b981"
                                    strokeWidth={4}
                                    dot={{ r: 0 }}
                                    activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Crime Types */}
                <div className="glass-card p-10 group bg-white shadow-sm border-slate-100">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-10 flex items-center">
                        <BarChart2 className="mr-3 size-4 text-emerald-500" /> Event Classification
                    </h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.crime_types} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                <XAxis type="number" stroke="#94a3b8" fontSize={10} fontFamily="JetBrains Mono" axisLine={false} tickLine={false} />
                                <YAxis
                                    dataKey="type"
                                    type="category"
                                    width={100}
                                    stroke="#94a3b8"
                                    fontSize={10}
                                    fontFamily="JetBrains Mono"
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        borderColor: '#e2e8f0',
                                        borderRadius: '16px',
                                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                                    }}
                                />
                                <Bar dataKey="count" fill="#10b981" radius={[0, 8, 8, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Daily Trends (Radar) */}
                <div className="glass-card p-10 group bg-white shadow-sm border-slate-100">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-10 flex items-center">
                        <Calendar className="mr-3 size-4 text-emerald-500" /> Weekly Distribution
                    </h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.daily_trends}>
                                <PolarGrid stroke="#f1f5f9" />
                                <PolarAngleAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 'auto']} stroke="#f1f5f9" tick={false} />
                                <Radar
                                    name="Frequency"
                                    dataKey="count"
                                    stroke="#10b981"
                                    fill="#10b981"
                                    fillOpacity={0.1}
                                    strokeWidth={3}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        borderColor: '#e2e8f0',
                                        borderRadius: '16px',
                                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                                    }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AnalyticsDashboard;
