import { useCallback, useRef } from 'react';
import { Layers, MousePointer } from 'lucide-react';
import { DbPane } from '../types';
import { Pane } from './Pane';

interface LayoutProps {
  panes: DbPane[];
  activePaneIndex: number;
  workspaceId: string;
  onPaneClick: (index: number) => void;
  onClosePane?: (paneId: string) => void;
  onResizePane?: (paneId: string, size: number) => void;
}

const MIN_PANE_WIDTH = 200;

export function Group({
  panes,
  activePaneIndex,
  workspaceId,
  onPaneClick,
  onClosePane,
  onResizePane,
}: LayoutProps) {
  const totalPanes = panes.length;
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<{ 
    index: number; 
    startX: number; 
    startLeftWidth: number;
    startRightWidth: number;
  } | null>(null);

  const handleResizeStart = useCallback((e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    const leftEl = document.getElementById(`pane-${index}`);
    const rightEl = document.getElementById(`pane-${index + 1}`);
    
    if (!leftEl || !rightEl) return;
    
    resizeRef.current = {
      index,
      startX: e.clientX,
      startLeftWidth: leftEl.clientWidth,
      startRightWidth: rightEl.clientWidth,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizeRef.current || !leftEl || !rightEl) return;
      
      const delta = moveEvent.clientX - resizeRef.current.startX;
      const newLeft = Math.max(MIN_PANE_WIDTH, resizeRef.current.startLeftWidth + delta);
      const newRight = Math.max(MIN_PANE_WIDTH, resizeRef.current.startRightWidth - delta);
      
      leftEl.style.width = `${newLeft}px`;
      rightEl.style.width = `${newRight}px`;
    };
    
    const handleMouseUp = () => {
      if (!resizeRef.current || !onResizePane) {
        resizeRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'default';
        return;
      }
      
      const leftEl = document.getElementById(`pane-${resizeRef.current.index}`);
      const rightEl = document.getElementById(`pane-${resizeRef.current.index + 1}`);
      
      if (leftEl && rightEl && containerRef.current) {
        const totalWidth = containerRef.current.offsetWidth;
        const leftPercent = (leftEl.offsetWidth / totalWidth) * 100;
        const rightPercent = (rightEl.offsetWidth / totalWidth) * 100;
        
        onResizePane(panes[resizeRef.current.index].id, leftPercent);
        onResizePane(panes[resizeRef.current.index + 1].id, rightPercent);
      }
      
      resizeRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };
    
    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [panes, onResizePane]);

  if (!panes || panes.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-bg">
        <div className="text-center p-8 max-w-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface/30 mb-4">
            <Layers className="w-8 h-8 text-[#666666]" />
          </div>
          <h3 className="text-lg text-[#aaaaaa] font-medium mb-2">No Panes Yet</h3>
          <p className="text-sm text-[#666666] mb-4">
            Add panes to this workspace to get started.
          </p>
          <div className="flex flex-col gap-2 text-xs text-[#555555] font-mono">
            <div className="flex items-center gap-2 justify-center">
              <MousePointer className="w-3 h-3" />
              <span>Click "Add Pane" in the top bar</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex w-full h-full">
      {panes.map((pane, idx) => {
        const isActive = idx === activePaneIndex;
        
        return (
          <div
            key={pane.id}
            id={`pane-${idx}`}
            className="relative h-full border-r border-border-inactive"
            style={{ 
              minWidth: `${MIN_PANE_WIDTH}px`,
              flex: '1 1 auto',
            }}
          >
            <Pane
              id={pane.id}
              workspaceId={workspaceId}
              index={idx}
              isActive={isActive}
              totalPanes={totalPanes}
              mode={pane.mode}
              agentCommand={pane.agent_command}
              onClick={() => onPaneClick(idx)}
              onClose={onClosePane ? () => onClosePane(pane.id) : undefined}
            />

            {idx < panes.length - 1 && (
              <div
                id={`resize-${idx}`}
                className="absolute right-0 top-0 bottom-0 w-2 hover:bg-white/50 cursor-col-resize"
                style={{ zIndex: 10 }}
                onMouseDown={(e) => handleResizeStart(e, idx)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}