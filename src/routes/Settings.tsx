import { useNavigate } from "react-router-dom";

export function Settings() {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen w-screen bg-bg font-mono">
      <div className="w-64 bg-surface border-r border-border p-4">
        <h2 className="text-lg font-semibold mb-4">Settings</h2>
        <button
          onClick={() => navigate("/")}
          className="text-sm text-muted hover:text-text transition-colors"
        >
          ← Back to Workspace
        </button>
      </div>
      <div className="flex-1 p-6">
        <h1 className="text-xl mb-4">Settings</h1>
        <p className="text-muted">Configure your preferences here.</p>
      </div>
    </div>
  );
}
