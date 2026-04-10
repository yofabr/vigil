import { useEffect, useRef, useCallback, useState } from 'react';
import { Terminal as Xterm } from '@xterm/xterm';
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  id: string;
  workspaceId: string;
  isActive: boolean;
  rows?: number;
  cols?: number;
}

export function Terminal({ id, workspaceId, isActive, rows = 24, cols = 80 }: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Xterm | null>(null);
  const unlistenRef = useRef<UnlistenFn[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const ptyId = `${workspaceId}-${id}`;

  const initTerminal = useCallback(async () => {
    if (!containerRef.current || terminalRef.current) return;

    const term = new Xterm({
      rows,
      cols,
      fontSize: 12,
      fontFamily: 'monospace',
      cursorBlink: true,
      allowTransparency: true,
      theme: {
        background: '#1e1e1e',
        foreground: '#cccccc',
        cursor: '#cccccc',
        selectionBackground: '#264f78',
      },
    });

    terminalRef.current = term;
    term.open(containerRef.current);

    try {
      await invoke('pty_create', { id: ptyId, rows, cols, shell: null });
    } catch (err) {
      term.writeln(`Failed to create PTY: ${err}`);
      return;
    }

    term.onData(async (data) => {
      try {
        await invoke('pty_write', { id: ptyId, data });
      } catch (err) {
        term.writeln(`\r\nWrite error: ${err}`);
      }
    });

    const unlistenData = await listen<string>(`pty-data-${ptyId}`, (event) => {
      if (terminalRef.current) {
        terminalRef.current.write(event.payload);
      }
    });
    unlistenRef.current.push(unlistenData);

    const unlistenExit = await listen(`pty-exit-${ptyId}`, () => {
      if (terminalRef.current) {
        terminalRef.current.writeln('\r\n\r\n[Process exited]\r\n');
      }
    });
    unlistenRef.current.push(unlistenExit);

    setIsInitialized(true);
  }, [ptyId, rows, cols]);

  useEffect(() => {
    initTerminal();

    return () => {
      unlistenRef.current.forEach((fn) => fn());
      if (terminalRef.current) {
        terminalRef.current.dispose();
      }
      invoke('pty_kill', { id: ptyId }).catch(() => {});
      terminalRef.current = null;
    };
  }, [ptyId, initTerminal]);

  useEffect(() => {
    if (isActive && terminalRef.current) {
      terminalRef.current.focus();
    }
  }, [isActive]);

  useEffect(() => {
    if (!containerRef.current || !terminalRef.current || !isInitialized) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const newCols = Math.max(1, Math.floor(width / 7.5));
        const newRows = Math.max(1, Math.floor(height / 17));

        if (newCols > 0 && newRows > 0) {
          terminalRef.current?.resize(newCols, newRows);
          invoke('pty_resize', { id: ptyId, rows: newRows, cols: newCols }).catch(() => {});
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [ptyId, isInitialized]);

  return <div ref={containerRef} className="h-full w-full" />;
}