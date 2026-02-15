# Edge Functions Complete Workflow Guide

## 🎯 Overview

This document explains how AI-powered features work in your LevelUp Labs app, including quiz generation, problem generation, and code verification.

---

## 📋 Architecture

```
Frontend (Next.js) 
    ↓ [Auth Token]
Supabase Client (lib/*.ts)
    ↓ [HTTP Request with Bearer Token]
Edge Functions (Deno Runtime)
    ↓ [API Key Rotation]
Google Gemini AI API
    ↓ [AI Response]
Edge Functions → Frontend
```

---

## 🔐 Authentication Flow

### 1. **User Login**
- User logs in via `lib/auth.ts`
- Supabase creates a session with `access_token`
- Token stored in browser (cookies/localStorage)

### 2. **Session Management**
```typescript
// lib/supabase.ts
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
```

### 3. **Auth Token Passing**
```typescript
// lib/quiz.ts (and similar in lib/problems.ts, lib/courseCompletion.ts)
const { data: { session } } = await supabase.auth.getSession()

const { data, error } = await supabase.functions.invoke('generateQuiz', {
  body: { topicId, topicName, numQuestions },
  headers: {
    Authorization: `Bearer ${session.access_token}`,  // ✅ Explicit auth
  },
})
```

---

## 🎮 Quiz Generation Workflow

### **Frontend → Edge Function → Gemini AI**

#### Step 1: User Clicks "Generate Quiz"

**File:** `app/topic/[id]/quiz/page.tsx`
```typescript
const generateQuizQuestions = async (topicId: string, topicName: string) => {
  setGenerating(true)
  const quizData = await generateQuiz(topicId, topicName, 5)
  
  if (quizData.error) {
    toast.error(quizData.error)
  } else {
    setQuestions(quizData.questions)
  }
  setGenerating(false)
}
```

#### Step 2: Client Library Calls Edge Function

**File:** `lib/quiz.ts`
```typescript
export async function generateQuiz(topicId: string, topicName: string, numQuestions: number) {
  const supabase = createClient()
  
  // ✅ Get session for auth token
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return { questions: null, error: 'You must be logged in' }
  }

  // ✅ Invoke Edge Function with auth header
  const { data, error } = await supabase.functions.invoke('generateQuiz', {
    body: { topicId, topicName, numQuestions },
    headers: { Authorization: `Bearer ${session.access_token}` },
  })

  return { questions: data.questions, error: null }
}
```

#### Step 3: Edge Function Verifies Auth

**File:** `supabase/functions/generateQuiz/index.ts`
```typescript
serve(async (req) => {
  // ✅ Extract auth header
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Missing authorization header' }),
      { status: 401 }
    )
  }

  // ✅ Create authenticated Supabase client
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )

  // ✅ Verify user
  const { data: { user } } = await supabaseClient.auth.getUser()
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401 }
    )
  }

  // User is authenticated! Proceed...
})
```

#### Step 4: Edge Function Calls Gemini AI

```typescript
// ✅ Round-robin API key selection (handles rate limits)
function getNextGeminiApiKey(): string {
  const key = GEMINI_API_KEYS[currentKeyIndex]
  currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEYS.length
  return key
}

// ✅ Call Gemini with retry logic
async function callGeminiAPI(prompt: string): Promise<string> {
  const maxRetries = GEMINI_API_KEYS.length
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const apiKey = getNextGeminiApiKey()
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
            },
          }),
        }
      )

      if (!response.ok) {
        // ✅ Retry with next API key if rate limited
        continue
      }

      const data = await response.json()
      return data.candidates[0].content.parts[0].text
    } catch (error) {
      if (attempt === maxRetries - 1) throw error
    }
  }
}
```

#### Step 5: Gemini Generates Quiz

**Prompt sent to Gemini:**
```
Generate 5 multiple choice questions about "JavaScript Basics" for a coding course.
Return ONLY a valid JSON array with no additional text, in this exact format:
[
  {
    "question": "What is...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0
  }
]
The correctAnswer should be the index (0-3) of the correct option.
Make questions progressively challenging.
```

**Gemini Response:**
```json
[
  {
    "question": "What does 'let' keyword do in JavaScript?",
    "options": [
      "Declares a block-scoped variable",
      "Declares a global variable",
      "Declares a constant",
      "Creates a function"
    ],
    "correctAnswer": 0
  }
]
```

#### Step 6: Edge Function Returns to Frontend

```typescript
// ✅ Parse Gemini response
const jsonMatch = response.match(/\[[\s\S]*\]/)
const questions = JSON.parse(jsonMatch[0])

// ✅ Add IDs
const questionsWithIds = questions.map((q, idx) => ({
  ...q,
  id: `q${idx + 1}`,
}))

// ✅ Return to frontend
return new Response(
  JSON.stringify({ questions: questionsWithIds }),
  { status: 200, headers: { 'Content-Type': 'application/json' } }
)
```

#### Step 7: Frontend Displays Quiz

```typescript
// app/topic/[id]/quiz/page.tsx
setQuestions(quizData.questions)  // ✅ Update state
setSelectedAnswers(new Array(quizData.questions.length).fill(-1))
```

---

## 🔧 Other Edge Functions

### 1. **generateProblems**
**Purpose:** Create coding problems for a topic  
**Flow:** Same as quiz, but generates problem descriptions + test cases  
**File:** `supabase/functions/generateProblems/index.ts`  
**Called by:** `lib/problems.ts` → `generateProblemsForTopic()`

