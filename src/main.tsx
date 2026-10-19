import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { PlayerProvider } from "./store/PlayerContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PlayerProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </PlayerProvider>
  </StrictMode>,
);
