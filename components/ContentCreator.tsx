import React, { useState } from 'react';
import { generateFBCaption, generateIllustration } from '../services/geminiService';
import { Loader2, Sparkles, Copy, Image as ImageIcon, Type } from 'lucide-react';
import toast from 'react-hot-toast';

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
      const captionResult = await generateFBCaption(inputText, tone);
      
      if (captionResult.caption) {
         setResult(captionResult.caption);
      }

      if (captionResult.imagePrompt) {
         const imageUrl = await generateIllustration(captionResult.imagePrompt, style);
         setGeneratedImage(imageUrl);
      }

      toast.success('สร้างคอนเทนต์สำเร็จ!');
    } catch (error) {
      console.error(error);
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      {/* ฝั่งซ้าย: Input */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4 text-slate-800">
            <span className="bg-blue-100 p-2 rounded-lg text-blue-600 font-bold">1</span>
            <h2 className="font-bold text-lg">เขียนเนื้อหาและสรุป</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">ต้นฉบับ</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full h-40 p-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                placeholder="วางเนื้อหาที่ต้องการ..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Mood & Tone</label>
                <select 
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-white"
                >
                  <option>มืออาชีพและน่าเชื่อถือ</option>
                  <option>สนุกสนาน เป็นกันเอง</option>
                  <option>ขายของแบบ Hard Sale</option>
                  <option>เล่าเรื่อง (Storytelling)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">สไตล์ภาพ</label>
                <select 
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-white"
                >
                   <option>ลายเส้นสะอาดตา (Clean Line Art)</option>
                   <option>ภาพสีน้ำ (Watercolor)</option>
                   <option>ภาพถ่ายจริง (Realistic Photo)</option>
                   <option>ภาพวาดดิจิตอล (Digital Art)</option>
                   <option>3D Render</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isLoading}