### 2. **verifyAlgorithm**
**Purpose:** Verify student's algorithm explanation  
**Flow:** Sends explanation to Gemini → Gets feedback + correctness score  
**File:** `supabase/functions/verifyAlgorithm/index.ts`  
**Called by:** `lib/problems.ts` → `submitAlgorithmExplanation()`  
**Database:** Updates `problem_submissions` table with result

### 3. **verifyCode**
**Purpose:** Run code tests and verify solution  
**Flow:** Sends code to Gemini → Simulates test execution → Returns pass/fail  
**File:** `supabase/functions/verifyCode/index.ts`  
**Called by:** `lib/problems.ts` → `submitCode()`  
**Database:** Updates `problem_submissions` with test results

### 4. **updatePoints**
**Purpose:** Award points for course completion  
**Flow:** Verifies completion → Updates user points and leaderboard  
**File:** `supabase/functions/updatePoints/index.ts`  
**Called by:** `lib/courseCompletion.ts` → `completeCourse()`  
**Database:** Updates `users.points` and `leaderboard` tables

---

## 🚨 Common Issues & Solutions

### Issue: "Edge Function returned a non-2xx status code"

**Cause:** Multiple possible reasons:
1. ❌ Edge Function not deployed
2. ❌ No auth token passed
3. ❌ Gemini API key not configured
4. ❌ User not logged in

**Solution:**
```bash
# 1. Verify deployment
npx supabase functions list

# 2. Check secrets
npx supabase secrets list

# 3. Verify user is logged in (frontend)
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)  // Should have access_token
```

### Issue: 401 Unauthorized

**Cause:** Auth token not being passed correctly

**Solution:** ✅ Now fixed! All Edge Function calls explicitly pass:
```typescript
headers: { Authorization: `Bearer ${session.access_token}` }
```

### Issue: Rate Limit Exceeded

**Cause:** Single Gemini API key hit rate limit

**Solution:** ✅ Already implemented! Round-robin rotation:
- Set multiple keys: `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, etc.
- Edge Functions automatically rotate through keys
- If one fails, tries next key

---

## 📊 Complete Data Flow Example

### User Takes Quiz → Submits → Gets Score

1. **generateQuiz** (GET quiz questions)
   ```
   Frontend → lib/quiz.ts → Edge Function → Gemini AI
   Returns: [{question, options, correctAnswer}]
   ```

2. **User answers questions** (Frontend state management)
   ```
   selectedAnswers = [0, 2, 1, 3, 0]
   ```

3. **submitQuizResponse** (POST answers)
   ```typescript
   // lib/quiz.ts
   export async function submitQuizResponse(
     userId: string,
     topicId: string,
     score: number,
     totalQuestions: number
   ) {
     const supabase = createClient()
     
     // ✅ Calculate if passed (>= 70%)
     const passed = (score / totalQuestions) >= 0.7
     
     // ✅ Update topic_progress
     await supabase
       .from('topic_progress')
       .upsert({
         user_id: userId,
         topic_id: topicId,
         quiz_passed: passed,
       })
     
     // ✅ Award points if passed
     if (passed) {
       await supabase
         .from('users')
         .update({ points: supabase.raw('points + 10') })
         .eq('id', userId)
     }
     
     return { passed, pointsAwarded: passed ? 10 : 0 }
   }
   ```

---

## 🎓 Key Takeaways

1. **Authentication is Critical**
   - All Edge Functions require valid auth token
   - Token passed via `Authorization: Bearer <token>` header
   - Token obtained from `supabase.auth.getSession()`

2. **Error Handling**
   - Always check `session` before calling Edge Functions
   - Edge Functions return structured errors: `{ error: string }`
   - Frontend displays errors with toast notifications

3. **API Key Management**
   - Multiple Gemini API keys for rate limit handling
   - Round-robin rotation in Edge Functions
   - Keys stored as Supabase secrets (secure)

4. **Database Integration**
   - Edge Functions can query/update database
   - Use authenticated Supabase client in Edge Functions
   - RLS policies enforced (user can only access their data)

---

## 🚀 Deployment Checklist

- [x] Supabase CLI installed (`npx supabase`)
- [x] Project linked (`npx supabase link`)
- [x] Gemini API keys configured (`supabase secrets set`)
- [x] Edge Functions deployed (`supabase functions deploy`)
- [x] Auth headers explicitly passed in all function calls
- [ ] Database migrations run (topic_progress table)

---

## 📝 Files Reference

### Frontend
- `app/topic/[id]/quiz/page.tsx` - Quiz UI
- `app/topic/[id]/problems/page.tsx` - Problems UI
- `lib/quiz.ts` - Quiz logic
- `lib/problems.ts` - Problems logic
- `lib/courseCompletion.ts` - Course completion logic
- `lib/supabase.ts` - Supabase client setup

### Backend (Edge Functions)
- `supabase/functions/generateQuiz/index.ts`
- `supabase/functions/generateProblems/index.ts`
- `supabase/functions/verifyAlgorithm/index.ts`
- `supabase/functions/verifyCode/index.ts`
- `supabase/functions/updatePoints/index.ts`

### Configuration
- `.env.local` - Supabase URL and anon key (frontend)
- Supabase Secrets - Gemini API keys (backend)

---

## 🎉 Success!

Your Edge Functions are now deployed and working! Try:
1. Navigate to a topic quiz page
2. Click "Generate Quiz" 
3. Answer questions
4. Submit and get instant AI-powered feedback!

If you see errors, check the [Common Issues](#-common-issues--solutions) section above.
