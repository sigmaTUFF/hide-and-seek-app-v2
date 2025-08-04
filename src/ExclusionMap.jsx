import { useEffect, useRef, useState } from 'react';

export default function ExclusionMap() {
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [drawnItems, setDrawnItems] = useState([]);
  const [currentColor, setCurrentColor] = useState('red');
  const [currentTool, setCurrentTool] = useState('none'); // Startet mit keinem Tool
  const [circleRadius, setCircleRadius] = useState(0.5); // in km
  const [isDrawingLine, setIsDrawingLine] = useState(false);
  const [lineStart, setLineStart] = useState(null);
  const [isDrawingFreehand, setIsDrawingFreehand] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [freehandMode, setFreehandMode] = useState(false);

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

    // Gespeicherte Items laden (verwende state statt localStorage)
    const initialItems = [];
    setDrawnItems(initialItems);
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
    if (mapLoaded && userLocation && mapRef.current && !mapRef.current._leaflet_id) {
      initializeMap();
    }
  }, [mapLoaded, userLocation]);

  // Items neu rendern wenn sich drawnItems ändert
  useEffect(() => {
    if (mapRef.current && mapRef.current._leaflet_id && window.seekerLayerGroup) {
      renderAllItems();
    }
  }, [drawnItems]);

  const initializeMap = () => {
    const L = window.L;
    
    // Alte Karte cleanup falls vorhanden
    if (mapRef.current._leaflet_id) {
      mapRef.current._leaflet.remove();
    }
    
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
    
    // Layer Groups für gezeichnete Items und temporäre Elemente
    window.seekerLayerGroup = L.layerGroup().addTo(map);
    window.seekerTempLayer = L.layerGroup().addTo(map);

    // Klick-Events für die verschiedenen Tools
    map.on('click', (e) => {
      handleMapClick(e.latlng);
    });

    // Touch/Mouse Events für Freihand-Zeichnen
    let drawing = false;
    let path = [];
    let currentPolyline = null;

    const startDrawing = (e) => {
      if (currentTool === 'draw' && freehandMode) {
        drawing = true;
        setIsDrawingFreehand(true);
        
        // Koordinaten aus Event extrahieren
        const latlng = e.latlng || map.mouseEventToLatLng(e.originalEvent);
        path = [latlng];
        setCurrentPath([latlng]);
        
        // Temporäre Linie während des Zeichnens
        currentPolyline = L.polyline(path, {
          color: currentColor === 'red' ? '#ff0000' : '#0000ff',
          weight: 3,
          opacity: 0.8
        }).addTo(window.seekerTempLayer);
        
        // Verhindere Karten-Bewegung während des Zeichnens
        map.dragging.disable();
        map.touchZoom.disable();
        map.doubleClickZoom.disable();
        map.scrollWheelZoom.disable();
        map.boxZoom.disable();
        map.keyboard.disable();
        
        e.originalEvent?.preventDefault();
      }
    };

    const continueDrawing = (e) => {
      if (drawing && currentTool === 'draw' && freehandMode) {
        const latlng = e.latlng || map.mouseEventToLatLng(e.originalEvent);
        path.push(latlng);
        setCurrentPath([...path]);
        if (currentPolyline) {
          currentPolyline.setLatLngs(path);
        }
        e.originalEvent?.preventDefault();
      }
    };

    const endDrawing = (e) => {
      if (drawing && currentTool === 'draw' && freehandMode) {
        drawing = false;
        setIsDrawingFreehand(false);
        
        // Karten-Interaktion wieder aktivieren
        map.dragging.enable();
        map.touchZoom.enable();
        map.doubleClickZoom.enable();
        map.scrollWheelZoom.enable();
        map.boxZoom.enable();
        map.keyboard.enable();
        
        // Temporäre Linie entfernen
        window.seekerTempLayer.clearLayers();
        
        // Nur speichern wenn genug Punkte vorhanden
        if (path.length > 3) {
          const newItem = {
            id: Date.now(),
            type: 'freehand',
            color: currentColor,
            path: path.map(p => ({ lat: p.lat, lng: p.lng })),
            timestamp: new Date().toLocaleTimeString()
          };
          
          setDrawnItems(prev => [...prev, newItem]);
          
          // Tool zurücksetzen nach dem Freihand-Zeichnen
          setCurrentTool('none');
        }
        
        setCurrentPath([]);
        path = [];
        currentPolyline = null;
        e.originalEvent?.preventDefault();
      }
    };

    // Event Listeners
    map.on('mousedown', startDrawing);
    map.on('touchstart', startDrawing);
    map.on('mousemove', continueDrawing);
    map.on('touchmove', continueDrawing);
    map.on('mouseup', endDrawing);
    map.on('touchend', endDrawing);

    // Karte in ref speichern für cleanup
    mapRef.current._leaflet = map;
    
    renderAllItems();
  };

  const handleMapClick = (latlng) => {
    // Nicht reagieren wenn gerade freihand gezeichnet wird
    if (isDrawingFreehand || (currentTool === 'draw' && !freehandMode)) return;
    
    if (currentTool === 'circle') {
      addCircle(latlng);
    } else if (currentTool === 'line') {
      handleLineClick(latlng);
    }
    // Bei 'draw' wird über die Touch-Events gehandelt
  };

  const addCircle = (latlng) => {
    if (circleRadius <= 0) return;
    
    const newItem = {
      id: Date.now(),
      type: 'circle',
      color: currentColor,
      center: { lat: latlng.lat, lng: latlng.lng },
      radius: circleRadius,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setDrawnItems(prev => [...prev, newItem]);
    
    // Tool zurücksetzen nach dem Platzieren
    setCurrentTool('none');
  };

  const handleLineClick = (latlng) => {
    if (!isDrawingLine) {
      // Ersten Punkt setzen
      setIsDrawingLine(true);
      setLineStart(latlng);
      
      // Temporären Startpunkt anzeigen
      const L = window.L;
      window.seekerTempLayer.clearLayers();
      L.circleMarker([latlng.lat, latlng.lng], {
        radius: 5,
        color: currentColor === 'red' ? '#ff0000' : '#0000ff',
        fillColor: currentColor === 'red' ? '#ff0000' : '#0000ff',
        fillOpacity: 0.8
      }).addTo(window.seekerTempLayer);
      
    } else {
      // Zweiten Punkt setzen und Linie erstellen
      const start = lineStart;
      const end = latlng;
      
      // Distanz berechnen (Haversine Formel)
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
        start: { lat: start.lat, lng: start.lng },
        end: { lat: end.lat, lng: end.lng },
        distance: distance,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setDrawnItems(prev => [...prev, newItem]);
      
      // Tool zurücksetzen nach dem Zeichnen einer Linie
      setCurrentTool('none');
      
      // Reset
      setIsDrawingLine(false);
      setLineStart(null);
      window.seekerTempLayer.clearLayers();
    }
  };

  const renderAllItems = () => {
    const L = window.L;
    if (!window.seekerLayerGroup) return;
    
    // Alle Layer entfernen
    window.seekerLayerGroup.clearLayers();
    
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
            <button onclick="window.deleteItem(${item.id})" style="background: red; color: white; border: none; padding: 5px; border-radius: 3px; cursor: pointer; margin-top: 5px;">🗑️ Löschen</button>
          </div>
        `);
      }
      
      if (layer) {
        layer.addTo(window.seekerLayerGroup);
      }
    });
  };

  // Global delete function
  useEffect(() => {
    window.deleteItem = (itemId) => {
      setDrawnItems(prev => prev.filter(item => item.id !== itemId));
    };
  }, []);

  const clearAllItems = () => {
    if (window.confirm('Alle markierten Bereiche löschen?')) {
      setDrawnItems([]);
      if (window.seekerTempLayer) {
        window.seekerTempLayer.clearLayers();
      }
      setIsDrawingLine(false);
      setLineStart(null);
      setIsDrawingFreehand(false);
      setFreehandMode(false);
      setCurrentPath([]);
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
    } else if (currentTool === 'draw') {
      if (freehandMode) {
        return 'Berühre die Karte und zeichne mit dem Finger';
      } else {
        return 'Klicke "Freihand starten" um zu zeichnen';
      }
    }
    return '';
  };

  // Cleanup beim Unmount
  useEffect(() => {
    return () => {
      if (mapRef.current && mapRef.current._leaflet) {
        mapRef.current._leaflet.remove();
      }
    };
  }, []);

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
          style={{ 
            minHeight: '400px',
            touchAction: currentTool === 'draw' ? 'none' : 'auto'
          }}
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
              onClick={() => {
                setCurrentTool('circle');
                setIsDrawingLine(false);
                setLineStart(null);
                setFreehandMode(false);
                if (window.seekerTempLayer) window.seekerTempLayer.clearLayers();
              }}
              className={`px-3 py-2 rounded text-sm ${
                currentTool === 'circle' ? 'bg-green-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              🟢 Kreis
            </button>
            <button
              onClick={() => {
                setCurrentTool('line');
                setIsDrawingLine(false);
                setLineStart(null);
                setFreehandMode(false);
                if (window.seekerTempLayer) window.seekerTempLayer.clearLayers();
              }}
              className={`px-3 py-2 rounded text-sm ${
                currentTool === 'line' ? 'bg-green-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              📏 Linie
            </button>
            <button
              onClick={() => {
                setCurrentTool('draw');
                setIsDrawingLine(false);
                setLineStart(null);
                setFreehandMode(false);
                if (window.seekerTempLayer) window.seekerTempLayer.clearLayers();
              }}
              className={`px-3 py-2 rounded text-sm ${
                currentTool === 'draw' ? 'bg-green-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              ✏️ Freihand
            </button>
            {currentTool !== 'none' && (
              <button
                onClick={() => {
                  setCurrentTool('none');
                  setIsDrawingLine(false);
                  setLineStart(null);
                  setFreehandMode(false);
                  if (window.seekerTempLayer) window.seekerTempLayer.clearLayers();
                }}
                className="px-3 py-2 rounded text-sm bg-gray-400 text-white hover:bg-gray-500"
              >
                ❌ Abbrechen
              </button>
            )}
          </div>

          {/* Freihand Start/Stop Buttons */}
          {currentTool === 'draw' && (
            <div className="flex justify-center gap-2 mb-3">
              {!freehandMode ? (
                <button
                  onClick={() => setFreehandMode(true)}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                >
                  🎨 Freihand starten
                </button>
              ) : (
                <button
                  onClick={() => {
                    setFreehandMode(false);
                    setIsDrawingFreehand(false);
                    if (window.seekerTempLayer) window.seekerTempLayer.clearLayers();
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                >
                  ⏹️ Freihand beenden
                </button>
              )}
            </div>
          )}

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
