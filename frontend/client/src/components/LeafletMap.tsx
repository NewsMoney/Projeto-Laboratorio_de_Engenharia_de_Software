import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons for Leaflet in bundled environments
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom teal marker icon for places
const placeIcon = L.divIcon({
  className: "joinme-marker",
  html: `<div style="
    width: 32px; height: 32px;
    background: linear-gradient(135deg, #d0dd1f, #14b8a6);
    border: 3px solid #fff;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    display: flex; align-items: center; justify-content: center;
  "><div style="
    width: 10px; height: 10px;
    background: #fff;
    border-radius: 50%;
    transform: rotate(45deg);
  "></div></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// User location icon
const userIcon = L.divIcon({
  className: "joinme-user-marker",
  html: `<div style="
    width: 16px; height: 16px;
    background: #3b82f6;
    border: 3px solid #fff;
    border-radius: 50%;
    box-shadow: 0 0 0 4px rgba(59,130,246,0.3), 0 2px 8px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export interface MapPlace {
  id: number;
  name: string;
  lat: string | number;
  lng: string | number;
  category?: string | null;
  address?: string;
}

interface LeafletMapProps {
  places?: MapPlace[];
  center?: [number, number];
  zoom?: number;
  onPlaceClick?: (place: MapPlace) => void;
  showUserLocation?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function LeafletMap({
  places = [],
  center,
  zoom = 13,
  onPlaceClick,
  showUserLocation = true,
  className = "",
  style,
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const defaultCenter: [number, number] = center || [-23.5505, -46.6333]; // São Paulo

    const map = L.map(mapRef.current, {
      center: defaultCenter,
      zoom,
      zoomControl: false,
      attributionControl: false,
    });

    // Dark tile layer from CartoDB - clean, no POIs, just streets
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        maxZoom: 19,
        subdomains: "abcd",
        attribution: "",
      }
    ).addTo(map);
    
    // remove qualquer attribution residual
    map.attributionControl?.remove();

    markersRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Slight delay to ensure proper rendering
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update center when prop changes
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  // Get user location
  useEffect(() => {
    if (!showUserLocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(loc);

        if (mapInstanceRef.current && !center) {
          mapInstanceRef.current.setView(loc, zoom);
        }
      },
      () => {
        // Geolocation denied/unavailable - keep default center
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [showUserLocation]);

  // Show user location marker
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(userLocation);
    } else {
      userMarkerRef.current = L.marker(userLocation, { icon: userIcon })
        .bindPopup('<div style="color:#1e293b;font-weight:600;font-size:13px;">Você está aqui</div>')
        .addTo(mapInstanceRef.current);
    }
  }, [userLocation]);

  // Update place markers
  useEffect(() => {
    if (!markersRef.current) return;

    markersRef.current.clearLayers();

    places.forEach((place) => {
      const lat = typeof place.lat === "string" ? parseFloat(place.lat) : place.lat;
      const lng = typeof place.lng === "string" ? parseFloat(place.lng) : place.lng;

      if (isNaN(lat) || isNaN(lng)) return;

      const marker = L.marker([lat, lng], { icon: placeIcon });

      const popupContent = `
        <div style="min-width:160px;padding:4px 0;">
          <div style="font-weight:700;font-size:14px;color:#0f172a;margin-bottom:4px;">${place.name}</div>
          ${place.category ? `<div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">${place.category}</div>` : ""}
          ${place.address ? `<div style="font-size:12px;color:#475569;">${place.address}</div>` : ""}
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: false,
        className: "joinme-popup",
      });

      if (onPlaceClick) {
        marker.on("click", () => onPlaceClick(place));
      }

      markersRef.current!.addLayer(marker);
    });

    // Fit bounds if there are places
    if (places.length > 0 && mapInstanceRef.current) {
      const bounds = L.latLngBounds(
        places
          .map((p) => {
            const lat = typeof p.lat === "string" ? parseFloat(p.lat) : p.lat;
            const lng = typeof p.lng === "string" ? parseFloat(p.lng) : p.lng;
            return isNaN(lat) || isNaN(lng) ? null : [lat, lng] as [number, number];
          })
          .filter(Boolean) as [number, number][]
      );

      if (bounds.isValid()) {
        if (userLocation) bounds.extend(userLocation);
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [places, onPlaceClick]);

  return (
    <div
      ref={mapRef}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "300px",
        borderRadius: "inherit",
        ...style,
      }}
    />
  );
}
