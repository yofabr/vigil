import { useState, useCallback, useEffect } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { Sidebar } from "../components";
import { Workspace, Pane, WORKSPACE_COLORS, createDefaultPanes, generatePaneId } from "../types";

function countAllPanes(pane: Pane): number {
  if (!pane.children) return 1;
  if (pane.split === "horizontal") {
    return pane.children.reduce((acc, group) => acc + countAllPanes(group), 0);
  }
  return pane.children.length;
}

function findActiveGroupAndPaneIndex(pane: Pane, targetIndex: number): { groupIndex: number; paneIndex: number } | null {
  if (!pane.children || pane.split !== "horizontal") return null;

  let currentOffset = 0;
  for (let i = 0; i < pane.children.length; i++) {
    const group = pane.children[i];
    const groupPaneCount = group.children?.length || 0;
    
    if (targetIndex < currentOffset + groupPaneCount) {
      return {
        groupIndex: i,
        paneIndex: targetIndex - currentOffset,
      };
    }
    currentOffset += groupPaneCount;
  }
  return null;
}

function findPaneContainingIndex(pane: Pane, targetIndex: number): string | null {
  if (!pane.children || pane.split !== "horizontal") return null;

  let currentOffset = 0;
  for (const group of pane.children) {
    const groupPaneCount = group.children?.length || 0;
    if (targetIndex < currentOffset + groupPaneCount) {
      return group.id;
    }
    currentOffset += groupPaneCount;
  }
  return null;
}

interface SystemStats {
  ram_percentage: number;
  cpu_usage: number;
}

