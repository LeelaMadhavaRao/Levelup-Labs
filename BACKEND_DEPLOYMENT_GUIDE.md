# 🚀 Supabase Backend Deployment Guide

## Overview

The backend consists of:
- **5 Edge Functions** (serverless TypeScript functions)
- **Database Schema** (tables, indexes, RLS policies)
- **Database Functions** (stored procedures, triggers)
- **Row Level Security** (RLS policies)

---

## 📁 File Structure

```
supabase/
├── functions/
│   ├── generateQuiz/index.ts      # Generate AI quiz questions
│   ├── generateProblems/index.ts  # Generate coding problems
│   ├── verifyAlgorithm/index.ts   # Verify algorithm explanations
│   ├── verifyCode/index.ts        # Verify code solutions
│   └── updatePoints/index.ts      # Award points for completion
├── database_setup.sql             # Main schema + RLS policies
└── database_functions.sql         # Stored procedures + triggers
```

---

## 🔧 Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Supabase CLI**: Install with `npm install -g supabase`
3. **Gemini API Keys**: Get 4 keys from [Google AI Studio](https://makersuite.google.com/app/apikey)

---

## 📝 Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click **"New Project"**
3. Fill in details:
   - **Name**: levelup-labs
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to your users
4. Wait for project creation (~2 minutes)

---

## 🔑 Step 2: Get Project Credentials

From your Supabase project dashboard:

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`)

3. Update your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Gemini API Keys (4 keys for round-robin)
GEMINI_API_KEY_1=your-key-1
GEMINI_API_KEY_2=your-key-2
GEMINI_API_KEY_3=your-key-3
GEMINI_API_KEY_4=your-key-4
```

---

## 📊 Step 3: Setup Database

### 3.1 Create Admin User in Supabase Auth

1. Go to **Authentication** → **Users**
2. Click **"Add User"** → **"Create new user"**
3. Fill in:
   - **Email**: `admin@levelup-labs.com`
   - **Password**: `admin123` (change in production!)
   - **Auto Confirm User**: ✅ Enable
4. Click **"Create user"**
5. **Copy the UUID** of the created user (you'll need it)

### 3.2 Run Database Setup Script

1. Go to **SQL Editor** in Supabase Dashboard
2. Create a **New Query**
3. Copy and paste contents of `supabase/database_setup.sql`
4. Click **"Run"**
5. ✅ Should see success message

### 3.3 Run Database Functions Script

1. Create another **New Query**
2. Copy and paste contents of `supabase/database_functions.sql`
3. Click **"Run"**
4. ✅ Should see success message

---

## ⚡ Step 4: Deploy Edge Functions

### 4.1 Link Local Project to Supabase

```powershell
# Login to Supabase CLI
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF
```

**Note**: Find your `PROJECT_REF` in Project Settings → General → Reference ID

### 4.2 Set Environment Variables for Edge Functions

```powershell
# Set Gemini API keys as secrets
supabase secrets set GEMINI_API_KEY_1=your-key-1
supabase secrets set GEMINI_API_KEY_2=your-key-2
supabase secrets set GEMINI_API_KEY_3=your-key-3
supabase secrets set GEMINI_API_KEY_4=your-key-4

# Verify secrets
supabase secrets list
```

### 4.3 Deploy All Edge Functions

```powershell
# Deploy all functions
supabase functions deploy generateQuiz
supabase functions deploy generateProblems
supabase functions deploy verifyAlgorithm
supabase functions deploy verifyCode
supabase functions deploy updatePoints

# Verify deployment
supabase functions list
```

---

## 🧪 Step 5: Test Edge Functions

### Test generateQuiz Function

```powershell
supabase functions invoke generateQuiz --data '{
  "topicId": "test-topic-id",
  "topicName": "JavaScript Basics",
  "numQuestions": 3
}'
```

### Test in Browser (with auth)

```javascript
const { data, error } = await supabase.functions.invoke('generateQuiz', {
  body: {
    topicId: 'topic-uuid',
    topicName: 'Arrays in JavaScript',
    numQuestions: 5
  }
})
```

---

## 🔐 Step 6: Verify RLS Policies

1. Go to **Database** → **Policies**
2. Verify each table has policies enabled:
   - ✅ users
   - ✅ courses
   - ✅ user_courses
   - ✅ modules
   - ✅ topics
   - ✅ quiz_responses
   - ✅ coding_problems
   - ✅ problem_solutions
   - ✅ leaderboard

---

## 📱 Step 7: Update Frontend to Use Edge Functions

The lib files need to be updated to call Edge Functions instead of client-side Gemini API.

**Example update for `lib/quiz.ts`:**

```typescript
// OLD (client-side)
const response = await callGeminiAPI(prompt)

// NEW (server-side via Edge Function)
const { data, error } = await supabase.functions.invoke('generateQuiz', {
  body: { topicId, topicName, numQuestions }
})
```

---

## ✅ Step 8: Verify Setup

### Check Database

```sql
-- Count tables
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';
-- Should return 9

-- Verify admin user
SELECT * FROM users WHERE role = 'admin';
-- Should show admin@levelup-labs.com

-- Check functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public';
-- Should show add_points_to_user, update_leaderboard_ranks, etc.
```

### Check Edge Functions

```powershell
supabase functions list
```

Should show:
- ✅ generateQuiz
- ✅ generateProblems
- ✅ verifyAlgorithm
- ✅ verifyCode
- ✅ updatePoints

---

## 🎯 Points System Logic (Per PRD)

**Points are ONLY awarded for:**

1. **Solving Problems** (handled by `verifyCode` function):
   - Easy: 100 points
   - Medium: 200 points
   - Hard: 300 points

2. **Completing Entire Course** (handled by `updatePoints` function):
   - Course-defined reward (e.g., 500 points)

**NO points for:**
- ❌ Watching videos
- ❌ Passing quizzes
- ❌ Completing topics
- ❌ Completing modules

---

## 🔒 Security Checklist

- ✅ Gemini API keys stored in Supabase Secrets (not in code)
- ✅ RLS enabled on all tables
- ✅ Edge Functions validate authentication
- ✅ Client can't manipulate scores directly
- ✅ All scoring happens server-side
- ✅ Service role key never exposed to client

---

## 🐛 Troubleshooting

### Edge Function Deploy Fails

```powershell
# Re-link project
supabase link --project-ref YOUR_PROJECT_REF

# Check CLI version
supabase --version

# Update CLI
npm update -g supabase
```

### Database Migration Issues

```powershell
# Reset database (WARNING: deletes all data)
supabase db reset

# Re-run setup scripts in SQL Editor
```

### RLS Policy Errors

- Make sure user is authenticated
- Check if user has correct role (admin/user)
- Verify policy names match table names

---

## 📚 Additional Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Gemini API Docs](https://ai.google.dev/docs)

---

## ✨ Backend is Ready!

Your backend is now:
- ✅ Fully serverless
- ✅ Secure (API keys hidden)
- ✅ Scalable (auto-scaling edge functions)
- ✅ Production-ready

Next: Update frontend lib files to call Edge Functions! 🚀
