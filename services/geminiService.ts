
import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Google GenAI client
const apiKey = (typeof process !== "undefined" && process.env) ? process.env.API_KEY : "";
const ai = new GoogleGenAI({ apiKey });

// 1. Generate Caption ONLY from Text
export const generateCaptionFromText = async (text: string, tone: string) => {
  try {
    const modelId = 'gemini-2.5-flash';
    
    const promptText = `
      Role: Professional Facebook Content Summarizer & SEO Specialist (Thai Language).
      Tone: "${tone}"
      Input Text: "${text}"

      Task: Summarize the Input Text into a Thai Facebook Status.

      STRICT RULES:
      1. LANGUAGE: THAI ONLY.
      2. CONTENT: Summarize the main points clearly. Make it easy to read on mobile.
      3. FORMAT: Use paragraphs. Do NOT use bullet points with symbols. Use line breaks only.
      4. FORBIDDEN: NO Emojis allowed in the body text.
      5. FORBIDDEN: NO Colons (:) allowed in headers. Write complete sentences.
      6. STYLE: Engaging, professional, and suitable for the selected tone.
      
      HASHTAG RULES (CRITICAL):
      1. Generate 5-10 highly relevant, trending SEO hashtags related to the content topic to boost reach.
      2. MANDATORY: The VERY LAST hashtag MUST be #การะเกต์พยากรณ์ (Do not forget this).
      3. Separate hashtags from the main text with a double line break.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts: [{ text: promptText }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            caption: { type: Type.STRING, description: "Thai caption, summarized with SEO hashtags and #การะเกต์พยากรณ์ at the end" },
          },
          required: ["caption"],
        },
      },
    });

    const responseText = response.text || "{}";
    let result;
    try {
        result = JSON.parse(responseText);
    } catch (e) {
        const cleanText = responseText.replace(/```json|```/g, "").trim();
        result = JSON.parse(cleanText);
    }

    return {
      caption: result.caption || "ไม่สามารถสร้างคำบรรยายได้",
    };

  } catch (error: any) {
    console.error("Gemini API Error (Caption):", error);
    return {
        caption: "ขออภัย เกิดข้อผิดพลาดในการเชื่อมต่อ AI",
    };
  }
};
