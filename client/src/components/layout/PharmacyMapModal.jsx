import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const COIMBATORE_CENTER = [11.0168, 76.9558];

// Map tile layers — all free, no API key
const TILE_LAYERS = {
  street: {
    label: 'Map',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
  },
  satellite: {
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© <a href="https://www.esri.com/">Esri</a> — Source: Esri, USGS, NGA, NASA, CGIAR, NLS, OS',
  },
  terrain: {
    label: 'Terrain',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
  },
};

const PharmacyMapModal = ({ onClose }) => {
  const { user } = useAuth();
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const tileLayerRef = useRef(null);
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeLayer, setActiveLayer] = useState('street');
  const [pharmacyCount, setPharmacyCount] = useState(0);

  // Fetch all pharmacies
  useEffect(() => {
    api.get('/search/nearby-pharmacies')
      .then(res => { setPharmacies(res.data); setPharmacyCount(res.data.length); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Init Leaflet map
  useEffect(() => {
    if (loading || leafletMap.current || !mapRef.current) return;

    import('leaflet').then((L) => {
      delete L.Icon.Default.prototype._getIconUrl;

      // Determine center from user's stored coordinates
      let center = COIMBATORE_CENTER;
      let zoom = 11;
      if (user?.location?.coordinates?.[0] !== 0 && user?.location?.coordinates?.[1] !== 0) {
        center = [user.location.coordinates[1], user.location.coordinates[0]];
        zoom = 13;
      }

      const map = L.map(mapRef.current, {
        center,
        zoom,
        zoomControl: false,
      });
      leafletMap.current = map;

      // Custom zoom controls position
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Initial tile layer — CartoDB Voyager (Google Maps style)
      const layer = TILE_LAYERS.street;
      tileLayerRef.current = L.tileLayer(layer.url, {
        attribution: layer.attribution,
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // ── Custom SVG Marker factories ──
      const makeMarker = (emoji, bg, size = 36) => L.divIcon({
        html: `<div style="
          position:relative;
          width:${size}px;height:${size}px;
        ">
          <div style="
            position:absolute;inset:0;
            background:${bg};
            border:3px solid #fff;
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            box-shadow:0 4px 14px rgba(0,0,0,0.35);
          "></div>
          <div style="
            position:absolute;inset:0;
            display:flex;align-items:center;justify-content:center;
            font-size:${Math.round(size * 0.45)}px;line-height:1;
          ">${emoji}</div>
        </div>`,
        className: '',
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
        popupAnchor: [0, -(size + 6)],
      });

      const ownIcon = makeMarker('🏥', '#16a34a', 42);
      const netIcon = makeMarker('💊', '#ea580c', 34);

      // ── Plot network pharmacies ──
      let plotted = 0;
      pharmacies.forEach((p) => {
        if (p.lat && p.lng && Math.abs(p.lat) > 0.001) {
          plotted++;
          L.marker([p.lat, p.lng], { icon: netIcon })
            .addTo(map)
            .bindPopup(`
              <div style="font-family:'Segoe UI',Arial,sans-serif;min-width:210px;padding:2px">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                  <div style="width:36px;height:36px;background:#fff3ed;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">💊</div>
                  <div>
                    <p style="font-weight:700;font-size:13px;color:#1e293b;margin:0">${p.medicalName}</p>
                    <p style="font-size:11px;color:#ea580c;margin:0;font-weight:600">Network Pharmacy</p>
                  </div>
                </div>
                ${p.address ? `<p style="font-size:11px;color:#64748b;margin:2px 0;display:flex;gap:4px"><span>📍</span>${p.address}</p>` : ''}
                ${p.pincode ? `<p style="font-size:11px;color:#64748b;margin:2px 0;display:flex;gap:4px"><span>📮</span>${p.pincode}</p>` : ''}
                ${p.phone ? `<p style="font-size:11px;color:#64748b;margin:2px 0;display:flex;gap:4px"><span>📞</span>${p.phone}</p>` : ''}
                ${p.distance ? `<div style="margin-top:6px;background:#f0fdf4;border-radius:6px;padding:4px 8px;font-size:11px;color:#16a34a;font-weight:700">🚗 ${p.distance} away</div>` : ''}
              </div>
            `, { maxWidth: 260 });
        }
      });

      // ── Plot own pharmacy ──
      if (user?.location?.coordinates?.[0] !== 0 && user?.location?.coordinates?.[1] !== 0) {
        const [lng, lat] = user.location.coordinates;
        L.marker([lat, lng], { icon: ownIcon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:'Segoe UI',Arial,sans-serif;min-width:210px;padding:2px">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                <div style="width:36px;height:36px;background:#f0fdf4;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">🏥</div>
                <div>
                  <p style="font-weight:700;font-size:13px;color:#1e293b;margin:0">${user.medicalName}</p>
                  <p style="font-size:11px;color:#16a34a;margin:0;font-weight:600">Your Pharmacy ⭐</p>
                </div>
              </div>
              ${user.address ? `<p style="font-size:11px;color:#64748b;margin:2px 0;display:flex;gap:4px"><span>📍</span>${user.address}</p>` : ''}
              ${user.pincode ? `<p style="font-size:11px;color:#64748b;margin:2px 0;display:flex;gap:4px"><span>📮</span>${user.pincode}</p>` : ''}
              ${user.phone ? `<p style="font-size:11px;color:#64748b;margin:2px 0;display:flex;gap:4px"><span>📞</span>${user.phone}</p>` : ''}
            </div>
          `, { maxWidth: 260 })
          .openPopup();
      }

      // ── Plot live GPS ──
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(({ coords }) => {
          const { latitude: lat, longitude: lng } = coords;
          const gpsIcon = L.divIcon({
            html: `<div style="position:relative;width:24px;height:24px">
              <div style="position:absolute;inset:-6px;background:#3b82f6;border-radius:50%;opacity:0.18;animation:gps-ring 2s infinite"></div>
              <div style="position:absolute;inset:-1px;background:#3b82f6;border-radius:50%;opacity:0.12;animation:gps-ring 2s infinite 0.5s"></div>
              <div style="position:absolute;inset:4px;background:#3b82f6;border-radius:50%;border:3px solid white;box-shadow:0 0 10px rgba(59,130,246,0.8)"></div>
            </div>
            <style>
              @keyframes gps-ring{0%,100%{transform:scale(1);opacity:0.18}50%{transform:scale(1.7);opacity:0.06}}
            </style>`,
            className: '',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });
          L.marker([lat, lng], { icon: gpsIcon })
            .addTo(map)
            .bindPopup('<div style="font-weight:700;color:#3b82f6;font-family:sans-serif">📍 You are here</div>');
        }, () => {});
      }
    });

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
        tileLayerRef.current = null;
      }
    };
  }, [loading, pharmacies, user]);

  // Switch tile layer without recreating map
  const switchLayer = (key) => {
    if (!leafletMap.current || key === activeLayer) return;
    import('leaflet').then((L) => {
      if (tileLayerRef.current) {
        leafletMap.current.removeLayer(tileLayerRef.current);
      }
      const layer = TILE_LAYERS[key];
      tileLayerRef.current = L.tileLayer(layer.url, {
        attribution: layer.attribution,
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(leafletMap.current);
      tileLayerRef.current.bringToBack();
    });
    setActiveLayer(key);
  };

  // Escape key
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const validCount = pharmacies.filter(p => p.lat && Math.abs(p.lat) > 0.001).length;

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      <div
        className="fixed inset-0 z-[999] flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          className="relative bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          style={{ width: '94vw', maxWidth: 1040, height: '90vh', maxHeight: 740 }}
        >
          {/* ── Header ── */}
          <div className="flex-shrink-0 bg-white border-b border-slate-200 px-5 py-3 flex items-center gap-3 z-10">
            {/* Icon */}
            <div className="w-9 h-9 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-[#16a34a]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>

            {/* Title */}
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-slate-900 leading-tight">Pharmacy Network — Coimbatore District</h2>
              <p className="text-xs text-slate-500">
                {loading ? 'Loading...' : `${validCount + 1} pharmacies on map`}
              </p>
            </div>

            {/* Layer toggle */}
            <div className="hidden sm:flex items-center bg-slate-100 rounded-lg p-1 gap-1">
              {Object.entries(TILE_LAYERS).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => switchLayer(key)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    activeLayer === key
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {val.label}
                </button>
              ))}
            </div>

            {/* Legend */}
            <div className="hidden lg:flex items-center gap-3 text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-200">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a] inline-block"></span>Yours
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>Network
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>You (GPS)
              </span>
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 hover:text-red-500 transition-colors text-slate-400 flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* ── Map ── */}
          <div className="flex-1 relative">
            <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

            {/* Loading overlay */}
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10">
                <div className="flex flex-col items-center gap-3">
                  <svg className="w-8 h-8 text-[#16a34a] animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  <p className="text-sm font-semibold text-slate-600">Loading pharmacy network...</p>
                </div>
              </div>
            )}

            {/* Bottom badge */}
            <div className="absolute bottom-8 left-3 z-[500] pointer-events-none">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-1 text-[10px] text-slate-500 border border-slate-200 shadow-sm">
                🗺️ CARTO · Esri · OpenStreetMap — Free &amp; High Accuracy
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PharmacyMapModal;
