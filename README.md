# AllYouNeedIsAnIdea — AI Web Agent Platform

Embed an AI agent into any website with one script tag. The agent has DOM control, memory, and can do anything a user can do.

---

## Stack

| Layer | Service |
|---|---|
| AI Model | OpenAI gpt-4o-mini |
| Agent Server | Node.js + WebSocket → Railway |
| Dashboard | Next.js → Vercel |
| Database + Auth | Supabase |
| Embed CDN | Cloudflare Pages |

---

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/migrations/0001_init.sql`
3. Copy your **Project URL** and **Service Role Key** (Settings → API)
4. Copy your **Anon Key** too (for the dashboard)

### 2. Agent Server (Railway)

1. Create a new project at [railway.app](https://railway.app)
2. Deploy `apps/agent-server/` from this repo
3. Set environment variables (copy from `apps/agent-server/.env.example`):
   ```
   OPENAI_API_KEY=sk-...
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_SERVICE_KEY=eyJ...
   PORT=8080
   ```
4. Railway gives you a public URL — note it (e.g. `your-server.railway.app`)

### 3. Embed Script (Cloudflare Pages)

```bash
cd packages/embed
pnpm install
pnpm build
```

Upload the `dist/embed.iife.js` file to Cloudflare Pages (or any static host).
Rename it `embed.js`. Note the URL (e.g. `https://your-cdn.pages.dev/embed.js`).

### 4. Dashboard (Vercel)

1. Deploy `apps/dashboard/` to Vercel
2. Set environment variables (copy from `apps/dashboard/.env.example`):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   NEXT_PUBLIC_AGENT_SERVER_URL=wss://your-server.railway.app
   NEXT_PUBLIC_EMBED_URL=https://your-cdn.pages.dev/embed.js
   ```

---

## Using It

1. Log in to the dashboard
2. Create a new agent — fill in your site's domain and configure the agent persona
3. Copy the script tag shown on the site page
4. Paste it before `</body>` on any page of your website
5. The chat widget appears — the agent can control the page

---

## API Keys Needed

| Key | Where to get it | Cost |
|---|---|---|
| `OPENAI_API_KEY` | platform.openai.com | ~$0.05/100 conversations |
| `SUPABASE_URL` + keys | supabase.com | Free tier |
| Railway account | railway.app | ~$5-10/month |
| Vercel account | vercel.com | Free tier |
| Cloudflare Pages | cloudflare.com | Free |

---

## Local Development

```bash
pnpm install

# Terminal 1 — agent server
cd apps/agent-server
cp .env.example .env   # fill in your keys
pnpm dev

# Terminal 2 — dashboard
cd apps/dashboard
cp .env.example .env.local   # fill in your keys
pnpm dev

# Terminal 3 — embed script (watch mode)
cd packages/embed
pnpm dev
```

For local testing, update your embed script's `data-server` to `ws://localhost:8080`.
