// Background script for side panel management
chrome.action.onClicked.addListener((tab) => {
    // Open side panel when extension icon is clicked
    chrome.sidePanel.open({ tabId: tab.id });
});

// Optional: Set side panel to open by default
chrome.runtime.onInstalled.addListener(() => {
    chrome.sidePanel.setOptions({
        enabled: true
    });
});