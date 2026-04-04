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

  return (
    <aside 
      className="h-full bg-bg border-r border-[#1a1a1a] flex flex-col font-mono relative"
      style={{ width: width + 'px' }}
    >
      {/* Resize Handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-white transition-colors duration-100"
        style={{ cursor: 'col-resize' }}
        onMouseDown={handleResizeStart}
      />
      
      {/* Wordmark */}
      <div className="h-8 flex items-center px-3 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-1 text-[#ffffff] text-xs tracking-wider">
          <span className="text-[#ffffff]">{'>'}</span>
          <span>VIGIL</span>
        </div>
      </div>

      {/* Workspace List */}
      <div className="flex-1 overflow-y-auto py-2">
        {workspaces.map((ws, index) => {
          const isActive = ws.id === activeWorkspaceId;
          return (
            <div
              key={ws.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onClick={() => onWorkspaceSelect(ws.id)}
              className={`
                flex items-center gap-2 px-3 py-2 cursor-pointer select-none
                transition-colors duration-150
                ${isActive 
                  ? 'bg-[#0d0d0d] text-[#ffffff] border-l-2 border-[#ffffff]' 
                  : 'text-[#555555] hover:bg-[#0d0d0d] hover:text-[#ffffff]'
                }
              `}
            >
              {/* Drag handle */}
              <span className="text-[#555555] text-xs opacity-50">⇿</span>
              
              {/* Status dot */}
              <span 
                className="w-2 h-2 flex-shrink-0" 
                style={{ backgroundColor: ws.color }}
              />
              
              {/* Workspace name */}
              <span className="text-xs truncate">{ws.name}</span>
            </div>
          );
        })}
      </div>

      {/* New Workspace Button */}
      <div className="p-2 border-t border-[#1a1a1a]">
        <button
          onClick={onNewWorkspace}
          className="
            w-full px-3 py-2 
            border border-[#1a1a1a] 
            bg-transparent 
            text-[#555555] 
            text-xs 
            font-mono 
            hover:bg-[#ffffff] 
            hover:text-[#0a0a0a] 
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
              border border-[#1a1a1a] 
              bg-transparent 
              text-[#555555] 
              text-xs 
              font-mono 
              hover:bg-[#ffffff] 
              hover:text-[#0a0a0a] 
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