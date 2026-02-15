# 🚀 Levelup-Labs - Complete Setup Guide

## Overview
Levelup-Labs is a gamified AI-powered coding learning platform. This guide walks you through setting up both the Supabase backend and Next.js frontend.

---

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Next.js Setup](#nextjs-setup)
4. [Environment Variables](#environment-variables)
5. [Running the Project](#running-the-project)
6. [Verification Checklist](#verification-checklist)

---

## ✅ Prerequisites

- **Supabase Account** - Create at [supabase.com](https://supabase.com)
- **Node.js 18+** - Download from [nodejs.org](https://nodejs.org)
- **Gemini API Key** - Get from [Google AI Studio](https://aistudio.google.com/apikey)
- **Google OAuth Credentials** (Optional) - For Google login feature

---

## 🗄️ Supabase Setup

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Select a region (choose closest to your users)
4. Set a strong database password
5. Wait for project initialization (5-10 minutes)

### Step 2: Get Connection Credentials

1. Go to **Settings → API**
2. Copy the following:
   - **Project URL** (SUPABASE_URL)
   - **Anon Key** (SUPABASE_ANON_KEY)
   - **Service Role Key** (SUPABASE_SERVICE_ROLE_KEY)

### Step 3: Execute SQL Scripts

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **"New Query"**
3. Copy and paste the contents from `supabase/database_setup.sql`
4. Click **"Run"** and wait for completion
5. Repeat for `supabase/database_functions.sql`
6. Repeat for `supabase/seed_data.sql`

### Step 4: Verify Tables Created

In **SQL Editor**, run:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

You should see these tables:
- `users`
- `courses`
- `modules`
- `topics`
- `quiz_responses`
- `problem_solutions`
- `leaderboard`

### Step 5: Set Up Gemini API Key (for Edge Functions)

1. Get your Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)
2. In Supabase, go to **Settings → Secrets**
3. Add a new secret:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** (paste your key)

---

## 💻 Next.js Setup

### Step 1: Clone/Download the Project

```bash
# Extract the project files
cd levelup-labs
npm install
# or
pnpm install
```

### Step 2: Create Environment Variables File

Create `.env.local` in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# Google OAuth (Optional)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET

# Gemini API keys are configured as Supabase Edge Function secrets (server-side)
```

### Step 3: Project Structure

```
levelup-labs/
├── app/
│   ├── auth/
│   │   ├── login/
│   │   ├── signup/
│   │   └── layout.tsx
│   ├── admin/
│   │   ├── dashboard/
│   │   ├── create-course/
│   │   └── layout.tsx
│   ├── courses/
│   ├── my-courses/
│   ├── (topic)/
│   │   ├── watch-video/
│   │   ├── quiz/
│   │   └── problems/
│   ├── leaderboard/
│   ├── profile/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── navbar.tsx
│   ├── course-card.tsx
│   ├── quiz-component.tsx
│   ├── code-editor.tsx
│   ├── leaderboard-table.tsx
│   └── ui/ (shadcn components)
├── lib/
│   ├── supabase.ts
│   ├── auth.ts
│   └── utils.ts
├── supabase/
│   ├── functions/
│   │   ├── generateQuiz/
│   │   ├── generateProblems/
│   │   ├── verifyAlgorithm/
│   │   └── verifyCode/
│   ├── database_setup.sql
│   ├── database_functions.sql
│   └── seed_data.sql
├── public/
├── .env.local
├── package.json
└── tsconfig.json
```

---

## 🔑 Environment Variables

| Variable | Required | Where to Get |
|----------|----------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_GEMINI_API_KEY` | ✅ | [Google AI Studio](https://aistudio.google.com/apikey) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | ❌ | [Google Cloud Console](https://console.cloud.google.com) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_SECRET` | ❌ | [Google Cloud Console](https://console.cloud.google.com) |

---

## 🏃 Running the Project

### Development Mode

```bash
npm run dev
# or
pnpm dev
```

The app will run on `http://localhost:3000`

### Build for Production

```bash
npm run build
npm run start
# or
pnpm build
pnpm start
```

---

## 🧪 Verification Checklist

- [ ] Supabase project created
- [ ] All SQL scripts executed successfully
- [ ] Tables visible in Supabase dashboard
- [ ] Environment variables added to `.env.local`
- [ ] `npm install` completed without errors
- [ ] `npm run dev` starts without errors
- [ ] Homepage loads at `http://localhost:3000`
- [ ] Admin login works with: `admin@example.com` / `admin123`
- [ ] Can create a test user via signup

---

## 🔐 Default Admin Credentials

For initial testing:

```
Email: admin@example.com
Password: admin123
```

⚠️ **IMPORTANT:** Change these credentials immediately in production!

---

## 🆘 Troubleshooting

### Issue: "SUPABASE_URL not found"
**Solution:** Check `.env.local` file exists and has correct Supabase URL

### Issue: "RLS policy violation"
**Solution:** Run `002_rls_policies.sql` in Supabase SQL Editor

### Issue: "Gemini API Error"
**Solution:** 
1. Verify API key in Supabase Secrets
2. Check API key has permission for `generativeai.googleapis.com`

### Issue: "Cannot connect to database"
**Solution:** 
1. Check internet connection
2. Verify Supabase project is running
3. Check anon key hasn't been rotated

---

## 📚 Key Database Tables

### `users`
- Stores user information
- Tracks total points and rank
- Linked to authentication

### `courses`
- Admin-created courses
- Contains modules and topics
- Tracks completion rewards

### `modules`
- Ordered sections within courses
- Contains multiple topics

### `topics`
- Individual lessons with video
- Has associated quizzes and problems

### `quiz_responses`
- Tracks user quiz attempts
- Stores scores and responses

### `problem_solutions`
- Tracks solved coding problems
- Stores code and verification status

### `leaderboard`
- Maintains top 10 users
- Updated when points change
- Updated when courses complete

---

## 🎯 Next Steps After Setup

1. **Test Admin Flow:**
   - Login as admin
   - Create a test course
   - Add modules and topics

2. **Test User Flow:**
   - Create a new user account
   - Register for a course
   - Watch video and take quiz
   - Solve problems

3. **Verify Gamification:**
   - Check points awarded for problem solutions
   - Check leaderboard updates
   - Verify course completion rewards

4. **Deploy (Optional):**
   - Push to GitHub
   - Connect to Vercel
   - Deploy frontend
   - Enable Supabase integration

---

## 📞 Support

For issues, check:
- Supabase Documentation: https://supabase.com/docs
- Next.js Documentation: https://nextjs.org/docs
- Gemini API Docs: https://ai.google.dev/

---

**Status:** Ready for development ✅
