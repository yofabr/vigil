import { useState, useCallback, useEffect } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { Sidebar } from "../components";
import { Workspace, Group, DbPane } from "../types";
import { api } from "../lib/api";

function countAllPanes(groups: Group[], panesByGroup: Record<string, DbPane[]>): number {
  return groups.reduce((acc, group) => {
    const panes = panesByGroup[group.id] || [];
    return acc + panes.length;
  }, 0);
}

function findActiveGroupAndPaneIndex(
  groups: Group[],
  panesByGroup: Record<string, DbPane[]>,
  targetIndex: number
): { groupIndex: number; paneIndex: number } | null {
  let currentOffset = 0;
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const panes = panesByGroup[group.id] || [];
    const groupPaneCount = panes.length;
    
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

function findPaneContainingIndex(
  groups: Group[],
  panesByGroup: Record<string, DbPane[]>,
  targetIndex: number
): string | null {
  let currentOffset = 0;
  for (const group of groups) {
    const panes = panesByGroup[group.id] || [];
    const groupPaneCount = panes.length;
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

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [panesByGroup, setPanesByGroup] = useState<Record<string, DbPane[]>>({});
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(workspaceId || null);
  const [activePaneIndex, setActivePaneIndex] = useState(0);
  const [sidebarWidth, setSidebarWidth] = useState(220);
  const [systemStats, setSystemStats] = useState<SystemStats>({ ram_percentage: 0, cpu_usage: 0 });
  const [loading, setLoading] = useState(true);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const totalPanes = countAllPanes(groups, panesByGroup);
  const activeGroupInfo = findActiveGroupAndPaneIndex(groups, panesByGroup, activePaneIndex);

  const loadWorkspaces = useCallback(async () => {
    try {
      const ws = await api.getWorkspaces();
      setWorkspaces(ws);
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    }
  }, []);

  const loadGroupsAndPanes = useCallback(async (wsId: string) => {
    try {
      const grps = await api.getGroups(wsId);
      setGroups(grps);

      const panesMap: Record<string, DbPane[]> = {};
      for (const group of grps) {
        const panes = await api.getPanes(group.id);
        panesMap[group.id] = panes;
      }
      setPanesByGroup(panesMap);
    } catch (err) {
      console.error('Failed to load groups/panes:', err);
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
      loadGroupsAndPanes(activeWorkspaceId);
    } else {
      setGroups([]);
      setPanesByGroup({});
    }
  }, [activeWorkspaceId, loadGroupsAndPanes]);

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

  const handleAddGroup = useCallback(async () => {
    if (!activeWorkspaceId) return;
    
    const orderIndex = groups.length;
    
    try {
      await api.createGroup({
        workspace_id: activeWorkspaceId,
        order_index: orderIndex,
        size: 50,
        split_type: 'VERTICAL',
      });
      await loadGroupsAndPanes(activeWorkspaceId);
    } catch (err) {
      console.error('Failed to create group:', err);
    }
  }, [activeWorkspaceId, groups.length, loadGroupsAndPanes]);

  const handleClosePaneById = useCallback(
    async (paneId: string) => {
      if (!activeWorkspaceId) return;
      
      try {
        await api.deletePane(paneId);
        await loadGroupsAndPanes(activeWorkspaceId);
        
        const newPaneCount = groups.reduce((acc, g) => acc + (panesByGroup[g.id]?.length || 0), 0);
        if (activePaneIndex >= newPaneCount && newPaneCount > 0) {
          setActivePaneIndex(newPaneCount - 1);
        } else if (newPaneCount === 0) {
          setActivePaneIndex(0);
        }
      } catch (err) {
        console.error('Failed to delete pane:', err);
      }
    },
    [activeWorkspaceId, groups, panesByGroup, activePaneIndex, loadGroupsAndPanes],
  );

  const handleAddPaneToGroup = useCallback(
    async (groupId: string) => {
      if (!activeWorkspaceId) return;
      
      const currentPanes = panesByGroup[groupId] || [];
      const orderIndex = currentPanes.length;
      
      try {
        await api.createPane({
          group_id: groupId,
          order_index: orderIndex,
          size: 50,
          mode: 'TERMINAL',
        });
        await loadGroupsAndPanes(activeWorkspaceId);
      } catch (err) {
        console.error('Failed to create pane:', err);
      }
    },
    [activeWorkspaceId, panesByGroup, loadGroupsAndPanes],
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

  const handleCloseGroup = useCallback(async () => {
    if (!activeWorkspaceId) return;
    
    const groupId = findPaneContainingIndex(groups, panesByGroup, activePaneIndex);
    if (!groupId) return;
    
    try {
      await api.deleteGroup(groupId);
      await loadGroupsAndPanes(activeWorkspaceId);
      setActivePaneIndex(0);
    } catch (err) {
      console.error('Failed to delete group:', err);
    }
  }, [activeWorkspaceId, groups, panesByGroup, activePaneIndex, loadGroupsAndPanes]);

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
            groups,
            panesByGroup,
            activePaneIndex,
            activeGroupInfo,
            systemStats,
            totalPanes,
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
            loadWorkspaces,
          }} />
        </div>
      </div>
    </div>
  );
}
