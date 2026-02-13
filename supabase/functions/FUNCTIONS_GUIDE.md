# 🔧 Supabase Edge Functions Guide

This directory contains Edge Function templates for CodeQuest AI. Edge Functions are serverless functions that run on Supabase's edge network.

---

## 📋 Functions Overview

### 1. **generateQuiz**
Generates AI-powered multiple choice questions for a topic.

**Trigger:** User clicks "Start Quiz" on a topic
**Input:**
- `topicId`: UUID of the topic
- `numQuestions`: Number of MCQs to generate
- `topicName`: Name of the topic

**Output:**
```json
{
  "questions": [
    {
      "id": "q1",
      "question": "What is a variable?",
      "options": ["...", "...", "...", "..."],
      "correctAnswer": 0
    }
  ]
}
```

**Implementation Notes:**
- Uses Gemini API to generate questions
- Caches results in database for same topic
- Questions vary slightly each attempt

---

### 2. **generateProblems**
Generates LeetCode-style coding problems based on topic.

**Trigger:** User passes quiz and unlocks problems section
**Input:**
- `topicId`: UUID of the topic
- `numProblems`: Number of problems to generate
- `topicName`: Name of the topic
- `difficulty`: 'easy' | 'medium' | 'hard'

**Output:**
```json
{
  "problems": [
    {
      "title": "Two Sum",
      "description": "Given an array of integers...",
      "difficulty": "easy",
      "examples": [
        {
          "input": "[2,7,11,15], target = 9",
          "output": "[0,1]"
        }
      ],
      "testCases": [...]
    }
  ]
}
```

**Implementation Notes:**
- Generates 3-5 test cases per problem
- Problems cached in database
- Difficulty levels: easy (100pts), medium (200pts), hard (300pts)

---

### 3. **verifyAlgorithm**
Validates the algorithm explanation before code submission.

**Trigger:** User submits algorithm explanation
**Input:**
- `problemId`: UUID of the problem
- `algorithmExplanation`: User's written explanation
- `problemDescription`: The problem statement

**Output:**
```json
{
  "verified": true,
  "feedback": "Good approach! Consider edge cases...",
  "suggestions": [...]
}
```

**Implementation Notes:**
- Uses Gemini to evaluate logical soundness
- Provides constructive feedback
- Allows retry if not verified
- No points awarded yet

---

### 4. **verifyCode**
Validates user's code against test cases.

**Trigger:** User submits code solution
**Input:**
- `problemId`: UUID of the problem
- `code`: User's code solution
- `testCases`: Array of test cases
- `language`: Programming language

**Output:**
```json
{
  "passed": true,
  "passedTests": 5,
  "totalTests": 5,
  "output": [...]
}
```

**Implementation Notes:**
- Uses Gemini API to validate code logic
- Checks against all test cases
- If all pass: mark problem as solved, award points
- If fails: provide feedback and allow retry

---

### 5. **updateUserPoints**
Updates user points and leaderboard ranking.

**Trigger:** Problem solved or course completed
**Input:**
- `userId`: UUID of user
- `pointsAwarded`: Number of points
- `reason`: 'problem_solved' | 'course_completed'
- `problemId`: Optional, if problem solved
- `courseId`: Optional, if course completed

**Output:**
```json
{
  "newTotal": 1500,
  "rank": 5,
  "leveledUp": true
}
```

**Implementation Notes:**
- Must be called server-side only
- Updates leaderboard immediately
- Prevents client-side score manipulation
- Triggers celebration animation on client

---

## 🛠️ Setup Instructions

### Step 1: Install Supabase CLI

```bash
npm install -g supabase
```

### Step 2: Initialize Functions (if not done)

```bash
supabase functions new generateQuiz
supabase functions new generateProblems
supabase functions new verifyAlgorithm
supabase functions new verifyCode
supabase functions new updateUserPoints
```

### Step 3: Deploy to Supabase

```bash
supabase functions deploy generateQuiz
supabase functions deploy generateProblems
supabase functions deploy verifyAlgorithm
supabase functions deploy verifyCode
supabase functions deploy updateUserPoints
```

### Step 4: Set Environment Variables

```bash
supabase secrets set GEMINI_API_KEY="your-key-here"
```

---

## 📝 Function Templates

### Template: generateQuiz

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

Deno.serve(async (req) => {
  const { topicId, numQuestions, topicName } = await req.json();

  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Generate ${numQuestions} multiple choice questions for the topic: ${topicName}. 
        
Format as JSON array with structure:
[
  {
    "id": "q1",
    "question": "...",
    "options": ["...", "...", "...", "..."],
    "correctAnswer": 0
  }
]`,
      },
    ],
  });

  // Parse and save to database
  const questions = JSON.parse(message.content[0].type === "text" ? message.content[0].text : "");

  return new Response(JSON.stringify({ questions }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

### Template: verifyCode

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

Deno.serve(async (req) => {
  const { code, testCases, problemDescription } = await req.json();

  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Verify if this code solves the problem correctly:

Problem: ${problemDescription}

Code:
${code}

Test Cases:
${JSON.stringify(testCases)}

Respond with JSON:
{
  "passed": boolean,
  "feedback": "...",
  "failedTests": []
}`,
      },
    ],
  });

  return new Response(message.content[0].type === "text" ? message.content[0].text : "{}", {
    headers: { "Content-Type": "application/json" },
  });
});
```

---

## 🔐 Security Considerations

1. **API Keys**: Never expose Gemini key on client. Always call from Edge Functions.
2. **RLS Policies**: Ensure functions check user permissions before updating data.
3. **Rate Limiting**: Consider adding rate limits to prevent abuse.
4. **Validation**: Validate all inputs before processing.

---

## 📞 Troubleshooting

### Function times out
- Check Gemini API response time
- Consider caching results

### "Unauthorized" errors
- Verify `GEMINI_API_KEY` is set in Secrets
- Check RLS policies allow function writes

### Function not deploying
```bash
supabase functions deploy --no-verify-jwt
```

---

## 📚 Resources

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Gemini API Docs](https://ai.google.dev/)
- [Deno Docs](https://deno.land/manual)
