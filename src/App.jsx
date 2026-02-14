import { useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";

import { ThemeProvider } from "./context/ThemeContext";
import ThemeToggle from "./components/ThemeToggle";

import TeamManager from "./screens/TeamManager";
import TeamEditor from "./screens/TeamEditor";
import GameScreen from "./screens/GameScreen";
import GameSummary from "./screens/GameSummary";
import GameHistory from "./screens/GameHistory";
import SeasonSummary from "./screens/SeasonSummary";

export default function App() {
  const [screen, setScreen] = useState("manager");
  const [selectedTeam, setSelectedTeam] = useState(null);

  const screens = {
    manager: (
      <TeamManager
        setScreen={setScreen}
        setSelectedTeam={setSelectedTeam}
      />
    ),
    editor: (
      <TeamEditor
        selectedTeam={selectedTeam}
        setScreen={setScreen}
      />
    ),
    game: (
      <GameScreen
        selectedTeam={selectedTeam}
        setScreen={setScreen}
      />
    ),
    summary: <GameSummary setScreen={setScreen} selectedTeam={selectedTeam} />,
    history: (
      <GameHistory selectedTeam={selectedTeam} setScreen={setScreen} />
    ),
    season: ( // ← ADD THIS ENTRY
      <SeasonSummary
        selectedTeam={selectedTeam}
        setScreen={setScreen}
      />
    ),
  };

  return (
    <ThemeProvider>
      <div
        className="fixed inset-0 w-full h-full overflow-y-auto
                   bg-white text-black
                   dark:bg-gray-900 dark:text-white"
      >
        <header className="w-full p-4 flex justify-between items-center">
          <div className="text-xl font-bold">Futsal Coach</div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </header>
        <AnimatePresence mode="wait">
          <Motion.main
            as="main"
            key={screen}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            id="app-main"
            role="main"
            className="w-full h-full"
          >
            {screens[screen] || <div>Screen not found</div>}
          </Motion.main>
        </AnimatePresence>
      </div>
    </ThemeProvider>
  );
}