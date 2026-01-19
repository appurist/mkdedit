# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

mkdedit is a browser-based Markdown editor with live preview, built with SolidJS and Vite. It uses `marked` for client-side GitHub-flavored markdown rendering. It features native file system access (Chrome/Edge), a resizable split-pane editor/preview, and keyboard shortcuts.

## Development Commands

```bash
# Install dependencies (uses Bun)
bun install

# Run the development server (port 4000)
bun run dev

# Production build
bun run build

# Preview production build
bun run preview
```

## Architecture

**Pure Client-Side SPA:**
- `index.html` - Vite entry point
- `src/index.jsx` - SolidJS mount point
- `src/App.jsx` - Root component with state management

**Components (src/components/):**
- `Toolbar.jsx` - File controls (New, Open, Save, Save As) and filename display
- `Editor.jsx` - Textarea pane for markdown input
- `Preview.jsx` - Rendered markdown preview pane
- `Splitter.jsx` - Resizable divider between panes

**Hooks (src/hooks/):**
- `useFileSystem.js` - File System Access API for native file dialogs
- `useMarkdown.js` - marked library configuration for GFM parsing

**Styles:**
- `src/styles/index.css` - All application styles including markdown preview

**Configuration:**
- `vite.config.js` - Vite config with SolidJS plugin, port 4000
- `package.json` - Dependencies: solid-js, marked, vite, vite-plugin-solid

**Features:**
- New/Open/Save/Save As with native file dialogs
- Current filename display with dirty indicator (*)
- Resizable splitter between panes
- Ctrl+S keyboard shortcut
- GitHub-flavored markdown (tables, strikethrough, task lists)
- Browser compatibility notice when File System Access API unavailable

**Browser Compatibility:**
- Full functionality: Chrome 86+, Edge 86+
- Firefox: Requires `dom.fs.enabled` flag in about:config
- Safari: File System Access API not supported (fallback shows alert)
