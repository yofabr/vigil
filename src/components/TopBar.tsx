import { Workspace } from '../types';

interface SystemStats {
  workspace_path: string;
  ram_total: number;
  ram_used: number;
  ram_percentage: number;
  cpu_usage: number;
}

interface TopBarProps {
  activeWorkspace: Workspace | undefined;
  paneCount: number;
  systemStats: SystemStats | null;
}

export function TopBar({
  activeWorkspace,
  paneCount,
  systemStats,
}: TopBarProps) {
  const ramPercent = systemStats?.ram_percentage ?? 0;
  const cpuPercent = systemStats?.cpu_usage ?? 0;

  return (
    <header className="h-8 bg-bg border-b border-border-inactive flex items-center justify-between px-3 font-mono">
      {/* Left: Workspace name */}
      <div className="flex items-center gap-4">
        <div className="text-xs text-text-active tracking-wider">
          {activeWorkspace?.name || 'NO WORKSPACE'}
        </div>
        {systemStats && (
          <div className="text-xs text-text-inactive">
            {systemStats.workspace_path || 'No path'}
          </div>
        )}
      </div>

      {/* Right: System stats */}
      <div className="flex items-center gap-3 text-[10px] text-text-inactive">
        <span>RAM {ramPercent.toFixed(0)}%</span>
        <span>CPU {cpuPercent.toFixed(0)}%</span>
        <span>{paneCount} {paneCount === 1 ? 'pane' : 'panes'}</span>
      </div>
    </header>
  );
}
