
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, PlusCircle, Settings, Zap } from 'lucide-react';
import ContentCreator from './components/ContentCreator';
import ContentPlanner from './components/ContentPlanner';
import { PostData } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'plan'>('create');
  
  // Initialize state from localStorage if available
  const [posts, setPosts] = useState<PostData[]>(() => {
    try {
      const savedPosts = localStorage.getItem('fb_planner_posts');
      return savedPosts ? JSON.parse(savedPosts) : [];
    } catch (e) {
      console.error("Failed to load posts", e);
      return [];
    }
  });

  const [userLogo, setUserLogo] = useState<string | null>(() => {
    try {
        return localStorage.getItem('fb_planner_logo') || null;
    } catch (e) {
        console.error("Failed to load logo", e);
        return null;
    }
  });

  // Save to localStorage whenever posts change
  useEffect(() => {
    try {
        localStorage.setItem('fb_planner_posts', JSON.stringify(posts));
    } catch (e) {
        console.error("Failed to save posts (Storage limit likely reached)", e);
        // Optional: Alert user
    }
  }, [posts]);

  // Save to localStorage whenever logo changes
  useEffect(() => {
    if (userLogo) {
      try {
        localStorage.setItem('fb_planner_logo', userLogo);
      } catch (e) {
        console.error("Failed to save logo (Storage limit likely reached)", e);
        // If logo is too big, it won't save, but app won't crash
      }
    }
  }, [userLogo]);

  const handleSavePost = (newPost: PostData) => {
    setPosts((prev) => [...prev, newPost]);
    setActiveTab('plan'); // Switch to planner after saving
  };

  const handleDeletePost = (id: string) => {
    if (window.confirm('คุณต้องการลบโพสต์นี้ใช่หรือไม่?')) {
      setPosts((prev) => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex-shrink-0">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
            <Zap className="text-blue-600 fill-blue-600" /> AI Content
          </h1>
          <p className="text-xs text-slate-500 mt-1">FB Post Generator & Planner</p>
        </div>

        <nav className="p-4 space-y-2">
          <button
            onClick={() => setActiveTab('create')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'create'
                ? 'bg-blue-50 text-blue-700 shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <PlusCircle className="w-5 h-5" />
            สร้างโพสต์ใหม่
          </button>
          <button
            onClick={() => setActiveTab('plan')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'plan'
                ? 'bg-blue-50 text-blue-700 shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            แผนงานของฉัน
            <span className="ml-auto bg-slate-100 text-slate-600 text-xs py-0.5 px-2 rounded-full">
                {posts.length}
            </span>
          </button>
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 text-slate-500 text-sm">
                <Settings className="w-4 h-4" />
                <span>การตั้งค่า</span>
            </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800">
                {activeTab === 'create' ? 'สร้างสรรค์คอนเทนต์' : 'ตารางงานรายวัน'}
            </h2>
            <p className="text-slate-500">
                {activeTab === 'create' 
                    ? 'ให้ AI ช่วยสรุปเนื้อหา เขียนแคปชั่น และวาดภาพประกอบให้คุณ' 
                    : 'จัดการโพสต์ที่คุณเตรียมไว้สำหรับการเผยแพร่'}
            </p>
        </header>

        {activeTab === 'create' ? (
          <ContentCreator 
            onSavePost={handleSavePost} 
            userLogo={userLogo}
            setUserLogo={setUserLogo}
          />
        ) : (
          <ContentPlanner posts={posts} onDeletePost={handleDeletePost} />
        )}
      </main>
    </div>
  );
};

export default App;
