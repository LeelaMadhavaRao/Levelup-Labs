# 📖 CodeQuest AI - Implementation Guide

This guide details what needs to be implemented in the Next.js application after database setup.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────┐
│         Next.js Frontend (App Router)        │
├─────────────────────────────────────────────┤
│  Pages: Auth, Admin, Courses, Profile, etc  │
│  Components: UI, Forms, Editors              │
│  Utilities: Auth, Data fetching              │
├─────────────────────────────────────────────┤
│    Supabase SDK (Real-time + Auth)           │
├─────────────────────────────────────────────┤
│  Supabase Backend (Database + Auth)          │
│  Edge Functions (Gemini API integration)     │
├─────────────────────────────────────────────┤
│        Gemini 4 API (AI Generation)          │
└─────────────────────────────────────────────┘
```

---

## 📁 File Structure to Create

```
app/
├── auth/
│   ├── login/
│   │   └── page.tsx
│   ├── signup/
│   │   └── page.tsx
│   ├── callback/
│   │   └── route.ts
│   └── layout.tsx
├── admin/
│   ├── dashboard/
│   │   └── page.tsx
│   ├── create-course/
│   │   └── page.tsx
│   ├── edit-course/
│   │   └── [id]/
│   │       └── page.tsx
│   └── layout.tsx
├── courses/
│   └── page.tsx
├── my-courses/
│   └── page.tsx
├── topic/
│   └── [id]/
│       ├── watch/
│       │   └── page.tsx
│       ├── quiz/
│       │   └── page.tsx
│       └── problems/
│           ├── page.tsx
│           └── [problemId]/
│               ├── explain/
│               │   └── page.tsx
│               └── code/
│                   └── page.tsx
├── leaderboard/
│   └── page.tsx
├── profile/
│   ├── page.tsx
│   └── edit/
│       └── page.tsx
├── layout.tsx
├── page.tsx (Home)
└── globals.css

components/
├── navbar.tsx
├── course-card.tsx
├── module-accordion.tsx
├── quiz-component.tsx
├── code-editor.tsx
├── leaderboard-table.tsx
└── ui/ (shadcn components)

lib/
├── supabase.ts ✅
├── auth.ts ✅
├── courses.ts ✅
├── quiz.ts ✅
├── problems.ts ✅
└── leaderboard.ts ✅
```

---

## 🔑 Key Implementation Tasks

### Phase 1: Authentication & Core UI

#### 1.1 Login Page (`app/auth/login/page.tsx`)
- Email/Password form
- Google OAuth button
- Error handling
- Redirect to home on success
- Redirect to /admin/dashboard if admin

**Features:**
- Form validation
- Loading state
- Error messages

#### 1.2 Signup Page (`app/auth/signup/page.tsx`)
- Email/Password/Name form
- Validation
- Create user profile in database
- Auto-login on success

#### 1.3 Navigation Bar (`components/navbar.tsx`)
- Home, Courses, My Courses links
- Profile dropdown (Edit Profile, Leaderboard, Sign Out)
- Current user display
- Responsive mobile menu

#### 1.4 Home Page (`app/page.tsx`)
- Hero section with animations
- Platform overview
- CTA buttons (Get Started, Explore Courses)
- Gamification highlights

---

### Phase 2: Course Management (Admin & User)

#### 2.1 Admin Dashboard (`app/admin/dashboard/page.tsx`)
- List all courses created by admin
- Create Course button
- Edit/Delete options
- Stats (total students, courses, problems)

#### 2.2 Create Course (`app/admin/create-course/page.tsx`)
- Form: Name, Description, Thumbnail, Reward Points
- Module creation wizard
- Topic creation within modules
- Preview before save

#### 2.3 Courses Page (`app/courses/page.tsx`)
- Display all available courses
- Register/Unregister buttons
- Filter/Search
- Course cards with thumbnails
- User registration status

#### 2.4 My Courses Page (`app/my-courses/page.tsx`)
- List user's registered courses
- Progress tracking (modules, topics completed)
- Module accordion view
- Click topic to start learning

---

### Phase 3: Learning Flow (Topic Progression)

#### 3.1 Watch Video (`app/topic/[id]/watch/page.tsx`)
- Embedded YouTube player
- Mark video as watched
- Show "Start Quiz" button after completion
- Topic info and description

#### 3.2 Quiz Component (`app/topic/[id]/quiz/page.tsx`)
- Display AI-generated MCQs
- User answer selection
- Submit and show score
- Feedback for incorrect answers
- Pass/Fail threshold (70%)
- Redirect to problems if passed

**Features:**
- Timer (optional)
- Progress bar
- Question navigation
- Review answers

#### 3.3 Problems List (`app/topic/[id]/problems/page.tsx`)
- List all problems for topic
- Difficulty badges
- Points display
- Status indicators (solved/unsolved)
- Click to start problem

#### 3.4 Problem Explanation (`app/topic/[id]/problems/[problemId]/explain/page.tsx`)
- Display problem statement
- Show examples
- Text area for algorithm explanation
- Submit for AI verification
- Wait for verification result
- Feedback display

#### 3.5 Code Editor (`app/topic/[id]/problems/[problemId]/code/page.tsx`)
- Monaco editor or similar
- Language selector (JS, Python, Java, etc.)
- Test case display
- Run tests button
- Submit solution button
- Test results display
- Points awarded on success

---

### Phase 4: Gamification & Leaderboard

#### 4.1 Leaderboard Page (`app/leaderboard/page.tsx`)
- Top 10 users ranked
- User rank and points
- Search functionality
- Current user highlight
- Auto-refresh on score change

#### 4.2 Points System
- Problem solved: 100 (easy), 200 (medium), 300 (hard)
- Course completed: Course-defined points
- Update leaderboard in real-time
- Celebration animation on points earned

#### 4.3 User Profile (`app/profile/page.tsx`)
- Display: Name, Email, Avatar, Total Points, Rank
- Courses completed count
- Problems solved count
- Edit button for profile info

---

## 🎯 Implementation Checklist

### Setup
- [ ] Database schema created (001_initial_schema.sql)
- [ ] RLS policies set (002_rls_policies.sql)
- [ ] Admin user created (003_initial_admin.sql)
- [ ] Environment variables configured
- [ ] Supabase client initialized

### Authentication
- [ ] Login page working
- [ ] Signup page working
- [ ] Google OAuth configured (optional)
- [ ] Protected routes implemented
- [ ] Admin role checking

### Admin Features
- [ ] Admin dashboard showing courses
- [ ] Create course flow
- [ ] Add modules to course
- [ ] Add topics to modules
- [ ] Edit/Delete courses

### User Features
- [ ] View all courses
- [ ] Register/Unregister for courses
- [ ] My courses page with modules
- [ ] Topic progression tracking

### Learning Flow
- [ ] Watch video page
- [ ] Quiz generation and display
- [ ] Quiz submission and scoring
- [ ] Problem list display
- [ ] Algorithm explanation submission
- [ ] Code editor and submission
- [ ] Test case execution

### Gamification
- [ ] Points calculation and awarding
- [ ] Leaderboard ranking
- [ ] User rank display
- [ ] Celebration animations
- [ ] Points popups

### UI/UX
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Dark theme with neon accents
- [ ] Loading states
- [ ] Error boundaries
- [ ] Success/failure feedback

---

## 🔌 API Integration Points

### Using Edge Functions

**Call from client-side:**

```typescript
// Generate quiz
const response = await fetch('https://YOUR_SUPABASE_URL/functions/v1/generateQuiz', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabaseToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    topicId: 'xxx',
    topicName: 'Arrays',
    numQuestions: 5,
  }),
});

