
import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysis } from "../types";

const getAIInstance = () => {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
};

export const analyzeLink = async (url: string): Promise<AIAnalysis> => {
  const ai = getAIInstance();
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze this URL: ${url}. Provide a professional title, a 1-sentence summary, and 3 relevant tags.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          summary: { type: Type.STRING },
          tags: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["title", "summary", "tags"]
      }
    }
  });

  try {
    const text = response.text || '{}';
    return JSON.parse(text) as AIAnalysis;
  } catch (error) {
    console.error("Failed to parse Gemini response", error);
    return {
      title: "New Bookmark",
      summary: "No summary available.",
      tags: ["untagged"]
    };
  }
};
