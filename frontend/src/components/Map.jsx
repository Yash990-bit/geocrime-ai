
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

// Sub-component to add pulsing effect for new points
const LiveEventsLayer = ({ events }) => {
    return (
        <>
            {events.map((event, idx) => (
                <CircleMarker
                    key={`live-${idx}-${event.timestamp}`}
                    center={[event.latitude, event.longitude]}
                    radius={10}
                    pathOptions={{
                        color: 'red',
                        fillColor: 'red',
                        fillOpacity: 0.8,
                        className: 'pulsing-marker' // Custom CSS class
                    }}
                >
                    <Popup>
                        <strong>🔴 LIVE REPORT</strong><br />
                        Type: {event.crime_type}<br />
                        Severity: {event.severity}<br />
                        Time: {new Date(event.timestamp).toLocaleTimeString()}
                    </Popup>
                </CircleMarker>
            ))}
        </>
    );
};

const HeatmapLayer = ({ data }) => {
    return (
        <>
            {data.map((point, idx) => (
                <CircleMarker
                    key={idx}
                    center={[point.latitude, point.longitude]}
                    radius={5}
                    pathOptions={{
                        color: point.severity > 3 ? 'red' : 'orange',
                        fillColor: point.severity > 3 ? 'red' : 'orange',
                        fillOpacity: 0.6
                    }}
                >
                    <Popup>
                        Crime Severity: {point.severity}
                    </Popup>
                </CircleMarker>
            ))}
        </>
    );
};

const MapComponent = ({ heatmapData, liveEvents }) => {
    const [hotspots, setHotspots] = useState([]);

    useEffect(() => {
        const fetchHotspots = async () => {
            try {
                const hotRes = await axios.get('http://localhost:8000/api/hotspots');
                setHotspots(hotRes.data.clusters);
            } catch (error) {
                console.error("Error fetching hotspots:", error);
            }
        };
        fetchHotspots();
    }, []);

    const safeHeatmapData = heatmapData || [];
    const safeLiveEvents = liveEvents || [];

    return (
        <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <HeatmapLayer data={safeHeatmapData} />

            {/* Hotspots */}
            {hotspots.map((cluster, idx) => (
                <CircleMarker
                    key={`cluster-${idx}`}
                    center={[cluster.latitude, cluster.longitude]}
                    radius={cluster.count / 5}
                    pathOptions={{
                        color: 'purple',
                        fillColor: 'purple',
                        fillOpacity: 0.3
                    }}
                >
                    <Popup>
                        <strong>Hotspot Cluster</strong><br />
                        Crimes: {cluster.count}
                    </Popup>
                </CircleMarker>
            ))}

            {/* Live Events Layer */}
            <LiveEventsLayer events={safeLiveEvents} />
        </MapContainer>
    );
};

export default MapComponent;
