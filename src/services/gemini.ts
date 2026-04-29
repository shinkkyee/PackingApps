import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generatePackingList(destination: string, tripType: string, duration: number, weatherSummary: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is not configured in Secrets.");
  }
  
  const prompt = `Generate a comprehensive packing list for a ${duration}-day ${tripType} trip to ${destination}. 
  The weather forecast is: ${weatherSummary}.
  Return the list as a JSON array of objects, each with 'name' (string) and 'category' (string, e.g., Clothing, Toiletries, Electronics, Documents, Essentials).`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            category: { type: Type.STRING },
          },
          required: ["name", "category"],
        },
      },
    },
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return [];
  }
}
