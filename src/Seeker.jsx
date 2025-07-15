import { useState, useEffect } from "react";

const compareOptions = [
  "Spielplatz",
  "Bahnhof",
  "Bushaltestelle",
  "Sportplatz",
  "Museum",
  "Rathaus",
  "Kirche",
  "Apotheke",
  "Restaurant",
  "Lebensmittelladen",
  "Arztpraxis",
  "Schule",
  "Kindergarten",
  "See",
];

const precisionRanges = ["500m", "1km", "2km", "3km"];

const photoPrompts = [
  "dem nächsten Baum (ganzer Baum)",
  "dem Himmel",
  "dir",
  "der größten Struktur",
  "dem nächsten Gebäude",
  "der nächsten Straße",
];

const masseOptions = [
  "Spielplatz",
  "Bahnhof",
  "Bushaltestelle",
  "Sportplatz",
  "Museum",
  "Rathaus",
  "Kirche",
  "Apotheke",
  "Restaurant",
  "Lebensmittelladen",
  "Arztpraxis",
  "Schule",
  "Kindergarten",
  "See",
];

const thermometerOptions = ["100m", "200m", "300m", "500m", "750m", "1km"];

const radarOptions = ["100m", "250m", "500m", "1km", "2km", "3km"];

export default function Seeker({ goBackToMenu }) {
  const [view, setView] = useState("menu"); // menu, fragen, notizen, vergleiche, praezision, fotos, masse

  // Vergleichskategorie
  const [usedCompareOptions, setUsedCompareOptions] = useState(() => {
    return JSON.parse(localStorage.getItem("usedCompareOptions")) || [];
  });
  const [selectedCompareCard, setSelectedCompareCard] = useState(null);
  const [pendingCompareOption, setPendingCompareOption] = useState(null);

  // Präzision
  const [usedPrecisionWords, setUsedPrecisionWords] = useState(() => {
    return JSON.parse(localStorage.getItem("usedPrecisionWords")) || [];
  });
  const [selectedPrecisionCard, setSelectedPrecisionCard] = useState(null);
  const [pendingPrecisionWord, setPendingPrecisionWord] = useState(null);
  const [selectedPrecisionRange, setSelectedPrecisionRange] = useState(precisionRanges[0]);

  // Fotos
  const [usedPhotoPrompts, setUsedPhotoPrompts] = useState(() => {
    return JSON.parse(localStorage.getItem("usedPhotoPrompts")) || [];
  });
  const [selectedPhotoCard, setSelectedPhotoCard] = useState(null);
  const [pendingPhotoPrompt, setPendingPhotoPrompt] = useState(null);

  // Maße
  const [usedMasseOptions, setUsedMasseOptions] = useState(() => {
    return JSON.parse(localStorage.getItem("usedMasseOptions")) || [];
  });
  const [selectedMasseCard, setSelectedMasseCard] = useState(null);
  const [pendingMasseOption, setPendingMasseOption] = useState(null);
  const [distanceInput, setDistanceInput] = useState(""); // Eingabe für Entfernung

  const [usedThermometerOptions, setUsedThermometerOptions] = useState(() => {
  return JSON.parse(localStorage.getItem("usedThermometerOptions")) || [];
});
const [selectedThermometerCard, setSelectedThermometerCard] = useState(null);
const [pendingThermometerOption, setPendingThermometerOption] = useState(null);

  const [usedRadarOptions, setUsedRadarOptions] = useState(() => {
  return JSON.parse(localStorage.getItem("usedRadarOptions")) || [];
});
const [selectedRadarCard, setSelectedRadarCard] = useState(null);
const [pendingRadarOption, setPendingRadarOption] = useState(null);



  // Speicher localStorage Updates
  useEffect(() => {
    localStorage.setItem("usedCompareOptions", JSON.stringify(usedCompareOptions));
  }, [usedCompareOptions]);

  useEffect(() => {
    localStorage.setItem("usedPrecisionWords", JSON.stringify(usedPrecisionWords));
  }, [usedPrecisionWords]);

  useEffect(() => {
    localStorage.setItem("usedPhotoPrompts", JSON.stringify(usedPhotoPrompts));
  }, [usedPhotoPrompts]);

  useEffect(() => {
    localStorage.setItem("usedMasseOptions", JSON.stringify(usedMasseOptions));
  }, [usedMasseOptions]);

  useEffect(() => {
  localStorage.setItem("usedThermometerOptions", JSON.stringify(usedThermometerOptions));
}, [usedThermometerOptions]);

  useEffect(() => {
  localStorage.setItem("usedRadarOptions", JSON.stringify(usedRadarOptions));
}, [usedRadarOptions]);

  // Vergleich Anfrage
  const requestUseCompareOption = (option) => {
    setPendingCompareOption(option);
  };

  const confirmUseCompareOption = () => {
    if (!pendingCompareOption) return;
    setSelectedCompareCard(
      `Ist dein nächster ${pendingCompareOption.toUpperCase()} derselbe wie mein nächster ${pendingCompareOption.toUpperCase()}?`
    );
    setUsedCompareOptions((prev) => [...prev, pendingCompareOption]);
    setPendingCompareOption(null);
  };

  const cancelUseCompareOption = () => {
    setPendingCompareOption(null);
  };

  // Präzision Anfrage
  const requestUsePrecisionWord = (word) => {
    setPendingPrecisionWord(word);
  };

  const confirmUsePrecisionWord = () => {
    if (!pendingPrecisionWord) return;
    setSelectedPrecisionCard(
      `Von allen ${pendingPrecisionWord.toUpperCase()} in ${selectedPrecisionRange} Umkreis: welchem bist du am nächsten?`
    );
    setUsedPrecisionWords((prev) => [...prev, pendingPrecisionWord]);
    setPendingPrecisionWord(null);
  };

  const cancelUsePrecisionWord = () => {
    setPendingPrecisionWord(null);
  };

  // Fotos Anfrage
  const requestUsePhotoPrompt = (prompt) => {
    setPendingPhotoPrompt(prompt);
  };

  const confirmUsePhotoPrompt = () => {
    if (!pendingPhotoPrompt) return;
    setSelectedPhotoCard(`Schick mir ein Foto von ${pendingPhotoPrompt}, das du von deinem Standort aus erkennen kannst.`);
    setUsedPhotoPrompts((prev) => [...prev, pendingPhotoPrompt]);
    setPendingPhotoPrompt(null);
  };

  const cancelUsePhotoPrompt = () => {
    setPendingPhotoPrompt(null);
  };

  // Maße Anfrage
  const requestUseMasseOption = (option) => {
    setPendingMasseOption(option);
    setDistanceInput(""); // Eingabe zurücksetzen bei neuem prompt
  };

  const confirmUseMasseOption = () => {
    if (!pendingMasseOption) return;
    if (!distanceInput.trim()) {
      alert("Bitte gib eine Entfernung ein!");
      return;
    }
    setSelectedMasseCard(
      `Bist du näher an ${pendingMasseOption.toUpperCase()} als ich? (meine Entfernung = ${distanceInput.trim()})`
    );
    setUsedMasseOptions((prev) => [...prev, pendingMasseOption]);
    setPendingMasseOption(null);
    setDistanceInput("");
  };

  const cancelUseMasseOption = () => {
    setPendingMasseOption(null);
    setDistanceInput("");
  };

  // Thermometer Anfrage
  const requestUseThermometerOption = (option) => {
    setPendingThermometerOption(option);
  };

  const confirmUseThermometerOption = () => {
    if (!pendingThermometerOption) return;
    setSelectedThermometerCard(
      `Ich bin ${pendingThermometerOption} gelaufen. Bin ich jetzt näher (wärmer) oder weiter weg (kälter)?`
    );
    setUsedThermometerOptions((prev) => [...prev, pendingThermometerOption]);
    setPendingThermometerOption(null);
  };

  const cancelUseThermometerOption = () => {
    setPendingThermometerOption(null);
  };

  // Radar Anfrage
const requestUseRadarOption = (option) => {
  setPendingRadarOption(option);
};

const confirmUseRadarOption = () => {
  if (!pendingRadarOption) return;
  setSelectedRadarCard(
    `Bist du innerhalb von ${pendingRadarOption} von mir?`
  );
  setUsedRadarOptions((prev) => [...prev, pendingRadarOption]);
  setPendingRadarOption(null);
};

const cancelUseRadarOption = () => {
  setPendingRadarOption(null);
};



  // Disable helpers
  const isCompareUsed = (option) => usedCompareOptions.includes(option);
  const isPrecisionWordUsed = (word) => usedPrecisionWords.includes(word);
  const isPhotoPromptUsed = (prompt) => usedPhotoPrompts.includes(prompt);
  const isMasseUsed = (option) => usedMasseOptions.includes(option);
  const isThermometerUsed = (option) => usedThermometerOptions.includes(option);
  const isRadarUsed = (option) => usedRadarOptions.includes(option);


  return (
    <div className="max-w-md mx-auto p-4 text-center min-h-screen flex flex-col">
      {/* Hauptmenü */}
        {view === "menu" && (
          <>
            <button
              onClick={goBackToMenu}
              className="btn p-2 mb-4 bg-gray-300 rounded hover:bg-gray-400 self-start"
            >
              ← Zurück zum Hauptmenü
            </button>
            <h1 className="text-2xl font-bold mb-6">Seeker Hauptmenü</h1>
            <button
            onClick={() => setView("fragen")}
            className="btn p-2 mb-4 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Fragen
          </button>
<button
            onClick={() => setView("notizen")}
            className="btn p-2 mb-4 bg-gray-400 text-white rounded cursor-not-allowed"
            disabled
            title="Notizen werden aktuell nicht unterstützt"
          >
            Notizen (bald)
          </button>
        </>
      )}

      {/* Fragen Auswahl */}
      {view === "fragen" && (
        <>
          <button
            onClick={() => setView("menu")}
            className="btn p-2 mb-6 bg-gray-300 rounded hover:bg-gray-400 self-start"
          >
            &larr; Zurück zur Auswahl
          </button>

          <h2 className="text-xl font-semibold mb-4">Fragen-Kategorien</h2>

          <button
            onClick={() => setView("vergleiche")}
            className="btn p-3 mb-2 w-full bg-green-600 text-white rounded hover:bg-green-700"
          >
            Vergleiche
          </button>

          <button
            onClick={() => setView("praezision")}
            className="btn p-3 mb-2 w-full bg-green-600 text-white rounded hover:bg-green-700"
          >
            Präzisionsfrage
          </button>

          <button
            onClick={() => setView("fotos")}
            className="btn p-3 mb-2 w-full bg-green-600 text-white rounded hover:bg-green-700"
          >
            Fotos
          </button>

          <button
            onClick={() => setView("masse")}
            className="btn p-3 mb-2 w-full bg-green-600 text-white rounded hover:bg-green-700"
          >
            Maße
          </button>

          <button
            onClick={() => setView("thermometer")}
            className="btn p-3 mb-2 w-full bg-green-600 text-white rounded hover:bg-green-700"
          >
            Thermometer
          </button>

          <button
            onClick={() => setView("radar")}
            className="btn p-3 mb-2 w-full bg-green-600 text-white rounded hover:bg-green-700"
          >
            Radar
          </button>
        </>
      )}

      {/* Vergleiche */}
      {view === "vergleiche" && (
        <>
          <button
            onClick={() => {
              setView("fragen");
              setSelectedCompareCard(null);
              setPendingCompareOption(null);
            }}
            className="btn p-2 mb-4 bg-gray-300 rounded hover:bg-gray-400 self-start"
          >
            &larr; Zurück zu Fragen
          </button>

          <h2 className="text-xl font-semibold mb-2">Vergleiche</h2>
          <p className="mb-1 font-semibold">Preis: Der Verstecker darf 2 Karten ziehen</p>
          <p className="mb-4 italic">Beispiel: Ist dein nächster ___ derselbe wie mein nächster ___?</p>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {compareOptions.map((option) => (
              <button
                key={option}
                onClick={() => requestUseCompareOption(option)}
                disabled={isCompareUsed(option) || pendingCompareOption !== null}
                className={`p-2 rounded border ${
                  isCompareUsed(option)
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : pendingCompareOption !== null
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          {/* Bestätigung für Vergleich */}
          {pendingCompareOption && (
            <div className="mb-4 p-3 border rounded bg-yellow-100 max-w-xl mx-auto">
              <p className="mb-2 font-semibold">Bestätige die Verwendung der Frage:</p>
              <p className="mb-4 font-bold">
                Ist dein nächster {pendingCompareOption.toUpperCase()} derselbe wie mein nächster {pendingCompareOption.toUpperCase()}?
              </p>
              <button
                onClick={confirmUseCompareOption}
                className="btn p-2 mr-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Bestätigen
              </button>
              <button
                onClick={cancelUseCompareOption}
                className="btn p-2 bg-gray-400 rounded hover:bg-gray-500"
              >
                Abbrechen
              </button>
            </div>
          )}

          {selectedCompareCard && (
            <div className="border rounded p-4 bg-white shadow text-lg font-bold max-w-xl mx-auto">
              {selectedCompareCard}
            </div>
          )}
        </>
      )}

      {/* Präzision */}
      {view === "praezision" && (
        <>
          <button
            onClick={() => {
              setView("fragen");
              setSelectedPrecisionCard(null);
              setPendingPrecisionWord(null);
            }}
            className="btn p-2 mb-4 bg-gray-300 rounded hover:bg-gray-400 self-start"
          >
            &larr; Zurück zu Fragen
          </button>

          <h2 className="text-xl font-semibold mb-2">Präzisionsfrage</h2>
          <p className="mb-1 font-semibold">Preis: Der Verstecker darf 1 Karte ziehen</p>
          <p className="mb-4 italic">Beispiel: Von allen ___ in 500m Umkreis: welchem bist du am nächsten?</p>

          <div className="mb-4 flex justify-center gap-4 flex-wrap">
            {precisionRanges.map((range) => (
              <button
                key={range}
                onClick={() => setSelectedPrecisionRange(range)}
                className={`px-3 py-1 rounded border ${
                  selectedPrecisionRange === range
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4 max-w-xl mx-auto">
            {["Spielplatz", "Bahnhof", "Bushaltestelle", "Sportplatz"].map((word) => (
              <button
                key={word}
                onClick={() => requestUsePrecisionWord(word)}
                disabled={isPrecisionWordUsed(word) || pendingPrecisionWord !== null}
                className={`p-2 rounded border ${
                  isPrecisionWordUsed(word)
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : pendingPrecisionWord !== null
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                {word}
              </button>
            ))}
          </div>

          {/* Bestätigung für Präzisionsfrage */}
          {pendingPrecisionWord && (
            <div className="mb-4 p-3 border rounded bg-yellow-100 max-w-xl mx-auto">
              <p className="mb-2 font-semibold">Bestätige die Verwendung der Frage:</p>
              <p className="mb-4 font-bold">
                Von allen {pendingPrecisionWord.toUpperCase()} in {selectedPrecisionRange} Umkreis: welchem bist du am nächsten?
              </p>
              <button
                onClick={confirmUsePrecisionWord}
                className="btn p-2 mr-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Bestätigen
              </button>
              <button
                onClick={cancelUsePrecisionWord}
                className="btn p-2 bg-gray-400 rounded hover:bg-gray-500"
              >
                Abbrechen
              </button>
            </div>
          )}

          {selectedPrecisionCard && (
            <div className="border rounded p-4 bg-white shadow text-lg font-bold max-w-xl mx-auto">
              {selectedPrecisionCard}
            </div>
          )}
        </>
      )}

      {/* Fotos */}
      {view === "fotos" && (
        <>
          <button
            onClick={() => {
              setView("fragen");
              setSelectedPhotoCard(null);
              setPendingPhotoPrompt(null);
            }}
            className="btn p-2 mb-4 bg-gray-300 rounded hover:bg-gray-400 self-start"
          >
            &larr; Zurück zu Fragen
          </button>

          <h2 className="text-xl font-semibold mb-2">Fotos</h2>
          <p className="mb-1 font-semibold">Preis: Der Verstecker darf 1 Karte ziehen</p>
          <p className="mb-4 italic">
            Schick mir ein Foto von ___, das du von deinem Standort aus erkennen kannst.
          </p>

          <div className="grid grid-cols-1 gap-2 mb-4 max-w-xl mx-auto">
            {photoPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => requestUsePhotoPrompt(prompt)}
                disabled={isPhotoPromptUsed(prompt) || pendingPhotoPrompt !== null}
                className={`p-2 rounded border ${
                  isPhotoPromptUsed(prompt)
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : pendingPhotoPrompt !== null
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Bestätigung für Fotos */}
          {pendingPhotoPrompt && (
            <div className="mb-4 p-3 border rounded bg-yellow-100 max-w-xl mx-auto">
              <p className="mb-2 font-semibold">Bestätige die Verwendung der Frage:</p>
              <p className="mb-4 font-bold">
                Schick mir ein Foto von {pendingPhotoPrompt}, das du von deinem Standort aus erkennen kannst.
              </p>
              <button
                onClick={confirmUsePhotoPrompt}
                className="btn p-2 mr-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Bestätigen
              </button>
              <button
                onClick={cancelUsePhotoPrompt}
                className="btn p-2 bg-gray-400 rounded hover:bg-gray-500"
              >
                Abbrechen
              </button>
            </div>
          )}

          {selectedPhotoCard && (
            <div className="border rounded p-4 bg-white shadow text-lg font-bold max-w-xl mx-auto">
              {selectedPhotoCard}
            </div>
          )}
        </>
      )}

      {/* Maße */}
      {view === "masse" && (
        <>
          <button
            onClick={() => {
              setView("fragen");
              setSelectedMasseCard(null);
              setPendingMasseOption(null);
              setDistanceInput("");
            }}
            className="btn p-2 mb-4 bg-gray-300 rounded hover:bg-gray-400 self-start"
          >
            &larr; Zurück zu Fragen
          </button>

          <h2 className="text-xl font-semibold mb-2">Maße</h2>
          <p className="mb-1 font-semibold">Preis: Der Verstecker darf 2 Karten ziehen</p>
          <p className="mb-4 italic">
            Bist du näher an ___ als ich? (meine Entfernung = Eingabefeld)
          </p>

          <div className="grid grid-cols-2 gap-2 mb-4 max-w-xl mx-auto">
            {masseOptions.map((option) => (
              <button
                key={option}
                onClick={() => requestUseMasseOption(option)}
                disabled={isMasseUsed(option) || pendingMasseOption !== null}
                className={`p-2 rounded border ${
                  isMasseUsed(option)
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : pendingMasseOption !== null
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          {/* Eingabefeld und Bestätigung */}
          {pendingMasseOption && (
            <div className="mb-4 p-3 border rounded bg-yellow-100 max-w-xl mx-auto text-left">
              <p className="mb-2 font-semibold">Bestätige die Verwendung der Frage:</p>
              <p className="mb-2 font-bold">
                Bist du näher an {pendingMasseOption.toUpperCase()} als ich? (meine Entfernung = <input
                  type="text"
                  value={distanceInput}
                  onChange={(e) => setDistanceInput(e.target.value)}
                  placeholder="z.B. 300m"
                  className="border p-1 rounded w-24 ml-1"
                />)
              </p>
              <button
                onClick={confirmUseMasseOption}
                className="btn p-2 mr-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Bestätigen
              </button>
              <button
                onClick={cancelUseMasseOption}
                className="btn p-2 bg-gray-400 rounded hover:bg-gray-500"
              >
                Abbrechen
              </button>
            </div>
          )}

          {selectedMasseCard && (
            <div className="border rounded p-4 bg-white shadow text-lg font-bold max-w-xl mx-auto">
              {selectedMasseCard}
            </div>
          )}
        </>
      )}

      {/* Thermometer */}
      {view === "thermometer" && (
        <>
          <button
            onClick={() => {
              setView("fragen");
              setSelectedThermometerCard(null);
              setPendingThermometerOption(null);
            }}
            className="btn p-2 mb-4 bg-gray-300 rounded hover:bg-gray-400 self-start"
          >
            &larr; Zurück zu Fragen
          </button>

          <h2 className="text-xl font-semibold mb-2">Thermometer</h2>
          <p className="mb-1 font-semibold">Preis: Der Verstecker darf 1 Karte ziehen</p>
          <p className="mb-4 italic">
            Ich bin ___ gelaufen. Bin ich jetzt näher (wärmer) oder weiter weg (kälter)?
          </p>

          <div className="grid grid-cols-2 gap-2 mb-4 max-w-xl mx-auto">
            {thermometerOptions.map((option) => (
              <button
                key={option}
                onClick={() => requestUseThermometerOption(option)}
                disabled={isThermometerUsed(option) || pendingThermometerOption !== null}
                className={`p-2 rounded border ${
                  isThermometerUsed(option)
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : pendingThermometerOption !== null
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

    {/* Bestätigung für Thermometer */}
    {pendingThermometerOption && (
      <div className="mb-4 p-3 border rounded bg-yellow-100 max-w-xl mx-auto">
        <p className="mb-2 font-semibold">Bestätige die Verwendung der Frage:</p>
        <p className="mb-4 font-bold">
          Ich bin {pendingThermometerOption} gelaufen. Bin ich jetzt näher (wärmer) oder weiter weg (kälter)?
        </p>
        <button
          onClick={confirmUseThermometerOption}
          className="btn p-2 mr-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Bestätigen
        </button>
        <button
          onClick={cancelUseThermometerOption}
          className="btn p-2 bg-gray-400 rounded hover:bg-gray-500"
        >
          Abbrechen
        </button>
      </div>
    )}

    {selectedThermometerCard && (
      <div className="border rounded p-4 bg-white shadow text-lg font-bold max-w-xl mx-auto">
        {selectedThermometerCard}
      </div>
    )}
  </>
)}
      {/* Radar */}
{view === "radar" && (
  <>
    <button
      onClick={() => {
        setView("fragen");
        setSelectedRadarCard(null);
        setPendingRadarOption(null);
      }}
      className="btn p-2 mb-4 bg-gray-300 rounded hover:bg-gray-400 self-start"
    >
      &larr; Zurück zu Fragen
    </button>

    <h2 className="text-xl font-semibold mb-2">Radar</h2>
    <p className="mb-1 font-semibold">Preis: Der Verstecker darf 2 Karten ziehen</p>
    <p className="mb-4 italic">
      Bist du innerhalb von ___ von mir?
    </p>

    <div className="grid grid-cols-2 gap-2 mb-4 max-w-xl mx-auto">
      {radarOptions.map((option) => (
        <button
          key={option}
          onClick={() => requestUseRadarOption(option)}
          disabled={isRadarUsed(option) || pendingRadarOption !== null}
          className={`p-2 rounded border ${
            isRadarUsed(option)
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : pendingRadarOption !== null
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          {option}
        </button>
      ))}
    </div>

    {/* Bestätigung für Radar */}
    {pendingRadarOption && (
      <div className="mb-4 p-3 border rounded bg-yellow-100 max-w-xl mx-auto">
        <p className="mb-2 font-semibold">Bestätige die Verwendung der Frage:</p>
        <p className="mb-4 font-bold">
          Bist du innerhalb von {pendingRadarOption} von mir?
        </p>
        <button
          onClick={confirmUseRadarOption}
          className="btn p-2 mr-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Bestätigen
        </button>
        <button
          onClick={cancelUseRadarOption}
          className="btn p-2 bg-gray-400 rounded hover:bg-gray-500"
        >
          Abbrechen
        </button>
      </div>
    )}

    {selectedRadarCard && (
      <div className="border rounded p-4 bg-white shadow text-lg font-bold max-w-xl mx-auto">
        {selectedRadarCard}
      </div>
    )}
  </>
)}
      

      {/* Notizen (noch nicht implementiert) */}
      {view === "notizen" && (
        <>
          <button
            onClick={() => setView("menu")}
            className="btn p-2 mb-4 bg-gray-300 rounded hover:bg-gray-400 self-start"
          >
            &larr; Zurück zum Menü
          </button>
          <p>Notizen werden aktuell nicht unterstützt.</p>
        </>
      )}
    </div>
  );
}
