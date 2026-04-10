-- Migration 0001: Initial schema (groups removed - panes at workspace level)

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
    agent TEXT,
    split_type TEXT CHECK (split_type IN ('HORIZONTAL', 'VERTICAL')),
    split_size REAL
);

CREATE TABLE IF NOT EXISTS panes (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    size REAL DEFAULT 50.0,
    split_type TEXT CHECK (split_type IN ('HORIZONTAL', 'VERTICAL')),
    mode TEXT NOT NULL CHECK (mode IN ('AGENT', 'TERMINAL')),
    agent_command TEXT,
    terminal_pid INTEGER
);

CREATE INDEX IF NOT EXISTS idx_panes_workspace ON panes(workspace_id);