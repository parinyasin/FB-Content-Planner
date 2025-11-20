
import React, { useEffect, useRef, useState } from 'react';
import { Sliders, Type, AlignLeft, RefreshCw, ImageOff, Layers, Circle, Move, ZoomIn, Square, Maximize, Minimize, Laptop2, Scaling } from 'lucide-react';
import { AspectRatio } from '../types';

interface LogoOverlayProps {
  baseImage: string;
  logoImage: string | null;
  aspectRatio: AspectRatio;
  onSave: (finalImage: string) => void;
}

// Expanded font list with common Thai system fonts
const fonts = [
  { name: 'Mitr', label: 'Mitr (หัวข้อทันสมัย - Google)' },
  { name: 'Anuphan', label: 'Anuphan (อ่านง่าย - Google)' },
  { name: 'Sarabun', label: 'Sarabun (ทางการ - Google)' },
  { name: 'Pattaya', label: 'Pattaya (ลายมือ - Google)' },
  { name: 'Chonburi', label: 'Chonburi (วินเทจ - Google)' },
  { name: 'Sukhumvit Set', label: 'Sukhumvit Set (iOS System)' },
  { name: 'Thonburi', label: 'Thonburi (Mac System)' },
  { name: 'Leelawadee UI', label: 'Leelawadee UI (Windows System)' },
  { name: 'Custom', label: '💻 ระบุชื่อฟอนต์เอง...' },
];

