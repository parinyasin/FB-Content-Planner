
import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Save, FileText, Loader2, AlertCircle, Download, Copy, Check, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { generateCaptionFromText } from '../services/geminiService';
import { ContentTone, PostData, AspectRatio } from '../types';
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
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedTone, setSelectedTone] = useState<ContentTone>(ContentTone.PROFESSIONAL);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.PORTRAIT_LONG); // Default to 1080x1500

  // Processing States
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Results
  const [generatedCaption, setGeneratedCaption] = useState('');
  
  // Final Output
  const [finalComposedImage, setFinalComposedImage] = useState<string | null>(null);
  
  // Meta
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [isCopied, setIsCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const mainImageInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    setError(null);

    // 1. Handle .docx (Word Modern)
    if (fileName.endsWith('.docx')) {
        setStatusMessage('กำลังอ่านไฟล์ Word...');
        setIsProcessing(true);
        
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                // Check if mammoth is loaded
                if (evt.target?.result && (window as any).mammoth) {
                    const result = await (window as any).mammoth.extractRawText({ arrayBuffer: evt.target.result });
                    if (result.value) {
                        setInputText(result.value);
                        setStatusMessage('');
                    } else {
                        setError("ไม่พบข้อความในไฟล์ Word นี้");
                    }
                } else {
                    setError("ระบบอ่านไฟล์ Word ยังไม่พร้อมใช้งาน กรุณารีเฟรชหน้าเว็บ");
                }
            } catch (err) {
                console.error(err);
                setError("เกิดข้อผิดพลาดในการอ่านไฟล์ Word (.docx)");
            } finally {
                setIsProcessing(false);
            }
        };
        reader.readAsArrayBuffer(file);
        return;
    }

    // 2. Handle .txt
    if (fileName.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (evt) => {
            if (evt.target?.result) {
                setInputText(evt.target.result as string);
            }
        };
        reader.readAsText(file);
        return;
    }

    // 3. Handle others (.doc, .pages)
    if (fileName.endsWith('.doc') || fileName.endsWith('.pages') || fileName.endsWith('.page')) {
        setError(`สำหรับไฟล์นามสกุล .${fileName.split('.').pop()} ระบบยังไม่รองรับการดึงอัตโนมัติ รบกวนเปิดไฟล์แล้วคัดลอกเนื้อหามาวางที่ช่อง "ต้นฉบับ" เพื่อความถูกต้องครบถ้วนครับ`);
        // Reset input so they can try again if they want
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
    }
    
    // Fallback
    setError("รองรับการอ่านอัตโนมัติเฉพาะไฟล์ .txt และ .docx (Word)");
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

  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setUploadedImage(evt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
  };

  const handleGenerateCaption = async () => {
    if (!inputText.trim()) {
      setError("กรุณาใส่เนื้อหา (Text) เพื่อเขียนคอนเทนต์");
      return;
    }
    setError(null);
    setIsProcessing(true);
    setGeneratedCaption('');
    setStatusMessage('AI กำลังสรุปเนื้อหาและเขียนแคปชั่น...');
    
    try {
      const captionResult = await generateCaptionFromText(inputText, selectedTone);
      setGeneratedCaption(captionResult.caption);
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการทำงาน");
    } finally {
      setIsProcessing(false);
      setStatusMessage('');
    }
  };

  const handleSave = () => {
    if (!generatedCaption) {
        alert('กรุณาสร้างเนื้อหาก่อนบันทึก');
        return;
    }
    
    const newPost: PostData = {
      id: simpleId(),
      originalContent: inputText,
      generatedCaption: generatedCaption,
      uploadedImageBase64: uploadedImage,
      finalImageBase64: finalComposedImage,
      status: 'scheduled',
      scheduledDate: scheduledDate,
      timestamp: Date.now()
    };
    
    onSavePost(newPost);
    setInputText('');
    setGeneratedCaption('');
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

  const downloadImageFile = () => {
    if (!finalComposedImage) return;
    const a = document.createElement('a');
    a.href = finalComposedImage;
    a.download = `post-image-${new Date().toISOString().slice(0,10)}.png`;
    a.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      
      {/* STEP 1: CONTENT WRITING (First) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-2 border-b border-slate-200 pb-2">
             <div className="bg-blue-100 text-blue-700 font-bold w-8 h-8 rounded-full flex items-center justify-center">1</div>
             <h2 className="text-xl font-bold text-slate-800">เขียนเนื้อหาและสรุป (Content Writing)</h2>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Input */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">ต้นฉบับ (Original Text)</label>
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="วางบทความ ข่าว หรือรายละเอียดสินค้าที่นี่..."
                        className="w-full h-40 p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-slate-700 text-sm"
                    />
                    <div className="mt-2 flex justify-between items-center">
                        <select 
                            value={selectedTone}
                            onChange={(e) => setSelectedTone(e.target.value as ContentTone)}
                            className="p-1.5 rounded border border-slate-300 text-xs bg-slate-50"
                        >
                            {Object.values(ContentTone).map((t) => (
                            <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                        
                        <div className="flex gap-2">
                            {/* Updated accept attribute */}
                            <input 
                                type="file" 
                                accept=".txt,.docx,.doc,.pages,.page" 
                                ref={fileInputRef} 
                                onChange={handleFileUpload} 
                                className="hidden" 
                            />
                            <button onClick={() => fileInputRef.current?.click()} className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 border border-slate-200 px-2 py-1 rounded bg-slate-50">
                                <FileText className="w-3 h-3" /> โหลดไฟล์ (.txt / .docx)
                            </button>
                        </div>
                    </div>
                </div>
                
                {error && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-start gap-2 animate-fade-in">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
                
                {statusMessage && (
                     <div className="text-xs text-blue-600 flex items-center gap-1 animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" /> {statusMessage}
                     </div>
                )}

                <button
                    onClick={handleGenerateCaption}
                    disabled={isProcessing}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isProcessing ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> กำลังเขียน...</>
                    ) : (
                        <><Sparkles className="w-5 h-5" /> สรุปและเขียนแคปชั่น</>
                    )}
                </button>
            </div>

            {/* Right: Output */}
            <div className="flex flex-col h-full">
                <div className="flex justify-between items-end mb-2">
                    <label className="block text-sm font-bold text-slate-700">ผลลัพธ์ (Caption)</label>
                    <div className="flex items-center gap-1">
                        <button onClick={handleCopyText} disabled={!generatedCaption} className="p-1.5 text-slate-400 hover:text-green-600 transition-colors" title="Copy">
                            {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
                <textarea 
                    value={generatedCaption}
                    onChange={(e) => setGeneratedCaption(e.target.value)}
                    className="w-full flex-1 min-h-[160px] p-3 text-sm rounded-lg bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent leading-relaxed resize-none"
                    placeholder="ผลลัพธ์จาก AI จะแสดงที่นี่..."
                />
            </div>
        </div>
      </section>


      {/* STEP 2: IMAGE STUDIO (Second) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-2 border-b border-slate-200 pb-2 pt-4">
             <div className="bg-purple-100 text-purple-700 font-bold w-8 h-8 rounded-full flex items-center justify-center">2</div>
             <h2 className="text-xl font-bold text-slate-800">ตกแต่งภาพ (Image Studio)</h2>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             {/* Toolbar */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* 1. Select Image */}
                <div 
                    onClick={() => mainImageInputRef.current?.click()}
                    className={`relative h-16 rounded-lg border border-dashed flex items-center justify-center cursor-pointer transition-all ${uploadedImage ? 'border-purple-500 bg-purple-50' : 'border-slate-300 hover:border-purple-400 hover:bg-slate-50'}`}
                >
                    <input type="file" accept="image/*" ref={mainImageInputRef} onChange={handleMainImageUpload} className="hidden" />
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                        <ImageIcon className="w-5 h-5 text-purple-600" />
                        {uploadedImage ? "เปลี่ยนรูปภาพ" : "อัพโหลดรูปหลัก"}
                    </div>
                </div>

                {/* 2. Select Ratio */}
                <div>
                    <select 
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                        className="w-full h-16 p-2 rounded-lg border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-purple-500 cursor-pointer"
                    >
                        {Object.values(AspectRatio).map((r) => (
                        <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                </div>

                {/* 3. Select Logo */}
                <div 
                    onClick={() => logoInputRef.current?.click()}
                    className="relative h-16 rounded-lg border border-dashed border-slate-300 hover:border-purple-400 hover:bg-slate-50 flex items-center justify-center cursor-pointer gap-2"
                >
                     <input type="file" accept="image/*" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" />
                     {userLogo ? (
                        <>
                             <img src={userLogo} className="h-8 w-8 object-contain" />
                             <span className="text-sm text-slate-600">เปลี่ยนโลโก้</span>
                        </>
                     ) : (
                        <span className="text-sm text-slate-600 flex items-center gap-2">
                            <Upload className="w-4 h-4" /> เพิ่มโลโก้
                        </span>
                     )}
                </div>
             </div>

             {/* Editor Area */}
             {uploadedImage ? (
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Canvas Area - Takes available width */}
                    <div className="flex-1 flex justify-center bg-slate-100 rounded-lg border border-slate-200 p-1 overflow-hidden">
                        <LogoOverlay 
                            baseImage={uploadedImage}
                            logoImage={userLogo}
                            aspectRatio={aspectRatio}
                            onSave={setFinalComposedImage}
                        />
                    </div>
                </div>
             ) : (
                 <div className="h-64 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                     <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
                     <p>กรุณาอัพโหลดรูปภาพเพื่อเริ่มแต่งภาพ</p>
                 </div>
             )}
        </div>
      </section>

      {/* ACTIONS */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-white border-t border-slate-200 p-4 flex items-center justify-between shadow-lg z-10">
            <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500 hidden sm:inline">กำหนดวันที่:</span>
                <input 
                    type="date" 
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="p-2 border border-slate-300 rounded-md text-sm bg-slate-50"
                />
            </div>
            
            <div className="flex gap-3">
                 {finalComposedImage && (
                    <button 
                        onClick={downloadImageFile}
                        className="hidden sm:flex px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors items-center gap-2"
                    >
                        <Download className="w-4 h-4" /> ดาวน์โหลดรูป
                    </button>
                 )}
                <button 
                    onClick={handleSave}
                    className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg font-bold shadow-sm flex items-center gap-2 transition-all"
                >
                    <Save className="w-4 h-4" /> บันทึกงานนี้
                </button>
            </div>
      </div>
    </div>
  );
};

export default ContentCreator;
