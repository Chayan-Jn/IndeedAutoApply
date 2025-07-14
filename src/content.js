console.log('[Content] Script loaded');
console.log('[Content] Current URL:', window.location.href);

// On search results page: collect matching job links into queue
window.addEventListener('load', () => {
  setTimeout(() => {
    const url = window.location.href;
    if (url.includes('/jobs?q=')) {
      console.log('[Content] On search results page');
      const queryParam = new URLSearchParams(window.location.search).get('q') || '';
      collectJobsAcrossPages(queryParam.toLowerCase());
    } else {
      console.log('[Content] On homepage – waiting for extension trigger');
    }
  }, 2500);
});

// Trigger search from popup message
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'trigger_search') {
    console.log('[Content] trigger_search received:', msg);
    setTimeout(() => {
      fillAndSubmitSearchForm(msg.job || '', msg.location || 'India');
    }, 1500);
  }
});

// Fill inputs and submit search form
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

// Collect matching job links to queue (filter out applied and "Apply on company site")
function collectMatchingJobLinks(searchTerm) {
  const jobCards = document.querySelectorAll('div.cardOutline.tapItem');
  const links = [];

  jobCards.forEach(card => {
    const titleSpan = card.querySelector('h2.jobTitle a span[title]');
    const appliedBadge = card.querySelector('[aria-label*="Applied"]');
    const companySiteApplyBadge = card.querySelector('[aria-label*="Apply on company site"]');
    const companySiteApplyText = card.innerText.toLowerCase().includes('apply on company site');

    if (titleSpan && !appliedBadge && !companySiteApplyBadge && !companySiteApplyText) {
      const jobTitle = titleSpan.title.toLowerCase();
      if (jobTitle.includes(searchTerm)) {
        const link = titleSpan.closest('a')?.href;
        if (link) links.push(link);
      }
    }
  });

  console.log(`[Content] Collected ${links.length} links for queue`);
  chrome.runtime.sendMessage({ type: 'init_queue', links });
}

async function collectJobsAcrossPages(searchTerm) {
  let page = 1;
  let morePages = true;

  while (morePages) {
    console.log(`[Content] Collecting jobs on page ${page}`);

    collectMatchingJobLinks(searchTerm);

    // Wait 2.5 seconds to allow the page to update after navigation
    await new Promise(r => setTimeout(r, 2500));

    // Find the "Next" button by data-testid attribute
    const nextBtn = document.querySelector('a[data-testid="pagination-page-next"]');

    if (nextBtn && !nextBtn.classList.contains('disabled')) {
      console.log('[Content] Going to next page:', nextBtn.href);
      nextBtn.click();
      page++;
    } else {
      console.log('[Content] No next page found or disabled. Finished pagination.');
      morePages = false;
    }

    // Wait some time for the next page to load properly before next iteration
    await new Promise(r => setTimeout(r, 2500));
  }
}



// Handle /viewjob page auto-apply flow
window.addEventListener('load', () => {
  setTimeout(() => {
    if (window.location.href.includes('/viewjob')) {

      const pageText = document.body.innerText.toLowerCase();
      // Check for external apply and close tab if found
      if (pageText.includes('apply on company site')) {
        console.log('[Content] Detected "Apply on company site" on job page, closing tab');
        chrome.runtime.sendMessage({ type: 'close_this_tab' });
        return;
      }

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
      // Remove this call to open_job_tab to prevent duplicate tabs opening
      // chrome.runtime.sendMessage({ type: 'open_job_tab', url: hiddenInput.value });
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

// Handle smartapply pages: wait for manual resume selection then click continue and watch post-resume flow
window.addEventListener('load', () => {
  setTimeout(() => {
    if (window.location.href.includes('smartapply')) {
      console.log('On SmartApply page. Waiting 15 seconds for manual resume selection...');
      setTimeout(() => {
        console.log('⏳ 15 seconds passed. Attempting to click Continue...');
        const continueBtn = [...document.querySelectorAll('button')]
          .find(btn => btn.innerText.trim().toLowerCase() === 'continue');
        if (continueBtn) {
          continueBtn.click();
          console.log('✅ Clicked Continue on SmartApply');
          setTimeout(handlePostResumeFlow, 3000);
        } else {
          console.warn('❌ Continue button not found on SmartApply');
        }
      }, 15000);

      console.log('👀 Watching SmartApply page for post-upload flow...');
      const interval = setInterval(handlePostResumeFlow, 3000);
      setTimeout(() => {
        clearInterval(interval);
        console.log('🛑 Stopped watching SmartApply after 1 minute');
      }, 60000);
    }
  }, 2000);
});

// Post resume upload flow handler
function handlePostResumeFlow() {
  console.log('🔍 Checking post-resume-upload flow...');

  const bodyText = document.body.innerText.toLowerCase();

  // Check for success message text
  if (
    bodyText.includes('your application has been submitted!') ||
    bodyText.includes('keep track of your applications')
  ) {
    console.log('✅ Application confirmed by success message. Sending message to close tab...');
    chrome.runtime.sendMessage({ type: 'close_this_tab' });
    return;
  }

  // Check for "Return to job search" button - good sign application is done
  const returnToSearchBtn = [...document.querySelectorAll('button, a')]
    .find(el => el.innerText.trim().toLowerCase().includes('return to job search'));

  if (returnToSearchBtn) {
    console.log('✅ Found "Return to job search" button - closing tab');
    chrome.runtime.sendMessage({ type: 'close_this_tab' });
    return;
  }

  // Your existing next/submit/continue buttons check
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

  // If redirected off Indeed, close tab
  if (!window.location.hostname.includes('indeed.com')) {
    console.log('🌐 Redirected off Indeed to:', window.location.hostname);
    chrome.runtime.sendMessage({ type: 'close_this_tab' });
    return;
  }

  console.log('❌ No recognizable post-upload flow detected.');
}

// Handle intervention page "Apply anyway" button with retry 5 times max
window.addEventListener('load', () => {
  if (window.location.href.includes('smartapply.indeed.com/beta/indeedapply/form/questions-module/intervention')) {
    console.log('⚠️ On intervention page - attempting to click Apply Anyway (max 5 attempts)');

    let attempts = 0;
    const maxAttempts = 5;

    const interval = setInterval(() => {
      attempts++;

      const button = document.querySelector('button[data-testid]');
      if (button && button.innerText.trim().toLowerCase().includes('apply anyway')) {
        button.click();
        console.log('✅ Clicked Apply Anyway on attempt', attempts);
        clearInterval(interval);
        return;
      }

      console.log(`🔄 Attempt ${attempts}/${maxAttempts} - Apply Anyway not found yet`);

      if (attempts >= maxAttempts) {
        console.warn('❌ Failed to find Apply Anyway after 5 attempts.');
        clearInterval(interval);
      }
    }, 1000);
  }
});
