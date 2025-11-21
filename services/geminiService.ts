import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Google GenAI client
// Direct access to process.env.API_KEY is replaced by Vite at build time
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// 1. Generate Caption AND Image Prompt from Text
export const generateFBCaption = async (text: string, tone: string) => {
  try {
    const modelId = 'gemini-2.5-flash';
    
    const promptText = `
      Role: Professional Facebook Content Summarizer & SEO Specialist (Thai Language).
      Tone: "${tone}"
      Input Text: "${text}"

      Task 1: Summarize the Input Text into a Thai Facebook Status.
      - LANGUAGE: THAI ONLY for the status.
      - FORMAT: Use paragraphs. No bullet points with symbols. Line breaks only.
      - STYLE: Engaging, professional.
      - HASHTAGS: Generate 5-10 trending SEO hashtags. MANDATORY: The LAST hashtag MUST be #การะเกต์พยากรณ์.

      Task 2: Create a creative Image Prompt (in English) based on the content.
      - The prompt will be used by an AI image generator.
      - Describe a scene, objects, or abstract concept that matches the content's mood.
      - Keep it visual and descriptive.
      - IMPORTANT: Focus on high aesthetic quality.

      Output JSON format:
      {
        "caption": "Thai content...",
        "imagePrompt": "English image description..."
      }
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts: [{ text: promptText }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            caption: { type: Type.STRING, description: "Thai caption with hashtags" },
            imagePrompt: { type: Type.STRING, description: "English image generation prompt" }
          },
          required: ["caption", "imagePrompt"],
        },
      },
    });

    const responseText = response.text || "{}";
    let result;
    
    try {
      // Clean up potential markdown formatting before parsing
      const cleanText = responseText.replace(/```json|```/g, "").trim();
      const jsonStart = cleanText.indexOf('{');
      const jsonEnd = cleanText.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
          result = JSON.parse(cleanText.substring(jsonStart, jsonEnd + 1));
      } else {
          result = JSON.parse(cleanText);
      }
    } catch (e) {
      console.error("JSON Parse Error:", e);
      result = { caption: responseText, imagePrompt: null };
    }

    return {
      caption: result.caption || "ไม่สามารถสร้างคำบรรยายได้",
      imagePrompt: result.imagePrompt || null
    };

  } catch (error: any) {
    console.error("Gemini API Error (Caption):", error);
    return {
        caption: `ขออภัย เกิดข้อผิดพลาดในการเชื่อมต่อ AI (${error.message || "Unknown Error"})`,
        imagePrompt: null
    };
  }
};

// 2. Generate Illustration
export const generateIllustration = async (prompt: string, style: string) => {
  try {
    // Enhanced prompt for better aesthetics
    const aestheticBoost = "Masterpiece, 8k resolution, highly detailed, cinematic lighting, professional photography, trending on artstation, sharp focus";
    const fullPrompt = `${prompt}. Art Style: ${style}. ${aestheticBoost}. Visually appealing composition.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: fullPrompt }] },
    });

    // Iterate through parts to find the image
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
           return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    
    return null;

  } catch (error) {
    console.error("Gemini API Error (Image):", error);
    return null;
  }
};