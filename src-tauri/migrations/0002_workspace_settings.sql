ALTER TABLE workspaces ADD COLUMN layout TEXT;
ALTER TABLE workspaces ADD COLUMN terminal_count INTEGER DEFAULT 1;
ALTER TABLE workspaces ADD COLUMN agent TEXT DEFAULT 'claude';
