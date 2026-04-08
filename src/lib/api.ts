import { invoke } from '@tauri-apps/api/core';
import type {
  Workspace,
  WorkspaceCreateInput,
  WorkspaceUpdateInput,
  Group,
  GroupCreateInput,
  GroupUpdateInput,
  DbPane,
  PaneCreateInput,
  PaneUpdateInput,
} from '../types';

async function tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  return invoke<T>(cmd, args);
}

export const api = {
  async getWorkspaces(): Promise<Workspace[]> {
    return tauriInvoke<Workspace[]>('get_workspaces');
  },

  async getWorkspace(id: string): Promise<Workspace | null> {
    return tauriInvoke<Workspace | null>('get_workspace', { id });
  },

  async createWorkspace(input: WorkspaceCreateInput): Promise<Workspace> {
    return tauriInvoke<Workspace>('create_workspace', { input });
  },

  async updateWorkspace(id: string, input: WorkspaceUpdateInput): Promise<Workspace> {
    return tauriInvoke<Workspace>('update_workspace', { id, input });
  },

  async deleteWorkspace(id: string): Promise<void> {
    return tauriInvoke<void>('delete_workspace', { id });
  },

  async getGroups(workspaceId: string): Promise<Group[]> {
    return tauriInvoke<Group[]>('get_groups', { workspaceId });
  },

  async createGroup(input: GroupCreateInput): Promise<Group> {
    return tauriInvoke<Group>('create_group', { input });
  },

  async updateGroup(id: string, input: GroupUpdateInput): Promise<Group> {
    return tauriInvoke<Group>('update_group', { id, input });
  },

  async deleteGroup(id: string): Promise<void> {
    return tauriInvoke<void>('delete_group', { id });
  },

  async getPanes(groupId: string): Promise<DbPane[]> {
    return tauriInvoke<DbPane[]>('get_panes', { groupId });
  },

  async getAllPanes(workspaceId: string): Promise<DbPane[]> {
    return tauriInvoke<DbPane[]>('get_all_panes', { workspaceId });
  },

  async createPane(input: PaneCreateInput): Promise<DbPane> {
    return tauriInvoke<DbPane>('create_pane', { input });
  },

  async updatePane(id: string, input: PaneUpdateInput): Promise<DbPane> {
    return tauriInvoke<DbPane>('update_pane', { id, input });
  },

  async deletePane(id: string): Promise<void> {
    return tauriInvoke<void>('delete_pane', { id });
  },
};
