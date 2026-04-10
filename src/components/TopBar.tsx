import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Plus, Settings, Trash2, Edit3, X } from 'lucide-react';
import { Workspace } from '../types';

const WORKSPACE_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6b7280', // gray
];

interface TopBarProps {
  activeWorkspace: Workspace | undefined;
  onAddPane?: () => void;
  onRenameWorkspace?: (name: string) => void;
  onChangeColor?: (color: string) => void;
  onDeleteWorkspace?: () => void;
  onOpenSettings?: () => void;
  onCloseWorkspace?: () => void;
}

export function TopBar({
  activeWorkspace,
  onAddPane,
  onRenameWorkspace,
  onChangeColor,
  onDeleteWorkspace,
  onOpenSettings,
  onCloseWorkspace,
}: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (showRenameDialog && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [showRenameDialog]);

  const handleRenameClick = () => {
    if (activeWorkspace) {
      setRenameValue(activeWorkspace.name);
      setShowRenameDialog(true);
      setMenuOpen(false);
    }
  };

  const handleRenameConfirm = () => {
    if (onRenameWorkspace && renameValue.trim() && activeWorkspace && renameValue.trim() !== activeWorkspace.name) {
      onRenameWorkspace(renameValue.trim());
    }
    setShowRenameDialog(false);
    setRenameValue('');
  };

  const handleRenameCancel = () => {
    setShowRenameDialog(false);
    setRenameValue('');
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameConfirm();
    } else if (e.key === 'Escape') {
      handleRenameCancel();
    }
  };

  const handleColorClick = (color: string) => {
    onChangeColor?.(color);
    setMenuOpen(false);
  };

  const menuItems = [
    ...(onCloseWorkspace && activeWorkspace ? [{ icon: X, label: 'Close Workspace', action: onCloseWorkspace }] : []),
    ...(onChangeColor && activeWorkspace ? [{ icon: X, label: 'Change Color', colorPicker: true }] : []),
    ...(onRenameWorkspace && activeWorkspace ? [{ icon: Edit3, label: 'Rename Workspace', action: handleRenameClick }] : []),
    ...(onDeleteWorkspace && activeWorkspace ? [{ icon: Trash2, label: 'Delete Workspace', action: onDeleteWorkspace, danger: true }] : []),
    ...(onOpenSettings ? [{ icon: Settings, label: 'Settings', action: onOpenSettings }] : []),
  ];

  return (
    <header className="h-8 bg-bg border-b border-border-inactive flex items-center justify-between px-3 font-mono">
      <div className="flex items-center gap-4">
        {showRenameDialog ? (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={handleRenameKeyDown}
              onBlur={handleRenameConfirm}
              className="px-2 py-0.5 bg-surface border border-white/30 text-xs text-text-active font-mono focus:outline-none"
            />
          </div>
        ) : (
          <div className="text-xs text-text-active tracking-wider">
            {activeWorkspace?.name || 'NO WORKSPACE'}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 text-[10px] text-text-inactive">
        {onAddPane && (
          <button
            onClick={onAddPane}
            className="text-[#aaaaaa] hover:text-white px-2 py-0.5 transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3 h-3" />
            Add Pane
          </button>
        )}

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-[#aaaaaa] hover:text-white p-1 transition-colors"
            title="Menu"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-bg border border-border-inactive shadow-lg z-50">
              {menuItems.map((item, idx) => (
                item.colorPicker ? (
                  <div key={idx} className="px-3 py-2">
                    <div className="text-[10px] text-text-inactive mb-2">Color</div>
                    <div className="flex flex-wrap gap-1">
                      {WORKSPACE_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => handleColorClick(color)}
                          className="w-4 h-4 rounded-sm hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <button
                    key={idx}
                    onClick={() => {
                      item.action && item.action();
                      setMenuOpen(false);
                    }}
                    className={`
                      w-full px-3 py-2 text-left text-[10px] transition-colors 
                      flex items-center gap-2
                      ${item.danger 
                        ? 'text-red-400 hover:text-red-300 hover:bg-red-400/10' 
                        : 'text-[#aaaaaa] hover:text-white hover:bg-[#333333]'
                      }
                    `}
                  >
                    {item.icon && <item.icon className="w-3 h-3" />}
                    {item.label}
                  </button>
                )
              ))}
              {menuItems.length === 0 && (
                <div className="px-3 py-2 text-[10px] text-[#666666]">
                  No options available
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}