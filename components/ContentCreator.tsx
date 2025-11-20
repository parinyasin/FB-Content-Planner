
import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Wand2, Save, FileText, Type, Loader2, AlertCircle, Download, Copy, Check, RefreshCw, Camera, Sparkles } from 'lucide-react';
import { generateFBCaption, generateIllustration, generateImageVariation } from '../services/geminiService';
import { ContentTone, ImageStyle, PostData } from '../types';
import LogoOverlay from './LogoOverlay';

const simpleId = () => Math.random().toString(36).substring(2, 15);

interface ContentCreatorProps {
  onSavePost: (post: PostData) => void;
  userLogo: string | null;
  setUserLogo: (logo: string | null) => void;
}

const ContentCreator: React.FC<ContentCreatorProps> = ({ onSavePost, userLogo, setUserLogo }) => {
  // Inputs
  const [inputText, setInputText] = useState('');
  const [selectedTone, setSelectedTone] = useState<ContentTone>(ContentTone.PROFESSIONAL);
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle>(ImageStyle.CLEAN_LINE); 
  
  // Processing States
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Results
  const [generatedCaption, setGeneratedCaption] = useState('');
  const [generatedImagePrompt, setGeneratedImagePrompt] = useState('');
  const [generatedImageBase64, setGeneratedImageBase64] = useState<string | null>(null);
  const [finalComposedImage, setFinalComposedImage] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  
  // UI States
  const [isCopied, setIsCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const customImageInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setInputText(evt.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setUserLogo(evt.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setGeneratedImageBase64(evt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      setError("กรุณาใส่เนื้อหาหรืออัพโหลดไฟล์ข้อความก่อน");
      return;
    }
    setError(null);
    setIsGeneratingText(true);
    setGeneratedCaption('');
    setGeneratedImageBase64(null);

    try {
      // 1. Generate Text & Prompt
      const result = await generateFBCaption(inputText, selectedTone);
      setGeneratedCaption(result.caption);
      setGeneratedImagePrompt(result.imagePrompt);
      setIsGeneratingText(false);

      // 2. Generate Image
      setIsGeneratingImage(true);
      const imageBase64 = await generateIllustration(result.imagePrompt, selectedStyle);
      setGeneratedImageBase64(imageBase64);
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการสร้างคอนเทนต์");
    } finally {
      setIsGeneratingText(false);
      setIsGeneratingImage(false);
    }
  };

  const handleRegenerateImage = async () => {
    if (!generatedImagePrompt) return;
    setIsGeneratingImage(true);
    setError(null);
    try {
        const imageBase64 = await generateIllustration(generatedImagePrompt, selectedStyle);
        setGeneratedImageBase64(imageBase64);
    } catch (err: any) {
        setError("ไม่สามารถสร้างภาพใหม่ได้: " + err.message);
    } finally {
        setIsGeneratingImage(false);
    }
  };

  const handleRestyleImage = async () => {
      if (!generatedImageBase64) return;
      
      setIsGeneratingImage(true);
      setError(null);
      try {
          const promptToUse = generatedImagePrompt || "A creative image representing the content";
          const imageBase64 = await generateImageVariation(generatedImageBase64, promptToUse, selectedStyle);
          setGeneratedImageBase64(imageBase64);
      } catch (err: any) {
          setError("ไม่สามารถปรับสไตล์ภาพได้: " + err.message);
      } finally {
          setIsGeneratingImage(false);
      }
  };

  const handleSave = () => {
    if (!generatedCaption || !finalComposedImage) return;
    
    const newPost: PostData = {
      id: simpleId(),
      originalContent: inputText,
      generatedCaption: generatedCaption,
      generatedImageBase64: generatedImageBase64,
      finalImageBase64: finalComposedImage,
      status: 'scheduled',
      scheduledDate: scheduledDate,
      timestamp: Date.now()
    };
    
    onSavePost(newPost);
    setInputText('');
    setGeneratedCaption('');
    setGeneratedImageBase64(null);
    alert('บันทึกแผนงานเรียบร้อย!');
  };

  const handleCopyText = async () => {
    if (!generatedCaption) return;
    try {
        await navigator.clipboard.writeText(generatedCaption);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
        console.error("Failed to copy text", err);
    }
  };

  const downloadTextFile = () => {
    const contentHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Content Caption</title>
        <style>
          body { font-family: sans-serif; line-height: 1.6; font-size: 14pt; }
          p { margin-bottom: 1em; }
        </style>
      </head>
      <body>
        ${generatedCaption.replace(/\n/g, '<br>')}
      </body>
      </html>
    `;

    const blob = new Blob([contentHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `caption-${new Date().toISOString().slice(0,10)}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadImageFile = () => {
    if (!finalComposedImage) return;
    const a = document.createElement('a');
    a.href = finalComposedImage;
    a.download = `post-image-${new Date().toISOString().slice(0,10)}.png`;
    a.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column: Inputs */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <FileText className="text-blue-600" /> ข้อมูลต้นฉบับ
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">วางเนื้อหา หรือ อัพโหลดไฟล์ Text</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="วางบทความ รายละเอียดสินค้า หรือเนื้อหาดิบที่นี่..."
                className="w-full h-40 p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-slate-700"
              />
              <div className="mt-2">
                 <input 
                    type="file" 
                    accept=".txt" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    className="hidden"
                 />
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                 >
                    <Upload className="w-4 h-4" /> อัพโหลดไฟล์ .txt
                 </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mood & Tone</label>
                <select 
                  value={selectedTone}
                  onChange={(e) => setSelectedTone(e.target.value as ContentTone)}
                  className="w-full p-2 rounded-lg border border-slate-300 text-sm"
                >
                  {Object.values(ContentTone).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">สไตล์ภาพประกอบ</label>
                <select 
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value as ImageStyle)}
                  className="w-full p-2 rounded-lg border border-slate-300 text-sm"
                >
                  {Object.values(ImageStyle).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">โลโก้แบรนด์ (PNG พื้นใส)</label>
               <div className="flex items-center gap-4 mt-2">
                 <div className="w-16 h-16 bg-slate-100 rounded-lg border border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative group cursor-pointer" onClick={() => logoInputRef.current?.click()}>
                    {userLogo ? (
                        <img src={userLogo} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                        <Upload className="w-6 h-6 text-slate-400" />
                    )}
                 </div>
                 <div className="flex-1">
                    <input 
                        type="file" 
                        accept="image/*" 
                        ref={logoInputRef}
                        onChange={handleLogoUpload}
                        className="hidden"
                    />
                    <button 
                        onClick={() => logoInputRef.current?.click()}
                        className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md transition-colors"
                    >
                        เลือกไฟล์โลโก้
                    </button>
                    <p className="text-xs text-slate-500 mt-1">จะถูกนำไปแปะบนทุกภาพที่สร้าง</p>
                 </div>
               </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isGeneratingText || isGeneratingImage}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isGeneratingText || isGeneratingImage ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> กำลังทำงาน...</>
              ) : (
                <><Wand2 className="w-5 h-5" /> สร้างคอนเทนต์ด้วย AI</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Preview & Edit */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <ImageIcon className="text-purple-600" /> พรีวิวคอนเทนต์
            </h2>

            {!generatedCaption && !generatedImageBase64 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12 border-2 border-dashed border-slate-200 rounded-lg">
                    <Wand2 className="w-12 h-12 mb-4 opacity-50" />
                    <p>รอการสร้างคอนเทนต์...</p>
                </div>
            ) : (
                <div className="space-y-6 animate-fade-in">
                    {/* Caption Editor */}
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <label className="block text-sm font-medium text-slate-700">Caption</label>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={handleCopyText}
                                    className="text-xs text-slate-600 hover:text-green-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                                >
                                    {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    {isCopied ? 'คัดลอกแล้ว' : 'คัดลอก'}
                                </button>
                                <span className="text-slate-300">|</span>
                                <button 
                                    onClick={downloadTextFile}
                                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                    <Download className="w-3 h-3" /> .doc
                                </button>
                            </div>
                        </div>
                        <textarea 
                            value={generatedCaption}
                            onChange={(e) => setGeneratedCaption(e.target.value)}
                            className="w-full h-40 p-3 text-sm rounded-lg bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent leading-relaxed"
                            style={{ whiteSpace: 'pre-wrap' }}
                        />
                    </div>

                    {/* Image & Logo Overlay */}
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <label className="block text-sm font-medium text-slate-700">รูปภาพ + โลโก้</label>
                            {finalComposedImage && (
                                <button 
                                    onClick={downloadImageFile}
                                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                    <Download className="w-3 h-3" /> .png
                                </button>
                            )}
                        </div>
                        
                        {isGeneratingImage ? (
                            <div className="h-64 w-full bg-slate-50 rounded-lg flex flex-col items-center justify-center text-slate-500 gap-3 animate-pulse">
                                <ImageIcon className="w-10 h-10 opacity-50" />
                                <p>AI กำลังวาดภาพ...</p>
                            </div>
                        ) : generatedImageBase64 ? (
                            <>
                                <LogoOverlay 
                                    baseImage={generatedImageBase64}
                                    logoImage={userLogo}
                                    onSave={setFinalComposedImage}
                                />
                                {/* Image Toolbar */}
                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                    <button 
                                        onClick={handleRegenerateImage}
                                        disabled={!generatedImagePrompt}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-md transition-colors disabled:opacity-50"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" /> สร้างใหม่
                                    </button>

                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        ref={customImageInputRef} 
                                        onChange={handleCustomImageUpload} 
                                        className="hidden"
                                    />
                                    <button 
                                        onClick={() => customImageInputRef.current?.click()}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-md transition-colors"
                                    >
                                        <Camera className="w-3.5 h-3.5" /> อัพโหลดเอง
                                    </button>

                                    <button 
                                        onClick={handleRestyleImage}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs rounded-md transition-colors ml-auto"
                                    >
                                        <Sparkles className="w-3.5 h-3.5" /> รีสไตล์
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="h-64 w-full bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                ภาพจะปรากฏที่นี่
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600">วันที่ลงโพสต์:</span>
                            <input 
                                type="date" 
                                value={scheduledDate}
                                onChange={(e) => setScheduledDate(e.target.value)}
                                className="p-2 border border-slate-300 rounded-md text-sm"
                            />
                        </div>
                        <button 
                            onClick={handleSave}
                            disabled={!generatedCaption || !finalComposedImage}
                            className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg font-medium shadow-sm flex items-center gap-2 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" /> บันทึกลงแผนงาน
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ContentCreator;
