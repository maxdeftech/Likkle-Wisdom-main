/**
 * src/services/geminiService.ts — AI-generated Jamaican Patois wisdom via Google Gemini.
 * Uses VITE_GEMINI_API_KEY (or GEMINI_API_KEY) from env; key is baked in at build for web and native.
 */

import { GoogleGenAI, Type } from "@google/genai";

/** Returned when API key is missing so the UI still shows a fallback message. */
const KEY_MISSING_RESPONSE = {
  patois: "Wisdom hidden when di key missin'.",
  english: "True wisdom is hard to find without the right connection."
};

/** Returns true if VITE_GEMINI_API_KEY or GEMINI_API_KEY is set (non-empty after trim). */
export function isGeminiKeyConfigured(): boolean {
  const env = (import.meta as any).env ?? {};
  return !!(env.VITE_GEMINI_API_KEY?.trim?.() || env.GEMINI_API_KEY?.trim?.());
}

/**
 * Calls Gemini to generate a unique Jamaican Patois proverb/affirmation for the given mood.
 * Returns { patois, english }; on key missing or API error returns a fallback object.
 */
export async function generatePatoisWisdom(mood: string) {
  const env = (import.meta as any).env ?? {};
  const apiKey = (env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || "").trim();

  if (!apiKey) {
    console.error(
      "Gemini API key is missing. Add VITE_GEMINI_API_KEY=your_key to .env, then run 'npm run build' again. " +
      "For native (iOS/Android), the key is baked in at build time."
    );
    return KEY_MISSING_RESPONSE;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // gemini-2.0-flash: fast and reliable for short JSON generation
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: 'user',
          parts: [{ text: `Generate a unique, creative, and rare Jamaican Patois proverb/affirmation based on the mood: ${mood}. Make it different from common ones. Random seed: ${Math.random()}` }]
        }
      ],
      config: {
        systemInstruction: "You are a wise Jamaican elder and poet. You know thousands of rare proverbs. Provide authentic, deep Patois and a soulful English translation. Response format MUST be JSON: { \"patois\": \"string\", \"english\": \"string\" }",
        temperature: 0.9,
        topP: 0.95,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            patois: { type: Type.STRING },
            english: { type: Type.STRING }
          },
          required: ["patois", "english"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error('Empty response from AI');

    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating wisdom:", error);
    return {
      patois: "Nuh wait till di iron hot fi strike; mek it hot by strikin'.",
      english: "Don't wait for the right opportunity; create it for yourself through action."
    };
  }
}

export async function generateTravelText(prompt: string, fallback: string) {
  const env = (import.meta as any).env ?? {};
  const apiKey = (env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || "").trim();

  if (!apiKey) {
    console.info("Gemini API key is missing. Travel AI will show a fallback response.");
    return fallback;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      config: {
        systemInstruction: "You are a practical Jamaica-aware travel planner. Give specific, budget-conscious advice with clear headings, concise bullets, and realistic cost estimates. Do not invent live prices; label all prices as estimates.",
        temperature: 0.65,
        topP: 0.9
      }
    });

    return response.text?.trim() || fallback;
  } catch (error) {
    console.info("Travel AI used fallback response:", error);
    return fallback;
  }
}

export { KEY_MISSING_RESPONSE };
