'use client';

import React from 'react';
import { FamilyTree } from '@/components/FamilyTree';
import { ArrowLeft, Share2, ZoomIn, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';

export default function FamilyTreePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FCF9F6] flex flex-col overflow-hidden">
      {/* Header Điều hướng */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 w-full z-50 flex justify-between items-center px-6 md:px-10 py-6 bg-white/70 backdrop-blur-xl border-b border-stone-100"
      >
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.back()}
            className="p-3 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-full transition-all active:scale-95"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-bold text-stone-900 font-headline tracking-tight leading-none">Cây Gia Phả</h1>
            <p className="text-[10px] uppercase font-bold text-orange-500 tracking-[0.2em] mt-1.5 opacity-80">Gốc rễ vững bền - Tương lai rạng ngời</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-full text-sm font-medium transition-all">
            <ZoomIn size={16} />
            Phóng to
          </button>
          <button className="p-3 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-full transition-all">
            <Download size={20} />
          </button>
          <button className="p-3 bg-primary text-white rounded-full transition-all shadow-lg shadow-primary/20 active:scale-95">
            <Share2 size={20} />
          </button>
        </div>
      </motion.header>

      {/* Nội dung chính Fullscreen */}
      <main className="flex-grow w-full relative h-[calc(100vh-100px)] mt-[100px] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px]">
        <div className="absolute inset-0 p-4 md:p-10">
          <FamilyTree isPage={true} />
        </div>
      </main>

      {/* Ornament Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 opacity-40">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-orange-100/30 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
