
import { GoogleGenAI, Modality } from "@google/genai";

// ==========================================
// ใช้ API Key จาก Environment Variable ตามมาตรฐานความปลอดภัย
// ==========================================
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// ฟังก์ชันช่วยแกะกล่อง JSON
function cleanJSON(text: string): string {
  return text.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
}

export const generateFBCaption = async (text: string, tone: string) => {
  try {
    const prompt = `
      Task: Write a Facebook Caption for this content.
      Content: "${text}"
      
      Tone: ${tone}
      
      Format Requirements:
      1. Headline: Catchy and engaging, suitable for the target audience.
      2. Body: Well-structured with double line breaks (\n\n) between paragraphs for easy reading on mobile. Keep paragraphs short (2-3 lines).
      3. Conclusion: Strong call to action or summary.
      4. Hashtags: Relevant hashtags at the very end.
      
      Output format: Return ONLY a JSON object with this structure:
      { 
        "caption": "The full caption content with emojis and formatting", 
        "imagePrompt": "A highly detailed, creative description of an image to accompany this post, describing mood, lighting, and subject" 
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    // FIX: ใช้ .text ไม่ใช่ .text()
    let rawText = response.text || "{}";
    
    rawText = cleanJSON(rawText);

    let result;
    try {
        result = JSON.parse(rawText);
    } catch (e) {
        console.error("JSON Parse Error:", e);
        return { caption: rawText, imagePrompt: "minimalist abstract art, clean lines, pastel colors, high quality" };
    }
    
    return {
        caption: result.caption || "ไม่มีข้อความตอบกลับ",
        imagePrompt: result.imagePrompt || "minimalist abstract art, clean lines, pastel colors, high quality"
    };

  } catch (error) {
    console.error("Gemini Error:", error);
    return { caption: "เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI กรุณาลองใหม่อีกครั้ง", imagePrompt: "" };
  }
};

// ฟังก์ชันสร้างภาพจริงด้วย Imagen
export const generateIllustration = async (prompt: string, style: string) => {
  try {
    const enhancedPrompt = `${prompt}, style: ${style}, high quality, 8k resolution, professional photography, aesthetic lighting, masterpiece, photorealistic`;
    
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
    // Fallback กรณีสร้างรูปไม่ได้
    return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop";
  }
};

// ฟังก์ชันแก้ภาพ (Re-style)
export const generateImageVariation = async (imageBase64: string, prompt: string, style: string) => {
  try {
    // ตัด header data:image/... ออกถ้ามี
    const base64Data = imageBase64.split(',')[1] || imageBase64;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: base64Data, mimeType: 'image/png' } }, // หรือ jpeg ตาม input
                { text: `Redraw this image in ${style} style. ${prompt}` }
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
