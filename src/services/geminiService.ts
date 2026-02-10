
import { GoogleGenAI, Type } from "@google/genai";

export async function generatePatoisWisdom(mood: string) {
  // Use import.meta.env for Vite compatibility
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.error("Gemini API Key is missing. Please set VITE_GEMINI_API_KEY in your .env file.");
    return {
      patois: "Wisdom hidden when di key missin'.",
      english: "True wisdom is hard to find without the right connection."
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Using gemini-2.0-flash for faster and more reliable generation
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

