
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

// Fix for default marker icon in Leaflet
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

const HotspotLayer = ({ data }) => {
    return (
        <>
            {data.map((cluster, idx) => (
                <CircleMarker
                    key={`cluster-${idx}`}
                    center={[cluster.latitude, cluster.longitude]}
                    radius={cluster.count / 5} // Size based on count
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
        </>
    );
}

const MapComponent = () => {
    const [heatmapData, setHeatmapData] = useState([]);
    const [hotspots, setHotspots] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const heatRes = await axios.get('http://localhost:8000/api/heatmap-data');
                setHeatmapData(heatRes.data);

                const hotRes = await axios.get('http://localhost:8000/api/hotspots');
                setHotspots(hotRes.data.clusters);
            } catch (error) {
                console.error("Error fetching map data:", error);
            }
        };
        fetchData();
    }, []);

    return (
        <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '500px', width: '100%' }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <HeatmapLayer data={heatmapData} />
            <HotspotLayer data={hotspots} />
        </MapContainer>
    );
};

export default MapComponent;
