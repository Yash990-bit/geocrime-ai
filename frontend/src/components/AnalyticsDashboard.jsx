
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { Activity, BarChart2, Calendar } from 'lucide-react';

const AnalyticsDashboard = ({ location }) => {
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                let url = 'http://localhost:8000/api/analytics';
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

    if (!data) return <div className="p-4 text-cyan-500 font-mono animate-pulse">Loading System Analytics...</div>;

    return (
        <div className="mt-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center text-slate-100">
                <BarChart2 className="mr-3 text-cyan-400" /> Statistical Crime Analysis
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Hourly Trends */}
                <div className="glass-card p-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center">
                        <Activity className="mr-2 size-4 text-blue-400" /> Hourly Activity
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.hourly_trends}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="hour" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }}
                                    itemStyle={{ color: '#60a5fa' }}
                                />
                                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#1d4ed8' }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Crime Types */}
                <div className="glass-card p-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center">
                        <BarChart2 className="mr-2 size-4 text-emerald-400" /> Crime Categories
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.crime_types} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis type="number" stroke="#94a3b8" />
                                <YAxis dataKey="type" type="category" width={100} stroke="#94a3b8" />
                                <Tooltip
                                    cursor={{ fill: '#334155', opacity: 0.4 }}
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }}
                                />
                                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Daily Trends (Radar) */}
                <div className="glass-card p-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center">
                        <Calendar className="mr-2 size-4 text-orange-400" /> Weekly Pattern
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data.daily_trends}>
                                <PolarGrid stroke="#334155" />
                                <PolarAngleAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 'auto']} stroke="#475569" />
                                <Radar name="Crimes" dataKey="count" stroke="#f97316" fill="#f97316" fillOpacity={0.4} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }}
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
