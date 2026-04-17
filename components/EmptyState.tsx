'use client';

import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  className = "" 
}: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center p-8 text-center bg-stone-50/50 rounded-[2.5rem] border border-dashed border-stone-200 ${className}`}
    >
      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-stone-100 flex items-center justify-center mb-4 text-stone-300">
        <Icon size={32} strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-bold text-stone-800 mb-1 font-headline">{title}</h3>
      <p className="text-stone-500 text-sm max-w-[240px] leading-relaxed mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <button 
          onClick={onAction}
          className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}
