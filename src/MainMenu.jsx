import { useState } from "react";
import Hider from "./Hider";
import Seeker from "./Seeker";

export default function MainMenu() {
  const [team, setTeam] = useState(null);

  if (!team) {
    return (
      <div className="max-w-md mx-auto p-4 text-center">
        <h1 className="text-xl font-bold mb-4">Wähle dein Team</h1>
        <button
          className="btn m-2 p-2 border rounded bg-blue-500 text-white"
          onClick={() => setTeam("hider")}
        >
          Hider
        </button>
        <button
          className="btn m-2 p-2 border rounded bg-green-500 text-white"
          onClick={() => setTeam("seeker")}
        >
          Seeker
        </button>
      </div>
    );
  }

  if (team === "hider") {
    return <Hider />;
  }

  return <Seeker />;
}
