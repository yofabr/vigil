import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Pin, Plus, Settings, Edit3, Trash2 } from 'lucide-react';
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
  onRenameWorkspace?: (id: string, name: string) => void;
  onDeleteWorkspace?: (id: string) => void;
  loadWorkspaces: () => Promise<void>;
}

const SIDEBAR_EXPANDED_WIDTH = 220;
const SIDEBAR_COLLAPSED_WIDTH = 56;
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
  onRenameWorkspace,
  onDeleteWorkspace,
  loadWorkspaces,
}: SidebarProps) {
  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; workspaceId: string } | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const isCollapsed = width <= SIDEBAR_COLLAPSED_WIDTH + 10;

  useEffect(() => {
    if (editingWorkspaceId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingWorkspaceId]);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  const handleStartRename = (ws: Workspace) => {
    setEditingWorkspaceId(ws.id);
    setEditingName(ws.name);
    setContextMenu(null);
  };

  const handleFinishRename = async () => {
    if (!editingWorkspaceId || !editingName.trim()) {
      setEditingWorkspaceId(null);
      setEditingName('');
      return;
    }
    try {
      await onRenameWorkspace?.(editingWorkspaceId, editingName.trim());
      await loadWorkspaces();
    } catch (err) {
      console.error('Rename failed:', err);
    } finally {
      setEditingWorkspaceId(null);
      setEditingName('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFinishRename();
    } else if (e.key === 'Escape') {
      setEditingWorkspaceId(null);
      setEditingName('');
    }
  };

  const handleContextMenu = (e: React.MouseEvent, workspaceId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, workspaceId });
  };
  
  const handleToggleCollapse = () => {
    onWidthChange(isCollapsed ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH);
  };
  
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
      const newWidth = Math.max(SIDEBAR_COLLAPSED_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, resizeRef.current.startWidth + delta));
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

    if (isCollapsed) {
      return (
        <div
          key={ws.id}
          draggable
          onDragStart={(e) => handleDragStart(e, adjustedIndex)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, adjustedIndex)}
          onClick={() => onWorkspaceSelect(ws.id)}
          onContextMenu={(e) => handleContextMenu(e, ws.id)}
          className={`
            flex items-center justify-center py-3 cursor-pointer select-none
            transition-colors duration-150 relative
            ${isActive 
              ? 'bg-surface text-[#ffffff]' 
              : 'text-[#aaaaaa] hover:bg-[#333333] hover:text-[#ffffff]'
            }
          `}
          title={ws.name}
        >
          <div className="flex flex-col items-center gap-1">
            <div className="relative">
              <span 
                className="w-3 h-3 block rounded-sm" 
                style={{ backgroundColor: ws.color }}
              />
              {ws.isPinned && (
                <Pin className="absolute -top-1 -right-1 w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
              )}
            </div>
          </div>
        </div>
      );
    }

    const isEditing = editingWorkspaceId === ws.id;

    return (
      <div
        key={ws.id}
        draggable
        onDragStart={(e) => handleDragStart(e, adjustedIndex)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, adjustedIndex)}
        onClick={() => !isEditing && onWorkspaceSelect(ws.id)}
        onContextMenu={(e) => handleContextMenu(e, ws.id)}
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
          {ws.isPinned && <Pin className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
          <span 
            className="w-2 h-2 flex-shrink-0" 
            style={{ backgroundColor: ws.color }}
          />
          {isEditing ? (
            <input
              ref={editInputRef}
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={handleFinishRename}
              onKeyDown={handleKeyDown}
              className="flex-1 px-1 py-0 bg-surface border border-white/30 text-xs text-text-active font-mono focus:outline-none"
            />
          ) : (
            <span className="text-xs truncate flex-1">{ws.name}</span>
          )}
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
      {!isCollapsed && (
        <div
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-white transition-colors duration-100 z-10"
          style={{ cursor: 'col-resize' }}
          onMouseDown={handleResizeStart}
        />
      )}
      
      {/* Collapse Toggle */}
      <button
        onClick={handleToggleCollapse}
        className={`
          absolute top-1/2 -translate-y-1/2 z-20
          flex items-center justify-center
          w-5 h-10 
          bg-bg border border-border-inactive
          text-[#aaaaaa] hover:text-white hover:bg-[#333333]
          cursor-pointer
          ${isCollapsed ? 'right-0 rounded-l-md' : 'left-0 rounded-r-md'}
        `}
        style={isCollapsed ? { left: 0 } : { right: 0 }}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Workspace List */}
      <div className="flex-1 overflow-y-auto py-2">
        {pinnedWorkspaces.length > 0 && !isCollapsed && (
          <div className="px-3 py-1">
            <span className="text-[9px] text-[#888888] uppercase tracking-wider">
              Pinned
            </span>
          </div>
        )}
        {pinnedWorkspaces.map((ws) => renderWorkspaceItem(ws, true))}
        
        {unpinnedWorkspaces.length > 0 && (
          <>
            {(!isCollapsed && pinnedWorkspaces.length > 0) && (
              <div className="px-3 py-1 mt-2">
                <span className="text-[9px] text-[#888888] uppercase tracking-wider">
                  Workspaces
                </span>
              </div>
            )}
            {unpinnedWorkspaces.map((ws) => renderWorkspaceItem(ws, false))}
          </>
        )}
        
        {workspaces.length === 0 && !isCollapsed && (
          <div className="px-3 py-4 text-center text-[10px] text-[#aaaaaa]">
            No workspaces yet
          </div>
        )}
      </div>

      {contextMenu && (
        <div
          className="fixed bg-bg border border-border-inactive shadow-lg z-50 py-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => {
              const ws = workspaces.find(w => w.id === contextMenu.workspaceId);
              if (ws) handleStartRename(ws);
            }}
            className="w-full px-3 py-1.5 text-left text-xs font-mono text-[#aaaaaa] hover:bg-[#333333] hover:text-white flex items-center gap-2"
          >
            <Edit3 className="w-3 h-3" />
            Rename
          </button>
          <button
            onClick={() => {
              onDeleteWorkspace?.(contextMenu.workspaceId);
              setContextMenu(null);
            }}
            className="w-full px-3 py-1.5 text-left text-xs font-mono text-red-400 hover:bg-red-400/10 flex items-center gap-2"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        </div>
      )}

      {/* New Workspace Button */}
      <div className={`p-2 border-t border-border-inactive ${isCollapsed ? 'px-1' : ''}`}>
        {isCollapsed ? (
          <div className="flex flex-col gap-2">
            <button
              onClick={onNewWorkspace}
              className="flex items-center justify-center py-2 border border-border-inactive bg-transparent text-[#aaaaaa] hover:text-white hover:bg-[#333333] transition-colors duration-150 cursor-pointer"
              title="New workspace"
            >
              <Plus className="w-4 h-4" />
            </button>
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="flex items-center justify-center py-2 border border-border-inactive bg-transparent text-[#aaaaaa] hover:text-white hover:bg-[#333333] transition-colors duration-150 cursor-pointer"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </aside>
  );
}
