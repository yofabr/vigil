interface PaneProps {
  index: number;
  isActive: boolean;
  totalPanes: number;
  onClick: () => void;
  onClose?: () => void;
  canClose?: boolean;
}

export function Pane({ 
  index, 
  isActive, 
  totalPanes, 
  onClick,
  onClose,
  canClose = true,
}: PaneProps) {
  const label = `PANE ${index + 1}`;
  const borderColor = isActive ? '#ffffff' : '#1a1a1a';
  
  return (
    <div 
      onClick={onClick}
      className="h-full w-full bg-surface"
    >
      <div 
        className="h-6 flex items-center justify-between px-2 bg-bg cursor-pointer"
        style={{ borderBottom: `1px solid ${borderColor}` }}
      >
        <span className="text-[10px] text-[#555555] uppercase tracking-wider font-mono">
          {label}
        </span>
        <div className="flex items-center gap-2">
          {onClose && canClose && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="text-[#555555] hover:text-white transition-colors text-xs"
            >
              ✕
            </button>
          )}
          <span className="text-[10px] text-[#555555] font-mono">
            {index + 1}/{totalPanes}
          </span>
        </div>
      </div>
      
      <div className="h-[calc(100%-24px)] bg-[#0d0d0d] overflow-hidden p-2">
        <pre className="text-[10px] text-[#555555] font-mono">
{`$ ./vigil --workspace ws-${String(index + 1).padStart(2, '0')}
> Initializing terminal...
> Workspace loaded successfully

$ _`}
        </pre>
      </div>
    </div>
  );
}
