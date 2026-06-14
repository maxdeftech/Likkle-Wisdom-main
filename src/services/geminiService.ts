/**
 * src/services/geminiService.ts — AI-generated wisdom and travel planning via OpenRouter.
 * Uses VITE_OPENROUTER_API_KEY, with VITE_GEMINI_API_KEY accepted as a legacy
 * alias only when it contains an OpenRouter key.
 */

type ChatMessage = {
  role: 'system' | 'user';
  content: string;
};

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

/** Returned when API key is missing so the UI still shows a fallback message. */
const KEY_MISSING_RESPONSE = {
  patois: "Wisdom hidden when di key missin'.",
  english: "True wisdom is hard to find without the right connection."
};

const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
// OpenRouter model IDs must end in ":free"; Gemini is allowed only when the exact Gemini model ID is free.
const PRIMARY_MODEL = 'nvidia/nemotron-3-super-120b-a12b:free';
const FALLBACK_MODEL = 'nvidia/nemotron-3-nano-30b-a3b:free';

const assertFreeOpenRouterModel = (model: string) => {
  if (!model.endsWith(':free')) {
    throw new Error(`Blocked non-free OpenRouter model: ${model}`);
  }
};

const getOpenRouterApiKey = () => {
  const env = (import.meta as any).env ?? {};
  const openRouterKey = (env.VITE_OPENROUTER_API_KEY || '').trim();
  if (openRouterKey) return openRouterKey;

  const legacyViteKey = (env.VITE_GEMINI_API_KEY || '').trim();
  if (legacyViteKey.startsWith('sk-or-')) return legacyViteKey;

  const legacyKey = (env.GEMINI_API_KEY || '').trim();
  if (legacyKey.startsWith('sk-or-')) return legacyKey;

  return '';
};

/** Returns true when an OpenRouter key is configured directly or through the legacy Gemini alias. */
export function isGeminiKeyConfigured(): boolean {
  return !!getOpenRouterApiKey();
}

const requestOpenRouter = async (
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number }
) => {
  assertFreeOpenRouterModel(model);

  const response = await fetch(OPENROUTER_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://www.likklewisdom.com',
      'X-Title': 'Likkle Wisdom'
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options?.temperature ?? 0.75,
      max_tokens: options?.maxTokens ?? 1024
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof data?.error?.message === 'string' ? data.error.message : `OpenRouter request failed with status ${response.status}`;
    throw new Error(message);
  }

  const text = (data as OpenRouterResponse).choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('OpenRouter returned an empty response');
  return text;
};

const generateWithFallbackModel = async (
  apiKey: string,
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number }
) => {
  try {
    return await requestOpenRouter(apiKey, PRIMARY_MODEL, messages, options);
  } catch (primaryError) {
    console.info('OpenRouter primary model failed; retrying fallback model.', primaryError);
    return requestOpenRouter(apiKey, FALLBACK_MODEL, messages, options);
  }
};

const parseJsonObject = (text: string) => {
  const cleaned = text
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  const jsonText = start >= 0 && end >= start ? cleaned.slice(start, end + 1) : cleaned;
  return JSON.parse(jsonText);
};

/**
 * Calls OpenRouter to generate a unique Jamaican Patois proverb/affirmation for the given mood.
 * Returns { patois, english }; on key missing, API error, or parse error returns a fallback object.
 */
export async function generatePatoisWisdom(mood: string): Promise<{ patois: string; english: string }> {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) return KEY_MISSING_RESPONSE;

  try {
    const text = await generateWithFallbackModel(
      apiKey,
      [
        {
          role: 'system',
          content: 'You are a wise Jamaican elder and poet. Respond ONLY with valid JSON in this exact format: {"patois": "...", "english": "..."}. No markdown, no explanation, just the JSON object.'
        },
        {
          role: 'user',
          content: `Generate a unique, creative, and rare Jamaican Patois proverb/affirmation based on the mood: ${mood}. Make it different from common ones. Random seed: ${Math.random()}`
        }
      ],
      { temperature: 0.9, maxTokens: 512 }
    );
    const parsed = parseJsonObject(text);
    if (typeof parsed?.patois === 'string' && typeof parsed?.english === 'string') {
      return { patois: parsed.patois, english: parsed.english };
    }
  } catch (error) {
    console.info('OpenRouter wisdom generation used fallback response.', error);
  }

  return {
    patois: "Nuh wait till di iron hot fi strike; mek it hot by strikin'.",
    english: "Don't wait for the right opportunity; create it for yourself through action."
  };
}

export async function generateTravelText(prompt: string, fallback: string): Promise<string> {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) return fallback;

  try {
    return await generateWithFallbackModel(
      apiKey,
      [
        {
          role: 'system',
          content: "You are a practical Jamaica-aware travel planner. Give specific, budget-conscious advice with clear headings, concise bullets, and realistic cost estimates. Do not invent live prices; label all prices as estimates."
        },
        { role: 'user', content: prompt }
      ],
      { temperature: 0.65, maxTokens: 1200 }
    );
  } catch (error) {
    console.info('OpenRouter travel generation used fallback response.', error);
    return fallback;
  }
}

export { KEY_MISSING_RESPONSE };
