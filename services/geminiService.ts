import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Google GenAI client
// Ensure your API key is set in the environment variables (process.env.API_KEY)
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateFBCaption = async (text: string, tone: string) => {
  try {
    // Explicitly use the latest stable model to avoid 404 errors on deprecated versions
    const modelId = 'gemini-2.5-flash';

    const response = await ai.models.generateContent({
      model: modelId,
      contents: `
        Role: Professional Social Media Content Creator for Facebook.
        Task: Summarize input content into a Facebook post caption and generate an image prompt.
        
        Input Content: "${text}"
        Tone: "${tone}"
        
        CRITICAL INSTRUCTIONS FOR CAPTION:
        1. Language: Thai (ภาษาไทย) ONLY.
        2. STRICTLY NO EMOJIS. DO NOT use any emojis, icons, or graphical characters in the text.
        3. Format: Use clear paragraphs with spacing.
        4. Style: Professional, engaging, and suitable for the requested tone.
        5. Content: Summarize the key points effectively.
        
        INSTRUCTIONS FOR IMAGE PROMPT:
        1. Language: English.
        2. Style: High-end commercial photography, 8k resolution, cinematic lighting.
        3. Description: A visual representation of the content's theme.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            caption: {
              type: Type.STRING,
              description: "The generated Facebook caption in Thai. ABSOLUTELY NO EMOJIS.",
            },
            imagePrompt: {
              type: Type.STRING,
              description: "A detailed English prompt for generating a high-quality image.",
            },
          },
          required: ["caption", "imagePrompt"],
        },
      },
    });

    // Robust parsing for JSON response
    const responseText = response.text || "{}";
    let result;
    try {
        result = JSON.parse(responseText);
    } catch (e) {
        console.warn("JSON Parse Error, attempting cleanup", e);
        // Fallback cleanup if AI adds markdown code blocks despite config
        const cleanText = responseText.replace(/```json|```/g, "").trim();
        result = JSON.parse(cleanText);
    }

    return {
      caption: result.caption || "ไม่สามารถสร้างคำบรรยายได้",
      imagePrompt: result.imagePrompt || "minimalist aesthetic background, soft lighting, 8k",
    };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    let errorMessage = "เกิดข้อผิดพลาดในการเชื่อมต่อ AI";
    
    // Handle specific HTTP errors often seen in web deployments
    if (error.message?.includes("404") || error.toString().includes("not found")) {
        errorMessage = "ไม่พบโมเดล AI (404) - กรุณาตรวจสอบการตั้งค่า API Key หรือ Model Version";
    } else if (error.message?.includes("API_KEY")) {
        errorMessage = "ไม่พบ API Key - กรุณาตรวจสอบการตั้งค่า Environment Variable";
    }

    return {
      caption: `${errorMessage}: ${error.message || ""}`,
      imagePrompt: "error placeholder image",
    };
  }
};

export const generateIllustration = async (prompt: string, style: string) => {
  // Enhance prompt for better aesthetics and reliability
  // Adding a random seed to URL ensures browser doesn't cache failed attempts
  const seed = Math.floor(Math.random() * 1000000);
  const enhancedPrompt = encodeURIComponent(`${prompt}, ${style}, professional photography, soft studio lighting, 8k resolution, highly detailed, masterpiece, trending on artstation`);
  
  // Using Pollinations with Flux model
  // flux is generally more consistent for text-to-image
  return `https://pollinations.ai/p/${enhancedPrompt}?width=1080&height=1080&seed=${seed}&model=flux&nologo=true`;
};

export const generateImageVariation = async (image: string, prompt: string, style: string) => {
  // For variation, we regenerate using the prompt with a new seed
  return generateIllustration(prompt, style);
};