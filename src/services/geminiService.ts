/**
 * src/services/geminiService.ts — AI-generated wisdom and travel planning via OpenRouter.
 * Uses VITE_OPENROUTER_API_KEY, with VITE_GEMINI_API_KEY accepted as a legacy
 * alias only when it contains an OpenRouter key.
 */

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
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

/**
 * Streaming version of generateTravelText — calls onChunk with accumulated
 * text as each token arrives so the UI can render progressively.
 */
export async function streamTravelText(
  prompt: string,
  fallback: string,
  onChunk: (partialText: string) => void
): Promise<string> {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) { onChunk(fallback); return fallback; }

  const systemMessage: ChatMessage = {
    role: 'system',
    content: "You are a practical Jamaica-aware travel planner. Give specific, budget-conscious advice with clear headings, concise bullets, and realistic cost estimates. Do not invent live prices; label all prices as estimates."
  };

  const apiMessages: ChatMessage[] = [systemMessage, { role: 'user', content: prompt }];

  const tryStream = async (model: string): Promise<string> => {
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
        messages: apiMessages,
        temperature: 0.65,
        max_tokens: 1200,
        stream: true
      })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(
        typeof data?.error?.message === 'string'
          ? data.error.message
          : `OpenRouter stream failed with status ${response.status}`
      );
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body for streaming');

    const decoder = new TextDecoder();
    let full = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const payload = trimmed.slice(6);
        if (payload === '[DONE]') continue;
        try {
          const json = JSON.parse(payload);
          const token = json.choices?.[0]?.delta?.content;
          if (token) {
            full += token;
            onChunk(full);
          }
        } catch { /* skip malformed SSE lines */ }
      }
    }

    if (!full) throw new Error('Stream returned no content');
    return full;
  };

  try {
    return await tryStream(PRIMARY_MODEL);
  } catch (primaryError) {
    console.info('OpenRouter primary travel stream failed; trying fallback.', primaryError);
    try {
      return await tryStream(FALLBACK_MODEL);
    } catch (fallbackError) {
      console.info('Travel stream fallback error:', fallbackError);
      onChunk(fallback);
      return fallback;
    }
  }
}

/**
 * Conversational chat for the Likkle Guide assistant.
 * Accepts full message history so the model has context.
 */
export async function chatWithGuide(
  messages: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) return "Mi cyaan chat right now — di API key nuh set up yet. Ask yuh admin fi add it.";

  const systemMessage: ChatMessage = {
    role: 'system',
    content: `You are "Likkle Guide" — the friendly AI assistant inside the Likkle Wisdom app. You speak with light Jamaican Patois flavour but stay clear and helpful. You help users with TWO things:

1. APP GUIDE — You know every feature of Likkle Wisdom:
   - Home: daily wisdom quotes (Jamaican Patois proverbs, Bible affirmations, iconic quotes), mood-based AI wisdom generation, category browsing
   - Discover: search across all wisdom, browse categories, Jamaican history section
   - Bible: full KJV Bible reader with bookmarking, verse search
   - Likkle Book: encrypted private journal with mood tracking
   - Travel: Jamaica travel suite with 4 modules:
     * Maps: 25+ curated Jamaican places with GPS, filters by category, AI destination guide, save places to trip lists
     * Aviation Routes: international flight routes to Kingston/Montego Bay with interactive map, airline links, pull-up detail panels
     * Financial Planner: AI-powered trip budgeting with cost breakdown, savings goal tracker, PDF export
     * Trip Planner: build day-by-day itinerary with stop ordering, connecting route lines on map, AI trip improvement suggestions
   - Profile: wisdom cabinet (bookmarks), user wisdoms, journal stats, public/private toggle
   - Settings: theme toggle (dark/light), account management
   - AI Wisdom: mood-based Jamaican proverb generation
   - PDF Export: structured PDFs with colour-coded sections, tables, proper formatting — named LikkleWisdom_Date_Module.pdf
   - PWA: installable as an app on any device
   - AI-generated content persists when navigating between pages

2. JAMAICA TRAVEL ASSISTANT — You give practical travel advice about Jamaica: destinations, culture, food, safety tips, budget planning, local customs, patois phrases, transportation, best times to visit, hidden gems.

Keep responses concise, warm, and helpful. Use Jamaican expressions naturally but don't overdo it. If asked about something outside your scope, politely redirect.`
  };

  const apiMessages: ChatMessage[] = [
    systemMessage,
    ...messages
  ];

  try {
    return await generateWithFallbackModel(
      apiKey,
      apiMessages,
      { temperature: 0.7, maxTokens: 1024 }
    );
  } catch (error) {
    console.info('Likkle Guide chat error:', error);
    return "Hmm, mi mind fuzzy right now. Try ask again inna likkle bit.";
  }
}

