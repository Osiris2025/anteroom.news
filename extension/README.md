# AI News Nexus — Link Collector (Browser Extension)

A browser extension for the [AI News Nexus](https://nexus.osiris2025.com) Raindrop.io-style link collector. Save any page as a draft article — AI auto-detects the best magazine and checks suitability.

## 🚀 Installation (Chrome / Edge / Brave)

1. **Download or clone** the extension
2. Open **chrome://extensions** (or brave://extensions, edge://extensions)
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **Load unpacked** and select the `extension/` folder
5. The extension icon appears in your browser toolbar

## 📖 How to use

1. Sign in to [nexus.osiris2025.com](https://nexus.osiris2025.com) (required)
2. Navigate to any article or page you'd like to save
3. Click the **Save to Nexus** extension icon
4. Review the auto-detected magazine and suitability warnings
5. The article lands as a draft in the **Dispatch Desk** inbox for review

## 🔧 How it works

- The extension calls the existing `/api/collect` endpoint on nexus.osiris2025.com
- AI analyzes the page title and description to pick the best-fit magazine
- Suitability checks flag potential issues (spam, paywall, etc.)
- Articles are saved as drafts — an admin must review before publishing

## 🏗️ Files

- `manifest.json` — Extension manifest (MV3)
- `popup.html` — Popup UI
- `popup.js` — Popup logic (fetch + render result)
- `icons/` — Extension icons

## 🌐 Supported browsers

- Chrome (Manifest V3)
- Edge (Chromium-based)
- Brave
- Opera
- Any Chromium-based browser

Firefox support requires a separate manifest (MV2).