
import React, { useEffect, useRef, useState } from 'react';
import { Sliders, Type, AlignLeft, RefreshCw, ImageOff, Layers, Circle, Move, ZoomIn, Square, Maximize, Minimize, Laptop2, Save, Download, MousePointer2 } from 'lucide-react';
import { AspectRatio } from '../types';
import toast from 'react-hot-toast';

interface LogoOverlayProps {
  baseImage: string;
  logoImage: string | null;
  aspectRatio: AspectRatio;
  onSave: (finalImage: string) => void;
}

const fonts = [
  { name: 'Mitr', label: 'Mitr (หัวข้อทันสมัย)' },
  { name: 'Anuphan', label: 'Anuphan (อ่านง่าย)' },
  { name: 'Sarabun', label: 'Sarabun (ทางการ)' },
  { name: 'Pattaya', label: 'Pattaya (ลายมือ)' },
  { name: 'Chonburi', label: 'Chonburi (วินเทจ)' },
  { name: 'Inter', label: 'Inter (English Modern)' },
  { name: 'Custom', label: '💻 ระบุชื่อฟอนต์เอง...' },
];

const LogoOverlay: React.FC<LogoOverlayProps> = ({ baseImage, logoImage, aspectRatio, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [loadedBaseImg, setLoadedBaseImg] = useState<HTMLImageElement | null>(null);
  const [loadedLogoImg, setLoadedLogoImg] = useState<HTMLImageElement | null>(null);
  const [imgError, setImgError] = useState<string | null>(null);

  // Transform State
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [scale, setScale] = useState(1);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Logo State
  const [logoSize, setLogoSize] = useState<number>(20);
  const [logoX, setLogoX] = useState<number>(85);
  const [logoY, setLogoY] = useState<number>(15);
  const [logoShape, setLogoShape] = useState<'circle' | 'square'>('circle');
  const [logoFit, setLogoFit] = useState<'cover' | 'contain'>('contain');
  const [logoInnerScale, setLogoInnerScale] = useState<number>(1.0);

  // Filters
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);

  // Text States
  const [isTextEnabled, setIsTextEnabled] = useState(false);
  const [textContent, setTextContent] = useState('ใส่หัวข้อหลักที่นี่');
  const [selectedFont, setSelectedFont] = useState('Mitr');
  const [customFontName, setCustomFontName] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textStrokeColor, setTextStrokeColor] = useState('#000000');
  const [isTextStrokeEnabled, setIsTextStrokeEnabled] = useState(true);
  const [textSize, setTextSize] = useState(8); 
  const [textXPosition, setTextXPosition] = useState(50);
  const [textYPosition, setTextYPosition] = useState(50);

  // Subtitle
  const [isSubtitleEnabled, setIsSubtitleEnabled] = useState(false);
  const [subtitleContent, setSubtitleContent] = useState('ใส่รายละเอียดเพิ่มเติม\nหรือคำโปรยรองที่นี่');
  const [subtitleFont, setSubtitleFont] = useState('Anuphan');
  const [customSubtitleFontName, setCustomSubtitleFontName] = useState('');
  const [subtitleColor, setSubtitleColor] = useState('#ffffff');
  const [subtitleStrokeColor, setSubtitleStrokeColor] = useState('#000000');
  const [isSubtitleStrokeEnabled, setIsSubtitleStrokeEnabled] = useState(false);
  const [subtitleSize, setSubtitleSize] = useState(5);
  const [subtitleX, setSubtitleX] = useState(50);
  const [subtitleY, setSubtitleY] = useState(65);

  // Layer Order
  const [layerOrder, setLayerOrder] = useState<'logo-top' | 'text-top'>('logo-top');

  // Reset transform when image changes
  useEffect(() => {
    setPanX(0);
    setPanY(0);
    setScale(1);
  }, [baseImage, aspectRatio]);

  // Load Base Image
  useEffect(() => {
    if (!baseImage) return;
    setImgError(null);
    setLoadedBaseImg(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setLoadedBaseImg(img);
    img.onerror = () => setImgError("ไม่สามารถโหลดรูปภาพได้");
    img.src = baseImage;
  }, [baseImage]);

  // Load Logo
  useEffect(() => {
    if (!logoImage) {
      setLoadedLogoImg(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setLoadedLogoImg(img);
    img.src = logoImage;
  }, [logoImage]);

  const getCanvasDimensions = (ratio: AspectRatio) => {
      switch (ratio) {
          case AspectRatio.SQUARE: return { w: 1080, h: 1080 };
          case AspectRatio.PORTRAIT: return { w: 1080, h: 1350 };
          case AspectRatio.PORTRAIT_LONG: return { w: 1080, h: 1500 };
          case AspectRatio.LANDSCAPE: return { w: 1280, h: 720 };
          default: return { w: 1080, h: 1080 };
      }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPanX(prev => prev + dx * 2);
      setPanY(prev => prev + dy * 2);
      setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  // Draw Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !loadedBaseImg) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { w, h } = getCanvasDimensions(aspectRatio);
    canvas.width = w;
    canvas.height = h;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const drawBase = () => {
        ctx.save(); 
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
        
        const scaleCoverX = canvas.width / loadedBaseImg.width;
        const scaleCoverY = canvas.height / loadedBaseImg.height;
        const baseScaleFactor = Math.max(scaleCoverX, scaleCoverY);
        
        const finalScale = baseScaleFactor * scale;
        const scaledWidth = loadedBaseImg.width * finalScale;
        const scaledHeight = loadedBaseImg.height * finalScale;
        
        const centerX = (canvas.width - scaledWidth) / 2;
        const centerY = (canvas.height - scaledHeight) / 2;

        const x = centerX + panX;
        const y = centerY + panY;

        ctx.drawImage(loadedBaseImg, x, y, scaledWidth, scaledHeight);
        ctx.restore(); 
    };

    const drawTextFn = (
        text: string, fontName: string, isCustomFont: boolean, customName: string, sizePct: number, color: string, stroke: string, hasStroke: boolean, xPct: number, yPct: number
    ) => {
        if (!text) return;
        ctx.save();
        const fontSizePx = (canvas.width * sizePct) / 100;
        const actualFont = (isCustomFont && customName) ? customName : fontName;
        ctx.font = `bold ${fontSizePx}px "${actualFont}", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const x = (canvas.width * xPct) / 100;
        const y = (canvas.height * yPct) / 100;
        const lines = text.split('\n');
        const lineHeight = fontSizePx * 1.3;
        const startY = y - ((lines.length - 1) * lineHeight) / 2;

        lines.forEach((line, index) => {
            const lineY = startY + (index * lineHeight);
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;

            if (hasStroke) {
                ctx.lineWidth = fontSizePx / 6;
                ctx.strokeStyle = stroke;
                ctx.lineJoin = 'round';
                ctx.strokeText(line, x, lineY);
            }
            ctx.fillStyle = color;
            ctx.fillText(line, x, lineY);
        });
        ctx.restore();
    };

    const drawLogoFn = () => {
        if (!loadedLogoImg) return;
        const areaSize = (canvas.width * logoSize) / 100;
        const centerX = (canvas.width * logoX) / 100;
        const centerY = (canvas.height * logoY) / 100;

        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.3)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 4;

        ctx.beginPath();
        if (logoShape === 'circle') {
            ctx.arc(centerX, centerY, areaSize / 2, 0, Math.PI * 2);
        } else {
            ctx.rect(centerX - areaSize / 2, centerY - areaSize / 2, areaSize, areaSize);
        }
        ctx.closePath();
        ctx.clip();

        const imgRatio = loadedLogoImg.width / loadedLogoImg.height;
        let drawW, drawH;

        if (logoFit === 'cover') {
            if (imgRatio > 1) {
                drawH = areaSize;
                drawW = areaSize * imgRatio;
            } else {
                drawW = areaSize;
                drawH = areaSize / imgRatio;
            }
        } else {
            if (imgRatio > 1) {
                drawW = areaSize;
                drawH = areaSize / imgRatio;
            } else {
                drawH = areaSize;
                drawW = areaSize * imgRatio;
            }
        }

        const finalW = drawW * logoInnerScale;
        const finalH = drawH * logoInnerScale;
        const drawX = centerX - finalW / 2;
        const drawY = centerY - finalH / 2;

        ctx.drawImage(loadedLogoImg, drawX, drawY, finalW, finalH);
        
        ctx.beginPath();
        ctx.lineWidth = areaSize * 0.02;
        ctx.strokeStyle = "white";
        if (logoShape === 'circle') {
            ctx.arc(centerX, centerY, areaSize / 2, 0, Math.PI * 2);
        } else {
            ctx.rect(centerX - areaSize / 2, centerY - areaSize / 2, areaSize, areaSize);
        }
        ctx.stroke();
        ctx.restore(); 
    };

    drawBase();

    const renderTexts = () => {
        if (isTextEnabled) {
            drawTextFn(
                textContent, selectedFont, selectedFont === 'Custom', customFontName,
                textSize, textColor, textStrokeColor, isTextStrokeEnabled, textXPosition, textYPosition
            );
        }
        if (isSubtitleEnabled) {
            drawTextFn(
                subtitleContent, subtitleFont, subtitleFont === 'Custom', customSubtitleFontName,
                subtitleSize, subtitleColor, subtitleStrokeColor, isSubtitleStrokeEnabled, subtitleX, subtitleY
            );
        }
    };

    if (layerOrder === 'text-top') {
        drawLogoFn();
        renderTexts();
    } else {
        renderTexts();
        drawLogoFn();
    }

  }, [
    loadedBaseImg, loadedLogoImg, aspectRatio,
    logoSize, logoX, logoY, logoShape, logoFit, logoInnerScale,
    brightness, contrast, saturation, panX, panY, scale,
    isTextEnabled, textContent, selectedFont, customFontName, textColor, textStrokeColor, isTextStrokeEnabled, textSize, textYPosition, textXPosition,
    isSubtitleEnabled, subtitleContent, subtitleFont, customSubtitleFontName, subtitleColor, subtitleStrokeColor, isSubtitleStrokeEnabled, subtitleSize, subtitleX, subtitleY,
    layerOrder
  ]);

  const handleManualSave = () => {
      if (canvasRef.current) {
          try {
              const dataUrl = canvasRef.current.toDataURL('image/png', 1.0);
              onSave(dataUrl);
          } catch (e) {
              console.error("Failed to save canvas", e);
          }
      }
  };

  const handleDirectDownload = () => {
      if (canvasRef.current) {
          const dataUrl = canvasRef.current.toDataURL('image/png', 1.0);
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = `studio-export-${Date.now()}.png`;
          a.click();
          toast.success('กำลังดาวน์โหลดไฟล์รูปภาพ...');
      }
  };

  if (imgError) {
      return (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
              <ImageOff className="w-12 h-12 mb-2 text-red-400" />
              <p className="font-bold text-red-600 mb-1">{imgError}</p>
          </div>
      )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full h-full">
      
      {/* Canvas Area */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] bg-slate-200/50 rounded-xl relative p-4">
        <div 
            className={`relative shadow-2xl cursor-move group ${isDragging ? 'cursor-grabbing' : ''}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{ touchAction: 'none', maxWidth: '100%', maxHeight: '100%' }}
        >
            <canvas ref={canvasRef} className="max-w-full max-h-[70vh] block bg-white shadow-black/20" />
            
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white text-[10px] px-3 py-1.5 rounded-full flex items-center gap-2 pointer-events-none opacity-70">
                <MousePointer2 className="w-3 h-3" /> Drag to Pan | Scroll to Zoom
            </div>
        </div>
      </div>
      
      {/* Controls Panel */}
      <div className="w-full lg:w-80 flex flex-col gap-4 h-full overflow-y-auto pr-2 pb-20">
        
        <div className="grid grid-cols-2 gap-2">
            <button 
                onClick={handleDirectDownload}
                className="py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors"
            >
                <Download className="w-4 h-4" /> โหลดรูป
            </button>
            <button 
                onClick={handleManualSave}
                className="py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-colors"
            >
                <Save className="w-4 h-4" /> เพิ่มในแผน
            </button>
        </div>

        {/* Image Settings */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-slate-500" /> <span className="text-xs font-bold text-slate-700">พื้นหลัง</span>
            </div>
            <div className="p-4 space-y-3">
                <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>ซูม (Zoom)</span>
                        <span>{Math.round(scale * 100)}%</span>
                    </div>
                    <input type="range" min="0.5" max="3.0" step="0.1" value={scale} onChange={(e) => setScale(Number(e.target.value))} className="w-full h-1.5 accent-blue-600 bg-slate-100 rounded-lg" />
                </div>
                 <div className="grid grid-cols-3 gap-2">
                     {/* Filters */}
                     <div className="text-center">
                        <span className="text-[9px] text-slate-400">แสง</span>
                        <input type="range" min="0" max="200" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="w-full h-1 accent-slate-400 bg-slate-100 rounded-lg" />
                     </div>
                     <div className="text-center">
                        <span className="text-[9px] text-slate-400">คมชัด</span>
                        <input type="range" min="0" max="200" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="w-full h-1 accent-slate-400 bg-slate-100 rounded-lg" />
                     </div>
                     <div className="text-center">
                        <span className="text-[9px] text-slate-400">สีสด</span>
                        <input type="range" min="0" max="200" value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} className="w-full h-1 accent-slate-400 bg-slate-100 rounded-lg" />
                     </div>
                </div>
            </div>
        </div>

        {/* Text Config */}
        <div className={`rounded-xl border border-slate-200 overflow-hidden transition-all ${isTextEnabled ? 'bg-white shadow-sm' : 'bg-slate-50 opacity-75'}`}>
             <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between cursor-pointer" onClick={() => setIsTextEnabled(!isTextEnabled)}>
                <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-blue-600" /> <span className="text-xs font-bold text-slate-700">ข้อความหลัก</span>
                </div>
                <input type="checkbox" checked={isTextEnabled} onChange={() => {}} className="w-3.5 h-3.5 accent-blue-600" />
            </div>
            
            {isTextEnabled && (
                <div className="p-4 space-y-3">
                    <textarea value={textContent} onChange={(e) => setTextContent(e.target.value)} rows={2} className="w-full p-2 text-xs border rounded-md bg-slate-50 focus:bg-white transition-colors" placeholder="พิมพ์ข้อความ..." />
                    <div className="flex gap-2">
                        <select value={selectedFont} onChange={(e) => setSelectedFont(e.target.value)} className="flex-1 p-1 text-xs border rounded bg-white">
                            {fonts.map(f => <option key={f.name} value={f.name}>{f.label}</option>)}
                        </select>
                        <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-8 h-full p-0 border-0 rounded cursor-pointer" />
                    </div>
                    {/* Size & Stroke */}
                    <div className="grid grid-cols-2 gap-3">
                         <div>
                             <span className="text-[10px] text-slate-500 block mb-1">ขนาด</span>
                             <input type="range" min="5" max="40" value={textSize} onChange={(e) => setTextSize(Number(e.target.value))} className="w-full h-1.5 accent-blue-600 bg-slate-100 rounded-lg" />
                         </div>
                         <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] text-slate-500">เส้นขอบ</span>
                                <input type="checkbox" checked={isTextStrokeEnabled} onChange={(e) => setIsTextStrokeEnabled(e.target.checked)} className="w-3 h-3" />
                            </div>
                            <input type="color" disabled={!isTextStrokeEnabled} value={textStrokeColor} onChange={(e) => setTextStrokeColor(e.target.value)} className="w-full h-4 border-0 rounded cursor-pointer disabled:opacity-30" />
                         </div>
                    </div>
                    {/* Position */}
                    <div className="bg-slate-50 p-2 rounded border border-slate-100">
                         <span className="text-[9px] text-slate-400 block mb-1 text-center">ตำแหน่ง</span>
                         <div className="grid grid-cols-2 gap-2">
                             <input type="range" min="0" max="100" value={textXPosition} onChange={(e) => setTextXPosition(Number(e.target.value))} className="w-full h-1.5 accent-blue-600" />
                             <input type="range" min="0" max="100" value={textYPosition} onChange={(e) => setTextYPosition(Number(e.target.value))} className="w-full h-1.5 accent-blue-600" />
                         </div>
                    </div>
                </div>
            )}
        </div>

        {/* Subtitle Config */}
        <div className={`rounded-xl border border-slate-200 overflow-hidden transition-all ${isSubtitleEnabled ? 'bg-white shadow-sm' : 'bg-slate-50 opacity-75'}`}>
             <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between cursor-pointer" onClick={() => setIsSubtitleEnabled(!isSubtitleEnabled)}>
                <div className="flex items-center gap-2">
                    <AlignLeft className="w-4 h-4 text-indigo-600" /> <span className="text-xs font-bold text-slate-700">ข้อความรอง</span>
                </div>
                <input type="checkbox" checked={isSubtitleEnabled} onChange={() => {}} className="w-3.5 h-3.5 accent-indigo-600" />
            </div>
             {isSubtitleEnabled && (
                <div className="p-4 space-y-3">
                    <textarea value={subtitleContent} onChange={(e) => setSubtitleContent(e.target.value)} rows={2} className="w-full p-2 text-xs border rounded-md bg-slate-50 focus:bg-white transition-colors" placeholder="พิมพ์ข้อความรอง..." />
                    <div className="flex gap-2">
                        <select value={subtitleFont} onChange={(e) => setSubtitleFont(e.target.value)} className="flex-1 p-1 text-xs border rounded bg-white">
                            {fonts.map(f => <option key={f.name} value={f.name}>{f.label}</option>)}
                        </select>
                        <input type="color" value={subtitleColor} onChange={(e) => setSubtitleColor(e.target.value)} className="w-8 h-full p-0 border-0 rounded cursor-pointer" />
                    </div>
                     <div className="bg-slate-50 p-2 rounded border border-slate-100">
                         <div className="grid grid-cols-2 gap-2">
                             <input type="range" min="0" max="100" value={subtitleX} onChange={(e) => setSubtitleX(Number(e.target.value))} className="w-full h-1.5 accent-indigo-600" />
                             <input type="range" min="0" max="100" value={subtitleY} onChange={(e) => setSubtitleY(Number(e.target.value))} className="w-full h-1.5 accent-indigo-600" />
                         </div>
                    </div>
                </div>
            )}
        </div>

        {/* Logo Config */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-green-50 px-4 py-2 border-b border-green-100 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-green-600" /> <span className="text-xs font-bold text-green-800">โลโก้</span>
            </div>
            {loadedLogoImg ? (
                <div className="p-4 space-y-3">
                     <div className="flex bg-slate-100 rounded p-1 mb-2">
                        <button onClick={() => setLogoShape('circle')} className={`flex-1 py-1 rounded text-xs ${logoShape === 'circle' ? 'bg-white shadow text-green-600' : 'text-slate-400'}`}><Circle className="w-3 h-3 mx-auto" /></button>
                        <button onClick={() => setLogoShape('square')} className={`flex-1 py-1 rounded text-xs ${logoShape === 'square' ? 'bg-white shadow text-green-600' : 'text-slate-400'}`}><Square className="w-3 h-3 mx-auto" /></button>
                        <div className="w-px bg-slate-300 mx-1"></div>
                        <button onClick={() => setLogoFit('cover')} className={`flex-1 py-1 rounded text-xs ${logoFit === 'cover' ? 'bg-white shadow text-green-600' : 'text-slate-400'}`}><Maximize className="w-3 h-3 mx-auto" /></button>
                        <button onClick={() => setLogoFit('contain')} className={`flex-1 py-1 rounded text-xs ${logoFit === 'contain' ? 'bg-white shadow text-green-600' : 'text-slate-400'}`}><Minimize className="w-3 h-3 mx-auto" /></button>
                    </div>
                    <div>
                        <span className="text-[10px] text-slate-500">ขนาดกรอบ</span>
                        <input type="range" min="5" max="80" value={logoSize} onChange={(e) => setLogoSize(Number(e.target.value))} className="w-full h-1.5 accent-green-600 bg-slate-100 rounded-lg" />
                    </div>
                    <div>
                        <span className="text-[10px] text-slate-500">ขยายภาพข้างใน</span>
                        <input type="range" min="0.1" max="3.0" step="0.1" value={logoInnerScale} onChange={(e) => setLogoInnerScale(Number(e.target.value))} className="w-full h-1.5 accent-green-600 bg-slate-100 rounded-lg" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                         <input type="range" min="0" max="100" value={logoX} onChange={(e) => setLogoX(Number(e.target.value))} className="w-full h-1.5 accent-green-600" />
                         <input type="range" min="0" max="100" value={logoY} onChange={(e) => setLogoY(Number(e.target.value))} className="w-full h-1.5 accent-green-600" />
                    </div>
                </div>
            ) : (
                <div className="p-4 text-center text-xs text-slate-400 italic">
                    ยังไม่ได้เลือกโลโก้
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default LogoOverlay;
