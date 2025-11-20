import { GoogleGenerativeAI } from "@google/generative-ai";

// ฟังก์ชันสร้าง Caption
export const generateFBCaption = async (text: string, tone: string) => {
  try {
    // 🔑 ใส่ Key ตรงนี้เลย (Direct Injection)
    const genAI = new GoogleGenerativeAI("AIzaSyDgBINcYmdNcz9B1Cugv_0RAF7D0dp9Akc");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      เขียนแคปชั่น Facebook จากข้อความ: "${text}"
      โทนเสียง: ${tone}
      ขอสั้นๆ น่าสนใจ Hashtag: #การะเกต์พยากรณ์
      บรรทัดสุดท้ายเขียน "IMAGE_PROMPT: คำบรรยายภาพภาษาอังกฤษ"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const resultText = response.text();

    // แยกส่วนข้อความ
    const parts = resultText.split("IMAGE_PROMPT:");
    return {
      caption: parts[0]?.trim() || resultText,
      imagePrompt: parts[1]?.trim() || "mystical tarot card"
    };

  } catch (error) {
    console.error("AI Error:", error);
    // ถ้ายังพังอีก ให้คืนค่านี้แทน (จะได้รู้ว่าพังที่ AI)
    return { 
      caption: "ระบบ AI กำลังทำงานหนัก กรุณาลองใหม่อีกครั้ง (" + error + ")", 
      imagePrompt: "" 
    };
  }
};

// ฟังก์ชันสร้างรูป (Pollinations AI)
export const generateIllustration = async (prompt: string, style: string) => {
  const seed = Math.floor(Math.random() * 1000000);
  const finalPrompt = encodeURIComponent(`${prompt}, ${style} style, masterpiece, 8k`);
  return `https://pollinations.ai/p/${finalPrompt}?width=1080&height=1080&seed=${seed}&model=flux`;
};

// ฟังก์ชันแก้รูป (คืนค่าเดิม)
export const generateImageVariation = async (image: string) => {
  return image;
};