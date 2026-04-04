import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { WORKSPACE_COLORS } from "../types";

export function CreateWorkspace() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(WORKSPACE_COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!name.trim()) {
        setError("Workspace name is required");
        return;
      }

      setIsCreating(true);

      try {
        if (window.__TAURI__) {
          await window.__TAURI__.invoke("create_workspace", {
            name: name.trim(),
            color,
          });
        } else {
          console.warn("Tauri not available, workspace not saved to backend");
        }
        navigate("/");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create workspace");
      } finally {
        setIsCreating(false);
      }
    },
    [name, color, navigate],
  );

  const handleCancel = useCallback(() => {
    navigate("/");
  }, [navigate]);

  return (
    <div className="flex h-screen w-screen bg-bg font-mono overflow-hidden">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-xl text-[#ffffff] tracking-wider mb-2">
              Create Workspace
            </h1>
            <p className="text-sm text-[#555555]">
              Add a new workspace to organize your panes
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-xs text-[#aaaaaa] mb-2 uppercase tracking-wider"
              >
                Workspace Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter workspace name"
                className="
                  w-full px-4 py-3 
                  bg-[#0d0d0d] 
                  border border-[#1a1a1a] 
                  text-[#ffffff] 
                  text-sm 
                  font-mono
                  placeholder:text-[#555555]
                  focus:outline-none 
                  focus:border-[#ffffff]
                  transition-colors
                  duration-150
                "
                autoFocus
              />
            </div>

            <div>
              <label
                className="block text-xs text-[#aaaaaa] mb-2 uppercase tracking-wider"
              >
                Color
              </label>
              <div className="flex gap-3">
                {WORKSPACE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`
                      w-10 h-10 rounded border-2 transition-all duration-150
                      ${
                        color === c
                          ? "border-[#ffffff] scale-110"
                          : "border-transparent hover:border-[#555555]"
                      }
                    `}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-[#555555]">
                Selected: <span style={{ color }}>{color}</span>
              </p>
            </div>

            {error && (
              <div className="p-3 bg-[#1a0a0a] border border-[#aa3333] text-[#ff5555] text-xs">
                {error}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={isCreating}
                className="
                  flex-1 px-6 py-3
                  bg-[#ffffff] 
                  text-[#0a0a0a] 
                  text-sm 
                  font-mono 
                  font-medium
                  hover:bg-[#cccccc]
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                  transition-colors 
                  duration-150
                  cursor-pointer
                "
              >
                {isCreating ? "Creating..." : "Create Workspace"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="
                  px-6 py-3
                  border border-[#1a1a1a]
                  bg-transparent 
                  text-[#555555] 
                  text-sm 
                  font-mono 
                  hover:text-[#ffffff]
                  hover:border-[#555555]
                  transition-colors 
                  duration-150
                  cursor-pointer
                "
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}