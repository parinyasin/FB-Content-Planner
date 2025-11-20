
import React, { useState } from 'react';
import { Calendar, Clock, Trash2, FileText, Image as ImageIcon, Copy, Check, Download, Share2 } from 'lucide-react';
import { PostData } from '../types';

interface ContentPlannerProps {
  posts: PostData[];
  onDeletePost: (id: string) => void;
}

const ContentPlanner: React.FC<ContentPlannerProps> = ({ posts, onDeletePost }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const sortedPosts = [...posts].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const downloadText = (post: PostData) => {
    const contentHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Caption</title></head>
      <body style="font-family: sans-serif; line-height: 1.6;">
        ${post.generatedCaption.replace(/\n/g, '<br>')}
      </body>
      </html>
    `;
    const blob = new Blob([contentHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `caption-${post.id.slice(0,6)}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadImage = (post: PostData) => {
    if (!post.finalImageBase64) return;
    const a = document.createElement('a');
    a.href = post.finalImageBase64;
    a.download = `post-image-${post.id.slice(0,6)}.png`;
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
      <div className="flex flex-col items-center justify-center py-32 text-slate-400 bg-white rounded-3xl border-2 border-dashed border-slate-200">
        <div className="bg-slate-50 p-6 rounded-full mb-4">
             <Calendar className="w-12 h-12 text-slate-300" />
        </div>
        <p className="text-lg font-thai-header font-semibold text-slate-600">ยังไม่มีแผนงาน</p>
        <p className="text-sm">เริ่มสร้างโพสต์แรกของคุณที่เมนู "สร้างคอนเทนต์"</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
      {sortedPosts.map((post) => (
        <div key={post.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow border border-slate-100 flex flex-col group">
          
          {/* Image Header */}
          <div className="relative aspect-video bg-slate-100 overflow-hidden">
              {post.finalImageBase64 ? (
                  <img src={post.finalImageBase64} alt="Post Visual" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No Image</div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                   <button 
                      onClick={() => downloadImage(post)}
                      className="w-full py-2 bg-white text-slate-900 text-xs font-bold rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                  >
                      <Download className="w-3.5 h-3.5" /> ดาวน์โหลดรูป
                  </button>
              </div>
          </div>

          {/* Content Body */}
          <div className="p-5 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                 <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium uppercase tracking-wider">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(post.timestamp).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' })}</span>
                 </div>
                 <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded-full border border-green-100">
                    READY
                 </span>
              </div>
              
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4 flex-1">
                 <p className="text-slate-600 text-sm line-clamp-4 whitespace-pre-line leading-relaxed font-thai-header">
                    {post.generatedCaption}
                 </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                  <button 
                      onClick={() => onDeletePost(post.id)}
                      className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                      title="ลบ"
                  >
                      <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <div className="flex gap-2">
                       <button 
                          onClick={() => handleCopy(post.generatedCaption, post.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${copiedId === post.id ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                          {copiedId === post.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copiedId === post.id ? 'คัดลอกแล้ว' : 'คัดลอก'}
                       </button>
                       <button 
                          onClick={() => downloadText(post)}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="โหลดข้อความ"
                      >
                          <FileText className="w-4 h-4" />
                      </button>
                  </div>
              </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ContentPlanner;