export function AppLayout() {
  const navigate = useNavigate();
  const params = useParams();
  const workspaceId = params.workspaceId;

  const [workspaces, setWorkspaces] = useState<Workspace[]>([
    { id: "ws-01", name: "ws-01", color: WORKSPACE_COLORS[0], path: "/home/user/projects/vigil", description: "Main development project", openCount: 42, lastOpenedAt: new Date().toISOString(), isPinned: true, agent: "claude", terminalCount: 3 },
    { id: "ws-02", name: "ws-02", color: WORKSPACE_COLORS[1], path: "/home/user/projects/api-server", description: "Backend API service", openCount: 18, lastOpenedAt: new Date(Date.now() - 3600000).toISOString(), agent: "claude", terminalCount: 2 },
    { id: "ws-03", name: "ws-03", color: WORKSPACE_COLORS[2], path: "/home/user/docs/notes", description: "Documentation", openCount: 5, lastOpenedAt: new Date(Date.now() - 86400000).toISOString(), agent: "claude", terminalCount: 1 },
  ]);

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(workspaceId || null);
  const [workspacePanes, setWorkspacePanes] = useState<Record<string, Pane>>({
    "ws-01": createDefaultPanes(),
    "ws-02": createDefaultPanes(),
    "ws-03": createDefaultPanes(),
  });
  const [activePaneIndex, setActivePaneIndex] = useState(0);
  const [sidebarWidth, setSidebarWidth] = useState(220);
  const [systemStats, setSystemStats] = useState<SystemStats>({ ram_percentage: 0, cpu_usage: 0 });

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const currentPanes = activeWorkspaceId ? (workspacePanes[activeWorkspaceId] || createDefaultPanes()) : createDefaultPanes();
  const activeGroupInfo = findActiveGroupAndPaneIndex(currentPanes, activePaneIndex);

  useEffect(() => {
    if (workspaceId && workspaceId !== activeWorkspaceId) {
      setActiveWorkspaceId(workspaceId);
      setActivePaneIndex(0);
    }
  }, [workspaceId]);

  useEffect(() => {
    const updateStats = () => {
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
        ram_percentage: ramPercent,
        cpu_usage: simulatedCpu,
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, [activeWorkspace?.terminalCount]);

  const handleWorkspaceSelect = useCallback(
    (id: string) => {
      navigate(`/${id}`);
    },
    [navigate],
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

  const handleAddGroup = useCallback(() => {
    if (!activeWorkspaceId) return;
    const currentP = workspacePanes[activeWorkspaceId];

    const pane1 = { id: generatePaneId() };
    const newGroup: Pane = {
      id: generatePaneId(),
      split: "vertical",
      children: [pane1],
    };

    const addGroup = (p: Pane): Pane => {
      return {
        ...p,
        children: [...(p.children || []), newGroup],
      };
    };

    const newPanes = addGroup(currentP);
    setWorkspacePanes((prev) => ({
      ...prev,
      [activeWorkspaceId]: newPanes,
    }));
  }, [workspacePanes, activeWorkspaceId]);

  const handleClosePaneById = useCallback(
    (paneId: string) => {
      if (!activeWorkspaceId) return;
      const currentP = workspacePanes[activeWorkspaceId];
      
      const findAndRemovePane = (p: Pane, targetId: string): Pane => {
        if (!p.children) return p;
        
        for (const child of p.children) {
          if (child.children && child.children.some(c => c.id === targetId)) {
            const groupWithPaneRemoved = {
              ...child,
              children: child.children.filter(c => c.id !== targetId)
            };
            
            if (groupWithPaneRemoved.children.length === 0) {
              return {
                ...p,
                children: p.children.filter(c => c.id !== child.id)
              };
            }
            
            return {
              ...p,
              children: p.children.map(c => c.id === child.id ? groupWithPaneRemoved : c)
            };
          }
        }
        
        return {
          ...p,
          children: p.children.map(c => findAndRemovePane(c, targetId))
        };
      };

      let newPanes = findAndRemovePane(currentP, paneId);

      const newPaneCount = countAllPanes(newPanes);
      if (activePaneIndex >= newPaneCount && newPaneCount > 0) {
        setActivePaneIndex(newPaneCount - 1);
      } else if (newPaneCount === 0) {
        setActivePaneIndex(0);
      }

      setWorkspacePanes((prev) => ({
        ...prev,
        [activeWorkspaceId]: newPanes,
      }));
    },
    [workspacePanes, activeWorkspaceId, activePaneIndex],
  );

  const handleAddPaneToGroup = useCallback(
    (groupId: string) => {
      if (!activeWorkspaceId) return;
      const currentP = workspacePanes[activeWorkspaceId];

      const addPaneToGroup = (p: Pane): Pane => {
        if (p.id === groupId) {
          const newPane = { id: generatePaneId() };
          return {
            ...p,
            split: p.split || "vertical",
            children: [...(p.children || []), newPane],
          };
        }
        if (p.children) {
          return { ...p, children: p.children.map(addPaneToGroup) };
        }
        return p;
      };

      const newPanes = addPaneToGroup(currentP);
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

  const handleRenameWorkspace = useCallback(() => {
    console.log("Rename workspace:", activeWorkspaceId);
  }, [activeWorkspaceId]);

  const handleDeleteWorkspace = useCallback(() => {
    console.log("Delete workspace:", activeWorkspaceId);
  }, [activeWorkspaceId]);

  const handleCloseGroup = useCallback(() => {
    if (!activeWorkspaceId) return;
    const currentP = workspacePanes[activeWorkspaceId];
    if (!currentP.children || currentP.children.length <= 1) {
      setWorkspacePanes((prev) => ({
        ...prev,
        [activeWorkspaceId]: { ...currentP, children: [] },
      }));
      setActivePaneIndex(0);
      return;
    }

    const activeGroupId = findPaneContainingIndex(currentP, activePaneIndex);
    if (!activeGroupId) return;

    const newPanes = {
      ...currentP,
      children: currentP.children.filter((g) => g.id !== activeGroupId),
    };

    setWorkspacePanes((prev) => ({
      ...prev,
      [activeWorkspaceId]: newPanes,
    }));
    setActivePaneIndex(0);
  }, [workspacePanes, activeWorkspaceId, activePaneIndex]);

  const handleCloseWorkspace = useCallback(() => {
    setActiveWorkspaceId(null);
    navigate("/");
  }, [navigate]);

  return (
    <div className="h-full flex flex-col bg-bg">
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          width={sidebarWidth}
          onWidthChange={setSidebarWidth}
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId || ""}
          onWorkspaceSelect={handleWorkspaceSelect}
          onWorkspaceReorder={handleWorkspaceReorder}
          onNewWorkspace={handleNewWorkspace}
          onOpenSettings={handleOpenSettings}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <Outlet context={{
            activeWorkspace,
            currentPanes,
            activePaneIndex,
            activeGroupInfo,
            systemStats,
            onAddGroup: activeWorkspaceId ? handleAddGroup : undefined,
            onRenameWorkspace: activeWorkspaceId ? handleRenameWorkspace : undefined,
            onDeleteWorkspace: activeWorkspaceId ? handleDeleteWorkspace : undefined,
            onPaneClick: handlePaneClick,
            onClosePane: handleClosePaneById,
            onAddPane: handleAddPaneToGroup,
            onCloseGroup: activeWorkspaceId ? handleCloseGroup : undefined,
            onCloseWorkspace: activeWorkspaceId ? handleCloseWorkspace : undefined,
            workspaces,
            onWorkspaceSelect: handleWorkspaceSelect,
            onWorkspaceReorder: handleWorkspaceReorder,
            onNewWorkspace: handleNewWorkspace,
            onOpenSettings: handleOpenSettings,
          }} />
        </div>
      </div>
    </div>
  );
}
