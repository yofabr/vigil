import { Routes, Route, Navigate } from "react-router-dom";
import { TitleBar } from "./components/TitleBar";
import { AppLayout, WorkspaceView, SelectWorkspace, Settings, CreateWorkspace } from "./routes";
import { useRouteSync } from "./utils/routeSync";

export function App() {
  useRouteSync();

  return (
    <div className="h-full flex flex-col bg-bg border border-[#444444]">
      <TitleBar />
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<SelectWorkspace />} />
          <Route path="/:workspaceId" element={<WorkspaceView />} />
          <Route path="/workspace/create" element={<CreateWorkspace />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
