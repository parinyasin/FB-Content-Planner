import { GoogleGenerativeAI } from "@google/generative-ai";

// 🔑 กุญแจ (ฝังตรงๆ)
const API_KEY = "AIzaSyDgBINcYmdNcz9B1Cugv_0RAF7D0dp9Akc";

const genAI = new GoogleGenerativeAI(API_KEY);

export const generateFBCaption = async (text: string, tone: string) => {
  try {
    // ใช้โมเดล Flash (เร็วและถูก)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `เขียนแคปชั่น Facebook สั้นๆ เกี่ยวกับ: ${text} (โทน: ${tone})`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const resultText = response.text();

    return { 
        caption: resultText, 
        imagePrompt: "mystical tarot card, glowing, 8k" 
    };

  } catch (error: any) {
    console.error("Full Error:", error);
    // ⚠️ ให้มันโชว์ Error ออกมาทางหน้าจอเลย เราจะได้รู้สาเหตุ
    return { 
      caption: `Error Detail: ${error.message || error.toString()}`, 
      imagePrompt: "" 
    };
  }
};

export const generateIllustration = async (prompt: string, style: string) => {
  const seed = Math.floor(Math.random() * 1000000);
  const finalPrompt = encodeURIComponent(`${prompt}, ${style}`);
  return `https://pollinations.ai/p/${finalPrompt}?width=1080&height=1080&seed=${seed}&model=flux`;
};

export const generateImageVariation = async (image: string) => {
  return image;
};