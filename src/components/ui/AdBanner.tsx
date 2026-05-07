import { useEffect, useRef } from "react";
import { useAds } from "@/context/AdsContext";
import { useLocation } from "react-router-dom";

interface AdBannerProps {
  id: string;
  height: number;
  width: number;
  type: string;
}

export function AdBanner({ id, height, width, type }: AdBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isAdEnabled, loading } = useAds();
  const location = useLocation();

  // Determine current page key for ads config
  const getPageKey = () => {
    const path = location.pathname;
    if (path.includes('verifytaskpro')) return 'VerifyPro';
    if (path.includes('verifytaskpre')) return 'VerifyPre';
    if (path.includes('verifytask')) return 'VerifyStandard';
    if (path.includes('task-pre')) return 'TaskPrePage';
    if (path.includes('task-vip')) return 'TaskVipPage';
    if (path.includes('task')) return 'TaskPage';
    return 'Other';
  };

  const pageKey = getPageKey();
  const enabled = isAdEnabled(pageKey, 'banner');

  useEffect(() => {
    if (!containerRef.current || !enabled) return;
    
    // Clear existing content
    containerRef.current.innerHTML = '';
    
    const script = document.createElement('script');
    const configScript = document.createElement('script');
    
    configScript.innerHTML = `
      atOptions = {
        'key' : '${id}',
        'format' : 'iframe',
        'height' : ${height},
        'width' : ${width},
        'params' : {}
      };
    `;
    
    script.src = `https://socialconventcontext.com/${id}/invoke.js`;
    script.async = true;

    containerRef.current.appendChild(configScript);
    containerRef.current.appendChild(script);
  }, [id, height, width, enabled]);

  if (loading || !enabled) return null;

  return (
    <div className={`flex justify-center my-4 overflow-hidden border border-slate-50 rounded-xl bg-slate-50/50 shadow-sm`} style={{ minHeight: height }}>
      <div ref={containerRef} />
    </div>
  );
}
