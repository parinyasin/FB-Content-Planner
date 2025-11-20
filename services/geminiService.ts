import { GoogleGenAI, Type, Schema } from "@google/genai";

// ==========================================
// 🔑 ฝังกุญแจที่นี่ (วิธีนี้ชัวร์ที่สุด ไม่ต้องลุ้น)
const API_KEY = "AIzaSyDgBINcYmdNcz9B1Cugv_0RAF7D0dp9Akc";
// ==========================================

// ตั้งค่า Client
const ai = new GoogleGenAI({ apiKey: API_KEY });

// 1. ฟังก์ชันเขียน Caption
export const generateFBCaption = async (text: string, tone: string) => {
  try {
    const prompt = `
      บทบาท: คุณคือ Content Creator มืออาชีพ
      งาน: เขียน Caption Facebook จากข้อความ: "${text}"
      โทนเสียง: ${tone}
      ข้อห้าม: ห้ามใช้ Emoji, ห้ามใช้เครื่องหมาย : (colon), ห้ามใช้ ** (ตัวหนา)
      เพิ่มเติม: ขอ Hashtag #การะเกต์พยากรณ์ และ Image Prompt ภาษาอังกฤษสำหรับเจนรูป
    `;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            caption: { type: Type.STRING },
            imagePrompt: { type: Type.STRING }
          }
        }
      }
    });

    const result = JSON.parse(response.text() || "{}");
    
    // ล้างเครื่องหมาย : ออกถ้ามีหลุดมา
    let cleanCaption = result.caption || "";
    cleanCaption = cleanCaption.replace(/:/g, " ");

    return {
        caption: cleanCaption || "ระบบกำลังประมวลผล...",
        imagePrompt: result.imagePrompt || "abstract art"
    };
  } catch (error) {
    console.error("Caption Error:", error);
    return { caption: "เกิดข้อผิดพลาด กรุณาลองใหม่", imagePrompt: "" };
  }
};

// 2. ฟังก์ชันสร้างรูป (ใช้รูปตัวอย่างไปก่อน เพื่อกันแอพพัง)
export const generateIllustration = async (prompt: string, style: string) => {
  console.log("Generating image for:", prompt);
  return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop";
};

// 3. ฟังก์ชันแก้รูป (คืนค่าเดิม)
export const generateImageVariation = async (image: string, prompt: string, style: string) => {
  return image;
};