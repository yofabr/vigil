import { useOutletContext } from "react-router-dom";
import { TopBar, StatusBar, Group } from "../components";
import { Workspace, Pane } from "../types";

interface OutletContext {
  activeWorkspace: Workspace | undefined;
  currentPanes: Pane;
  activePaneIndex: number;
  activeGroupInfo: { groupIndex: number; paneIndex: number } | null | undefined;
  systemStats: { ram_percentage: number; cpu_usage: number };
  onAddGroup: (() => void) | undefined;
  onRenameWorkspace: (() => void) | undefined;
  onDeleteWorkspace: (() => void) | undefined;
  onCloseWorkspace: (() => void) | undefined;
  onPaneClick: (index: number) => void;
  onClosePane: (paneId: string) => void;
  onAddPane: (groupId: string) => void;
  onCloseGroup: (() => void) | undefined;
}

export function SelectWorkspace() {
  const {
    activeWorkspace,
    currentPanes,
    activePaneIndex,
    activeGroupInfo,
    systemStats,
    onAddGroup,
    onRenameWorkspace,
    onDeleteWorkspace,
    onCloseWorkspace,
    onPaneClick,
    onClosePane,
    onAddPane,
    onCloseGroup,
  } = useOutletContext<OutletContext>();

  if (!activeWorkspace) {
    return (
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          activeWorkspace={undefined}
          onAddGroup={undefined}
          onRenameWorkspace={() => {}}
          onDeleteWorkspace={() => {}}
          onCloseWorkspace={() => {}}
          onOpenSettings={() => {}}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-[#555555] text-lg font-mono mb-2">Select a workspace</div>
            <div className="text-[#444444] text-sm font-mono">Choose a workspace from the sidebar to get started</div>
          </div>
        </div>
        <StatusBar
          ramPercent={systemStats.ram_percentage}
          cpuPercent={systemStats.cpu_usage}
          activeGroup={undefined}
          activePane={undefined}
          workspacePath={undefined}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <TopBar
        activeWorkspace={activeWorkspace}
        onAddGroup={onAddGroup || (() => {})}
        onRenameWorkspace={onRenameWorkspace || (() => {})}
        onDeleteWorkspace={onDeleteWorkspace || (() => {})}
        onCloseWorkspace={onCloseWorkspace || (() => {})}
        onOpenSettings={() => {}}
      />
      <div className="flex-1 bg-bg overflow-hidden">
        <Group
          pane={currentPanes}
          activePaneIndex={activePaneIndex}
          onPaneClick={onPaneClick}
          onClosePane={onClosePane}
          onAddPane={onAddPane}
          onCloseGroup={onCloseGroup || (() => {})}
          workspacePath={activeWorkspace.path}
        />
      </div>
      <StatusBar
        ramPercent={systemStats.ram_percentage}
        cpuPercent={systemStats.cpu_usage}
        activeGroup={activeGroupInfo?.groupIndex}
        activePane={activeGroupInfo?.paneIndex}
        workspacePath={activeWorkspace.path}
      />
    </div>
  );
}