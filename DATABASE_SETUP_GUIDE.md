# 🚀 Database Setup & Seed Data Deployment

## Quick Setup (3 steps)

### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/eejbvmmgkfptyqcedsfz/sql/new
2. You'll execute 3 SQL files in order

### Step 2: Execute SQL Files in Order

#### 2.1 Create Tables & Policies
📁 Copy entire content from: `supabase/database_setup.sql`
- Paste into SQL Editor
- Click **"Run"**
- ✅ Creates 9 tables, indexes, and Row Level Security policies

#### 2.2 Create Database Functions & Triggers
📁 Copy entire content from: `supabase/database_functions.sql`
- Paste into SQL Editor
- Click **"Run"**
- ✅ Creates stored procedures for points and leaderboard management
- ✅ Creates triggers for automatic updates

#### 2.3 Insert Seed Data
📁 Copy entire content from: `supabase/seed_data.sql`
- Paste into SQL Editor
- Click **"Run"**
- ✅ Creates system admin user automatically
- ✅ Inserts 4 courses, 18 modules, 25+ topics
- ✅ Inserts 6 sample coding problems

**Note:** Sample student users are NOT included to avoid auth conflicts. 
Real users will be created when they sign up through the app!

#### 2.4 (Optional) Add Sample Users for Testing
If you want sample leaderboard data:
1. Manually create users via: Authentication → Users → Add User
2. Use `supabase/optional_sample_users.sql` to update their profiles
3. See comments in that file for instructions

### Step 3: Verify Setup

Run this query in SQL Editor to verify:

```sql
-- Check data counts
SELECT 
  (SELECT COUNT(*) FROM courses) as total_courses,
  (SELECT COUNT(*) FROM modules) as total_modules,
  (SELECT COUNT(*) FROM topics) as total_topics,
  (SELECT COUNT(*) FROM coding_problems) as total_problems,
  (SELECT COUNT(*) FROM users WHERE role = 'user') as total_students,
  (SELECT COUNT(*) FROM leaderboard) as leaderboard_entries;
```

Expected results:
- ✅ 4 courses
- ✅ 18 modules
- ✅ 25+ topics
- ✅ 6+ coding problems
- ✅ 1 system admin (for course ownership)
- ✅ Real student users created when they sign up

---

## What Gets Created

### 🎓 4 Realistic Courses
1. **Data Structures & Algorithms Mastery** (500 points)
   - 5 modules, 13 topics
   - Arrays, Linked Lists, Trees, Sorting, Dynamic Programming

2. **System Design Fundamentals** (600 points)
   - 4 modules, 4 topics
   - Scalability, Databases, Caching, Microservices

3. **Full Stack Web Development** (700 points)
   - 5 modules, 7 topics
   - HTML/CSS, React, Node.js, Authentication, Deployment

4. **Python Programming for Data Science** (550 points)
   - 4 modules, 6 topics
   - Python Basics, NumPy/Pandas, Visualization, ML

### 👥 10 Sample Users (Leaderboard)
- Sarah Johnson (2450 points, Rank #1)
- Alex Chen (2200 points, Rank #2)
- Maria Garcia (1950 points, Rank #3)
- ... and 7 more users

### 💻 6 Sample Coding Problems
- Two Sum (Easy - 100 points)
- Maximum Subarray (Medium - 200 points)
- Reverse Linked List (Easy - 100 points)
- Valid Parentheses (Easy - 100 points)
- Binary Tree Traversal (Medium - 200 points)
- Climbing Stairs (Easy - 100 points)

### 👨‍💼 System Admin User
- Email: system@levelup-labs.com (auto-created for course ownership)
- Role: Admin
- Note: Create your own admin via Auth Dashboard and update role

### 👥 Student Users
- Created automatically when users sign up through the app
- Use `optional_sample_users.sql` if you want demo leaderboard data

---

## Alternative: Command Line Setup (Advanced)

If you have `psql` installed:

```bash
# Get connection string from Supabase Dashboard → Settings → Database
# Format: postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

psql "your-connection-string-here" < supabase/database_setup.sql
psql "your-connection-string-here" < supabase/database_functions.sql
psql "your-connection-string-here" < supabase/seed_data.sql
```

---

## Next Steps After Setup

1. ✅ Database tables created
2. ✅ Edge Functions deployed (already done)
3. ✅ Seed data loaded

### Run your app:
```bash
npm run dev
```

### Test the platform:
1. Visit http://localhost:3000
2. Sign up with any email
3. Browse courses
4. Watch videos → Take quizzes → Solve problems
5. Earn points and climb the leaderboard!

---

## Troubleshooting

### Issue: "relation already exists"
**Solution:** Tables already created. Skip to seed_data.sql

### Issue: "function already exists"
**Solution:** Functions already created. Skip to seed_data.sql

### Issue: "duplicate key value violates unique constraint"
**Solution:** Some seed data already exists. That's okay!

---

## Database Schema Overview

```
users (10 students + 1 admin)
  ├── leaderboard (rankings)
  └── user_courses (enrollments)

courses (4 courses)
  └── modules (18 modules)
      └── topics (25+ topics)
          ├── quiz_responses
          └── coding_problems (6 problems)
              └── problem_solutions
```

---

**🎉 Ready to launch Levelup-Labs!**
