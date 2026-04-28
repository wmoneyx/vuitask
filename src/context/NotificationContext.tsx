import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  showNotification: (params: { title: string; message: string; type?: NotificationType }) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback(({ title, message, type = 'info' }: { title: string; message: string; type?: NotificationType }) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, title, message, type }]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-3 pointer-events-none w-full max-w-[320px]">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              className="pointer-events-auto"
            >
              <div className={`p-4 rounded-2xl shadow-xl border backdrop-blur-md flex gap-3 relative overflow-hidden ${
                n.type === 'success' ? 'bg-emerald-50/90 border-emerald-100 text-emerald-900' :
                n.type === 'error' ? 'bg-rose-50/90 border-rose-100 text-rose-900' :
                'bg-white/90 border-slate-100 text-slate-800'
              }`}>
                <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                  n.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                  n.type === 'error' ? 'bg-rose-100 text-rose-600' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {n.type === 'success' && <CheckCircle2 size={20} />}
                  {n.type === 'error' && <AlertCircle size={20} />}
                  {(n.type === 'info' || n.type === 'warning') && <Info size={20} />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm leading-tight mb-1">{n.title}</h4>
                  <p className="text-[13px] font-medium opacity-80 leading-snug">{n.message}</p>
                </div>

                <button 
                  onClick={() => removeNotification(n.id)}
                  className="shrink-0 p-1 hover:bg-black/5 rounded-lg transition-colors self-start"
                >
                  <X size={16} className="opacity-40" />
                </button>

                {/* Progress bar */}
                <motion.div 
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 4, ease: 'linear' }}
                  className={`absolute bottom-0 left-0 h-1 ${
                    n.type === 'success' ? 'bg-emerald-500' :
                    n.type === 'error' ? 'bg-rose-500' :
                    'bg-slate-500'
                  }`}
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
