
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';

const HeatmapLayer = ({ data, locationName }) => {
    // Extract a shorter area name from the full display_name (usually the first two parts)
    const area = locationName ? locationName.split(',').slice(0, 2).join(',').trim() : 'Operational Sector';

    return (
        <>
            {data.map((point, idx) => (
                <CircleMarker
                    key={idx}
                    center={[point.latitude, point.longitude]}
                    radius={6}
                    pathOptions={{
                        color: point.severity > 3 ? '#f43f5e' : '#10b981',
                        fillColor: point.severity > 3 ? '#f43f5e' : '#10b981',
                        fillOpacity: 0.7,
                        weight: 1
                    }}
                >
                    <Tooltip direction="top" offset={[0, -5]} opacity={1} permanent={false}>
                        <div className="font-mono text-[10px] leading-tight text-slate-900 px-1">
                            <span className="font-extrabold block text-emerald-600 uppercase tracking-tighter">LANDMARK DETECTED</span>
                            <span className="text-slate-900 font-bold block truncate max-w-[150px]">{area}</span>
                        </div>
                    </Tooltip>
                    <Popup>
                        <div className="font-mono text-xs p-1 min-w-[180px]">
                            <span className="font-bold uppercase block mb-1 text-slate-900 border-b border-slate-100 pb-1">Threat Level {point.severity}</span>
                            <div className="space-y-1.5 mt-2">
                                <p className="text-slate-500 font-bold flex justify-between">
                                    <span>TYPE:</span>
                                    <span className="text-slate-900">{point.crime_type || 'Unknown'}</span>
                                </p>
                                <p className="text-slate-500 font-bold flex justify-between">
                                    <span>AREA:</span>
                                    <span className="text-emerald-600 truncate max-w-[120px]" title={locationName}>{area}</span>
                                </p>
                                <p className="text-slate-500 font-bold flex justify-between">
                                    <span>SECTOR:</span>
                                    <span className="text-slate-900">ALPHA-{(idx % 12) + 1}</span>
                                </p>
                                <div className="text-[9px] text-slate-400 mt-3 border-t border-slate-100 pt-1 font-semibold leading-relaxed">
                                    PRECISION RADIUS: 5.2m<br />
                                    COORD: {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                                </div>
                            </div>
                        </div>
                    </Popup>
                </CircleMarker>
            ))}
        </>
    );
};

// Sub-component to handle map view updates
const RecenterMap = ({ center }) => {
    const map = useMap();
    const lastCentered = React.useRef(null);

    useEffect(() => {
        if (!center) return;

        const centerId = `${center[0]},${center[1]}`;
        if (lastCentered.current === centerId) return;

        map.setView(center, 14);
        lastCentered.current = centerId;
    }, [center, map]);
    return null;
};

const MapComponent = ({ heatmapData, center, locationName }) => {
    const [hotspots, setHotspots] = useState([]);

    useEffect(() => {
        const fetchHotspots = async () => {
            try {
                const hotRes = await axios.get('/api/hotspots');
                setHotspots(hotRes.data.clusters);
            } catch (error) {
                console.error("Error fetching hotspots:", error);
            }
        };
        fetchHotspots();
    }, []);

    const safeHeatmapData = heatmapData || [];
    const defaultCenter = [20.5937, 78.9629]; // India center

    return (
        <MapContainer center={center || defaultCenter} zoom={center ? 14 : 5} style={{ height: '100%', width: '100%' }}>
            <RecenterMap center={center} />

            {/* Base: Satellite Imagery */}
            <TileLayer
                attribution='Tiles &copy; Esri'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />

            {/* Overlay: Labels & Boundaries */}
            <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
            />

            <HeatmapLayer data={safeHeatmapData} locationName={locationName} />

            {/* Hotspots */}
            {hotspots.map((cluster, idx) => (
                <CircleMarker
                    key={`cluster-${idx}`}
                    center={[cluster.latitude, cluster.longitude]}
                    radius={Math.min(cluster.count * 2, 40)}
                    pathOptions={{
                        color: '#10b981',
                        fillColor: '#10b981',
                        fillOpacity: 0.15,
                        weight: 2,
                        dashArray: '5, 10'
                    }}
                >
                    <Popup>
                        <div className="font-mono text-xs">
                            <strong className="text-indigo-400 block mb-1 uppercase tracking-tighter">Hotspot Nexus</strong>
                            Events: {cluster.count}
                        </div>
                    </Popup>
                </CircleMarker>
            ))}
        </MapContainer>
    );
};

export default MapComponent;
