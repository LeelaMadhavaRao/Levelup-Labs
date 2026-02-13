# 🚀 CodeQuest AI - Quick Reference Card

## 📋 The 3 Steps to Launch

### Step 1: Execute SQL Scripts in Supabase
```bash
# Go to Supabase → SQL Editor → New Query
# Copy and paste these 3 files and run each:
1. supabase/migrations/001_initial_schema.sql      (creates tables)
2. supabase/migrations/002_rls_policies.sql        (security)
3. supabase/migrations/003_initial_admin.sql       (admin user)
```

### Step 2: Set Environment Variables
```bash
# Create .env.local with:
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxx...
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyD...
```

### Step 3: Install & Run
```bash
npm install
npm run dev
# Visit http://localhost:3000
```

---

## 🗄️ Database Tables (9 Total)

```
users
├── id, email, full_name, role, total_points, rank
│
├─ courses
│  ├── id, admin_id, name, completion_reward_points
│  │
│  ├─ user_courses (registration)
│  │
│  ├─ modules
│  │  │
│  │  ├─ topics
│  │  │  ├─ quiz_responses (user attempts)
│  │  │  │
│  │  │  └─ coding_problems
│  │  │     └─ problem_solutions (user submissions)
│  │  │
│  │  └─ leaderboard (ranking)
```

---

## 📚 Utilities (6 Files Ready)

| File | Purpose | Key Functions |
|------|---------|---|
| `lib/supabase.ts` | Client init | createClient(), getCurrentUser() |
| `lib/auth.ts` | Login/signup | loginWithEmail(), signupWithEmail() |
| `lib/courses.ts` | Course mgmt | createCourse(), getCourseModules() |
| `lib/quiz.ts` | Quizzes | submitQuizResponse(), hasUserPassedQuiz() |
| `lib/problems.ts` | Problems | getProblemsByTopic(), submitProblemSolution() |
| `lib/leaderboard.ts` | Ranking | getTopLeaderboard(), updateUserPoints() |

---

## 🔐 Admin Credentials

```
Email: admin@example.com
Password: admin123
```

⚠️ **Change immediately in production!**

---

## 💯 Points System

| Action | Points |
|--------|--------|
| Easy Problem | 100 |
| Medium Problem | 200 |
| Hard Problem | 300 |
| Course Completed | Custom (500-1000) |

**NO points for:** Videos, Quizzes, Topics, Modules

---

## 🎯 Key Endpoints (To Implement)

### Auth
- `POST /auth/login` - Login
- `POST /auth/signup` - Register
- `POST /auth/logout` - Sign out

### Courses
- `GET /api/courses` - List all
- `POST /api/courses` - Create (admin)
- `GET /api/my-courses` - User's courses
- `POST /api/courses/:id/register` - Enroll

### Learning
- `GET /api/topics/:id` - Topic details
- `POST /api/quiz/submit` - Submit quiz
- `GET /api/problems/:topicId` - Problem list
- `POST /api/problems/:id/solution` - Submit solution

### Leaderboard
- `GET /api/leaderboard` - Top 10
- `GET /api/leaderboard/search?q=name` - Search
- `GET /api/leaderboard/rank/:userId` - User rank

---

## 📁 Files to Create (18 Pages)

### Must Have First
```
app/
├── auth/login/page.tsx
├── auth/signup/page.tsx
├── page.tsx (home)
└── layout.tsx (navbar)
```

### Core Features
```
app/
├── admin/dashboard/page.tsx
├── admin/create-course/page.tsx
├── courses/page.tsx
├── my-courses/page.tsx
└── (topic flow)
    ├── watch/page.tsx
    ├── quiz/page.tsx
    ├── problems/page.tsx
    └── code-editor/page.tsx
```

### Secondary
```
app/
├── leaderboard/page.tsx
├── profile/page.tsx
└── profile/edit/page.tsx
```

---

## 🛠️ Components to Build (10+)

- **navbar.tsx** - Main navigation
- **course-card.tsx** - Course display
- **module-accordion.tsx** - Module list
- **quiz-component.tsx** - Quiz UI
- **code-editor.tsx** - Code editor
- **leaderboard-table.tsx** - Rankings
- **loader.tsx** - Loading state
- **error-boundary.tsx** - Error handling

---

## 🔌 AI Integration (5 Edge Functions)

Each needs Gemini API integration:

1. **generateQuiz** → MCQ questions
2. **generateProblems** → Coding challenges
3. **verifyAlgorithm** → Validate explanation
4. **verifyCode** → Test code
5. **updateUserPoints** → Award points

**Deploy with:**
```bash
supabase functions deploy generateQuiz
supabase functions deploy generateProblems
# ... etc
```

---

## 🧪 Test Checklist

### Admin Can:
- [ ] Create course
- [ ] Add module
- [ ] Add topic with video
- [ ] Set MCQ/problem count

### User Can:
- [ ] Register for course
- [ ] Watch video
- [ ] Take quiz
- [ ] View problems
- [ ] Solve problems
- [ ] Earn points
- [ ] See leaderboard rank

### System Can:
- [ ] Generate unique quizzes
- [ ] Generate unique problems
- [ ] Verify algorithm logic
- [ ] Validate code solutions
- [ ] Award points correctly
- [ ] Update leaderboard

---

## 🚀 Deployment Checklist

Before going live:

- [ ] All 3 SQL scripts executed
- [ ] Environment variables set
- [ ] All pages created
- [ ] Edge Functions deployed
- [ ] Admin password changed
- [ ] RLS policies verified
- [ ] Error handling added
- [ ] Mobile responsive
- [ ] Forms validated
- [ ] Analytics integrated

---

## ⚡ Quick Commands

```bash
# Development
npm run dev

# Build
npm run build
npm run start

# Check types
npm run type-check

# Deploy Supabase functions
supabase functions deploy [function-name]

# View Supabase logs
supabase functions list
```

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Env vars not loaded | Restart dev server |
| RLS errors | Run 002_rls_policies.sql |
| Auth not working | Check Supabase client init |
| Functions timing out | Check Gemini API key |
| Quiz always same | Add randomization |
| Points not updating | Check Edge Function logs |

---

## 📊 Database Connection String

```
postgresql://user:password@db.supabase.co:5432/postgres
```

Get from: **Supabase → Settings → Database**

---

## 🔑 Environment Variables Needed

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_GEMINI_API_KEY=

# Optional
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=
```

---

## 📞 Key Resources

- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Gemini API:** https://ai.google.dev/
- **Vercel Deploy:** https://vercel.com/docs

---

## ⏱️ Timeline Estimate

| Phase | Time |
|-------|------|
| DB Setup | 15 min |
| Auth Pages | 1 day |
| Admin Features | 1 day |
| Course Pages | 1 day |
| Learning Flow | 2 days |
| Code Editor | 1 day |
| Gamification | 1 day |
| Deploy | 1 day |
| **Total** | **~8 days** |

---

## ✅ Status Overview

| Item | Status |
|------|--------|
| Database | ✅ Ready |
| Utils | ✅ Ready |
| Docs | ✅ Complete |
| Pages | ⏳ Build |
| Functions | ⏳ Deploy |
| Deploy | ⏳ Ready |

---

**→ Start here:** Read `SETUP_GUIDE.md`

**→ Then here:** Follow `IMPLEMENTATION_GUIDE.md`

**→ Reference:** Use `COMPLETE_SETUP_SUMMARY.md`

---

Happy Building! 🎉
