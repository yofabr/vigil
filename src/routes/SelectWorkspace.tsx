import { useOutletContext } from "react-router-dom";
import { TopBar, StatusBar, Group } from "../components";
import { Workspace, Group as GroupType, DbPane } from "../types";

interface OutletContext {
  activeWorkspace: Workspace | undefined;
  groups: GroupType[];
  panesByGroup: Record<string, DbPane[]>;
  activePaneIndex: number;
  activeGroupInfo: { groupIndex: number; paneIndex: number } | null | undefined;
  systemStats: { ram_percentage: number; cpu_usage: number };
  totalPanes: number;
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
    groups,
    panesByGroup,
    activePaneIndex,
    activeGroupInfo,
    systemStats,
    totalPanes,
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
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-[#555555] text-lg font-mono mb-2">Select a workspace</div>
          <div className="text-[#444444] text-sm font-mono">Choose a workspace from the sidebar to get started</div>
        </div>
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
          groups={groups}
          panesByGroup={panesByGroup}
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
        totalPanes={totalPanes}
      />
    </div>
  );
}
