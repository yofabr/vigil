import { useOutletContext } from "react-router-dom";
import { TopBar, StatusBar, Group } from "../components";
import { Workspace, DbPane } from "../types";

interface OutletContext {
  activeWorkspace: Workspace | undefined;
  panes: DbPane[];
  activePaneIndex: number;
  systemStats: { ram_percentage: number; cpu_usage: number };
  totalPanes: number;
  onAddPane: (() => void) | undefined;
  onResizePane?: (paneId: string, size: number) => void;
  onRenameWorkspace: (() => void) | undefined;
  onDeleteWorkspace: (() => void) | undefined;
  onCloseWorkspace: (() => void) | undefined;
  onPaneClick: (index: number) => void;
  onClosePane: (paneId: string) => void;
}

export function WorkspaceView() {
  const {
    activeWorkspace,
    panes,
    activePaneIndex,
    systemStats,
    totalPanes,
    onAddPane,
    onResizePane,
    onRenameWorkspace,
    onDeleteWorkspace,
    onCloseWorkspace,
    onPaneClick,
    onClosePane,
  } = useOutletContext<OutletContext>();

  if (!activeWorkspace) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-[#555555] text-lg font-mono mb-2">Select a workspace</div>
          <div className="text-border-light text-sm font-mono">Choose a workspace from the sidebar to get started</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <TopBar
        activeWorkspace={activeWorkspace}
        onAddPane={onAddPane || (() => {})}
        onRenameWorkspace={onRenameWorkspace || (() => {})}
        onDeleteWorkspace={onDeleteWorkspace || (() => {})}
        onCloseWorkspace={onCloseWorkspace || (() => {})}
        onOpenSettings={() => {}}
      />
      <div className="flex-1 bg-bg overflow-hidden">
        <Group
          panes={panes}
          activePaneIndex={activePaneIndex}
          onPaneClick={onPaneClick}
          onClosePane={onClosePane}
          onResizePane={onResizePane}
          workspacePath={activeWorkspace.path}
        />
      </div>
      <StatusBar
        activePaneIndex={activePaneIndex}
        workspacePath={activeWorkspace.path}
        totalPanes={totalPanes}
        ramPercent={systemStats.ram_percentage}
        cpuPercent={systemStats.cpu_usage}
      />
    </div>
  );
}