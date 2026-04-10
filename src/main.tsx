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
  let cliPath: string | null = null;
  let initialRoute = "/";

  if (window.__TAURI__) {
    try {
      initialRoute = await invoke<string>("get_initial_route");
      if (initialRoute === "/workspace/create") {
        cliPath = await invoke<string | null>("get_cli_args");
        if (cliPath) {
          window.VIGIL_DEFAULT_PATH = cliPath;
        }
      }
    } catch (e) {
      console.error("Failed to get CLI args:", e);
    }
  }

  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <MemoryRouter initialEntries={[initialRoute]}>
        <App />
      </MemoryRouter>
    </React.StrictMode>,
  );
}

init();
