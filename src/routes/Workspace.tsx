import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar, TopBar, StatusBar, Group } from "../components";
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

interface SystemStats {
  ram_percentage: number;
  cpu_usage: number;
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
  const [sidebarWidth, setSidebarWidth] = useState(220);
  const [systemStats, setSystemStats] = useState<SystemStats>({ ram_percentage: 0, cpu_usage: 0 });

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const currentPanes = workspacePanes[activeWorkspaceId] || createDefaultPanes();
  const activeGroupInfo = findActiveGroupAndPaneIndex(currentPanes, activePaneIndex);

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

const handleAddGroup = useCallback(() => {
    const newGroup: Pane = {
      id: generatePaneId(),
      split: "vertical",
    };
    const addGroup = (p: Pane): Pane => {
      return {
        ...p,
        children: [...(p.children || []), newGroup],
      };
    };
    const currentP = workspacePanes[activeWorkspaceId];
    if (!currentP) return;
    const newPanes = addGroup(currentP);
    setWorkspacePanes((prev) => ({
      ...prev,
      [activeWorkspaceId]: newPanes,
    }));
  }, [workspacePanes, activeWorkspaceId]);

  const handleClosePaneById = useCallback(
    (paneId: string) => {
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
    const currentP = workspacePanes[activeWorkspaceId];
    if (!currentP.children || currentP.children.length <= 1) {
      setWorkspacePanes((prev) => ({
        ...prev,
        [activeWorkspaceId]: { ...currentP, children: [] },
      }));
      setActivePaneIndex(0);
      return;
    }

    const activeGroupId = currentP.children.find((group) =>
      group.children?.some((_, idx) => {
        let offset = 0;
        for (let i = 0; i < currentP.children!.indexOf(group); i++) {
          offset += currentP.children![i].children?.length || 0;
        }
        return offset + idx === activePaneIndex;
      })
    )?.id;

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
          onAddGroup={handleAddGroup}
          onRenameWorkspace={handleRenameWorkspace}
          onDeleteWorkspace={handleDeleteWorkspace}
          onOpenSettings={handleOpenSettings}
        />

        <div className="flex-1 bg-bg overflow-hidden">
          <Group
            pane={currentPanes}
            activePaneIndex={activePaneIndex}
            onPaneClick={handlePaneClick}
            onClosePane={handleClosePaneById}
            onAddPane={handleAddPaneToGroup}
            onCloseGroup={handleCloseGroup}
            workspacePath={activeWorkspace?.path}
          />
        </div>

        <StatusBar
          ramPercent={systemStats.ram_percentage}
          cpuPercent={systemStats.cpu_usage}
          activeGroup={activeGroupInfo?.groupIndex}
          activePane={activeGroupInfo?.paneIndex}
          workspacePath={activeWorkspace?.path}
        />
      </div>
    </div>
  );
}
