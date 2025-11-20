
export interface PostData {
  id: string;
  originalContent: string;
  generatedCaption: string;
  generatedImageBase64: string | null; // Raw AI image
  finalImageBase64: string | null; // Image with Logo
  status: 'draft' | 'scheduled' | 'published';
  scheduledDate: string;
  timestamp: number;
}

export interface GenerateContentResult {
  caption: string;
  imagePrompt: string;
}

export enum ContentTone {
  PROFESSIONAL = "มืออาชีพและน่าเชื่อถือ",
  FUN = "สนุกสนานและเป็นกันเอง",
  SALES = "เน้นการขายและโปรโมชั่น",
  EDUCATIONAL = "ให้ความรู้และสาระ"
}

export enum ImageStyle {
  CLEAN_LINE = "ลายเส้นสะอาดตา (Clean Line Art)",
  ABSTRACT_MINIMAL = "นามธรรมมินิมอล (Abstract Minimal)",
  GEOMETRIC_FLAT = "กราฟิกรูปทรงเรขาคณิต (Geometric Flat)",
  SOFT_WATERCOLOR = "สีน้ำละมุน (Soft Watercolor)",
  POP_ART = "ป๊อปอาร์ต สีสดใส (Vibrant Pop Art)"
}
