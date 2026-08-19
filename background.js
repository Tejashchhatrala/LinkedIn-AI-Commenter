/**
 * LinkedIn AI Commenter - Background Script
 * Calls Gemini directly with the Google AI API key saved in Chrome local storage.
 */

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const DEFAULT_SETTINGS = {
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
  const apiKey = (settings.googleApiKey || "").trim();

  if (!apiKey) {
    throw new Error("Google AI API key is not configured. Open the extension settings and paste your API key.");
  }

  const prompt = getPromptInput(action, context);
  if (!prompt.trim()) {
    throw new Error("No content was found to send to Gemini.");
  }

  const instruction = buildInstruction(action, prompt, buildProfile(settings));
  const response = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: instruction }] }],
      generationConfig: {
        temperature: action === "summarize" ? 0.35 : 0.8,
        topP: 0.9,
        maxOutputTokens: action === "rewrite" ? 900 : 350
      }
    })
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(formatGeminiError(response.status, result));
  }

  const text = result.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("").trim();
  if (!text) {
    throw new Error("Gemini returned an empty response. Try again with a longer post or message context.");
  }

  return text;
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
    background: settings.profileBackground,
    expertise: settings.profileExpertise,
    tone: settings.profileTone,
    voice: settings.profileVoice,
    audience: settings.profileAudience,
    goals: settings.profileGoals
  };
}

function buildInstruction(action, prompt, profile) {
  const profileBlock = [
    `Name: ${profile.name || "Not provided"}`,
    `Role: ${profile.role || "Not provided"}`,
    `Company/Business: ${profile.company || "Not provided"}`,
    `Background: ${profile.background || "Not provided"}`,
    `What I do / expertise: ${profile.expertise || "Not provided"}`,
    `Tone: ${profile.tone || "Warm, specific, concise, practical, and human."}`,
    `Voice: ${profile.voice || "Thoughtful, clear, non-salesy, and not generic."}`,
    `Audience: ${profile.audience || "Professional LinkedIn audience"}`,
    `Goals: ${profile.goals || "Add value and start genuine conversations."}`
  ].join("\n");

  const sharedRules = `Use the profile below so the answer sounds like the user, not like a generic AI assistant.\n\n${profileBlock}\n\nRules:\n- Be specific to the provided LinkedIn context.\n- Do not invent personal achievements, client names, numbers, or credentials.\n- Avoid clichés like \"Great post\", \"Thanks for sharing\", \"game-changer\", and \"valuable insights\" unless truly necessary.\n- Keep it natural for LinkedIn and easy to paste.\n- Return only the final text.\n- No markdown unless the requested output benefits from bullets.`;

  const prompts = {
    comment: `${sharedRules}\n\nWrite one LinkedIn comment, 1-3 sentences, that adds a useful perspective and optionally ends with a natural question.\n\nPost:\n${prompt}`,
    reply: `${sharedRules}\n\nWrite one friendly LinkedIn reply, 1-3 sentences, that acknowledges the other person and adds value.\n\nContext:\n${prompt}`,
    summarize: `Summarize this LinkedIn post in 3-5 concise bullets. Keep it neutral and accurate.\n\nPost:\n${prompt}`,
    rewrite: `${sharedRules}\n\nRewrite this LinkedIn draft in the user's voice. Improve the hook, clarity, formatting, and flow while preserving the original meaning. Add 2-4 relevant hashtags only if they fit.\n\nDraft:\n${prompt}`,
    message: `${sharedRules}\n\nWrite a concise, professional LinkedIn message reply based on this conversation. Keep it natural and easy to send.\n\nConversation:\n${prompt}`
  };

  return prompts[action] || prompts.comment;
}

function formatGeminiError(status, result) {
  const message = result.error?.message || `Gemini API request failed with HTTP ${status}`;

  if (status === 400) return `Gemini rejected the request: ${message}`;
  if (status === 401 || status === 403) return "Google AI API authentication failed. Check that your API key is correct and the Gemini API is enabled.";
  if (status === 429) return "Gemini quota limit reached. Wait a few minutes or check your Google AI Studio quota.";

  return message;
}
