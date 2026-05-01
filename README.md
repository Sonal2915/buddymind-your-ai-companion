# BuddyMind — AI Mental Health Companion

A multi-page AI-powered mental wellness web app featuring a context-aware chatbot, voice & face emotion detection, mindfulness games, mood tracking, and assessment history.

Built with **React + Vite + TypeScript + Tailwind CSS + Framer Motion**, backed by **Lovable Cloud (Supabase)** for auth/database/edge functions, and **Google Gemini** (via Lovable AI Gateway) for all AI features.

---

## ✨ Features

- 🔐 Email/password authentication with persistent sessions
- 📋 Mandatory mental-health questionnaire (gates the chat)
- 💬 Context-aware AI chat (uses your emotional state)
- 🎤 Voice emotion analysis (MFCC/Chroma/Mel via Gemini audio)
- 📷 Real-time face emotion detection (webcam + bounding box overlay)
- 🎮 Wellness games (breathing exercise, memory game)
- 🧘 Breathe page, 📊 Mood dashboard, 📜 History (chats + assessments)
- 📄 Downloadable PDF reports

---

## 🛠 Prerequisites

Install these on your laptop first:

| Tool | Version | Link |
|------|---------|------|
| **Node.js** | 18+ (20 LTS recommended) | https://nodejs.org |
| **Bun** *(recommended)* or npm | latest | https://bun.sh |
| **Git** | any | https://git-scm.com |

> The project uses `bun.lock`, so **Bun** is preferred. npm/pnpm/yarn also work.

---

## 🚀 Run Locally (Step by Step)

### 1. Unzip / clone the project
```bash
unzip buddymind-project.zip -d buddymind
cd buddymind
```

### 2. Install dependencies
```bash
bun install
# or: npm install
```

### 3. Environment variables
The project ships with a working `.env` file pointing at the **Lovable Cloud** backend:

```env
VITE_SUPABASE_PROJECT_ID="fomemwbxlventdhxlynh"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiI..."
VITE_SUPABASE_URL="https://fomemwbxlventdhxlynh.supabase.co"
```

✅ **You don't need to change anything** to run the app against the existing cloud backend (database, auth, edge functions, and `LOVABLE_API_KEY` are already configured server-side).

### 4. Start the dev server
```bash
bun run dev
# or: npm run dev
```

Open **http://localhost:8080** in your browser.

### 5. Try it out
1. Sign up with email + password
2. Complete the questionnaire
3. Chat, play games, try voice/face emotion detection

---

## 📦 Build for Production

```bash
bun run build       # outputs to dist/
bun run preview     # preview the production build locally
```

---

## ☁️ Deployment

### Option A — Deploy via Lovable (easiest, recommended)
1. Open the project in [Lovable](https://lovable.dev)
2. Click **Publish** (top-right)
3. Your app goes live at `https://<your-app>.lovable.app`
4. (Optional) Connect a **custom domain** under *Project Settings → Domains*

Backend (edge functions, database migrations) auto-deploys. Frontend changes need an explicit "Update" click in the publish dialog.

### Option B — Deploy frontend to Vercel / Netlify / Cloudflare Pages

1. Push the project to a GitHub repo
2. Import it into your host of choice
3. **Build command:** `bun run build` (or `npm run build`)
4. **Output directory:** `dist`
5. Add env vars in the host dashboard:
   - `VITE_SUPABASE_PROJECT_ID`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_URL`
6. Enable **SPA fallback** (rewrite all routes to `/index.html`)
   - Vercel/Netlify do this automatically for Vite projects

> The backend (Supabase + edge functions) keeps running on Lovable Cloud — you only host the static frontend.

### Option C — Use your own Supabase project
If you want an independent backend:
1. Create a project at https://supabase.com
2. Run the SQL migration from `supabase/migrations/` in the SQL editor
3. Deploy the edge functions in `supabase/functions/` via the Supabase CLI:
   ```bash
   supabase functions deploy chat
   supabase functions deploy voice-emotion
   supabase functions deploy face-emotion
   ```
4. Add the secret `LOVABLE_API_KEY` (or replace the AI gateway calls with your own OpenAI/Gemini key) in *Project Settings → Edge Functions → Secrets*
5. Update `.env` with your new Supabase URL/keys

---

## 📁 Project Structure

```
src/
├── components/         # UI + layout (AppSidebar, AppLayout, games, ui/)
├── contexts/           # AuthContext
├── pages/              # ChatPage, QuestionnairePage, GamesPage, etc.
├── integrations/
│   └── supabase/       # auto-generated client + types
└── index.css           # Tailwind design tokens

supabase/
├── functions/
│   ├── chat/           # Context-aware Gemini chat (streaming)
│   ├── voice-emotion/  # Audio emotion analysis
│   └── face-emotion/   # Webcam frame emotion detection
└── migrations/         # profiles, questionnaire_results, chat_messages + RLS
```

---

## 🧪 Useful Scripts

```bash
bun run dev        # start dev server (port 8080)
bun run build      # production build
bun run preview    # preview built app
bun run lint       # eslint
bunx vitest run    # run tests
```

---

## ⚠️ Disclaimer

BuddyMind is **not a clinical diagnostic tool**. It's for informational and self-reflection purposes only. If you're in crisis, please contact a mental health professional or a local crisis helpline.

---

## 📝 License

MIT — feel free to fork, modify, and learn from it.
