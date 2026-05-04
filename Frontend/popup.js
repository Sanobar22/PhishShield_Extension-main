document.addEventListener("DOMContentLoaded", function () {
  const resultDiv = document.getElementById("result");
  const loadingDiv = document.getElementById("loading");
  const historyDiv = document.getElementById("history");

  // Show loading state
  loadingDiv.style.display = "block";

  // Get current status from background script
  chrome.runtime.sendMessage({ action: "getCurrentStatus" }, (response) => {
    loadingDiv.style.display = "none";
    
    if (response?.error) {
      resultDiv.innerHTML = `
        <div class="error">
          ❌ Error checking URL<br>
          <small>${response.error}</small>
        </div>
      `;
      return;
    }

    const verdict = response.isPhishing ? "❌ Phishing" : "✅ Safe";
    const verdictClass = response.isPhishing ? "phishing" : "safe";

    resultDiv.innerHTML = `
      <div class="${verdictClass}">
        <strong>${verdict}</strong><br>
        <small>${response.url}</small>
      </div>
    `;
  });

  // Load scan history
  function loadHistory() {
    chrome.runtime.sendMessage({ action: "getHistory" }, (history) => {
      if (!history || !Array.isArray(history)) return;
      
      // Calculate safety score
      if (history.length > 0) {
        const phishingCount = history.filter(h => h.isPhishing).length;
        const score = Math.round(((history.length - phishingCount) / history.length) * 100);
        const scoreEl = document.getElementById("safety-score");
        scoreEl.innerText = `${score}%`;
        scoreEl.style.color = score > 80 ? "#4CAF50" : (score > 50 ? "#FF9800" : "#F44336");
        
        const healthEl = document.getElementById("shield-health");
        if (phishingCount > 0) {
          healthEl.innerText = "Alert";
          healthEl.style.color = "#FF9800";
        } else {
          healthEl.innerText = "Active";
          healthEl.style.color = "#4CAF50";
        }
      }

      historyDiv.innerHTML = "";
      history.forEach((entry) => {
        const el = document.createElement("div");
        el.className = `history-entry ${entry.isPhishing ? 'phishing' : 'safe'}`;
        el.innerHTML = `
          <div>
            <strong>${entry.isPhishing ? '❌ Phishing' : '✅ Safe'}</strong>
            <a href="https://safebrowsing.google.com/safebrowsing/report_phish/?url=${encodeURIComponent(entry.url)}" 
               target="_blank" 
               class="report-link">Report</a>
          </div>
          <div class="url">${entry.url}</div>
          <div class="time">Scanned at: ${entry.timestamp}</div>
        `;
        historyDiv.appendChild(el);
      });
    });
  }

  // Initial history load
  loadHistory();

  // Refresh history every 5 seconds
  setInterval(loadHistory, 5000);
});
