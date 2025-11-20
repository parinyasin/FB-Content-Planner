import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Google GenAI client
// Ensure your API key is set in the environment variables (process.env.API_KEY)
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateFBCaption = async (text: string, tone: string) => {
  try {
    // Use the recommended model 'gemini-2.5-flash'
    const modelId = 'gemini-2.5-flash';

    const response = await ai.models.generateContent({
      model: modelId,
      contents: `
        Role: Professional Social Media Content Creator.
        Task: Create a Facebook post caption and an image prompt based on the input content.
        
        Input Content: "${text}"
        Tone: "${tone}"
        
        Instructions for Caption:
        1. Language: Thai (ภาษาไทย) ONLY.
        2. Summarize the content effectively.
        3. STRICTLY NO EMOJIS. Do not use any emojis in the caption. (ห้ามใส่อีโมจิ).
        4. Use clear spacing between paragraphs for readability.
        5. Make it engaging and suitable for the chosen tone.
        
        Instructions for Image Prompt:
        1. Language: English.
        2. Create a detailed, high-quality image description suitable for AI image generation.
        3. Style: Photorealistic, 8k resolution, cinematic lighting, aesthetic.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            caption: {
              type: Type.STRING,
              description: "The generated Facebook caption in Thai. NO EMOJIS allowed.",
            },
            imagePrompt: {
              type: Type.STRING,
              description: "A detailed English prompt for generating an image.",
            },
          },
          required: ["caption", "imagePrompt"],
        },
      },
    });

    // Parse the JSON response
    const result = JSON.parse(response.text || "{}");

    return {
      caption: result.caption || "ไม่สามารถสร้างคำบรรยายได้",
      imagePrompt: result.imagePrompt || "abstract artistic background, high quality",
    };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return {
      caption: `เกิดข้อผิดพลาดในการเชื่อมต่อระบบ AI: ${error.message || "กรุณาลองใหม่อีกครั้ง"}`,
      imagePrompt: "",
    };
  }
};

export const generateIllustration = async (prompt: string, style: string) => {
  // Enhance prompt for better aesthetics
  const enhancedPrompt = encodeURIComponent(`${prompt}, ${style}, highly detailed, 8k, professional photography, cinematic lighting, masterpiece`);
  const seed = Math.floor(Math.random() * 1000000);
  // Using Pollinations with Flux model for high quality
  return `https://pollinations.ai/p/${enhancedPrompt}?width=1080&height=1080&seed=${seed}&model=flux`;
};

export const generateImageVariation = async (image: string, prompt: string, style: string) => {
  // For variation, we regenerate using the prompt with a new seed
  return generateIllustration(prompt, style);
};