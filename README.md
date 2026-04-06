# TermVault

TermVault is a cross-platform desktop app (Electron) for collecting and managing terminal commands/snippets.

## Product Goal

- Manage frequently used commands/snippets in a GUI.
- Organize snippets by groups.
- One-click copy to clipboard, then paste into terminal to run.
- Run on macOS, Windows, and Linux.

## Scientific Development Plan

### Phase 1: Core Architecture (completed in this iteration)

- Electron main process for desktop shell and secure IPC.
- React renderer for GUI interaction.
- Local JSON storage in userData directory.
- Snippet CRUD: list/add/delete.
- Group filter and one-click copy.

### Phase 2: Product Reliability

- Edit snippet and rename group.
- Duplicate-name detection and UX prompts.
- Export/import backup files.
- Better validation and error recovery.

### Phase 3: Power Features

- Search and fuzzy match.
- Favorites and recent snippets.
- Optional global hotkey to open quick copy panel.

### Phase 4: Distribution

- Packaging for macOS/Windows/Linux.
- Auto-update strategy and release workflow.

## Tech Stack

- Electron + TypeScript (main/preload)
- React + Vite + TypeScript (renderer)
- Local JSON file storage

## Getting Started

1. Install dependencies

```bash
npm install
```

2. Start development app

```bash
npm run dev
```

3. Build production assets

```bash
npm run build
```

4. Run built app

```bash
npm run start
```

## Usage

1. Launch app.
2. Fill Name, Group, Type, and Content.
3. Click Save Snippet.
4. Filter by group from dropdown.
5. Click Copy on a snippet.
6. Paste in terminal and press Enter.

## Data Storage

Snippets are saved in Electron user data path:

- macOS: `~/Library/Application Support/termvault/termvault-db.json` (actual app folder name may vary by app identity)
- Windows: `%APPDATA%/termvault/termvault-db.json`
- Linux: `~/.config/termvault/termvault-db.json`
