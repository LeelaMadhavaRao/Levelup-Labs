# Edge Functions Setup Guide

## Prerequisites

1. **Supabase CLI** installed: `npm install -g supabase`
2. **Deno** installed: Required for running Edge Functions locally

## Required Edge Functions

Your app uses 4 Edge Functions for AI-powered features:

1. **generateQuiz** - Generates MCQ questions for topics
2. **generateProblems** - Creates coding problems for topics
3. **verifyAlgorithm** - Validates algorithm explanations
4. **verifyCode** - Tests and validates code submissions

## Setup Steps

### 1. Link Your Supabase Project

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

Your project ref: `eejbvmmgkfptyqcedsfz`

### 2. Set Up Gemini API Keys

You need Google Gemini API keys for AI features. Get them from: https://makersuite.google.com/app/apikey

Set as Supabase secrets (for load balancing, you can set 1-4 keys):

```bash
supabase secrets set GEMINI_API_KEY_1=your_key_here
supabase secrets set GEMINI_API_KEY_2=your_key_here  # Optional
supabase secrets set GEMINI_API_KEY_3=your_key_here  # Optional
supabase secrets set GEMINI_API_KEY_4=your_key_here  # Optional
```

### 3. Deploy Edge Functions

Deploy all functions at once:

```bash
cd supabase/functions
supabase functions deploy generateQuiz
supabase functions deploy generateProblems
supabase functions deploy verifyAlgorithm
supabase functions deploy verifyCode
supabase functions deploy updatePoints
```

Or deploy all at once:

```bash
supabase functions deploy
```

### 4. Verify Deployment

Check if functions are deployed:

```bash
supabase functions list
```

Test a function:

```bash
curl -i --location --request POST \
  'https://eejbvmmgkfptyqcedsfz.supabase.co/functions/v1/generateQuiz' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"topicId":"test","topicName":"JavaScript Basics","numQuestions":5}'
```

## Common Issues

### Error: "Edge Function returned a non-2xx status code"

**Cause:** Edge Function not deployed or returning an error

**Solutions:**
1. Check if function is deployed: `supabase functions list`
2. Deploy it: `supabase functions deploy generateQuiz`
3. Check Supabase logs in dashboard for error details

### Error: "No Gemini API keys configured"

**Cause:** API keys not set in Supabase secrets

**Solution:**
```bash
supabase secrets set GEMINI_API_KEY_1=your_actual_key_here
```

### Edge Function Times Out

**Cause:** Gemini API rate limit or network issues

**Solution:**
- Set up multiple API keys for load balancing
- Check Gemini API quotas at https://makersuite.google.com
- Consider upgrading Gemini API tier for higher rate limits

## Testing Locally (Optional)

Run functions locally for development:

```bash
supabase start
supabase functions serve
```

Then update your `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
```

## Environment Variables Checklist

### Supabase Secrets (Server-side)
- [ ] `GEMINI_API_KEY_1` - Primary Gemini API key
- [ ] `GEMINI_API_KEY_2` - (Optional) Secondary key
- [ ] `GEMINI_API_KEY_3` - (Optional) Tertiary key
- [ ] `GEMINI_API_KEY_4` - (Optional) Quaternary key

### .env (Client-side)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key

## Troubleshooting Commands

```bash
# View function logs
supabase functions logs generateQuiz

# List all secrets
supabase secrets list

# Re-deploy a function
supabase functions deploy generateQuiz --no-verify-jwt

# Delete a function
supabase functions delete generateQuiz
```

## Production Deployment

After setting everything up:

1. ✅ All 5 Edge Functions deployed
2. ✅ Gemini API keys configured in Supabase secrets
3. ✅ Test each function via Supabase Dashboard → Edge Functions
4. ✅ Monitor function logs for errors
5. ✅ Set up monitoring/alerting for function failures

## Cost Considerations

- **Supabase Edge Functions**: Free tier includes 500K invocations/month
- **Gemini API**: Free tier includes 60 requests/minute
- For production, consider:
  - Multiple Gemini API keys (load balancing)
  - Caching quiz/problem generation results
  - Rate limiting on frontend
