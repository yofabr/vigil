import { useState, useCallback, useEffect } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { Sidebar } from "../components";
import { Workspace, DbPane } from "../types";
import { api } from "../lib/api";

interface SystemStats {
  ram_percentage: number;
  cpu_usage: number;
}

export function AppLayout() {
  const navigate = useNavigate();
  const params = useParams();
  const workspaceId = params.workspaceId;

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [panes, setPanes] = useState<DbPane[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(workspaceId || null);
  const [activePaneIndex, setActivePaneIndex] = useState(0);
  const [sidebarWidth, setSidebarWidth] = useState(220);
  const [systemStats, setSystemStats] = useState<SystemStats>({ ram_percentage: 0, cpu_usage: 0 });
  const [loading, setLoading] = useState(true);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const totalPanes = panes.length;

  const loadWorkspaces = useCallback(async () => {
    try {
      const ws = await api.getWorkspaces();
      setWorkspaces(ws);
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    }
  }, []);

  const loadPanes = useCallback(async (wsId: string) => {
    try {
      const p = await api.getPanes(wsId);
      setPanes(p);
    } catch (err) {
      console.error('Failed to load panes:', err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadWorkspaces();
      setLoading(false);
    };
    init();
  }, [loadWorkspaces]);

  useEffect(() => {
    if (workspaceId && workspaceId !== activeWorkspaceId) {
      setActiveWorkspaceId(workspaceId);
      setActivePaneIndex(0);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (activeWorkspaceId) {
      loadPanes(activeWorkspaceId);
    } else {
      setPanes([]);
    }
  }, [activeWorkspaceId, loadPanes]);

  useEffect(() => {
    const updateStats = () => {
      const baseRam = 4.2;
      const baseCpu = 12.5;
      const variation = Math.random() * 0.5 - 0.25;
      
      const termCount = totalPanes || 1;
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
  }, [totalPanes]);

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

  const handleResizePane = useCallback(
    async (paneId: string, size: number) => {
      if (!activeWorkspaceId) return;
      
      try {
        await api.updatePane(paneId, { size });
        await loadPanes(activeWorkspaceId);
      } catch (err) {
        console.error('Failed to resize pane:', err);
      }
    },
    [activeWorkspaceId, loadPanes],
  );

  const handleAddPane = useCallback(async () => {
    if (!activeWorkspaceId) return;
    
    const orderIndex = panes.length;
    
    try {
      await api.createPane({
        workspace_id: activeWorkspaceId,
        order_index: orderIndex,
        size: 50,
        mode: 'TERMINAL',
      });
      await loadPanes(activeWorkspaceId);
    } catch (err) {
      console.error('Failed to create pane:', err);
    }
  }, [activeWorkspaceId, panes.length, loadPanes]);

  const handleClosePane = useCallback(
    async (paneId: string) => {
      if (!activeWorkspaceId) return;
      
      try {
        await api.deletePane(paneId);
        await loadPanes(activeWorkspaceId);
        
        const newPaneCount = panes.length;
        if (activePaneIndex >= newPaneCount - 1 && newPaneCount > 0) {
          setActivePaneIndex(newPaneCount - 1);
        } else if (newPaneCount === 0) {
          setActivePaneIndex(0);
        }
      } catch (err) {
        console.error('Failed to delete pane:', err);
      }
    },
    [activeWorkspaceId, panes, activePaneIndex, loadPanes],
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

  const handleCloseWorkspace = useCallback(() => {
    setActiveWorkspaceId(null);
    navigate("/");
  }, [navigate]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-bg">
        <div className="text-[#aaaaaa] font-mono">Loading...</div>
      </div>
    );
  }

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
            panes,
            activePaneIndex,
            systemStats,
            totalPanes,
            onAddPane: activeWorkspaceId ? handleAddPane : undefined,
            onResizePane: activeWorkspaceId ? handleResizePane : undefined,
            onRenameWorkspace: activeWorkspaceId ? handleRenameWorkspace : undefined,
            onDeleteWorkspace: activeWorkspaceId ? handleDeleteWorkspace : undefined,
            onPaneClick: handlePaneClick,
            onClosePane: handleClosePane,
            onCloseWorkspace: activeWorkspaceId ? handleCloseWorkspace : undefined,
            workspaces,
            onWorkspaceSelect: handleWorkspaceSelect,
            onWorkspaceReorder: handleWorkspaceReorder,
            onNewWorkspace: handleNewWorkspace,
            onOpenSettings: handleOpenSettings,
            loadWorkspaces,
          }} />
        </div>
      </div>
    </div>
  );
}