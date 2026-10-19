import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { PlayerProvider, usePlayer } from "./store/PlayerContext";
import PageShell from "./components/PageShell";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import Game from "./pages/Game";
import MiniGames from "./pages/MiniGames";
import Olympiad from "./pages/Olympiad";
import Duel from "./pages/Duel";
import Shop from "./pages/Shop";
import Profile from "./pages/Profile";
import Room from "./pages/Room";
import Parent from "./pages/Parent";
import Assistant from "./pages/Assistant";

function Shell({ children }: { children: ReactNode }) {
  const { player } = usePlayer();
  if (!player) return <Navigate to="/onboarding" replace />;
  return <PageShell>{children}</PageShell>;
}

export default function App() {
  return (
    <PlayerProvider>
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/" element={<Shell><Home /></Shell>} />
        <Route path="/game/:topic/:difficulty" element={<Shell><Game /></Shell>} />
        <Route path="/daily" element={<Navigate to="/game/mixed/medium?daily=1" replace />} />
        <Route path="/minigames" element={<Shell><MiniGames /></Shell>} />
        <Route path="/olympiad" element={<Shell><Olympiad /></Shell>} />
        <Route path="/duel" element={<Shell><Duel /></Shell>} />
        <Route path="/shop" element={<Shell><Shop /></Shell>} />
        <Route path="/profile" element={<Shell><Profile /></Shell>} />
        <Route path="/room" element={<Shell><Room /></Shell>} />
        <Route path="/parent" element={<Parent />} />
        <Route path="/assistant" element={<Shell><Assistant /></Shell>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PlayerProvider>
  );
}
