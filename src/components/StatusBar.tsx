interface StatusBarProps {
  activePaneIndex: number;
  workspacePath?: string;
  totalPanes: number;
  ramPercent: number;
  cpuPercent: number;
}

export function StatusBar({ activePaneIndex, workspacePath, totalPanes, ramPercent, cpuPercent }: StatusBarProps) {
  return (
    <footer className="h-6 bg-bg border-t border-border-inactive flex items-center justify-between px-3 font-mono text-[10px] text-text-inactive">
      <div className="flex items-center gap-4">
        <span>Pane {activePaneIndex + 1}/{totalPanes}</span>
        <span>RAM {ramPercent.toFixed(0)}%</span>
        <span>CPU {cpuPercent.toFixed(0)}%</span>
      </div>
      <div className="flex items-center gap-4">
        {workspacePath && (
          <span className="text-text-inactive/60">{workspacePath}</span>
        )}
      </div>
    </footer>
  );
}