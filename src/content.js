console.log('[Content] Script loaded');
console.log('[Content] Current URL:', window.location.href);

// On page load: only auto-apply if already on search results page
window.addEventListener('load', () => {
  setTimeout(() => {
    const url = window.location.href;
    if (url.includes('/jobs?q=')) {
      console.log('[Content] On search results page');
      const queryParam = new URLSearchParams(window.location.search).get('q') || '';
      startAutoApply(queryParam.toLowerCase());
    } else {
      console.log('[Content] On homepage – waiting for extension trigger');
    }
  }, 2500);
});

//  Called from extension popup 
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'trigger_search') {
    console.log('[Content] trigger_search received:', msg);
    setTimeout(() => {
      fillAndSubmitSearchForm(msg.job || '', msg.location || 'India');
    }, 1500); // slight delay to ensure page is ready
  }
});

// Fill inputs and trigger the search 
function fillAndSubmitSearchForm(job, location) {
  const jobInput = document.querySelector('input[name="q"]');
  const locationInput = document.querySelector('input[name="l"]');
  const searchBtn = document.querySelector('button[type="submit"], button[aria-label="Find jobs"]');

  if (jobInput) {
    jobInput.focus();
    jobInput.value = '';
    jobInput.dispatchEvent(new Event('input', { bubbles: true }));
    jobInput.value = job;
    jobInput.dispatchEvent(new Event('input', { bubbles: true }));
  }

  if (locationInput) {
    locationInput.focus();
    locationInput.value = '';
    locationInput.dispatchEvent(new Event('input', { bubbles: true }));
    locationInput.value = location;
    locationInput.dispatchEvent(new Event('input', { bubbles: true }));
  }

  if (searchBtn) {
    console.log('[Content] Clicking search button...');
    searchBtn.click();
  } else {
    console.warn('[Content] Search button not found');
  }
}

//  Auto-click first matching job 
function startAutoApply(searchTerm) {
    const jobCards = document.querySelectorAll('div.cardOutline.tapItem');
    console.log(`[Content] Found ${jobCards.length} job cards`);
  
    for (const card of jobCards) {
      const titleSpan = card.querySelector('h2.jobTitle a span[title]');
      if (titleSpan) {
        const jobTitle = titleSpan.title.toLowerCase();
        console.log('🔎 Found job title:', jobTitle);
  
        if (jobTitle.includes(searchTerm)) {
          const link = titleSpan.closest('a');
          if (link) {
            console.log('✅ Match found, clicking job:', jobTitle);
  
            link.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
            const mouseEvent = new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window
            });
            link.dispatchEvent(mouseEvent);
  
            setTimeout(() => {
              link.click();
              setTimeout(() => {
                clickApplyButton();
              }, 2000);
            }, 100);
  
            return;
          }
        }
      }
    }
  
    console.log('❌ No matching job found on this page');
}

//  Reliable Apply button click + fallback open new tab 
function clickApplyButton() {
  console.log('⏳ Waiting for Apply button or job URL...');

  let attempts = 0;
  const maxAttempts = 10;

  const interval = setInterval(() => {
    attempts++;

    const hiddenInput = document.querySelector('input[name="jobUrl"]');
    if (hiddenInput && hiddenInput.value) {
      console.log('✅ Found job URL:', hiddenInput.value);
      chrome.runtime.sendMessage({
        type: 'open_job_tab',
        url: hiddenInput.value
      });
      clearInterval(interval);
      return;
    }

    const applyBtn = [...document.querySelectorAll('button')]
      .find(btn => btn.innerText.trim().toLowerCase() === 'apply now');

    if (applyBtn) {
      console.log('✅ Apply button found, fallback opening job detail link.');

      const jobLink = document.querySelector('a[data-jk], a[href*="/rc/clk"]');
      if (jobLink && jobLink.href) {
        chrome.runtime.sendMessage({
          type: 'open_job_tab',
          url: jobLink.href
        });
      } else {
        console.warn('❌ Could not find job details link.');
      }

      clearInterval(interval);
      return;
    }

    console.log(`🔄 Attempt ${attempts}/${maxAttempts} - still waiting...`);

    if (attempts >= maxAttempts) {
      console.warn('❌ Apply button not found after retries.');
      clearInterval(interval);
    }
  }, 1000);
}



// FOR VIEWJOB PAGE

window.addEventListener('load', () => {
  setTimeout(() => {
    const url = window.location.href;
    if (url.includes('/viewjob')) {
      console.log('On viewjob page trying to apply automatically');
      handleViewJobPage();
    }
  }, 2000);
});

function handleViewJobPage() {
  console.log('Handling viewjob page trying to apply automatically');
  waitAndClickApplyButton();
}


