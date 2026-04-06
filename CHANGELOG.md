# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-04-06

### Added

#### Phase 3: Search & Favorites
- Search with fuzzy multi-keyword matching across snippet name, group, and content
- Favorites feature - mark snippets as favorites for quick access
- Recent snippets tracking - automatically track last 10 used snippets
- Toolbar filters to toggle favorites and recent views
- Last-used timestamp display on snippet cards

#### Phase 4: Export/Import
- Export all snippets to JSON file for backup
- Import snippets with two modes:
  - Merge: add new snippets while preserving existing ones
  - Replace: clear all and load new snippets
- File dialogs with date-stamped default names
- Complete error handling and user feedback

#### Phase 5: Packaging & Distribution
- electron-builder configuration for macOS (DMG + ZIP) and Windows (NSIS + Portable EXE)
- Automated build scripts: `npm run dist:mac`, `npm run dist:win`, `npm run dist:all`
- Distribution artifacts generated in `release/` directory
- Prepared for CI/CD automated releases

#### Phase 6: Optimizations & Automation
- **Dark Mode**: Automatic system theme detection with CSS media queries
- **Multi-Architecture**: Support for both ARM64 and x64 (Intel) processors on macOS and Windows
- **Auto-Updates**: Integrated electron-updater for automatic update checking and installation
- **GitHub Actions**: 
  - Automated CI/CD pipeline for build checks on PR and push
  - Release workflow: automatically build and publish when tag is pushed
  - Supports macOS and Windows platforms
- **Code Signing Guide**: Comprehensive documentation for production code signing
- **Extended Build Scripts**: Architecture-specific distribution commands

### Changed

- Updated README with complete feature list and building instructions
- Reorganized development documentation (see DEVELOPMENT.md)
- Updated RELEASE.md with cross-platform installer information

### Fixed

- Fixed TypeScript strict mode issues with optional file paths
- Proper filelock handling in import dialog

### Technical Details

**Architecture**
- Electron main/preload/renderer separation with IPC for security
- React hooks-based state management
- Type-safe API exposure via contextBridge
- Local JSON persistence in app userData directory

**Dependencies Added**
- electron-updater: Automatic update mechanism
- New build scripts for architecture variants

**Build Improvements**
- Support for building both ARM64 and x64 variants
- GitHub Actions with matrix strategy for multi-platform builds
- Automated release creation and asset upload

## [0.1.0] - 2026-04-05

### Added

#### Phase 1: Core Architecture
- Electron desktop application shell
- React UI with two-panel layout (form + list)
- Local JSON database storage in userData directory
- Snippet CRUD operations (Create, Read, Update, Delete)
- Group filtering and one-click copy to clipboard

#### Phase 2: Editing & Group Management
- Edit existing snippets
- Batch rename group (rename all snippets in a group)
- Modal dialog for group operations
- Better form validation and error messages
- Development documentation

### Technical Details

**Stack**
- Electron 41.x, React 19.x, TypeScript 6.x, Vite 8.x
- electron-builder for packaging
- concurrently for dev orchestration

**Features**
- Snippet type selection (command vs snippet)
- Group-based organization
- Clipboard integration
- Dev server with HMR

---

## Development Status

TermVault is actively developed with a clear roadmap. All core and advanced features are implemented and tested. The application is production-ready for early adopters.

### Next Planned Features
- [ ] Global hotkey for quick access
- [ ] Syntax highlighting for code snippets
- [ ] Plugin system for custom snippet types
- [ ] Cloud sync across devices
- [ ] Community snippet library