/**
 * Streaming version of chatWithGuide — calls onChunk with each token
 * as it arrives so the UI can render progressively.
 * Returns the full concatenated response when done.
 */
export async function streamChatWithGuide(
  messages: { role: 'user' | 'assistant'; content: string }[],
  onChunk: (partialText: string) => void
): Promise<string> {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) {
    const fallback = "Mi cyaan chat right now — di API key nuh set up yet. Ask yuh admin fi add it.";
    onChunk(fallback);
    return fallback;
  }

  const systemMessage: ChatMessage = {
    role: 'system',
    content: `You are "Likkle Guide" — the friendly AI assistant inside the Likkle Wisdom app. You speak with light Jamaican Patois flavour but stay clear and helpful. You help users with TWO things:

1. APP GUIDE — You know every feature of Likkle Wisdom:
   - Home: daily wisdom quotes (Jamaican Patois proverbs, Bible affirmations, iconic quotes), mood-based AI wisdom generation, category browsing
   - Discover: search across all wisdom, browse categories, Jamaican history section
   - Bible: full KJV Bible reader with bookmarking, verse search
   - Likkle Book: encrypted private journal with mood tracking
   - Travel: Jamaica travel suite with 4 modules:
     * Maps: 25+ curated Jamaican places with GPS, filters by category, AI destination guide, save places to trip lists
     * Aviation Routes: international flight routes to/from Kingston/Montego Bay with interactive map, airline links, pull-up detail panels
     * Financial Planner: AI-powered trip budgeting with cost breakdown, savings goal tracker, PDF export
     * Trip Planner: build day-by-day itinerary with stop ordering, connecting route lines on map, AI trip improvement suggestions
   - Profile: wisdom cabinet (bookmarks), user wisdoms, journal stats, public/private toggle
   - Settings: theme toggle (dark/light), account management
   - AI Wisdom: mood-based Jamaican proverb generation
   - PDF Export: structured PDFs with colour-coded sections, tables, proper formatting
   - PWA: installable as an app on any device

2. JAMAICA TRAVEL ASSISTANT — You give practical travel advice about Jamaica: destinations, culture, food, safety tips, budget planning, local customs, patois phrases, transportation, best times to visit, hidden gems.

Keep responses concise, warm, and helpful. Use Jamaican expressions naturally but don't overdo it. If asked about something outside your scope, politely redirect.`
  };

  const apiMessages: ChatMessage[] = [systemMessage, ...messages];

  const tryStream = async (model: string): Promise<string> => {
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
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 1024,
        stream: true
      })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(
        typeof data?.error?.message === 'string'
          ? data.error.message
          : `OpenRouter stream failed with status ${response.status}`
      );
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body for streaming');

    const decoder = new TextDecoder();
    let full = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const payload = trimmed.slice(6);
        if (payload === '[DONE]') continue;
        try {
          const json = JSON.parse(payload);
          const token = json.choices?.[0]?.delta?.content;
          if (token) {
            full += token;
            onChunk(full);
          }
        } catch { /* skip malformed SSE lines */ }
      }
    }

    if (!full) throw new Error('Stream returned no content');
    return full;
  };

  try {
    return await tryStream(PRIMARY_MODEL);
  } catch (primaryError) {
    console.info('OpenRouter primary stream failed; trying fallback.', primaryError);
    try {
      return await tryStream(FALLBACK_MODEL);
    } catch (fallbackError) {
      console.info('Likkle Guide stream fallback error:', fallbackError);
      const errMsg = "Hmm, mi mind fuzzy right now. Try ask again inna likkle bit.";
      onChunk(errMsg);
      return errMsg;
    }
  }
}

