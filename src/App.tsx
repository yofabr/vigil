import { Routes, Route } from "react-router-dom";
import { WorkspaceView, Settings, CreateWorkspace } from "./routes";
import { useRouteSync } from "./utils/routeSync";
import { TitleBar } from "./components/TitleBar";

export function App() {
  useRouteSync();

  return (
    <div className="h-full flex flex-col bg-bg">
      <TitleBar />
      <div className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<WorkspaceView />} />
          <Route path="/workspace/create" element={<CreateWorkspace />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
