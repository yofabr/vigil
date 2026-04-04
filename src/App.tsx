import { Routes, Route } from "react-router-dom";
import { WorkspaceView, Settings, CreateWorkspace } from "./routes";
import { useRouteSync } from "./utils/routeSync";

export function App() {
  useRouteSync();

  return (
    <Routes>
      <Route path="/" element={<WorkspaceView />} />
      <Route path="/workspace/create" element={<CreateWorkspace />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
}

export default App;
