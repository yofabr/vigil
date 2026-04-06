interface PaneProps {
  index: number;
  isActive: boolean;
  totalPanes: number;
  onClick: () => void;
  onClose?: () => void;
  canClose?: boolean;
  workspacePath?: string;
}

export function Pane({ 
  index, 
  isActive, 
  totalPanes, 
  onClick,
  onClose,
  canClose = true,
  workspacePath,
}: PaneProps) {
  const label = `PANE ${index + 1}`;
  const borderColor = isActive ? '#ffffff' : '#333333';
  
  return (
    <div 
      onClick={onClick}
      className="h-full w-full bg-surface"
    >
      <div 
        className="h-6 flex items-center justify-between px-2 bg-bg cursor-pointer"
        style={{ borderBottom: `1px solid ${borderColor}` }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#aaaaaa] uppercase tracking-wider font-mono">
            {label}
          </span>
          {workspacePath && (
            <span className="text-[10px] text-[#aaaaaa] font-mono truncate max-w-[200px]">
              {workspacePath}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onClose && canClose && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="text-[#aaaaaa] hover:text-white transition-colors text-xs"
            >
              ✕
            </button>
          )}
          <span className="text-[10px] text-[#aaaaaa] font-mono">
            {index + 1}/{totalPanes}
          </span>
        </div>
      </div>
      
      <div className="h-[calc(100%-24px)] bg-surface overflow-hidden p-2">
        <pre className="text-[10px] text-[#aaaaaa] font-mono">
{`$ ./vigil --workspace ws-${String(index + 1).padStart(2, '0')}
> Initializing terminal...
> Workspace loaded successfully

$ _`}
        </pre>
      </div>
    </div>
  );
}
