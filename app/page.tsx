'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import dynamic from 'next/dynamic';

const StatsStrip = dynamic(() => import('@/components/StatsStrip').then(mod => mod.StatsStrip), { loading: () => <div className="h-20 bg-stone-50 animate-pulse rounded-2xl mb-8" /> });
const FamilyVault = dynamic(() => import('@/components/FamilyVault').then(mod => mod.FamilyVault), { loading: () => <div className="h-96 bg-stone-50 animate-pulse rounded-3xl mb-8" /> });
const LegacyGallery = dynamic(() => import('@/components/LegacyGallery').then(mod => mod.LegacyGallery), { loading: () => <div className="h-96 bg-stone-50 animate-pulse rounded-3xl mb-8" /> });
const GrowthPath = dynamic(() => import('@/components/GrowthPath').then(mod => mod.GrowthPath), { loading: () => <div className="h-96 bg-stone-50 animate-pulse rounded-3xl mb-8" /> });
const FeaturedMemories = dynamic(() => import('@/components/FeaturedMemories').then(mod => mod.FeaturedMemories), { loading: () => <div className="h-[500px] bg-stone-50 animate-pulse rounded-3xl mb-12" /> });
const OnThisDay = dynamic(() => import('@/components/OnThisDay').then(mod => mod.OnThisDay));
const ImportantDates = dynamic(() => import('@/components/ImportantDates').then(mod => mod.ImportantDates));
import { FamilyTree } from '@/components/FamilyTree';
import { UserMenu } from '@/components/UserMenu';
import {
  Plus,
  Search,
  Calendar as CalendarIcon,
  Bell,
  ChevronRight,
  Mail,
  Facebook,
  Instagram,
  Twitter as TwitterIcon,
  Archive,
  Image as ImageIcon,
  Activity,
  PlusCircle,
  Network
} from 'lucide-react';
import { Notifications } from '@/components/Notifications';
import { motion, useScroll, useTransform, AnimatePresence, useMotionValueEvent } from 'motion/react';

