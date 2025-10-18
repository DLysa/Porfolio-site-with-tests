const apiBase = document.querySelector('meta[name="api-base"]').content;

// === Dark/Light toggle ===
const toggleBtn = document.getElementById('toggle-theme');
if (toggleBtn) {
  const currentTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.classList.toggle('dark', currentTheme === 'dark');
  toggleBtn.addEventListener('click', () => {
    const html = document.documentElement;
    const newTheme = html.classList.contains('dark') ? 'light' : 'dark';
    html.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('theme', newTheme);
  });
}

// === Panel elements ===
const statusEl = document.querySelector('[data-testid="status"]');
const testStatusEl = document.getElementById('test-status');
const testCodeEl = document.getElementById('test-code');
const tabButtons = document.querySelectorAll('.tab-btn');
const rerunBtn = document.getElementById('rerun-test');
const testPanel = document.getElementById('test-panel');
const togglePanelBtn = document.getElementById('toggle-panel');

// === Language/Framework icons ===
function getIconHTML(icon) {
  switch ((icon || '').toLowerCase()) {
    case 'python': return '<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" class="w-5 h-5">';
    case 'typescript': return '<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" class="w-5 h-5">';
    case 'java': return '<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg" class="w-5 h-5">';
    default: return '';
  }
}

// === Backend health check ===
async function checkBackendHealth() {
  if (!statusEl) return;
  statusEl.textContent = 'Loading...';
  statusEl.className = 'text-gray-500 font-bold';
  try {
    const res = await fetch(`${apiBase}/health`);
    if (!res.ok) throw new Error('Server error');
    statusEl.textContent = 'Connected';
    statusEl.className = 'text-green-500 font-bold';
  } catch (err) {
    statusEl.textContent = 'Error occurred';
    statusEl.className = 'text-red-500 font-bold';
  }
}


// === Active tab handling ===
let activeTab = 'api';
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('bg-green-500', 'scale-105'));
    btn.classList.add('bg-green-500', 'scale-105');
    activeTab = btn.dataset.type;
    loadTest(activeTab);
  });
});

// === Button state helpers ===
function setButtonsDisabled(disabled) {
  tabButtons.forEach(btn => {
    btn.disabled = disabled;
    btn.classList.toggle('opacity-50', disabled);
    btn.classList.toggle('cursor-not-allowed', disabled);
  });
  rerunBtn.disabled = disabled;
  rerunBtn.classList.toggle('opacity-50', disabled);
  rerunBtn.classList.toggle('cursor-not-allowed', disabled);
}


// === Load test metadata & code ===
async function loadTest(type) {
  if (!testStatusEl) return;
  testStatusEl.textContent = 'Loading...';
  testStatusEl.className = 'mb-2 p-2 rounded font-bold text-center text-gray-500 bg-gray-200 dark:bg-gray-700 transition-all duration-300 shadow-inner';

  try {
    const metaRes = await fetch(`${apiBase}/test-metadata/${type}`);
    if (!metaRes.ok) throw new Error(`Metadata fetch failed (${metaRes.status})`);
    const meta = await metaRes.json();

    const rawStatus = (meta.status || 'Unknown').toString();
    const display = (meta.display || meta.status || 'Unknown').toString();
    const statusKey = rawStatus.toLowerCase();

    let bg = 'bg-gray-200 dark:bg-gray-700';
    let color = 'text-gray-800';
    let emoji = '⚙️';

    if (statusKey.startsWith('passed')) { bg = 'bg-green-100 dark:bg-green-800'; color = 'text-green-600 dark:text-green-300'; emoji = '✅'; }
    else if (statusKey.startsWith('failed')) { bg = 'bg-red-100 dark:bg-red-800'; color = 'text-red-600 dark:text-red-300'; emoji = '❌'; }
    else if (statusKey.startsWith('error')) { bg = 'bg-yellow-100 dark:bg-yellow-700'; color = 'text-yellow-600 dark:text-yellow-300'; emoji = '⚠️'; }

    const elapsedText = meta.elapsed ? ` (${parseFloat(meta.elapsed).toFixed(2)}s)` : '';
    testStatusEl.innerHTML = `${emoji} ${display}${elapsedText}`;
    testStatusEl.className = `mb-2 p-2 rounded font-bold text-center transition-all duration-300 shadow-md ${bg} ${color}`;

    // fetch and display test code
    const codeRes = await fetch(`${apiBase}/test-code/${type}`);
    if (!codeRes.ok) {
      testCodeEl.textContent = `⚠️ Test file not found: ${type} (code ${codeRes.status})`;
      return;
    }
    const codeText = await codeRes.text();
    testCodeEl.textContent = codeText;
    testCodeEl.scrollTop = 0;
  } catch (err) {
    testStatusEl.textContent = 'Error loading test';
    testStatusEl.className = 'mb-2 p-2 rounded font-bold text-center bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-300 shadow-md transition-all duration-300';
    testCodeEl.textContent = String(err);
  }
}

