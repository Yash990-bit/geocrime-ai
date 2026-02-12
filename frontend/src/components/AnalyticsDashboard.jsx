
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { Activity, BarChart2, Calendar } from 'lucide-react';

const AnalyticsDashboard = () => {
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/analytics');
                setData(response.data);
            } catch (error) {
                console.error("Failed to fetch analytics:", error);
            }
        };
        fetchAnalytics();
    }, []);

    if (!data) return <div className="p-4">Loading analytics...</div>;

    return (
        <div className="mt-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
                <BarChart2 className="mr-2" /> Crime Analytics
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Hourly Trends */}
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Activity className="mr-2 size-5" /> Hourly Trends
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.hourly_trends}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="hour" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Crime Types */}
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Crime Distribution</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.crime_types} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="type" type="category" width={100} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#82ca9d" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Daily Trends (Radar) */}
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Calendar className="mr-2 size-5" /> Day-wise Analysis
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.daily_trends}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="day" />
                                <PolarRadiusAxis />
                                <Radar name="Crimes" dataKey="count" stroke="#ff8042" fill="#ff8042" fillOpacity={0.6} />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AnalyticsDashboard;
