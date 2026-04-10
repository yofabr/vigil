import { useState, useCallback, useMemo } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { WORKSPACE_COLORS } from "../types";

interface CreateWorkspaceResponse {
  id: string;
  name: string;
  color: string;
  path: string | null;
  agent: string | null;
  is_pinned: number;
  description: string | null;
  open_count: number;
  created_at: string;
  updated_at: string;
  last_opened_at: string | null;
}

interface AgentOption {
  id: string;
  name: string;
  description: string;
}

const AGENT_OPTIONS: AgentOption[] = [
  { id: "claude", name: "Claude", description: "claude - config: ~/.claude.json" },
  { id: "codex", name: "Codex", description: "codex - config: ~/.codex/config.json" },
  { id: "opencode", name: "OpenCode", description: "opencode - config: ~/.opencode/config.json" },
];

export function CreateWorkspace() {
  const navigate = useNavigate();
  const { loadWorkspaces } = useOutletContext<{ loadWorkspaces: () => Promise<void> }>();

  const defaultPath = typeof window !== "undefined" ? window.VIGIL_DEFAULT_PATH : undefined;

  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(WORKSPACE_COLORS[0]);
  const [directory, setDirectory] = useState(defaultPath || "");
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
        console.log("window.__TAURI__:", window.__TAURI__);
        console.log("Checking invoke availability");
        if (window.__TAURI__) {
          console.log("Tauri available, calling invoke");
          const workspace = await invoke<CreateWorkspaceResponse>("create_workspace", {
            input: {
              name: name.trim(),
              color,
              path: directory.trim() || null,
              agent: agent || null,
            },
          });
          console.log("invoke completed", workspace);
          await loadWorkspaces();
          navigate(`/${workspace.id}`);
        } else {
          console.warn("Tauri not available, workspace not saved to backend");
          navigate("/");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create workspace");
      } finally {
        setIsCreating(false);
      }
    },
    [name, color, directory, agent, navigate],
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
    <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
      <div className="w-full max-w-4xl">
        <div className="mb-4">
          <h1 className="text-xl text-[#ffffff] tracking-wider mb-1">
            Create Workspace
          </h1>
          <p className="text-sm text-[#aaaaaa]">
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
                  bg-surface 
                  border border-border-inactive 
                  text-[#ffffff] 
                  text-sm 
                  font-mono
                  placeholder:text-[#aaaaaa]
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
                    bg-surface 
                    border border-border-inactive 
                    text-[#ffffff] 
                    text-sm 
                    font-mono
                    placeholder:text-[#aaaaaa]
                    focus:outline-none 
                    focus:border-[#ffffff]
                    transition-colors
                    duration-150
                  "
                />
                <button
                  type="button"
                  onClick={handleBrowse}
                  className="px-3 py-2 border border-border-inactive bg-surface text-[#aaaaaa] text-sm font-mono hover:text-[#ffffff] hover:border-[#888888] transition-colors duration-150 cursor-pointer"
                  title="Browse"
                >
                  ...
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
                          : "border-transparent hover:border-[#888888]"
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
                  className="w-full px-3 py-2 bg-surface border border-border-inactive text-[#ffffff] text-sm font-mono placeholder:text-[#aaaaaa] focus:outline-none focus:border-[#ffffff] transition-colors duration-150"
                />
                {isAgentDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-surface border border-border-inactive max-h-48 overflow-y-auto">
                    {filteredAgents.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setAgent(opt.id);
                          setAgentSearch(opt.name);
                          setIsAgentDropdownOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-[#333333] transition-colors duration-150"
                      >
                        <div className="text-sm text-[#ffffff]">{opt.name}</div>
                        <div className="text-xs text-[#888888]">{opt.description}</div>
                      </button>
                    ))}
                    {filteredAgents.length === 0 && (
                      <div className="px-3 py-2 text-xs text-[#aaaaaa]">
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
                  border border-border-inactive
                  bg-transparent 
                  text-[#aaaaaa] 
                  text-sm 
                  font-mono 
                  hover:text-[#ffffff]
                  hover:border-[#888888]
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
  );
}
