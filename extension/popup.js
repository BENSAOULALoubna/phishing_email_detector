/**
 * popup.js — Phishing Detector Extension Popup
 * Displays backend status, current platform, and settings toggles.
 */

const BACKEND_URL = "http://localhost:5000/predict";

// ─── Detect platform from current tab ────────────────────────────────────────

async function getCurrentPlatform() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0]?.url || "";
      if (url.includes("mail.google.com")) resolve("Gmail");
      else if (url.includes("outlook")) resolve("Outlook Web");
      else resolve("Not an email client");
    });
  });
}

// ─── Check if Flask backend is reachable ──────────────────────────────────────

async function checkBackend() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    // Send a dummy POST — we just care about a non-network-error response
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email_text: "test" }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.status < 500; // 400 (bad request) is fine — server is alive
  } catch {
    return false;
  }
}

// ─── Load settings ────────────────────────────────────────────────────────────

function loadSettings(callback) {
  chrome.storage.sync.get(
    { autoScan: true, showLegit: true, dummyMode: true },
    callback
  );
}

function saveSetting(key, value) {
  chrome.storage.sync.set({ [key]: value });
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  const [platform, backendOk, settings] = await Promise.all([
    getCurrentPlatform(),
    checkBackend(),
    new Promise((res) => loadSettings(res)),
  ]);

  // Backend status
  const backendEl = document.getElementById("backend-status");
  if (backendOk) {
    backendEl.innerHTML = `<span class="dot dot-green"></span>Connected`;
  } else {
    backendEl.innerHTML = `<span class="dot dot-orange"></span>Offline`;
  }

  // Mode
  document.getElementById("mode-val").textContent =
    settings.dummyMode ? "Demo (no model)" : "Live ML model";

  // Platform
  document.getElementById("platform-val").textContent = platform;

  // Demo notice
  if (settings.dummyMode) {
    document.getElementById("dummy-notice").style.display = "block";
  }

  // Footer
  document.getElementById("footer-meta").textContent =
    `v1.0.0 · ${new Date().toLocaleDateString()}`;

  // Toggles
  const autoToggle = document.getElementById("toggle-auto");
  const legitToggle = document.getElementById("toggle-show-legit");

  autoToggle.checked = settings.autoScan;
  legitToggle.checked = settings.showLegit;

  autoToggle.addEventListener("change", () =>
    saveSetting("autoScan", autoToggle.checked)
  );
  legitToggle.addEventListener("change", () =>
    saveSetting("showLegit", legitToggle.checked)
  );

  // Re-scan button: sends a message to the content script on the active tab
  document.getElementById("btn-rescan").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "RESCAN" });
        window.close();
      }
    });
  });
}

init();
