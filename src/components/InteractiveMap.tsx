import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, RefreshCw, Layers } from 'lucide-react';
import { CHENNAI_HUBS } from './MockData';

// Custom Map Hub coordinates mapping
const HUB_COORDINATES: Record<string, [number, number]> = {
  adyar: [13.0033, 80.2550],
  tnagar: [13.0405, 80.2337],
  annanagar: [13.0850, 80.2101],
  velachery: [12.9801, 80.2228],
  central: [13.0827, 80.2707]
};

interface InteractiveMapProps {
  onSelectHub?: (hubId: string) => void;
  activeHubId?: string | null;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ onSelectHub, activeHubId }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  const [mapMode, setMapMode] = useState<'standard' | 'satellite'>('standard');
  const [selectedHubId, setSelectedHubId] = useState<string | null>(activeHubId || null);

  const tileUrls = {
    standard: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
  };

  const attributions = {
    standard: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    satellite: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  };

  // Switch map view mode
  useEffect(() => {
    if (mapRef.current) {
      if (tileLayerRef.current) {
        mapRef.current.removeLayer(tileLayerRef.current);
      }
      
      const newTileLayer = L.tileLayer(tileUrls[mapMode], {
        attribution: attributions[mapMode],
        maxZoom: 18
      });
      
      newTileLayer.addTo(mapRef.current);
      tileLayerRef.current = newTileLayer;
    }
  }, [mapMode]);

  // Sync internal hub selection with external prop
  useEffect(() => {
    if (activeHubId) {
      setSelectedHubId(activeHubId);
      // Pan to selected hub
      const coords = HUB_COORDINATES[activeHubId];
      if (coords && mapRef.current) {
        mapRef.current.setView(coords, 14, { animate: true });
        // Open popup
        const marker = markersRef.current[activeHubId];
        if (marker) {
          marker.openPopup();
        }
      }
    }
  }, [activeHubId]);

  // Map Initialization
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet map centered on Chennai
    const map = L.map(mapContainerRef.current, {
      center: [13.045, 80.24],
      zoom: 12,
      zoomControl: false // position customly
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial tile layer
    const initialTileLayer = L.tileLayer(tileUrls[mapMode], {
      attribution: attributions[mapMode],
      maxZoom: 18
    });
    initialTileLayer.addTo(map);
    tileLayerRef.current = initialTileLayer;
    mapRef.current = map;

    // Render Markers for each Chennai Hub
    CHENNAI_HUBS.forEach((hub) => {
      const coords = HUB_COORDINATES[hub.id] || [13.0827, 80.2707];
      
      // Gorgeous custom HTML pulsating marker
      const customIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center group">
            <div class="absolute w-8 h-8 bg-blue-500/30 rounded-full animate-ping pointer-events-none"></div>
            <div class="w-6 h-6 rounded-full bg-gradient-to-b from-blue-900 to-blue-950 border border-cyan-400 flex items-center justify-center shadow-lg transition-transform duration-200 hover:scale-125">
              <span class="w-2.5 h-2.5 bg-cyan-400 rounded-full shadow-[0_0_4px_rgba(34,211,238,0.9)]"></span>
            </div>
          </div>
        `,
        className: 'custom-hub-marker-div',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker(coords, { icon: customIcon }).addTo(map);
      
      // Setup detailed informative popup
      const popupContent = `
        <div style="font-family: sans-serif; min-width: 160px; padding: 4px;">
          <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 800; text-transform: uppercase; color: #0f172a; letter-spacing: -0.01em;">${hub.name}</h4>
          <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b; line-height: 1.3;">${hub.address}</p>
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 6px;">
            <span style="font-size: 9px; font-weight: 800; background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">${hub.distance}</span>
            <span style="font-size: 9px; font-weight: 700; color: #1e293b;">${hub.gate}</span>
          </div>
        </div>
      `;
      
      marker.bindPopup(popupContent);
      
      // Marker Click Interaction
      marker.on('click', () => {
        setSelectedHubId(hub.id);
        if (onSelectHub) {
          onSelectHub(hub.id);
        }
      });

      markersRef.current[hub.id] = marker;
    });

    // Cleanup map on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col font-sans">
      {/* Top Map Header & Controls */}
      <div className="p-4 border-b border-slate-150 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50">
        <div>
          <h3 className="font-display font-black text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <span className="w-1.5 h-4 bg-blue-600 inline-block"></span>
            Chennai Live Coverage Map
          </h3>
          <p className="text-[10px] text-slate-500 font-medium uppercase mt-0.5 tracking-wide">
            Verified Partner Drop Zones & Escrow Hubs
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 self-stretch sm:self-auto shadow-inner">
          <button
            type="button"
            onClick={() => setMapMode('standard')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              mapMode === 'standard'
                ? 'bg-blue-900 text-cyan-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Standard View
          </button>
          <button
            type="button"
            onClick={() => setMapMode('satellite')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              mapMode === 'satellite'
                ? 'bg-blue-900 text-cyan-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Satellite View
          </button>
        </div>
      </div>

      {/* Actual Map Canvas Area */}
      <div className="relative w-full h-[320px] bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Floating Indicator Overlay */}
        <div className="absolute top-4 left-4 z-20 bg-slate-950/80 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700/50 flex items-center gap-2 text-white">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
            Scanning 5 Hubs in Realtime
          </span>
        </div>

        {/* Selected Hub Info Box */}
        {selectedHubId && (
          <div className="absolute bottom-4 left-4 right-12 sm:right-auto z-20 bg-white/95 backdrop-blur-sm p-3 rounded-2xl border border-slate-200 shadow-2xl max-w-sm animate-fade-in text-left">
            {(() => {
              const selectedHub = CHENNAI_HUBS.find(h => h.id === selectedHubId);
              if (!selectedHub) return null;
              return (
                <div className="space-y-1">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      Active Hub • {selectedHub.distance}
                    </span>
                    <button 
                      onClick={() => setSelectedHubId(null)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">{selectedHub.name}</h4>
                  <p className="text-[10px] text-slate-500">{selectedHub.address}</p>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide pt-1">
                    ✓ Handover Gate: {selectedHub.gate}
                  </p>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Grid of shortcut quick zoom links */}
      <div className="p-3 bg-slate-50 border-t border-slate-150 grid grid-cols-2 sm:grid-cols-5 gap-2">
        {CHENNAI_HUBS.map((hub) => (
          <button
            key={hub.id}
            type="button"
            onClick={() => {
              setSelectedHubId(hub.id);
              if (onSelectHub) {
                onSelectHub(hub.id);
              }
              const coords = HUB_COORDINATES[hub.id];
              if (coords && mapRef.current) {
                mapRef.current.setView(coords, 14, { animate: true });
                const marker = markersRef.current[hub.id];
                if (marker) {
                  marker.openPopup();
                }
              }
            }}
            className={`px-2 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider text-center transition-all truncate ${
              selectedHubId === hub.id
                ? 'bg-blue-900 border-blue-900 text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            {hub.name.split(',')[0].replace(' Recovery Hub', '').replace(' Community Hub', '').replace(' West Hub', '')}
          </button>
        ))}
      </div>
    </div>
  );
};
