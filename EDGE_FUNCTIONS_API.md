# 🔌 Edge Functions API Reference

Quick reference for all Supabase Edge Functions in Levelup-Labs.

---

## 📋 Table of Contents

1. [generateQuiz](#1-generatequiz)
2. [generateProblems](#2-generateproblems)
3. [verifyAlgorithm](#3-verifyalgorithm)
4. [verifyCode](#4-verifycode)
5. [updatePoints](#5-updatepoints)

---

## 1. generateQuiz

**Purpose**: Generate AI-powered MCQ quiz questions for a topic

**Endpoint**: `POST /functions/v1/generateQuiz`

**Authentication**: Required (Bearer token)

### Request Body

```typescript
{
  topicId: string       // UUID of the topic
  topicName: string     // Name of the topic (e.g., "JavaScript Arrays")
  numQuestions: number  // Number of questions to generate (1-20)
}
```

### Response

```typescript
{
  questions: [
    {
      id: string            // Question ID (e.g., "q1", "q2")
      question: string      // The question text
      options: string[]     // Array of 4 options
      correctAnswer: number // Index of correct option (0-3)
    }
  ]
}
```

### Example Call (Frontend)

```typescript
import { createClient } from './lib/supabase'

const supabase = createClient()

const { data, error } = await supabase.functions.invoke('generateQuiz', {
  body: {
    topicId: '123e4567-e89b-12d3-a456-426614174000',
    topicName: 'React Hooks',
    numQuestions: 5
  }
})

if (error) {
  console.error('Error:', error)
} else {
  console.log('Quiz questions:', data.questions)
}
```

---

## 2. generateProblems

**Purpose**: Generate LeetCode-style coding problems for a topic

**Endpoint**: `POST /functions/v1/generateProblems`

**Authentication**: Required (Bearer token)

### Request Body

```typescript
{
  topicId: string      // UUID of the topic
  topicName: string    // Name of the topic
  numProblems: number  // Number of problems to generate (1-10)
}
```

### Response

```typescript
{
  problems: [
    {
      id: string                  // Problem UUID (auto-generated)
      topic_id: string            // Topic UUID
      title: string               // Problem title
      description: string         // Full problem description
      difficulty: 'easy' | 'medium' | 'hard'
      examples: [
        {
          input: string
          output: string
          explanation: string
        }
      ]
      test_cases: [
        {
          input: string
          expectedOutput: string
        }
      ]
      created_at: string          // ISO timestamp
    }
  ]
}
```

### Example Call

```typescript
const { data, error } = await supabase.functions.invoke('generateProblems', {
  body: {
    topicId: '123e4567-e89b-12d3-a456-426614174000',
    topicName: 'Binary Search Trees',
    numProblems: 3
  }
})

if (!error) {
  console.log('Generated problems:', data.problems)
}
```

**Note**: Problems are automatically saved to `coding_problems` table.

---

## 3. verifyAlgorithm

**Purpose**: Validate user's algorithm explanation using AI

**Endpoint**: `POST /functions/v1/verifyAlgorithm`

**Authentication**: Required (Bearer token)

### Request Body

```typescript
{
  problemId: string              // UUID of the problem
  algorithmExplanation: string   // User's algorithm explanation
}
```

### Response

```typescript
{
  isCorrect: boolean              // Whether algorithm is correct
  feedback: string                // Detailed AI feedback
  suggestions: string             // Improvement suggestions
}
```

### Example Call

```typescript
const { data, error } = await supabase.functions.invoke('verifyAlgorithm', {
  body: {
    problemId: '456e7890-e89b-12d3-a456-426614174000',
    algorithmExplanation: `
      1. Use two pointers approach
      2. Start from both ends of array
      3. Move pointers inward based on comparison
      4. Time complexity: O(n)
      5. Space complexity: O(1)
    `
  }
})

if (!error && data.isCorrect) {
  console.log('Algorithm approved!')
  console.log('Feedback:', data.feedback)
}
```

**Side Effects**:
- Updates `problem_solutions` table with status
- Sets `algorithm_verified_at` timestamp

---

## 4. verifyCode

**Purpose**: Validate user's code solution against test cases

**Endpoint**: `POST /functions/v1/verifyCode`

**Authentication**: Required (Bearer token)

### Request Body

```typescript
{
  problemId: string    // UUID of the problem
  code: string         // User's code solution
  language: string     // Programming language (e.g., 'javascript', 'python')
}
```

### Response

```typescript
{
  allTestsPassed: boolean          // Whether all tests passed
  testResults: [
    {
      testCase: number               // Test case number (1, 2, 3...)
      passed: boolean                // Test passed or failed
      expectedOutput: string         // Expected output
      actualOutput: string           // Actual output from code
      error?: string                 // Error message if failed
    }
  ]
  feedback: string                   // Overall AI feedback
  pointsAwarded: number              // Points awarded (0 if failed)
}
```

### Example Call

```typescript
const { data, error } = await supabase.functions.invoke('verifyCode', {
  body: {
    problemId: '456e7890-e89b-12d3-a456-426614174000',
    code: `
      function twoSum(nums, target) {
        const map = new Map();
        for (let i = 0; i < nums.length; i++) {
          const complement = target - nums[i];
          if (map.has(complement)) {
            return [map.get(complement), i];
          }
          map.set(nums[i], i);
        }
        return [];
      }
    `,
    language: 'javascript'
  }
})

if (!error && data.allTestsPassed) {
  console.log('All tests passed!')
  console.log('Points earned:', data.pointsAwarded)
}
```

**Side Effects**:
- Updates `problem_solutions` table with code and status
- Awards points to user (Easy: 100, Medium: 200, Hard: 300)
- Updates leaderboard automatically
- Increments `problems_solved` count

---

## 5. updatePoints

**Purpose**: Award points for course completion

**Endpoint**: `POST /functions/v1/updatePoints`

**Authentication**: Required (Bearer token)

### Request Body

```typescript
{
  action: 'complete_course'    // Action type
  courseId: string             // UUID of the course
}
```

### Response

```typescript
{
  message: string              // Success message
  pointsAwarded: number        // Points awarded for course completion
}
```

### Example Call

```typescript
const { data, error } = await supabase.functions.invoke('updatePoints', {
  body: {
    action: 'complete_course',
    courseId: '789e0123-e89b-12d3-a456-426614174000'
  }
})

if (!error) {
  console.log(data.message)
  console.log('Points earned:', data.pointsAwarded)
}
```

**Side Effects**:
- Marks course as completed in `user_courses`
- Awards course completion points
- Updates leaderboard automatically
- Increments `courses_completed` count

**Validation**:
- Checks if user completed all topics (quizzes + problems)
- Prevents duplicate completion rewards
- Only awards if all requirements met

---

## 🔐 Authentication

All Edge Functions require authentication. Include the user's session token:

```typescript
// Automatic with Supabase client
const supabase = createClient()
const { data, error } = await supabase.functions.invoke('functionName', {
  body: { /* ... */ }
})

// Manual with fetch
const token = 'user-session-token'
const response = await fetch('https://your-project.supabase.co/functions/v1/functionName', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ /* ... */ })
})
```

---

## ⚡ Rate Limiting

- **Gemini API**: 4 keys with round-robin load balancing
- **Automatic retry**: If one key hits rate limit, tries next key
- **Max retries**: 4 (one per key)

---

## 🐛 Error Handling

All functions return consistent error format:

```typescript
{
  error: string  // Error message
}
```

**Common Errors**:

| Status | Error | Reason |
|--------|-------|--------|
| 400 | Missing required fields | Request body incomplete |
| 401 | Missing authorization header | No auth token provided |
| 401 | Unauthorized | Invalid or expired token |
| 404 | Problem not found | Invalid problem/topic/course ID |
| 500 | Failed to verify/generate | Gemini API error or server error |

---

## 📊 Points Summary

| Action | Points | Function |
|--------|--------|----------|
| Solve Easy Problem | 100 | verifyCode |
| Solve Medium Problem | 200 | verifyCode |
| Solve Hard Problem | 300 | verifyCode |
| Complete Course | Course-defined (e.g., 500) | updatePoints |
| Pass Quiz | 0 (no points) | N/A |
| Watch Video | 0 (no points) | N/A |

---

## 🧪 Testing

Test functions using Supabase CLI:

```powershell
# Test generateQuiz
supabase functions invoke generateQuiz --data '{
  "topicId": "test-id",
  "topicName": "Test Topic",
  "numQuestions": 3
}'

# Test with auth token
supabase functions invoke verifyAlgorithm \
  --data '{"problemId":"test","algorithmExplanation":"test"}' \
  --header "Authorization: Bearer YOUR_TOKEN"
```

---

## 📝 Environment Variables (Secrets)

Required secrets for Edge Functions:

```bash
GEMINI_API_KEY_1=your-key-1
GEMINI_API_KEY_2=your-key-2
GEMINI_API_KEY_3=your-key-3
GEMINI_API_KEY_4=your-key-4
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

Set via CLI:
```powershell
supabase secrets set GEMINI_API_KEY_1=your-key
```

---

**Last Updated**: Based on PRD requirements
**Version**: 1.0.0
