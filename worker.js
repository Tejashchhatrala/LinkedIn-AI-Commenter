/**
 * LinkedIn AI Commenter - Cloudflare Worker
 * Copy this whole file into Cloudflare Workers and set GEMINI_API_KEY as a secret.
 * Optional: set EXTENSION_SECRET and use the same value in the extension settings.
 */

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Extension-Token",
  "Access-Control-Max-Age": "86400"
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed. Please use POST." }, 405);
    }

    if (!env.GEMINI_API_KEY) {
      return json({ error: "GEMINI_API_KEY is not configured in Cloudflare." }, 500);
    }

    if (env.EXTENSION_SECRET) {
      const token = request.headers.get("X-Extension-Token") || "";
      if (token !== env.EXTENSION_SECRET) {
        return json({ error: "Unauthorized extension request." }, 401);
      }
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body." }, 400);
    }

    const { action, prompt, profile = {} } = body;
    if (!action || !prompt) {
      return json({ error: "Missing required fields: action and prompt." }, 400);
    }

    const instruction = buildInstruction(action, prompt, profile);
    const geminiResponse = await fetch(`${GEMINI_ENDPOINT}?key=${env.GEMINI_API_KEY}`, {
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

    const data = await geminiResponse.json().catch(() => ({}));
    if (!geminiResponse.ok) {
      return json({ error: data.error?.message || `Gemini API error: HTTP ${geminiResponse.status}` }, geminiResponse.status);
    }

    const result = data.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("").trim();
    if (!result) {
      return json({ error: "Gemini returned an empty response." }, 502);
    }

    return json({ result });
  }
};

function buildInstruction(action, prompt, profile) {
  const profileBlock = [
    `Name: ${profile.name || "Not provided"}`,
    `Role: ${profile.role || "Not provided"}`,
    `Company/Business: ${profile.company || "Not provided"}`,
    `What I do / expertise: ${profile.expertise || "Not provided"}`,
    `Tone: ${profile.tone || "Warm, specific, concise, practical, and human."}`,
    `Voice: ${profile.voice || "Thoughtful, clear, non-salesy, and not generic."}`,
    `Audience: ${profile.audience || "Professional LinkedIn audience"}`,
    `Goals: ${profile.goals || "Add value and start genuine conversations."}`
  ].join("\n");

  const sharedRules = `Use the profile below so the answer sounds like the user, not like a generic AI assistant.\n\n${profileBlock}\n\nRules:\n- Be specific to the provided LinkedIn context.\n- Do not invent personal achievements, client names, numbers, or credentials.\n- Avoid clichés like \"Great post\", \"Thanks for sharing\", \"game-changer\", and \"valuable insights\" unless truly necessary.\n- Return only the final text the user can paste or insert.\n- No markdown unless the requested output benefits from bullets.`;

  const prompts = {
    comment: `${sharedRules}\n\nWrite one LinkedIn comment, 1-3 sentences, that adds a useful perspective and optionally ends with a natural question.\n\nPost:\n${prompt}`,
    reply: `${sharedRules}\n\nWrite one friendly LinkedIn reply, 1-3 sentences, that acknowledges the other person and adds value.\n\nContext:\n${prompt}`,
    summarize: `Summarize this LinkedIn post in 3-5 concise bullets. Keep it neutral and accurate.\n\nPost:\n${prompt}`,
    rewrite: `${sharedRules}\n\nRewrite this LinkedIn draft in the user's voice. Improve the hook, clarity, formatting, and flow while preserving the original meaning. Add 2-4 relevant hashtags only if they fit.\n\nDraft:\n${prompt}`,
    message: `${sharedRules}\n\nWrite a concise, professional LinkedIn message reply based on this conversation. Keep it natural and easy to send.\n\nConversation:\n${prompt}`
  };

  return prompts[action] || prompts.comment;
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders }
  });
}
