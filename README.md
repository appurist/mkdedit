# mkdedit

A lightweight, cross-platform Markdown editor with live preview. Built with SolidJS and Tauri for native desktop performance.

## Features

- **Live Preview** - See your Markdown rendered in real-time as you type
- **GitHub-Flavored Markdown** - Tables, strikethrough, task lists, and fenced code blocks
- **Native File Dialogs** - Open, save, and create files with native OS dialogs
- **Resizable Split Pane** - Drag the splitter to adjust editor/preview ratio
- **Keyboard Shortcuts** - Ctrl+S to save
- **Cross-Platform** - Runs on Windows, macOS, and Linux

## Installation

Download the latest release for your platform from the [Releases](https://github.com/appurist/mkdedit/releases) page.

### Building from Source

Prerequisites:
- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/)
- [Rust](https://www.rust-lang.org/tools/install)

```bash
# Clone the repository
git clone https://github.com/appurist/mkdedit.git
cd mkdedit

# Install dependencies
pnpm install

# Run in development mode
pnpm tauri:dev

# Build for production
pnpm tauri:build
```

### Platform-Specific Builds

```bash
pnpm tauri:build:win    # Windows (NSIS installer + MSI)
pnpm tauri:build:mac    # macOS (DMG + .app bundle)
pnpm tauri:build:linux  # Linux (DEB + AppImage)
```

## Development

```bash
pnpm dev          # Start Vite dev server only
pnpm tauri:dev    # Start full Tauri development environment
```

## Tech Stack

- **Frontend**: [SolidJS](https://www.solidjs.com/) - Reactive UI framework
- **Markdown**: [marked](https://marked.js.org/) - Fast Markdown parser
- **Desktop**: [Tauri v2](https://tauri.app/) - Lightweight native app framework
- **Build**: [Vite](https://vitejs.dev/) - Fast frontend tooling

## License

MIT License - see [LICENSE](LICENSE) for details.
