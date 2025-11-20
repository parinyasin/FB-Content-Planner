import React from 'react';
import ContentCreator from './components/ContentCreator';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* ไม่ต้องส่ง apiKey แล้ว เรียกใช้ตรงๆ เลย */}
      <ContentCreator />
      <Toaster position="bottom-center" />
    </div>
  );
}

export default App;