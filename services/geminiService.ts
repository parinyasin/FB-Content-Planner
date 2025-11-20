
import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { ContentTone, ImageStyle } from "../types";

// Safely retrieve API Key
const getApiKey = (): string => {
  try {
    return (typeof process !== 'undefined' && process.env) ? process.env.API_KEY || "" : "";
  } catch {
    return "";
  }
};

/**
 * Summarizes content and writes a Facebook Caption
 */
export const generateFBCaption = async (
  text: string, 
  tone: ContentTone
): Promise<{ caption: string; imagePrompt: string }> => {
  
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key Not Found. Please check your settings.");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    คุณคือผู้เชี่ยวชาญด้านการตลาดบน Facebook (Content Creator) ระดับมืออาชีพ
    หน้าที่: เขียนแคปชั่น Facebook จากข้อมูลที่ได้รับ ให้น่าสนใจและดึงดูด
    
    โทนเสียง: ${tone}

    **กฏสำคัญสำหรับการจัดรูปแบบ (Formatting Rules):**
    1. **ต้องเว้นบรรทัด (Double Line Break) ระหว่างย่อหน้าเสมอ** โดยใช้ \n\n เท่านั้น
    2. ห้ามเขียนเนื้อหาติดกันเป็นพืด
    3. โครงสร้างโพสต์:
       [พาดหัวให้น่าสนใจ]
       \n\n
       [เนื้อหา ย่อหน้า 1 - สั้นๆ กระชับ]
       \n\n
       [เนื้อหา ย่อหน้า 2 - ถ้ามี]
       \n\n
       [สรุป / Call to Action]
       \n\n
       [Hashtags]
    4. ห้ามใช้ Markdown ตัวหนา (**) หรือตัวเอียง
    5. ห้ามใช้ Emoji เยอะเกินไป ให้เน้นความสะอาดตา
    6. ห้ามใช้เครื่องหมาย : (Colon) ในเนื้อหา ให้เว้นวรรคแทน

    สิ่งที่คุณต้องทำ:
    1. สร้าง Caption ภาษาไทย
    2. สร้าง Prompt ภาษาอังกฤษสำหรับสร้างภาพประกอบ (Image Generation Prompt) ที่:
       - เป็นภาพแนว Abstract, Minimalist หรือ Symbolic ที่สวยงาม
       - สื่อถึงหัวข้อหลักของคอนเทนต์
       - **ไม่เอาภาพคนจริง** (No photorealistic humans) ให้เน้นกราฟิกหรืองานศิลปะ เพื่อความสวยงามและไม่ติดลิขสิทธิ์หน้าคน
       - เน้นองค์ประกอบที่ "Full Frame" (เต็มกรอบ)

    ข้อมูลต้นฉบับ: "${text}"
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      caption: {
        type: Type.STRING,
        description: "Facebook Caption with clear double line breaks (\\n\\n) between every paragraph.",
      },
      imagePrompt: {
        type: Type.STRING,
        description: "English prompt for image generation, focusing on aesthetic composition, object, or scenery. No human faces.",
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

    let jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");
    
    // Clean up any Potential Markdown Code Blocks if Gemini adds them
    jsonText = jsonText.replace(/```json\n?|```/g, "").trim();
    
    const result = JSON.parse(jsonText);

    // Post-Processing to ensure line breaks are real
    if (result.caption) {
        // Ensure we don't have colons
        result.caption = result.caption.replace(/:/g, " ");
        // Double check newlines (optional, but good for safety)
        // result.caption = result.caption.replace(/\\n/g, '\n'); 
    }
    
    return result;
  } catch (error) {
    console.error("Error generating caption:", error);
    throw error;
  }
};

function getStyleModifiers(style: ImageStyle): string {
    const common = "masterpiece, best quality, 8k, ultra-detailed, professional lighting, award-winning composition";
    const noBorders = "full frame, edge to edge, no borders, no white background, filling the entire canvas, no letterbox";

    switch (style) {
        case ImageStyle.CLEAN_LINE:
            return `continuous line art style, sophisticated minimalism, pastel palette, elegant curves. ${common}, ${noBorders}`;
        case ImageStyle.ABSTRACT_MINIMAL:
            return `abstract minimal art, bauhaus style, geometric shapes, balanced composition, rich textures. ${common}, ${noBorders}`;
        case ImageStyle.GEOMETRIC_FLAT:
            return `modern flat vector illustration, vibrant colors, clean shapes, adobe illustrator style, isometric view. ${common}, ${noBorders}`;
        case ImageStyle.SOFT_WATERCOLOR:
            return `soft watercolor painting, wet-on-wet technique, dreamy atmosphere, artistic bleed, paper texture. ${common}, ${noBorders}`;
        case ImageStyle.POP_ART:
            return `modern pop art, bold colors, sharp contrast, halftone patterns, roy lichtenstein style. ${common}, ${noBorders}`;
        default:
            return `artistic illustration, cinematic lighting. ${common}, ${noBorders}`;
    }
}

/**
 * Generates an image using Imagen model
 */
export const generateIllustration = async (prompt: string, style: ImageStyle): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key Not Found");
  
  const ai = new GoogleGenAI({ apiKey });

  try {
    const styleModifiers = getStyleModifiers(style);
    const enhancedPrompt = `Artistic representation of: ${prompt}. ${styleModifiers}. NO text, NO watermark, NO borders, NO white margins. The image must fill the whole frame.`;

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
    if (!base64Image) throw new Error("Failed to generate image bytes");

    return `data:image/png;base64,${base64Image}`;
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};

/**
 * Generates an image variation
 */
export const generateImageVariation = async (
    base64InputImage: string, 
    prompt: string, 
    style: ImageStyle
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key Not Found");
  const ai = new GoogleGenAI({ apiKey });

  try {
    const styleModifiers = getStyleModifiers(style);
    const cleanBase64 = base64InputImage.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: cleanBase64, mimeType: 'image/png' } },
            { text: `Redraw this image in a new style: ${styleModifiers}. Concept: ${prompt}. Make it full frame, no borders.` },
          ],
        },
        config: { responseModalities: [Modality.IMAGE] },
    });

    const newImageBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!newImageBase64) throw new Error("Failed to generate image variation");

    return `data:image/png;base64,${newImageBase64}`;
  } catch (error) {
    console.error("Error generating image variation:", error);
    throw error;
  }
}
