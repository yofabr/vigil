import { Terminal } from './Terminal';

interface PaneProps {
  id: string;
  workspaceId: string;
  index: number;
  isActive: boolean;
  totalPanes: number;
  mode?: 'AGENT' | 'TERMINAL';
  agentCommand?: string;
  onClick: () => void;
  onClose?: () => void;
}

export function Pane({ 
  id,
  workspaceId,
  index, 
  isActive, 
  totalPanes, 
  mode = 'TERMINAL',
  agentCommand,
  onClick,
  onClose,
}: PaneProps) {
  const label = mode === 'AGENT' ? `AGENT ${agentCommand || '?'}` : `TERM ${index + 1}`;
  const borderColor = isActive ? '#ffffff' : '#333333';
  
  return (
    <div 
      onClick={onClick}
      className="h-full w-full bg-surface cursor-pointer"
    >
      <div 
        className="h-6 flex items-center justify-between px-2 bg-bg cursor-pointer"
        style={{ borderBottom: `1px solid ${borderColor}` }}
      >
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="text-[#aaaaaa] hover:text-red-400 transition-colors text-xs"
              title="Close pane"
            >
              ✕
            </button>
          )}
          <span className="text-[10px] text-[#aaaaaa] uppercase tracking-wider font-mono">
            {label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#aaaaaa] font-mono">
            {index + 1}/{totalPanes}
          </span>
        </div>
      </div>
      
      <div className="h-[calc(100%-24px)] bg-surface overflow-hidden">
        {mode === 'TERMINAL' ? (
          <Terminal id={id} workspaceId={workspaceId} isActive={isActive} rows={20} cols={80} />
        ) : (
          <div className="p-2">
            <pre className="text-[10px] text-[#aaaaaa] font-mono">
{`$ ./vigil --workspace ws-${String(index + 1).padStart(2, '0')}
> Initializing agent...
> Workspace loaded successfully

$ _`}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}