const { questions } = await response.json();
```

---

## 🎨 Design System

### Colors
- Primary: Neon Blue (#00FF88)
- Secondary: Purple (#7C3AED)
- Background: Dark Grey (#0F0F0F)
- Text: Light Grey (#E5E5E5)
- Accent: Cyan (#00D9FF)

### Typography
- Heading: Inter Bold
- Body: Inter Regular
- Code: Fira Code

### Components
- Use shadcn/ui components
- Custom animations for gamification
- Smooth transitions and hover effects

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] All environment variables set
- [ ] Edge Functions deployed
- [ ] RLS policies verified
- [ ] Admin credentials changed
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] Error logging setup
- [ ] Analytics integrated
- [ ] SSL certificate valid

---

## 📊 Key Metrics to Track

- User signups per day
- Course enrollment rate
- Quiz completion rate
- Problem solving rate
- Average session duration
- Course completion rate
- Leaderboard engagement

---

## 🔐 Security Reminders

1. **Never expose Gemini key on client** - Always call from Edge Functions
2. **Validate on server** - Don't trust client-side score calculations
3. **RLS is critical** - Users can only access their own data
4. **Rate limit API calls** - Prevent abuse of AI generation
5. **Hash passwords** - Supabase Auth handles this
6. **HTTPS only** - All traffic should be encrypted

---

## 📝 Component Implementation Order

1. **Navbar** - Used everywhere
2. **Auth pages** - Needed first
3. **Home page** - Landing
4. **Admin pages** - Course creation
5. **Courses pages** - User enrollment
6. **Topic flow** - Core learning
7. **Leaderboard** - Gamification
8. **Profile** - User data

---

## 🧪 Testing Checklist

### Functional Testing
- [ ] Can create admin account
- [ ] Can create courses as admin
- [ ] Can register for courses as user
- [ ] Can complete quiz flow
- [ ] Can solve problems
- [ ] Points awarded correctly
- [ ] Leaderboard updates

### Security Testing
- [ ] RLS prevents unauthorized access
- [ ] Users can't manipulate scores
- [ ] Admin endpoints protected
- [ ] API keys not exposed

### Performance Testing
- [ ] Page load time < 3s
- [ ] Quiz generation < 5s
- [ ] Code verification < 10s
- [ ] Leaderboard updates < 2s

---

## 📞 Common Issues & Solutions

### Issue: "RLS policy violation"
**Solution:** Run 002_rls_policies.sql in Supabase SQL Editor

### Issue: "Gemini API Error"
**Solution:** Check GEMINI_API_KEY in Supabase Secrets

### Issue: "Auth not persisting"
**Solution:** Ensure Supabase client is properly initialized

### Issue: "Quiz questions always same"
**Solution:** Add randomization in generateQuiz function

---

**Status:** Ready for implementation ✅