function waitAndClickApplyButton() {
  console.log('⏳ Waiting for Apply button or job URL...');

  let attempts = 0;
  const maxAttempts = 10;

  const interval = setInterval(() => {
    attempts++;

    const hiddenInput = document.querySelector('input[name="jobUrl"]');
    if (hiddenInput && hiddenInput.value) {
      console.log('✅ Found job URL:', hiddenInput.value);
      chrome.runtime.sendMessage({
        type: 'open_job_tab',
        url: hiddenInput.value
      });
      clearInterval(interval);
      return;
    }

    const applyBtn = document.querySelector('button[aria-label*="Apply now" i]');

    if (applyBtn) {
      console.log('✅ Apply button found, clicking.');
      applyBtn.click();
      clearInterval(interval);
      return;
    }

    console.log(`🔄 Attempt ${attempts}/${maxAttempts} - still waiting...`);

    if (attempts >= maxAttempts) {
      console.warn('❌ Apply button not found after retries.');
      clearInterval(interval);
    }
  }, 1000);
}


// smart apply page
window.addEventListener('load', () => {
  setTimeout(() => {
    const url = window.location.href;
    if (url.includes('smartapply')) {
      console.log('On SmartApply page. Waiting 15 seconds for manual resume selection...');

      setTimeout(() => {
        console.log('⏳ 15 seconds passed. Attempting to click Continue...');
        const continueBtn = [...document.querySelectorAll('button')]
            .find(btn => btn.innerText.trim().toLowerCase() === 'continue');

        if (continueBtn) {
              continueBtn.click();
              console.log('✅ Clicked Continue on SmartApply');
              setTimeout(() => {
                  handlePostResumeFlow();
              }, 3000); // Small delay to allow next page to load
          } else {
          console.warn('❌ Continue button not found on SmartApply');
        }
      }, 15000);
    }
  }, 2000);
});


window.addEventListener('load', () => {
  setTimeout(() => {
    const url = window.location.href;
    if (url.includes('smartapply')) {
      console.log('On SmartApply page. Waiting 15 seconds for manual resume selection...');

      setTimeout(() => {
        console.log('⏳ 15 seconds passed. Attempting to click Continue...');
        const continueBtn = [...document.querySelectorAll('button')]
            .find(btn => btn.innerText.trim().toLowerCase() === 'continue');

        if (continueBtn) {
              continueBtn.click();
              console.log('✅ Clicked Continue on SmartApply');
              setTimeout(() => {
                  handlePostResumeFlow();
              }, 3000); // Small delay to allow next page to load
          } else {
          console.warn('❌ Continue button not found on SmartApply');
        }
      }, 15000);
    }

    // 👇 ADD THIS
    if (url.includes('smartapply')) {
      console.log('👀 Watching SmartApply page for post-upload flow...');

      const interval = setInterval(() => {
        handlePostResumeFlow();
      }, 3000);

      setTimeout(() => {
        clearInterval(interval);
        console.log('🛑 Stopped watching SmartApply after 1 minute');
      }, 60000);
    }
  }, 2000);
});

function handlePostResumeFlow() {
  console.log('🔍 Checking post-resume-upload flow...');

  // Case 1️⃣ - Confirmation Page: Application submitted
  if (document.body.innerText.toLowerCase().includes('application submitted')) {
      console.log('✅ Application submitted. Sending message to close tab...');
      chrome.runtime.sendMessage({ type: 'close_this_tab' });
      return;
  }

  // Case 2️⃣ - Additional Employer Questions / SmartApply Continue Buttons / Submit
  const nextOrSubmitOrContinueBtn = [...document.querySelectorAll('button')]
      .find(btn => {
          const text = btn.innerText.trim().toLowerCase();
          return text.includes('next') || text.includes('submit') || text.includes('continue');
      });

  const testIdContinueBtn = document.querySelector('button[data-testid="continue-button"]');

  if (nextOrSubmitOrContinueBtn) {
      console.log('➡️ Found "Next", "Submit", or "Continue" button. Clicking...');
      nextOrSubmitOrContinueBtn.click();
      return;
  } else if (testIdContinueBtn) {
      console.log('➡️ Found button with data-testid="continue-button". Clicking...');
      testIdContinueBtn.click();
      return;
  }

  // Case 3️⃣ - Redirected to External Site (not on Indeed)
  if (!window.location.hostname.includes('indeed.com')) {
      console.log('🌐 Redirected off Indeed to:', window.location.hostname);
      chrome.runtime.sendMessage({ type: 'close_this_tab' });
      return;
  }

  console.log('❌ No recognizable post-upload flow detected.');
}
