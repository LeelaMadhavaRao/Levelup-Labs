# Levelup-Labs - Complete Technical Documentation

## Table of Contents
1. [Tech Stack](#tech-stack)
2. [Architecture Overview](#architecture-overview)
3. [Database Schema](#database-schema)
4. [User Flows](#user-flows)
5. [Feature Documentation](#feature-documentation)
6. [Navigation Flow](#navigation-flow)
7. [Edge Functions Workflow](#edge-functions-workflow)
8. [Authentication Flow](#authentication-flow)
9. [Points & Leaderboard System](#points--leaderboard-system)
10. [Admin Workflows](#admin-workflows)

---

## Tech Stack

### Frontend
- **Framework**: Next.js 16.1.6 (App Router, Turbopack)
- **Language**: TypeScript 5.7.3 (strict mode)
- **Styling**: Tailwind CSS 3.4
- **UI Components**: shadcn/ui (Radix UI primitives) — 40+ pre-built components
- **Fonts**: 
  - Global: Space Grotesk (secondary font)
  - Per-page gamification feel: Orbitron + Rajdhani via Google Fonts
- **Code Editor**: Custom `<CodeEditor>` component (textarea-based, no Monaco/CodeMirror dependency)
- **State Management**: React `useState` / `useEffect` hooks
- **Routing**: Next.js App Router (file-based, 19 dynamic routes)
- **Theme**: `next-themes` 0.4.6 (dark/light mode)
- **Notifications**: Sonner 1.7.1 (toast notifications)
- **HTTP Client**: `@supabase/supabase-js` 2.95.3
- **SSR Auth**: `@supabase/ssr` 0.8.0 (httpOnly cookie management)

### Backend
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth (JWT-based tokens, httpOnly cookies via @supabase/ssr)
- **Serverless Functions**: Supabase Edge Functions (Deno runtime)
- **AI**: Google Gemini API (`gemini-2.5-flash`, fallback `gemini-2.0-flash`)
- **API Keys**: Round-robin load balancing across 4 Gemini API keys
- **Storage**: Supabase Storage (avatars, thumbnails)
- **RLS**: Row Level Security policies on all tables (students see own rows, admins see context-dependent rows via migration 004)

### Development
- **Package Manager**: pnpm (lockfile: `pnpm-lock.yaml`), also compatible with npm
- **Build Tool**: Turbopack (`next dev --turbo`)
- **Linting**: ESLint (eslint-config-next)
- **Type Checking**: TypeScript strict mode
- **Version Control**: Git → GitHub → Vercel auto-deploy

---

## Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        A[Next.js App]
        B[React Components]
        C[shadcn/ui Components]
    end
    
    subgraph "API Layer"
        D[Supabase Client SDK]
        E[Edge Functions]
    end
    
    subgraph "Backend Services"
        F[(PostgreSQL Database)]
        G[Supabase Auth]
        H[Google Gemini AI]
    end
    
    A --> B
    B --> C
    B --> D
    D --> F
    D --> G
    E --> H
    E --> F
    A --> E
```

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pages      │  │  Components  │  │     Lib      │      │
│  │  (Routes)    │  │    (UI)      │  │  (Business)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                           ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE BACKEND                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Auth JWT   │  │  PostgreSQL  │  │ Edge Funcs   │      │
│  │              │  │   Database   │  │   (Deno)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                           ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Google       │  │   YouTube    │  │   Storage    │      │
│  │ Gemini AI    │  │   Embeds     │  │   (Files)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Core Tables

```mermaid
erDiagram
    users ||--o{ user_courses : enrolls
    users ||--o{ quiz_responses : attempts
    users ||--o{ problem_solutions : solves
    users ||--o{ topic_progress : tracks
    users ||--|| leaderboard : ranks
    
    courses ||--o{ user_courses : has
    courses ||--o{ modules : contains
    
    modules ||--o{ topics : includes
    
    topics ||--o{ quiz_responses : generates
    topics ||--o{ coding_problems : has
    topics ||--o{ topic_progress : tracks
    
    coding_problems ||--o{ problem_solutions : for
    
    users {
        uuid id PK
        text email UK
        text full_name
        text avatar_url
        enum role
        int total_points
        int rank
        int courses_completed
        int problems_solved
    }
    
    courses {
        uuid id PK
        uuid admin_id FK
        text name
        text description
        text thumbnail_url
        int completion_reward_points
    }
    
    modules {
        uuid id PK
        uuid course_id FK
        text name
        text description
        int order_index
    }
    
    topics {
        uuid id PK
        uuid module_id FK
        text name
        text description
        text overview
        text video_url
        int num_mcqs
        int num_problems
    }
    
    topic_progress {
        uuid id PK
        uuid user_id FK
        uuid topic_id FK
        bool video_watched
        bool quiz_passed
        int problems_completed
    }
    
    coding_problems {
        uuid id PK
        uuid topic_id FK
        text title
        text description
        enum difficulty
        jsonb examples
        jsonb test_cases
    }
    
    problem_solutions {
        uuid id PK
        uuid user_id FK
        uuid problem_id FK
        enum status
        text algorithm_explanation
        text code_solution
        int points_awarded
    }
```

### Database Enums

- **user_role**: `'admin'` | `'user'`
- **problem_difficulty**: `'easy'` | `'medium'` | `'hard'`
- **solution_status**: `'pending'` | `'algorithm_submitted'` | `'algorithm_verified'` | `'algorithm_approved'` | `'code_submitted'` | `'code_failed'` | `'completed'` | `'failed'`

---

## User Flows

### Student Learning Flow

```mermaid
flowchart TD
    Start([Student Logs In]) --> Dashboard[Dashboard Page]
    Dashboard --> BrowseCourses[Browse Courses]
    BrowseCourses --> EnrollCourse[Enroll in Course]
    EnrollCourse --> MyCourses[My Courses Page]
    MyCourses --> SelectTopic[Select Topic]
    
    SelectTopic --> TopicLanding[Topic Landing Page]
    TopicLanding --> CheckProgress{Check Progress}
    
    CheckProgress -->|Step 1| WatchVideo[Watch Video]
    WatchVideo --> MarkWatched[Mark as Watched]
    MarkWatched --> TopicOverview{View Topic Overview?}
    TopicOverview -->|Yes| EnhancedOverview[AI-Enhanced Overview]
    TopicOverview -->|No| TakeQuiz
    EnhancedOverview --> TakeQuiz[Take Quiz]
    
    CheckProgress -->|Step 2| TakeQuiz
    TakeQuiz --> GenerateQuiz[Generate AI Quiz]
    GenerateQuiz --> AnswerQuestions[Answer 5 MCQs]
    AnswerQuestions --> SubmitQuiz[Submit Quiz]
    SubmitQuiz --> CheckScore{Score >= 70%?}
    CheckScore -->|No| RetryQuiz[Retry Quiz]
    RetryQuiz --> GenerateQuiz
    CheckScore -->|Yes| QuizPassed[Quiz Passed]
    QuizPassed --> UpdateProgress1[Update topic_progress]
    
    CheckProgress -->|Step 3| SolveProblems
    UpdateProgress1 --> SolveProblems[Solve Problems Page]
    SolveProblems --> SelectProblem[Select Problem]
    SelectProblem --> ExplainPage[Explain Algorithm Page]
    
    ExplainPage --> WriteAlgorithm[Write Algorithm Explanation]
    WriteAlgorithm --> SubmitAlgorithm[Submit to AI Verification]
    SubmitAlgorithm --> VerifyAlgorithm{AI Verifies}
    VerifyAlgorithm -->|Rejected| ReviseAlgorithm[Revise Explanation]
    ReviseAlgorithm --> WriteAlgorithm
    VerifyAlgorithm -->|Approved| GoToCode[Go to Code Page]
    
    GoToCode --> CodePage[Code Editor Page]
    CodePage --> WriteCode[Write Code Solution]
    WriteCode --> RunCode[Run Test Cases]
    RunCode --> CheckTests{All Tests Pass?}
    CheckTests -->|No| FixCode[Fix Code]
    FixCode --> WriteCode
    CheckTests -->|Yes| SubmitCode[Submit Code]
    SubmitCode --> AwardPoints[Award Points]
    AwardPoints --> UpdateLeaderboard[Update Leaderboard]
    UpdateLeaderboard --> UpdateProgress2[Update topic_progress]
    
    UpdateProgress2 --> CheckAllProblems{All Problems Solved?}
    CheckAllProblems -->|No| SelectProblem
    CheckAllProblems -->|Yes| TopicComplete[Topic Completed!]
    
    TopicComplete --> ViewLeaderboard[View Leaderboard]
    ViewLeaderboard --> CheckRank[Check Your Rank]
    CheckRank --> NextTopic[Continue to Next Topic]
    NextTopic --> MyCourses
```

### Admin Course Creation Flow

```mermaid
flowchart TD
    AdminLogin([Admin Logs In]) --> AdminDash[Admin Dashboard]
    AdminDash --> CreateCourse[Create Course Page]
    
    CreateCourse --> CourseDetails[Enter Course Details]
    CourseDetails --> AddModule[Add Module]
    AddModule --> ModuleDetails[Enter Module Details]
    ModuleDetails --> AddTopic[Add Topic]
    
    AddTopic --> TopicForm[Topic Form]
    TopicForm --> TopicName[Enter Topic Name]
    TopicName --> VideoURL[Paste YouTube URL]
    VideoURL --> Description[Enter Description]
    Description --> Overview[Enter Topic Overview]
    Overview --> MoreTopics{Add More Topics?}
    
    MoreTopics -->|Yes| AddTopic
    MoreTopics -->|No| MoreModules{Add More Modules?}
    
    MoreModules -->|Yes| AddModule
    MoreModules -->|No| SaveCourse[Save Course]
    
    SaveCourse --> CreateCourseDB[(Create in Database)]
    CreateCourseDB --> CreateModulesDB[(Create Modules)]
    CreateModulesDB --> CreateTopicsDB[(Create Topics)]
    CreateTopicsDB --> Success[Course Created!]
    Success --> ManageCourses[Manage Courses Page]
    
    ManageCourses --> ViewCourses[View All Courses]
    ViewCourses --> EditOption{Edit or Delete?}
    EditOption -->|Edit| EditCourse[Edit Course Page]
    EditOption -->|Delete| ConfirmDelete{Confirm Delete?}
    ConfirmDelete -->|Yes| DeleteCourse[(Delete from DB)]
    ConfirmDelete -->|No| ViewCourses
    
    EditCourse --> UpdateDetails[Update Course Details]
    UpdateDetails --> SaveChanges[Save Changes]
    SaveChanges --> ViewCourses
```

---

## Feature Documentation

### 1. Authentication System

**Flow**:
```mermaid
sequenceDiagram
    participant User
    participant App
    participant Supabase Auth
    participant Database
    
    User->>App: Enter email/password
    App->>Supabase Auth: signInWithPassword()
    Supabase Auth->>Supabase Auth: Validate credentials
    Supabase Auth->>App: Return JWT + user data
    App->>Database: Check user role
    Database->>App: Return role (admin/user)
    App->>User: Redirect to dashboard
    
    Note over User,App: JWT stored in cookie
    Note over App: All requests include JWT
```

**Implementation**:
- Location: `lib/auth.ts`
- Functions:
  - `signUp()` - Create new user account
  - `signIn()` - Login with email/password
  - `signOut()` - Logout and clear session
  - `getCurrentUser()` - Get authenticated user
  - `resetPassword()` - Password reset flow

**Pages**:
- `/auth/login` - Login form
- `/auth/signup` - Registration form
- `/auth/forgot-password` - Password reset request
- `/auth/reset-password` - Set new password

---

### 2. Course Management

**Admin Course Creation**:

```mermaid
flowchart LR
    A[Course Form] --> B[Enter Details]
    B --> C[Add Modules]
    C --> D[Add Topics]
    D --> E[Submit]
    E --> F{Validation}
    F -->|Pass| G[Save to DB]
    F -->|Fail| B
    G --> H[Create Course]
    H --> I[Create Modules]
    I --> J[Create Topics]
    J --> K[Success!]
```

**Database Operations**:
1. Create course record in `courses` table
2. For each module:
   - Create record in `modules` table
   - Link to course via `course_id`
3. For each topic:
   - Create record in `topics` table
   - Link to module via `module_id`
   - Store YouTube URL, description, overview

**Enrollment Flow**:
```mermaid
sequenceDiagram
    participant Student
    participant App
    participant Database
    
    Student->>App: Click Enroll
    App->>App: Check if logged in
    App->>Database: INSERT user_courses
    Database->>Database: Create record
    Database->>App: Enrollment success
    App->>Student: Show "Enrolled" badge
    Student->>App: Navigate to My Courses
```

---

### 3. Topic Learning Flow (3-Step Process)

#### Step 1: Watch Video

```mermaid
stateDiagram-v2
    [*] --> VideoNotWatched
    VideoNotWatched --> VideoPlaying: Click Watch
    VideoPlaying --> CheckOverview: Video ends
    CheckOverview --> ViewOverview: Click Topic Overview
    ViewOverview --> EnhancingAI: Send to Gemini API
    EnhancingAI --> DisplayEnhanced: Show AI-enhanced overview
    DisplayEnhanced --> MarkWatched: Click Mark as Watched
    CheckOverview --> MarkWatched: Skip Overview
    MarkWatched --> VideoWatched: Update DB
    VideoWatched --> [*]
```

**Implementation**:
- Page: `/topic/[id]/watch`
- Component: YouTube iframe embed
- Action: `markVideoAsWatched()` → Updates `topic_progress.video_watched = true`
- Enhanced Overview: Calls `enhanceOverview` Edge Function → Gemini AI enhances the admin-provided overview

#### Step 2: Take Quiz

```mermaid
flowchart TD
    Start[Quiz Page Loads] --> Generate[Call generateQuiz Edge Function]
    Generate --> Gemini[Gemini AI generates 5 MCQs]
    Gemini --> Display[Display Questions]
    Display --> Answer[Student answers all 5]
    Answer --> Submit[Submit Quiz]
    Submit --> Calculate[Calculate Score]
    Calculate --> Check{Score >= 70%?}
    Check -->|Yes| Pass[Quiz Passed!]
    Check -->|No| Fail[Quiz Failed]
    Pass --> UpdateDB[Update topic_progress.quiz_passed = true]
    UpdateDB --> NextStep[Enable Problems Step]
    Fail --> Retry[Retry Button]
    Retry --> Generate
```

**Edge Function**: `generateQuiz`
- Input: `topicId`, `topicName`, `numQuestions`, `topicOverview`
- Process:
  1. Authenticate user
  2. Call Gemini AI with prompt including topic overview
  3. Parse JSON response
  4. Return array of questions with options and correct answers
- Output: `{ questions: [{question, options, correctAnswer}] }`

**Database Operations**:
- Insert into `quiz_responses` table
- Update `topic_progress.quiz_passed = true` if score >= 70%

#### Step 3: Solve Problems

```mermaid
flowchart TD
    ProblemsPage[Problems List Page] --> CheckProblems{Problems exist?}
    CheckProblems -->|No| Generate[Generate via Edge Function]
    CheckProblems -->|Yes| List[Display Problems List]
    Generate --> Gemini[Gemini creates 3 problems]
    Gemini --> SaveDB[Save to coding_problems table]
    SaveDB --> List
    
    List --> Select[Select Problem]
    Select --> ExplainPage[Explain Algorithm Page]
    
    subgraph "Explain Phase"
        ExplainPage --> WriteAlgo[Write Algorithm Explanation]
        WriteAlgo --> SubmitAlgo[Submit to AI]
        SubmitAlgo --> VerifyAlgo[verifyAlgorithm Edge Function]
        VerifyAlgo --> GeminiVerify[Gemini verifies correctness]
        GeminiVerify --> Result{Approved?}
        Result -->|No| Feedback[Show feedback]
        Feedback --> WriteAlgo
        Result -->|Yes| EnableCode[Enable Code Button]
    end
    
    EnableCode --> CodePage[Code Editor Page]
    
    subgraph "Code Phase"
        CodePage --> WriteCode[Write Code in Monaco Editor]
        WriteCode --> RunTests[Click Run Test Cases]
        RunTests --> VerifyCode[verifyCode Edge Function]
        VerifyCode --> ExecuteTests[Run test cases]
        ExecuteTests --> TestResult{All Pass?}
        TestResult -->|No| ShowFailure[Show failed tests]
        ShowFailure --> WriteCode
        TestResult -->|Yes| AwardPoints[Award Points]
    end
    
    AwardPoints --> UpdateSolution[problem_solutions.status = completed]
    UpdateSolution --> UpdateUser[Increment users.problems_solved]
    UpdateUser --> UpdateLeaderboard[Update leaderboard rank]
    UpdateLeaderboard --> UpdateProgress[Increment topic_progress.problems_completed]
    UpdateProgress --> CheckComplete{All problems done?}
    CheckComplete -->|No| List
    CheckComplete -->|Yes| Complete[Topic Complete!]
```

**Problem Generation**:
- Edge Function: `generateProblems`
- Input: `topicId`, `topicName`, `numProblems`, `topicOverview`
- Output: Array of problems with title, description, examples, test cases
- Saved to `coding_problems` table

**Algorithm Verification**:
- Edge Function: `verifyAlgorithm`
- Input: Problem description + user's algorithm explanation
- AI checks: correctness, completeness, clarity
- Output: `{ approved: boolean, feedback: string }`

**Code Verification**:
- Edge Function: `verifyCode`
- Input: Problem test cases + user's code
- Process:
  1. Run code against all test cases
  2. Check outputs match expected
  3. Award points based on difficulty
  4. Update `problem_solutions` table
  5. Call `add_points_to_user` RPC function
  6. Update leaderboard

---

### 4. Review Mode (Solved Problems)

```mermaid
stateDiagram-v2
    [*] --> Unsolved
    Unsolved --> ExplainEditable: Start Problem
    ExplainEditable --> AlgorithmSubmitted: Submit Algorithm
    AlgorithmSubmitted --> AlgorithmApproved: AI Approves
    AlgorithmApproved --> CodeEditable: Go to Code
    CodeEditable --> Completed: Submit Code
    Completed --> ExplainReadOnly: Click Review (Explain)
    Completed --> CodeReadOnly: Click Review (Code)
    ExplainReadOnly --> Completed: Back
    CodeReadOnly --> Completed: Back
    
    note right of ExplainReadOnly
        - Textarea frozen
        - "Solved" badge shown
        - Submit button hidden
        - "View Code" instead of "Go to Code"
    end note
    
    note right of CodeReadOnly
        - Monaco editor readOnly: true
        - "Problem solved" indicator
        - No Run/Submit buttons
        - Saved code loaded from DB
    end note
```

**Implementation**:
- Explain page checks `problem.status === 'completed'`
- If solved:
  - Load saved `algorithm_explanation` from DB
  - Show read-only textarea
  - Display "Solved ✓" badge
  - Hide submit button
  - Show "View Code" instead of "Go to Code"
- Code page checks problem status
- If solved:
  - Load saved `code_solution` from DB
  - Set `CodeEditor` prop `readOnly={true}`
  - Show "Problem solved — code is read-only" message
  - Hide run/submit buttons

---

### 5. Points & Leaderboard System

```mermaid
flowchart TD
    StudentSolves[Student Submits Code] --> EdgeFunction[verifyCode Edge Function]
    EdgeFunction --> TestsPass{All Tests Pass?}
    TestsPass -->|No| ReturnError[Return Error]
    TestsPass -->|Yes| CheckDifficulty{Check Difficulty}
    
    CheckDifficulty -->|Easy| Award100[+100 points]
    CheckDifficulty -->|Medium| Award200[+200 points]
    CheckDifficulty -->|Hard| Award300[+300 points]
    
    Award100 --> RPC[Call add_points_to_user RPC]
    Award200 --> RPC
    Award300 --> RPC
    
    RPC --> CheckIdempotency{Already awarded?}
    CheckIdempotency -->|Yes| Skip[Skip points]
    CheckIdempotency -->|No| UpdateUser[Update users.total_points]
    
    UpdateUser --> UpdateSolution[Update problem_solutions]
    UpdateSolution --> Trigger[Trigger: update_user_problems_solved]
    Trigger --> IncrementCount[Increment users.problems_solved]
    IncrementCount --> UpdateLeaderboard[Update leaderboard table]
    UpdateLeaderboard --> RecalculateRanks[Recalculate all ranks]
    RecalculateRanks --> Success[Points Awarded!]
    
    Skip --> UpdateSolution
```

**Points Breakdown**:
- Easy problem: **100 points**
- Medium problem: **200 points**
- Hard problem: **300 points**

**Database Updates**:
1. `users.total_points` += points
2. `users.problems_solved` += 1
3. `problem_solutions.status` = 'completed'
4. `problem_solutions.points_awarded` = points
5. `leaderboard.total_points` updated
6. `leaderboard.rank` recalculated for all users

**Idempotency**:
- Edge Function checks if `points_awarded > 0` BEFORE calling RPC
- RPC function also checks to prevent double-awarding
- Fallback: Direct `users` table update if RPC fails

**Rank Calculation**:
- Ordered by `total_points DESC`
- Trigger function `update_leaderboard_ranks` runs on insert/update
- Ranks are 1-indexed (1st place, 2nd place, etc.)

---

### 6. Admin Filtering

**Leaderboard Admin Exclusion**:
```sql
-- All leaderboard queries filter out admin users
SELECT * FROM users
WHERE role != 'admin'
ORDER BY total_points DESC
```

**Implementation**:
- `lib/leaderboard.ts`:
  - `getTopLeaderboard()` → `.neq('role', 'admin')`
  - `searchLeaderboard()` → `.neq('role', 'admin')`
- Admin users don't appear in:
  - Leaderboard page
  - Dashboard top 5 leaderboard
  - Search results

---

## Navigation Flow

### Navbar Links (Authenticated)

**Student Navbar**
- `/dashboard` (HOME)
- `/courses` (GATES)
- `/my-courses` (MY QUESTS)
- `/practice` (PRACTICE)
- `/leaderboard` (RANKINGS)

**Admin Navbar**
- `/dashboard` (HOME)
- `/admin/dashboard` (ADMIN)
- `/admin/create-course` (CREATE)
- `/admin/courses` (CONSOLE)
- `/courses` (GATES)
- `/practice` (PRACTICE)
- `/leaderboard` (RANKINGS)

### Public Routes (No Auth Required)
```
/ (Home Page)
├── Features, Hero, CTA
└── → /auth/login or /auth/signup

/auth/login → /dashboard (after login)
/auth/signup → /dashboard (after signup)
/auth/forgot-password → Email sent
/auth/reset-password → /auth/login
```

### Student Routes (Auth Required)
```
/dashboard
├── Stats cards (points, problems, courses)
├── Continue Learning section → /my-courses
├── Top 5 Leaderboard → /leaderboard
└── Recent courses

/courses (Browse all courses)
└── → /my-courses (after enrollment)

/my-courses (Enrolled courses with progress)
└── Click topic → /topic/[id] (landing page)

/topic/[id] (Topic landing page - progress tracker)
├── → /topic/[id]/watch (Step 1: Video)
├── → /topic/[id]/quiz (Step 2: Quiz)
└── → /topic/[id]/problems (Step 3: Problems list)

/topic/[id]/problems
└── Click problem → /topic/[id]/problems/[problemId]/explain

/topic/[id]/problems/[problemId]/explain
└── Algorithm approved → /topic/[id]/problems/[problemId]/code

/topic/[id]/problems/[problemId]/code
└── Code submitted → Back to /topic/[id]/problems

/leaderboard
├── View all rankings
├── Search by name/rank
└── View own rank

/practice
└── Browse all problems across topics

/profile
└── /profile/edit (Update profile)
```

### Admin Routes (Admin Role Required)
```
/admin/dashboard
├── Course management cards
├── Create new course → /admin/create-course
└── Manage courses → /admin/courses

/admin/create-course
└── Submit → /admin/dashboard

/admin/courses
├── View all courses table
├── Edit course → /admin/courses/[id]/edit
└── Delete course (with confirmation)

/admin/courses/[id]/edit
└── Save changes → /admin/courses
```

### Route Protection
```mermaid
flowchart TD
    Request[Page Request] --> CheckAuth{Authenticated?}
    CheckAuth -->|No| Public{Public Route?}
    Public -->|Yes| Allow[Allow Access]
    Public -->|No| Redirect1[Redirect to /auth/login]
    
    CheckAuth -->|Yes| CheckRole{Check Role}
    CheckRole --> AdminRoute{Admin Route?}
    AdminRoute -->|Yes| IsAdmin{User is Admin?}
    IsAdmin -->|Yes| Allow
    IsAdmin -->|No| Redirect2[Redirect to /dashboard]
    AdminRoute -->|No| Allow
```

---

## Edge Functions Workflow

### 1. generateQuiz

```mermaid
sequenceDiagram
    participant Client
    participant Edge Function
    participant Gemini API
    participant Database
    
    Client->>Edge Function: POST /functions/v1/generateQuiz
    Note over Client,Edge Function: { topicId, topicName, numQuestions, topicOverview }
    
    Edge Function->>Edge Function: Validate JWT
    Edge Function->>Database: Get user session
    Database->>Edge Function: Return user data
    
    Edge Function->>Edge Function: Build AI prompt with overview
    Edge Function->>Gemini API: Generate quiz questions
    Note over Gemini API: Round-robin API keys<br/>Model fallback: 2.5-flash → 2.0-flash
    
    Gemini API->>Edge Function: Return JSON array of questions
    Edge Function->>Edge Function: Parse & validate JSON
    Edge Function->>Client: Return { questions: [...] }
```

**Key Features**:
- 4 API keys in round-robin rotation
- Model fallback: gemini-2.5-flash → gemini-2.0-flash
- Topic overview included in prompt for context
- Returns array of MCQs with options and correct answer index

### 2. generateProblems

```mermaid
sequenceDiagram
    participant Client
    participant Edge Function
    participant Gemini API
    participant Database
    
    Client->>Edge Function: POST /functions/v1/generateProblems
    Note over Client,Edge Function: { topicId, topicName, numProblems, topicOverview }
    
    Edge Function->>Edge Function: Validate JWT
    Edge Function->>Database: Get user session
    
    Edge Function->>Edge Function: Build AI prompt with overview
    Edge Function->>Gemini API: Generate coding problems
    
    Gemini API->>Edge Function: Return JSON array of problems
    Edge Function->>Database: INSERT INTO coding_problems
    Database->>Edge Function: Return inserted problems
    Edge Function->>Client: Return { problems: [...] }
```

**Generated Problem Structure**:
```json
{
  "title": "Problem Title",
  "description": "Detailed description with constraints",
  "difficulty": "easy|medium|hard",
  "examples": [
    {
      "input": "example input",
      "output": "example output",
      "explanation": "why this output"
    }
  ],
  "testCases": [
    {
      "input": "test input",
      "expectedOutput": "expected output"
    }
  ]
}
```

### 3. verifyAlgorithm

```mermaid
sequenceDiagram
    participant Client
    participant Edge Function
    participant Gemini API
    
    Client->>Edge Function: POST /functions/v1/verifyAlgorithm
    Note over Client,Edge Function: { problemDescription, algorithmExplanation }
    
    Edge Function->>Edge Function: Validate JWT
    Edge Function->>Gemini API: Verify algorithm explanation
    Note over Gemini API: Checks correctness,<br/>completeness, clarity
    
    Gemini API->>Edge Function: Return { approved, feedback }
    Edge Function->>Client: Return verification result
```

**AI Evaluation Criteria**:
- Correctness: Does the algorithm solve the problem?
- Completeness: Are all edge cases considered?
- Clarity: Is the explanation clear and understandable?
- Efficiency: Is the approach reasonably efficient?

### 4. verifyCode

```mermaid
sequenceDiagram
    participant Client
    participant Edge Function
    participant Database
    
    Client->>Edge Function: POST /functions/v1/verifyCode
    Note over Client,Edge Function: { problemId, code, language }
    
    Edge Function->>Edge Function: Validate JWT
    Edge Function->>Database: Get problem test cases
    Database->>Edge Function: Return test cases
    
    Edge Function->>Edge Function: Execute code with test cases
    Edge Function->>Edge Function: Check all outputs
    
    alt All tests pass
        Edge Function->>Edge Function: Calculate points by difficulty
        Edge Function->>Database: Call add_points_to_user RPC
        Database->>Edge Function: Points added
        Edge Function->>Database: Update problem_solutions status
        Edge Function->>Client: Return { success, points }
    else Tests fail
        Edge Function->>Client: Return { error, failedTests }
    end
```

**Points Award Flow**:
1. Check if `problem_solutions.points_awarded > 0` (client-side idempotency)
2. Call `add_points_to_user(user_id, points)` RPC BEFORE updating solution
3. RPC checks if points already awarded (DB idempotency)
4. Update `users.total_points`
5. Update `problem_solutions.status = 'completed'`
6. Trigger `update_user_problems_solved` increments counter
7. Update leaderboard ranks

### 5. enhanceOverview

```mermaid
sequenceDiagram
    participant Client
    participant Edge Function
    participant Gemini API
    
    Client->>Edge Function: POST /functions/v1/enhanceOverview
    Note over Client,Edge Function: { topicName, overview }
    
    Edge Function->>Edge Function: Validate JWT
    Edge Function->>Gemini API: Enhance topic overview
    Note over Gemini API: Creates structured overview:<br/>What You'll Learn, Why It Matters,<br/>Key Concepts, Prerequisites, Tips
    
    Gemini API->>Edge Function: Return enhanced markdown
    Edge Function->>Client: Return { enhancedOverview }
```

**Enhanced Overview Structure**:
- **What You'll Learn** — Key concepts summary
- **Why It Matters** — Real-world relevance
- **Key Concepts** — Bullet points of main technical concepts
- **Prerequisites** — What student should already know
- **Learning Tips** — Quick tips for mastering the topic

---

## Authentication Flow

### Signup Flow
```mermaid
flowchart TD
    A[User fills signup form] --> B[Submit to Supabase Auth]
    B --> C{Email unique?}
    C -->|No| D[Show error]
    C -->|Yes| E[Create auth.users record]
    E --> F[Trigger creates users table record]
    F --> G[Default role = 'user']
    G --> H[Send confirmation email]
    H --> I[Auto-login]
    I --> J[Redirect to /dashboard]
```

### Login Flow
```mermaid
flowchart TD
    A[User enters email/password] --> B[Call signInWithPassword]
    B --> C{Credentials valid?}
    C -->|No| D[Show error]
    C -->|Yes| E[Return JWT token]
    E --> F[Store in httpOnly cookie]
    F --> G[Fetch user data from users table]
    G --> H{Check role}
    H -->|admin| I[Redirect to /admin/dashboard]
    H -->|user| J[Redirect to /dashboard]
```

### Password Reset Flow
```mermaid
flowchart TD
    A[User clicks Forgot Password] --> B[Enter email]
    B --> C[Submit to Supabase Auth]
    C --> D[Send reset email with token]
    D --> E[User clicks email link]
    E --> F[Redirect to /auth/reset-password?token=xxx]
    F --> G[Enter new password]
    G --> H[Submit with token]
    H --> I[Update password in auth.users]
    I --> J[Redirect to /auth/login]
```

### Session Management
```mermaid
flowchart TD
    A[Every page load] --> B{Session exists?}
    B -->|No| C{Protected route?}
    C -->|Yes| D[Redirect to /auth/login]
    C -->|No| E[Allow access]
    B -->|Yes| F[Refresh JWT token]
    F --> G{Token valid?}
    G -->|No| D
    G -->|Yes| H[Load user data]
    H --> I{Check route permissions}
    I -->|Admin route + user role| J[Redirect to /dashboard]
    I -->|Allowed| K[Render page]
```

---

## Points & Leaderboard System

### Points Award Process

```mermaid
flowchart TD
    A[Student submits code] --> B[verifyCode Edge Function]
    B --> C{All tests pass?}
    C -->|No| D[Return error]
    C -->|Yes| E{Check difficulty}
    
    E -->|Easy| F[100 points]
    E -->|Medium| G[200 points]
    E -->|Hard| H[300 points]
    
    F --> I{Client-side check:<br/>points_awarded > 0?}
    G --> I
    H --> I
    
    I -->|Yes| J[Skip - Already awarded]
    I -->|No| K[Call add_points_to_user RPC]
    
    K --> L{DB check:<br/>points already awarded?}
    L -->|Yes| M[Skip]
    L -->|No| N[Update users.total_points]
    
    N --> O[Update problem_solutions status]
    O --> P[Trigger: update_user_problems_solved]
    P --> Q[Increment users.problems_solved]
    Q --> R[Update leaderboard.total_points]
    R --> S[Recalculate leaderboard.rank]
    S --> T[Return success]
    
    J --> O
    M --> O
```

### Leaderboard Rank Calculation

```mermaid
flowchart TD
    A[Points updated] --> B[Trigger: update_leaderboard_ranks]
    B --> C[Query all users ORDER BY total_points DESC]
    C --> D[Assign ranks 1, 2, 3...]
    D --> E[Update leaderboard.rank for all]
    E --> F[Users.rank = leaderboard.rank]
    F --> G[Leaderboard updated!]
```

**Rank Display**:
- Leaderboard page shows all users (except admins)
- Dashboard shows top 5
- Each user can see their own rank
- Podium display for top 3 (gold, silver, bronze)

---

## Admin Workflows

### Course Creation Workflow

```mermaid
flowchart TD
    Start[Admin Dashboard] --> Create[Click Create Course]
    Create --> Form[Course Creation Form]
    
    Form --> CourseSection[Course Details Section]
    CourseSection --> CourseName[Enter name*]
    CourseName --> CourseDesc[Enter description*]
    CourseDesc --> Thumbnail[Enter thumbnail URL]
    Thumbnail --> Points[Set completion reward points]
    
    Points --> ModuleSection[Modules Section]
    ModuleSection --> AddModule[Click Add Module]
    AddModule --> ModuleName[Enter module name*]
    ModuleName --> ModuleDesc[Enter module description]
    ModuleDesc --> TopicSection[Topics Section]
    
    TopicSection --> AddTopic[Click Add Topic]
    AddTopic --> TopicName[Enter topic name*]
    TopicName --> VideoURL[Enter YouTube URL*]
    VideoURL --> TopicDesc[Enter topic description]
    TopicDesc --> TopicOverview[Enter topic overview]
    
    TopicOverview --> MoreTopics{Add more topics?}
    MoreTopics -->|Yes| AddTopic
    MoreTopics -->|No| MoreModules{Add more modules?}
    
    MoreModules -->|Yes| AddModule
    MoreModules -->|No| Validate{Validation}
    
    Validate -->|Fail| ValidationError[Show errors]
    ValidationError --> Form
    
    Validate -->|Pass| SaveCourse[Save to Database]
    SaveCourse --> CreateCourse[INSERT INTO courses]
    CreateCourse --> CreateModules[INSERT INTO modules]
    CreateModules --> CreateTopics[INSERT INTO topics]
    CreateTopics --> Success[Success! Redirect]
    Success --> ManageCourses[Admin Courses Page]
```

### Course Management

```mermaid
stateDiagram-v2
    [*] --> ManageCourses
    ManageCourses --> ViewCourses: Load courses
    ViewCourses --> FilterSearch: Search/Filter
    FilterSearch --> ViewCourses: Apply filters
    
    ViewCourses --> EditCourse: Click Edit
    EditCourse --> EditForm: Load course data
    EditForm --> SaveChanges: Submit
    SaveChanges --> ViewCourses: Update successful
    
    ViewCourses --> DeleteCourse: Click Delete
    DeleteCourse --> ConfirmDelete: Show dialog
    ConfirmDelete --> ViewCourses: Confirm
    ConfirmDelete --> ViewCourses: Cancel
    
    ViewCourses --> [*]
```

---

## Complete Learning Journey Diagram

```mermaid
flowchart TB
    Start([Student Signup/Login]) --> Dashboard[📊 Dashboard]
    
    Dashboard --> Browse[🔍 Browse Courses]
    Browse --> CourseDetail[📚 Course Detail Page]
    CourseDetail --> Enroll{Enroll}
    Enroll --> MyCourses[📖 My Courses]
    
    MyCourses --> Topic1[📝 Topic 1]
    
    subgraph "Topic Learning Journey"
        Topic1 --> Video[🎥 Watch Video]
        Video --> Overview{View Overview?}
        Overview -->|Yes| AIOverview[✨ AI-Enhanced Overview]
        Overview -->|No| Quiz
        AIOverview --> Quiz[❓ Take Quiz 5 MCQs]
        Quiz --> QuizScore{Score >= 70%?}
        QuizScore -->|No| RetryQuiz[🔄 Retry]
        RetryQuiz --> Quiz
        QuizScore -->|Yes| Problems[💻 Solve Problems]
        
        Problems --> Problem1[Problem 1: Easy]
        Problem1 --> ExplainAlgo[📝 Explain Algorithm]
        ExplainAlgo --> AIVerify1[🤖 AI Verifies]
        AIVerify1 --> AlgoApproved{Approved?}
        AlgoApproved -->|No| ReviseAlgo[✏️ Revise]
        ReviseAlgo --> ExplainAlgo
        AlgoApproved -->|Yes| WriteCode[💻 Write Code]
        WriteCode --> RunTests[▶️ Run Tests]
        RunTests --> TestsPass{All Pass?}
        TestsPass -->|No| FixCode[🔧 Fix Code]
        FixCode --> WriteCode
        TestsPass -->|Yes| Points1[+100 points]
        
        Points1 --> Problem2[Problem 2: Medium]
        Problem2 --> Points2[+200 points]
        Points2 --> Problem3[Problem 3: Hard]
        Problem3 --> Points3[+300 points]
    end
    
    Points3 --> TopicComplete[✅ Topic Complete!]
    TopicComplete --> UpdateLeaderboard[🏆 Update Leaderboard]
    UpdateLeaderboard --> NextTopic{More topics?}
    NextTopic -->|Yes| Topic2[📝 Next Topic]
    Topic2 --> Video
    NextTopic -->|No| CourseComplete[🎉 Course Complete!]
    
    CourseComplete --> Certificate[🏅 Certificate + Bonus Points]
    Certificate --> ViewLeaderboard[🏆 View Leaderboard]
    ViewLeaderboard --> CheckRank[👑 Check Your Rank]
    CheckRank --> Practice[💪 Practice More]
    Practice --> Browse
    
    Dashboard --> Leaderboard[🏆 Leaderboard]
    Leaderboard --> Compete[🎯 Compete with others]
    Compete --> Practice
    
    style Start fill:#4ade80
    style Dashboard fill:#60a5fa
    style CourseComplete fill:#f59e0b
    style Certificate fill:#fbbf24
    style ViewLeaderboard fill:#a855f7
    style TopicComplete fill:#10b981
```

---

## Key Features Summary

### For Students
1. **Gamified Learning**: Points, leaderboard, ranks
2. **AI-Powered Content**: Quiz generation, problem generation, algorithm verification
3. **Progressive Learning**: Video → Quiz → Problems (3-step flow)
4. **Instant Feedback**: Real-time code testing, AI verification
5. **Enhanced Overviews**: Gemini-powered topic summaries
6. **Progress Tracking**: Per-topic and per-course progress
7. **Review Mode**: Revisit solved problems (read-only)
8. **Competitive Element**: Leaderboard with rankings

### For Admins
1. **Course Management**: Create, edit, delete courses
2. **Structured Content**: Modules → Topics hierarchy
3. **YouTube Integration**: Embed videos directly
4. **Topic Overviews**: Enhanced by AI for students
5. **Auto-Generated Content**: AI creates quizzes and problems
6. **Analytics Dashboard**: View course statistics

### Technical Features
1. **Responsive Design**: Works on all devices
2. **Dark/Light Mode**: Theme switching
3. **Type-Safe**: Full TypeScript coverage
4. **Optimistic UI**: Instant feedback for actions
5. **Error Handling**: Graceful error messages
6. **Security**: Row Level Security (RLS) on all tables
7. **Performance**: Turbopack, code splitting, lazy loading
8. **SEO**: Next.js metadata, semantic HTML

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# Gemini API Keys (4 keys for round-robin, stored in Supabase secrets)
GEMINI_API_KEY_1=xxx
GEMINI_API_KEY_2=xxx
GEMINI_API_KEY_3=xxx
GEMINI_API_KEY_4=xxx
```

---

## Deployment

### Frontend (Vercel)
1. Connect GitHub repository
2. Set environment variables
3. Deploy from main branch
4. Automatic deployments on push

### Backend (Supabase)
1. Database: Already hosted on Supabase
2. Edge Functions: Deploy with:
   ```bash
   npx supabase functions deploy generateQuiz --no-verify-jwt
   npx supabase functions deploy generateProblems --no-verify-jwt
   npx supabase functions deploy verifyAlgorithm --no-verify-jwt
   npx supabase functions deploy verifyCode --no-verify-jwt
   npx supabase functions deploy enhanceOverview --no-verify-jwt
   ```
3. Set Gemini API keys as Supabase secrets

---

## Admin Login Credentials

**Email**: `admin@levelup-labs.com`  
**Password**: `admin123`

---

**Document Version**: 1.0  
**Last Updated**: February 15, 2026  
**Project**: Levelup-Labs - AI-Powered Gamified Learning Platform
