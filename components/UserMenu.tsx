import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User as UserIcon, ChevronDown, Settings, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';

export function UserMenu() {
  const { userProfile, signIn, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  if (!userProfile || userProfile?.uid === 'guest') {
    return (
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col items-end mr-2">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Chế độ</span>
          <span className="text-sm font-medium text-stone-900">Khách</span>
        </div>
        <button
          onClick={() => router.push('/login')}
          className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-all shadow-sm active:scale-95 text-sm font-medium"
        >
          <LogIn size={16} />
          Đăng nhập
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 pr-3 bg-stone-100 hover:bg-stone-200 rounded-full transition-all border border-stone-200/50"
      >
        {userProfile?.photoURL ? (
          <div className="relative w-8 h-8">
            <Image src={userProfile.photoURL} alt="" fill className="rounded-full object-cover" referrerPolicy="no-referrer" unoptimized />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <UserIcon size={16} />
          </div>
        )}
        <span className="text-sm font-medium text-stone-700 hidden sm:inline">{userProfile?.displayName}</span>
        <ChevronDown size={14} className={`text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-100 py-2 z-20 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-stone-50 mb-1">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Tài khoản</p>
                <p className="text-sm font-medium text-stone-900 truncate">{userProfile?.displayName}</p>
                <p className="text-xs text-stone-400 truncate">@{userProfile?.username}</p>
              </div>
              
              <button className="w-full text-left px-4 py-2.5 text-sm text-stone-600 hover:bg-stone-50 flex items-center gap-3 transition-colors">
                <Settings size={16} />
                Cài đặt
              </button>

              <button 
                onClick={() => { logout(); setIsOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors border-t border-stone-50 mt-1"
              >
                <LogOut size={16} />
                Đăng xuất
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
