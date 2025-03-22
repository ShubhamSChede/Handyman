'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with Next.js
const defaultIcon = L.icon({
  iconUrl: '/marker-icon.png',
  iconRetinaUrl: '/marker-icon-2x.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function MapComponent({ providers, center = [28.6139, 77.2090], zoom = 12 }) {
  const mapRef = useRef(null);

  useEffect(() => {
    // Set default icon for all markers
    L.Marker.prototype.options.icon = defaultIcon;
    
    // Fix for map container rendering issues in certain browsers
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current.invalidateSize();
      }, 0);
    }
  }, []);

  return (
    <MapContainer 
      center={center} 
      zoom={zoom} 
      style={{ height: '100%', width: '100%' }}
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {providers.map(provider => (
        <Marker 
          key={provider.id}
          position={provider.coordinates}
        >
          <Popup>
            <div className="font-medium">{provider.name}</div>
            <div className="text-sm text-gray-600">{provider.service}</div>
            <div className="text-sm text-gray-500">{provider.address}</div>
            <div className="text-sm font-medium text-blue-600 mt-1">{provider.price}</div>
            <div className="text-sm text-yellow-500 mt-1">
              {"★".repeat(Math.floor(provider.rating))}
              <span className="text-gray-400">
                {"☆".repeat(5 - Math.floor(provider.rating))}
              </span>
              <span className="text-gray-500 ml-1">({provider.reviews})</span>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
