
import { GoogleGenAI, Modality, Type } from "@google/genai";

// ฟังก์ชันช่วยแกะกล่อง JSON ให้แม่นยำขึ้น (Cleaning logic)
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
    // Init AI client inside function for safety against load-time env issues
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          text: `
            Role: Professional Social Media Content Creator (Thai Language Specialist).
            Task: Summarize and rewrite the provided content into an engaging Facebook Caption in THAI.
            
            Tone: ${tone}
            
            Instructions:
            1. Analyze the input content.
            2. Write a "caption" in Thai. 
               - Make it catchy (Hook). 
               - Summarize the key points.
               - Use short paragraphs with double line breaks (\n\n) for readability. 
               - DO NOT use any emojis. Strictly text only.
               - Include relevant hashtags at the end.
            3. Write an "imagePrompt" in English for generating a high-quality illustration that matches the content.
            
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
            caption: { type: Type.STRING, description: "The generated Facebook caption in Thai language." },
            imagePrompt: { type: Type.STRING, description: "A detailed English prompt for image generation." }
          }
        }
      }
    });

    let rawText = response.text || "";
    
    // พยายาม Parse JSON
    let result;
    try {
      result = JSON.parse(rawText);
    } catch (e) {
      // ถ้า Parse ตรงๆ ไม่ได้ ให้ลอง clean text ก่อน
      try {
         const cleaned = cleanJSON(rawText);
         result = JSON.parse(cleaned);
      } catch (e2) {
         console.error("JSON Parse Error:", e2);
         // Fallback: ถ้าแกะไม่ได้จริงๆ ให้ส่ง text ดิบกลับไปเลย ดีกว่าไม่แสดงอะไร
         return { 
           caption: rawText || "เกิดข้อผิดพลาด: AI ไม่ส่งข้อความตอบกลับ", 
           imagePrompt: "high quality, aesthetic, professional photo, clean composition" 
         };
      }
    }
    
    return {
        caption: result.caption || "ไม่มีข้อความตอบกลับจาก AI",
        imagePrompt: result.imagePrompt || "high quality, aesthetic, professional photo, clean composition"
    };

  } catch (error: any) {
    console.error("Gemini Error:", error);
    let errorMsg = "เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI";
    if (error.message?.includes("API key")) errorMsg = "ไม่พบ API Key หรือ Key ไม่ถูกต้อง";
    return { caption: errorMsg, imagePrompt: "" };
  }
};

// ฟังก์ชันสร้างภาพจริงด้วย Imagen
export const generateIllustration = async (prompt: string, style: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const enhancedPrompt = `${prompt}, style: ${style}, high quality, 8k resolution, professional photography, aesthetic lighting, masterpiece, photorealistic, sharp focus`;
    
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
    // Fallback image from Unsplash
    return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop";
  }
};

// ฟังก์ชันแก้ภาพ (Re-style)
export const generateImageVariation = async (imageBase64: string, prompt: string, style: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // ตัด header data:image/... ออกถ้ามี
    const base64Data = imageBase64.split(',')[1] || imageBase64;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: base64Data, mimeType: 'image/png' } }, 
                { text: `Redraw this image in ${style} style. Maintain the main subject composition but change the artistic style. ${prompt}` }
            ]
        },
        config: {
            responseModalities: [Modality.IMAGE]
        }
    });
    
    // ดึงรูปจาก inlineData
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
        for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
                 return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
    }
    return imageBase64; // คืนค่าเดิมถ้าเจนไม่สำเร็จ
  } catch (error) {
    console.error("Variation Error:", error);
    return imageBase64;
  }
};
