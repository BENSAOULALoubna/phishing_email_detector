/**
 * content.js — Phishing Detector Content Script
 *
 * Runs on Gmail and Outlook Web. Watches for email opens via MutationObserver,
 * extracts the visible email text from the DOM, sends it to the Flask /predict
 * endpoint, and injects a verdict overlay into the email thread.
 *
 * Compatible with Member 2's predict() return schema:
 *   { label, confidence, features: { url_count, urgent_keyword_count, ... } }
 *
 * While model.pkl isn't ready, DUMMY_MODE returns a fake response so the
 * extension is fully testable end-to-end on Day 1.
 */

// ─── Config ──────────────────────────────────────────────────────────────────

const CONFIG = {
  DUMMY_MODE: false,
  BACKEND_URL: "https://phishing-detector-backend-j3pu.onrender.com/predict",
  // How long to wait after DOM change before re-scanning (debounce ms)
  DEBOUNCE_MS: 150,
  // Minimum characters to consider a real email body
  MIN_TEXT_LENGTH: 40,
};

// ─── Platform detection ───────────────────────────────────────────────────────

const PLATFORM = (() => {
  const host = window.location.hostname;
  if (host === "mail.google.com") return "gmail";
  if (host.includes("outlook")) return "outlook";
  return "unknown";
})();

// ─── DOM selectors per platform ───────────────────────────────────────────────
// Each entry returns the "email reading pane" container element and the text
// extraction strategy for that platform.

const SELECTORS = {
  gmail: {
    // The open email view panel
    emailPane: '.ii.gt',
    // The subject line
    subject: 'h2.hP',
    // The sender name/address
    sender: '.gD',
    // Observe mutations on this root to detect email opens
    observeRoot: () => document.body,
  },
  outlook: {
    emailPane: '[role="main"] .ReadingPaneContent',
    subject: '[role="main"] .SubjectLine',
    sender: '[role="main"] .from-name',
    observeRoot: () => document.querySelector('[role="main"]') || document.body,
  },
};

// ─── Dummy backend (used when DUMMY_MODE = true) ──────────────────────────────

