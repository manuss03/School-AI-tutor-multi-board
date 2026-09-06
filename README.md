# AI Tutor

A personal AI-powered learning companion for Indian students. The app provides:

- **Learn mode**: Chat with an AI tutor that teaches chapter-by-chapter, explains concepts, and guides learning
- **Test mode**: Generate quizzes and mock exams with AI, answer questions, and get scored automatically
- **Progress tracking**: View test history, scores, and personalized improvement suggestions
- **Multi-user accounts**: Secure sign-in with email/password, Google, or Apple

## Prerequisites

- Node.js 20+
- A Supabase project (database, auth, and edge functions)
- An OpenAI or Anthropic API key (provided per-user in the app's Settings)

## Local Development

```bash
npm install
npm run dev
```

The app expects these environment variables in `.env`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Deploying to GitHub Pages

This project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically builds and deploys to GitHub Pages when you push to `main`.

### Setup Steps

1. **Push this repository to GitHub** (public or private)

2. **Enable GitHub Pages**:
   - Go to your repository **Settings > Pages**
   - Under **Build and deployment**, set **Source** to **GitHub Actions**

3. **Configure Supabase Auth redirect URLs**:
   - In your Supabase dashboard, go to **Authentication > URL Configuration**
   - Add your GitHub Pages URL (e.g., `https://YOUR_USERNAME.github.io/ai-tutor/`) to:
     - **Site URL**
     - **Redirect URLs**
   - Enable **Google** and **Apple** providers under **Authentication > Providers** if you want social login

4. **Update the base path** (if your repo name is not `ai-tutor`):
   - Edit `vite.config.ts` and change the `base` from `/ai-tutor/` to `/<your-repo-name>/`

5. **Push to `main`** — the workflow will build and deploy automatically

### Setting up Google and Apple OAuth

**Google:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create a project
2. Set up OAuth consent screen and create OAuth 2.0 credentials
3. In Supabase Dashboard > Authentication > Providers > Google, add the Client ID and Client Secret
4. Add the Supabase callback URL to Google's authorized redirect URIs

**Apple:**
1. Enroll in the [Apple Developer Program](https://developer.apple.com/)
2. Create a Service ID and configure Sign in with Apple
3. In Supabase Dashboard > Authentication > Providers > Apple, add the required credentials

## How API Keys Work

Each user connects their own OpenAI or Anthropic API key in the Settings screen. The key is stored securely in the database, scoped to that user via Row Level Security. The backend edge function retrieves the key on each request — it is never exposed to other users or stored in the browser.

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS
- Supabase (Postgres, Auth, Edge Functions)
- OpenAI / Anthropic APIs (user-provided keys)
