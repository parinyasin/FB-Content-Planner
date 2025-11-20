
import React, { useState, useEffect } from 'react';
import { generateFBCaption, generateIllustration } from '../services/geminiService';
import LogoOverlay from './LogoOverlay';
import ContentPlanner from './ContentPlanner';
import { PostData, AspectRatio } from '../types';
import { Loader2, Sparkles, Layout, Image as ImageIcon, Calendar, Upload, FileText, ArrowRight, Palette, Menu, X, Box, Settings, Save } from 'lucide-react';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // --- State: Draft Section ---
  const [inputText, setInputText] = useState('');
  const [tone, setTone] = useState('มืออาชีพและน่าเชื่อถือ');
  const [style, setStyle] = useState('ภาพถ่ายสินค้าสตูดิโอ (Product Photography)');
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

  // --- Persistence ---
  useEffect(() => {
    // Load posts
    const savedPosts = localStorage.getItem('fb_planner_posts');
    if (savedPosts) {
      try {
        setPosts(JSON.parse(savedPosts));
      } catch (e) {
        console.error("Failed to load posts", e);
      }
    }
    // Load Logo
    const savedLogo = localStorage.getItem('fb_planner_logo');
    if (savedLogo) {
        setLogoImage(savedLogo);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('fb_planner_posts', JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
      if (logoImage) {
          localStorage.setItem('fb_planner_logo', logoImage);
      }
  }, [logoImage]);

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
    // We don't clear image immediately so user sees previous context
    // setGeneratedImage(null); 

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
    toast.success('บันทึกแผนงานเรียบร้อย!');
    // Optional: switch to planner or stay in studio?
    // setActiveTab('planner'); 
  };

  const handleDeletePost = (id: string) => {
    if(confirm('ต้องการลบรายการนี้ใช่หรือไม่?')) {
        setPosts(prev => prev.filter(p => p.id !== id));
        toast.success('ลบรายการแล้ว');
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      
      {/* Sidebar Navigation */}
      <aside 
        className={`bg-slate-900 text-white transition-all duration-300 flex flex-col z-20 ${isSidebarOpen ? 'w-64' : 'w-20'} shadow-xl`}
      >
        <div className="h-16 flex items-center justify-center border-b border-slate-800">
            {isSidebarOpen ? (
                <div className="flex items-center gap-2 font-thai-header text-xl font-bold text-blue-400">
                    <Sparkles className="w-6 h-6" /> AI Creator
                </div>
            ) : (
                <Sparkles className="w-8 h-8 text-blue-400" />
            )}
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2">
            <NavButton 
                active={activeTab === 'draft'} 
                onClick={() => setActiveTab('draft')} 
                icon={<FileText />} 
                label="1. สร้างคอนเทนต์" 
                isOpen={isSidebarOpen}
            />
            <NavButton 
                active={activeTab === 'studio'} 
                onClick={() => setActiveTab('studio')} 
                icon={<Palette />} 
                label="2. ตกแต่งภาพ" 
                isOpen={isSidebarOpen}
            />
            <NavButton 
                active={activeTab === 'planner'} 
                onClick={() => setActiveTab('planner')} 
                icon={<Calendar />} 
                label={`3. แผนงาน (${posts.length})`} 
                isOpen={isSidebarOpen}
            />
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
             {isSidebarOpen && <p>© 2024 FB Content Planner</p>}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">
                <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4">
                <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium border border-blue-100">
                    Pro Plan
                </div>
                <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                    ME
                </div>
            </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 relative">
            
            {/* TAB 1: DRAFT */}
            {activeTab === 'draft' && (
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
                    
                    {/* Input Column */}
                    <div className="lg:col-span-5 space-y-4">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h2 className="font-thai-header text-lg mb-4 text-slate-800 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-500" /> ข้อมูลต้นฉบับ
                            </h2>
                            
                            <div className="space-y-4">
                                <div className="relative">
                                    <textarea
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        className="w-full h-40 p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm transition-all"
                                        placeholder="วางเนื้อหาข่าว บทความ หรือข้อมูลสินค้าที่ต้องการสรุป..."
                                    />
                                    <div className="absolute bottom-3 right-3">
                                        <label className="cursor-pointer p-2 bg-white rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors inline-flex" title="อัพโหลดไฟล์">
                                            <Upload className="w-4 h-4 text-slate-500" />
                                            <input type="file" accept=".docx, .txt" onChange={handleFileUpload} className="hidden" />
                                        </label>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500">โทนภาษา</label>
                                        <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500">
                                            <option>มืออาชีพและน่าเชื่อถือ</option>
                                            <option>สนุกสนาน เป็นกันเอง</option>
                                            <option>กระตือรือร้น ขายของ (Sales)</option>
                                            <option>ให้ความรู้ (Educational)</option>
                                            <option>เล่าเรื่อง (Storytelling)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500">สไตล์ภาพ</label>
                                        <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500">
                                            <option>ภาพถ่ายสินค้าสตูดิโอ (Product Studio)</option>
                                            <option>มินิมอล คลีน (Minimalist)</option>
                                            <option>ภาพวาดดิจิตอล (Digital Art)</option>
                                            <option>สีน้ำ (Watercolor)</option>
                                            <option>สมจริงระดับ 8K (Photorealistic)</option>
                                        </select>
                                    </div>
                                </div>

                                <button
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-70 transition-all transform hover:scale-[1.02]"
                                >
                                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                    {isGenerating ? 'AI กำลังทำงาน...' : 'สร้างคอนเทนต์และรูปภาพ'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Output Column */}
                    <div className="lg:col-span-7 space-y-4 h-full">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col">
                             <h2 className="font-thai-header text-lg mb-4 text-slate-800 flex items-center gap-2">
                                <Layout className="w-5 h-5 text-purple-500" /> ผลลัพธ์
                            </h2>

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Text Result */}
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-slate-400">CAPTION</span>
                                        <button onClick={() => {navigator.clipboard.writeText(generatedCaption); toast.success('คัดลอกแล้ว')}} className="text-xs text-blue-600 hover:underline">คัดลอก</button>
                                    </div>
                                    {generatedCaption ? (
                                        <textarea 
                                            value={generatedCaption}
                                            onChange={(e) => setGeneratedCaption(e.target.value)}
                                            className="flex-1 w-full bg-transparent border-none p-0 text-slate-700 text-sm resize-none focus:ring-0 leading-relaxed"
                                        />
                                    ) : (
                                        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm italic">
                                            รอผลลัพธ์...
                                        </div>
                                    )}
                                </div>

                                {/* Image Result */}
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col relative group overflow-hidden">
                                    <span className="text-xs font-bold text-slate-400 mb-2 block">IMAGE</span>
                                    <div className="flex-1 flex items-center justify-center bg-slate-200 rounded-lg overflow-hidden relative min-h-[200px]">
                                        {generatedImage ? (
                                            <img src={generatedImage} alt="Generated" className="w-full h-full object-cover absolute inset-0" />
                                        ) : (
                                            <ImageIcon className="w-10 h-10 text-slate-300" />
                                        )}
                                    </div>
                                    {generatedImage && (
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button 
                                                onClick={sendToStudio}
                                                className="px-4 py-2 bg-white text-slate-900 rounded-full font-medium text-sm hover:bg-blue-50 transition-colors flex items-center gap-2"
                                            >
                                                <Palette className="w-4 h-4" /> แต่งภาพต่อ
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: STUDIO */}
            {activeTab === 'studio' && (
                <div className="h-full flex flex-col animate-fade-in">
                    <div className="bg-white p-4 rounded-t-2xl border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-10 shadow-sm">
                         <div className="flex items-center gap-4">
                             <h2 className="font-thai-header font-bold text-lg text-slate-800 flex items-center gap-2">
                                <Palette className="w-5 h-5 text-indigo-500" /> Studio
                            </h2>
                            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
                            <div className="flex gap-2">
                                <label className="cursor-pointer px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100 flex items-center gap-2 transition-colors">
                                    <ImageIcon className="w-3.5 h-3.5" /> เปลี่ยนรูป
                                    <input type="file" accept="image/*" onChange={handleImageUploadToStudio} className="hidden" />
                                </label>
                                <label className="cursor-pointer px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100 flex items-center gap-2 transition-colors">
                                    <Upload className="w-3.5 h-3.5" /> อัพโลโก้
                                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                </label>
                            </div>
                         </div>
                         
                         <div className="flex items-center gap-2">
                             <select 
                                value={aspectRatio}
                                onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-700 outline-none cursor-pointer"
                            >
                                {Object.values(AspectRatio).map((ratio) => (
                                    <option key={ratio} value={ratio}>{ratio}</option>
                                ))}
                            </select>
                         </div>
                    </div>

                    <div className="flex-1 bg-slate-200 overflow-hidden flex rounded-b-2xl relative">
                        {studioBaseImage ? (
                            <div className="w-full h-full overflow-y-auto p-4">
                                <LogoOverlay
                                    baseImage={studioBaseImage}
                                    logoImage={logoImage}
                                    aspectRatio={aspectRatio}
                                    onSave={handleSaveToPlanner}
                                />
                            </div>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                <div className="bg-white p-8 rounded-full shadow-sm mb-4">
                                    <ImageIcon className="w-12 h-12 text-slate-300" />
                                </div>
                                <p className="text-lg font-thai-header font-medium text-slate-600">ยังไม่ได้เลือกรูปภาพ</p>
                                <p className="text-sm mb-6">เลือกรูปจากขั้นตอนที่ 1 หรืออัพโหลดใหม่</p>
                                <label className="px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
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
                <div className="max-w-7xl mx-auto animate-fade-in space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="font-thai-header font-bold text-2xl text-slate-800">แผนงานคอนเทนต์</h2>
                        <div className="text-sm text-slate-500">ทั้งหมด {posts.length} โพสต์</div>
                    </div>
                    <ContentPlanner posts={posts} onDeletePost={handleDeletePost} />
                </div>
            )}
        </main>
      </div>
    </div>
  );
}

const NavButton = ({ active, onClick, icon, label, isOpen }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, isOpen: boolean }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 ${
            active 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        } ${!isOpen && 'justify-center'}`}
        title={!isOpen ? label : ''}
    >
        <div className={`${active ? 'text-white' : ''}`}>{icon}</div>
        {isOpen && <span className="font-medium text-sm whitespace-nowrap font-thai-header">{label}</span>}
    </button>
);
