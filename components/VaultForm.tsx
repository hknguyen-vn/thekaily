import React, { useState } from 'react';
import { Send, X, MessageSquareHeart, Globe, Users, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VaultFormProps {
  onAdd: (content: string, privacy: string) => Promise<void>;
  onClose?: () => void;
}

export function VaultForm({ onAdd, onClose }: VaultFormProps) {
  const [content, setContent] = useState('');
  const [privacy, setPrivacy] = useState('family');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAdd(content, privacy);
      setContent('');
      if (onClose) onClose();
    } catch (err) {
      console.error('Error adding memory:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ type: "spring", damping: 28, stiffness: 350 }}
      className="bg-white rounded-[2.5rem] shadow-2xl border border-stone-100 p-8 w-full max-w-lg relative z-50 max-h-[85vh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-stone-100 transition-all text-stone-400 hover:text-stone-900"
        >
          <X size={24} />
        </button>
      )}

      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
          <MessageSquareHeart size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-headline font-light text-stone-900">Thêm kỷ niệm</h2>
          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Ghi lại những khoảnh khắc</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Kể lại một kỷ niệm đáng nhớ..."
            className="w-full h-40 p-6 bg-stone-50 rounded-2xl border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all resize-none text-stone-800 placeholder:text-stone-300 font-body text-base lg:text-lg"
            autoFocus
          />
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3">
          {[
            { id: 'public', label: 'Công khai', icon: Globe, color: 'bg-teal-50 text-teal-700 border-teal-100' },
            { id: 'family', label: 'Gia đình', icon: Users, color: 'bg-primary/5 text-primary border-primary/10' },
            { id: 'private', label: 'Riêng tư', icon: Lock, color: 'bg-stone-100 text-stone-600 border-stone-200' },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setPrivacy(option.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-all text-xs sm:text-sm font-medium ${
                privacy === option.id
                  ? option.color
                  : 'bg-white text-stone-400 border-stone-100 hover:border-stone-200'
              }`}
            >
              <option.icon size={16} />
              {option.label}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={!content.trim() || isSubmitting}
          className="w-full py-4.5 bg-stone-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-stone-800 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:scale-100 mt-4"
        >
          {isSubmitting ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Send size={20} />
              <span>Gửi vào kho lưu trữ</span>
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}
