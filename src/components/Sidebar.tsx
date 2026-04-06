import { useRef } from 'react';
import { Workspace } from '../types';

interface SidebarProps {
  width: number;
  onWidthChange: (width: number) => void;
  workspaces: Workspace[];
  activeWorkspaceId: string;
  onWorkspaceSelect: (id: string) => void;
  onWorkspaceReorder: (workspaces: Workspace[]) => void;
  onNewWorkspace: () => void;
  onOpenSettings?: () => void;
}

const SIDEBAR_MIN_WIDTH = 200;
const SIDEBAR_MAX_WIDTH = 400;

export function Sidebar({
  width,
  onWidthChange,
  workspaces,
  activeWorkspaceId,
  onWorkspaceSelect,
  onWorkspaceReorder,
  onNewWorkspace,
  onOpenSettings,
}: SidebarProps) {
  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null);
  
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!isNaN(dragIndex) && dragIndex !== dropIndex) {
      const newWorkspaces = [...workspaces];
      const [removed] = newWorkspaces.splice(dragIndex, 1);
      newWorkspaces.splice(dropIndex, 0, removed);
      onWorkspaceReorder(newWorkspaces);
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    resizeRef.current = {
      startX: e.clientX,
      startWidth: width,
    };
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizeRef.current) return;
      const delta = moveEvent.clientX - resizeRef.current.startX;
      const newWidth = Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, resizeRef.current.startWidth + delta));
      onWidthChange(newWidth);
    };
    
    const handleMouseUp = () => {
      resizeRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };
    
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const pinnedWorkspaces = workspaces.filter(w => w.isPinned);
  const unpinnedWorkspaces = workspaces.filter(w => !w.isPinned);

  const renderWorkspaceItem = (ws: Workspace, isPinnedSection: boolean) => {
    const isActive = ws.id === activeWorkspaceId;
    const adjustedIndex = isPinnedSection 
      ? pinnedWorkspaces.findIndex(w => w.id === ws.id)
      : pinnedWorkspaces.length + unpinnedWorkspaces.findIndex(w => w.id === ws.id);

    return (
      <div
        key={ws.id}
        draggable
        onDragStart={(e) => handleDragStart(e, adjustedIndex)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, adjustedIndex)}
        onClick={() => onWorkspaceSelect(ws.id)}
        className={`
          flex flex-col gap-1 px-3 py-2 cursor-pointer select-none
          transition-colors duration-150
          ${isActive 
            ? 'bg-surface text-[#ffffff]' 
            : 'text-[#aaaaaa] hover:bg-[#333333] hover:text-[#ffffff]'
          }
        `}
      >
        <div className="flex items-center gap-2">
          {ws.isPinned && <span className="text-[10px] text-[#aaaaaa]">★</span>}
          <span className="text-[10px] opacity-50">⇿</span>
          <span 
            className="w-2 h-2 flex-shrink-0" 
            style={{ backgroundColor: ws.color }}
          />
          <span className="text-xs truncate flex-1">{ws.name}</span>
        </div>
        
        <div className="flex flex-col gap-0.5 ml-4 text-[10px] text-[#888888]">
          {ws.path && (
            <span className="truncate opacity-70">{ws.path}</span>
          )}
          {ws.description && (
            <span className="truncate opacity-50">{ws.description}</span>
          )}
          <div className="flex gap-2 opacity-50">
            <span>Agent: {ws.agent || 'none'}</span>
            <span>·</span>
            <span>Terms: {ws.terminalCount || 1}</span>
            <span>·</span>
            <span>{ws.openCount || 0} opens</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <aside 
      className="h-full bg-bg border-r border-border-inactive flex flex-col font-mono relative"
      style={{ width: width + 'px' }}
    >
      {/* Resize Handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-white transition-colors duration-100"
        style={{ cursor: 'col-resize' }}
        onMouseDown={handleResizeStart}
      />
      
      {/* Workspace List */}
      <div className="flex-1 overflow-y-auto py-2">
        {pinnedWorkspaces.length > 0 && (
          <div className="px-3 py-1">
            <span className="text-[9px] text-[#888888] uppercase tracking-wider">
              Pinned
            </span>
          </div>
        )}
        {pinnedWorkspaces.map((ws) => renderWorkspaceItem(ws, true))}
        
        {unpinnedWorkspaces.length > 0 && (
          <>
            {pinnedWorkspaces.length > 0 && (
              <div className="px-3 py-1 mt-2">
                <span className="text-[9px] text-[#888888] uppercase tracking-wider">
                  Workspaces
                </span>
              </div>
            )}
            {unpinnedWorkspaces.map((ws) => renderWorkspaceItem(ws, false))}
          </>
        )}
        
        {workspaces.length === 0 && (
          <div className="px-3 py-4 text-center text-[10px] text-[#aaaaaa]">
            No workspaces yet
          </div>
        )}
      </div>

      {/* New Workspace Button */}
      <div className="p-2 border-t border-border-inactive">
        <button
          onClick={onNewWorkspace}
          className="
            w-full px-3 py-2 
            border border-border-inactive 
            bg-transparent 
            text-[#aaaaaa] 
            text-xs 
            font-mono 
            hover:bg-[#ffffff] 
            hover:text-bg 
            transition-colors 
            duration-150
            cursor-pointer
          "
        >
          [ + new workspace ]
        </button>
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="
              w-full px-3 py-2 mt-2
              border border-border-inactive 
              bg-transparent 
              text-[#aaaaaa] 
              text-xs 
              font-mono 
              hover:bg-[#ffffff] 
              hover:text-bg 
              transition-colors 
              duration-150
              cursor-pointer
            "
          >
            [ settings ]
          </button>
        )}
      </div>
    </aside>
  );
}
