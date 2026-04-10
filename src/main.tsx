import React from "react";
import ReactDOM from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { listen } from "@tauri-apps/api/event";
import App from "./App";
import "./index.css";

declare global {
  interface Window {
    VIGIL_DEFAULT_PATH?: string;
  }
}

async function init() {
  if (window.__TAURI__) {
    await listen<{ defaultPath: string }>("cli-args", (event) => {
      window.VIGIL_DEFAULT_PATH = event.payload.defaultPath;
    });
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
