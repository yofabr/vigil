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
    open_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pane_trees (
    workspace_id TEXT PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
    active_pane_index INTEGER DEFAULT 0,
    tree_json TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
);
