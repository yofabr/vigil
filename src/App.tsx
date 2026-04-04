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
  if (!pane.children || pane.children.length === 0) {
    return 1;
  }
  return pane.children.reduce((acc, child) => acc + countAllPanes(child), 0);
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
    
    const splitActivePane = (p: Pane): Pane => {
      if (p.id === activePane.id) {
        return {
          ...p,
          split: 'horizontal',
          children: [
            { ...p, id: generatePaneId() },
            { id: generatePaneId() },
          ],
          size: 50,
        };
      }
      if (p.children) {
        return { ...p, children: p.children.map(splitActivePane) };
      }
      return p;
    };
    
    const newPanes = splitActivePane(currentP);
    setWorkspacePanes(prev => ({ ...prev, [activeWorkspaceId]: newPanes }));
  }, [workspacePanes, activeWorkspaceId, activePaneIndex]);

  const handleSplitVertical = useCallback(() => {
    const currentP = workspacePanes[activeWorkspaceId];
    const flatPanes = flattenPanesInTree(currentP);
    const activePane = flatPanes[activePaneIndex];
    
    const splitActivePane = (p: Pane): Pane => {
      if (p.id === activePane.id) {
        return {
          ...p,
          split: 'vertical',
          children: [
            { ...p, id: generatePaneId() },
            { id: generatePaneId() },
          ],
          size: 50,
        };
      }
      if (p.children) {
        return { ...p, children: p.children.map(splitActivePane) };
      }
      return p;
    };
    
    const newPanes = splitActivePane(currentP);
    setWorkspacePanes(prev => ({ ...prev, [activeWorkspaceId]: newPanes }));
  }, [workspacePanes, activeWorkspaceId, activePaneIndex]);

  const handleClosePane = useCallback(() => {
    if (paneCount <= 1) return;
    
    const currentP = workspacePanes[activeWorkspaceId];
    const flatPanes = flattenPanesInTree(currentP);
    const activePane = flatPanes[activePaneIndex];
    
    const removePane = (p: Pane): Pane => {
      if (p.id === activePane.id) {
        return { id: generatePaneId() };
      }
      if (p.children) {
        const newChildren = p.children
          .map(removePane)
          .filter((c, _, arr) => arr.some(child => child.id !== c.id) || arr.length > 1);
        if (newChildren.length === 1 && !p.split) {
          return newChildren[0];
        }
        return { ...p, children: newChildren };
      }
      return p;
    };
    
    const newPanes = removePane(currentP);
    setWorkspacePanes(prev => ({ ...prev, [activeWorkspaceId]: newPanes }));
    
    if (activePaneIndex > 0) {
      setActivePaneIndex(activePaneIndex - 1);
    }
  }, [workspacePanes, activeWorkspaceId, activePaneIndex, paneCount]);

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
          />
        </div>
      </div>
    </div>
  );
}

function flattenPanesInTree(pane: Pane): Pane[] {
  if (!pane.children || pane.children.length === 0) {
    return [pane];
  }
  return pane.children.flatMap(flattenPanesInTree);
}

export default App;