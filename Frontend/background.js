// Store information about each tab's state
const tabStates = new Map(); // { tabId: { domain: string, previousUrl: string } }
const MAX_HISTORY_ITEMS = 10; // Maximum number of scan history items to keep

// Get the domain name from a URL
function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return url;
  }
}

// Check if a URL is restricted (system pages)
function isRestrictedUrl(url) {
  if (!url) return true;
  return url.startsWith('chrome://') ||
         url.startsWith('chrome-extension://') ||
         url.startsWith('devtools://') ||
         url.startsWith('edge://') ||
         url.startsWith('view-source:') ||
         url.startsWith('about:');
}

// Save the scan result to browser's local storage
function storeScanHistory(result) {
  chrome.storage.local.get(["scanHistory"], (res) => {
    const history = res.scanHistory || [];
    history.unshift({
      url: result.url,
      isPhishing: result.isPhishing,
      timestamp: new Date().toLocaleString(),
      reported: false
    });
    
    // Keep only the last 10 items
    if (history.length > MAX_HISTORY_ITEMS) {
      history.pop();
    }
    
    chrome.storage.local.set({ scanHistory: history });
  });
}

// Shadow DOM Injection Logic for robust UI
function injectPopup(tabId, url, isPhishing, isSamePage = false) {
  const hostname = new URL(url).hostname;
  
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: (url, isPhishing, isSamePage, hostname) => {
      const containerId = 'phishshield-ui-container';
      let container = document.getElementById(containerId);
      if (container) container.remove();

      container = document.createElement('div');
      container.id = containerId;
      container.style.all = 'initial'; // Reset all styles
      document.body.appendChild(container);

      const shadow = container.attachShadow({ mode: 'open' });
      
      const bgColor = isPhishing ? '#ff4444' : (isSamePage ? '#2196F3' : '#4CAF50');
      const icon = isPhishing ? '⚠️' : (isSamePage ? '🔄' : '✓');
      const title = isPhishing ? 'PHISHING WARNING!' : (isSamePage ? 'Same Website' : 'Safe Website');
      const message = isPhishing 
        ? `The website "${hostname}" has been detected as a potential phishing site.`
        : (isSamePage ? 'You are still on the same verified domain.' : `"${hostname}" appears to be safe.`);

      const styles = `
        .popup-wrapper {
          position: fixed;
          top: 20px;
          right: 20px;
          background: ${bgColor};
          color: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.3);
          z-index: 2147483647;
          max-width: 350px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          animation: slideIn 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28);
        }
        @keyframes slideIn {
          from { transform: translateX(120%); }
          to { transform: translateX(0); }
        }
        .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .title-group { display: flex; align-items: center; gap: 10px; }
        .icon { font-size: 24px; }
        .title { margin: 0; font-size: 16px; font-weight: 800; letter-spacing: 0.5px; }
        .close-btn { background: none; border: none; color: white; font-size: 24px; cursor: pointer; opacity: 0.7; transition: 0.2s; }
        .close-btn:hover { opacity: 1; }
        .message { margin: 0 0 15px 0; font-size: 14px; line-height: 1.4; opacity: 0.9; }
        .actions { display: flex; gap: 10px; }
        .btn { 
          flex: 1; 
          background: white; 
          color: ${bgColor}; 
          border: none; 
          padding: 10px; 
          border-radius: 6px; 
          cursor: pointer; 
          font-weight: 700; 
          font-size: 13px;
          transition: transform 0.1s;
        }
        .btn:active { transform: scale(0.95); }
        .footer { margin-top: 15px; font-size: 9px; text-align: center; opacity: 0.6; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 8px; }
      `;

      shadow.innerHTML = `
        <style>${styles}</style>
        <div class="popup-wrapper">
          <div class="header">
            <div class="title-group">
              <span class="icon">${icon}</span>
              <h3 class="title">${title}</h3>
            </div>
            <button class="close-btn" id="ps-close">&times;</button>
          </div>
          <p class="message">${message}</p>
          <div class="actions">
            ${isPhishing ? `
              <button class="btn" id="ps-close-tab">Close Tab</button>
              <button class="btn" id="ps-report">Report</button>
            ` : `
              <button class="btn" id="ps-report-safe">Report Issue</button>
            `}
          </div>
          <div class="footer">PhishShield by Sanobar Shaikh</div>
        </div>
      `;

      shadow.getElementById('ps-close').onclick = () => container.remove();
      if (isPhishing) {
        shadow.getElementById('ps-close-tab').onclick = () => {
          chrome.runtime.sendMessage({ action: "closeTab" });
        };
        shadow.getElementById('ps-report').onclick = () => {
          window.open('https://safebrowsing.google.com/safebrowsing/report_phish/?url=' + encodeURIComponent(window.location.href), '_blank');
        };
      } else {
        shadow.getElementById('ps-report-safe').onclick = () => {
          window.open('https://safebrowsing.google.com/safebrowsing/report_phish/?url=' + encodeURIComponent(window.location.href), '_blank');
        };
        // Auto-remove safe indicators
        setTimeout(() => { if (container.parentNode) container.remove(); }, 5000);
      }
    },
    args: [url, isPhishing, isSamePage, hostname]
  });
}

