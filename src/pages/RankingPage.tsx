import React, { useEffect, useState } from 'react';
import { Trophy, Medal, Star } from 'lucide-react';
import { AnimatedDiv, AnimatedText } from "@/components/ui/AnimatedText";
import { VuiCoin } from "@/components/ui/VuiCoin";
import { safeFetch } from '@/lib/utils';
import confetti from 'canvas-confetti';

export function RankingPage() {
    const [ranks, setRanks] = useState<Array<{id: string, username: string, score: number, avatar: string}>>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        setLoading(true);
        const data = await safeFetch('/api/user/leaderboard');
        if (data && data.leaderboard) {
            const fetched = data.leaderboard.map((item: any) => ({
                id: item.user_uuid,
                username: item.user_name || item.user_email?.split('@')[0] || 'Unknown',
                score: item.monthly_balance || 0,
                avatar: item.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user_uuid}`
            }));
            setRanks(fetched);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (ranks.length > 0) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    }, [ranks]);

    const top3 = ranks.slice(0, 3);
    const rest = ranks.slice(3);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3 text-slate-800">
                    <Trophy className="text-yellow-500" size={28} />
                    <h2 className="text-2xl font-bold uppercase tracking-tight">
                        <AnimatedText delay={0.1}>Xếp Hạng</AnimatedText>
                    </h2>
                </div>
                <div className="px-4 py-1.5 bg-slate-100 rounded-full text-xs font-bold text-slate-500 uppercase tracking-wider border border-slate-200">
                    Tháng này
                </div>
            </div>

            {loading ? (
                <div className="text-center p-20 bg-white rounded-3xl border border-dashed border-gray-100 flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Đang tải bảng xếp hạng...</p>
                </div>
            ) : ranks.length > 0 ? (
              <AnimatedDiv delay={0.2} className="relative flex justify-center items-end gap-2 mb-10 pt-16 pb-0 px-4 bg-gradient-to-br from-slate-950 via-slate-800 to-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-700">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950"></div>
                  <div className="absolute bottom-0 w-full h-8 bg-black/40 blur-xl"></div>
                   
                   {/* Top 3 display */}
                   {top3[1] && (
                       <div className="z-10 flex flex-col items-center drop-shadow-2xl">
                           <img src={top3[1].avatar} className="w-16 h-16 rounded-full border-2 border-slate-400 mb-2 bg-white" alt="Avatar"/>
                           <div className="font-bold text-white text-xs bg-slate-800 px-2 py-0.5 rounded uppercase">{top3[1].username}</div>
                           <div className="text-emerald-400 text-xs font-bold my-1">{top3[1].score.toLocaleString()} VuiCoin</div>
                           <div className="w-20 h-24 bg-gradient-to-t from-slate-600 to-slate-400 rounded-t-lg flex justify-center pt-2 shadow-inner border border-slate-500">
                               <span className="text-3xl font-black text-slate-300 drop-shadow-md">2</span>
                           </div>
                       </div>
                   )}
                   {top3[0] && (
                       <div className="z-20 flex flex-col items-center -translate-y-4 drop-shadow-2xl">
                           <Trophy className="text-yellow-400 mb-1 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" size={32}/>
                           <img src={top3[0].avatar} className="w-20 h-20 rounded-full border-4 border-yellow-400 mb-2 bg-white" alt="Avatar"/>
                           <div className="font-bold text-white text-sm bg-slate-800 px-3 py-1 rounded-lg uppercase">{top3[0].username}</div>
                           <div className="text-yellow-400 text-sm font-bold my-1 ">{top3[0].score.toLocaleString()} VuiCoin</div>
                           <div className="w-24 h-32 bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-t-lg flex justify-center pt-2 shadow-[0_0_20px_rgba(250,204,21,0.3)] border border-yellow-300">
                               <span className="text-4xl font-black text-yellow-100 drop-shadow-lg">1</span>
                           </div>
                       </div>
                   )}
                   {top3[2] && (
                       <div className="z-10 flex flex-col items-center drop-shadow-2xl">
                           <img src={top3[2].avatar} className="w-16 h-16 rounded-full border-2 border-orange-400 mb-2 bg-white" alt="Avatar"/>
                           <div className="font-bold text-white text-xs bg-slate-800 px-2 py-0.5 rounded uppercase">{top3[2].username}</div>
                           <div className="text-emerald-400 text-xs font-bold my-1">{top3[2].score.toLocaleString()} VuiCoin</div>
                           <div className="w-20 h-20 bg-gradient-to-t from-orange-700 to-orange-500 rounded-t-lg flex justify-center pt-2 shadow-inner border border-orange-400">
                               <span className="text-3xl font-black text-orange-200 drop-shadow-md">3</span>
                           </div>
                       </div>
                   )}
              </AnimatedDiv>
            ) : (
                <div className="text-center p-20 bg-white rounded-3xl border-2 border-dashed border-gray-100 text-gray-400 font-bold uppercase tracking-widest text-xs">Chưa có dữ liệu xếp hạng</div>
            )}
            
            {rest.length > 0 && (
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <div className="space-y-3">
                        {rest.map((r, i) => (
                             <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                               <div className="flex items-center gap-3">
                                  <div className="font-black text-gray-400 w-6 text-center">{i + 4}</div>
                                  <img src={r.avatar} className="w-10 h-10 rounded-full bg-white" />
                                  <div className="font-bold text-sm uppercase">{r.username}</div>
                               </div>
                               <div className="font-bold text-emerald-500 flex items-center gap-1 text-sm">
                                  {r.score.toLocaleString()} <VuiCoin size={14} className="text-orange-500"/>
                               </div>
                             </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
