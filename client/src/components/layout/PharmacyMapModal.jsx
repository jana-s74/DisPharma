import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const COIMBATORE_CENTER = [11.0168, 76.9558];

const TILE_LAYERS = {
  street: {
    label: 'Map',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
  },
  satellite: {
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© <a href="https://www.esri.com/">Esri</a>',
  },
  terrain: {
    label: 'Terrain',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
  },
};

// ── OSRM turn instruction icons ────────────────────────────────────────────
const turnIcon = (type) => {
  const m = {
    'turn-left': '↰', 'turn-right': '↱', 'turn-sharp-left': '⬅',
    'turn-sharp-right': '➡', 'turn-slight-left': '↖', 'turn-slight-right': '↗',
    'continue': '↑', 'roundabout': '🔄', 'depart': '🚀', 'arrive': '🏁',
  };
  return m[type] || '→';
};

const fmtDist = (m) => m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
const fmtTime = (s) => {
  const h = Math.floor(s / 3600);
  const min = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${min}m`;
  return min < 1 ? '< 1 min' : `${min} min`;
};

const PharmacyMapModal = ({ onClose }) => {
  const { user } = useAuth();
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const tileLayerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const userMarkerRef = useRef(null);

  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeLayer, setActiveLayer] = useState('street');

  // Navigation state
  const [navState, setNavState] = useState('idle'); // idle | locating | routing | done | error
  const [navError, setNavError] = useState('');
  const [routeInfo, setRouteInfo] = useState(null); // { distM, timeS, steps[] }
  const [showDirections, setShowDirections] = useState(false);
  const [userGps, setUserGps] = useState(null);

  // Fetch pharmacies
  useEffect(() => {
    api.get('/search/nearby-pharmacies')
      .then(res => setPharmacies(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Init Leaflet map
  useEffect(() => {
    if (loading || leafletMap.current || !mapRef.current) return;

    import('leaflet').then((L) => {
      delete L.Icon.Default.prototype._getIconUrl;

      let center = COIMBATORE_CENTER;
      let zoom = 11;
      if (user?.location?.coordinates?.[0] !== 0 && user?.location?.coordinates?.[1] !== 0) {
        center = [user.location.coordinates[1], user.location.coordinates[0]];
        zoom = 13;
      }

      const map = L.map(mapRef.current, { center, zoom, zoomControl: false });
      leafletMap.current = map;
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const layer = TILE_LAYERS.street;
      tileLayerRef.current = L.tileLayer(layer.url, {
        attribution: layer.attribution, maxZoom: 19, subdomains: 'abcd',
      }).addTo(map);

      const makeMarker = (emoji, bg, size = 36) => L.divIcon({
        html: `<div style="position:relative;width:${size}px;height:${size}px">
          <div style="position:absolute;inset:0;background:${bg};border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 14px rgba(0,0,0,0.35)"></div>
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:${Math.round(size*0.45)}px">${emoji}</div>
        </div>`,
        className: '', iconSize: [size, size], iconAnchor: [size / 2, size], popupAnchor: [0, -(size + 6)],
      });

      const ownIcon = makeMarker('🏥', '#16a34a', 42);
      const netIcon = makeMarker('💊', '#ea580c', 34);

      pharmacies.forEach((p) => {
        if (p.lat && Math.abs(p.lat) > 0.001) {
          L.marker([p.lat, p.lng], { icon: netIcon }).addTo(map)
            .bindPopup(`<div style="font-family:sans-serif;min-width:180px">
              <b style="color:#1e293b">${p.medicalName}</b>
              <div style="font-size:11px;color:#ea580c;font-weight:600">Network Pharmacy</div>
              ${p.address ? `<div style="font-size:11px;color:#64748b;margin-top:4px">📍 ${p.address}</div>` : ''}
              ${p.distance ? `<div style="margin-top:6px;background:#f0fdf4;border-radius:6px;padding:4px 8px;font-size:11px;color:#16a34a;font-weight:700">🚗 ${p.distance} away</div>` : ''}
            </div>`, { maxWidth: 260 });
        }
      });

      if (user?.location?.coordinates?.[0] !== 0 && user?.location?.coordinates?.[1] !== 0) {
        const [lng, lat] = user.location.coordinates;
        L.marker([lat, lng], { icon: ownIcon }).addTo(map)
          .bindPopup(`<div style="font-family:sans-serif">
            <b>${user.medicalName}</b>
            <div style="font-size:11px;color:#16a34a;font-weight:600">Your Pharmacy ⭐</div>
          </div>`, { maxWidth: 220 })
          .openPopup();
      }

      // Live GPS dot
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(({ coords }) => {
          const { latitude: lat, longitude: lng } = coords;
          setUserGps({ lat, lng });
          const gpsIcon = L.divIcon({
            html: `<div style="position:relative;width:24px;height:24px">
              <div style="position:absolute;inset:-6px;background:#3b82f6;border-radius:50%;opacity:0.18;animation:gps-ring 2s infinite"></div>
              <div style="position:absolute;inset:4px;background:#3b82f6;border-radius:50%;border:3px solid white;box-shadow:0 0 10px rgba(59,130,246,0.8)"></div>
            </div>
            <style>@keyframes gps-ring{0%,100%{transform:scale(1);opacity:0.18}50%{transform:scale(1.7);opacity:0.06}}</style>`,
            className: '', iconSize: [24, 24], iconAnchor: [12, 12],
          });
          userMarkerRef.current = L.marker([lat, lng], { icon: gpsIcon })
            .addTo(map)
            .bindPopup('<div style="font-weight:700;color:#3b82f6">📍 You are here</div>');
        }, () => {});
      }
    });

    return () => {
      if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null; tileLayerRef.current = null; }
    };
  }, [loading, pharmacies, user]);

  // Switch tile layer
  const switchLayer = (key) => {
    if (!leafletMap.current || key === activeLayer) return;
    import('leaflet').then((L) => {
      if (tileLayerRef.current) leafletMap.current.removeLayer(tileLayerRef.current);
      const layer = TILE_LAYERS[key];
      tileLayerRef.current = L.tileLayer(layer.url, { attribution: layer.attribution, maxZoom: 19, subdomains: 'abcd' }).addTo(leafletMap.current);
      tileLayerRef.current.bringToBack();
    });
    setActiveLayer(key);
  };

  // ── OSRM Routing ────────────────────────────────────────────────────────
  const navigateToPharmacy = useCallback(async () => {
    const pharmacyCoords = user?.location?.coordinates;
    if (!pharmacyCoords || (pharmacyCoords[0] === 0 && pharmacyCoords[1] === 0)) {
      setNavError('Your pharmacy location is not set. Please update it in your profile.');
      setNavState('error');
      return;
    }

    setNavState('locating');
    setNavError('');
    setRouteInfo(null);

    // Get current position
    if (!navigator.geolocation) {
      setNavError('Geolocation is not supported by your browser.');
      setNavState('error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const from = { lat: coords.latitude, lng: coords.longitude };
        const to = { lat: pharmacyCoords[1], lng: pharmacyCoords[0] };
        setUserGps(from);
        setNavState('routing');

        try {
          // OSRM public API — free, uses real OpenStreetMap road data
          const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=true&annotations=false`;
          const res = await fetch(url);
          const data = await res.json();

          if (data.code !== 'Ok' || !data.routes?.length) {
            throw new Error('No route found between your location and pharmacy.');
          }

          const route = data.routes[0];
          const steps = route.legs[0]?.steps?.map(s => ({
            instruction: s.maneuver?.type || 'continue',
            name: s.name || '',
            distM: s.distance,
            modifier: s.maneuver?.modifier || '',
          })) || [];

          setRouteInfo({ distM: route.distance, timeS: route.duration, steps });

          // Draw route on map
          const L = await import('leaflet');
          if (routeLayerRef.current) leafletMap.current.removeLayer(routeLayerRef.current);

          // Route polyline (animated blue)
          routeLayerRef.current = L.geoJSON(route.geometry, {
            style: { color: '#3b82f6', weight: 5, opacity: 0.85, dashArray: null },
          }).addTo(leafletMap.current);

          // Fit map to show full route
          leafletMap.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [40, 40] });

          // Update or add user GPS marker
          const gpsIcon = L.divIcon({
            html: `<div style="position:relative;width:24px;height:24px">
              <div style="position:absolute;inset:-6px;background:#3b82f6;border-radius:50%;opacity:0.18;animation:gps-ring 2s infinite"></div>
              <div style="position:absolute;inset:4px;background:#3b82f6;border-radius:50%;border:3px solid white;box-shadow:0 0 10px rgba(59,130,246,0.8)"></div>
            </div>
            <style>@keyframes gps-ring{0%,100%{transform:scale(1);opacity:0.18}50%{transform:scale(1.7);opacity:0.06}}</style>`,
            className: '', iconSize: [24, 24], iconAnchor: [12, 12],
          });
          if (userMarkerRef.current) leafletMap.current.removeLayer(userMarkerRef.current);
          userMarkerRef.current = L.marker([from.lat, from.lng], { icon: gpsIcon })
            .addTo(leafletMap.current)
            .bindPopup('<div style="font-weight:700;color:#3b82f6">📍 You are here</div>');

          setNavState('done');
          setShowDirections(true);
        } catch (err) {
          setNavError(err.message || 'Failed to fetch route. Check your connection.');
          setNavState('error');
        }
      },
      () => {
        setNavError('Location access denied. Please allow location permission and try again.');
        setNavState('error');
      },
      { timeout: 10000 }
    );
  }, [user]);

  const clearRoute = () => {
    if (routeLayerRef.current && leafletMap.current) {
      leafletMap.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    setNavState('idle');
    setRouteInfo(null);
    setShowDirections(false);
    setNavError('');
  };

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
          style={{ width: '94vw', maxWidth: 1100, height: '90vh', maxHeight: 760 }}
        >
          {/* ── Header ── */}
          <div className="flex-shrink-0 bg-white border-b border-slate-200 px-5 py-3 flex items-center gap-3 z-10 flex-wrap">
            <div className="w-9 h-9 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-[#16a34a]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-slate-900">Pharmacy Network Map</h2>
              <p className="text-xs text-slate-500">{loading ? 'Loading...' : `${validCount + 1} pharmacies on map`}</p>
            </div>

            {/* Navigate button */}
            {navState === 'idle' || navState === 'error' ? (
              <button
                onClick={navigateToPharmacy}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                </svg>
                Navigate to My Pharmacy
              </button>
            ) : navState === 'locating' || navState === 'routing' ? (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-xl text-xs font-semibold">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                {navState === 'locating' ? 'Getting your location...' : 'Calculating route...'}
              </div>
            ) : navState === 'done' ? (
              <div className="flex items-center gap-2">
                {routeInfo && (
                  <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-xs font-bold text-blue-700">
                    <span>🛣️ {fmtDist(routeInfo.distM)}</span>
                    <span>⏱ {fmtTime(routeInfo.timeS)}</span>
                  </div>
                )}
                <button
                  onClick={() => setShowDirections(v => !v)}
                  className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all"
                >
                  {showDirections ? 'Hide' : 'Show'} Directions
                </button>
                <button
                  onClick={clearRoute}
                  className="flex items-center gap-1 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-red-50 hover:text-red-500 transition-all"
                >
                  ✕ Clear
                </button>
              </div>
            ) : null}

            {/* Layer toggle */}
            <div className="hidden sm:flex items-center bg-slate-100 rounded-lg p-1 gap-1">
              {Object.entries(TILE_LAYERS).map(([key, val]) => (
                <button key={key} onClick={() => switchLayer(key)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${activeLayer === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >{val.label}</button>
              ))}
            </div>

            {/* Legend */}
            <div className="hidden lg:flex items-center gap-3 text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-200">
              <span className="flex items-center gap-1.5 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-[#16a34a] inline-block"></span>Yours</span>
              <span className="flex items-center gap-1.5 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>Network</span>
              <span className="flex items-center gap-1.5 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>You (GPS)</span>
              <span className="flex items-center gap-1.5 font-medium"><span className="w-2.5 h-2.5 bg-blue-500 inline-block" style={{height:3}}></span>Route</span>
            </div>

            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 hover:text-red-500 transition-colors text-slate-400 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          {/* Error bar */}
          {navState === 'error' && navError && (
            <div className="flex-shrink-0 bg-amber-50 border-b border-amber-200 px-5 py-2 text-xs text-amber-700 font-medium flex items-center gap-2">
              <span>⚠️</span> {navError}
            </div>
          )}

          {/* ── Body ── */}
          <div className="flex-1 relative flex overflow-hidden">

            {/* Map */}
            <div className="flex-1 relative">
              <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

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

              <div className="absolute bottom-8 left-3 z-[500] pointer-events-none">
                <div className="bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-1 text-[10px] text-slate-500 border border-slate-200 shadow-sm">
                  🗺️ OSRM · CARTO · OpenStreetMap — Free &amp; Real-World Routing
                </div>
              </div>
            </div>

            {/* ── Directions Panel ── */}
            {showDirections && routeInfo && (
              <div className="w-72 flex-shrink-0 bg-white border-l border-slate-200 flex flex-col overflow-hidden">
                {/* Panel header */}
                <div className="bg-blue-600 text-white px-4 py-3 flex-shrink-0">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                    </svg>
                    <span className="font-bold text-sm">Turn-by-Turn Directions</span>
                  </div>
                  <div className="flex items-center gap-4 text-blue-100 text-xs">
                    <span>🛣️ {fmtDist(routeInfo.distM)}</span>
                    <span>⏱ {fmtTime(routeInfo.timeS)}</span>
                  </div>
                  <div className="text-blue-200 text-xs mt-1 truncate">
                    📍 You → 🏥 {user?.medicalName}
                  </div>
                </div>

                {/* Route info source note */}
                <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 text-[10px] text-blue-600 font-medium flex items-center gap-1">
                  <span>🤖</span>
                  <span>Route by OSRM (OpenStreetMap road network · Contraction Hierarchies algorithm)</span>
                </div>

                {/* Steps */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {routeInfo.steps.map((step, i) => (
                    <div key={i} className="px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-base font-bold ${
                        step.instruction === 'depart' ? 'bg-blue-100 text-blue-600' :
                        step.instruction === 'arrive' ? 'bg-green-100 text-green-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {turnIcon(step.modifier ? `${step.instruction}-${step.modifier}`.replace(' ', '-') : step.instruction)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 capitalize leading-tight">
                          {step.instruction === 'depart' ? 'Start' :
                           step.instruction === 'arrive' ? `Arrive at ${user?.medicalName}` :
                           `${step.instruction}${step.modifier ? ` ${step.modifier}` : ''}`}
                        </p>
                        {step.name && <p className="text-[11px] text-slate-500 truncate">{step.name}</p>}
                        {step.distM > 0 && (
                          <p className="text-[11px] text-blue-500 font-medium mt-0.5">{fmtDist(step.distM)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 border-t border-slate-200 px-4 py-3 bg-slate-50">
                  <p className="text-[10px] text-slate-400 text-center">
                    Powered by OSRM · Real road network data
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PharmacyMapModal;
