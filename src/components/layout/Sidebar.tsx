import { NavLink } from "react-router-dom";
import { LogOut, PanelLeftClose, PanelLeftOpen, ShieldCheck } from "lucide-react";
import { SIDEBAR_MENUS, SUPPORT_MENUS } from "@/constants";
import { Logo } from "@/components/ui/Logo";
import { VuiCoin } from "@/components/ui/VuiCoin";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
  onOpen: () => void;
  onClose: () => void;
}

export function Sidebar({ isOpen, toggle, onOpen, onClose }: SidebarProps) {
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ 
          width: typeof window !== 'undefined' && window.innerWidth >= 1024 
            ? (isOpen ? 260 : 80) 
            : 260,
          left: typeof window !== 'undefined' && window.innerWidth < 1024
            ? (isOpen ? 0 : -260)
            : 0,
        }}
        transition={{ 
          type: "tween",
          ease: "circOut",
          duration: 0.15 
        }}
        className={cn(
          "h-screen bg-white border-r border-gray-100 flex flex-col shrink-0 overflow-hidden z-40",
          "fixed lg:relative inset-y-0 shadow-2xl lg:shadow-none"
        )}
      >
        <div className="h-16 flex items-center px-4 justify-between border-b border-gray-50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Logo showText={isOpen} />
          </div>
          <button 
            onClick={toggle} 
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-50 hidden lg:block"
          >
            {isOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
          </button>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-50 lg:hidden"
          >
            <PanelLeftClose size={20} />
          </button>
        </div>

        <div className="flex-shrink-0 pt-4 pb-2">
          {isOpen && (
            <div className="px-4">
              <div className="space-y-3">
                <div className="bg-slate-900 rounded-xl p-4 text-white shadow-lg overflow-hidden relative">
                  <div className="text-xs text-slate-300 mb-1 uppercase font-medium">Số dư ví hiện tại</div>
                  <div className="text-2xl font-bold text-primary truncate flex items-center gap-1.5">
                     <VuiCoin size={20} strokeWidth={2.5} />
                     0.0
                  </div>
                </div>

                {isAdmin && (
                  <NavLink
                    to="/app/admin"
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 border-red-500 text-red-500 hover:bg-red-50 transition-all font-bold",
                        isActive && "bg-red-500 text-white hover:bg-red-600"
                      )
                    }
                  >
                    <ShieldCheck size={20} className={cn(!isOpen && "mx-auto")} />
                    {isOpen && <span>ADMIN MODE</span>}
                  </NavLink>
                )}
              </div>
            </div>
          )}

          {!isOpen && isAdmin && (
            <div className="px-3">
               <NavLink
                  to="/app/admin"
                  title="ADMIN MODE"
                  className={({ isActive }) =>
                    cn(
                      "flex items-center justify-center p-2 rounded-lg border-2 border-red-500 text-red-500 hover:bg-red-50 transition-all",
                      isActive && "bg-red-500 text-white"
                    )
                  }
                >
                  <ShieldCheck size={20} />
                </NavLink>
            </div>
          )}
        </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin py-2 custom-scrollbar">
        <div className="space-y-6 px-3">
          {SIDEBAR_MENUS.map((group, i) => (
            <div key={i} className="flex flex-col gap-1">
              {isOpen && (
                <div className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  {group.title}
                </div>
              )}
              {group.items.map((item, j) => {
                const Icon = item.icon;
                
                return (
                    <NavLink
                      key={j}
                      to={item.path}
                      end={item.path === '/app'}
                      onClick={() => {
                        if (window.innerWidth < 1024) onClose();
                      }}
                      title={!isOpen ? item.name : undefined}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group",
                          !isOpen && "justify-center",
                          isActive
                            ? "bg-slate-900 text-white shadow-md active-nav-item"
                            : "text-gray-600 hover:bg-gray-50 hover:text-slate-900"
                        )
                      }
                    >
                     {({ isActive }) => (
                        <>
                          <Icon size={20} strokeWidth={isActive ? 2 : 1.5} className={cn("shrink-0", isActive ? "text-primary" : "")} />
                          {isOpen && <span className="text-sm font-medium truncate">{item.name}</span>}
                        </>
                     )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Fixed section at bottom */}
      <div className="flex-shrink-0 bg-white">
        <div className="mx-4 h-px bg-slate-900 mb-4" />
        <div className="px-3 pt-2 pb-4 space-y-1">
          {isOpen && (
             <div className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 mt-2">
               {SUPPORT_MENUS.title}
             </div>
          )}
          {SUPPORT_MENUS.items.map((item, j) => {
            const Icon = item.icon;
            
            return (
               <a
                  key={j}
                  href={item.path}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-slate-900 transition-colors group",
                    !isOpen && "justify-center"
                  )}
                  title={!isOpen ? item.name : undefined}
                >
                  <Icon size={20} strokeWidth={1.5} className="shrink-0" />
                  {isOpen && <span className="text-sm font-medium truncate">{item.name}</span>}
                </a>
             )
          })}
        </div>
        <div className="p-4 border-t border-gray-100">
          <button 
             onClick={() => {
                localStorage.removeItem('isLoggedIn');
                window.location.href = '/';
             }}
             className={cn(
               "flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors w-full",
               !isOpen && "justify-center"
             )}
          >
            <LogOut size={20} strokeWidth={1.5} className="shrink-0" />
            {isOpen && <span className="text-sm font-medium">Đăng xuất</span>}
          </button>
        </div>
      </div>
    </motion.aside>
    </>
  );
}
