# Member 3 — Chrome Extension (replaces frontend/)

> **Replaces** the original `frontend/index.html` + `script.js` + `style.css` deliverable.
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
4. Select this `phishing-extension/` folder

---

## Demo mode (Days 1–4, before model is ready)

`content.js` ships with `DUMMY_MODE: true`. This means:
- The extension works **fully** without a Flask server
- It uses a local regex-based fake predictor that matches Member 2's response schema exactly
- A **"DEMO MODE"** badge appears in the overlay so testers know it's not real

---

## Switching to the real model (Day 5)

Once Member 2's `app.py` is running:

1. Open `content.js`
2. Change line 19:
   ```js
   // Before:
   DUMMY_MODE: true,
   // After:
   DUMMY_MODE: false,
   ```
3. Start the Flask server:
   ```bash
   python backend/app.py
   ```
4. Reload the extension at `chrome://extensions` → click the ↺ button

The extension calls the **exact same `/predict` endpoint** as the original frontend, sending:
```json
{ "email_text": "..." }
```
And expects Member 2's schema back:
```json
{
  "label": "Phishing" | "Legitimate",
  "confidence": 87.3,
  "features": {
    "url_count": 4,
    "urgent_keyword_count": 3,
    "has_http_only": 1,
    "has_ip_url": 0,
    "exclamation_count": 5,
    "suspicious_url_keywords": 1,
    "has_form_tag": 0,
    "link_to_text_ratio": 0.12
  }
}
```
**No changes to Member 2's code are needed.**

---

## Backend compatibility note

`app.py` still needs `CORS` enabled (as originally specified) since the extension
makes cross-origin requests to `localhost:5000`. This is already in the original spec:

```python
from flask_cors import CORS
CORS(app)
```

---

## Testing checklist (Day 5)

- [ ] Load extension in Chrome developer mode
- [ ] Open Gmail → open a real email → overlay appears
- [ ] Paste phishing email from phishtank.com → red "Likely Phishing" overlay
- [ ] Open a normal email → green "Looks Legitimate" overlay
- [ ] Click ↺ Re-scan in popup → overlay refreshes
- [ ] Toggle "Show on legitimate emails" off → green overlay hidden
- [ ] Disable `DUMMY_MODE`, start `python backend/app.py`, verify real predictions