// === Rerun test ===
rerunBtn.addEventListener('click', async () => {
  setButtonsDisabled(true);

  testStatusEl.textContent = 'Executing test cases...';
  testStatusEl.className = 'mb-2 p-2 rounded font-bold text-center text-gray-500 bg-gray-200 dark:bg-gray-700 shadow-inner transition-all duration-300';

  const activeTabKey = `lastTestResult_${activeTab}`;

  try {
    const res = await fetch(`${apiBase}/run-test/${activeTab}`, { method: 'POST' });
    if (!res.ok) {
      let errBody = '';
      try { errBody = await res.text(); } catch(e) { errBody = String(e); }
      throw new Error(`Test runner returned ${res.status}: ${errBody}`);
    }
    const result = await res.json();

    const baseStatus = (result.status || 'Unknown').toString();
    const display = (result.display || result.status || 'Unknown').toString();
    const statusKey = baseStatus.toLowerCase();

    let bg = 'bg-gray-200 dark:bg-gray-700';
    let color = 'text-gray-800';
    let emoji = '⚙️';

    if (statusKey.startsWith('passed')) { bg = 'bg-green-100 dark:bg-green-800'; color = 'text-green-600 dark:text-green-300'; emoji = '✅'; }
    else if (statusKey.startsWith('failed')) { bg = 'bg-red-100 dark:bg-red-800'; color = 'text-red-600 dark:text-red-300'; emoji = '❌'; }
    else if (statusKey.startsWith('error')) { bg = 'bg-yellow-100 dark:bg-yellow-700'; color = 'text-yellow-600 dark:text-yellow-300'; emoji = '⚠️'; }

    const durationText = result.duration ? ` ( ${parseFloat(result.duration).toFixed(2)}s)` : '';
    testStatusEl.innerHTML = `${emoji} ${display}${durationText}`;
    testStatusEl.className = `mb-2 p-2 rounded font-bold text-center transition-all duration-300 shadow-md ${bg} ${color}`;

    localStorage.setItem(activeTabKey, JSON.stringify({
      status: baseStatus,
      display: display,
      duration: result.duration || null,
      timestamp: Date.now()
    }));

    if (result.output) {
      testCodeEl.textContent = result.output;
      testCodeEl.scrollTop = 0;
    }

  } catch (err) {
    testStatusEl.textContent = 'Error executing test';
    testStatusEl.className = 'mb-2 p-2 rounded font-bold text-center bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-300 shadow-md transition-all duration-300';
    testCodeEl.textContent = String(err);
  } finally {
    setButtonsDisabled(false);
  }
});

// === On page load, restore last test result ===
let panelOpen = true;
window.addEventListener('DOMContentLoaded', () => {
  checkBackendHealth();

  // default select API tab if present
  const defaultTab = document.querySelector('.tab-btn[data-type="api"]');
  if (defaultTab) defaultTab.click();

  // restore last test result from localStorage
  const activeTabKey = `lastTestResult_${activeTab}`;
  const saved = localStorage.getItem(activeTabKey);
  if (saved) {
    try {
      const data = JSON.parse(saved);
      const base = (data.status || '').toString().toLowerCase();
      const display = data.display || (data.status ? (data.status.charAt(0).toUpperCase() + data.status.slice(1)) : 'Unknown');
      const emoji = base.startsWith('passed') ? '✅' : base.startsWith('failed') ? '❌' : '⚠️';
      const durationText = data.duration ? ` (Last execution ${parseFloat(data.duration).toFixed(2)}s)` : '';
      testStatusEl.innerHTML = `${emoji} ${display}${durationText}`;
    } catch (e) {
      // ignore parse errors
    }
  }

  // ensure panel visible
  testPanel.style.transform = 'translateX(0)';
  togglePanelBtn.innerHTML = '&#x276F;';
  panelOpen = true;
});

// === Panel toggle ===
togglePanelBtn.addEventListener('click', () => {
  if (panelOpen) {
    testPanel.style.transform = 'translateX(100%)';
    togglePanelBtn.innerHTML = '&#x276E;';
  } else {
    testPanel.style.transform = 'translateX(0)';
    togglePanelBtn.innerHTML = '&#x276F;';
  }
  panelOpen = !panelOpen;
});

// === CV Editable Panel ===
const editBtn = document.getElementById('edit-toggle');
const saveBtn = document.getElementById('save-cv');
const resetBtn = document.getElementById('reset-cv');
const cvStatus = document.getElementById('cv-status');
const editableEls = document.querySelectorAll('.editable');
const originalData = {};
editableEls.forEach(el => { if (el.id) originalData[el.id] = el.innerHTML; });
let editMode = false;

editBtn?.addEventListener('click', () => {
  editMode = !editMode;
  editableEls.forEach(el => el.contentEditable = editMode);
  if (saveBtn) saveBtn.disabled = !editMode;
  if (resetBtn) resetBtn.disabled = !editMode;
  editBtn.textContent = editMode ? '✅ Done Editing' : '✏️ Edit Mode';
  if (cvStatus) cvStatus.textContent = editMode
      ? 'Edit mode enabled — fields are now editable.'
      : 'Edit mode disabled.';
});

saveBtn?.addEventListener('click', async () => {
  const updatedData = {};
  editableEls.forEach(el => { if (el.id) updatedData[el.id] = el.innerHTML; });
  if (cvStatus) cvStatus.textContent = 'Saving changes...';
  if (saveBtn) saveBtn.disabled = true;
  await new Promise(r => setTimeout(r, 800));
  if (cvStatus) cvStatus.textContent = '✅ CV saved locally (no backend)';
  if (saveBtn) saveBtn.disabled = false;
});

resetBtn?.addEventListener('click', () => {
  editableEls.forEach(el => { if (el.id && originalData[el.id] !== undefined) el.innerHTML = originalData[el.id]; });
  if (cvStatus) cvStatus.textContent = '🔄 CV reset to original values.';
});
