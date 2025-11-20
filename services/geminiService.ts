
import { GoogleGenAI, Modality, Type } from "@google/genai";

// ฟังก์ชันดึง API Key แบบปลอดภัย ป้องกัน App Crash บน Browser ที่ไม่มี process
const getApiKey = () => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {
    // ปล่อยผ่านกรณีเข้าถึง process ไม่ได้
  }
  return "";
};

// ฟังก์ชันช่วยแกะกล่อง JSON ให้แม่นยำขึ้น
function cleanJSON(text: string): string {
  let cleaned = text.replace(/```json/g, "").replace(/```/g, "");
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

export const generateFBCaption = async (text: string, tone: string) => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
        return { caption: "ไม่พบ API Key กรุณาตรวจสอบการตั้งค่า (Settings -> API Keys)", imagePrompt: "" };
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          text: `
            Role: Professional Social Media Content Creator (Thai Language Specialist) & Art Director.
            Task: Summarize content into an engaging Thai Facebook Caption AND create a highly aesthetic image prompt.
            
            Tone: ${tone}
            
            Instructions:
            1. **Caption (Thai):** 
               - Write a catchy hook.
               - Summarize the key value/story.
               - Use short paragraphs with double line breaks.
               - **STRICTLY NO EMOJIS.** (Do not use emojis).
               - Add 3-5 relevant hashtags.
            
            2. **ImagePrompt (English):**
               - Create a prompt for a high-end, award-winning photograph or illustration.
               - Focus on lighting (e.g., golden hour, cinematic lighting), composition (e.g., rule of thirds), and mood.
               - Ensure the visual metaphor matches the content perfectly.
            
            Input Content:
            "${text}"
          `
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            caption: { type: Type.STRING, description: "The generated Facebook caption in Thai language (NO EMOJIS)." },
            imagePrompt: { type: Type.STRING, description: "A detailed, artistic English prompt for image generation." }
          }
        }
      }
    });

    let rawText = response.text || "";
    
    let result;
    try {
      result = JSON.parse(rawText);
    } catch (e) {
      try {
         const cleaned = cleanJSON(rawText);
         result = JSON.parse(cleaned);
      } catch (e2) {
         console.error("JSON Parse Error:", e2, rawText);
         return { 
           caption: rawText || "เกิดข้อผิดพลาด: AI ไม่ส่งข้อความตอบกลับ", 
           imagePrompt: "minimalist elegant abstract background, soft lighting, high quality 8k" 
         };
      }
    }
    
    return {
        caption: result.caption || "ไม่มีข้อความตอบกลับจาก AI",
        imagePrompt: result.imagePrompt || "minimalist elegant abstract background, soft lighting, high quality 8k"
    };

  } catch (error: any) {
    console.error("Gemini Error:", error);
    let errorMsg = "เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI";
    if (error.message?.includes("API key") || error.message?.includes("403")) {
        errorMsg = "API Key ไม่ถูกต้องหรือถูกจำกัดสิทธิ์";
    }
    return { caption: errorMsg, imagePrompt: "" };
  }
};

export const generateIllustration = async (prompt: string, style: string) => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key not found");

    const ai = new GoogleGenAI({ apiKey });
    
    // ปรับแต่ง Prompt ให้ภาพสวยขึ้นโดยอัตโนมัติ (Aesthetic Booster)
    const aestheticBoost = "award winning, masterpiece, 8k resolution, highly detailed, professional photography, cinematic lighting, sharp focus, trending on artstation";
    const enhancedPrompt = `${prompt}, style: ${style}, ${aestheticBoost}`;
    
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: enhancedPrompt,
      config: {
        numberOfImages: 1,
        aspectRatio: '1:1',
        outputMimeType: 'image/jpeg',
      },
    });

    const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (base64ImageBytes) {
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    }
    throw new Error("No image generated");

  } catch (error) {
    console.error("Image Gen Error:", error);
    // Fallback visual if generation fails
    return "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1000&auto=format&fit=crop";
  }
};

export const generateImageVariation = async (imageBase64: string, prompt: string, style: string) => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key not found");

    const ai = new GoogleGenAI({ apiKey });

    const base64Data = imageBase64.split(',')[1] || imageBase64;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: base64Data, mimeType: 'image/png' } }, 
                { text: `Redraw this image in ${style} style. Make it look more professional and aesthetic. ${prompt}` }
            ]
        },
        config: {
            responseModalities: [Modality.IMAGE]
        }
    });
    
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
        for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
                 return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
    }
    return imageBase64;
  } catch (error) {
    console.error("Variation Error:", error);
    return imageBase64;
  }
};
