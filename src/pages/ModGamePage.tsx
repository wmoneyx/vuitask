import React from 'react';
import { Gamepad2, Download, AlertCircle } from 'lucide-react';
import { AnimatedDiv, AnimatedText } from "@/components/ui/AnimatedText";

const MODS: Array<{id: number, name: string, version: string, desc: string}> = [];

export function ModGamePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-slate-800 mb-6">
        <Gamepad2 className="text-purple-500" size={28} />
        <h2 className="text-2xl font-bold uppercase tracking-tight">
          <AnimatedText delay={0.1}>Mod Game</AnimatedText>
        </h2>
      </div>

      <AnimatedDiv delay={0.2} className="space-y-4">
        {MODS.length > 0 ? MODS.map(mod => (
            <div key={mod.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:scale-105 transition-transform duration-200">
                <div className='flex items-center gap-4'>
                    <div className='w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600'>
                        <Gamepad2 />
                    </div>
                    <div>
                        <h4 className='font-black text-slate-900'>{mod.name}</h4>
                        <div className='text-xs text-gray-400 font-bold uppercase'>{mod.version}</div>
                        <p className='text-sm text-gray-500'>{mod.desc}</p>
                    </div>
                </div>
                <button className='bg-slate-900 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-slate-800 uppercase'>
                    <Download size={18}/> Tải ngay
                </button>
            </div>
        )) : <div className="text-center p-10 bg-white rounded-3xl text-gray-500 font-bold">Chưa có bản mod nào.</div>}
      </AnimatedDiv>
    </div>
  );
}
