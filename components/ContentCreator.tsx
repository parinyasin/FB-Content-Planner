
import React, { useState, useRef } from 'react';
import { generateFBCaption, generateIllustration } from '../services/geminiService';
import LogoOverlay from './LogoOverlay';
import ContentPlanner from './ContentPlanner';
import { PostData, AspectRatio } from '../types';
import { Loader2, Sparkles, Layout, Image as ImageIcon, Calendar, Upload, FileText, X, ArrowRight, Palette } from 'lucide-react';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

type Tab = 'draft' | 'studio' | 'planner';

declare global {
  interface Window {
    mammoth: any;
  }
}

export default function ContentCreator() {
  // --- State: Navigation ---
  const [activeTab, setActiveTab] = useState<Tab>('draft');

  // --- State: Draft Section ---
  const [inputText, setInputText] = useState('');
  const [tone, setTone] = useState('มืออาชีพและน่าเชื่อถือ');
  const [style, setStyle] = useState('ลายเส้นสะอาดตา (Clean Line Art)');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Results
  const [generatedCaption, setGeneratedCaption] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  
  // --- State: Image Studio Section ---
  const [studioBaseImage, setStudioBaseImage] = useState<string | null>(null);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.SQUARE);
  
  // --- State: Planner Section ---
  const [posts, setPosts] = useState<PostData[]>([]);

  // --- Handlers: File Upload ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading('กำลังอ่านไฟล์...');
    
    try {
      if (file.name.endsWith('.docx')) {
        if (window.mammoth) {
          const arrayBuffer = await file.arrayBuffer();
          const result = await window.mammoth.extractRawText({ arrayBuffer });
          setInputText(result.value);
          toast.success('อ่านไฟล์เรียบร้อย', { id: toastId });
        } else {
          toast.error('ระบบอ่านไฟล์ยังไม่พร้อม กรุณาลองใหม่', { id: toastId });
        }
      } else if (file.type === 'text/plain') {
        const text = await file.text();
        setInputText(text);
        toast.success('อ่านไฟล์เรียบร้อย', { id: toastId });
      } else {
        toast.error('รองรับเฉพาะไฟล์ .docx และ .txt เท่านั้น', { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error('เกิดข้อผิดพลาดในการอ่านไฟล์', { id: toastId });
    }
  };

  // --- Handlers: AI Generation ---
  const handleGenerate = async () => {
    if (!inputText.trim()) {
      toast.error('กรุณาใส่เนื้อหาต้นฉบับก่อนครับ');
      return;
    }

    setIsGenerating(true);
    setGeneratedCaption('');
    // We don't clear image immediately so user sees previous context, or clear it if you prefer:
    setGeneratedImage(null);

    try {
      // 1. Generate Text
      const captionResult = await generateFBCaption(inputText, tone);
      setGeneratedCaption(captionResult.caption);

      // 2. Generate Image (if prompt exists)
      if (captionResult.imagePrompt) {
         const imageUrl = await generateIllustration(captionResult.imagePrompt, style);
         if (imageUrl) {
             setGeneratedImage(imageUrl);
         } else {
             toast.error('สร้างภาพไม่สำเร็จ แต่ได้ข้อความแล้ว');
         }
      }
      
      toast.success('สร้างคอนเทนต์เสร็จสิ้น!');
    } catch (error) {
      console.error(error);
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ AI');
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Handlers: Workflow Transitions ---
  const sendToStudio = () => {
    if (generatedImage) {
        setStudioBaseImage(generatedImage);
        setActiveTab('studio');
        toast.success('ส่งภาพไปยังห้องแต่งภาพแล้ว');
    } else {
        toast.error('ยังไม่มีภาพที่สร้างขึ้น');
    }
  };

  const handleImageUploadToStudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setStudioBaseImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setLogoImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveToPlanner = (finalImageBase64: string) => {
    const newPost: PostData = {
        id: uuidv4(),
        originalContent: inputText,
        generatedCaption: generatedCaption || "ไม่ได้ระบุแคปชั่น",
        uploadedImageBase64: studioBaseImage,
        finalImageBase64: finalImageBase64,
        status: 'draft',
        scheduledDate: new Date().toISOString(),
        timestamp: Date.now()
    };

    setPosts(prev => [...prev, newPost]);
    setActiveTab('planner');
    toast.success('บันทึกแผนงานเรียบร้อย!');
  };

  const handleDeletePost = (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
    toast.success('ลบรายการแล้ว');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      
      {/* Header Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                    <Sparkles className="w-5 h-5" />
                </div>
                <h1 className="font-bold text-xl text-slate-800 hidden sm:block">FB Content Planner</h1>
            </div>

            <nav className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                    onClick={() => setActiveTab('draft')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'draft' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <FileText className="w-4 h-4" /> <span className="hidden sm:inline">1. เขียน & สร้างภาพ</span>
                </button>
                <button 
                    onClick={() => setActiveTab('studio')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'studio' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Palette className="w-4 h-4" /> <span className="hidden sm:inline">2. แต่งภาพ</span>
                </button>
                <button 
                    onClick={() => setActiveTab('planner')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'planner' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Calendar className="w-4 h-4" /> <span className="hidden sm:inline">3. แผนงาน ({posts.length})</span>
                </button>
            </nav>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full p-4 sm:p-6">
        
        {/* TAB 1: DRAFT & GENERATE */}
        {activeTab === 'draft' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                {/* Left: Input */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-700">
                            <FileText className="w-5 h-5 text-blue-500" /> ข้อมูลต้นฉบับ
                        </h2>
                        
                        {/* File Upload */}
                        <div className="mb-4">
                             <label className="block w-full cursor-pointer border-2 border-dashed border-slate-200 rounded-lg p-6 hover:bg-slate-50 transition-colors text-center">
                                <input type="file" accept=".docx, .txt" onChange={handleFileUpload} className="hidden" />
                                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                <span className="text-sm text-slate-500 block">อัพโหลดไฟล์ .docx หรือ .txt เพื่อดึงข้อความ</span>
                             </label>
                        </div>

                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            className="w-full h-48 p-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                            placeholder="หรือวางเนื้อหาบทความ สรุปข่าว หรือข้อมูลสินค้าที่นี่..."
                        />

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">โทนภาษา (Tone)</label>
                                <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full p-2 text-sm border rounded-lg bg-white">
                                    <option>มืออาชีพและน่าเชื่อถือ</option>
                                    <option>สนุกสนาน เป็นกันเอง</option>
                                    <option>ขายของแบบ Hard Sale</option>
                                    <option>ให้ความรู้ (Educational)</option>
                                    <option>เล่าเรื่อง (Storytelling)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">สไตล์ภาพ AI</label>
                                <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full p-2 text-sm border rounded-lg bg-white">
                                    <option>ลายเส้นสะอาดตา (Clean Line Art)</option>
                                    <option>ภาพถ่ายสมจริง (Photorealistic)</option>
                                    <option>สีน้ำ (Watercolor)</option>
                                    <option>3D Render (3D Cartoon)</option>
                                    <option>มินิมอล (Minimalist)</option>
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 transition-all"
                        >
                            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                            {isGenerating ? 'AI กำลังทำงาน...' : 'สร้างคอนเทนต์ & รูปภาพ'}
                        </button>
                    </div>
                </div>

                {/* Right: Output */}
                <div className="space-y-6">
                     <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full flex flex-col">
                        <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-700">
                             <Layout className="w-5 h-5 text-purple-500" /> ผลลัพธ์จาก AI
                        </h2>

                        <div className="flex-1 space-y-4">
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 min-h-[150px]">
                                <label className="text-xs text-slate-400 font-bold mb-1 block">CAPTION</label>
                                {generatedCaption ? (
                                    <textarea 
                                        value={generatedCaption} 
                                        onChange={(e) => setGeneratedCaption(e.target.value)}
                                        className="w-full bg-transparent border-none p-0 text-slate-700 text-sm h-full resize-none focus:ring-0" 
                                        rows={8}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-32 text-slate-400 text-sm italic">
                                        รอการสร้างเนื้อหา...
                                    </div>
                                )}
                            </div>

                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 min-h-[200px] flex flex-col items-center justify-center relative overflow-hidden">
                                <label className="text-xs text-slate-400 font-bold mb-1 block w-full text-left z-10">IMAGE</label>
                                {generatedImage ? (
                                    <img src={generatedImage} alt="AI Generated" className="w-full h-auto rounded shadow-sm object-contain max-h-[300px]" />
                                ) : (
                                    <div className="flex flex-col items-center text-slate-400">
                                        <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
                                        <span className="text-sm italic">ภาพประกอบจะปรากฏที่นี่</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {generatedImage && (
                             <button 
                                onClick={sendToStudio}
                                className="mt-4 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-lg flex items-center justify-center gap-2 animate-pulse"
                            >
                                ไปแต่งภาพต่อที่ Studio <ArrowRight className="w-5 h-5" />
                            </button>
                        )}
                     </div>
                </div>
            </div>
        )}

        {/* TAB 2: IMAGE STUDIO */}
        {activeTab === 'studio' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50">
                    <div>
                        <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                            <Palette className="w-5 h-5 text-indigo-500" /> Image Studio
                        </h2>
                        <p className="text-xs text-slate-500">ปรับแต่งภาพ ใส่โลโก้ และข้อความหัวข้อ</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <label className="cursor-pointer px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" /> เปลี่ยนรูปหลัก
                            <input type="file" accept="image/*" onChange={handleImageUploadToStudio} className="hidden" />
                        </label>
                        <label className="cursor-pointer px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                            <Upload className="w-4 h-4" /> อัพโหลดโลโก้
                            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        </label>
                        <select 
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                            className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-600 outline-none"
                        >
                            {Object.values(AspectRatio).map((ratio) => (
                                <option key={ratio} value={ratio}>{ratio}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="p-6 bg-slate-200 min-h-[600px] flex justify-center">
                    {studioBaseImage ? (
                        <LogoOverlay
                            baseImage={studioBaseImage}
                            logoImage={logoImage}
                            aspectRatio={aspectRatio}
                            onSave={handleSaveToPlanner}
                        />
                    ) : (
                         <div className="flex flex-col items-center justify-center text-slate-400 py-20">
                            <ImageIcon className="w-20 h-20 mb-4 opacity-20" />
                            <p className="text-lg font-medium">ยังไม่มีรูปภาพ</p>
                            <p className="text-sm mb-6">เลือกรูปจากขั้นตอนที่ 1 หรืออัพโหลดใหม่</p>
                            <label className="px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                                อัพโหลดรูปภาพ
                                <input type="file" accept="image/*" onChange={handleImageUploadToStudio} className="hidden" />
                            </label>
                         </div>
                    )}
                </div>
            </div>
        )}

        {/* TAB 3: PLANNER */}
        {activeTab === 'planner' && (
            <div className="animate-fade-in">
                <ContentPlanner posts={posts} onDeletePost={handleDeletePost} />
            </div>
        )}

      </main>
    </div>
  );
}
