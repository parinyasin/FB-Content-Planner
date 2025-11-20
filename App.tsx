import React, { useState } from 'react';
import ContentCreator from './components/ContentCreator';
import { Toaster } from 'react-hot-toast';

function App() {
  // 🔑 ฝังกุญแจที่นี่ (Force API Key)
  // แก้บรรทัดนี้ให้เป็นรหัสของคุณ
  const [apiKey] = useState("AIzaSyDgBINcYmdNcz9B1Cugv_0RAF7D0dp9Akc"); 

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ส่งกุญแจไปให้ตัวทำงานโดยตรง */}
      <ContentCreator apiKey={apiKey} />
      <Toaster position="bottom-center" />
    </div>
  );
}

export default App;