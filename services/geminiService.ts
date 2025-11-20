import { GoogleGenerativeAI } from "@google/generative-ai";

// ============================================================
// 🔑 ฝังกุญแจตรงนี้ (ลบคำสั่ง process ทิ้งไปเลย กันเหนียว)
const API_KEY = "AIzaSyDgBINcYmdNcz9B1Cugv_0RAF7D0dp9Akc";
// ============================================================

const genAI = new GoogleGenerativeAI(API_KEY);

export const generateFBCaption = async (text: string, tone: string) => {
  try {
    // ใช้โมเดล gemini-1.5-flash (มาตรฐาน ทำงานไว)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      บทบาท: คุณคือ Content Creator มืออาชีพ
      งาน: เขียน Caption Facebook จากข้อความ: "${text}"
      โทนเสียง: ${tone}
      
      คำสั่ง:
      1. เขียนเนื้อหาให้น่าอ่าน (3-5 บรรทัด) เว้นวรรคตอนสวยงาม
      2. ห้ามใช้ Emoji เยอะเกินไป
      3. จบด้วย Hashtag #การะเกต์พยากรณ์
      4. บรรทัดสุดท้าย ให้เขียนคำว่า "IMAGE_PROMPT:" ตามด้วยคำบรรยายภาพภาษาอังกฤษ (สำหรับเจนรูป แนว Abstract, Cinematic Lighting, 8K)
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const resultText = response.text();

    // แยกส่วนข้อความ กับ Prompt รูป
    const parts = resultText.split("IMAGE_PROMPT:");
    const caption = parts[0]?.trim() || "กำลังประมวลผลดวงชะตา...";
    const imagePrompt = parts[1]?.trim() || "mystical tarot card, cinematic lighting, 8k resolution, glowing magical atmosphere";

    return { caption, imagePrompt };

  } catch (error) {
    console.error("AI Error:", error);
    return { 
      caption: "เกิดข้อผิดพลาดในการเชื่อมต่อ (กรุณาลองใหม่อีกครั้ง)", 
      imagePrompt: "" 
    };
  }
};

// ฟังก์ชันสร้างรูป (ใช้ Pollinations AI)
export const generateIllustration = async (prompt: string, style: string) => {
  const seed = Math.floor(Math.random() * 1000000);
  // เพิ่มคีย์เวิร์ดเร่งความสวยตามที่ Studio แนะนำ
  const enhancedPrompt = `${prompt}, ${style} style, cinematic lighting, 8k resolution, masterpiece, highly detailed`;
  const finalPrompt = encodeURIComponent(enhancedPrompt);
  
  return `https://pollinations.ai/p/${finalPrompt}?width=1080&height=1080&seed=${seed}&model=flux`;
};

// ฟังก์ชันแก้รูป (คืนค่าเดิม)
export const generateImageVariation = async (image: string) => {
  return image;
};