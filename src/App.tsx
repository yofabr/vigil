import { useState, useCallback } from 'react';
import { Sidebar, TopBar, PaneContainer } from './components';
import { 
  Workspace, 
  Pane, 
  WORKSPACE_COLORS, 
  generateWorkspaceName, 
  createDefaultPanes,
  generatePaneId 
} from './types';

function countAllPanes(pane: Pane): number {
  if (!pane.children) return 1;
  if (pane.split === 'horizontal') {
    return pane.children.reduce((acc, pc) => acc + countAllPanes(pc), 0);
  }
  return pane.children.length;
}

function App() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([
    { id: 'ws-01', name: 'ws-01', color: WORKSPACE_COLORS[0] },
    { id: 'ws-02', name: 'ws-02', color: WORKSPACE_COLORS[1] },
    { id: 'ws-03', name: 'ws-03', color: WORKSPACE_COLORS[2] },
  ]);
  
  const [activeWorkspaceId, setActiveWorkspaceId] = useState('ws-01');
  const [workspacePanes, setWorkspacePanes] = useState<Record<string, Pane>>({
    'ws-01': createDefaultPanes(),
    'ws-02': createDefaultPanes(),
    'ws-03': createDefaultPanes(),
  });
  const [activePaneIndex, setActivePaneIndex] = useState(0);
  const [sidebarWidth, setSidebarWidth] = useState(180);

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
  const currentPanes = workspacePanes[activeWorkspaceId] || createDefaultPanes();
  const paneCount = countAllPanes(currentPanes);

  const handleWorkspaceSelect = useCallback((id: string) => {
    setActiveWorkspaceId(id);
    setActivePaneIndex(0);
  }, []);

  const handleWorkspaceReorder = useCallback((newWorkspaces: Workspace[]) => {
    setWorkspaces(newWorkspaces);
  }, []);

  const handleNewWorkspace = useCallback(() => {
    const newIndex = workspaces.length + 1;
    const newWorkspace: Workspace = {
      id: `ws-${String(newIndex).padStart(2, '0')}`,
      name: generateWorkspaceName(workspaces.length),
      color: WORKSPACE_COLORS[newIndex % WORKSPACE_COLORS.length],
    };
    
    setWorkspaces(prev => [...prev, newWorkspace]);
    setWorkspacePanes(prev => ({
      ...prev,
      [newWorkspace.id]: createDefaultPanes(),
    }));
  }, [workspaces]);

  const handlePaneClick = useCallback((index: number) => {
    setActivePaneIndex(index);
  }, []);

  const handleSplitHorizontal = useCallback(() => {
    const currentP = workspacePanes[activeWorkspaceId];
    const flatPanes = flattenPanesInTree(currentP);
    const activePane = flatPanes[activePaneIndex];
    
    const activePCId = findPCContainingPane(currentP, activePane.id);
    
    if (!activePCId) return;
    
    const splitActivePC = (p: Pane): Pane => {
      if (p.id === activePCId) {
        return {
          ...p,
          split: 'vertical',
          children: [
            { ...p, id: generatePaneId() },
            { id: generatePaneId() },
          ],
        };
      }
      if (p.children) {
        return { ...p, children: p.children.map(splitActivePC) };
      }
      return p;
    };
    
    const newPanes = splitActivePC(currentP);
    setWorkspacePanes(prev => ({ ...prev, [activeWorkspaceId]: newPanes }));
  }, [workspacePanes, activeWorkspaceId, activePaneIndex]);

  const handleSplitVertical = useCallback(() => {
    const currentP = workspacePanes[activeWorkspaceId];
    const flatPanes = flattenPanesInTree(currentP);
    const activePane = flatPanes[activePaneIndex];
    
    const activePCId = findPCContainingPane(currentP, activePane.id);
    
    if (!activePCId) return;
    
    const addVerticalPane = (p: Pane): Pane => {
      if (p.id === activePCId) {
        return {
          ...p,
          children: [
            ...(p.children || []),
            { id: generatePaneId() },
          ],
        };
      }
      if (p.children) {
        return { ...p, children: p.children.map(addVerticalPane) };
      }
      return p;
    };
    
    const newPanes = addVerticalPane(currentP);
    setWorkspacePanes(prev => ({ ...prev, [activeWorkspaceId]: newPanes }));
  }, [workspacePanes, activeWorkspaceId, activePaneIndex]);

  const handleClosePane = useCallback(() => {
    if (paneCount <= 1) return;
    
    const currentP = workspacePanes[activeWorkspaceId];
    const flatPanes = flattenPanesInTree(currentP);
    const activePane = flatPanes[activePaneIndex];
    
    const activePCId = findPCContainingPane(currentP, activePane.id);
    
    if (!activePCId) return;
    
    const removePaneFromPC = (p: Pane): Pane => {
      if (p.id === activePCId) {
        const newChildren = (p.children || []).filter(c => c.id !== activePane.id);
        if (newChildren.length === 0) {
          return { id: generatePaneId() };
        }
        return { ...p, children: newChildren };
      }
      if (p.children) {
        return { ...p, children: p.children.map(removePaneFromPC) };
      }
      return p;
    };
    
    const newPanes = removePaneFromPC(currentP);
    setWorkspacePanes(prev => ({ ...prev, [activeWorkspaceId]: newPanes }));
    
    if (activePaneIndex > 0) {
      setActivePaneIndex(activePaneIndex - 1);
    }
  }, [workspacePanes, activeWorkspaceId, activePaneIndex, paneCount]);

  const handleClosePaneById = useCallback((paneId: string) => {
    const currentP = workspacePanes[activeWorkspaceId];
    const flatPanes = flattenPanesInTree(currentP);
    const targetPane = flatPanes.find(p => p.id === paneId);
    
    if (!targetPane) return;
    
    const pcs = currentP.children || [];
    if (pcs.length === 1 && pcs[0].children?.length === 1) {
      return;
    }
    
    const activePCId = findPCContainingPane(currentP, paneId);
    if (!activePCId) return;
    
    const removePaneFromPC = (p: Pane): Pane => {
      if (p.id === activePCId) {
        const newChildren = (p.children || []).filter(c => c.id !== paneId);
        if (newChildren.length === 0) {
          return { id: 'REMOVE_ME' } as unknown as Pane;
        }
        return { ...p, children: newChildren };
      }
      if (p.children) {
        const newChildren = p.children.map(removePaneFromPC).filter(c => c.id !== 'REMOVE_ME');
        if (newChildren.length === 0 && p.split === 'horizontal') {
          return { id: generatePaneId() };
        }
        return { ...p, children: newChildren };
      }
      return p;
    };
    
    const newPanes = removePaneFromPC(currentP);
    setWorkspacePanes(prev => ({ ...prev, [activeWorkspaceId]: newPanes }));
    
    const newFlatPanes = flattenPanesInTree(newPanes);
    if (activePaneIndex >= newFlatPanes.length) {
      setActivePaneIndex(Math.max(0, newFlatPanes.length - 1));
    }
  }, [workspacePanes, activeWorkspaceId, activePaneIndex]);

  const handleAddPaneToPC = useCallback((pcId: string) => {
    const currentP = workspacePanes[activeWorkspaceId];
    
    const addPaneToPC = (p: Pane): Pane => {
      if (p.id === pcId) {
        return {
          ...p,
          children: [
            ...(p.children || []),
            { id: generatePaneId() },
          ],
        };
      }
      if (p.children) {
        return { ...p, children: p.children.map(addPaneToPC) };
      }
      return p;
    };
    
    const newPanes = addPaneToPC(currentP);
    setWorkspacePanes(prev => ({ ...prev, [activeWorkspaceId]: newPanes }));
  }, [workspacePanes, activeWorkspaceId]);

  const handleAddPC = useCallback(() => {
    const currentP = workspacePanes[activeWorkspaceId];
    
    const pane1 = { id: generatePaneId() };
    const newPC: Pane = { id: generatePaneId(), split: 'vertical', children: [pane1] };
    
    const addPC = (p: Pane): Pane => {
      return {
        ...p,
        children: [...(p.children || []), newPC],
      };
    };
    
    const newPanes = addPC(currentP);
    setWorkspacePanes(prev => ({ ...prev, [activeWorkspaceId]: newPanes }));
  }, [workspacePanes, activeWorkspaceId]);

  return (
    <div className="flex h-screen w-screen bg-bg font-mono overflow-hidden">
      <Sidebar
        width={sidebarWidth}
        onWidthChange={setSidebarWidth}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onWorkspaceSelect={handleWorkspaceSelect}
        onWorkspaceReorder={handleWorkspaceReorder}
        onNewWorkspace={handleNewWorkspace}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          activeWorkspace={activeWorkspace}
          paneCount={paneCount}
          onSplitHorizontal={handleSplitHorizontal}
          onSplitVertical={handleSplitVertical}
          onClosePane={handleClosePane}
        />
        
        <div className="flex-1 bg-bg p-1 overflow-hidden">
          <PaneContainer
            pane={currentPanes}
            activePaneIndex={activePaneIndex}
            onPaneClick={handlePaneClick}
            onClosePane={handleClosePaneById}
            onAddPane={handleAddPaneToPC}
            onAddPC={handleAddPC}
            canClosePane={paneCount > 1}
          />
        </div>
      </div>
    </div>
  );
}

function flattenPanesInTree(pane: Pane): Pane[] {
  if (!pane.children) return [pane];
  
  if (pane.split === 'horizontal') {
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
  if (!pane.children || pane.split !== 'horizontal') return null;
  
  for (const pc of pane.children) {
    if (pc.children?.some(c => c.id === targetId)) {
      return pc.id;
    }
  }
  return null;
}

export default App;