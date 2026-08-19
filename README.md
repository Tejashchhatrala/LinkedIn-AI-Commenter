# 🤖 LinkedIn AI Commenter - Chrome Extension

> **Generate LinkedIn comments, replies, message responses, summaries, and rewritten posts in your own voice with Google Gemini.**

---

## 🌟 Overview

**LinkedIn AI Commenter** is a Chrome extension that uses Google's Gemini AI directly from the extension. Add your Google AI API key once, fill in your personal profile, tone, background, and writing style, then use one-click buttons on LinkedIn.

### Why Use This Extension?

- ⏱️ **Save Time**: Generate thoughtful LinkedIn responses in seconds
- 🎯 **Stay Relevant**: AI analyzes the post, comment, draft, or message context
- 🗣️ **Use Your Voice**: Add your name, role, background, expertise, tone, audience, and LinkedIn goals
- ✍️ **Improve Drafts**: Rewrite posts with stronger hooks and clearer formatting
- 🔐 **No Backend Required**: No Cloudflare Worker or server setup is needed

---

## ✨ Features

### 1. 💬 AI Comment Generation
Generate specific, human-like comments on LinkedIn posts.

### 2. 🔄 Smart Reply Assistant
Reply to comments with appreciation, context, and added value.

### 3. 📝 Post Summarizer
Get quick 3-5 bullet summaries of long LinkedIn posts.

### 4. ✍️ Post Rewriter
Transform your draft posts with better hooks, structure, and clarity.

### 5. 💌 Smart Message Replies
Generate professional replies in LinkedIn messages based on recent conversation history.

---

## 🔧 How It Works

```
LinkedIn Page → Chrome Extension → Background Script → Google Gemini API → Response
```

The Google API key is saved in Chrome extension local storage on your own browser. The extension does not need Cloudflare, a separate server, or a proxy.

> **Security note**: Local storage is convenient for personal use, but anyone with access to your browser profile or unpacked extension debugging tools may be able to access the key. Keep your API key private and rotate it if you suspect exposure.

---

## 📥 Installation

### Manual Installation (Developer Mode)

1. Download this repository as a ZIP and extract it.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable **Developer mode** in the top right.
4. Click **Load unpacked**.
5. Select the extracted extension folder.
6. Pin the extension icon if desired.

---

## 🚀 Setup Guide

### Step 1: Get a Google AI API Key

1. Go to **https://aistudio.google.com/app/apikey**.
2. Sign in with your Google account.
3. Click **Create API Key**.
4. Copy the key. It usually starts with `AIza`.

If Google reports that the API is not enabled, enable the Gemini API in your Google Cloud project.

### Step 2: Configure the Extension

1. Click the extension icon to open settings.
2. Paste your Google AI API key into **Google AI API Key**.
3. Fill in **Your Tone, Voice & Work**:
   - Name
   - Role / title
   - Company / business
   - Background
   - What you do / expertise
   - Tone
   - Voice rules
   - Audience
   - LinkedIn goals
4. Toggle the features you want enabled.
5. Refresh LinkedIn and start using the AI buttons.

---

## 📱 Usage

### On LinkedIn Feed

- **Comment**: Click "Add a comment" → Click **✨ AI Comment**
- **Reply**: Click "Reply" on any comment → Click **✨ Assist Reply**
- **Summarize**: Click **📝 Summarize** on any post

### Creating Posts

1. Click "Start a post".
2. Write your draft.
3. Click **✨ Post Rewrite**.
4. Review and post.

### In Messages

1. Open any conversation.
2. Click **✨ Smart Reply**.
3. Review and send.

---

## 🏗️ Architecture

```
linkedin-ai-commenter/
├── manifest.json   # Chrome extension configuration
├── background.js   # Gemini API calls and personalized prompt construction
├── content.js      # LinkedIn DOM detection and button injection
├── styles.css      # Button styling
├── options.html    # Settings popup UI
├── options.js      # Settings persistence
├── README.md       # Documentation
└── app_icon.png    # Extension icon
```

### Components

1. **Content Script** (`content.js`): Detects LinkedIn editors/posts/messages and injects AI buttons.
2. **Background Script** (`background.js`): Reads settings, builds prompts, calls Gemini, and returns generated text.
3. **Options Page** (`options.html`, `options.js`): Stores API key, personal profile, and feature toggles.

---

## ⚙️ Configuration

Access settings through the extension icon.

### Required

- **Google AI API Key**: Your Gemini API key from Google AI Studio.

### Personalization

The extension sends these fields to Gemini with each generation request so outputs match your style:

- Name
- Role / title
- Company / business
- Background
- What you do / expertise
- Tone
- Voice rules
- Audience
- LinkedIn goals

### Feature Toggles

- AI Comment ✅
- Smart Reply ✅
- Post Summarizer ✅
- Post Rewriter ✅

---

## 🔒 Privacy & Security

This extension does not intentionally collect analytics or send data to any custom backend. It sends only the content you ask it to process, plus your profile settings, directly to Google's Gemini API.

Your API key is stored in Chrome extension local storage on your browser. For best security:

- Do not share your API key.
- Do not commit your API key to GitHub.
- Restrict or rotate the key from Google AI Studio if needed.
- Remove the key from extension settings when using a shared computer.

---

## 🔧 Troubleshooting

### Buttons Don't Appear

- Reload the extension at `chrome://extensions/`.
- Refresh the LinkedIn page.
- Check that the feature is enabled in extension settings.

### "Google AI API key is not configured"

- Open the extension popup.
- Paste your Google AI API key.
- Try again on LinkedIn.

### "Google AI API authentication failed"

- Make sure the API key is copied correctly.
- Create a new key at https://aistudio.google.com/app/apikey.
- Enable the Gemini API for the project if Google asks you to.

### "Gemini quota limit reached"

- Wait a few minutes and try again.
- Check your Google AI Studio quota.

### Comment or Message Box Does Not Fill

LinkedIn changes its UI often. Try:

- Clicking inside the comment/message box first.
- Refreshing LinkedIn.
- Reloading the extension.
- Checking the browser console for content script errors.

---

## ✅ Success Checklist

- [ ] Extension loaded in Chrome Developer Mode
- [ ] Google AI API key saved in extension settings
- [ ] Personal profile completed
- [ ] Desired feature toggles enabled
- [ ] LinkedIn page refreshed after loading the extension
- [ ] AI button clicked and generated text appears
