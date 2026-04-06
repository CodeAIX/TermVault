# GitHub Release Instructions

## Automated Release (via GitHub Actions)

The project is configured with GitHub Actions workflows that automatically:

1. **Detect tag push** (e.g., `v0.2.0`)
2. **Build on multiple platforms**
   - macOS: Builds DMG and ZIP
   - Windows: Builds NSIS Installer and Portable EXE
3. **Upload artifacts** to GitHub Release page
4. **Create release notes** (auto-generated from git tags)

### Workflow Status

Check the **Actions** tab in your GitHub repository:
- https://github.com/CodeAIX/TermVault/actions

### To Create a New Release

```bash
# 1. Update version in package.json
# 2. Commit changes
git add package.json
git commit -m "chore: bump version to 0.3.0"

# 3. Create annotated tag
git tag -a v0.3.0 -m "Release v0.3.0: [description]"

# 4. Push tag (triggers GitHub Actions)
git push --tags

# 5. Monitor Actions
# - Go to Actions tab
# - Watch workflow run
# - Artifacts will be uploaded to Release page
```

## Manual Release (Local Build)

If GitHub Actions fails or you need to create a release manually:

```bash
# 1. Build locally
npm run dist:mac

# 2. Create GitHub Release via CLI (requires GitHub CLI)
gh release create v0.2.0 \
  --title "TermVault 0.2.0" \
  --notes-file CHANGELOG.md \
  release/*.dmg \
  release/*.zip

# Or use the GitHub web UI:
# 1. Go to Releases page
# 2. Click "Create a new release"
# 3. Fill in version and description
# 4. Upload files from release/ directory
```

## Release Checklist

- [ ] Version bumped in `package.json`
- [ ] `CHANGELOG.md` updated with changes
- [ ] All tests pass (`npm run typecheck && npm run build`)
- [ ] Tag created with format `vX.Y.Z`
- [ ] Tag pushed to GitHub (triggers Actions)
- [ ] GitHub Actions complete successfully
- [ ] Installers uploaded to Release page
- [ ] Release published on GitHub
- [ ] Announcement posted (Discord, Twitter, etc.)

## Files in Release

### macOS

- `TermVault-X.Y.Z-arm64.dmg` - DMG installer for Apple Silicon
- `TermVault-X.Y.Z-arm64-mac.zip` - ZIP archive for Apple Silicon
- (Optional) `TermVault-X.Y.Z-x64.dmg` - DMG for Intel Macs
- (Optional) `TermVault-X.Y.Z-x64-mac.zip` - ZIP for Intel Macs

### Windows

- `TermVault Setup X.Y.Z.exe` - NSIS installer (recommended)
- `TermVault X.Y.Z.exe` - Portable executable (no installation)
- (Optional) Windows x64 variants

## Update Notification

After release, users will be notified:

- **Auto-Update** (in-app): Checks for updates automatically
- **GitHub Release Page**: Users can download from releases page
- **Direct Download Links**: Can be shared in documentation

## Troubleshooting GitHub Actions

### "Workflow did not trigger"

1. Verify tag name format: `vX.Y.Z` (must start with 'v')
2. Check workflow file `.github/workflows/release.yml` exists
3. Ensure push to `main` branch first, then push tag

### "Build failed on macOS"

Common issues:
- Node version mismatch (use 20.x)
- Missing dependencies: `npm install`
- TypeScript errors: `npm run typecheck`

### "Build failed on Windows"

Common issues:
- NSIS installer build error: Check for spaces in paths
- Missing Visual C++ redistributable
- File permissions issue with signing

### "Files not uploaded to release"

1. Check Actions logs for errors
2. Verify `softprops/action-gh-release` action ran successfully
3. Check GitHub token has `contents: write` permission

## Automatic Update Setup

Users get automatic update notifications because:

1. **electron-updater** configured in main.ts
2. **GitHub publish config** in package.json
3. **electron-builder** creates update metadata

When a new release is published:
- Users see "Update available" notification
- Download happens in background
- Restart to apply update

To disable auto-update checks:
```typescript
// src/main/main.ts
if (!DEV_SERVER_URL) {
  // autoUpdater.checkForUpdatesAndNotify(); // Comment out to disable
}
```