const LogoOverlay: React.FC<LogoOverlayProps> = ({ baseImage, logoImage, aspectRatio, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const saveTimeoutRef = useRef<any>(null);
  
  const [loadedBaseImg, setLoadedBaseImg] = useState<HTMLImageElement | null>(null);
  const [loadedLogoImg, setLoadedLogoImg] = useState<HTMLImageElement | null>(null);
  const [imgError, setImgError] = useState<string | null>(null);

  // Transform State (Pan & Zoom)
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [scale, setScale] = useState(1); // 1 = Default 'Cover' fit
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Logo State
  const [logoSize, setLogoSize] = useState<number>(20);
  const [logoX, setLogoX] = useState<number>(85);
  const [logoY, setLogoY] = useState<number>(15);
  const [logoShape, setLogoShape] = useState<'circle' | 'square'>('circle');
  const [logoFit, setLogoFit] = useState<'cover' | 'contain'>('contain'); // Default to contain to avoid cutting off logos
  const [logoInnerScale, setLogoInnerScale] = useState<number>(1.0); // Scale logo inside its box

  // Filters
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(110);

  // Text States
  const [isTextEnabled, setIsTextEnabled] = useState(false);
  const [textContent, setTextContent] = useState('ใส่หัวข้อหลักที่นี่');
  const [selectedFont, setSelectedFont] = useState('Mitr');
  const [customFontName, setCustomFontName] = useState(''); // User defined font
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
  const [customSubtitleFontName, setCustomSubtitleFontName] = useState(''); // User defined font for subtitle
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
    img.onerror = () => setImgError("ไม่สามารถโหลดรูปภาพได้ กรุณาลองใหม่");
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

  // Helper to get canvas dimensions based on Aspect Ratio
  const getCanvasDimensions = (ratio: AspectRatio) => {
      switch (ratio) {
          case AspectRatio.SQUARE: return { w: 1080, h: 1080 };
          case AspectRatio.PORTRAIT: return { w: 1080, h: 1350 };
          case AspectRatio.PORTRAIT_LONG: return { w: 1080, h: 1500 };
          case AspectRatio.LANDSCAPE: return { w: 1280, h: 720 };
          default: return { w: 1080, h: 1080 };
      }
  };

  // Drag Handlers
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

    // 1. Set Canvas Size
    const { w, h } = getCanvasDimensions(aspectRatio);
    canvas.width = w;
    canvas.height = h;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Draw Base Image with Pan & Zoom
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

    // 3. Helper for Text
    const drawTextFn = (
        text: string, fontName: string, isCustomFont: boolean, customName: string, sizePct: number, color: string, stroke: string, hasStroke: boolean, xPct: number, yPct: number
    ) => {
        if (!text) return;
        ctx.save();
        
        const fontSizePx = (canvas.width * sizePct) / 100;
        // Use custom font name if selected, otherwise use predefined font
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

    // 4. Helper for Logo
    const drawLogoFn = () => {
        if (!loadedLogoImg) return;
        
        // Define Area
        const areaSize = (canvas.width * logoSize) / 100; // diameter or side length
        const centerX = (canvas.width * logoX) / 100;
        const centerY = (canvas.height * logoY) / 100;

        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.3)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 4;

        // Clip Path
        ctx.beginPath();
        if (logoShape === 'circle') {
            ctx.arc(centerX, centerY, areaSize / 2, 0, Math.PI * 2);
        } else {
            ctx.rect(centerX - areaSize / 2, centerY - areaSize / 2, areaSize, areaSize);
        }
        ctx.closePath();
        ctx.clip();

        // Calculate Aspect Ratio & Draw Dimensions
        const imgRatio = loadedLogoImg.width / loadedLogoImg.height;
        let drawW, drawH;

        if (logoFit === 'cover') {
            // Cover: Fill the area (crop excess)
            if (imgRatio > 1) {
                // Wider: Height = areaSize, Width = Scaled
                drawH = areaSize;
                drawW = areaSize * imgRatio;
            } else {
                // Taller: Width = areaSize, Height = Scaled
                drawW = areaSize;
                drawH = areaSize / imgRatio;
            }
        } else {
            // Contain: Fit inside (show full image)
            if (imgRatio > 1) {
                // Wider: Width = areaSize, Height = Scaled
                drawW = areaSize;
                drawH = areaSize / imgRatio;
            } else {
                // Taller: Height = areaSize, Width = Scaled
                drawH = areaSize;
                drawW = areaSize * imgRatio;
            }
        }

        // Apply manual inner scaling (Zoom logo inside the shape)
        const finalW = drawW * logoInnerScale;
        const finalH = drawH * logoInnerScale;

        const drawX = centerX - finalW / 2;
        const drawY = centerY - finalH / 2;

        ctx.drawImage(loadedLogoImg, drawX, drawY, finalW, finalH);
        
        // Border
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

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
        try {
            const dataUrl = canvas.toDataURL('image/png');
            onSave(dataUrl);
        } catch (e: any) {
            console.warn("Canvas export skipped");
        }
    }, 300);

  }, [
    loadedBaseImg, loadedLogoImg, aspectRatio,
    logoSize, logoX, logoY, logoShape, logoFit, logoInnerScale,
    brightness, contrast, saturation, panX, panY, scale,
    isTextEnabled, textContent, selectedFont, customFontName, textColor, textStrokeColor, isTextStrokeEnabled, textSize, textYPosition, textXPosition,
    isSubtitleEnabled, subtitleContent, subtitleFont, customSubtitleFontName, subtitleColor, subtitleStrokeColor, isSubtitleStrokeEnabled, subtitleSize, subtitleX, subtitleY,
    layerOrder,
    onSave
  ]);

  if (imgError) {
      return (
          <div className="w-full h-64 bg-red-50 rounded-lg flex flex-col items-center justify-center text-slate-500 border border-dashed border-red-300 p-4 text-center">
              <ImageOff className="w-10 h-10 mb-2 text-red-400" />
              <p className="font-bold text-red-600 mb-1 text-sm">{imgError}</p>
          </div>
      )
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full">
      
      {/* Canvas Container - Full Scale Display */}
      <div className="flex-1 flex flex-col items-center justify-start bg-slate-100 p-2 rounded-lg overflow-hidden min-h-[500px]">
        <div 
            className={`relative shadow-2xl cursor-move group ${isDragging ? 'cursor-grabbing' : ''}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{ touchAction: 'none', maxWidth: '100%' }}
        >
            <canvas ref={canvasRef} className="max-w-full max-h-[70vh] block bg-white" />
            
            {/* Hover Hint */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center gap-1">
                <Move className="w-3 h-3" /> ลากเพื่อจัดตำแหน่ง
            </div>
        </div>
      </div>
      
      {/* Controls Sidebar */}
      <div className="w-full md:w-80 flex flex-col gap-3 h-full overflow-y-auto pr-1">
        
        {/* Layer Settings */}
        <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
            <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                 <Layers className="w-4 h-4 text-slate-500" /> ลำดับชั้น (Layer)
            </h3>
            <div className="flex bg-slate-100 rounded-md p-1">
                <button 
                    onClick={() => setLayerOrder('text-top')}
                    className={`px-2 py-1 text-[10px] font-medium rounded transition-all flex items-center gap-1 ${layerOrder === 'text-top' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                >
                    <Type className="w-3 h-3" /> ข้อความทับ
                </button>
                <button 
                    onClick={() => setLayerOrder('logo-top')}
                    className={`px-2 py-1 text-[10px] font-medium rounded transition-all flex items-center gap-1 ${layerOrder === 'logo-top' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                >
                    <Circle className="w-3 h-3" /> โลโก้ทับ
                </button>
            </div>
        </div>

         {/* Image Adjustments (Zoom & Filter) */}
         <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2 mb-2">
                 <Sliders className="w-4 h-4 text-slate-500" /> ปรับแต่งภาพพื้นหลัง
            </h3>
            
            {/* Zoom Control */}
            <div className="mb-3 pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1"><ZoomIn className="w-3 h-3" /> ย่อ/ขยาย (Zoom)</span>
                    <span className="text-[10px] text-slate-400">{Math.round(scale * 100)}%</span>
                </div>
                <input 
                    type="range" 
                    min="0.5" 
                    max="3.0" 
                    step="0.1" 
                    value={scale} 
                    onChange={(e) => setScale(Number(e.target.value))} 
                    className="w-full h-1.5 accent-blue-600 bg-slate-200 rounded-lg" 
                />
            </div>

            {/* Color Filters */}
            <div className="grid grid-cols-3 gap-2">
                 <div className="text-center">
                    <span className="text-[10px] text-slate-400">แสง</span>
                    <input type="range" min="0" max="200" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="w-full h-1.5 accent-slate-600 bg-slate-200 rounded-lg" />
                 </div>
                 <div className="text-center">
                    <span className="text-[10px] text-slate-400">คมชัด</span>
                    <input type="range" min="0" max="200" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="w-full h-1.5 accent-slate-600 bg-slate-200 rounded-lg" />
                 </div>
                 <div className="text-center">
                    <span className="text-[10px] text-slate-400">สีสด</span>
                    <input type="range" min="0" max="200" value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} className="w-full h-1.5 accent-slate-600 bg-slate-200 rounded-lg" />
                 </div>
            </div>
        </div>

        {/* 1. Main Text Toggle */}
        <div className={`p-3 rounded-lg border border-slate-200 transition-all ${isTextEnabled ? 'bg-white border-l-4 border-l-blue-500 shadow-sm' : 'bg-slate-50 opacity-80'}`}>
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                    <Type className="w-4 h-4 text-blue-600" /> หัวข้อหลัก
                </h3>
                <input type="checkbox" checked={isTextEnabled} onChange={(e) => setIsTextEnabled(e.target.checked)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
            </div>
            {isTextEnabled && (
                <div className="space-y-3 animate-fade-in pt-2 border-t border-slate-100">
                    <textarea value={textContent} onChange={(e) => setTextContent(e.target.value)} rows={2} className="w-full p-2 text-xs border rounded-md" placeholder="พิมพ์ข้อความ..." />
                    
                    <div className="space-y-2">
                         <select value={selectedFont} onChange={(e) => setSelectedFont(e.target.value)} className="w-full p-1 text-xs border rounded bg-white">
                            {fonts.map(f => <option key={f.name} value={f.name}>{f.label}</option>)}
                        </select>
                        {selectedFont === 'Custom' && (
                            <div className="flex items-center gap-2">
                                <Laptop2 className="w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    value={customFontName} 
                                    onChange={(e) => setCustomFontName(e.target.value)}
                                    placeholder="เช่น Angsana New"
                                    className="flex-1 p-1 text-xs border rounded-md bg-slate-50 focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2">
                             <span className="text-[10px] text-slate-500">ขนาด</span>
                             <input type="range" min="5" max="40" value={textSize} onChange={(e) => setTextSize(Number(e.target.value))} className="flex-1 accent-blue-600" />
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1">
                             <span className="text-[10px] text-slate-500">สี</span>
                             <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-full h-6 rounded cursor-pointer border-0" />
                        </div>
                        <div className="flex items-center gap-1">
                             <input type="checkbox" checked={isTextStrokeEnabled} onChange={(e) => setIsTextStrokeEnabled(e.target.checked)} className="w-3 h-3" id="txtStroke" />
                             <label htmlFor="txtStroke" className="text-[10px] text-slate-500 mr-1">ขอบ</label>
                             {isTextStrokeEnabled && (
                                <input type="color" value={textStrokeColor} onChange={(e) => setTextStrokeColor(e.target.value)} className="flex-1 h-6 rounded cursor-pointer border-0" />
                             )}
                        </div>
                    </div>
                    
                    {/* Positioning Controls */}
                    <div className="pt-1 bg-slate-50 p-2 rounded">
                         <span className="text-[10px] text-slate-500 block mb-1 font-semibold">ตำแหน่งข้อความ</span>
                         <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400 w-8">แนวนอน</span>
                                <input type="range" min="0" max="100" value={textXPosition} onChange={(e) => setTextXPosition(Number(e.target.value))} className="flex-1 h-1.5 accent-blue-600 bg-slate-200 rounded-lg cursor-pointer" />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400 w-8">แนวตั้ง</span>
                                <input type="range" min="0" max="100" value={textYPosition} onChange={(e) => setTextYPosition(Number(e.target.value))} className="flex-1 h-1.5 accent-blue-600 bg-slate-200 rounded-lg cursor-pointer" />
                            </div>
                         </div>
                    </div>
                </div>
            )}
        </div>

        {/* 2. Subtitle Toggle */}
        <div className={`p-3 rounded-lg border border-slate-200 transition-all ${isSubtitleEnabled ? 'bg-white border-l-4 border-l-indigo-500 shadow-sm' : 'bg-slate-50 opacity-80'}`}>
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                    <AlignLeft className="w-4 h-4 text-indigo-600" /> ข้อความรอง
                </h3>
                <input type="checkbox" checked={isSubtitleEnabled} onChange={(e) => setIsSubtitleEnabled(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
            </div>
            {isSubtitleEnabled && (
                <div className="space-y-3 animate-fade-in pt-2 border-t border-slate-100">
                    <textarea value={subtitleContent} onChange={(e) => setSubtitleContent(e.target.value)} rows={2} className="w-full p-2 text-xs border rounded-md" placeholder="พิมพ์ข้อความรอง..." />
                    
                    <div className="space-y-2">
                         <select value={subtitleFont} onChange={(e) => setSubtitleFont(e.target.value)} className="w-full p-1 text-xs border rounded bg-white">
                            {fonts.map(f => <option key={f.name} value={f.name}>{f.label}</option>)}
                        </select>
                        {subtitleFont === 'Custom' && (
                            <div className="flex items-center gap-2">
                                <Laptop2 className="w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    value={customSubtitleFontName} 
                                    onChange={(e) => setCustomSubtitleFontName(e.target.value)}
                                    placeholder="ชื่อฟอนต์ในเครื่อง"
                                    className="flex-1 p-1 text-xs border rounded-md bg-slate-50 focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                         <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500">ขนาด</span>
                            <input type="range" min="2" max="20" value={subtitleSize} onChange={(e) => setSubtitleSize(Number(e.target.value))} className="flex-1 accent-indigo-600" />
                         </div>
                         <div className="flex items-center gap-1">
                             <span className="text-[10px] text-slate-500">สี</span>
                             <input type="color" value={subtitleColor} onChange={(e) => setSubtitleColor(e.target.value)} className="w-full h-6 rounded cursor-pointer border-0" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                         <div className="flex items-center gap-1">
                            <input type="checkbox" checked={isSubtitleStrokeEnabled} onChange={(e) => setIsSubtitleStrokeEnabled(e.target.checked)} className="w-3 h-3" id="subStroke" />
                            <label htmlFor="subStroke" className="text-[10px] text-slate-500 mr-1">ใส่ขอบ</label>
                         </div>
                         {isSubtitleStrokeEnabled && (
                            <input type="color" value={subtitleStrokeColor} onChange={(e) => setSubtitleStrokeColor(e.target.value)} className="w-full h-6 rounded cursor-pointer border-0" />
                         )}
                    </div>
                    
                     <div className="pt-1 bg-slate-50 p-2 rounded">
                         <span className="text-[10px] text-slate-500 block mb-1 font-semibold">ตำแหน่งข้อความรอง</span>
                         <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400 w-8">แนวนอน</span>
                                <input type="range" min="0" max="100" value={subtitleX} onChange={(e) => setSubtitleX(Number(e.target.value))} className="flex-1 h-1.5 accent-indigo-600 bg-slate-200 rounded-lg cursor-pointer" />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400 w-8">แนวตั้ง</span>
                                <input type="range" min="0" max="100" value={subtitleY} onChange={(e) => setSubtitleY(Number(e.target.value))} className="flex-1 h-1.5 accent-indigo-600 bg-slate-200 rounded-lg cursor-pointer" />
                            </div>
                         </div>
                    </div>
                </div>
            )}
        </div>

        {/* 3. Logo */}
        {loadedLogoImg && (
            <div className="p-3 bg-white rounded-lg border border-slate-200 border-l-4 border-l-green-500 shadow-sm">
                <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2 mb-2">
                    <RefreshCw className="w-4 h-4 text-green-600" /> ปรับแต่งโลโก้
                </h3>
                <div className="space-y-2">
                     {/* Shape & Fit */}
                     <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="flex bg-slate-100 rounded p-1">
                            <button onClick={() => setLogoShape('circle')} className={`flex-1 py-1 flex justify-center rounded transition-all ${logoShape === 'circle' ? 'bg-white shadow text-green-600' : 'text-slate-400 hover:text-green-500'}`} title="วงกลม"><Circle className="w-4 h-4" /></button>
                            <button onClick={() => setLogoShape('square')} className={`flex-1 py-1 flex justify-center rounded transition-all ${logoShape === 'square' ? 'bg-white shadow text-green-600' : 'text-slate-400 hover:text-green-500'}`} title="สี่เหลี่ยม"><Square className="w-4 h-4" /></button>
                        </div>
                         <div className="flex bg-slate-100 rounded p-1">
                            <button onClick={() => setLogoFit('cover')} className={`flex-1 py-1 flex justify-center rounded transition-all ${logoFit === 'cover' ? 'bg-white shadow text-green-600' : 'text-slate-400 hover:text-green-500'}`} title="เต็มกรอบ (ตัดส่วนเกิน)"><Maximize className="w-4 h-4" /></button>
                            <button onClick={() => setLogoFit('contain')} className={`flex-1 py-1 flex justify-center rounded transition-all ${logoFit === 'contain' ? 'bg-white shadow text-green-600' : 'text-slate-400 hover:text-green-500'}`} title="พอดี (เห็นครบ)"><Minimize className="w-4 h-4" /></button>
                        </div>
                     </div>

                     <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 w-10">ขยายภาพ</span>
                        <input type="range" min="0.1" max="3.0" step="0.1" value={logoInnerScale} onChange={(e) => setLogoInnerScale(Number(e.target.value))} className="flex-1 h-1.5 accent-green-600 bg-slate-200 rounded-lg" />
                        <span className="text-[9px] text-slate-400 w-6 text-right">{Math.round(logoInnerScale * 100)}%</span>
                     </div>

                     <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 w-10">ขนาดกรอบ</span>
                        <input type="range" min="5" max="80" value={logoSize} onChange={(e) => setLogoSize(Number(e.target.value))} className="flex-1 h-1.5 accent-green-600 bg-slate-200 rounded-lg" />
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 w-10">แนวนอน</span>
                        <input type="range" min="0" max="100" value={logoX} onChange={(e) => setLogoX(Number(e.target.value))} className="flex-1 h-1.5 accent-green-600 bg-slate-200 rounded-lg" />
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 w-10">แนวตั้ง</span>
                         <input type="range" min="0" max="100" value={logoY} onChange={(e) => setLogoY(Number(e.target.value))} className="flex-1 h-1.5 accent-green-600 bg-slate-200 rounded-lg" />
                     </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default LogoOverlay;
