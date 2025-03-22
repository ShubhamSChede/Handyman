"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Map update component
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

const Map = ({ center = [20.5937, 78.9629] }) => {
  // Create a state for the icon
  const [icon, setIcon] = useState(null);
  
  // Move Leaflet initialization inside the component
  useEffect(() => {
    // Fix Leaflet marker icon issue
    const newIcon = L.icon({
      iconUrl: '/marker-icon.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });
    
    // Set the icon state
    setIcon(newIcon);
    
    // Fix Leaflet default icon path issues
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/marker-icon-2x.png',
      iconUrl: '/marker-icon.png',
      shadowUrl: '/marker-shadow.png',
    });
  }, []);
  
  // Don't render the map until the icon is loaded
  if (!icon) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <Marker position={center} icon={icon} />
      <MapUpdater center={center} />
    </MapContainer>
  );
};

export default Map;