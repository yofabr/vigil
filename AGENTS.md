# AGENTS.md - Developer Guide for Vigil

Vigil is a Tauri v2 desktop application with React 19, TypeScript, Vite, and TailwindCSS v4.

## Build Commands

This project uses **bun** as the package manager. Use bun commands instead of npm.

```bash
# Frontend development
bun run dev              # Start Vite dev server on port 1420

# Frontend production build
bun run build            # Run tsc + vite build (outputs to dist/)

# Tauri commands
bun run tauri dev        # Start Tauri in development mode
bun run tauri build      # Build production Tauri app
bun run tauri preview    # Preview built Tauri app

# Rust backend (src-tauri/)
cd src-tauri && cargo build       # Debug build
cd src-tauri && cargo build --release  # Release build
cd src-tauri && cargo test        # Run Rust tests
cd src-tauri && cargo check       # Type check Rust
```

### Running a Single Test

No test framework is currently configured for the frontend. For Rust tests:
```bash
cd src-tauri && cargo test <test_name_pattern>
```

## Code Style Guidelines

### TypeScript

- **Strict mode**: Always enabled in tsconfig.json
- **No unused locals/parameters**: Enforced by compiler
- Use explicit types for function parameters and return types
- Use `interface` for object shapes, `type` for unions/aliases

### React

- Use function components with hooks (useState, useCallback, useMemo)
- Wrap event handlers in useCallback to prevent unnecessary re-renders
- Destructure props for clarity
- Default prop values: Use ES6 defaults in function signature

```tsx
// Good
interface PaneProps {
  index: number;
  isActive: boolean;
  onClick: () => void;
  canClose?: boolean;
}

export function Pane({ index, isActive, onClick, canClose = true }: PaneProps) {
  // ...
}
```

### Imports

- Use absolute imports from project root (configured in tsconfig)
- Group imports: React → external libs → internal components/types
- Use index.ts files for barrel exports

```tsx
import { useState, useCallback } from 'react';
import { Sidebar, TopBar, Layer } from './components';
import { Workspace, Pane, generateWorkspaceName } from './types';
```

### Naming Conventions

- **Files**: PascalCase for components (Pane.tsx), camelCase for utilities
- **Components**: PascalCase (export function Pane)
- **Types/Interfaces**: PascalCase (Workspace, Pane)
- **Constants**: SCREAMING_SNAKE_CASE (WORKSPACE_COLORS)
- **Functions**: camelCase (generatePaneId)

### Error Handling

- Use early returns for guard clauses
- Check for null/undefined before accessing properties
- Use optional chaining (`?.`) and nullish coalescing (`??`) appropriately

```tsx
// Good
if (!targetPane) return;

const activeLayerId = findLayerContainingPane(currentP, paneId);
if (!activeLayerId) return;
```

### TailwindCSS v4

- Use utility classes for all styling (no custom CSS files except index.css)
- Use arbitrary values for specific colors: `text-[#555555]`
- Use semantic tokens where possible: `bg-surface`, `bg-bg`, `text-[#555555]`
- Use `font-mono` for monospace text
- Use CSS functions: `calc()`, `h-[calc(100%-24px)]`

```tsx
<div className="h-6 flex items-center justify-between px-2 bg-bg cursor-pointer">
```

### State Management

- Use useState for local component state
- Use useCallback for function props to maintain referential equality
- Lift state to common ancestor when needed across components

### Rust/Tauri Backend

- Located in `src-tauri/` directory
- Use `#[tauri::command]` for IPC commands
- Follow standard Rust idioms (cargo clippy warnings)

## Project Structure

```
/src                  # React frontend
  /components         # React components
  /types             # TypeScript types and utilities
  App.tsx            # Main application component
  main.tsx           # Entry point
/src-tauri           # Rust backend
  /src
    main.rs          # Binary entry point
    lib.rs           # Library with Tauri commands
  Cargo.toml         # Rust dependencies
  tauri.conf.json   # Tauri configuration
```

## Key Configuration Files

- `tsconfig.json` - TypeScript configuration (strict mode)
- `vite.config.ts` - Vite + React + TailwindCSS plugins
- `tailwind.config.js` - Not needed (v4 uses CSS)
- `src/index.css` - TailwindCSS v4 entry with @import "tailwindcss"
