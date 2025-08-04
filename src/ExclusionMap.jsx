import { useEffect, useRef, useState } from 'react';

export default function ExclusionMap() {
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [drawnItems, setDrawnItems] = useState([]);
  const [currentColor, setCurrentColor] = useState('red');
  const [currentTool, setCurrentTool] = useState('circle');
  const [circleRadius, setCircleRadius] = useState(0.5); // in km
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);

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

    // Gespeicherte Items laden
    const saved = localStorage.getItem('seekerExclusionAreas');
    if (saved) {
      try {
        setDrawnItems(JSON.parse(saved));
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

  // Items neu rendern wenn sich drawnItems ändert
  useEffect(() => {
    if (window.seekerMapInstance && window.layerGroup) {
      renderAllItems();
    }
  }, [drawnItems]);

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
    
    // Layer Group für gezeichnete Items
    window.layerGroup = L.layerGroup().addTo(map);
    
    // Touch/Mouse Events für Freihand-Zeichnen
    let drawing = false;
    let path = [];
    let currentPolyline = null;

    map.on('mousedown touchstart', (e) => {
      if (currentTool === 'draw') {
        drawing = true;
        path = [e.latlng];
        setCurrentPath([e.latlng]);
        
        currentPolyline = L.polyline(path, {
          color: currentColor === 'red' ? '#ff0000' : '#0000ff',
          weight: 3,
          opacity: 0.8
        }).addTo(window.layerGroup);
        
        e.originalEvent.preventDefault();
      }
    });

    map.on('mousemove touchmove', (e) => {
      if (drawing && currentTool === 'draw') {
        path.push(e.latlng);
        setCurrentPath([...path]);
        currentPolyline.setLatLngs(path);
        e.originalEvent.preventDefault();
      }
    });

    map.on('mouseup touchend', (e) => {
      if (drawing && currentTool === 'draw') {
        drawing = false;
        
        // Freihand-Pfad als Item speichern
        const newItem = {
          id: Date.now(),
          type: 'freehand',
          color: currentColor,
          path: path.map(p => ({ lat: p.lat, lng: p.lng })),
          timestamp: new Date().toLocaleTimeString()
        };
        
        const updatedItems = [...drawnItems, newItem];
        setDrawnItems(updatedItems);
        saveItems(updatedItems);
        setCurrentPath([]);
        e.originalEvent.preventDefault();
      }
    });

    window.seekerMapInstance = map;
    renderAllItems();
  };

  const renderAllItems = () => {
    const L = window.L;
    if (!window.layerGroup) return;
    
    // Alle Layer entfernen
    window.layerGroup.clearLayers();
    
    // Alle Items neu rendern
    drawnItems.forEach(item => {
      let layer = null;
      const color = item.color === 'red' ? '#ff0000' : '#0000ff';
      const colorName = item.color === 'red' ? 'Rot (Ausschluss)' : 'Blau (Info)';
      
      if (item.type === 'circle') {
        layer = L.circle([item.center.lat, item.center.lng], {
          radius: item.radius * 1000, // km zu m
          color: color,
          fillColor: color,
          fillOpacity: 0.3,
          weight: 2
        });
        
        layer.bindPopup(`
          <div>
            <strong>${colorName} Kreis</strong><br>
            Radius: ${item.radius} km<br>
            Erstellt: ${item.timestamp}<br>
            <button onclick="window.deleteItem(${item.id})" style="background: red; color: white; border: none; padding: 5px; border-radius: 3px; cursor: pointer;">🗑️ Löschen</button>
          </div>
        `);
        
      } else if (item.type === 'line') {
        layer = L.polyline([
          [item.start.lat, item.start.lng],
          [item.end.lat, item.end.lng]
        ], {
          color: color,
          weight: 3,
          opacity: 0.8
        });
        
        layer.bindPopup(`
          <div>
            <strong>${colorName} Linie</strong><br>
            Länge: ${item.distance} m<br>
            Erstellt: ${item.timestamp}<br>
            <button onclick="window.deleteItem(${item.id})" style="background: red; color: white; border: none; padding: 5px; border-radius: 3px; cursor: pointer;">🗑️ Löschen</button>
          </div>
        `);
        
      } else if (item.type === 'freehand') {
        const pathCoords = item.path.map(p => [p.lat, p.lng]);
        layer = L.polyline(pathCoords, {
          color: color,
          weight: 3,
          opacity: 0.8
        });
        
        layer.bindPopup(`
          <div>
            <strong>${colorName} Freihand</strong><br>
            Erstellt: ${item.timestamp}<br>
            <button onclick="window.deleteItem(${item.id})" style="background: red; color: white; border: none; padding: 5px; border-radius: 3px; cursor: pointer;">🗑️ Löschen</button>
          </div>
        `);
      }
      
      if (layer) {
        layer.addTo(window.layerGroup);
      }
    });
  };

  // Global delete function
  useEffect(() => {
    window.deleteItem = (itemId) => {
      const updatedItems = drawnItems.filter(item => item.id !== itemId);
      setDrawnItems(updatedItems);
      saveItems(updatedItems);
    };
  }, [drawnItems]);

  const saveItems = (items) => {
    localStorage.setItem('seekerExclusionAreas', JSON.stringify(items));
  };

  const handleAddCircle = () => {
    if (!window.seekerMapInstance || circleRadius <= 0) return;
    
    const map = window.seekerMapInstance;
    const center = map.getCenter();
    
    const newItem = {
      id: Date.now(),
      type: 'circle',
      color: currentColor,
      center: { lat: center.lat, lng: center.lng },
      radius: circleRadius,
      timestamp: new Date().toLocaleTimeString()
    };
    
    const updatedItems = [...drawnItems, newItem];
    setDrawnItems(updatedItems);
    saveItems(updatedItems);
  };

  const handleAddLine = () => {
    if (!window.seekerMapInstance) return;
    
    const map = window.seekerMapInstance;
    const center = map.getCenter();
    
    // Linie von 200m nach Norden
    const offset = 0.0018; // ~200m
    const start = { lat: center.lat - offset, lng: center.lng };
    const end = { lat: center.lat + offset, lng: center.lng };
    
    // Distanz berechnen (Haversine Formel vereinfacht)
    const R = 6371000; // Erdradius in Metern
    const dLat = (end.lat - start.lat) * Math.PI / 180;
    const dLng = (end.lng - start.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
              Math.cos(start.lat * Math.PI / 180) * Math.cos(end.lat * Math.PI / 180) * 
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = Math.round(R * c);
    
    const newItem = {
      id: Date.now(),
      type: 'line',
      color: currentColor,
      start: start,
      end: end,
      distance: distance,
      timestamp: new Date().toLocaleTimeString()
    };
    
    const updatedItems = [...drawnItems, newItem];
    setDrawnItems(updatedItems);
    saveItems(updatedItems);
  };

  const clearAllItems = () => {
    if (confirm('Alle markierten Bereiche löschen?')) {
      setDrawnItems([]);
      localStorage.removeItem('seekerExclusionAreas');
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
        Markiere Bereiche und Linien für deine Suche
      </p>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div 
          ref={mapRef} 
          className="w-full h-96"
          style={{ minHeight: '400px' }}
        />
        
        <div className="p-4 border-t bg-gray-50">
          {/* Farb-Auswahl */}
          <div className="flex justify-center gap-2 mb-3">
            <button
              onClick={() => setCurrentColor('red')}
              className={`px-3 py-2 rounded text-white text-sm ${
                currentColor === 'red' ? 'bg-red-600' : 'bg-red-400'
              }`}
            >
              🔴 Rot (Ausschluss)
            </button>
            <button
              onClick={() => setCurrentColor('blue')}
              className={`px-3 py-2 rounded text-white text-sm ${
                currentColor === 'blue' ? 'bg-blue-600' : 'bg-blue-400'
              }`}
            >
              🔵 Blau (Info)
            </button>
          </div>

          {/* Tool-Auswahl */}
          <div className="flex justify-center gap-2 mb-3 flex-wrap">
            <button
              onClick={() => setCurrentTool('circle')}
              className={`px-3 py-2 rounded text-sm ${
                currentTool === 'circle' ? 'bg-green-600 text-white' : 'bg-gray-200'
              }`}
            >
              🟢 Kreis
            </button>
            <button
              onClick={() => setCurrentTool('line')}
              className={`px-3 py-2 rounded text-sm ${
                currentTool === 'line' ? 'bg-green-600 text-white' : 'bg-gray-200'
              }`}
            >
              📏 Linie
            </button>
            <button
              onClick={() => setCurrentTool('draw')}
              className={`px-3 py-2 rounded text-sm ${
                currentTool === 'draw' ? 'bg-green-600 text-white' : 'bg-gray-200'
              }`}
            >
              ✏️ Freihand
            </button>
          </div>

          {/* Kreis-Radius Eingabe */}
          {currentTool === 'circle' && (
            <div className="flex justify-center items-center gap-2 mb-3">
              <label className="text-sm">Radius:</label>
              <input
                type="number"
                value={circleRadius}
                onChange={(e) => setCircleRadius(parseFloat(e.target.value) || 0.5)}
                min="0.1"
                max="10"
                step="0.1"
                className="border p-1 rounded w-20 text-center"
              />
              <span className="text-sm">km</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center gap-2 mb-3 flex-wrap">
            {currentTool === 'circle' && (
              <button
                onClick={handleAddCircle}
                className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                ➕ Kreis hinzufügen
              </button>
            )}
            
            {currentTool === 'line' && (
              <button
                onClick={handleAddLine}
                className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                ➕ Linie hinzufügen
              </button>
            )}
            
            {currentTool === 'draw' && (
              <div className="text-sm text-green-600 px-3 py-2">
                ✏️ Berühre die Karte und zeichne mit dem Finger
              </div>
            )}
            
            <button
              onClick={clearAllItems}
              className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
            >
              🗑️ Alles löschen
            </button>
          </div>
          
          <div className="text-xs text-gray-500 text-center mb-2">
            {currentTool === 'circle' && 'Kreise werden um die Kartenmitte erstellt'}
            {currentTool === 'line' && 'Linien werden um die Kartenmitte erstellt'}
            {currentTool === 'draw' && 'Freihand: Berühre und ziehe über die Karte'}
          </div>
          
          <div className="text-xs text-green-600 text-center">
            ✅ {drawnItems.length} Elemente gezeichnet • Zum Löschen einzelne Elemente anklicken
          </div>
        </div>
      </div>
    </div>
  );
}
