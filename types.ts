
export interface PostData {
  id: string;
  originalContent: string;
  generatedCaption: string;
  uploadedImageBase64?: string | null;
  finalImageBase64: string | null; // Image with Logo & Text
  status: 'draft' | 'scheduled' | 'published';
  scheduledDate: string;
  timestamp: number;
}

export interface GenerateContentResult {
  caption: string;
}

export enum ContentTone {
  PROFESSIONAL = "มืออาชีพและน่าเชื่อถือ",
  FUN = "สนุกสนานและเป็นกันเอง",
  SALES = "เน้นการขายและโปรโมชั่น",
  EDUCATIONAL = "ให้ความรู้และสาระ"
}

// Removed ImageStyle enum as AI image generation is disabled

export enum AspectRatio {
  SQUARE = "1:1 (จัตุรัส 1080x1080)",
  PORTRAIT = "4:5 (แนวตั้ง 1080x1350)",
  PORTRAIT_LONG = "2:3 (แนวตั้งยาว 1080x1500)", 
  LANDSCAPE = "16:9 (แนวนอน 1280x720)"
}
