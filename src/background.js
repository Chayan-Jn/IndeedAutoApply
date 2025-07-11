console.log('Background script runs');

chrome.runtime.onInstalled.addListener(() => {
  console.log('extension installed');
});

chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
      console.log('Activated tab URL:', tab.url);
    });
  });

  