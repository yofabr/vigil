import { Workspace, Pane } from '../types';

interface TopBarProps {
  activeWorkspace: Workspace | undefined;
  paneCount: number;
  onSplitHorizontal: () => void;
  onSplitVertical: () => void;
  onClosePane: () => void;
}

function countPanes(pane: Pane): number {
  if (!pane.children || pane.children.length === 0) {
    return 1;
  }
  return pane.children.reduce((acc, child) => acc + countPanes(child), 0);
}

export function TopBar({
  activeWorkspace,
  paneCount,
  onSplitHorizontal,
  onSplitVertical,
  onClosePane,
}: TopBarProps) {
  return (
    <header className="h-8 bg-bg border-b border-border-inactive flex items-center justify-between px-3 font-mono">
      {/* Left: Workspace name */}
      <div className="text-xs text-text-active tracking-wider">
        {activeWorkspace?.name || 'NO WORKSPACE'}
      </div>

      {/* Right: Pane controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onSplitHorizontal}
          className="
            px-2 py-0.5 
            text-xs 
            text-text-inactive 
            border border-border-inactive 
            bg-transparent 
            hover:bg-border-active 
            hover:text-bg 
            transition-colors 
            duration-150
            cursor-pointer
          "
          title="Split Horizontal"
        >
          [H]
        </button>
        <button
          onClick={onSplitVertical}
          className="
            px-2 py-0.5 
            text-xs 
            text-text-inactive 
            border border-border-inactive 
            bg-transparent 
            hover:bg-border-active 
            hover:text-bg 
            transition-colors 
            duration-150
            cursor-pointer
          "
          title="Split Vertical"
        >
          [V]
        </button>
        <button
          onClick={onClosePane}
          className="
            px-2 py-0.5 
            text-xs 
            text-text-inactive 
            border border-border-inactive 
            bg-transparent 
            hover:bg-border-active 
            hover:text-bg 
            transition-colors 
            duration-150
            cursor-pointer
            disabled:opacity-30 disabled:cursor-not-allowed
          "
          disabled={paneCount <= 1}
          title="Close Pane"
        >
          [X]
        </button>
        <span className="text-xs text-text-inactive ml-1">
          {paneCount} {paneCount === 1 ? 'pane' : 'panes'}
        </span>
      </div>
    </header>
  );
}

export { countPanes };