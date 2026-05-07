import React, { useState, useEffect, useRef } from 'react';
import { GenericPage } from "@/components/layout/GenericPage";
import { MessageCircle, CheckCircle, Activity, Heart, ThumbsUp, Send } from "lucide-react";
import { AnimatedDiv } from "@/components/ui/AnimatedText";
import { safeFetch } from "@/lib/utils";

export function CommunityPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

    const fetchMessages = async () => {
      const data = await safeFetch('/api/community/messages');
      if (data && data.messages) {
        setMessages(data.messages);
      }
    };

    useEffect(() => {
      fetchMessages();
      const interval = setInterval(fetchMessages, 15000); // Poll every 15s instead of 3s to reduce server load
      return () => clearInterval(interval);
    }, []);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleReact = async (messageId: string, emoji: string) => {
    const localUUID = localStorage.getItem('omni_uuid') || crypto.randomUUID();
    let localName = localStorage.getItem('omni_username');
    if (!localName) {
        localName = `User${Math.floor(Math.random()*10000)}`;
        localStorage.setItem('omni_username', localName);
    }
    await fetch('/api/community/react', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId, emoji, uuid: localUUID, name: localName })
    });
    fetchMessages();
  };

  const getReactionTitle = (reactions: any[]) => {
      if (!reactions || reactions.length === 0) return "";
      return reactions.map((r: any) => r.name).join(", ");
  }

  return (
    <GenericPage title="Cộng Đồng" showHistory={false}>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-180px)] w-full">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 bg-white flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100">
                    <MessageCircle size={24} />
                </div>
                <div>
                    <h2 className="font-bold text-slate-800 text-lg tracking-tight">Chat Toàn Cầu</h2>
                    <div className="text-xs text-blue-500 font-bold flex items-center gap-1.5">
                       <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                       Trực tuyến • Hoạt động
                    </div>
                </div>
            </div>
            <div className="hidden sm:block text-xs bg-slate-900 text-white px-4 py-2 rounded-xl font-bold uppercase tracking-wider">
                Chỉ Admin mới có thể Gửi
            </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-gray-50/30" ref={scrollRef}>
           {messages.length === 0 && (
             <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4 opacity-50">
                <MessageCircle size={48} strokeWidth={1} />
                <p className="italic text-sm">Chưa có tin nhắn nào trong kênh này</p>
             </div>
           )}
           {messages.map(msg => (
               <div key={msg.id} className="flex gap-4 group">
                   {/* Avatar */}
                   <img src={
                      ['Vui TASK ( BOT )', 'SUPPORT VUI TASK ( BOT )'].includes(msg.user_name || msg.user?.name) 
                         ? 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHJlY3QgeD0iMyIgeT0iMTEiIHdpZHRoPSIxOCIgaGVpZ2h0PSIxMCIgcng9IjIiLz48Y2lyY2xlIGN4PSIxMiIgY3k9IjUiIHI9IjIiLz48cGF0aCBkPSJNMTIgN3Y0Ii8+PGxpbmUgeDE9IjgiIHkxPSIxNiIgeDI9IjgiIHkyPSIxNiIvPjxsaW5lIHgxPSIxNiIgeTE9IjE2IiB4Mj0iMTYiIHkyPSIxNiIvPjwvc3ZnPg==' 
                         : (msg.user_avatar || msg.user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + Math.random())} 
                      className={`w-11 h-11 rounded-2xl border border-gray-200 shrink-0 shadow-sm ${['Vui TASK ( BOT )', 'SUPPORT VUI TASK ( BOT )'].includes(msg.user_name || msg.user?.name) ? 'bg-blue-600 text-white p-2' : ''}`} alt="avatar" />
                   
                   <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                          <span className={`font-bold text-sm tracking-tight ${msg.is_admin || msg.user?.isAdmin ? 'text-blue-600' : 'text-slate-700'}`}>
                              {((name) => {
                                 if (!name) return 'Chưa rõ';
                                 if (name.includes('@')) {
                                    const [part1, part2] = name.split('@');
                                    return part1.charAt(0) + '*'.repeat(Math.max(1, part1.length - 1)) + '@' + part2;
                                 }
                                 return name;
                              })(msg.user_name || msg.user?.name)}
                          </span>
                          {(msg.is_admin || msg.user?.isAdmin) && <CheckCircle size={14} className="text-blue-500 fill-blue-50" />}
                          <span className="text-[10px] text-gray-400 font-bold font-mono ml-auto sm:ml-0">
                             {new Date(msg.timestamp).toLocaleTimeString('vi-VN')}
                          </span>
                      </div>

                      {/* Reply badge (nếu có) */}
                      {msg.replyToId && (
                         <div className="text-xs bg-gray-100 text-gray-500 p-2 rounded-xl mb-2 flex items-center gap-2 border-l-2 border-blue-400">
                             <Activity size={12}/> Đã trả lời 1 yêu cầu rút tiền
                         </div>
                      )}

                      {/* Content Box */}
                      {msg.type === 'withdrawal' ? (
                          <div className={`p-4 rounded-2xl rounded-tl-none border shadow-sm w-fit max-w-[90%] sm:max-w-[70%] ${msg.status === 'Đã thanh toán' ? 'bg-emerald-50 border-emerald-100' : 'bg-orange-50 border-orange-100'}`}>
                             <div className="font-bold text-slate-800 text-sm mb-1">Yêu cầu rút thưởng: <span className="text-lg text-rose-500">{msg.amount?.toLocaleString()}đ</span></div>
                             <div className={`text-[10px] font-black px-2.5 py-1 rounded-lg inline-block uppercase tracking-wider
                                 ${msg.status === 'Đã thanh toán' ? 'bg-emerald-200 text-emerald-900' : 'bg-orange-200 text-orange-900'}
                             `}>
                                TRẠNG THÁI: {msg.status}
                             </div>
                          </div>
                      ) : (
                          <div className={`p-4 rounded-2xl rounded-tl-none w-fit text-sm shadow-sm leading-relaxed border ${msg.is_admin || msg.user?.isAdmin ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-800 border-gray-100'}`}>
                             {msg.content}
                          </div>
                      )}

                      {/* Reactions */}
                      <div className="flex items-center gap-2 mt-3">
                          <button onClick={() => handleReact(msg.id, '❤️')} title={getReactionTitle(msg.reactions['❤️'])} className="flex items-center gap-1.5 bg-white border border-gray-100 px-3 py-1 rounded-full hover:bg-gray-50 transition-all shadow-sm active:scale-95 group/react">
                              <span className="text-xs group-hover/react:scale-125 transition-transform">❤️</span>
                              <span className="text-xs font-black text-gray-500">{msg.reactions['❤️']?.length || 0}</span>
                          </button>
                          <button onClick={() => handleReact(msg.id, '👍')} title={getReactionTitle(msg.reactions['👍'])} className="flex items-center gap-1.5 bg-white border border-gray-100 px-3 py-1 rounded-full hover:bg-gray-50 transition-all shadow-sm active:scale-95 group/react">
                              <span className="text-xs group-hover/react:scale-125 transition-transform">👍</span>
                              <span className="text-xs font-black text-gray-500">{msg.reactions['👍']?.length || 0}</span>
                          </button>
                          <button onClick={() => handleReact(msg.id, '🔥')} title={getReactionTitle(msg.reactions['🔥'])} className="flex items-center gap-1.5 bg-white border border-gray-100 px-3 py-1 rounded-full hover:bg-gray-50 transition-all shadow-sm active:scale-95 group/react">
                              <span className="text-xs group-hover/react:scale-125 transition-transform">🔥</span>
                              <span className="text-xs font-black text-gray-500">{msg.reactions['🔥']?.length || 0}</span>
                          </button>
                      </div>
                   </div>
               </div>
           ))}
        </div>

      </div>
    </GenericPage>
  );
}
