import React from "react";
import ReactDOM from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import App from "./App";
import "./index.css";

declare global {
  interface Window {
    VIGIL_DEFAULT_PATH?: string;
  }
}

async function init() {
  if (window.__TAURI__) {
    try {
      const cliPath = await invoke<string | null>("get_cli_args");
      if (cliPath) {
        window.VIGIL_DEFAULT_PATH = cliPath;
      }
    } catch (e) {
      console.error("Failed to get CLI args:", e);
    }
  }

  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <MemoryRouter>
        <App />
      </MemoryRouter>
    </React.StrictMode>,
  );
}

init();
