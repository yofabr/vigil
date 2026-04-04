import { getCurrentWindow } from '@tauri-apps/api/window';

interface TitleBarProps {
  children?: React.ReactNode;
}

export function TitleBar({ children }: TitleBarProps) {
  const appWindow = getCurrentWindow();

  const handleMinimize = () => appWindow.minimize();
  const handleMaximize = async () => {
    const isMaximized = await appWindow.isMaximized();
    if (isMaximized) {
      appWindow.unmaximize();
    } else {
      appWindow.maximize();
    }
  };
  const handleClose = () => appWindow.close();

  return (
    <div
      data-tauri-drag-region
      className="h-8 bg-bg flex items-center justify-between select-none border-b border-border-inactive"
    >
      <div data-tauri-drag-region className="flex items-center px-3">
        <span className="text-xs text-text-inactive font-mono">vigil</span>
      </div>
      
      {children}

      <div className="flex h-full border-l border-border-inactive">
        <button
          onClick={handleMinimize}
          className="h-full px-4 text-text-inactive hover:bg-surface transition-colors cursor-pointer border-r border-border-inactive"
          title="Minimize"
        >
          <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
            <rect width="10" height="1" />
          </svg>
        </button>
        <button
          onClick={handleMaximize}
          className="h-full px-4 text-text-inactive hover:bg-surface transition-colors cursor-pointer border-r border-border-inactive"
          title="Maximize"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor">
            <rect x="0.5" y="0.5" width="9" height="9" />
          </svg>
        </button>
        <button
          onClick={handleClose}
          className="h-full px-4 text-text-inactive hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
          title="Close"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
