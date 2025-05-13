let activeTabId = null;
let startTime = null;
let tabTimes = {};

// Clear storage when the browser starts
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.clear(() => {
    console.log("Storage cleared on browser startup.");
    activeTabId = null;
    startTime = null;
    tabTimes = {};
  });
});

// Clear storage when the browser is closed
chrome.runtime.onSuspend.addListener(() => {
  chrome.storage.local.clear(() => {
    console.log("Storage cleared on browser shutdown.");
    activeTabId = null;
    startTime = null;
    tabTimes = {};
  });
});

// Load saved state from storage when the Service Worker starts
chrome.storage.local.get(["tabTimes", "activeTabId", "startTime"], (data) => {
  if (data.tabTimes) tabTimes = data.tabTimes;
  if (data.activeTabId) activeTabId = data.activeTabId;
  if (data.startTime) startTime = data.startTime;

  // If there's an active tab, start tracking time again
  if (activeTabId !== null && startTime !== null) {
    startTime = Date.now(); // Reset start time to now
  }
});

// Track tab activation
chrome.tabs.onActivated.addListener((activeInfo) => {
  updateTabTime(); // Save time for the previous tab
  activeTabId = activeInfo.tabId;
  startTime = Date.now();

  // Fetch tab title immediately
  chrome.tabs.get(activeTabId, (tab) => {
    if (tab) {
      tabTimes[activeTabId] = tabTimes[activeTabId] || { title: tab.title || "Unknown", timeSpent: 0, secondsSpent: 0 };
      saveState(); // Save the updated state
    }
  });
});

// Track tab title changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.title) {
    tabTimes[tabId] = tabTimes[tabId] || { title: "Unknown", timeSpent: 0, secondsSpent: 0 };
    tabTimes[tabId].title = tab.title; // Update title if changed
    saveState(); // Save the updated state
  }
});

// Track idle state
chrome.idle.onStateChanged.addListener((state) => {
  if (state === "idle" || state === "locked") {
    updateTabTime(); // Save time for the current tab
    activeTabId = null;
    startTime = null;
    saveState(); // Save the updated state
  }
});

// Update time spent on the active tab
function updateTabTime() {
  if (activeTabId !== null && startTime !== null) {
    const elapsedTime = (Date.now() - startTime) / 1000; // Convert to seconds
    if (!tabTimes[activeTabId]) {
      tabTimes[activeTabId] = { title: "Unknown", timeSpent: 0, secondsSpent: 0 };
    }

    // Add elapsed time to the tab's total time
    tabTimes[activeTabId].secondsSpent += Math.floor(elapsedTime % 60); // Add seconds
    tabTimes[activeTabId].timeSpent += Math.floor(elapsedTime / 60); // Add minutes

    // Convert excess seconds into minutes
    if (tabTimes[activeTabId].secondsSpent >= 60) {
      const extraMinutes = Math.floor(tabTimes[activeTabId].secondsSpent / 60);
      tabTimes[activeTabId].timeSpent += extraMinutes;
      tabTimes[activeTabId].secondsSpent = tabTimes[activeTabId].secondsSpent % 60;
    }

    saveState(); // Save the updated state
  }
  startTime = Date.now(); // Reset start time
}

// Save the current state to storage
function saveState() {
  chrome.storage.local.set({ tabTimes, activeTabId, startTime });
}

// Handle messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getTabTimes") {
    chrome.storage.local.get("tabTimes", (data) => {
      sendResponse(data.tabTimes || {});
    });
    return true; // Keep the message channel open for sendResponse
  }
});