'use client';

import React, { useState } from 'react';
import { Plus, Image as ImageIcon, MessageSquare, Star, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuickActionsProps {
  onAddPhoto?: () => void;
  onAddNote?: () => void;
  onAddMilestone?: () => void;
}

export function QuickActions({ onAddPhoto, onAddNote, onAddMilestone }: QuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { icon: <ImageIcon size={20} />, label: 'Đăng ảnh', color: 'bg-blue-500', onClick: onAddPhoto },
    { icon: <MessageSquare size={20} />, label: 'Ghi chú', color: 'bg-emerald-500', onClick: onAddNote },
    { icon: <Star size={20} />, label: 'Hành trình', color: 'bg-amber-500', onClick: onAddMilestone },
  ];

  return (
    <div className="fixed bottom-24 lg:bottom-10 right-6 lg:right-10 z-[60] flex flex-col items-end gap-3 px-1">
      <AnimatePresence>
        {isOpen && (
          <div className="flex flex-col items-end gap-3 mb-2">
            {actions.map((action, i) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3"
              >
                <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold text-stone-700 shadow-sm border border-stone-200">
                  {action.label}
                </span>
                <button
                  onClick={() => {
                    action.onClick?.();
                    setIsOpen(false);
                  }}
                  className={`w-12 h-12 ${action.color} text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform`}
                >
                  {action.icon}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <motion.button
        animate={{ rotate: isOpen ? 45 : 0 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 ${isOpen ? 'bg-stone-800' : 'bg-primary'} text-white rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 active:scale-90 transition-all z-10`}
      >
        <Plus size={32} />
      </motion.button>

      {/* Backdrop when open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm -z-10"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
