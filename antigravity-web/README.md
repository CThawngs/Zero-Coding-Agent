# Antigravity Web 🚀

> **AI Coding Agent Platform** - A localhost web application that lets you code with AI, directly editing files on your machine.

Inspired by Claude Code, Codex CLI, and Antigravity 2.0 — but with a beautiful web UI, multi-provider support, and direct filesystem access.

---

## ✨ Features

- **🤖 Multi-Provider LLM Support** — Google Gemini, OpenAI, Anthropic, OpenRouter, Ollama, LM Studio
- **📁 Real File System Access** — Read, write, create, delete files directly on your disk
- **💬 Multi-Chat** — Create, rename, delete conversations; run multiple chats simultaneously  
- **🔧 AI Coding Agent** — AI can actually write and apply code, not just suggest it
- **📎 Rich Attachments** — Attach folders, files, images, URLs, GitHub repos
- **🖥️ Code Editor** — Full CodeMirror 6 editor with syntax highlighting
- **⌨️ Terminal Commands** — AI can run terminal commands with your approval (HITL)
- **🐙 GitHub Integration** — Read public and private repositories
- **🔌 MCP Support** — Connect external tools via Model Context Protocol
- **🆓 Free Model Filter** — Filter to show only free LLM models
- **📏 Context Window Control** — Set or auto-detect context window per model
- **⚙️ UI-Based API Key Management** — Enter API keys directly in the browser, synced to .env

---

## 🚀 Quick Start

**Double-click `start.bat`** — That's it! It will:
1. Install dependencies (first time only)
2. Start the backend server (port 3747)
3. Start the frontend (port 5743)
4. Open your browser automatically

---

## 📦 Manual Setup

```bash
# Backend
cd backend
npm install
node src/app.js

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

Then open http://localhost:5743

---

## 🏗️ Architecture

```
antigravity-web/
├── start.bat              # One-click launcher
├── backend/               # Node.js + Express (port 3747)
│   ├── src/
│   │   ├── app.js         # Main server
│   │   ├── routes/        # API routes
│   │   └── services/      # Business logic
│   ├── data/
│   │   └── conversations/ # JSON conversation storage
│   └── .env               # API keys (managed via UI)
│
└── frontend/              # React + Vite (port 5743)
    └── src/
        ├── components/    # UI components
        ├── stores/        # Zustand state
        └── styles/        # CSS design system
```

---

## 🔑 Provider Setup

On first launch, you'll see a setup wizard. Enter your API keys there:

| Provider | Key Source |
|----------|-----------|
| Google Gemini | [aistudio.google.com](https://aistudio.google.com) |
| OpenAI | [platform.openai.com](https://platform.openai.com/api-keys) |
| Anthropic | [console.anthropic.com](https://console.anthropic.com) |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) |
| Ollama | No key needed (install from [ollama.ai](https://ollama.ai)) |
| LM Studio | No key needed (install from [lmstudio.ai](https://lmstudio.ai)) |

---

## 🛠️ Built With

- [Google × Kaggle 5-Day AI Agents Intensive](https://www.kaggle.com/competitions/5-day-ai-agents-intensive-vibecoding-course-with-google) knowledge
- React + Vite + Zustand
- Node.js + Express + WebSocket
- CodeMirror 6
- MCP Protocol (Day 2 concepts)
- Agent Skills pattern (Day 3 concepts)
- HITL Security (Day 4 concepts)
- Spec-Driven Development (Day 5 concepts)

---

## 📋 Capstone Project Info

**Category:** Open-ended (Tự do)  
**Course:** Google × Kaggle 5-Day AI Agents Intensive  
**Key Concepts Applied:**
- Day 1: Factory Model, Context Engineering
- Day 2: MCP Protocol, Tool Interoperability  
- Day 3: Agent Skills, Progressive Disclosure
- Day 4: Security (HITL, Sandboxing), Observability
- Day 5: Spec-Driven Development, Zero-Trust

---

*Made with ❤️ as a Kaggle Capstone Project*
