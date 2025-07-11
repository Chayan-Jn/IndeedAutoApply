chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'trigger_search') {
      const jobInput = document.querySelector('input[name="q"]');
      const locationInput = document.querySelector('input[name="l"]');
      const searchButton = document.querySelector('button[type="submit"]');
  
      if (jobInput) {
        jobInput.value = msg.job;
        jobInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
  
      if (locationInput) {
        locationInput.value = msg.location;
        locationInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
  
      if (searchButton) searchButton.click();
    }
  });
  