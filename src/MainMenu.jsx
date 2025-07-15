import { useState } from "react";
import Hider from "./Hider";
import Seeker from "./Seeker";

export default function MainMenu() {
  const [team, setTeam] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const goBackToMenu = () => {
    setTeam(null);
  };

  const resetEverything = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    // Hider-Daten zurücksetzen
    localStorage.removeItem("hiderInventory");
    localStorage.removeItem("maxInventorySize");
    
    // Seeker-Daten zurücksetzen
    localStorage.removeItem("usedCompareOptions");
    localStorage.removeItem("usedPrecisionWords");
    localStorage.removeItem("usedPhotoPrompts");
    localStorage.removeItem("usedMasseOptions");
    localStorage.removeItem("usedThermometerOptions");
    localStorage.removeItem("usedRadarOptions");
    
    setShowResetConfirm(false);
    setTeam(null); // Zurück zum Hauptmenü nach Reset
    
    // Seite neu laden um alle Komponenten zu resetten
    window.location.reload();
  };

  const cancelReset = () => {
    setShowResetConfirm(false);
  };

  if (!team) {
    return (
      <div className="max-w-md mx-auto p-4 text-center">
        <h1 className="text-xl font-bold mb-4">Hide & Seek App</h1>
        <h2 className="text-lg mb-6">Wähle dein Team</h2>
        
        <button
          className="btn m-2 p-3 border rounded bg-blue-500 text-white hover:bg-blue-600 w-32"
          onClick={() => setTeam("hider")}
        >
          Hider
        </button>
        
        <button
          className="btn m-2 p-3 border rounded bg-green-500 text-white hover:bg-green-600 w-32"
          onClick={() => setTeam("seeker")}
        >
          Seeker
        </button>

        <div className="mt-8 pt-4 border-t">
          <button
            onClick={resetEverything}
            className="btn p-2 border rounded bg-red-600 text-white hover:bg-red-700"
          >
            Komplett zurücksetzen
          </button>
          
          {showResetConfirm && (
            <div className="mt-4 p-4 border rounded bg-yellow-100">
              <p className="mb-3 font-semibold">
                Willst du wirklich alle Spieldaten zurücksetzen?
              </p>
              <p className="mb-4 text-sm text-gray-600">
                Dies löscht alle Hider-Karten und alle verwendeten Seeker-Fragen!
              </p>
              <button
                onClick={confirmReset}
                className="btn p-2 mr-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Ja, alles zurücksetzen
              </button>
              <button
                onClick={cancelReset}
                className="btn p-2 bg-gray-400 rounded hover:bg-gray-500"
              >
                Abbrechen
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (team === "hider") {
    return <Hider goBackToMenu={goBackToMenu} />;
  }

  return <Seeker goBackToMenu={goBackToMenu} />;
}
