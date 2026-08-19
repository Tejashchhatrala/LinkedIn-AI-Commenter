// Default settings
const defaults = {
  enableComment: true,
  enableReply: true,
  enableSummarizer: true,
  enableRewrite: true,
  googleApiKey: "",
  profileName: "",
  profileRole: "",
  profileCompany: "",
  profileBackground: "",
  profileExpertise: "",
  profileTone: "Warm, specific, concise, practical, and human.",
  profileVoice: "Write like a thoughtful LinkedIn professional. Avoid hype, clichés, and generic AI phrasing.",
  profileAudience: "Founders, operators, marketers, product teams, and professional peers.",
  profileGoals: "Build relationships, add useful perspective, and invite genuine conversation."
};

const toggleIds = ['toggleComment', 'toggleReply', 'toggleSummarizer', 'toggleRewrite'];
const toggleKeys = ['enableComment', 'enableReply', 'enableSummarizer', 'enableRewrite'];
const fieldIds = ['googleApiKey', 'profileName', 'profileRole', 'profileCompany', 'profileBackground', 'profileExpertise', 'profileTone', 'profileVoice', 'profileAudience', 'profileGoals'];
const statusEl = document.getElementById('saveStatus');
let statusTimer;

// Load settings on startup
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(defaults, (settings) => {
    toggleIds.forEach((id, index) => {
      document.getElementById(id).checked = settings[toggleKeys[index]];
    });

    fieldIds.forEach((id) => {
      document.getElementById(id).value = settings[id] || "";
    });
  });
});

// Save feature toggles
toggleIds.forEach((id, index) => {
  document.getElementById(id).addEventListener('change', (event) => {
    chrome.storage.local.set({ [toggleKeys[index]]: event.target.checked }, showSaved);
  });
});

// Save API key and profile settings as the user types
fieldIds.forEach((id) => {
  document.getElementById(id).addEventListener('input', (event) => {
    chrome.storage.local.set({ [id]: event.target.value.trim() }, showSaved);
  });
});

function showSaved() {
  if (!statusEl) return;
  statusEl.textContent = 'Saved';
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    statusEl.textContent = '';
  }, 1200);
}
