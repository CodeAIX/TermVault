# TermVault

TermVault is a cross-platform desktop app (Electron) for collecting and managing terminal commands/snippets.

## Product Goal

- Manage frequently used commands/snippets in a GUI.
- Organize snippets by groups.
- One-click copy to clipboard, then paste into terminal to run.
- Track favorites and usage history.
- Export/import snippets for backup and sharing.
- Run on macOS, Windows, and Linux.

## Development Roadmap

### ✅ Phase 1: Core Architecture

- Electron main process for desktop shell and secure IPC.
- React renderer for GUI interaction.
- Local JSON storage in userData directory.
- Snippet CRUD: list/add/update/delete.
- Group filter and one-click copy.

### ✅ Phase 2: Editing & Group Management

- Edit existing snippets.
- Rename group (batch update all snippets in group).
- Duplicate-name detection and UX prompts.
- Better validation and error recovery.

### ✅ Phase 3: Search & Favorites

- Search with fuzzy multi-keyword matching.
- Mark snippets as favorites.
- Recent snippets tracking (last 10 used).
- Toolbar filters for favorites/recent display.

### ✅ Phase 4: Export/Import

- Export all snippets to JSON file.
- Import snippets: merge (add new) or replace (clear and load).
- File dialogs with date-stamped default names.
- Complete error handling.

### ✅ Phase 5: Packaging & Distribution

- electron-builder configuration for macOS (DMG) and Windows (NSIS/Portable EXE).
- Build scripts for dev, production, and distribution.
- Prepared for CI/CD automated releases.

## Tech Stack

- **Electron 41.x** - Desktop framework
- **React 19.x** + **Vite 8.x** - UI and dev server
- **TypeScript 6.x** - Type safety (main/renderer/shared)
- **Local JSON storage** - userData directory persistence
- **electron-builder** - Cross-platform packaging

## Getting Started

### Development

1. Install dependencies

```bash
npm install
```

2. Start dev server (with HMR + Electron auto-reload)

```bash
npm run dev
```

3. Typecheck TypeScript

```bash
npm run typecheck
```

### Production Build

1. Build for production

```bash
npm run build
```

2. Run built app

```bash
npm run start
```

### Distribution & Packaging

Generate installers for distribution:

```bash
# Build for macOS (DMG + ZIP)
npm run dist:mac

# Build for Windows (NSIS Installer + Portable EXE)
npm run dist:win

# Build for both platforms
npm run dist:all
```

Installers will be generated in the `release/` directory:
- **macOS**: `TermVault-0.1.0-arm64.dmg`, `TermVault-0.1.0-arm64-mac.zip`
- **Windows**: `TermVault Setup 0.1.0.exe` (NSIS), `TermVault 0.1.0.exe` (Portable)

## Usage

1. Launch app.
2. Fill in Name, Group, Type, and Content fields.
3. Click "Save Snippet".
4. Use toolbar to:
   - Filter by group
   - Toggle favorites (★)
   - Show recent snippets (⏱)
   - Search with keyword filter
5. Click "Copy" on a snippet to copy to clipboard.
6. Paste in terminal and press Enter.

**Advanced Features:**
- **Edit**: Click "Edit" on a snippet card to modify it.
- **Delete**: Click "Delete" to remove a snippet.
- **Rename Group**: Use "Rename Group" button to batch-rename all snippets in a group.
- **Export**: Click "Export All" to save all snippets as JSON backup.
- **Import**: Click "Import (Merge)" to add snippets, or "Import (Replace)" to load a new set.

## Data Storage

Snippets are stored via Electron's userData path:

- **macOS**: `~/Library/Application Support/termvault/termvault-db.json`
- **Windows**: `%APPDATA%/termvault/termvault-db.json`
- **Linux**: `~/.config/termvault/termvault-db.json`

## Project Structure

```
src/
  main/           - Electron main process, IPC handlers, store (CRUD)
  preload/        - Context bridge exposing type-safe API
  renderer/       - React UI components and styling
  shared/         - Type definitions (SnippetItem, TermVaultApi, etc.)
```

## License

MIT
