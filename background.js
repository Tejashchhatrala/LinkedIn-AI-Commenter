/**
 * LinkedIn AI Commenter - Background Script
 * Handles requests from content.js and calls Gemini via a Cloudflare Worker.
 */

const DEFAULT_SETTINGS = {
  workerUrl: "",
  extensionSecret: "",
  profileName: "",
  profileRole: "",
  profileCompany: "",
  profileExpertise: "",
  profileTone: "Warm, specific, concise, practical, and human.",
  profileVoice: "Write like a thoughtful LinkedIn professional. Avoid hype, clichés, and generic AI phrasing.",
  profileAudience: "Founders, operators, marketers, product teams, and professional peers.",
  profileGoals: "Build relationships, add useful perspective, and invite genuine conversation."
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const handlers = {
    generateComment: () => generateContent(request.parentComment ? "reply" : "comment", {
      postContent: request.postContent,
      parentComment: request.parentComment
    }),
    summarizePost: () => generateContent("summarize", { postContent: request.postContent }),
    rewritePost: () => generateContent("rewrite", { postContent: request.postContent }),
    generateMessageReply: () => generateContent("message", { history: request.history })
  };

  if (!handlers[request.action]) return false;

  handlers[request.action]()
    .then(data => sendResponse({ success: true, data }))
    .catch(error => sendResponse({ success: false, error: error.message }));

  return true;
});

async function generateContent(action, context) {
  const settings = await chrome.storage.local.get(DEFAULT_SETTINGS);
  const workerUrl = normalizeWorkerUrl(settings.workerUrl);

  if (!workerUrl) {
    throw new Error("Worker URL is not configured. Open the extension settings and paste your Cloudflare Worker URL.");
  }

  const prompt = getPromptInput(action, context);

  const response = await fetch(workerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(settings.extensionSecret ? { "X-Extension-Token": settings.extensionSecret } : {})
    },
    body: JSON.stringify({
      action,
      prompt,
      profile: buildProfile(settings)
    })
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication failed. Check the extension secret in both Chrome settings and Cloudflare.");
    }
    throw new Error(result.error || `Worker request failed with HTTP ${response.status}`);
  }

  if (result.error) throw new Error(result.error);
  if (!result.result) throw new Error("Unexpected response format from worker.");

  return result.result.trim();
}

function getPromptInput(action, context) {
  if (action === "comment" || action === "summarize" || action === "rewrite") {
    return context.postContent || "";
  }

  if (action === "reply") {
    return `Post: "${context.postContent || ""}"\n\nComment to reply to: "${context.parentComment || ""}"`;
  }

  if (action === "message") {
    return context.history || "";
  }

  throw new Error(`Invalid action: ${action}`);
}

function buildProfile(settings) {
  return {
    name: settings.profileName,
    role: settings.profileRole,
    company: settings.profileCompany,
    expertise: settings.profileExpertise,
    tone: settings.profileTone,
    voice: settings.profileVoice,
    audience: settings.profileAudience,
    goals: settings.profileGoals
  };
}

function normalizeWorkerUrl(url) {
  const trimmed = (url || "").trim();
  if (!trimmed) return "";
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withScheme.endsWith("/") ? withScheme : `${withScheme}/`;
}
