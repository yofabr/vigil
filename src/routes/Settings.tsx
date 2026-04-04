import { useNavigate } from "react-router-dom";

export function Settings() {
  const navigate = useNavigate();

  return (
    <div className="flex h-full w-full bg-bg font-mono">
      <div className="w-64 bg-surface border-r border-border-inactive p-4 flex flex-col">
        <h2 className="text-lg text-text-active font-semibold mb-4">Settings</h2>
        <button
          onClick={() => navigate("/")}
          className="text-sm text-text-inactive hover:text-text-active transition-colors"
        >
          ← Back to Workspace
        </button>
      </div>
      <div className="flex-1 p-6 overflow-auto">
        <h1 className="text-xl text-text-active mb-4">Settings</h1>
        <p className="text-text-inactive">Configure your preferences here.</p>
      </div>
    </div>
  );
}
