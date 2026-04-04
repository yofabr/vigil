import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { open } from "@tauri-apps/plugin-dialog";
import { WORKSPACE_COLORS } from "../types";

interface LayoutOption {
  id: string;
  name: string;
}

interface AgentOption {
  id: string;
  name: string;
  description: string;
}

const LAYOUT_OPTIONS: LayoutOption[] = [
  { id: "1x1", name: "1 × 1" },
  { id: "2x1", name: "2 × 1" },
  { id: "3x1", name: "3 × 1" },
  { id: "4x1", name: "4 × 1" },
  { id: "1x2", name: "1 × 2" },
  { id: "1x3", name: "1 × 3" },
  { id: "1x4", name: "1 × 4" },
  { id: "2x2", name: "2 × 2" },
  { id: "3x3", name: "3 × 3" },
];

const AGENT_OPTIONS: AgentOption[] = [
  { id: "claude", name: "Claude", description: "claude - config: ~/.claude.json" },
  { id: "codex", name: "Codex", description: "codex - config: ~/.codex/config.json" },
  { id: "opencode", name: "OpenCode", description: "opencode - config: ~/.opencode/config.json" },
];

export function CreateWorkspace() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(WORKSPACE_COLORS[0]);
  const [directory, setDirectory] = useState("");
  const [layout, setLayout] = useState<string>("1x1");
  const [terminalCount, setTerminalCount] = useState(1);
  const [agent, setAgent] = useState<string>("claude");
  const [agentSearch, setAgentSearch] = useState<string>("claude");
  const [isAgentDropdownOpen, setIsAgentDropdownOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const filteredAgents = useMemo(() => {
    if (!agentSearch.trim()) return AGENT_OPTIONS;
    const search = agentSearch.toLowerCase();
    return AGENT_OPTIONS.filter(
      (opt) =>
        opt.name.toLowerCase().includes(search) ||
        opt.description.toLowerCase().includes(search) ||
        opt.id.toLowerCase().includes(search)
    );
  }, [agentSearch]);

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
            agent,
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
    [name, color, directory, layout, terminalCount, agent, navigate],
  );

  const handleCancel = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const handleBrowse = useCallback(async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });
      if (selected && typeof selected === "string") {
        setDirectory(selected);
      }
    } catch (err) {
      console.error("Failed to open directory picker:", err);
    }
  }, []);

  return (
    <div className="flex h-screen w-screen bg-bg font-mono overflow-hidden">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="mb-4">
            <h1 className="text-xl text-[#ffffff] tracking-wider mb-1">
              Create Workspace
            </h1>
            <p className="text-sm text-[#555555]">
              Add a new workspace to organize your panes
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs text-[#aaaaaa] mb-1 uppercase tracking-wider"
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
                    w-full px-3 py-2 
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
                  className="block text-xs text-[#aaaaaa] mb-1 uppercase tracking-wider"
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
                      flex-1 px-3 py-2 
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
                    onClick={handleBrowse}
                    className="px-3 py-2 border border-[#1a1a1a] bg-[#0d0d0d] text-[#555555] text-sm font-mono hover:text-[#ffffff] hover:border-[#555555] transition-colors duration-150 cursor-pointer"
                    title="Browse"
                  >
                    ...
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#aaaaaa] mb-1 uppercase tracking-wider">
                  Pane Layout
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {LAYOUT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setLayout(opt.id)}
                      className={`
                        px-3 py-2 border rounded transition-all duration-150 text-sm
                        ${
                          layout === opt.id
                            ? "border-[#ffffff] bg-[#0d0d0d] text-[#ffffff]"
                            : "border-[#1a1a1a] bg-[#0d0d0d] text-[#aaaaaa] hover:border-[#555555] hover:text-[#ffffff]"
                        }
                      `}
                    >
                      {opt.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="terminals"
                  className="block text-xs text-[#aaaaaa] mb-1 uppercase tracking-wider"
                >
                  Integrated Terminals
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTerminalCount(Math.max(0, terminalCount - 1))}
                    className="
                      w-8 h-8
                      flex items-center justify-center
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
                      w-16 px-2 py-2 
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
                      w-8 h-8
                      flex items-center justify-center
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
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#aaaaaa] mb-1 uppercase tracking-wider">
                  Color
                </label>
                <div className="flex gap-2">
                  {WORKSPACE_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`
                        w-8 h-8 rounded border-2 transition-all duration-150
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

              <div>
                <label className="block text-xs text-[#aaaaaa] mb-1 uppercase tracking-wider">
                  Agent
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={agentSearch}
                    onChange={(e) => setAgentSearch(e.target.value)}
                    onFocus={() => setIsAgentDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setIsAgentDropdownOpen(false), 200)}
                    placeholder="Search agents..."
                    className="w-full px-3 py-2 bg-[#0d0d0d] border border-[#1a1a1a] text-[#ffffff] text-sm font-mono placeholder:text-[#555555] focus:outline-none focus:border-[#ffffff] transition-colors duration-150"
                  />
                  {isAgentDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-[#0d0d0d] border border-[#1a1a1a] max-h-48 overflow-y-auto">
                      {filteredAgents.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setAgent(opt.id);
                            setAgentSearch(opt.name);
                            setIsAgentDropdownOpen(false);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-[#1a1a1a] transition-colors duration-150"
                        >
                          <div className="text-sm text-[#ffffff]">{opt.name}</div>
                          <div className="text-xs text-[#555555]">{opt.description}</div>
                        </button>
                      ))}
                      {filteredAgents.length === 0 && (
                        <div className="px-3 py-2 text-xs text-[#555555]">
                          No agents found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="col-span-2 p-2 bg-[#1a0a0a] border border-[#aa3333] text-[#ff5555] text-xs">
                  {error}
                </div>
              )}

              <div className="col-span-2 flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="
                    flex-1 px-4 py-2
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
                    px-4 py-2
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
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}