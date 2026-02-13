# 🎯 CodeQuest AI - Gamified Coding Learning Platform

![Status](https://img.shields.io/badge/Status-Ready%20to%20Build-blue)
![Database](https://img.shields.io/badge/Database-✅%20Ready-green)
![Utilities](https://img.shields.io/badge/Utilities-✅%20Ready-green)
![Frontend](https://img.shields.io/badge/Frontend-⏳%20To%20Build-orange)

> **A gamified AI-powered coding learning platform built with Next.js, Supabase, and Gemini API**

---

## 📖 Documentation Index

**Start here depending on your role:**

### 🚀 I'm Ready to Setup (5 min read)
→ **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - 3-step setup + key info

### 📋 I Want Complete Instructions (30 min read)
→ **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Step-by-step setup with verification

### 🏗️ I Want to Understand the Architecture (20 min read)
→ **[COMPLETE_SETUP_SUMMARY.md](COMPLETE_SETUP_SUMMARY.md)** - Overview + full checklist

### 👨‍💻 I'm Ready to Build Pages (60 min read)
→ **[IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)** - What to build, phase by phase

### 📁 I Want to See the Project Structure (10 min read)
→ **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** - Complete directory tree

### 🔧 I Want to Deploy Edge Functions (20 min read)
→ **[supabase/functions/FUNCTIONS_GUIDE.md](supabase/functions/FUNCTIONS_GUIDE.md)** - AI integration guide

---

## ⚡ Quick Start (5 Minutes)

### 1. Execute SQL Scripts
Go to [Supabase Dashboard](https://supabase.com) → SQL Editor → Copy & run:
```bash
1. supabase/migrations/001_initial_schema.sql
2. supabase/migrations/002_rls_policies.sql  
3. supabase/migrations/003_initial_admin.sql
```

### 2. Set Environment Variables
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
NEXT_PUBLIC_GEMINI_API_KEY=your_key
```

### 3. Start Development
```bash
npm install
npm run dev
# Visit http://localhost:3000
```

---

## 🎯 What's Included

### ✅ Database (Ready to Deploy)
- **9 Tables** with proper relationships
- **20+ RLS Policies** for security
- **13 Indexes** for performance
- Admin user setup template

### ✅ Backend Utilities (Ready to Use)
- `lib/supabase.ts` - Client setup
- `lib/auth.ts` - Authentication
- `lib/courses.ts` - Course management
- `lib/quiz.ts` - Quiz handling
- `lib/problems.ts` - Problem tracking
- `lib/leaderboard.ts` - Ranking system

### ✅ Documentation (2,000+ Lines)
- Setup guide with 20+ checkpoints
- Implementation roadmap with phases
- Architecture overview
- Security guidelines
- Troubleshooting guide

### ⏳ To Build (50+ Files)
- 18 Page components
- 10+ Reusable components
- 5 Edge Functions (AI integration)
- 2-3 Custom hooks
- API routes (optional)

---

## 🏗️ Architecture

```
Next.js (Frontend)
    ↓
Supabase SDK
    ↓
[Database] [Auth] [Edge Functions]
    ↓         ↓        ↓
  SQL     Session   Gemini AI
```

---

## 📚 Database Schema (9 Tables)

| Table | Purpose |
|-------|---------|
| `users` | User profiles & points |
| `courses` | Admin-created courses |
| `modules` | Course sections |
| `topics` | Individual lessons |
| `user_courses` | User registrations |
| `quiz_responses` | Quiz attempts |
| `coding_problems` | Generated problems |
| `problem_solutions` | Submitted solutions |
| `leaderboard` | User rankings |

---

## 🎮 User Journey

```
1. Sign Up/Login
   ↓
2. Browse Courses
   ↓
3. Register for Course
   ↓
4. Watch Videos
   ↓
5. Take Quizzes
   ↓
6. Solve Problems
   ↓
7. Earn Points
   ↓
8. Climb Leaderboard
```

---

## 💰 Points System

- **Easy Problem:** 100 pts
- **Medium Problem:** 200 pts
- **Hard Problem:** 300 pts
- **Course Completion:** 500-1000 pts (configurable)

**No points for:** Watching videos, passing quizzes, completing topics

---

## 🔐 Security Features

- ✅ Row-Level Security (RLS) on all tables
- ✅ Role-based access control (admin/user)
- ✅ User data isolation
- ✅ Server-side score validation
- ✅ Gemini API keys in environment only
- ✅ Secure session management

---

## 👥 User Roles

### Admin
- Create courses
- Add modules & topics
- Define quiz/problem count
- Set course rewards
- Access admin dashboard

### User
- Browse courses
- Register for courses
- Watch videos
- Take quizzes
- Solve problems
- View leaderboard
- Edit profile

---

## 📊 Key Features

### For Learners
- 📺 Video tutorials (YouTube embedded)
- 📝 AI-generated MCQ quizzes
- 💻 LeetCode-style coding problems
- ✅ Algorithm explanation submission
- 🧪 Code submission & testing
- 🏆 Leaderboard rankings
- 📊 Progress tracking

### For Admins
- 🎓 Course creation wizard
- 📚 Module management
- 🎯 Topic with video & problem setup
- ⚙️ Points configuration
- 📈 Analytics dashboard (future)

### AI Integration
- 🤖 Quiz generation (Gemini)
- 🤖 Problem generation (Gemini)
- 🤖 Algorithm validation (Gemini)
- 🤖 Code verification (Gemini)

---

## 🚀 Implementation Timeline

| Phase | Timeframe | Items |
|-------|-----------|-------|
| 1 | Week 1 | Auth, Navbar, Home |
| 2 | Week 2 | Admin, Courses |
| 3 | Week 3 | Learning Flow |
| 4 | Week 4 | Code Editor, AI |
| 5 | Week 5 | Polish, Deploy |

**Estimated Total:** 2-3 weeks (one developer)

---

## 📦 Tech Stack

```
Frontend:     Next.js 14 (App Router)
UI Kit:       shadcn/ui + Tailwind
Backend:      Supabase (PostgreSQL)
Auth:         Supabase Auth
Database:     PostgreSQL
AI:           Gemini 4 API
Serverless:   Supabase Edge Functions
```

---

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- Supabase account (free tier OK)
- Gemini API key (free tier OK)
- Git (optional)

### Installation
```bash
# Clone or extract the project
cd codequest-ai

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local with your credentials
# Then start development server
npm run dev
```

### Verification
```bash
# Check Supabase connection
curl https://YOUR_SUPABASE_URL/rest/v1/users -H "Authorization: Bearer YOUR_KEY"

# Check app loads
open http://localhost:3000
```

---

## 📖 File Organization

```
codequest-ai/
├── supabase/           # Database migrations & functions
├── lib/                # Utility functions (ready ✅)
├── app/                # Next.js pages (to build)
├── components/         # React components (to build)
├── public/             # Static assets
└── docs/               # Documentation (complete ✅)
```

---

## 🎯 Getting Started

### Step 1: Read Documentation (15 min)
1. Start with [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
2. Then read [SETUP_GUIDE.md](SETUP_GUIDE.md)

### Step 2: Setup Supabase (15 min)
1. Create Supabase project
2. Run SQL migration scripts
3. Verify tables created

### Step 3: Configure App (5 min)
1. Create `.env.local`
2. Add Supabase credentials
3. Add Gemini API key

### Step 4: Start Development (5 min)
1. Run `npm install`
2. Run `npm run dev`
3. Visit `http://localhost:3000`

### Step 5: Build Pages (1-2 weeks)
1. Follow [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)
2. Build pages in recommended order
3. Test each phase

---

## ✅ Pre-Build Checklist

- [ ] Read SETUP_GUIDE.md
- [ ] Have Supabase account
- [ ] Have Gemini API key
- [ ] Have Node.js 18+ installed
- [ ] Understand the architecture
- [ ] SQL scripts ready to execute
- [ ] Environment variables prepared

---

## 🆘 Troubleshooting

### Database Issues
- **RLS Error:** Run `002_rls_policies.sql`
- **Table not found:** Run `001_initial_schema.sql`
- **Connection failed:** Check Supabase credentials

### Setup Issues
- **Env vars not loaded:** Restart dev server
- **Import errors:** Run `npm install`
- **Type errors:** Run `npm run type-check`

### More Help
- Check [SETUP_GUIDE.md](SETUP_GUIDE.md) → Troubleshooting
- Check [QUICK_REFERENCE.md](QUICK_REFERENCE.md) → Troubleshooting
- Review Supabase docs: https://supabase.com/docs
- Review Next.js docs: https://nextjs.org/docs

---

## 📊 Project Status

| Component | Status | Files |
|-----------|--------|-------|
| Database Schema | ✅ Ready | 3 SQL files |
| RLS Policies | ✅ Ready | 1 SQL file |
| Backend Utilities | ✅ Ready | 6 TS files |
| Documentation | ✅ Complete | 6 MD files |
| Pages | ⏳ To Build | 18 pages |
| Components | ⏳ To Build | 10+ components |
| Edge Functions | ⏳ To Deploy | 5 functions |
| Styles | ✅ Ready | Tailwind + shadcn |

---

## 🎓 Learning Resources

### Official Docs
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Gemini API Documentation](https://ai.google.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)

### Video Tutorials (Optional)
- Next.js App Router
- Supabase Integration
- Tailwind CSS
- Gemini API Integration

---

## 🔐 Important Security Notes

1. **Never commit** `.env.local` to git
2. **Never expose** Gemini API key in client code
3. **Always use** HTTPS in production
4. **Always verify** RLS policies
5. **Change default** admin password before production

---

## 📝 License

This project is open source and available for educational purposes.

---

## 🎉 Ready?

1. **First Time?** → Read [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
2. **Need Details?** → Read [SETUP_GUIDE.md](SETUP_GUIDE.md)
3. **Ready to Code?** → Read [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)
4. **Need Overview?** → Read [COMPLETE_SETUP_SUMMARY.md](COMPLETE_SETUP_SUMMARY.md)

---

## 📞 Support

For issues or questions:
1. Check the relevant documentation file above
2. Review the Troubleshooting section
3. Check official docs for your tools
4. Open an issue (if using GitHub)

---

**Let's build something amazing! 🚀**

**Current Status:** Database & utilities ready. Ready to implement Next.js pages.

**Next Action:** [→ Start with QUICK_REFERENCE.md](QUICK_REFERENCE.md)
