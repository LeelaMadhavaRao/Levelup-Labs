// DEPRECATED: This client-side Gemini helper is unused.
// All AI calls go through Supabase Edge Functions (generateQuiz, verifyAlgorithm, verifyCode, generateProblems)
// which use server-side GEMINI_API_KEY_* secrets instead.
//
// Gemini API Round-Robin Load Balancer
// Rotates through multiple API keys to distribute load and avoid rate limits

const GEMINI_API_KEYS = [
  process.env.NEXT_PUBLIC_GEMINI_API_KEY_1,
  process.env.NEXT_PUBLIC_GEMINI_API_KEY_2,
  process.env.NEXT_PUBLIC_GEMINI_API_KEY_3,
  process.env.NEXT_PUBLIC_GEMINI_API_KEY_4,
].filter(Boolean) as string[];

let currentKeyIndex = 0;

/**
 * Get the next API key in round-robin fashion
 */
export function getNextGeminiApiKey(): string {
  if (GEMINI_API_KEYS.length === 0) {
    throw new Error('No Gemini API keys configured');
  }
  
  const key = GEMINI_API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEYS.length;
  
  return key;
}

/**
 * Call Gemini API with automatic retry using next key on rate limit
 */
export async function callGeminiAPI(
  prompt: string,
  options: {
    maxRetries?: number;
    temperature?: number;
    maxTokens?: number;
  } = {}
) {
  const { maxRetries = GEMINI_API_KEYS.length, temperature = 0.7, maxTokens = 2048 } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const apiKey = getNextGeminiApiKey();
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature,
              maxOutputTokens: maxTokens,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // If rate limited, try next key
        if (response.status === 429) {
          console.warn(`Rate limit hit on key ${attempt + 1}, trying next key...`);
          continue;
        }
        
        throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response from Gemini API');
      }

      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt + 1} failed:`, error);
      
      // If not last attempt, continue to next key
      if (attempt < maxRetries - 1) {
        continue;
      }
    }
  }
  
  throw lastError || new Error('All Gemini API keys exhausted');
}
