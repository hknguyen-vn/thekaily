import React from 'react';
import { FileText, Flag, Heart } from 'lucide-react';

export function StatsStrip({ noteCount = 0, milestoneCount = 0 }) {
  return (
    <div className="grid grid-cols-3 gap-4 h-full">
      <div className="bg-white p-4 rounded-3xl border border-stone-100 shadow-sm flex flex-col items-center justify-center text-center hover:border-primary/20 hover:shadow-md transition-all">
        <FileText className="text-stone-400 mb-2" size={20} />
        <span className="text-2xl font-bold text-stone-800">{noteCount}</span>
        <span className="text-xs text-stone-500 font-medium uppercase tracking-wider mt-1">Lời nhắn</span>
      </div>
      <div className="bg-white p-4 rounded-3xl border border-stone-100 shadow-sm flex flex-col items-center justify-center text-center hover:border-primary/20 hover:shadow-md transition-all">
        <Flag className="text-stone-400 mb-2" size={20} />
        <span className="text-2xl font-bold text-stone-800">{milestoneCount}</span>
        <span className="text-xs text-stone-500 font-medium uppercase tracking-wider mt-1">Cột mốc</span>
      </div>
      <div className="bg-primary/5 p-4 rounded-3xl border border-primary/10 shadow-sm flex flex-col items-center justify-center text-center hover:border-primary/20 hover:shadow-md transition-all">
        <Heart className="text-primary/60 mb-2" size={20} />
        <span className="text-2xl font-bold text-primary">∞</span>
        <span className="text-xs text-primary/80 font-medium uppercase tracking-wider mt-1">Yêu thương</span>
      </div>
    </div>
  );
}
