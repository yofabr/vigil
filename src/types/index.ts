export type PaneSplitType = 'horizontal' | 'vertical';

export interface Pane {
  id: string;
  split?: PaneSplitType;
  children?: Pane[];
  size?: number;
}

export interface Workspace {
  id: string;
  name: string;
  color: string;
  path?: string;
  description?: string;
  isPinned?: boolean;
  openCount?: number;
  lastOpenedAt?: string;
  agent?: string;
  terminalCount?: number;
}

export const WORKSPACE_COLORS = [
  '#ffffff',
  '#aaaaaa',
  '#777777',
  '#444444',
] as const;

export function generateWorkspaceName(index: number): string {
  return `ws-${String(index + 1).padStart(2, '0')}`;
}

export function generatePaneId(): string {
  return `pane-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function createDefaultPanes(): Pane {
  const pane1 = { id: generatePaneId() };
  const pc1: Pane = { id: generatePaneId(), split: 'vertical', children: [pane1] };
  
  return {
    id: generatePaneId(),
    split: 'horizontal',
    children: [pc1],
  };
}