import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import { safeFetch } from '@/lib/utils';
import { useUser } from '@/UserContext';

export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const [maintenance, setMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);
  const { profile } = useUser();

  const checkMaintenance = async () => {
    const data = await safeFetch('/api/system/maintenance');
    if (data && data.maintenance !== undefined) {
      setMaintenance(data.maintenance);
    }
    setLoading(false);
  };

  useEffect(() => {
    checkMaintenance();
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-50">
        <RefreshCw className="text-blue-500 animate-spin" size={32} />
      </div>
    );
  }

  // Admins bypass maintenance
  if (maintenance && !profile?.is_admin) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-6 z-[9999] text-center">
        <div className="max-w-md space-y-6">
          <div className="w-24 h-24 bg-rose-500/10 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-pulse">
            <ShieldAlert size={48} />
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tight">Hệ thống bảo trì</h1>
          <p className="text-slate-400 font-medium">
            Chúng tôi đang tiến hành nâng cấp hệ thống để mang lại trải nghiệm tốt hơn. 
            Vui lòng quay lại sau ít phút!
          </p>
          <div className="pt-4">
             <button 
               onClick={() => window.location.reload()} 
               className="px-8 py-3 bg-white text-slate-900 font-bold rounded-2xl hover:bg-slate-200 transition-colors"
             >
                Tải lại trang
             </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