export default function Home() {
  const { userProfile, loading } = useAuth();
  const [noteCount, setNoteCount] = useState(0);
  const [milestoneCount, setMilestoneCount] = useState(0);
  const [greeting, setGreeting] = useState('Chào bạn');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const { scrollY } = useScroll();

  useEffect(() => {
    if (!loading && !userProfile) {
      window.location.href = '/login';
    }
  }, [userProfile, loading]);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 150) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Chào buổi sáng');
    else if (hour < 18) setGreeting('Chào buổi chiều');
    else setGreeting('Chào buổi tối');

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading || !userProfile) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-stone-200 border-t-primary rounded-full mb-6"
        />
        <h2 className="text-xl font-headline font-light text-stone-900">Đang chuẩn bị không gian gia đình...</h2>
      </div>
    );
  }

  const displayName = userProfile?.displayName || 'cả nhà';

  return (
    <div className="bg-surface text-on-surface min-h-screen font-body selection:bg-primary-container selection:text-on-primary-container overflow-x-hidden">
      {/* TopAppBar */}
      <motion.header
        initial={{ y: 0 }}
        animate={{
          y: isVisible ? 0 : -100,
          backgroundColor: isScrolled ? 'rgba(252, 249, 246, 0.95)' : 'rgba(252, 249, 246, 0.5)',
          backdropFilter: isScrolled ? 'blur(20px)' : 'blur(5px)',
          boxShadow: isScrolled ? '0 10px 30px -10px rgba(0,0,0,0.05)' : 'none',
          borderBottom: isScrolled ? '1px solid rgba(0,0,0,0.03)' : '1px solid transparent'
        }}
        transition={{ 
          y: { duration: 0.3, ease: "easeInOut" },
          default: { duration: 0.3 }
        }}
        className="fixed top-0 w-full z-50 flex justify-between items-center px-6 md:px-10 py-5 transition-all duration-300"
      >
        <div className="flex items-center gap-8">
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-light text-stone-800 tracking-tighter font-headline cursor-default"
          >
            The Kaily
          </motion.span>
          <nav className="hidden lg:flex gap-8">
            {['Thư viện', 'Kho lưu trữ', 'Hành trình', 'Gia phả'].map((item, i) => (
              <motion.a
                key={item}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                className="text-stone-500 hover:text-primary transition-colors font-headline tracking-tight font-light text-sm"
                href={item === 'Thư viện' ? '#legacy' : item === 'Kho lưu trữ' ? '#vault' : item === 'Hành trình' ? '#growth' : '/family-tree'}
              >
                {item}
              </motion.a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="lg:hidden flex items-center gap-1">
            {[
              { label: 'Thư viện', id: '#legacy', icon: <ImageIcon size={20} /> },
              { label: 'Kho lưu trữ', id: '#vault', icon: <Archive size={20} /> },
              { label: 'Hành trình', id: '#growth', icon: <Activity size={20} /> },
              { label: 'Gia phả', id: '/family-tree', icon: <Network size={20} /> }
            ].map((item) => (
              <a
                key={item.label}
                href={item.id}
                className="p-2.5 text-stone-400 hover:text-primary transition-colors active:scale-90"
                title={item.label}
                aria-label={item.label}
              >
                {item.icon}
              </a>
            ))}
          </div>
          <div className="h-4 w-px bg-stone-200 mx-1 lg:hidden" />
          <Notifications />
          <UserMenu />
        </div>
      </motion.header>

      {/* SideNavBar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-72 flex-col p-8 z-40 bg-stone-100/50 backdrop-blur-lg rounded-r-[3rem] shadow-[0px_20px_40px_rgba(45,52,51,0.04)]">
        <div className="mb-12 mt-20">
          <h2 className="text-xl font-headline font-light text-stone-900 tracking-tight">The Kaily</h2>
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold opacity-60">Digital Heritage</p>
        </div>
        <div className="flex flex-col gap-2">
          {[
            { id: 'legacy', icon: <ImageIcon size={20} />, label: 'Thư viện', href: '#legacy' },
            { id: 'vault', icon: <Archive size={20} />, label: 'Kho lưu trữ', href: '#vault' },
            { id: 'growth', icon: <Activity size={20} />, label: 'Hành trình', href: '#growth' },
            { id: 'tree', icon: <Network size={20} />, label: 'Cây gia phả', href: '/family-tree' }
          ].map((item) => (
            <motion.a
              key={item.id}
              whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.8)' }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-4 px-6 py-4 text-stone-500 hover:text-stone-900 rounded-2xl transition-all"
              href={item.href}
            >
              {item.icon}
              <span className="font-body text-sm font-medium">{item.label}</span>
            </motion.a>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <motion.main
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="lg:ml-72 pt-28 pb-32 px-6 md:px-10 max-w-7xl mx-auto"
      >

        {/* Personalized Greeting */}
        <div className="mb-12">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-6xl font-black text-stone-900 font-headline tracking-tighter leading-none"
          >
            {greeting}, <br /> <span className="text-primary italic font-light">{displayName}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-stone-400 mt-4 text-xl font-light"
          >
            Cùng lưu giữ những kỷ niệm quý giá hôm nay.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 flex flex-col">
            <FeaturedMemories />
          </div>
          <div className="lg:col-span-1 flex flex-col">
            <OnThisDay />
          </div>
        </div>

        {/* Sections with divider feel */}
        <div className="space-y-24">
          <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <ImportantDates />
          </section>


          <section id="vault" className="scroll-mt-32 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <StatsStrip noteCount={noteCount} milestoneCount={milestoneCount} />
            <FamilyVault onNoteCountChange={setNoteCount} />
          </section>

          <section id="legacy" className="scroll-mt-32 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-400">
            <LegacyGallery />
          </section>

          <section id="growth" className="scroll-mt-32 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
            <GrowthPath onMilestoneCountChange={setMilestoneCount} />
          </section>
        </div>
      </motion.main>

      {/* No more BottomNavBar for an airy feel */}
    </div>
  );
}
