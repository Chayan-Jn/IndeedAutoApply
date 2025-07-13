chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === 'open_job_tab') {
    console.log('[BG] Received open_job_tab message:', msg.url);

    chrome.tabs.create({ url: msg.url, active: true }, (tab) => {
      if (chrome.runtime.lastError) {
        console.error('[BG] Tab open failed:', chrome.runtime.lastError.message);
        return;
      }

      console.log('[BG] Opened job tab:', tab.id);

      // setTimeout(() => {
      //   chrome.tabs.remove(tab.id, () => {
      //     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      //       if (tabs.length > 0) {
      //         chrome.tabs.sendMessage(tabs[0].id, {
      //           type: 'continue_auto_apply',
      //           index: (msg.index || 0) + 1,
      //           searchTerm: msg.searchTerm || ''
      //         });
      //       }
      //     });
      //   });
      // }, 1500);
    });
  }
});
