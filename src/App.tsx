import { Routes, Route } from "react-router-dom";
import { WorkspaceView, Settings } from "./routes";
import { useRouteSync } from "./utils/routeSync";

export function App() {
  useRouteSync();

  return (
    <Routes>
      <Route path="/" element={<WorkspaceView />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
}

export default App;