function dummyPredict(text) {
  // Simulate a real response matching Member 2's schema exactly
  const looksPhishy =
    /urgent|click here|verify|suspended|account|login|password/i.test(text);
  const confidence = looksPhishy
    ? 75 + Math.floor(Math.random() * 20)
    : 10 + Math.floor(Math.random() * 25);

  return {
    label: looksPhishy ? "Phishing" : "Legitimate",
    confidence,
    features: {
      url_count: (text.match(/https?:\/\//g) || []).length,
      has_http_only: /http:\/\//.test(text) ? 1 : 0,
      suspicious_url_keywords: /login|verify|account|secure|update|confirm|banking/i.test(text) ? 1 : 0,
      urgent_keyword_count: (text.match(/urgent|click here|suspended|immediately|act now/gi) || []).length,
      has_ip_url: /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(text) ? 1 : 0,
      exclamation_count: (text.match(/!/g) || []).length,
      has_form_tag: /<form|<input/i.test(text) ? 1 : 0,
      link_to_text_ratio: parseFloat(
        ((text.match(/https?:\/\//g) || []).length /
          Math.max(text.split(/\s+/).length, 1)).toFixed(3)
      ),
    },
  };
}

// ─── Backend call ─────────────────────────────────────────────────────────────

async function analyzeEmail(text) {
  if (CONFIG.DUMMY_MODE) {
    // Simulate network latency so the loading state is visible
    await new Promise((r) => setTimeout(r, 700));
    return dummyPredict(text);
  }

  const response = await fetch(CONFIG.BACKEND_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email_text: text }),
  });

  if (!response.ok) {
    throw new Error(`Backend error: ${response.status}`);
  }
  return response.json();
}

// ─── Text extraction ──────────────────────────────────────────────────────────

function extractEmailText(paneEl) {
  // Clone so we can remove quoted reply blocks without mutating the real DOM
  const clone = paneEl.cloneNode(true);

  // Remove Gmail's "quoted text" toggle and Outlook reply separators
  clone.querySelectorAll(
    '.gmail_quote, .gmail_extra, [class*="quoted"], [class*="reply-separator"]'
  ).forEach((el) => el.remove());

  return (clone.innerText || clone.textContent || "").replace(/\s+/g, " ").trim();
}

// ─── Overlay injection ────────────────────────────────────────────────────────

const OVERLAY_ID = "phishing-detector-overlay";

function removeExistingOverlay() {
  const existing = document.getElementById(OVERLAY_ID);
  if (existing) existing.remove();
}

function buildFeaturePills(features) {
  const labelMap = {
    url_count: (v) => v > 0 ? `🔗 ${v} URL${v !== 1 ? "s" : ""}` : null,
    has_http_only: (v) => v ? "⚠️ Insecure HTTP link" : null,
    suspicious_url_keywords: (v) => v ? "🎣 Suspicious URL keywords" : null,
    urgent_keyword_count: (v) => v > 0 ? `🚨 ${v} urgency phrase${v !== 1 ? "s" : ""}` : null,
    has_ip_url: (v) => v ? "🖥️ Raw IP address URL" : null,
    exclamation_count: (v) => v >= 3 ? `❗ ${v} exclamation marks` : null,
    has_form_tag: (v) => v ? "📝 Embedded form/input" : null,
    link_to_text_ratio: (v) => v > 0.1 ? `📊 High link-to-text ratio (${v})` : null,
  };

  return Object.entries(features)
    .map(([key, val]) => labelMap[key]?.(val))
    .filter(Boolean);
}

function injectOverlay(paneEl, result) {
  removeExistingOverlay();

  const isPhishing = result.label === "Phishing";
  const pills = buildFeaturePills(result.features);

  const overlay = document.createElement("div");
  overlay.id = OVERLAY_ID;
  overlay.setAttribute("data-label", isPhishing ? "phishing" : "legitimate");

  overlay.innerHTML = `
    <div class="pd-header">
      <div class="pd-verdict-text">
        <span class="pd-label">${isPhishing ? "Likely Phishing" : "Looks Legitimate"}</span>
        <span class="pd-confidence">
          ${CONFIG.DUMMY_MODE ? '<span class="pd-dummy-badge">DEMO MODE</span>' : ""}
          ${result.confidence.toFixed(1)}% confidence
        </span>
      </div>
      <button class="pd-toggle" aria-label="Toggle details">▾</button>
    </div>
    <div class="pd-body">
      ${pills.length > 0
        ? `<div class="pd-pills-label">Indicators detected:</div>
           <div class="pd-pills">${pills.map((p) => `<span class="pd-pill">${p}</span>`).join("")}</div>`
        : `<div class="pd-clean">No suspicious indicators found.</div>`
      }
      ${CONFIG.DUMMY_MODE
        ? `<div class="pd-mode-notice">
            Running in demo mode. 
           </div>`
        : ""}
    </div>
  `;

  // Toggle expand/collapse
  overlay.querySelector(".pd-toggle").addEventListener("click", () => {
    overlay.classList.toggle("pd-collapsed");
  });

  // Insert as first child of the email pane so it sits above the body
  paneEl.insertAdjacentElement("beforebegin", overlay);
}

function injectLoadingOverlay(paneEl) {
  removeExistingOverlay();

  const overlay = document.createElement("div");
  overlay.id = OVERLAY_ID;
  overlay.setAttribute("data-label", "loading");

  overlay.innerHTML = `
    <div class="pd-header">
      <div class="pd-spinner"></div>
      <div class="pd-verdict-text">
        <span class="pd-label">Analyzing email…</span>
      </div>
    </div>
  `;

  paneEl.insertAdjacentElement("beforebegin", overlay);
}

function injectErrorOverlay(paneEl, message) {
  removeExistingOverlay();

  const overlay = document.createElement("div");
  overlay.id = OVERLAY_ID;
  overlay.setAttribute("data-label", "error");

  overlay.innerHTML = `
    <div class="pd-header">
      <div class="pd-verdict-icon">⚠️</div>
      <div class="pd-verdict-text">
        <span class="pd-label">Could not analyze</span>
        <span class="pd-confidence">${message}</span>
      </div>
    </div>
  `;

  paneEl.insertAdjacentElement("beforebegin", overlay);
}

// ─── Main scan logic ──────────────────────────────────────────────────────────

// Track last analyzed text to avoid re-running on unrelated DOM mutations
let lastAnalyzedText = "";

async function scanIfEmailOpen() {
  const sel = SELECTORS[PLATFORM];
  if (!sel) return;

  const panes = document.querySelectorAll(sel.emailPane);
  if (panes.length === 0) {
    removeExistingOverlay();
    lastAnalyzedText = "";
    return;
  }

  // Use the first (most prominent) pane
  const pane = panes[0];
  const text = extractEmailText(pane);

  if (text.length < CONFIG.MIN_TEXT_LENGTH) return;
  if (text === lastAnalyzedText) return; // Already analyzed this email

  lastAnalyzedText = text;
  injectLoadingOverlay(pane);

  try {
    const result = await analyzeEmail(text);
    injectOverlay(pane, result);
  } catch (err) {
    console.error("[PhishingDetector] Backend error:", err);
    injectErrorOverlay(pane, "Backend unreachable. Is the Flask server running?");
  }
}

// ─── MutationObserver — watches for email opens ───────────────────────────────

let debounceTimer = null;

function startObserver() {
  const sel = SELECTORS[PLATFORM];
  if (!sel) return;

  const root = sel.observeRoot();
  if (!root) return;

  const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(scanIfEmailOpen, CONFIG.DEBOUNCE_MS);
  });

  observer.observe(root, { childList: true, subtree: true });

  // Also run once immediately in case the page loaded with an email open
  scanIfEmailOpen();
}

// ─── Message listener (from popup "Re-scan" button) ──────────────────────────

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "RESCAN") {
    lastAnalyzedText = ""; // Force re-analysis
    scanIfEmailOpen();
  }
});

// ─── Boot ─────────────────────────────────────────────────────────────────────
startObserver();                      // scans immediately + starts observer
setTimeout(scanIfEmailOpen, 800);     // one retry for slow Gmail body renders
