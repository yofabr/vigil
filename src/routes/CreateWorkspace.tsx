import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { WORKSPACE_COLORS } from "../types";

interface LayoutOption {
  id: string;
  name: string;
  rows: number;
  cols: number;
  grid: string;
}

const LAYOUT_OPTIONS: LayoutOption[] = [
  { id: "1", name: "1 × 1", rows: 1, cols: 1, grid: "grid-cols-1" },
  { id: "2h", name: "2 × 1", rows: 1, cols: 2, grid: "grid-cols-2" },
  { id: "2v", name: "1 × 2", rows: 2, cols: 1, grid: "grid-rows-2" },
  { id: "2x2", name: "2 × 2", rows: 2, cols: 2, grid: "grid-cols-2 grid-rows-2" },
  { id: "3", name: "3 × 1", rows: 1, cols: 3, grid: "grid-cols-3" },
  { id: "3v", name: "1 × 3", rows: 3, cols: 1, grid: "grid-rows-3" },
  { id: "1+2", name: "1 + 2", rows: 1, cols: 3, grid: "grid-cols-3" },
  { id: "2+1", name: "2 + 1", rows: 1, cols: 3, grid: "grid-cols-3" },
];

export function CreateWorkspace() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(WORKSPACE_COLORS[0]);
  const [directory, setDirectory] = useState("");
  const [layout, setLayout] = useState<string>("1");
  const [terminalCount, setTerminalCount] = useState(1);
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
            directory: directory.trim() || null,
            layout: layout,
            terminalCount,
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
    [name, color, directory, layout, terminalCount, navigate],
  );

  const handleCancel = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const renderLayoutPreview = (option: LayoutOption) => {
    const cells = [];
    const displayGrid = option.grid;

    if (option.id === "1+2") {
      cells.push(
        <div key="main" className="col-span-2 row-span-2 border border-[#555555] bg-[#1a1a1a]" />,
        <div key="right" className="col-span-1 row-span-2 border border-[#555555] bg-[#1a1a1a]" />
      );
    } else if (option.id === "2+1") {
      cells.push(
        <div key="left" className="col-span-2 row-span-2 border border-[#555555] bg-[#1a1a1a]" />,
        <div key="bottom" className="col-span-2 row-span-1 border border-[#555555] bg-[#1a1a1a]" />
      );
    } else {
      for (let i = 0; i < option.rows * option.cols; i++) {
        cells.push(
          <div key={i} className="border border-[#555555] bg-[#1a1a1a]" />
        );
      }
    }

    return (
      <div className={`grid ${displayGrid} gap-1 w-16 h-16`}>
        {cells}
      </div>
    );
  };

  return (
    <div className="flex h-screen w-screen bg-bg font-mono overflow-hidden">
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-lg">
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
                htmlFor="directory"
                className="block text-xs text-[#aaaaaa] mb-2 uppercase tracking-wider"
              >
                Working Directory
              </label>
              <div className="flex gap-2">
                <input
                  id="directory"
                  type="text"
                  value={directory}
                  onChange={(e) => setDirectory(e.target.value)}
                  placeholder="Select a directory path"
                  className="
                    flex-1 px-4 py-3 
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
                />
                <button
                  type="button"
                  className="
                    px-4 py-3
                    border border-[#1a1a1a]
                    bg-[#0d0d0d]
                    text-[#555555]
                    text-sm
                    font-mono
                    hover:text-[#ffffff]
                    hover:border-[#555555]
                    transition-colors
                    duration-150
                    cursor-pointer
                  "
                  title="Browse (Tauri dialog required)"
                >
                  ...
                </button>
              </div>
              <p className="mt-1 text-xs text-[#555555]">
                Path to the working directory for this workspace
              </p>
            </div>

            <div>
              <label className="block text-xs text-[#aaaaaa] mb-2 uppercase tracking-wider">
                Pane Layout
              </label>
              <div className="grid grid-cols-4 gap-2">
                {LAYOUT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLayout(opt.id)}
                    className={`
                      flex flex-col items-center gap-2 p-3 border rounded transition-all duration-150
                      ${
                        layout === opt.id
                          ? "border-[#ffffff] bg-[#0d0d0d]"
                          : "border-[#1a1a1a] bg-[#0d0d0d] hover:border-[#555555]"
                      }
                    `}
                  >
                    {renderLayoutPreview(opt)}
                    <span className="text-xs text-[#aaaaaa]">{opt.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="terminals"
                className="block text-xs text-[#aaaaaa] mb-2 uppercase tracking-wider"
              >
                Integrated Terminals
              </label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setTerminalCount(Math.max(0, terminalCount - 1))}
                  className="
                    w-10 h-10
                    flex items-center justify-center
                    border border-[#1a1a1a]
                    bg-[#0d0d0d]
                    text-[#555555]
                    text-lg
                    font-mono
                    hover:text-[#ffffff]
                    hover:border-[#555555]
                    transition-colors
                    duration-150
                    cursor-pointer
                  "
                >
                  -
                </button>
                <input
                  id="terminals"
                  type="number"
                  min="0"
                  max="16"
                  value={terminalCount}
                  onChange={(e) => setTerminalCount(Math.min(16, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="
                    w-20 px-4 py-3 
                    text-center
                    bg-[#0d0d0d] 
                    border border-[#1a1a1a] 
                    text-[#ffffff] 
                    text-sm 
                    font-mono
                    focus:outline-none 
                    focus:border-[#ffffff]
                    transition-colors
                    duration-150
                  "
                />
                <button
                  type="button"
                  onClick={() => setTerminalCount(Math.min(16, terminalCount + 1))}
                  className="
                    w-10 h-10
                    flex items-center justify-center
                    border border-[#1a1a1a]
                    bg-[#0d0d0d]
                    text-[#555555]
                    text-lg
                    font-mono
                    hover:text-[#ffffff]
                    hover:border-[#555555]
                    transition-colors
                    duration-150
                    cursor-pointer
                  "
                >
                  +
                </button>
                <span className="text-xs text-[#555555] ml-2">
                  Number of terminal panes to create
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#aaaaaa] mb-2 uppercase tracking-wider">
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