// Levenshtein distance for typosquatting detection
function getLevenshteinDistance(a, b) {
  if (!a || !b) return 999; // Safety check
  const matrix = Array.from({ length: a.length + 1 }, () => 
    Array.from({ length: b.length + 1 }, (_, j) => j)
  );
  for (let i = 1; i <= a.length; i++) {
    matrix[i][0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

function checkTyposquatting(domain, trustedDomains) {
  if (!domain || typeof domain !== 'string') return { isSuspicious: false };
  
  const domainParts = domain.split('.');
  if (domainParts.length < 2) return { isSuspicious: false };
  
  const mainDomain = domainParts[domainParts.length - 2];
  if (!mainDomain) return { isSuspicious: false };
  
  for (const trusted of trustedDomains) {
    const trustedParts = trusted.split('.');
    if (trustedParts.length < 2) continue;
    
    const trustedMain = trustedParts[trustedParts.length - 2];
    if (!trustedMain || mainDomain === trustedMain) continue; 
    
    const distance = getLevenshteinDistance(mainDomain, trustedMain);
    // If distance is 1 or 2, it's very suspicious (e.g., googIe vs google)
    if (distance > 0 && distance <= 2) {
      return { isSuspicious: true, target: trusted };
    }
  }
  return { isSuspicious: false };
}

// Main function to check if a URL is phishing
async function checkForPhishing(url, tabId, isReload = false) {
  if (isRestrictedUrl(url)) {
    return { url, isPhishing: false, restricted: true };
  }
  
  try {
    const domain = getDomain(url);
    const tabState = tabStates.get(tabId);
    
    // ===================================================
    // SAME DOMAIN CHECK LOGIC
    // ===================================================
    // Get the most recent scan from history
    const history = await new Promise((resolve) => {
      chrome.storage.local.get(["scanHistory"], (res) => {
        resolve(res.scanHistory || []);
      });
    });

    // If we have scan history
    if (history.length > 0) {
      // Get the domain from the most recent scan
      const mostRecentDomain = getDomain(history[0].url);
      
      // If the current domain matches the most recently scanned domain
      if (mostRecentDomain === domain) {
        // If this is a reload, show the same indicator as before
        if (isReload) {
          injectPopup(tabId, url, history[0].isPhishing, false);
        }
        
        // Update tab state
        tabStates.set(tabId, {
          domain: domain,
          previousUrl: url
        });
        
        return history[0];
      }
    }
    // ===================================================

    // List of trusted websites that we don't need to check
    const trustedDomains = [
      'google.com', 'openai.com', 'chatgpt.com', 'microsoft.com', 'github.com',
      'stackoverflow.com', 'linkedin.com', 'facebook.com', 'twitter.com', 'x.com',
      'youtube.com', 'amazon.com', 'netflix.com', 'spotify.com', 'reddit.com',
      'wikipedia.org', 'medium.com', 'quora.com', 'dropbox.com', 'slack.com',
      'discord.com', 'zoom.us', 'mozilla.org', 'apple.com', 'adobe.com',
      'cloudflare.com', 'paypal.com', 'binance.com', 'coinbase.com'
    ];

    // Check for typosquatting (homograph attacks)
    const typoCheck = checkTyposquatting(domain, trustedDomains);
    if (typoCheck.isSuspicious) {
      const result = {
        url,
        isPhishing: true,
        reason: `Potential Typosquatting (mimicking ${typoCheck.target})`,
        timestamp: new Date().toLocaleString()
      };
      storeScanHistory(result);
      injectPopup(tabId, url, true, false);
      return result;
    }

    // If domain is trusted, mark it as safe
    const isTrusted = trustedDomains.some(trustedDomain => domain.includes(trustedDomain));
    if (isTrusted) {
      const result = {
        url,
        isPhishing: false,
        timestamp: new Date().toLocaleString()
      };
      
      // Save result and show safe indicator
      storeScanHistory(result);
      injectPopup(tabId, url, false, false);
      
      return result;
    }

    // Check URL using our ML model
    const response = await fetch("https://phishshield-11y5.onrender.com/predict_url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: url }),
    });

    if (!response.ok) throw new Error(`Status ${response.status}`);
    const data = await response.json();
    const isPhishing = data.prediction === 0;

    // Update tab information
    tabStates.set(tabId, {
      domain: domain,
      previousUrl: url
    });
    
    // Create result object
    const result = {
      url,
      isPhishing,
      timestamp: new Date().toLocaleString()
    };

    // Save result and show appropriate popup
    storeScanHistory(result);
    injectPopup(tabId, url, isPhishing, false);

    return result;
  } catch (error) {
    console.error("Scan error:", error);
    return { error: error.message };
  }
}

// Function to limit how often we check URLs
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Create a debounced version of checkForPhishing
const debouncedCheck = debounce(checkForPhishing, 500);

// Watch for when user navigates to a new page
chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId === 0 && !isRestrictedUrl(details.url)) { // Only check main page, not iframes, and skip restricted URLs
    const isReload = details.transitionType === 'reload';
    debouncedCheck(details.url, details.tabId, isReload);
  }
});

// Watch for when user switches to a different tab
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab && tab.url && !isRestrictedUrl(tab.url)) {
      debouncedCheck(tab.url, activeInfo.tabId, false);
    }
  });
});

// Clean up when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  tabStates.delete(tabId);
});

// Handle messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "closeTab") {
    chrome.tabs.remove(sender.tab.id);
    return;
  }
  if (request.action === "getCurrentStatus") {
    // Send current URL status to popup
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (!tabs || tabs.length === 0) {
        sendResponse({ error: "No active tab found" });
        return;
      }
      const url = tabs[0].url;
      const result = await checkForPhishing(url, tabs[0].id, false);
      sendResponse(result);
    });
    return true;
  } else if (request.action === "getHistory") {
    // Send scan history to popup
    chrome.storage.local.get(["scanHistory"], (res) => {
      sendResponse(res.scanHistory || []);
    });
    return true;
  }
});

// Clean up tab states every 30 minutes
setInterval(() => {
  tabStates.clear();
}, 30 * 60 * 1000);

// Log when the extension starts
console.log("PhishShield by Sanobar Shaikh background script started"); 
 