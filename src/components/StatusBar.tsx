interface StatusBarProps {
  ramPercent: number;
  cpuPercent: number;
  activeGroup?: number;
  activePane?: number;
  workspacePath?: string;
}

export function StatusBar({
  ramPercent,
  cpuPercent,
  activeGroup,
  activePane,
  workspacePath,
}: StatusBarProps) {
  return (
    <footer className="h-6 bg-bg border-t border-border-inactive flex items-center justify-between px-3 font-mono text-[10px] text-text-inactive">
      <div className="flex items-center gap-4">
        {activeGroup !== undefined && activePane !== undefined && (
          <span>Selected: G{activeGroup + 1} - P{activePane + 1}</span>
        )}
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
