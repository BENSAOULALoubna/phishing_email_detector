
> The extension detects phishing automatically when the user opens an email — no copy-pasting needed.

---

## What it does

| Step | What happens |
|------|-------------|
| 1 | User opens an email in **Gmail** or **Outlook Web** |
| 2 | Extension's `content.js` detects the email pane via `MutationObserver` |
| 3 | Extracts visible email text from the DOM (strips quoted replies) |
| 4 | POSTs text to `localhost:5000/predict` (same Flask endpoint Member 2 builds) |
| 5 | Injects a **verdict overlay** above the email: label, confidence %, feature pills |

---

## File structure

```
phishing-extension/
├── manifest.json        Chrome extension manifest (v3)
├── content.js           Core logic: DOM watch → extract → call backend → overlay
├── overlay.css          Styles injected into Gmail/Outlook pages
├── popup.html           Toolbar button popup UI
├── popup.js             Popup logic: backend status, settings toggles
├── background.js        Service worker (forwards re-scan messages)
├── generate_icons.py    One-time icon generator
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## Setup

### 1. Generate icons (one-time)
```bash
python generate_icons.py
```

### 2. Load into Chrome
1. Go to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select this `extension/` folder

---


## Backend compatibility note

`app.py` still needs `CORS` enabled (as originally specified) since the extension
makes cross-origin requests to `localhost:5000`. This is already in the original spec:

```python
from flask_cors import CORS
CORS(app)
```

