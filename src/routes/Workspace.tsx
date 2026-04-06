import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar, TopBar, StatusBar, Layer } from "../components";
import { Workspace, Pane, WORKSPACE_COLORS, createDefaultPanes, generatePaneId } from "../types";

function countAllPanes(pane: Pane): number {
  if (!pane.children) return 1;
  if (pane.split === "horizontal") {
    return pane.children.reduce((acc, layer) => acc + countAllPanes(layer), 0);
  }
  return pane.children.length;
}

function findActiveLayerAndPaneIndex(pane: Pane, targetIndex: number): { layerIndex: number; paneIndex: number } | null {
  if (!pane.children || pane.split !== "horizontal") return null;

  let currentOffset = 0;
  for (let i = 0; i < pane.children.length; i++) {
    const layer = pane.children[i];
    const layerPaneCount = layer.children?.length || 0;
    
    if (targetIndex < currentOffset + layerPaneCount) {
      return {
        layerIndex: i,
        paneIndex: targetIndex - currentOffset,
      };
    }
    currentOffset += layerPaneCount;
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
  const activeLayerInfo = findActiveLayerAndPaneIndex(currentPanes, activePaneIndex);

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

  const handleAddLayer = useCallback(() => {
    const currentP = workspacePanes[activeWorkspaceId];

    const pane1 = { id: generatePaneId() };
    const newLayer: Pane = {
      id: generatePaneId(),
      split: "vertical",
      children: [pane1],
    };

    const addLayer = (p: Pane): Pane => {
      return {
        ...p,
        children: [...(p.children || []), newLayer],
      };
    };

    const newPanes = addLayer(currentP);
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
            const layerWithPaneRemoved = {
              ...child,
              children: child.children.filter(c => c.id !== targetId)
            };
            
            if (layerWithPaneRemoved.children.length === 0) {
              return {
                ...p,
                children: p.children.filter(c => c.id !== child.id)
              };
            }
            
            return {
              ...p,
              children: p.children.map(c => c.id === child.id ? layerWithPaneRemoved : c)
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

  const handleAddPaneToLayer = useCallback(
    (layerId: string) => {
      const currentP = workspacePanes[activeWorkspaceId];

      const addPaneToLayer = (p: Pane): Pane => {
        if (p.id === layerId) {
          const newPane = { id: generatePaneId() };
          return {
            ...p,
            split: p.split || "vertical",
            children: [...(p.children || []), newPane],
          };
        }
        if (p.children) {
          return { ...p, children: p.children.map(addPaneToLayer) };
        }
        return p;
      };

      const newPanes = addPaneToLayer(currentP);
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

  const handleCloseLayer = useCallback(() => {
    const currentP = workspacePanes[activeWorkspaceId];
    if (!currentP.children || currentP.children.length <= 1) {
      setWorkspacePanes((prev) => ({
        ...prev,
        [activeWorkspaceId]: { ...currentP, children: [] },
      }));
      setActivePaneIndex(0);
      return;
    }

    const activeLayerId = currentP.children.find((layer) =>
      layer.children?.some((_, idx) => {
        let offset = 0;
        for (let i = 0; i < currentP.children!.indexOf(layer); i++) {
          offset += currentP.children![i].children?.length || 0;
        }
        return offset + idx === activePaneIndex;
      })
    )?.id;

    if (!activeLayerId) return;

    const newPanes = {
      ...currentP,
      children: currentP.children.filter((l) => l.id !== activeLayerId),
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
          onAddLayer={handleAddLayer}
          onRenameWorkspace={handleRenameWorkspace}
          onDeleteWorkspace={handleDeleteWorkspace}
          onOpenSettings={handleOpenSettings}
        />

        <div className="flex-1 bg-bg overflow-hidden">
          <Layer
            pane={currentPanes}
            activePaneIndex={activePaneIndex}
            onPaneClick={handlePaneClick}
            onClosePane={handleClosePaneById}
            onAddPane={handleAddPaneToLayer}
            onCloseLayer={handleCloseLayer}
            workspacePath={activeWorkspace?.path}
          />
        </div>

        <StatusBar
          ramPercent={systemStats.ram_percentage}
          cpuPercent={systemStats.cpu_usage}
          activeLayer={activeLayerInfo?.layerIndex}
          activePane={activeLayerInfo?.paneIndex}
          workspacePath={activeWorkspace?.path}
        />
      </div>
    </div>
  );
}
