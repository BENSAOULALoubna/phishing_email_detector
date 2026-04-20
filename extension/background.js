/**
 * background.js — Phishing Detector Service Worker
 *
 * Handles messages from the popup (e.g. re-scan requests) and
 * forwards them to the content script on the active tab.
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "RESCAN") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "RESCAN" });
      }
    });
  }
  sendResponse({ ok: true });
  return true;
});
