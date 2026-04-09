'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Heart, ArrowLeft, ShieldCheck, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';

const PEOPLE_OPTIONS = [
  { name: 'Mẹ', id: 'mom', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mom&backgroundColor=ffdfbf' },
  { name: 'Bố', id: 'dad', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dad&backgroundColor=b6e3f4' },
  { name: 'Sam', id: 'kid', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam&backgroundColor=ffadad' },
  { name: 'Min', id: 'kid', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Min&backgroundColor=caffbf' }
];

export default function LoginPage() {
  const { userProfile, signIn, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [selectedPerson, setSelectedPerson] = useState<typeof PEOPLE_OPTIONS[0] | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (userProfile && !authLoading) {
      router.push('/');
    }
  }, [userProfile, authLoading, router]);

  const handleSelectUser = (person: typeof PEOPLE_OPTIONS[0]) => {
    setSelectedPerson(person);
    setError(null);
    setPassword('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPerson) return;
    
    setIsLoggingIn(true);
    setError(null);
    
    const result = await signIn(selectedPerson.id, password);
    
    if (result && result.error) {
      setError(result.error);
      setIsLoggingIn(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center"
        >
          <Heart className="text-primary" size={32} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface relative overflow-hidden font-body">
      {/* Abstract Background Ornaments */}
      <div className="absolute top-0 left-0 w-full h-full opacity-40 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-stone-200/40 rounded-full blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full px-6 relative z-10"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white/50 text-center">
          <AnimatePresence mode="wait">
            {!selectedPerson ? (
              <motion.div
                key="selection"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-10">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20"
                  >
                    <Heart size={32} />
                  </motion.div>
                  <h1 className="text-3xl font-bold text-stone-900 font-headline mb-3 tracking-tight">The Kaily</h1>
                  <p className="text-stone-500 text-sm">Chào mừng bạn về nhà. Bạn là ai nhỉ?</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {PEOPLE_OPTIONS.map((person) => (
                    <motion.button
                      key={person.name}
                      whileHover={{ y: -4, backgroundColor: 'rgba(255,255,255,1)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectUser(person)}
                      className="flex flex-col items-center gap-3 p-5 rounded-3xl bg-stone-50/50 border border-stone-100 transition-all group"
                    >
                      <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-sm transition-transform group-hover:scale-105">
                        <Image 
                          src={person.avatar} 
                          alt={person.name} 
                          fill 
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <span className="font-semibold text-stone-700 text-sm">{person.name}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <button 
                  onClick={() => setSelectedPerson(null)}
                  className="absolute top-0 left-0 p-2 text-stone-400 hover:text-stone-600 transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>

                <div className="mb-8">
                  <div className="relative w-24 h-24 mx-auto mb-6">
                    <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
                    <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md">
                      <Image 
                        src={selectedPerson.avatar} 
                        alt={selectedPerson.name} 
                        fill 
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-stone-900 font-headline mb-2">Chào {selectedPerson.name}</h2>
                  <p className="text-stone-500 text-sm flex items-center justify-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    Nhập mã bảo vệ gia đình
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="relative">
                    <input
                      autoFocus
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••"
                      className="w-full text-center text-3xl tracking-[0.5em] py-5 bg-stone-50 border border-stone-100 rounded-3xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all placeholder:text-stone-200"
                    />
                    
                    {error && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-xs font-medium mt-3"
                      >
                        {error}
                      </motion.p>
                    )}
                  </div>
                  
                  <button
                    disabled={isLoggingIn}
                    type="submit"
                    className="w-full py-5 bg-stone-900 text-white font-bold rounded-3xl shadow-xl shadow-stone-900/10 hover:bg-stone-800 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {isLoggingIn ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Xác nhận'
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-8 text-center text-stone-400 text-xs tracking-widest uppercase font-medium">
          Family Vault &copy; 2026
        </p>
      </motion.div>
    </div>
  );
}
