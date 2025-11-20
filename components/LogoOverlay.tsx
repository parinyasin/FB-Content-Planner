
import React, { useEffect, useRef, useState } from 'react';
import { Sliders, Type, Move, Layers, RefreshCw, Monitor, AlignLeft } from 'lucide-react';

interface LogoOverlayProps {
  baseImage: string;
  logoImage: string | null;
  onSave: (finalImage: string) => void;
}

const fonts = [
  { name: 'Anuphan', label: 'Anuphan (อ่านง่าย)' },
  { name: 'Mitr', label: 'Mitr (หัวข้อทันสมัย)' },
  { name: 'Sarabun', label: 'Sarabun (ทางการ)' },
  { name: 'Pattaya', label: 'Pattaya (ลายมือ)' },
  { name: 'Chonburi', label: 'Chonburi (วินเทจ)' },
];

const LogoOverlay: React.FC<LogoOverlayProps> = ({ baseImage, logoImage, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Preloaded Images State
  const [loadedBaseImg, setLoadedBaseImg] = useState<HTMLImageElement | null>(null);
  const [loadedLogoImg, setLoadedLogoImg] = useState<HTMLImageElement | null>(null);

  // Logo State
  const [logoSize, setLogoSize] = useState<number>(20); // Percentage of width
  const [logoX, setLogoX] = useState<number>(85); // Percentage X (0-100)
  const [logoY, setLogoY] = useState<number>(85); // Percentage Y (0-100)

  // Image Filter State
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);

  // --- Main Text State ---
  const [isTextEnabled, setIsTextEnabled] = useState(false);
  const [textContent, setTextContent] = useState('ใส่หัวข้อหลักที่นี่');
  const [selectedFont, setSelectedFont] = useState('Mitr');
  const [customFont, setCustomFont] = useState(''); // For System Fonts
  const [textColor, setTextColor] = useState('#ffffff');
  const [textStrokeColor, setTextStrokeColor] = useState('#000000');
  const [isTextStrokeEnabled, setIsTextStrokeEnabled] = useState(true);
  const [textSize, setTextSize] = useState(10); // Percentage
  const [textXPosition, setTextXPosition] = useState(50);
  const [textYPosition, setTextYPosition] = useState(50);

  // --- Secondary Text (Subtitle) State ---
  const [isSubtitleEnabled, setIsSubtitleEnabled] = useState(false);
  const [subtitleContent, setSubtitleContent] = useState('ใส่รายละเอียดเพิ่มเติม\nหรือคำโปรยรองที่นี่');
  const [subtitleFont, setSubtitleFont] = useState('Anuphan');
  const [subtitleCustomFont, setSubtitleCustomFont] = useState('');
  const [subtitleColor, setSubtitleColor] = useState('#ffffff');
  const [subtitleStrokeColor, setSubtitleStrokeColor] = useState('#000000');
  const [isSubtitleStrokeEnabled, setIsSubtitleStrokeEnabled] = useState(true);
  const [subtitleSize, setSubtitleSize] = useState(5); // Percentage
  const [subtitleX, setSubtitleX] = useState(50);
  const [subtitleY, setSubtitleY] = useState(65);

  // Layering
  const [layerPriority, setLayerPriority] = useState<'logo' | 'text'>('logo');

  // 1. Preload Base Image
  useEffect(() => {
    if (!baseImage) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = baseImage;
    img.onload = () => setLoadedBaseImg(img);
    img.onerror = () => console.error("Failed to load base image");
  }, [baseImage]);

  // 2. Preload Logo Image
  useEffect(() => {
    if (!logoImage) {
      setLoadedLogoImg(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = logoImage;
    img.onload = () => setLoadedLogoImg(img);
    img.onerror = () => console.error("Failed to load logo image");
  }, [logoImage]);

  // 3. Draw Canvas Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !loadedBaseImg) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set Dimensions
    canvas.width = loadedBaseImg.width;
    canvas.height = loadedBaseImg.height;

    // --- Helper Functions ---
    const drawBase = () => {
        ctx.save(); 
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
        ctx.drawImage(loadedBaseImg, 0, 0);
        ctx.restore(); 
    };

    const drawTextBlock = (
        text: string, 
        fontName: string, 
        customFontName: string,
        sizePercent: number, 
        color: string, 
        strokeColor: string, 
        hasStroke: boolean,
        xPercent: number, 
        yPercent: number
    ) => {
        if (!text) return;
        ctx.save();
        
        // Use custom font if provided, else fallback to selected web font
        const finalFont = customFontName.trim() ? customFontName.trim() : fontName;
        
        const fontSizePx = (canvas.width * sizePercent) / 100;
        ctx.font = `bold ${fontSizePx}px "${finalFont}", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const x = (canvas.width * xPercent) / 100;
        const y = (canvas.height * yPercent) / 100;
        
        const lines = text.split('\n');
        const lineHeight = fontSizePx * 1.3;
        const startY = y - ((lines.length - 1) * lineHeight) / 2;

        lines.forEach((line, index) => {
            const lineY = startY + (index * lineHeight);
            
            // Shadow/Glow
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;

            // Stroke
            if (hasStroke && strokeColor !== 'transparent') {
                ctx.lineWidth = fontSizePx / 8;
                ctx.strokeStyle = strokeColor;
                ctx.lineJoin = 'round';
                ctx.strokeText(line, x, lineY);
            }

            // Fill
            ctx.fillStyle = color;
            ctx.fillText(line, x, lineY);
        });
        ctx.restore();
    };

    const drawLogo = () => {
        if (!loadedLogoImg) return;
        const diameter = (canvas.width * logoSize) / 100;
        const radius = diameter / 2;
        const centerX = (canvas.width * logoX) / 100;
        const centerY = (canvas.height * logoY) / 100;

        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.3)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        const imgRatio = loadedLogoImg.width / loadedLogoImg.height;
        let renderW, renderH;

        if (imgRatio >= 1) {
            renderH = diameter;
            renderW = diameter * imgRatio;
        } else {
            renderW = diameter;
            renderH = diameter / imgRatio;
        }
        
        ctx.drawImage(loadedLogoImg, centerX - (renderW / 2), centerY - (renderH / 2), renderW, renderH);
        ctx.restore(); 
    };

    // --- Execution Order ---
    drawBase();

    if (layerPriority === 'text') {
        drawLogo();
        if (isTextEnabled) drawTextBlock(textContent, selectedFont, customFont, textSize, textColor, textStrokeColor, isTextStrokeEnabled, textXPosition, textYPosition);
        if (isSubtitleEnabled) drawTextBlock(subtitleContent, subtitleFont, subtitleCustomFont, subtitleSize, subtitleColor, subtitleStrokeColor, isSubtitleStrokeEnabled, subtitleX, subtitleY);
    } else {
        if (isTextEnabled) drawTextBlock(textContent, selectedFont, customFont, textSize, textColor, textStrokeColor, isTextStrokeEnabled, textXPosition, textYPosition);
        if (isSubtitleEnabled) drawTextBlock(subtitleContent, subtitleFont, subtitleCustomFont, subtitleSize, subtitleColor, subtitleStrokeColor, isSubtitleStrokeEnabled, subtitleX, subtitleY);
        drawLogo();
    }

    // Export
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);

  }, [
    loadedBaseImg, loadedLogoImg,
    logoSize, logoX, logoY, 
    brightness, contrast, saturation, 
    isTextEnabled, textContent, selectedFont, customFont, textColor, textStrokeColor, isTextStrokeEnabled, textSize, textYPosition, textXPosition,
    isSubtitleEnabled, subtitleContent, subtitleFont, subtitleCustomFont, subtitleColor, subtitleStrokeColor, isSubtitleStrokeEnabled, subtitleSize, subtitleX, subtitleY,
    layerPriority,
    onSave
  ]);

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="relative w-full rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
        <canvas ref={canvasRef} className="w-full h-auto block" />
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        
        {/* MAIN TEXT CONTROL */}
        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm space-y-4 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <Type className="w-5 h-5 text-blue-600" /> หัวข้อหลัก (Headline)
                </h3>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={isTextEnabled} onChange={(e) => setIsTextEnabled(e.target.checked)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>

            {isTextEnabled && (
                <div className="space-y-4 animate-fade-in">
                    <textarea 
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        placeholder="พิมพ์หัวข้อ..."
                        rows={2}
                        className="w-full p-2 text-sm border border-slate-300 rounded-md"
                    />
                    
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-500 block">ฟอนต์</label>
                        <select 
                            value={selectedFont} 
                            onChange={(e) => { setSelectedFont(e.target.value); setCustomFont(''); }}
                            className="w-full p-2 text-sm border border-slate-300 rounded-md"
                        >
                            {fonts.map(f => <option key={f.name} value={f.name}>{f.label}</option>)}
                        </select>
                        <div className="flex items-center gap-2 mt-1">
                            <Monitor className="w-3 h-3 text-slate-400" />
                            <input 
                                type="text"
                                value={customFont}
                                onChange={(e) => setCustomFont(e.target.value)}
                                placeholder="หรือพิมพ์ชื่อฟอนต์ในเครื่อง (เช่น Angsana New)"
                                className="flex-1 p-1.5 text-xs border border-slate-200 rounded bg-slate-50 placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-slate-500 mb-1 block">ขนาด</label>
                            <input type="range" min="5" max="40" value={textSize} onChange={(e) => setTextSize(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                        </div>
                        <div className="flex gap-2">
                             <div className="flex-1">
                                <label className="text-xs font-medium text-slate-500 mb-1 block">สี</label>
                                <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="h-8 w-full rounded cursor-pointer border border-slate-200" />
                             </div>
                             <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-medium text-slate-500">ขอบ</label>
                                    <div className="flex items-center gap-1">
                                        <input 
                                            type="checkbox" 
                                            id="textStrokeToggle"
                                            checked={isTextStrokeEnabled} 
                                            onChange={(e) => setIsTextStrokeEnabled(e.target.checked)}
                                            className="w-3 h-3 accent-blue-600 cursor-pointer"
                                        />
                                        <label htmlFor="textStrokeToggle" className="text-[10px] text-slate-500 cursor-pointer select-none">ใส่</label>
                                    </div>
                                </div>
                                <input 
                                    type="color" 
                                    value={textStrokeColor} 
                                    disabled={!isTextStrokeEnabled}
                                    onChange={(e) => setTextStrokeColor(e.target.value)} 
                                    className={`h-8 w-full rounded cursor-pointer border border-slate-200 ${!isTextStrokeEnabled ? 'opacity-30 cursor-not-allowed' : ''}`} 
                                />
                             </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3">
                        <label className="text-xs font-bold text-slate-600 mb-2 block flex items-center gap-1"><Move className="w-3 h-3" /> ตำแหน่งหัวข้อ</label>
                        <div className="grid grid-cols-2 gap-4">
                            <input type="range" min="0" max="100" value={textXPosition} onChange={(e) => setTextXPosition(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                            <input type="range" min="0" max="100" value={textYPosition} onChange={(e) => setTextYPosition(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* SECONDARY TEXT (SUBTITLE) CONTROL */}
        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm space-y-4 border-l-4 border-l-indigo-500">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <AlignLeft className="w-5 h-5 text-indigo-600" /> ข้อความรอง / รายละเอียด
                </h3>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={isSubtitleEnabled} onChange={(e) => setIsSubtitleEnabled(e.target.checked)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
            </div>

            {isSubtitleEnabled && (
                <div className="space-y-4 animate-fade-in">
                    <textarea 
                        value={subtitleContent}
                        onChange={(e) => setSubtitleContent(e.target.value)}
                        placeholder="รายละเอียด 1-3 บรรทัด..."
                        rows={3}
                        className="w-full p-2 text-sm border border-slate-300 rounded-md"
                    />
                    
                    <div className="space-y-2">
                         <label className="text-xs font-medium text-slate-500 block">ฟอนต์</label>
                         <div className="flex items-center gap-2">
                            <select 
                                value={subtitleFont} 
                                onChange={(e) => { setSubtitleFont(e.target.value); setSubtitleCustomFont(''); }}
                                className="w-1/2 p-2 text-sm border border-slate-300 rounded-md"
                            >
                                {fonts.map(f => <option key={f.name} value={f.name}>{f.label}</option>)}
                            </select>
                            <input 
                                type="text"
                                value={subtitleCustomFont}
                                onChange={(e) => setSubtitleCustomFont(e.target.value)}
                                placeholder="ชื่อฟอนต์ในเครื่อง"
                                className="w-1/2 p-2 text-xs border border-slate-200 rounded bg-slate-50"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-slate-500 mb-1 block">ขนาด</label>
                            <input type="range" min="2" max="20" value={subtitleSize} onChange={(e) => setSubtitleSize(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                        </div>
                        <div className="flex gap-2">
                             <div className="flex-1">
                                <label className="text-xs font-medium text-slate-500 mb-1 block">สี</label>
                                <input type="color" value={subtitleColor} onChange={(e) => setSubtitleColor(e.target.value)} className="h-8 w-full rounded cursor-pointer border border-slate-200" />
                             </div>
                             <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-medium text-slate-500">ขอบ</label>
                                    <div className="flex items-center gap-1">
                                        <input 
                                            type="checkbox" 
                                            id="subStrokeToggle"
                                            checked={isSubtitleStrokeEnabled} 
                                            onChange={(e) => setIsSubtitleStrokeEnabled(e.target.checked)}
                                            className="w-3 h-3 accent-indigo-600 cursor-pointer"
                                        />
                                        <label htmlFor="subStrokeToggle" className="text-[10px] text-slate-500 cursor-pointer select-none">ใส่</label>
                                    </div>
                                </div>
                                <input 
                                    type="color" 
                                    value={subtitleStrokeColor} 
                                    disabled={!isSubtitleStrokeEnabled}
                                    onChange={(e) => setSubtitleStrokeColor(e.target.value)} 
                                    className={`h-8 w-full rounded cursor-pointer border border-slate-200 ${!isSubtitleStrokeEnabled ? 'opacity-30 cursor-not-allowed' : ''}`} 
                                />
                             </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3">
                        <label className="text-xs font-bold text-slate-600 mb-2 block flex items-center gap-1"><Move className="w-3 h-3" /> ตำแหน่งข้อความรอง</label>
                        <div className="grid grid-cols-2 gap-4">
                            <input type="range" min="0" max="100" value={subtitleX} onChange={(e) => setSubtitleX(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                            <input type="range" min="0" max="100" value={subtitleY} onChange={(e) => setSubtitleY(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Logo & Layers & Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loadedLogoImg && (
                <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm space-y-4 border-l-4 border-l-green-500">
                    <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-green-600" /> โลโก้ (วงกลม)
                    </h3>
                    <div>
                        <input type="range" min="5" max="50" value={logoSize} onChange={(e) => setLogoSize(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600" />
                    </div>
                    <div className="border-t border-slate-100 pt-3">
                        <div className="space-y-3">
                            <input type="range" min="0" max="100" value={logoX} onChange={(e) => setLogoX(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600" />
                            <input type="range" min="0" max="100" value={logoY} onChange={(e) => setLogoY(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600" />
                        </div>
                    </div>
                </div>
            )}

            <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm space-y-4">
                 {loadedLogoImg && (
                    <div className="pb-3 border-b border-slate-100">
                        <h3 className="font-semibold text-slate-700 flex items-center gap-2 mb-2">
                            <Layers className="w-4 h-4" /> ลำดับชั้น (Layer)
                        </h3>
                        <div className="flex rounded-md shadow-sm" role="group">
                            <button onClick={() => setLayerPriority('logo')} className={`flex-1 px-3 py-2 text-xs font-medium rounded-l-lg border ${layerPriority === 'logo' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'}`}>
                                โลโก้บนสุด
                            </button>
                            <button onClick={() => setLayerPriority('text')} className={`flex-1 px-3 py-2 text-xs font-medium rounded-r-lg border ${layerPriority === 'text' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'}`}>
                                ตัวหนังสือบนสุด
                            </button>
                        </div>
                    </div>
                 )}

                <div>
                    <h3 className="font-semibold text-slate-700 flex items-center gap-2 mb-2">
                        <Sliders className="w-4 h-4" /> ปรับโทนภาพ
                    </h3>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 w-8">แสง</span>
                            <input type="range" min="0" max="200" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 w-8">คมชัด</span>
                            <input type="range" min="0" max="200" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                        </div>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default LogoOverlay;
