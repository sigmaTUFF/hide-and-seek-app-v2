import { useEffect, useRef, useState } from 'react';

export default function ExclusionMap() {
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [drawnItems, setDrawnItems] = useState([]);
  const [currentColor, setCurrentColor] = useState('red');
  const [currentTool, setCurrentTool] = useState('none');
  const [circleRadius, setCircleRadius] = useState(0.5);
  const [isDrawingLine, setIsDrawingLine] = useState(false);
  const [lineStart, setLineStart] = useState(null);

  // Leaflet laden
  useEffect(() => {
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
      document.head.appendChild(cssLink);
    }

    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    } else {
      setMapLoaded(true);
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
        () => {
          setUserLocation({ lat: 49.1244, lng: 8.5985 });
        }
      );
    } else {
      setUserLocation({ lat: 49.1244, lng: 8.5985 });
    }
  }, []);

  // Karte initialisieren
  useEffect(() => {
    if (mapLoaded && userLocation && mapRef.current && !window.myMap) {
      initializeMap();
    }
  }, [mapLoaded, userLocation]);

  // Items rendern
  useEffect(() => {
    if (window.myMap && window.myLayerGroup) {
      renderAllItems();
    }
  }, [drawnItems]);

  const initializeMap = () => {
    const L = window.L;
    
    // Karte erstellen
    const map = L.map(mapRef.current).setView([userLocation.lat, userLocation.lng], 15);
    
    // Tiles hinzufügen
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Benutzer Position
    L.marker([userLocation.lat, userLocation.lng])
      .addTo(map)
      .bindPopup('📍 Deine Position')
      .openPopup();
    
    // Layer für gezeichnete Items
    window.myLayerGroup = L.layerGroup().addTo(map);
    window.myTempLayer = L.layerGroup().addTo(map);

    // Map Click Handler
    map.on('click', (e) => {
      console.log('Map clicked, current tool:', currentTool);
      handleMapClick(e.latlng);
    });

    window.myMap = map;
    renderAllItems();
  };

  const handleMapClick = (latlng) => {
    console.log('handleMapClick called with tool:', currentTool);
    
    if (currentTool === 'circle') {
      console.log('Adding circle');
      addCircle(latlng);
    } else if (currentTool === 'line') {
      console.log('Adding line');
      handleLineClick(latlng);
    }
  };

  const addCircle = (latlng) => {
    console.log('addCircle called');
    if (circleRadius <= 0) return;
    
    const newItem = {
      id: Date.now(),
      type: 'circle',
      color: currentColor,
      center: { lat: latlng.lat, lng: latlng.lng },
      radius: circleRadius,
      timestamp: new Date().toLocaleTimeString()
    };
    
    console.log('Adding new circle item:', newItem);
    setDrawnItems(prev => {
      const updated = [...prev, newItem];
      console.log('Updated items:', updated);
      return updated;
    });
    
    // Tool zurücksetzen
    setCurrentTool('none');
  };

  const handleLineClick = (latlng) => {
    if (!isDrawingLine) {
      setIsDrawingLine(true);
      setLineStart(latlng);
      
      const L = window.L;
      window.myTempLayer.clearLayers();
      L.circleMarker([latlng.lat, latlng.lng], {
        radius: 5,
        color: currentColor === 'red' ? '#ff0000' : '#0000ff',
        fillColor: currentColor === 'red' ? '#ff0000' : '#0000ff',
        fillOpacity: 0.8
      }).addTo(window.myTempLayer);
      
    } else {
      const start = lineStart;
      const end = latlng;
      
      const R = 6371000;
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
        start: { lat: start.lat, lng: start.lng },
        end: { lat: end.lat, lng: end.lng },
        distance: distance,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setDrawnItems(prev => [...prev, newItem]);
      
      // Reset
      setIsDrawingLine(false);
      setLineStart(null);
      setCurrentTool('none');
      window.myTempLayer.clearLayers();
    }
  };

  const renderAllItems = () => {
    const L = window.L;
    if (!window.myLayerGroup) return;
    
    console.log('Rendering items:', drawnItems);
    
    window.myLayerGroup.clearLayers();
    
    drawnItems.forEach(item => {
      let layer = null;
      const color = item.color === 'red' ? '#ff0000' : '#0000ff';
      const colorName = item.color === 'red' ? 'Rot (Ausschluss)' : 'Blau (Info)';
      
      if (item.type === 'circle') {
        layer = L.circle([item.center.lat, item.center.lng], {
          radius: item.radius * 1000,
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
            <button onclick="window.deleteItem(${item.id})" style="background: red; color: white; border: none; padding: 5px; border-radius: 3px; cursor: pointer; margin-top: 5px;">🗑️ Löschen</button>
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
            📏 Länge: <strong>${item.distance} m</strong><br>
            Erstellt: ${item.timestamp}<br>
            <button onclick="window.deleteItem(${item.id})" style="background: red; color: white; border: none; padding: 5px; border-radius: 3px; cursor: pointer; margin-top: 5px;">🗑️ Löschen</button>
          </div>
        `);
      }
      
      if (layer) {
        layer.addTo(window.myLayerGroup);
      }
    });
  };

  // Delete function
  useEffect(() => {
    window.deleteItem = (itemId) => {
      setDrawnItems(prev => prev.filter(item => item.id !== itemId));
    };
  }, []);

  const clearAllItems = () => {
    if (window.confirm('Alle markierten Bereiche löschen?')) {
      setDrawnItems([]);
      setCurrentTool('none');
      if (window.myTempLayer) {
        window.myTempLayer.clearLayers();
      }
      setIsDrawingLine(false);
      setLineStart(null);
    }
  };

  const getToolInstructions = () => {
    if (currentTool === 'none') {
      return 'Wähle ein Werkzeug aus den Buttons unten';
    } else if (currentTool === 'circle') {
      return 'Tippe auf die Karte um einen Kreis zu platzieren';
    } else if (currentTool === 'line') {
      if (isDrawingLine) {
        return 'Tippe auf den Endpunkt der Linie';
      }
      return 'Tippe auf die Karte für den Startpunkt der Linie';
    }
    return '';
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
          {/* Debug Info */}
          <div className="text-xs text-gray-500 mb-2 text-center">
            Debug: Tool = {currentTool} | Items = {drawnItems.length}
          </div>

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
              onClick={() => {
                console.log('Circle tool selected');
                setCurrentTool('circle');
                setIsDrawingLine(false);
                setLineStart(null);
                if (window.myTempLayer) window.myTempLayer.clearLayers();
              }}
              className={`px-3 py-2 rounded text-sm ${
                currentTool === 'circle' ? 'bg-green-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              🟢 Kreis
            </button>
            <button
              onClick={() => {
                console.log('Line tool selected');
                setCurrentTool('line');
                setIsDrawingLine(false);
                setLineStart(null);
                if (window.myTempLayer) window.myTempLayer.clearLayers();
              }}
              className={`px-3 py-2 rounded text-sm ${
                currentTool === 'line' ? 'bg-green-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              📏 Linie
            </button>
            {currentTool !== 'none' && (
              <button
                onClick={() => {
                  setCurrentTool('none');
                  setIsDrawingLine(false);
                  setLineStart(null);
                  if (window.myTempLayer) window.myTempLayer.clearLayers();
                }}
                className="px-3 py-2 rounded text-sm bg-gray-400 text-white hover:bg-gray-500"
              >
                ❌ Abbrechen
              </button>
            )}
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

          {/* Instruktionen */}
          <div className="text-sm text-center mb-3 p-2 bg-blue-50 rounded">
            💡 {getToolInstructions()}
          </div>

          {/* Löschen Button */}
          <div className="flex justify-center mb-3">
            <button
              onClick={clearAllItems}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
              🗑️ Alles löschen
            </button>
          </div>
          
          <div className="text-xs text-green-600 text-center">
            ✅ {drawnItems.length} Elemente gezeichnet • Zum Löschen einzelne Elemente anklicken
            {isDrawingLine && ' • 📍 Wähle jetzt den Endpunkt'}
          </div>
        </div>
      </div>
    </div>
  );
}
