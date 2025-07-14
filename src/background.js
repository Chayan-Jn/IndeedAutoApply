console.log('[Background] Background script loaded');

let jobQueue = [];
let isProcessing = false;
let currentTabId = null;

// Listener for messages from content.js or popup
chrome.runtime.onMessage.addListener((msg, sender) => {
  console.log('[Background] Received message:', msg);

  if (msg.type === 'init_queue') {
    console.log('[Background] Initializing queue with', msg.links.length, 'jobs');
    jobQueue = msg.links;
    if (!isProcessing) {
      processNextJob();
    }
  }

  if (msg.type === 'close_this_tab') {
    if (sender.tab && sender.tab.id) {
      console.log('[Background] Closing tab', sender.tab.id);
      chrome.tabs.remove(sender.tab.id);
      currentTabId = null;
      isProcessing = false;

      console.log('[Background] Queue after closing tab:', jobQueue);

      processNextJob();
    } else {
      console.warn('[Background] close_this_tab message missing sender.tab.id');
    }
  }
});

// Listen once for manual tab closing by user
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === currentTabId) {
    console.log('[Background] Tab closed by user:', tabId);
    currentTabId = null;
    isProcessing = false;
    processNextJob();
  }
});

// Function to open next job link from queue
function processNextJob() {
  if (jobQueue.length === 0) {
    console.log('[Background] Queue empty, all jobs processed');
    isProcessing = false;
    return;
  }

  if (isProcessing) {
    console.log('[Background] Already processing a job');
    return;
  }

  isProcessing = true;
  const nextUrl = jobQueue.shift();
  console.log('[Background] Opening job tab:', nextUrl);

  chrome.tabs.create({ url: nextUrl }, (tab) => {
    currentTabId = tab.id;
  });
}

setInterval(() => {
  console.log('[Background] Current job queue:', jobQueue);
  console.log('[Background] isProcessing:', isProcessing);
}, 5000);