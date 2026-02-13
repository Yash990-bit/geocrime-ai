
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;



const HeatmapLayer = ({ data }) => {
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
                    <Popup>
                        <div className="font-mono text-xs">
                            <span className="font-bold uppercase block mb-1">Threat Level {point.severity}</span>
                            <span className="text-slate-400">Classification: Sector {point.type || 'Alpha'}</span>
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
    useEffect(() => {
        if (center) {
            map.setView(center, 14); // Zoom level 14 for detailed satellite view
        }
    }, [center, map]);
    return null;
};

const MapComponent = ({ heatmapData, center }) => {
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

            <HeatmapLayer data={safeHeatmapData} />

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
