export type PaneSplitType = 'horizontal' | 'vertical';

export interface Pane {
  id: string;
  split?: PaneSplitType;
  children?: Pane[];
  size?: number;
}

export type PaneMode = 'AGENT' | 'TERMINAL';
export type SplitType = 'HORIZONTAL' | 'VERTICAL';

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
  split_type?: SplitType;
  split_size?: number;
}

export interface DbPane {
  id: string;
  workspace_id: string;
  order_index: number;
  size: number;
  split_type?: SplitType;
  mode: PaneMode;
  agent_command?: string;
  terminal_pid?: number;
}

export interface WorkspaceCreateInput {
  name: string;
  color: string;
  path?: string;
  agent?: string;
}

export interface WorkspaceUpdateInput {
  name?: string;
  color?: string;
  path?: string;
  description?: string;
  isPinned?: number;
  agent?: string;
  split_type?: SplitType;
  split_size?: number;
}

export interface PaneCreateInput {
  workspace_id: string;
  order_index: number;
  size?: number;
  split_type?: SplitType;
  mode: PaneMode;
  agent_command?: string;
}

export interface PaneUpdateInput {
  order_index?: number;
  size?: number;
  split_type?: SplitType;
  mode?: PaneMode;
  agent_command?: string;
  terminal_pid?: number;
}

export const WORKSPACE_COLORS = [
  '#3b82f6', // blue-500
  '#22c55e', // green-500
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#eab308', // yellow-500
  '#6366f1', // indigo-500
  '#64748b', // slate-500
] as const;

export function generateWorkspaceName(index: number): string {
  return `ws-${String(index + 1).padStart(2, '0')}`;
}

export function generatePaneId(): string {
  return `pane-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function createDefaultPanes(): Pane {
  const pane1 = { id: generatePaneId() };
  const layer1: Pane = { id: generatePaneId(), split: 'vertical', children: [pane1] };
  
  return {
    id: generatePaneId(),
    split: 'horizontal',
    children: [layer1],
  };
}