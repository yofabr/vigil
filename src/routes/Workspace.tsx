import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar, TopBar, PaneContainer } from "../components";
import { Workspace, Pane, WORKSPACE_COLORS, createDefaultPanes, generatePaneId } from "../types";

interface SystemStats {
  workspace_path: string;
  ram_total: number;
  ram_used: number;
  ram_percentage: number;
  cpu_usage: number;
}

function countAllPanes(pane: Pane): number {
  if (!pane.children) return 1;
  if (pane.split === "horizontal") {
    return pane.children.reduce((acc, pc) => acc + countAllPanes(pc), 0);
  }
  return pane.children.length;
}

function flattenPanesInTree(pane: Pane): Pane[] {
  if (!pane.children) return [pane];

  if (pane.split === "horizontal") {
    const result: Pane[] = [];
    for (const pc of pane.children) {
      if (pc.children) {
        for (const p of pc.children) {
          result.push(p);
        }
      }
    }
    return result;
  }
  return pane.children;
}

function findPCContainingPane(pane: Pane, targetId: string): string | null {
  if (!pane.children || pane.split !== "horizontal") return null;

  for (const pc of pane.children) {
    if (pc.children?.some((c) => c.id === targetId)) {
      return pc.id;
    }
  }
  return null;
}

export function WorkspaceView() {
  const navigate = useNavigate();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([
    { id: "ws-01", name: "ws-01", color: WORKSPACE_COLORS[0], path: "/home/user/projects/vigil", description: "Main development project", openCount: 42, lastOpenedAt: new Date().toISOString(), isPinned: true, agent: "claude", terminalCount: 3 },
    { id: "ws-02", name: "ws-02", color: WORKSPACE_COLORS[1], path: "/home/user/projects/api-server", description: "Backend API service", openCount: 18, lastOpenedAt: new Date(Date.now() - 3600000).toISOString(), agent: "claude", terminalCount: 2 },
    { id: "ws-03", name: "ws-03", color: WORKSPACE_COLORS[2], path: "/home/user/docs/notes", description: "Documentation", openCount: 5, lastOpenedAt: new Date(Date.now() - 86400000).toISOString(), agent: "claude", terminalCount: 1 },
  ]);

  const [activeWorkspaceId, setActiveWorkspaceId] = useState("ws-01");
  const [workspacePanes, setWorkspacePanes] = useState<Record<string, Pane>>({
    "ws-01": createDefaultPanes(),
    "ws-02": createDefaultPanes(),
    "ws-03": createDefaultPanes(),
  });
  const [activePaneIndex, setActivePaneIndex] = useState(0);
  const [sidebarWidth, setSidebarWidth] = useState(200);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const currentPanes = workspacePanes[activeWorkspaceId] || createDefaultPanes();
  const paneCount = countAllPanes(currentPanes);

  const fetchSystemStats = useCallback(() => {
    const baseRam = 4.2;
    const baseCpu = 12.5;
    const variation = Math.random() * 0.5 - 0.25;
    
    const termCount = activeWorkspace?.terminalCount || 1;
    const ramPerTerm = 0.8;
    const cpuPerTerm = 8;
    
    const simulatedRam = baseRam + (termCount * ramPerTerm) + variation;
    const simulatedCpu = baseCpu + (termCount * cpuPerTerm) + variation;
    const ramTotal = 16.0;
    const ramPercent = (simulatedRam / ramTotal) * 100;

    setSystemStats({
      workspace_path: activeWorkspace?.path || 'No workspace',
      ram_total: ramTotal * 1024 * 1024 * 1024,
      ram_used: simulatedRam * 1024 * 1024 * 1024,
      ram_percentage: ramPercent,
      cpu_usage: simulatedCpu,
    });
  }, [activeWorkspace?.path, activeWorkspace?.terminalCount]);

  useEffect(() => {
    fetchSystemStats();
    const interval = setInterval(fetchSystemStats, 2000);
    return () => clearInterval(interval);
  }, [fetchSystemStats]);

  const handleWorkspaceSelect = useCallback(
    (id: string) => {
      setActiveWorkspaceId(id);
      setActivePaneIndex(0);
    },
    [],
  );

  const handleWorkspaceReorder = useCallback(
    (newWorkspaces: Workspace[]) => {
      setWorkspaces(newWorkspaces);
    },
    [],
  );

  const handleNewWorkspace = useCallback(() => {
    navigate("/workspace/create");
  }, [navigate]);

  const handlePaneClick = useCallback((index: number) => {
    setActivePaneIndex(index);
  }, []);

  const handleAddPC = useCallback(() => {
    const currentP = workspacePanes[activeWorkspaceId];

    const pane1 = { id: generatePaneId() };
    const newPC: Pane = {
      id: generatePaneId(),
      split: "vertical",
      children: [pane1],
    };

    const addPC = (p: Pane): Pane => {
      return {
        ...p,
        children: [...(p.children || []), newPC],
      };
    };

    const newPanes = addPC(currentP);
    setWorkspacePanes((prev) => ({
      ...prev,
      [activeWorkspaceId]: newPanes,
    }));
  }, [workspacePanes, activeWorkspaceId]);

  const handleClosePaneById = useCallback(
    (paneId: string) => {
      const currentP = workspacePanes[activeWorkspaceId];
      const flatPanes = flattenPanesInTree(currentP);
      
      if (flatPanes.length <= 1) return;
      const targetPane = flatPanes.find((p) => p.id === paneId);
      if (!targetPane) return;

      const activePCId = findPCContainingPane(currentP, paneId);
      if (!activePCId) return;

      const removePaneFromPC = (p: Pane): Pane => {
        if (p.id === activePCId) {
          const newChildren = (p.children || []).filter(
            (c) => c.id !== paneId,
          );
          return { ...p, children: newChildren };
        }
        if (p.children) {
          return { ...p, children: p.children.map(removePaneFromPC) };
        }
        return p;
      };

      let newPanes = removePaneFromPC(currentP);

      if (newPanes.children) {
        const validPCs = newPanes.children.filter(
          (pc) => pc.children && pc.children.length > 0,
        );
        if (validPCs.length === 0) {
          newPanes = { id: generatePaneId() };
        } else {
          newPanes = { ...newPanes, children: validPCs };
        }
      }

      const newPaneCount = countAllPanes(newPanes);
      if (activePaneIndex >= newPaneCount) {
        setActivePaneIndex(Math.max(0, newPaneCount - 1));
      }

      setWorkspacePanes((prev) => ({
        ...prev,
        [activeWorkspaceId]: newPanes,
      }));
    },
    [workspacePanes, activeWorkspaceId, paneCount],
  );

  const handleAddPaneToPC = useCallback(
    (pcId: string) => {
      const currentP = workspacePanes[activeWorkspaceId];

      const addPaneToPC = (p: Pane): Pane => {
        if (p.id === pcId) {
          const newPane = { id: generatePaneId() };
          return {
            ...p,
            split: p.split || "vertical",
            children: [...(p.children || []), newPane],
          };
        }
        if (p.children) {
          return { ...p, children: p.children.map(addPaneToPC) };
        }
        return p;
      };

      const newPanes = addPaneToPC(currentP);
      setWorkspacePanes((prev) => ({
        ...prev,
        [activeWorkspaceId]: newPanes,
      }));
    },
    [workspacePanes, activeWorkspaceId],
  );

  const handleOpenSettings = useCallback(() => {
    navigate("/settings");
  }, [navigate]);

  return (
    <div className="flex h-full w-full bg-bg font-mono overflow-hidden">
      <Sidebar
        width={sidebarWidth}
        onWidthChange={setSidebarWidth}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onWorkspaceSelect={handleWorkspaceSelect}
        onWorkspaceReorder={handleWorkspaceReorder}
        onNewWorkspace={handleNewWorkspace}
        onOpenSettings={handleOpenSettings}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          activeWorkspace={activeWorkspace}
          paneCount={paneCount}
          systemStats={systemStats}
        />

        <div className="flex-1 bg-bg overflow-hidden">
          <PaneContainer
            pane={currentPanes}
            activePaneIndex={activePaneIndex}
            onPaneClick={handlePaneClick}
            onClosePane={handleClosePaneById}
            onAddPane={handleAddPaneToPC}
            onAddPC={handleAddPC}
            canClosePane={paneCount > 1}
            workspacePath={activeWorkspace?.path}
            workspaceAgent={activeWorkspace?.agent}
            terminalCount={activeWorkspace?.terminalCount}
          />
        </div>
      </div>
    </div>
  );
}
