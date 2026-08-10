// AI News Nexus — Link Collector Extension
// Popup script: shows current tab, saves URL to /api/collect

const API_BASE = 'https://nexus.osiris2025.com';

document.addEventListener('DOMContentLoaded', () => {
  const urlEl = document.getElementById('pageUrl');
  const saveBtn = document.getElementById('saveBtn');
  const statusEl = document.getElementById('status');
  const resultEl = document.getElementById('result');

  let currentUrl = '';

  // Get the active tab's URL
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (tab?.url) {
      currentUrl = tab.url;
      urlEl.textContent = currentUrl;
    } else {
      urlEl.textContent = 'Could not determine page URL';
      saveBtn.disabled = true;
    }
  });

  // Save handler
  saveBtn.addEventListener('click', async () => {
    saveBtn.disabled = true;
    saveBtn.textContent = '⏳ Saving…';
    statusEl.innerHTML = '🔍 Fetching & analyzing…';
    resultEl.innerHTML = '';
    statusEl.style.display = 'block';

    try {
      const resp = await fetch(`${API_BASE}/api/collect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url: currentUrl }),
      });

      const data = await resp.json();

      if (data.error) {
        statusEl.innerHTML = `❌ ${data.error}`;
        if (data.error.includes('signed in') || data.error.includes('Authentication')) {
          statusEl.innerHTML +=
            '<br><a href="https://nexus.osiris2025.com/profile" target="_blank" style="font-size:12px">Sign in at nexus.osiris2025.com</a>';
        }
        saveBtn.disabled = false;
        saveBtn.textContent = '💾 Save to Nexus';
        return;
      }

      // Success
      statusEl.innerHTML = '✅ Saved as draft!';
      statusEl.style.display = 'block';

      let html = '<div class="card">';
      html += `<div style="font-weight:700;margin-bottom:4px">${escapeHtml(data.article?.title || 'Saved')}</div>`;

      // Magazine
      if (data.magazine) {
        html += `<div class="mag">📰 ${escapeHtml(data.magazine.name)}</div>`;
      } else {
        html += `<div style="font-size:11px;opacity:0.6;margin-top:4px">📰 No magazine assigned</div>`;
      }

      // Suitability warnings
      if (data.warnings && data.warnings.length > 0) {
        for (const w of data.warnings) {
          const cls = w.level === 'block' ? 'block' : w.level === 'warn' ? 'warn-lv' : 'info';
          const icon = w.level === 'block' ? '🚫' : w.level === 'warn' ? '⚠' : 'ℹ';
          html += `<div class="warn ${cls}"><span>${icon}</span><span>${escapeHtml(w.message)}</span></div>`;
        }
      }

      html += '</div>';

      // Link to admin
      html +=
        '<div style="font-size:11px;text-align:center;margin-top:4px">💡 <a href="https://nexus.osiris2025.com/admin" target="_blank">Review in Dispatch Desk</a></div>';

      resultEl.innerHTML = html;
      saveBtn.textContent = '✅ Saved';
    } catch (e) {
      statusEl.innerHTML = `❌ Network error: ${e.message}`;
      saveBtn.disabled = false;
      saveBtn.textContent = '💾 Save to Nexus';
    }
  });

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
});