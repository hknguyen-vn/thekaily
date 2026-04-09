import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary';

interface Photo {
  id: string;
  url: string;
  createdAt: string;
  authorUid?: string;
  authorName?: string;
}

import { motion, AnimatePresence } from 'motion/react';

export function FeaturedMemories() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPhotos();
  }, []);

  useEffect(() => {
    if (photos.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, 6000); // Wait 6s for better cinematic feel

    return () => clearInterval(timer);
  }, [photos.length]);

  const fetchPhotos = async () => {
    try {
      const response = await fetch('/api/photos');
      if (!response.ok) throw new Error('Failed to fetch photos');
      const data = await response.json();
      const sortedData = data.slice(0, 10);
      
      if (sortedData.length > 0) {
        setPhotos(sortedData);
      } else {
        setPhotos([
          { id: '1', url: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?auto=format&fit=crop&q=80', createdAt: new Date().toISOString() },
          { id: '2', url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80', createdAt: new Date().toISOString() },
        ]);
      }
    } catch (err) {
      console.error('Error fetching featured photos:', err);
      setPhotos([
        { id: '1', url: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?auto=format&fit=crop&q=80', createdAt: new Date().toISOString() },
        { id: '2', url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80', createdAt: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % photos.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);

  if (loading) {
    return (
      <div className="w-full h-[500px] bg-stone-100/50 rounded-[2.5rem] animate-pulse flex items-center justify-center border border-stone-200/50">
        <ImageIcon className="text-stone-300" size={48} />
      </div>
    );
  }

  return (
    <div className="relative w-full h-[500px] rounded-[2.5rem] overflow-hidden group shadow-2xl shadow-stone-900/10 bg-black translate-z-0">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={photos[currentIndex]?.id}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0"
        >
          {/* Blurred Background for Portrait images */}
          <Image
            src={getOptimizedCloudinaryUrl(photos[currentIndex].url, 800)}
            alt=""
            fill
            sizes="100vw"
            className="object-cover blur-2xl opacity-50 scale-110"
            referrerPolicy="no-referrer"
            unoptimized={!photos[currentIndex].url.includes('res.cloudinary.com')}
          />
          
          {/* Main Focused Image */}
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <div className="relative w-full h-full">
              <Image
                src={getOptimizedCloudinaryUrl(photos[currentIndex].url, 1200)}
                alt={photos[currentIndex].authorName || "Featured Memory"}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                className="object-contain drop-shadow-2xl"
                referrerPolicy="no-referrer"
                unoptimized={!photos[currentIndex].url.includes('res.cloudinary.com')}
                priority
              />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          <div className="absolute bottom-10 left-10 right-10 z-10 text-white">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-2 mb-3"
            >
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] uppercase tracking-widest font-bold">Kỷ niệm nổi bật</span>
            </motion.div>
            <motion.h3 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-3xl font-bold font-headline leading-tight"
            >
              Lưu giữ từng khoảnh khắc <br/> của chúng ta.
            </motion.h3>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-6 z-20 pointer-events-none">
        <motion.button
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.4)' }}
          whileTap={{ scale: 0.9 }}
          onClick={prevSlide}
          className="p-3 rounded-full bg-white/20 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto border border-white/20"
        >
          <ChevronLeft size={24} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.4)' }}
          whileTap={{ scale: 0.9 }}
          onClick={nextSlide}
          className="p-3 rounded-full bg-white/20 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto border border-white/20"
        >
          <ChevronRight size={24} />
        </motion.button>
      </div>

      <div className="absolute bottom-10 right-10 z-20 flex gap-2">
        {photos.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
