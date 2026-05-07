import React, { createContext, useContext, useState, useEffect } from 'react';
import { safeFetch } from '@/lib/utils';
import { useLocation } from 'react-router-dom';

interface PageAdsConfig {
  script: boolean;
  banner: boolean;
  direct: boolean;
}

interface AdsConfig {
  global: boolean;
  pages: {
    [key: string]: PageAdsConfig;
  };
}

interface AdsContextType {
  config: AdsConfig | null;
  loading: boolean;
  isAdEnabled: (pageKey: string, type: 'script' | 'banner' | 'direct') => boolean;
  refreshConfig: () => Promise<void>;
}

const AdsContext = createContext<AdsContextType | undefined>(undefined);

const DEFAULT_CONFIG: AdsConfig = {
  global: true,
  pages: {
    "TaskPage": { script: true, banner: true, direct: true },
    "TaskPrePage": { script: true, banner: true, direct: true },
    "TaskVipPage": { script: true, banner: true, direct: true },
    "VerifyStandard": { script: true, banner: true, direct: true },
    "VerifyPre": { script: true, banner: true, direct: true },
    "VerifyPro": { script: true, banner: true, direct: true },
  }
};

export const AdsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AdsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const fetchConfig = async () => {
    try {
      const data = await safeFetch('/api/system/settings?key=ads_config');
      if (data && data.value) {
        setConfig(JSON.parse(data.value));
      } else {
        setConfig(DEFAULT_CONFIG);
      }
    } catch (e) {
      console.error("Failed to fetch ads config", e);
      setConfig(DEFAULT_CONFIG);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const isAdEnabled = (pageKey: string, type: 'script' | 'banner' | 'direct'): boolean => {
    if (!config || !config.global) return false;
    const pageConfig = config.pages[pageKey];
    if (!pageConfig) return true; // Default to true if not specified
    return pageConfig[type];
  };

  // Re-fetch config when entering admin pages or on significant navigation (optional)
  useEffect(() => {
     if (location.pathname.startsWith('/admin')) {
        fetchConfig();
     }
  }, [location.pathname]);

  // Handle global scripts injection based on global setting
  useEffect(() => {
    if (config?.global) {
      // Inject head script
      const headScript = document.createElement('script');
      headScript.src = 'https://pl29360287.profitablecpmratenetwork.com/e4/f7/75/e4f7759d92f684ee31c3179f8525d4b2.js';
      headScript.id = 'ads-head-script';
      
      // Inject body script
      const bodyScript = document.createElement('script');
      bodyScript.src = 'https://pl29360290.profitablecpmratenetwork.com/86/14/de/8614de3eb4c610be18b7857d7943c762.js';
      bodyScript.id = 'ads-body-script';

      if (!document.getElementById('ads-head-script')) document.head.appendChild(headScript);
      if (!document.getElementById('ads-body-script')) document.body.appendChild(bodyScript);

      return () => {
        document.getElementById('ads-head-script')?.remove();
        document.getElementById('ads-body-script')?.remove();
      };
    } else {
        document.getElementById('ads-head-script')?.remove();
        document.getElementById('ads-body-script')?.remove();
    }
  }, [config?.global]);

  return (
    <AdsContext.Provider value={{ config, loading, isAdEnabled, refreshConfig: fetchConfig }}>
      {children}
    </AdsContext.Provider>
  );
};

export const useAds = () => {
  const context = useContext(AdsContext);
  if (!context) {
    throw new Error('useAds must be used within an AdsProvider');
  }
  return context;
};
