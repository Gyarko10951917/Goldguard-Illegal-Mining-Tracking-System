import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

// Fix for default markers in react-leaflet
interface IconPrototype {
  _getIconUrl?: () => string;
}

export interface DashboardCase {
  id: string;
  region: string;
  lat: number;
  lng: number;
  type: string;
  status: string;
}

interface DashboardMapLeafletProps {
  cases: DashboardCase[];
}

export const DashboardMapLeaflet: React.FC<DashboardMapLeafletProps> = ({ cases }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Fix for default markers in react-leaflet (only on client-side)
    if (typeof window !== 'undefined') {
      delete (L.Icon.Default.prototype as IconPrototype)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
      setIsMounted(true);
    }
  }, []);

  if (!isMounted) {
    return (
      <div className="h-full w-full bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }
  const center: [number, number] = [7.9465, -1.0232]; // Ghana center

  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'New': return '#3b82f6'; // blue
      case 'Pending': return '#eab308'; // yellow
      case 'Active': return '#f97316'; // orange
      case 'Solved': return '#22c55e'; // green
      case 'Rejected': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  };

  const createCustomIcon = (status: string) => {
    try {
      const color = getMarkerColor(status);
      return L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
    } catch (error) {
      console.warn('Error creating custom icon:', error);
      return L.icon({
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });
    }
  };

  try {
    return (
      <MapContainer
        center={center}
        zoom={6}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '8px',
          zIndex: 1
        }}
        scrollWheelZoom={true}
        whenReady={() => {
          // Ensure map is properly initialized
          setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
          }, 100);
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {cases.map((caseItem) => (
          <Marker
            key={caseItem.id}
            position={[caseItem.lat, caseItem.lng]}
            icon={createCustomIcon(caseItem.status)}
          >
            <Popup>
              <div className="p-2">
                <div className="font-semibold text-gray-900">{caseItem.region}</div>
                <div className="text-sm text-gray-600">{caseItem.type}</div>
                <div className="text-sm">
                  Status: <span className={`font-medium ${
                    caseItem.status === 'Solved' ? 'text-green-600' :
                    caseItem.status === 'Active' ? 'text-orange-600' :
                    caseItem.status === 'Pending' ? 'text-yellow-600' :
                    caseItem.status === 'New' ? 'text-blue-600' :
                    'text-red-600'
                  }`}>
                    {caseItem.status}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">ID: {caseItem.id}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    );
  } catch (error) {
    console.error('Error rendering map:', error);
    return (
      <div className="h-full w-full bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div>Map could not be loaded</div>
          <div className="text-sm mt-1">Please refresh the page to try again</div>
        </div>
      </div>
    );
  }
};

export default DashboardMapLeaflet;