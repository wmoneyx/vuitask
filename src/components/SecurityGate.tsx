import React, { useState, useEffect } from 'react';
import { Logo } from './ui/Logo';

declare global {
  interface Window {
    onVerifySuccess: (token: string) => void;
  }
}

interface SecurityGateProps {
  children: React.ReactNode;
}

const SecurityGate: React.FC<SecurityGateProps> = ({ children }) => {
  const [isVerified, setIsVerified] = useState<boolean>(() => {
    // Lưu trạng thái xác minh trong session để không phải xác minh lại mỗi khi chuyển trang
    return sessionStorage.getItem('cf_verified') === 'true';
  });
  const [rayId, setRayId] = useState<string>('');

  const PROD_HOSTNAME = 'vuitask.online';
  const TEST_SITEKEY = '1x00000000000000000000AA'; // Always pass key for testing
  const ACTUAL_SITEKEY = '0x4AAAAAAADHlG5qOvRj4I_YF';
  
  const siteKey = typeof window !== 'undefined' && (window.location.hostname === PROD_HOSTNAME || window.location.hostname === 'localhost') 
    ? ACTUAL_SITEKEY 
    : TEST_SITEKEY;

  useEffect(() => {
    if (isVerified) return;

    setRayId(Math.random().toString(16).substring(2, 18).toUpperCase());

    window.onVerifySuccess = (token: string) => {
      console.log("Xác minh thành công");
      sessionStorage.setItem('cf_verified', 'true');
      setIsVerified(true);
    };

    // Add error callback
    (window as any).onTurnstileError = (code: any) => {
      console.error("Turnstile Error:", code);
      // If it's a domain/sitekey error (400020), we might want to warn the user
    };

    // Check if script already exists to avoid "imported multiple times" warning
    const scriptId = 'cf-turnstile-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;
      // Adding crossorigin help with "Script error" transparency if CORS is set on CDN
      script.crossOrigin = "anonymous";
      document.body.appendChild(script);
    }

    return () => {
      // Don't remove the script on unmount to avoid re-loading it if the component remounts
      // Just clean up the callback if needed, but Turnstile needs it to be global
      // window.onVerifySuccess = () => {}; 
    };
  }, [isVerified]);

  if (isVerified) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] text-white flex flex-col items-center justify-start z-[9999] overflow-y-auto">
      <div className="w-full max-w-[600px] px-6 pt-20">
        <div className="mb-10 scale-150 origin-left">
           <Logo showText={false} />
        </div>
        <h1 className="text-[42px] font-bold mb-2 tracking-tighter">vuitask.online</h1>
        <h2 className="text-[28px] font-semibold mb-5 text-gray-100">Thực hiện xác minh bảo mật</h2>
        <p className="text-[#d1d1d1] leading-relaxed mb-8 text-[16px]">
          Trang web này sử dụng dịch vụ bảo mật để chống bot độc hại. Trang này hiển thị trong khi trang web xác minh bạn không phải là bot.
        </p>

        <div className="inline-block border border-[#333] p-6 rounded-xl bg-[#111] shadow-2xl">
          {/* Widget Turnstile */}
          <div 
            className="cf-turnstile" 
            data-sitekey={siteKey} 
            data-callback="onVerifySuccess"
            data-error-callback="onTurnstileError"
            data-theme="dark"
          ></div>
          <p className="mt-4 text-[13px] text-gray-500 italic">
            * Vui lòng đợi trong giây lát để hệ thống kiểm tra trình duyệt của bạn.
          </p>
        </div>
      </div>

      <footer className="mt-auto w-full text-center border-t border-[#222] py-8 text-[12px] text-[#666] bg-[#0a0a0a]">
        Ray ID: <span className="font-mono text-gray-400">{rayId}</span><br />
        Hiệu suất và Tính bảo mật của <a href="#" className="text-blue-500 hover:underline">Cloudflare</a> | <a href="#" className="text-blue-500 hover:underline">Quyền riêng tư</a>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default SecurityGate;
