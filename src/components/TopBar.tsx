import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Plus, Settings, Trash2, Edit3 } from 'lucide-react';
import { Workspace } from '../types';

interface TopBarProps {
  activeWorkspace: Workspace | undefined;
  onAddLayer?: () => void;
  onRenameWorkspace?: () => void;
  onDeleteWorkspace?: () => void;
  onOpenSettings?: () => void;
}

export function TopBar({
  activeWorkspace,
  onAddLayer,
  onRenameWorkspace,
  onDeleteWorkspace,
  onOpenSettings,
}: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    ...(onRenameWorkspace ? [{ icon: Edit3, label: 'Rename Workspace', action: onRenameWorkspace }] : []),
    ...(onDeleteWorkspace ? [{ icon: Trash2, label: 'Delete Workspace', action: onDeleteWorkspace, danger: true }] : []),
    ...(onOpenSettings ? [{ icon: Settings, label: 'Settings', action: onOpenSettings }] : []),
  ];

  return (
    <header className="h-8 bg-bg border-b border-border-inactive flex items-center justify-between px-3 font-mono">
      <div className="flex items-center gap-4">
        <div className="text-xs text-text-active tracking-wider">
          {activeWorkspace?.name || 'NO WORKSPACE'}
        </div>
      </div>

      <div className="flex items-center gap-3 text-[10px] text-text-inactive">
        {onAddLayer && (
          <button
            onClick={onAddLayer}
            className="text-[#aaaaaa] hover:text-white px-2 py-0.5 transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3 h-3" />
            Add Layer
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
                <button
                  key={idx}
                  onClick={() => {
                    item.action();
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
                  <item.icon className="w-3 h-3" />
                  {item.label}
                </button>
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
