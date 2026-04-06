# TermVault Development Guide

## Architecture Overview

### Multi-Process Architecture

```
main process (Electron)
  ├── IPC Server
  │   ├── termvault:list → listSnippets()
  │   ├── termvault:add → addSnippet()
  │   ├── termvault:update → updateSnippet()
  │   ├── termvault:remove → removeSnippet()
  │   ├── termvault:search → searchSnippets()
  │   ├── termvault:toggle-favorite → toggleFavorite()
  │   ├── termvault:record-usage → recordUsage()
  │   ├── termvault:export → exportSnippets()
  │   └── termvault:import → importSnippets()
  │
  └── store.ts
      ├── Manages local JSON database
      ├── CRUD operations
      └── File I/O in userData directory

preload.ts (Secure Context Bridge)
  ├── Exposes controlled API to renderer
  ├── Type-safe ipcRenderer.invoke wrappers
  └── window.termvault namespace

renderer/App.tsx (React UI)
  ├── useState for form and filters
  ├── useMemo for computed lists
  └── Calls window.termvault API
```

### Data Flow

1. User interacts with React UI
2. UI calls `window.termvault.methodName(args)`
3. Preload forwards to `ipcRenderer.invoke("termvault:method", args)`
4. Main process IPC handler receives and calls store function
5. Store reads/writes JSON database
6. IPC handler returns result to renderer
7. React state updates and UI re-renders

### Data Model

```typescript
SnippetItem {
  id: string (UUID)
  name: string
  group: string
  content: string
  type: "command" | "snippet"
  isFavorite: boolean (Phase 3)
  lastUsed?: string (ISO timestamp, Phase 3)
  createdAt: string (ISO timestamp)
  updatedAt: string (ISO timestamp)
}
```

## Project Structure

```
src/
├── main/
│   ├── main.ts          - Electron main, window creation, IPC registration
│   └── store.ts         - JSON database CRUD, file I/O
├── preload/
│   └── preload.ts       - Context bridge, API exposure
├── renderer/
│   ├── App.tsx          - React component (form + list panel)
│   ├── main.tsx         - React entry point
│   ├── styles.css       - Layout and styling
│   └── vite-env.d.ts    - Vite type definitions
└── shared/
    └── types.ts         - Shared TypeScript interfaces
```

## TypeScript Configuration

- `tsconfig.base.json` - Base rules shared by main and renderer
- `tsconfig.main.json` - Main process (CommonJS, Node modules)
- `tsconfig.renderer.json` - Renderer (ESNext, DOM globals)

## Development Workflow

### Hot Reload

```bash
npm run dev
```

- Runs 3 processes concurrently:
  1. **dev:main** - TypeScript watch on main process
  2. **dev:renderer** - Vite dev server (HMR on port 5173)
  3. **dev:electron** - Electron launch with dev server URL
- Changes to React components auto-refresh in running app
- Changes to main process trigger Electron restart

### Code Style

- Use TypeScript strict mode (`strict: true`)
- Interfaces for types, not classes
- Prefer functional components in React
- Use `const` for immutable declarations
- Arrow functions for callbacks

### Testing Checklist

Before committing:

```bash
npm run typecheck    # Verify all types
npm run build        # Verify production build works
npm run start        # Run production build locally
```

## Adding New Features

### Example: Add a new snippet property (e.g., `tags: string[]`)

1. **Update type in `src/shared/types.ts`:**
   ```typescript
   interface SnippetItem {
     // ... existing fields
     tags: string[];  // Add new field
   }
   ```

2. **Update `src/main/store.ts` functions:**
   - Ensure `addSnippet()` initializes field
   - Update `updateSnippet()` logic
   - Update migration/repair logic in `readDb()`

3. **Add IPC handler in `src/main/main.ts`:**
   - Create new handler if needed: `ipcMain.handle("termvault:search-by-tag", ...)`

4. **Update `src/preload/preload.ts`:**
   - Expose new API: `searchByTag: (tag) => ipcRenderer.invoke(...)`

5. **Update React UI in `src/renderer/App.tsx`:**
   - Add UI controls for new feature
   - Call new API methods
   - Update window.termvault type declaration

6. **Test and verify:**
   ```bash
   npm run typecheck
   npm run build
   npm run start
   ```

## Common Tasks

### Debugging Main Process

1. Run dev and open DevTools for renderer:
   ```bash
   npm run dev
   ```

2. DevTools will open automatically (detached window)

3. To debug main process:
   - Add `debugger;` statements to `src/main/main.ts`
   - Run with Node inspector: 
     ```bash
     node --inspect-brk node_modules/electron/dist/Electron.app/Contents/MacOS/Electron .
     ```

### Building Platform-Specific Code

Use environment detection in main process:

```typescript
if (process.platform === 'darwin') {
  // macOS specific
} else if (process.platform === 'win32') {
  // Windows specific
}
```

### Database Migration

If JSON schema changes:

1. Update `DbShape` interface if needed
2. Add migration logic in `readDb()` catch block:
   ```typescript
   if (parsed.version < 2) {
     // Upgrade old format
   }
   ```

### Performance Optimization

- **Large snippet lists**: Use `useMemo` for filtering
- **Search**: Already uses fuzzy filter, acceptable for 1000+ items
- **Export/Import**: File I/O is sync; consider async for very large files

## Dependencies

### Production

- **react** - UI framework
- **react-dom** - React DOM binding

### Development

- **@types/node** - Node.js types
- **@types/react** - React types
- **@types/react-dom** - React DOM types
- **@vitejs/plugin-react** - Vite React plugin
- **concurrently** - Run multiple commands
- **cross-env** - Cross-platform env vars
- **electron** - Electron framework
- **electron-builder** - Packaging
- **typescript** - Type checking
- **vite** - Build tool & dev server
- **wait-on** - Wait for dev server ready

## Troubleshooting

### TypeScript errors after dependency update

```bash
npm install
npm run typecheck  # See detailed errors
```

### Build artifacts not found

```bash
npm run build       # Explicit build
npm run start       # Verify dist/ was created
```

### "Module not found" during dev

1. Ensure dependency is listed in package.json
2. Run `npm install`
3. Restart dev server: `npm run dev`

### React state not updating

Check that:
- setState is called (not direct mutation)
- Components using state are re-rendered
- Dependencies in useMemo/useEffect are correct

## Future Improvements

- [ ] Global hotkey for quick access (Phase 3 mentioned)
- [ ] Dark mode toggle
- [ ] Syntax highlighting for code snippets
- [ ] Plugin system for custom snippet types
- [ ] Sync across devices
- [ ] Community snippet library
