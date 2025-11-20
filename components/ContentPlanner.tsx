
import React, { useState } from 'react';
import { Calendar, CheckCircle2, Clock, Download, Trash2, FileText, Image as ImageIcon, Copy, Check } from 'lucide-react';
import { PostData } from '../types';

interface ContentPlannerProps {
  posts: PostData[];
  onDeletePost: (id: string) => void;
}

const ContentPlanner: React.FC<ContentPlannerProps> = ({ posts, onDeletePost }) => {
  // State to track which post was recently copied
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sort posts by date
  const sortedPosts = [...posts].sort((a, b) => 
    new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
  );

  const downloadText = (post: PostData) => {
    // Export as .doc (HTML compatible)
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
        ${post.generatedCaption.replace(/\n/g, '<br>')}
      </body>
      </html>
    `;

    const blob = new Blob([contentHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `caption-${post.scheduledDate}-${post.id.slice(0,4)}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadImage = (post: PostData) => {
    if (!post.finalImageBase64) return;
    const a = document.createElement('a');
    a.href = post.finalImageBase64;
    a.download = `image-${post.scheduledDate}-${post.id.slice(0,4)}.png`;
    a.click();
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-xl border border-slate-200 shadow-sm">
        <Calendar className="w-16 h-16 mb-4 opacity-30" />
        <p className="text-lg">ยังไม่มีแผนงานคอนเทนต์</p>
        <p className="text-sm">เริ่มสร้างโพสต์แรกของคุณได้ที่เมนู "สร้างใหม่"</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
        <Calendar className="text-orange-500" /> แผนงานคอนเทนต์ของคุณ
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedPosts.map((post) => (
          <div key={post.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 flex flex-col hover:shadow-md transition-shadow">
            {/* Image Header */}
            <div className="relative h-48 bg-slate-100 overflow-hidden group">
                {post.finalImageBase64 ? (
                    <img src={post.finalImageBase64} alt="Post Visual" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">No Image</div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button 
                        onClick={() => downloadImage(post)}
                        className="bg-white text-slate-900 text-xs px-3 py-2 rounded-full hover:bg-slate-100 transition-colors flex items-center gap-1"
                        title="ดาวน์โหลดรูปภาพ"
                    >
                        <ImageIcon className="w-3 h-3" /> ดาวน์โหลดรูป
                    </button>
                </div>
                <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                        {post.status === 'published' ? 'เผยแพร่แล้ว' : 'รอโพสต์'}
                    </span>
                </div>
            </div>

            {/* Content Body */}
            <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-center gap-2 text-slate-500 text-xs mb-3">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(post.scheduledDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                
                <p className="text-slate-700 text-sm line-clamp-3 mb-4 flex-1 whitespace-pre-line">
                    {post.generatedCaption}
                </p>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button 
                        onClick={() => onDeletePost(post.id)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                        title="ลบ"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="flex gap-2">
                         <button 
                            onClick={() => handleCopy(post.generatedCaption, post.id)}
                            className={`p-2 rounded-full transition-colors ${copiedId === post.id ? 'bg-green-100 text-green-600' : 'text-slate-500 hover:text-green-600 hover:bg-green-50'}`}
                            title="คัดลอกข้อความ"
                        >
                            {copiedId === post.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                         </button>
                         <button 
                            onClick={() => downloadText(post)}
                            className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors"
                            title="ดาวน์โหลดข้อความ (.doc)"
                        >
                            <FileText className="w-4 h-4" />
                         </button>
                         <button 
                            onClick={() => downloadImage(post)}
                            className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors"
                            title="ดาวน์โหลดรูปภาพ (.png)"
                        >
                            <ImageIcon className="w-4 h-4" />
                         </button>
                    </div>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContentPlanner;
