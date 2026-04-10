import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => buttonRef.current?.focus(), 0);
    }
  }, [open]);

  if (!open) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div 
        className="relative bg-bg border border-border-inactive p-4 w-80 shadow-lg"
        onKeyDown={handleKeyDown}
      >
        <div className="text-sm text-text-active font-mono mb-2">{title}</div>
        <div className="text-xs text-text-inactive mb-4">{message}</div>
        
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-mono text-text-inactive hover:text-text-active transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            ref={buttonRef}
            onClick={onConfirm}
            className={`
              px-3 py-1.5 text-xs font-mono transition-colors
              ${danger 
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                : 'bg-white/10 text-text-active hover:bg-white/20'
              }
            `}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}