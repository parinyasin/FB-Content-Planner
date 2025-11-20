import React, { useState } from 'react';
import { generateFBCaption, generateIllustration } from '../services/geminiService';
import { Loader2, Sparkles, Copy, RefreshCw, Image as ImageIcon, Type } from 'lucide-react';
import toast from 'react-hot-toast';

// ลบ Props apiKey ออก เพราะเราฝังใน service แล้ว
export default function ContentCreator() {
  const [inputText, setInputText] = useState('');
  const [tone, setTone] = useState('มืออาชีพและน่าเชื่อถือ');
  const [style, setStyle] = useState('ลายเส้นสะอาดตา (Clean Line Art)');
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [generatedImage, setGeneratedImage] = useState('');

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      toast.error('กรุณาใส่เนื้อหาต้นฉบับก่อนครับ');
      return;
    }

    setIsLoading(true);
    setResult('');
    setGeneratedImage('');

    try {
      // 1. สร้างแคปชั่น (เรียก service ตรงๆ ไม่ต้องส่ง key)
      const captionResult = await generateFBCaption(inputText, tone);
      
      if (captionResult.caption) {
         setResult(captionResult.caption);
      }

      // 2. สร้างรูปภาพ
      if (captionResult.imagePrompt) {
         const imageUrl = await generateIllustration(captionResult.imagePrompt, style);
         setGeneratedImage(imageUrl);
      }

      toast.success('สร้างคอนเทนต์สำเร็จ!');
    } catch (error) {
      console.error(error);
      setResult('เกิดข้อผิดพลาด: ระบบไม่สามารถติดต่อ AI ได้ในขณะนี้');
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      {/* ฝั่งซ้าย: กรอกข้อมูล */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4 text-slate-800">
            <span className="bg-blue-100 p-2 rounded-lg text-blue-600 font-bold">1</span>
            <h2 className="font-bold text-lg">เขียนเนื้อหาและสรุป (Content Writing)</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">ต้นฉบับ (Original Text)</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full h-40 p-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-slate-700"
                placeholder="วางเนื้อหาข่าว บทความ หรือข้อมูลสินค้าที่ต้องการให้ AI เขียนสรุป..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Mood & Tone</label>
                <select 
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-slate-700"
                >
                  <option>มืออาชีพและน่าเชื่อถือ</option>
                  <option>สนุกสนาน เป็นกันเอง</option>
                  <option>ขายของแบบ Hard Sale</option>
                  <option>เล่าเรื่อง (Storytelling)</option>
                  <option>สรุปข่าว สั้นกระชับ</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">สไตล์ภาพประกอบ</label>
                <select 
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-slate-700"
                >
                   <option>ลายเส้นสะอาดตา (Clean Line Art)</option>
                   <option>ภาพสีน้ำ (Watercolor)</option>
                   <option>ภาพถ่ายจริง (Realistic Photo)</option>
                   <option>ภาพวาดดิจิตอล (Digital Art)</option>
                   <option>3D Render น่ารักๆ</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  กำลังสร้างสรรค์...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  สรุปและเขียนแคปชั่น
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ฝั่งขวา: ผลลัพธ์ */}
      <div className="space-y-6">
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
               <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <Type className="w-5 h-5 text-purple-500" />
                 ผลลัพธ์ (Caption)
               </h3>
               {result && (
                 <button 
                   onClick={() => {navigator.clipboard.writeText(result); toast.success('คัดลอกแล้ว')}}
                   className="text-slate-400 hover:text-blue-600 transition-colors"
                 >
                   <Copy className="w-5