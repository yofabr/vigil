-- Migration 0001: Initial schema with relational groups and panes

CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#ffffff',
    path TEXT,
    description TEXT,
    is_pinned INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    last_opened_at TEXT,
    open_count INTEGER DEFAULT 0,
    agent TEXT
);

CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    size REAL DEFAULT 50.0,
    split_type TEXT NOT NULL CHECK (split_type IN ('HORIZONTAL', 'VERTICAL'))
);

CREATE TABLE IF NOT EXISTS panes (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    size REAL DEFAULT 50.0,
    mode TEXT NOT NULL CHECK (mode IN ('AGENT', 'TERMINAL')),
    agent_command TEXT,
    terminal_pid INTEGER
);

CREATE INDEX IF NOT EXISTS idx_groups_workspace ON groups(workspace_id);
CREATE INDEX IF NOT EXISTS idx_panes_group ON panes(group_id);