import { useEffect, useRef, useState } from 'react';

export default function ExclusionMap() {
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [exclusionAreas, setExclusionAreas] = useState([]);

  // Leaflet CSS und JS dynamisch laden
  useEffect(() => {
    // CSS laden
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
      document.head.appendChild(cssLink);
    }

    // JavaScript laden
    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
      script.onload = () => {
        setMapLoaded(true);
      };
      document.head.appendChild(script);
    } else {
      setMapLoaded(true);
    }

    // Gespeicherte Bereiche laden
    const saved = localStorage.getItem('seekerExclusionAreas');
    if (saved) {
      try {
        setExclusionAreas(JSON.parse(saved));
      } catch (e) {
        console.error('Fehler beim Laden der gespeicherten Bereiche:', e);
      }
    }
  }, []);

  // Position ermitteln
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Fallback: Bruchsal
          setUserLocation({ lat: 49.1244, lng: 8.5985 });
        }
      );
    } else {
      // Fallback: Bruchsal
      setUserLocation({ lat: 49.1244, lng: 8.5985 });
    }
  }, []);

  // Karte initialisieren
  useEffect(() => {
    if (mapLoaded && userLocation && mapRef.current && !window.seekerMapInstance) {
      initializeMap();
    }
  }, [mapLoaded, userLocation]);

  const initializeMap = () => {
    const L = window.L;
    
    // Karte erstellen
    const map = L.map(mapRef.current).setView([userLocation.lat, userLocation.lng], 15);
    
    // OpenStreetMap Tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Benutzer-Position markieren
    L.marker([userLocation.lat, userLocation.lng])
      .addTo(map)
      .bindPopup('📍 Deine Position')
      .openPopup();
    
    // Gespeicherte Bereiche hinzufügen
    exclusionAreas.forEach(area => {
      addExclusionArea(map, area);
    });

    window.seekerMapInstance = map;
  };

  const addExclusionArea = (map, area) => {
    const L = window.L;
    
    if (area.type === 'circle') {
      L.circle([area.center.lat, area.center.lng], {
        radius: area.radius,
        color: '#ff0000',
        fillColor: '#ff0000',
        fillOpacity: 0.3
      })
      .addTo(map)
      .bindPopup('🚫 Hider ist hier NICHT');
    } else if (area.type === 'rectangle') {
      L.rectangle([
        [area.bounds.south, area.bounds.west],
        [area.bounds.north, area.bounds.east]
      ], {
        color: '#ff0000',
        fillColor: '#ff0000',
        fillOpacity: 0.3
      })
      .addTo(map)
      .bindPopup('🚫 Hider ist hier NICHT');
    }
  };

  const saveAreas = (areas) => {
    setExclusionAreas(areas);
    localStorage.setItem('seekerExclusionAreas', JSON.stringify(areas));
  };

  const handleDrawCircle = () => {
    if (!window.seekerMapInstance) return;
    
    const map = window.seekerMapInstance;
    const center = map.getCenter();
    const radius = 200; // 200 Meter Radius
    
    const newArea = {
      id: Date.now(),
      type: 'circle',
      center: { lat: center.lat, lng: center.lng },
      radius: radius
    };
    
    const updatedAreas = [...exclusionAreas, newArea];
    saveAreas(updatedAreas);
    addExclusionArea(map, newArea);
  };

  const handleDrawRectangle = () => {
    if (!window.seekerMapInstance) return;
    
    const map = window.seekerMapInstance;
    const center = map.getCenter();
    const offset = 0.002; // ~200m
    
    const newArea = {
      id: Date.now(),
      type: 'rectangle',
      bounds: {
        north: center.lat + offset,
        south: center.lat - offset,
        east: center.lng + offset,
        west: center.lng - offset
      }
    };
    
    const updatedAreas = [...exclusionAreas, newArea];
    saveAreas(updatedAreas);
    addExclusionArea(map, newArea);
  };

  const clearAllAreas = () => {
    if (confirm('Alle markierten Bereiche löschen?')) {
      setExclusionAreas([]);
      localStorage.removeItem('seekerExclusionAreas');
      
      // Karte neu laden
      if (window.seekerMapInstance) {
        window.seekerMapInstance.remove();
        window.seekerMapInstance = null;
        setTimeout(() => {
          if (mapRef.current) {
            initializeMap();
          }
        }, 100);
      }
    }
  };

  if (!userLocation) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p>Lade Karte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <h2 className="text-xl font-semibold mb-4">🗺️ Ausschluss-Karte</h2>
      <p className="text-sm text-gray-600 mb-4">
        Markiere Bereiche, wo der Hider definitiv NICHT ist
      </p>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div 
          ref={mapRef} 
          className="w-full h-96"
          style={{ minHeight: '400px' }}
        />
        
        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-center gap-2 mb-3 flex-wrap">
            <button
              onClick={handleDrawCircle}
              className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
              🟢 Kreis hinzufügen
            </button>
            <button
              onClick={handleDrawRectangle}
              className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              ⬛ Rechteck hinzufügen
            </button>
            <button
              onClick={clearAllAreas}
              className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
            >
              🗑️ Alles löschen
            </button>
          </div>
          
          <div className="text-xs text-gray-500 text-center mb-2">
            Bereiche werden automatisch um die Kartenmitte erstellt
          </div>
          
          <div className="text-xs text-green-600 text-center">
            ✅ {exclusionAreas.length} Bereiche markiert
          </div>
        </div>
      </div>
    </div>
  );
}
