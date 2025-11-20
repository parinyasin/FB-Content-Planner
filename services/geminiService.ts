
import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { ContentTone, ImageStyle } from "../types";

// Initialize Gemini API Client
// NOTE: process.env.API_KEY is guaranteed to be available in this environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Summarizes content and writes a Facebook Caption
 */
export const generateFBCaption = async (
  text: string, 
  tone: ContentTone
): Promise<{ caption: string; imagePrompt: string }> => {
  
  const prompt = `
    คุณคือผู้เชี่ยวชาญด้านการตลาดบน Facebook (Content Creator).
    หน้าที่ของคุณคือ:
    1. อ่านข้อความต้นฉบับที่ให้มา
    2. สรุปใจความสำคัญและเขียนโพสต์ Facebook (Caption) ที่น่าสนใจ ดึงดูดสายตา
    3. ใช้น้ำเสียงแบบ: ${tone}
    4. จัดรูปแบบให้อ่านง่าย มีการเว้นวรรคให้น่าอ่าน
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
        description: "เนื้อหา Caption สำหรับโพสต์ลง Facebook โดยห้ามมี Emoji, ห้ามมีเครื่องหมาย : (colon) และห้ามมีเครื่องหมาย ** หรือ Markdown",
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
    switch (style) {
        case ImageStyle.CLEAN_LINE:
            return "style of continuous line art, colorful pastel background, full frame illustration, edge to edge, no white background, sophisticated, fine art, flat design, full coverage, filling the entire canvas";
        case ImageStyle.ABSTRACT_MINIMAL:
            return "abstract minimal art, soft organic shapes, rich colors, modern art composition, non-representational, bauhaus influence, clean aesthetic, high quality design, full canvas coverage, no borders, colorful background, filling the whole image";
        case ImageStyle.GEOMETRIC_FLAT:
            return "flat vector art, geometric shapes, vibrant but balanced colors, modern graphic design, adobe illustrator style, clean edges, no gradients, symbolism, full frame colorful background, edge to edge, no white borders";
        case ImageStyle.SOFT_WATERCOLOR:
            return "soft watercolor painting, wet on wet technique, full page painting, detailed colored background, pastel palette, dreamy, artistic, loose brushstrokes, minimal details, no white space, edge to edge painting";
        case ImageStyle.POP_ART:
            return "pop art style, vibrant high-saturation colors, flat vector illustration, simplified details, bold graphic composition, vibrant full background, no gradients, clean lines, modern pop art, full frame, no borders";
        default:
            return "minimalist, clean, high quality, artistic, full frame detailed background, edge to edge, no borders";
    }
}

/**
 * Generates an image using Imagen model (Text-to-Image)
 */
export const generateIllustration = async (prompt: string, style: ImageStyle): Promise<string> => {
  try {
    const styleModifiers = getStyleModifiers(style);

    // Combine to force the aesthetic and STRICTLY ban white backgrounds in negative prompt
    const enhancedPrompt = `A conceptual art piece representing: ${prompt}. ${styleModifiers}. Professional artistic composition, masterpiece, 4k resolution, full frame, edge to edge image, filling the entire canvas. Negative prompt: realistic photo, 3d render, plastic, blurry, messy, text, watermark, human faces, white background, empty background, border, frame, isolated on white, white space, split view, grid, cropped, margin, padding.`;

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
 * Uses gemini-2.5-flash-image as recommended for general image editing/generation
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
                    mimeType: 'image/png', // Assuming PNG or widely compatible format
                  },
                },
                {
                  text: `Redraw this image entirely. Keep the main subject and composition but change the artistic style to: ${styleModifiers}. The concept is: ${prompt}. High quality, artistic, clear visualization, full frame, no white background, no borders, edge to edge, filling the canvas.`,
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
