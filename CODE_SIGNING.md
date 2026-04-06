# Code Signing Guide for TermVault

This guide explains how to set up code signing for macOS and Windows distributions.

## macOS Code Signing

### Prerequisites

- Apple Developer Account (USD 99/year)
- Xcode Command Line Tools
- Valid signing certificate from Apple

### Setup

1. **Create Certificate in Keychain Access**
   ```bash
   # Generate signing certificate through Apple Developer Portal
   # https://developer.apple.com/account/resources/certificates/list
   ```

2. **Add to electron-builder config in `package.json`:**
   ```json
   "mac": {
     "target": ["dmg", "zip"],
     "signingIdentity": "Developer ID Application: Your Name (XXXXXXXXXX)",
     "sign": "./scripts/sign.js"
   }
   ```

3. **Create signing script `scripts/sign.js`:**
   ```javascript
   module.exports = async function(configuration) {
     // Optional: custom signing logic
     console.log('Code signing enabled for macOS');
   };
   ```

4. **Set environment variable (CI/CD):**
   ```bash
   export CSC_NAME="Developer ID Application: Your Name (XXXXXXXXXX)"
   export CSC_KEYCHAIN="~/Library/Keychains/login.keychain-db"
   export CSC_KEY_PASSWORD="your_keychain_password"
   ```

### Notarization (Recommended for Distribution)

macOS 10.15+ requires notarization for gatekeeper acceptance.

1. **Create App-Specific Password**
   ```
   https://appleid.apple.com → Security → App-Specific Passwords
   ```

2. **Add to `package.json`:**
   ```json
   "mac": {
     "notarize": {
       "teamId": "XXXXXXXXXX"
     }
   }
   ```

3. **Set environment variables (CI/CD):**
   ```bash
   export APPLEID=your@email.com
   export APPLEIDPASS=app-specific-password
   export ASC_PROVIDER=XXXXXXXXXX
   ```

4. **Run notarization test:**
   ```bash
   npm install -D @electron/notarize
   npx electron-notarize dmg_file
   ```

## Windows Code Signing

### Prerequisites

- Code Signing Certificate (from DigiCert, Sectigo, etc.)
  - Cost: $100-300/year
  - Or: GitHub provides free signing for open source projects
- Certificate file (`.pfx` or `.p12`)
- Certificate password

### Setup

1. **Add to electron-builder config in `package.json`:**
   ```json
   "win": {
     "certificateFile": "path/to/certificate.pfx",
     "certificatePassword": "password",
     "signingHashAlgorithms": ["sha256"],
     "sign": "./customSign.js"
   }
   ```

2. **Set environment variables (CI/CD):**
   ```bash
   export WIN_CSC_LINK="path/to/certificate.pfx"
   export WIN_CSC_KEY_PASSWORD="certificate_password"
   ```

### Using GitHub Verified Badge

For open source projects:
1. Sign up for free signing at https://codeofconduct.io
2. Upload certificate to GitHub Actions secrets
3. Reference in workflow

## Free Options for Open Source

### GitHub Actions + Self-Signing

For testing/development without commercial certificate:

```json
"mac": {
  "sign": false,
  "type": "distribution"
},
"win": {
  "certificateFile": null,
  "sign": false
}
```

Note: App will show security warnings on first launch.

## CI/CD Integration

### GitHub Actions Setup

1. **Add secrets to repository:**
   ```
   Settings → Secrets and Variables → Actions
   
   CSC_NAME=Developer ID Application: ...
   CSC_KEYCHAIN_PASSWORD=your_password
   WIN_CSC_KEY_PASSWORD=cert_password
   APPLEID=your@email.com
   APPLEIDPASS=app-specific-password
   ASC_PROVIDER=team_id
   ```

2. **Update workflow file `.github/workflows/release.yml`:**
   ```yaml
   - name: Build and sign (macOS)
     if: runner.os == 'macos'
     run: npm run dist:mac
     env:
       CSC_NAME: ${{ secrets.CSC_NAME }}
       CSC_KEYCHAIN_PASSWORD: ${{ secrets.CSC_KEYCHAIN_PASSWORD }}
       APPLEID: ${{ secrets.APPLEID }}
       APPLEIDPASS: ${{ secrets.APPLEIDPASS }}
   
   - name: Build and sign (Windows)
     if: runner.os == 'windows'
     run: npm run dist:win
     env:
       WIN_CSC_KEY_PASSWORD: ${{ secrets.WIN_CSC_KEY_PASSWORD }}
   ```

## Troubleshooting

### "Certificate not found"
- Verify certificate is installed in system keychain
- Check `CSC_NAME` matches exactly
- Try: `security find-identity -v -p codesigning`

### "Notarization failed"
- Verify App ID password is app-specific (not account password)
- Check team ID is correct
- Review notarization logs in Xcode

### "SmartScreen warning on Windows"
- App needs reputation from multiple users
- Only shows when certificate is invalid/missing
- Gets better over time as more users run it

## Testing Signed Apps

```bash
# macOS: Check signature
codesign -v --verbose=4 /Applications/TermVault.app

# macOS: Verify notarization
spctl -a -v /Applications/TermVault.app

# Windows: Check signature (requires SignTool.exe)
signtool.exe verify /pa "TermVault Setup 0.1.0.exe"
```

## Production Checklist

- [ ] Code signing certificate acquired
- [ ] Certificate added to keychain/certificate store
- [ ] `CSC_NAME` verified and set
- [ ] Secrets added to GitHub Actions
- [ ] Workflow updated with signing config
- [ ] Test build created locally
- [ ] Notarization working (macOS)
- [ ] SmartScreen reputation building (Windows)

## References

- [Electron Builder Code Signing](https://www.electron.build/code-signing)
- [macOS Notarization](https://www.electron.build/code-signing#macos)
- [Windows Signing](https://www.electron.build/code-signing#windows)
- [GitHub Code Signing for Open Source](https://docs.github.com/en/code-security/securing-your-organization/managing-code-signing)
