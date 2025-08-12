"use client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";

type Props = {
  center: [number, number];
  markerPos: [number, number];
  setMarkerPos: (pos: [number, number]) => void;
};

function DraggableMarker({ markerPos, setMarkerPos }: { markerPos: [number, number]; setMarkerPos: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      if (e && e.latlng) {
        setMarkerPos([e.latlng.lat, e.latlng.lng]);
      }
    },
  });

  return (
    <Marker
      position={markerPos}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          try {
            const marker = e.target;
            if (marker && marker.getLatLng) {
              const pos = marker.getLatLng();
              setMarkerPos([pos.lat, pos.lng]);
            }
          } catch (error) {
            console.warn('Error handling marker drag:', error);
          }
        },
      }}
    />
  );
}

export default function ReportMapLeaflet({ center, markerPos, setMarkerPos }: Props) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Fix default marker icon issue in Leaflet with Webpack/Next.js
    // Add a slight delay to ensure DOM is ready
    setTimeout(() => {
      if (typeof window !== "undefined") {
        // @ts-expect-error: Leaflet marker icon url override for Next.js/Webpack compatibility
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });
      }
    }, 0);
    
    // Ensure map resizes correctly
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("resize"));
      }
    }, 100);
  }, []);

  // Don't render map until component is mounted
  if (!isMounted) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }
  return (
    <div style={{ height: "100%", width: "100%" }}>
      <MapContainer center={center} zoom={6} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <DraggableMarker markerPos={markerPos} setMarkerPos={setMarkerPos} />
      </MapContainer>
    </div>
  );
}
