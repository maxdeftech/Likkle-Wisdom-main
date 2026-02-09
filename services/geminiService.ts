
import { GoogleGenAI, Type } from "@google/genai";

export async function generatePatoisWisdom(mood: string) {
  // Ensure we create a new instance right before calling as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a traditional or modern Jamaican Patois proverb/affirmation based on the mood: ${mood}. Provide it as JSON.`,
      config: {
        systemInstruction: "You are a wise Jamaican elder. Provide authentic Patois and an English translation. Response format: { 'patois': 'string', 'english': 'string' }",
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
