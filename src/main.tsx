import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { NotificationProvider } from './context/NotificationContext';

// Handle migration from Netlify to Vercel/AIS
if (window.location.hostname === 'vuitask.netlify.app') {
   window.alert("Lưu ý: Hệ thống đã chuyển sang địa chỉ mới (Vercel). Vui lòng cập nhật bookmark và xóa cache trình duyệt để tránh lỗi!");
   // Optional: window.location.href = 'https://vuitask.vercel.app'; // Replace with real Vercel URL
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NotificationProvider>
      <App />
    </NotificationProvider>
  </StrictMode>,
);
