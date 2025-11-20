
import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { ContentTone, ImageStyle } from "../types";

// Safely retrieve API Key to prevent "process is not defined" errors in browser environments
const getApiKey = (): string => {
  try {
    return (typeof process !== 'undefined' && process.env) ? process.env.API_KEY || "" : "";
  } catch {
    return "";
  }
};

// Initialize Gemini API Client
const ai = new GoogleGenAI({ apiKey: getApiKey() });

/**
 * Summarizes content and writes a Facebook Caption
 */
export const generateFBCaption = async (
  text: string, 
  tone: ContentTone
): Promise<{ caption: string; imagePrompt: string }> => {
  
  const prompt = `
    คุณคือผู้เชี่ยวชาญด้านการตลาดบน Facebook (Content Creator) ระดับมืออาชีพ.
    หน้าที่ของคุณคือ:
    1. อ่านข้อความต้นฉบับที่ให้มา
    2. สรุปใจความสำคัญและเขียนโพสต์ Facebook (Caption) ที่น่าสนใจ ดึงดูดสายตา
    3. ใช้น้ำเสียงแบบ: ${tone}
    4. **การจัดรูปแบบ (สำคัญมากที่สุด)**:
       - **ต้องเว้นบรรทัด (Line Break) ระหว่างย่อหน้าเสมอ** ห้ามเขียนติดกันเป็นพืด
       - โครงสร้างโพสต์ต้องเป็นดังนี้:
         [พาดหัวที่ดึงดูดความสนใจ]
         (เว้นบรรทัด)
         [เนื้อหาย่อหน้าแรก]
         (เว้นบรรทัด)
         [เนื้อหาย่อหน้าถัดไป ถ้ามี]
         (เว้นบรรทัด)
         [สรุป หรือ Call to Action]
         (เว้นบรรทัด)
         [Hashtags]
       - เขียนย่อหน้าสั้นๆ ย่อหน้าละไม่เกิน 2-3 บรรทัด เพื่อให้อ่านง่ายบนมือถือ
    5. **ห้ามใช้ Emoji หรือไอคอนกราฟิกใดๆ ในเนื้อหาโดยเด็ดขาด (เช่น ❌, ✅, 🔥 ฯลฯ ห้ามมี)** ขอเป็นตัวอักษรล้วน
    6. **ห้ามใช้เครื่องหมาย : (colon/ทวิภาค) ในเนื้อหาโดยเด็ดขาด** หากต้องการขยายความให้ใช้การเว้นวรรคหรือขึ้นบรรทัดใหม่แทน
    7. **ห้ามใช้เครื่องหมาย ** (ดอกจัน) เพื่อทำตัวหนา หรือ Markdown syntax ใดๆ ให้ใช้ตัวอักษรธรรมดาเท่านั้น**
    8. คิด Hashtag ที่เกี่ยวข้อง 5-10 อัน โดยเน้นคำที่คนค้นหาเยอะ (SEO Friendly) ช่วยให้ติดอันดับการค้นหาได้ง่าย
    9. **ต้องใส่ Hashtag บังคับนี้เสมอในทุกโพสต์**: #การะเกต์พยากรณ์
    10. สร้าง Prompt ภาษาอังกฤษสำหรับเจนภาพประกอบ เน้นแนวคิดที่เป็น Abstract หรือ Symbolic แทนการใช้รูปคนจริง เพื่อความสวยงามทางศิลปะ

    ข้อความต้นฉบับ:
    "${text}"
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      caption: {
        type: Type.STRING,
        description: "เนื้อหา Caption สำหรับโพสต์ลง Facebook ที่มีการเว้นบรรทัดระหว่างย่อหน้าอย่างชัดเจน (ใช้ \\n\\n)",
      },
      imagePrompt: {
        type: Type.STRING,
        description: "Prompt ภาษาอังกฤษสำหรับสร้างภาพประกอบ เน้นวัตถุหรือสัญลักษณ์ (Subject) ที่สื่อความหมาย ไม่เน้นคน",
      },
    },
    required: ["caption", "imagePrompt"],
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.7,
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");
    
    const result = JSON.parse(jsonText);

    // Strict Post-Processing: Remove colons if they exist
    if (result.caption) {
        result.caption = result.caption.replace(/:/g, " ");
    }
    
    return result;
  } catch (error) {
    console.error("Error generating caption:", error);
    throw error;
  }
};

function getStyleModifiers(style: ImageStyle): string {
    const common = "high resolution, 8k, sharp focus, professional photography lighting, highly detailed, cinematic composition, masterpiece, vibrant colors";
    const noBorders = "full frame, edge to edge, no borders, no margins, no white background, filling the entire canvas";

    switch (style) {
        case ImageStyle.CLEAN_LINE:
            return `style of sophisticated continuous line art, pastel color palette, full frame illustration. ${common}, ${noBorders}`;
        case ImageStyle.ABSTRACT_MINIMAL:
            return `high-end abstract minimal art, organic fluid shapes, rich textured colors, modern art composition, bauhaus influence. ${common}, ${noBorders}`;
        case ImageStyle.GEOMETRIC_FLAT:
            return `premium flat vector art, geometric patterns, vibrant balanced colors, modern graphic design, adobe illustrator style. ${common}, ${noBorders}`;
        case ImageStyle.SOFT_WATERCOLOR:
            return `masterpiece watercolor painting, wet on wet technique, full page painting, rich detailed colored background, dreamy atmosphere. ${common}, ${noBorders}`;
        case ImageStyle.POP_ART:
            return `modern pop art style, vibrant high-saturation colors, bold graphic composition, flat vector illustration, no gradients. ${common}, ${noBorders}`;
        default:
            return `minimalist, artistic, full frame detailed background. ${common}, ${noBorders}`;
    }
}

/**
 * Generates an image using Imagen model (Text-to-Image)
 */
export const generateIllustration = async (prompt: string, style: ImageStyle): Promise<string> => {
  try {
    const styleModifiers = getStyleModifiers(style);

    // Enhanced prompt to strictly enforce full frame and remove white backgrounds
    const enhancedPrompt = `A conceptual masterpiece art piece representing: ${prompt}. ${styleModifiers}. Negative prompt: white background, simple background, plain background, borders, frames, white edges, margin, padding, watermark, text, signature, blurry, low quality, distorted, ugly, split view, letterbox, vignette.`;

    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: enhancedPrompt,
      config: {
        numberOfImages: 1,
        aspectRatio: '3:4',
        outputMimeType: 'image/png'
      }
    });

    const base64Image = response.generatedImages?.[0]?.image?.imageBytes;
    
    if (!base64Image) {
      throw new Error("Failed to generate image bytes");
    }

    return `data:image/png;base64,${base64Image}`;
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};

/**
 * Generates an image variation based on an input image (Image-to-Image)
 */
export const generateImageVariation = async (
    base64InputImage: string, 
    prompt: string, 
    style: ImageStyle
): Promise<string> => {
  try {
    const styleModifiers = getStyleModifiers(style);
    
    // Clean data prefix if present
    const cleanBase64 = base64InputImage.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: 'image/png', 
              },
            },
            {
              text: `Redraw this image entirely. Keep the main subject and composition but change the artistic style to: ${styleModifiers}. The concept is: ${prompt}. High quality, artistic, clear visualization, full frame, edge to edge, filling the canvas, no white background, no borders.`,
            },
          ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    let newImageBase64 = "";
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
        const parts = candidates[0].content.parts;
        for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
                newImageBase64 = part.inlineData.data;
                break;
            }
        }
    }

    if (!newImageBase64) {
        throw new Error("Failed to generate image variation");
    }

    return `data:image/png;base64,${newImageBase64}`;

  } catch (error) {
    console.error("Error generating image variation:", error);
    throw error;
  }
}
