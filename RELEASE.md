# TermVault Release Guide

## Generated Installers

Phase 5 packaging successfully created distribution files for macOS and Windows:

### macOS

| File | Size | Format |
|------|------|--------|
| `TermVault-0.1.0-arm64.dmg` | 109M | DMG (drag-and-drop installer) |
| `TermVault-0.1.0-arm64-mac.zip` | 105M | ZIP archive |

**Installation (macOS):**
1. Download `TermVault-0.1.0-arm64.dmg`
2. Open the DMG file
3. Drag TermVault app to Applications folder
4. Launch from Applications or Spotlight

### Windows

| File | Size | Format |
|------|------|--------|
| `TermVault Setup 0.1.0.exe` | 97M | NSIS Installer |
| `TermVault 0.1.0.exe` | 96M | Portable Executable |

**Installation (Windows):**

**Option 1: NSIS Installer**
1. Download `TermVault Setup 0.1.0.exe`
2. Run the installer
3. Follow the setup wizard
4. Choose install location
5. Launch from Start Menu or desktop shortcut

**Option 2: Portable Executable**
1. Download `TermVault 0.1.0.exe`
2. Run directly (no installation required)
3. App will work from any location

## Build Commands

Generate installers on your platform:

```bash
# macOS only (creates DMG + ZIP)
npm run dist:mac

# Windows only (creates NSIS + Portable)
npm run dist:win

# Both platforms (requires cross-compilation setup)
npm run dist:all
```

## Build Output

All distribution files are generated in the `release/` directory:

```
release/
  ├── TermVault-0.1.0-arm64.dmg          (macOS DMG installer)
  ├── TermVault-0.1.0-arm64-mac.zip      (macOS ZIP archive)
  ├── TermVault Setup 0.1.0.exe          (Windows NSIS installer)
  ├── TermVault 0.1.0.exe                (Windows portable exe)
  ├── *.blockmap                         (delta-update metadata)
  ├── builder-debug.yml                  (build debug info)
  └── latest-mac.yml                     (update manifest)
```

## Notes

- **Code Signing**: Generated on macOS with ad-hoc signature (unsigned release). For production, configure code signing certificates.
- **Notarization**: Not performed. macOS notarization requires Apple developer account and is recommended for distribution.
- **Windows Code Signing**: Not performed. For production releases, code sign with a valid certificate to avoid SmartScreen warnings.
- **Arch**: Current build targets ARM64 only (native M1/M2 Macs, Windows 11 ARM). For Intel Macs/Windows, modify electron-builder config in `package.json`.

## CI/CD Integration

For automated releases:

1. Configure GitHub Actions workflow to run `npm run dist:all` on tag push
2. Implement code signing credentials in CI environment
3. Upload generated files as GitHub release artifacts
4. Consider electron-updater for auto-updates

## Troubleshooting

**macOS: "App is damaged" warning**
- System Preferences → Security & Privacy → Allow app
- Or: `xattr -d com.apple.quarantine /Applications/TermVault.app`

**Windows: SmartScreen warning**
- App is unsigned; click "More info" → "Run anyway"
- For production, obtain code signing certificate

**NSIS Installer fails on Windows**
- Ensure Visual C++ redistributables are installed
- Run installer with admin privileges

## Next Steps

- Implement auto-update via [electron-updater](https://www.electron.build/auto-update)
- Add code signing configuration for production releases
- Set up GitHub Actions workflow for automated builds and releases
- Generate x64 builds for Intel-based systems