// ————— Safety Chat —————

const SAFETY_SYSTEM_PROMPT = `You are a Jamaica Tourist Safety Advisor within the Likkle Wisdom app.
Your role is to keep tourists safe in Jamaica. You provide:

1. DO'S AND DON'TS — cultural etiquette, behaviour tips, scam awareness
2. AREA-SPECIFIC SAFETY — when the user mentions a location, give specific safety info for that area
3. TIME-BASED ADVICE — when to be indoors, when to avoid certain areas, safe hours
4. BELONGING PROTECTION — safeguarding valuables, what not to wear/carry
5. VIGILANCE TIPS — situational awareness, transportation safety, nightlife safety
6. EMERGENCY PROCEDURES — what to do if robbed, injured, or in danger

Rules:
- Be factual and balanced. Jamaica is a beautiful country. Don't fearmonger, but be honest about risks.
- When the user tells you where they're staying, give specific neighbourhood tips.
- Format responses with clear sections using markdown headers and bullet points.
- Include relevant emergency numbers when appropriate (119 Police, 110 Fire/Ambulance).
- Speak in a warm, friendly tone — mix in light Patois where natural.
- If the user asks about a specific area, include: safety level, best times to visit, what to watch out for, nearest emergency services.`;

export async function streamSafetyChat(
  messages: { role: 'user' | 'assistant'; content: string }[],
  onChunk: (partialText: string) => void,
  userLocation?: { lat: number; lng: number; placeName?: string }
): Promise<string> {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) {
    const fallback = "Mi cyaan chat right now — di API key nuh set up yet.";
    onChunk(fallback);
    return fallback;
  }

  let systemContent = SAFETY_SYSTEM_PROMPT;
  if (userLocation) {
    systemContent += `\n\nThe user's current location is approximately: ${userLocation.placeName || `${userLocation.lat}, ${userLocation.lng}`}. Factor this into your safety advice.`;
  }

  const apiMessages: ChatMessage[] = [
    { role: 'system', content: systemContent },
    ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
  ];

  const tryStream = async (model: string): Promise<string> => {
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
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 1200,
        stream: true
      })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(
        typeof data?.error?.message === 'string'
          ? data.error.message
          : `OpenRouter stream failed with status ${response.status}`
      );
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body for streaming');

    const decoder = new TextDecoder();
    let full = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const payload = trimmed.slice(6);
        if (payload === '[DONE]') continue;
        try {
          const json = JSON.parse(payload);
          const token = json.choices?.[0]?.delta?.content;
          if (token) {
            full += token;
            onChunk(full);
          }
        } catch { /* skip malformed SSE lines */ }
      }
    }

    if (!full) throw new Error('Stream returned no content');
    return full;
  };

  try {
    return await tryStream(PRIMARY_MODEL);
  } catch (primaryError) {
    console.info('OpenRouter primary safety stream failed; trying fallback.', primaryError);
    try {
      return await tryStream(FALLBACK_MODEL);
    } catch (fallbackError) {
      console.info('Safety stream fallback error:', fallbackError);
      const errMsg = "Hmm, mi mind fuzzy right now. Try ask again inna likkle bit.";
      onChunk(errMsg);
      return errMsg;
    }
  }
}

// ————— Mandatory Security Suffix —————

export const MANDATORY_SECURITY_SUFFIX = `

IMPORTANT — SECURITY SECTION (MANDATORY):
At the end of your response, you MUST include a section titled "## 🛡️ Security Tips" containing:
1. Location-specific safety advice for the areas mentioned in the response
2. General tips: safeguarding belongings, safe transportation, scam awareness
3. Time-based warnings: safe hours, when to be indoors, areas to avoid at night
4. Emergency numbers: 119 (Police), 110 (Fire/Ambulance)
5. Nearest hospitals or police stations relevant to the mentioned locations
This section is NOT optional — it must appear in every response.
`;

export { KEY_MISSING_RESPONSE };
