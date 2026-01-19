# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

mkdedit is a browser-based Markdown editor with live preview, using Nuemark for server-side rendering. It features native file system access (Chrome/Edge), a resizable split-pane editor/preview, and optional Linguix grammar checking.

## Development Commands

```bash
# Install dependencies (uses Bun)
bun install

# Run the development server (port 4000 by default, configured in site.yaml)
bunx nue serve
```

## Architecture

**Client-Server Split:**
- `index.html` / `index.js` / `index.css` - Client-side SPA in the root directory
- `server/index.js` - Server-side API endpoints using Nue.js routing

**Key Components:**
- `MarkdownEditor` class (index.js) - Main application class handling:
  - File System Access API for native open/save dialogs (Chrome/Edge 86+)
  - Live preview via server-side Nuemark rendering (`POST /api/render`)
  - Linguix SDK integration for grammar checking (API key stored in localStorage)
  - Resizable splitter between editor and preview panes
  - Keyboard shortcut: `Ctrl+S` to save

**Server Endpoints (server/index.js):**
- `POST /api/render` - Server-side Nuemark markdown-to-HTML rendering
- `GET /api/files/:filename` - Read markdown files from `docs/` directory
- `POST /api/files/:filename` - Save markdown files to `docs/` directory
- `GET /api/files` - List all `.md` files in `docs/` directory

Note: Server uses Nue.js built-in routing - `get()` and `post()` are global functions, not Express middleware. The `docs/` directory is auto-created on first file operation.

**Configuration:**
- `site.yaml` - Nue.js config (port, import maps, server directory location)
- `package.json` - Dependencies: nuemark (markdown), nueyaml (YAML parsing)

**Browser Compatibility:**
- Full functionality: Chrome 86+, Edge 86+
- Firefox: Requires `dom.fs.enabled` flag in about:config
- Safari: File System Access API not supported (fallback shows alert)
