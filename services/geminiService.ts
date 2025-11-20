import { GoogleGenAI, Type, Schema } from "@google/genai";
// import { ContentTone, ImageStyle } from "../types"; // อย่าลืม import types ของคุณ

// ถ้า types.ts ยังไม่ได้ export ให้ uncomment บรรทัดล่างนี้เพื่อเทส
export enum ContentTone {
  FUN = "สนุกสนาน เป็นกันเอง",
  SERIOUS = "จริงจัง น่าเชื่อถือ",
  MINIMAL = "มินิมอล เรียบง่าย",
  SALES = "เน้นขายของ โปรโมชั่น"
}
export enum ImageStyle {
  CLEAN_LINE = "ลายเส้นคลีนๆ",
  ABSTRACT_MINIMAL = "Abstract Minimal",
  GEOMETRIC_FLAT = "Geometric Flat",
  SOFT_WATERCOLOR = "สีน้ำละมุน",
  POP_ART = "Pop Art"
}

// Initialize Gemini API Client
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY }); // ใช้ import.meta.env สำหรับ Vite

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
    5. **ห้ามใช้ Emoji หรือไอคอนกราฟิกใดๆ ในเนื้อหาโดยเด็ดขาด** ขอเป็นตัวอักษรล้วน
    6. **ห้ามใช้เครื่องหมาย : (colon) ในเนื้อหาโดยเด็ดขาด**
    7. **ห้ามใช้เครื่องหมาย ** (ดอกจัน) หรือ Markdown syntax**
    8. คิด Hashtag ที่เกี่ยวข้อง 5-10 อัน (SEO Friendly)
    9. **ต้องใส่ Hashtag บังคับนี้เสมอ**: #การะเกต์พยากรณ์
    10. สร้าง Prompt ภาษาอังกฤษสำหรับเจนภาพประกอบ เน้นแนวคิด Abstract/Symbolic ไม่เน้นคน

    ข้อความต้นฉบับ:
    "${text}"
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      caption: {
        type: Type.STRING,
        description: "เนื้อหา Caption ภาษาไทย",
      },
      imagePrompt: {
        type: Type.STRING,
        description: "Prompt ภาษาอังกฤษสำหรับสร้างภาพ",
      },
    },
    required: ["caption", "imagePrompt"],
  };

  try {
    // ใช้ gemini-1.5-flash หรือ gemini-2.0-flash-exp สำหรับงาน Text
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp", 
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.7,
      },
    });

    let jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");

    // Clean Markdown formatting if present (ป้องกัน Error JSON parse)
    jsonText = jsonText.replace(/^```json\n/, "").replace(/\n```$/, "");
    
    const result = JSON.parse(jsonText);

    // Strict Post-Processing
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
            return "style of minimal continuous line art, single line drawing, full frame illustration, solid pastel color background, edge to edge, black ink, vector illustration, no shading, flat design";
        case ImageStyle.ABSTRACT_MINIMAL:
            return "abstract minimal art, soft organic shapes, pastel colors, modern art composition, non-representational, bauhaus influence, clean aesthetic, full canvas coverage";
        case ImageStyle.GEOMETRIC_FLAT:
            return "flat vector art, geometric shapes, vibrant balanced colors, modern graphic design, adobe illustrator style, clean edges, no gradients, full frame colorful background";
        case ImageStyle.SOFT_WATERCOLOR:
            return "soft watercolor painting, wet on wet technique, full page painting, detailed colored background, pastel palette, dreamy, artistic, no white space";
        case ImageStyle.POP_ART:
            return "pop art style, vibrant high-saturation colors, flat vector illustration, simplified details, bold graphic composition, vibrant full background";
        default:
            return "minimalist, clean, high quality, artistic, full frame detailed background";
    }
}

/**
 * Generates an image using Imagen model (Text-to-Image)
 */
export const generateIllustration = async (prompt: string, style: ImageStyle): Promise<string> => {
  try {
    const styleModifiers = getStyleModifiers(style);
    const enhancedPrompt = `A conceptual art piece representing: ${prompt}. ${styleModifiers}. Professional artistic composition, masterpiece, 4k resolution, full frame. Negative prompt: realistic photo, 3d render, plastic, blurry, text, watermark, human faces, white background, empty background, border.`;

    // ใช้ imagen-3.0-generate-001 (ล่าสุดที่มีให้ใช้ทั่วไป)
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-001', 
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
 * Generates an image variation (Image-to-Image)
 * Note: Currently requires Gemini 2.0 Flash Experimental for Image Output
 */
export const generateImageVariation = async (
    base64InputImage: string, 
    prompt: string, 
    style: ImageStyle
): Promise<string> => {
    try {
        const styleModifiers = getStyleModifiers(style);
        const cleanBase64 = base64InputImage.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

        // ต้องใช้ gemini-2.0-flash-exp เท่านั้นที่รองรับการ output เป็นรูปภาพ
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp', 
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      data: cleanBase64,
                      mimeType: 'image/png',
                    },
                  },
                  {
                    text: `Redraw this image entirely. Keep the main composition but change style to: ${styleModifiers}. Concept: ${prompt}. High quality, artistic, full frame, no white background.`,
                  },
                ],
              }
            ],
            config: {
                // สำคัญ: ต้องระบุว่าขอ Output เป็น Image
                responseModalities: ["IMAGE"], 
            },
        });

        // การดึงรูปภาพจาก Gemini 2.0 response
        const candidates = response.candidates;
        let newImageBase64 = "";

        if (candidates?.[0]?.content?.parts) {
            for (const part of candidates[0].content.parts) {
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