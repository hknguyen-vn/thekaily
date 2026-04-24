'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ImagePlus, Camera, Trash2, Loader2, X, Filter, ChevronLeft, ChevronRight, Play, Pause, Volume2, Trophy, Image as ImageIcon, MoreHorizontal, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/contexts/AuthContext';
import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary';
import { EmptyState } from './EmptyState';

interface Photo {
  id: string;
  url: string;
  categories?: string[];
  createdAt: string;
  caption?: string;
  date_taken?: string;
  authorUid?: string;
  authorName?: string;
}

const SUNCLUB_SECTIONS = [
  'Bước khởi đầu, Thành lập CLB T09/2025',
  'Quá trình sinh hoạt câu lạc bộ',
  'Các giải đấu & giao lưu'
];

const FILTER_SECTIONS = [
  { label: 'Tất cả', value: 'All' },
  { label: 'Khởi đầu', value: 'Bước khởi đầu, Thành lập CLB T09/2025' },
  { label: 'Sinh hoạt', value: 'Quá trình sinh hoạt câu lạc bộ' },
  { label: 'Giải đấu', value: 'Các giải đấu & giao lưu' }
];

export function SunclubGallery() {
  const { userProfile } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadCategories, setUploadCategories] = useState<string[]>([]);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0]);

  const [filterCategory, setFilterCategory] = useState('All');
  const [displayLimit, setDisplayLimit] = useState(14);

  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [editCategories, setEditCategories] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const [isStoryMode, setIsStoryMode] = useState(false);
  const [isAwardMode, setIsAwardMode] = useState(false);
  const [storyIndex, setStoryIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const [isStoryPaused, setIsStoryPaused] = useState(false);
  const [showPhotoActions, setShowPhotoActions] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/sunclub-photos');
        if (res.ok) {
          const data = await res.json();
          setPhotos(data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    setIsEditingTags(false);
    if (selectedPhotoIndex !== null && photos[selectedPhotoIndex]) {
      setEditCategories(photos[selectedPhotoIndex].categories || []);
    }
    setShowPhotoActions(false);
  }, [selectedPhotoIndex, photos]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPhotoIndex === null && !isStoryMode) return;
      if (e.key === 'Escape') {
        setSelectedPhotoIndex(null);
        setIsStoryMode(false);
      }
      if (e.key === 'ArrowLeft') {
        if (isStoryMode) {
          setStoryIndex((prev) => prev === 0 ? photos.length - 1 : prev - 1);
          setStoryProgress(0);
        } else {
          setSelectedPhotoIndex((prev) => prev !== null ? (prev === 0 ? photos.length - 1 : prev - 1) : null);
        }
      }
      if (e.key === 'ArrowRight') {
        if (isStoryMode) {
          setStoryIndex((prev) => prev === photos.length - 1 ? 0 : prev + 1);
          setStoryProgress(0);
        } else {
          setSelectedPhotoIndex((prev) => prev !== null ? (prev === photos.length - 1 ? 0 : prev + 1) : null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoIndex, isStoryMode, photos.length]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;

    if (isStoryMode && photos.length > 0 && !isStoryPaused) {
      progressInterval = setInterval(() => {
        setStoryProgress(prev => Math.min(prev + (50 / 8000) * 100, 100)); // 8 seconds per slide
      }, 50);

      interval = setInterval(() => {
        setStoryIndex(prev => {
          if (prev === photos.length - 1) {
            return 0; // Seamless loop
          }
          setStoryProgress(0);
          return prev + 1;
        });
      }, 8000);
    }

    return () => {
      clearInterval(interval);
      clearInterval(progressInterval);
    };
  }, [isStoryMode, isStoryPaused, photos.length]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setShowUploadModal(true);
    setUploadCategories([]);
    setUploadCaption('');
    setUploadDate(new Date().toISOString().split('T')[0]);
  };

  const toggleUploadCategory = (cat: string) => {
    setUploadCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile || !userProfile) return;
    setUploading(true);
    setShowUploadModal(false);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('caption', uploadCaption);
      formData.append('date_taken', uploadDate);
      formData.append('authorUid', userProfile.uid);
      formData.append('authorName', userProfile.displayName);
      uploadCategories.forEach(cat => formData.append('categories', cat));

      const response = await fetch('/api/sunclub-photos', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const newPhoto = await response.json();
        setPhotos(prev => [newPhoto, ...prev]);
      }
    } catch (err) {
      console.error('Error uploading photo:', err);
      alert('Không thể tải ảnh lên. Vui lòng thử lại sau.');
    } finally {
      setUploading(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const encodedId = encodeURIComponent(id);
      const response = await fetch(`/api/sunclub-photos/${encodedId}`, { method: 'DELETE' });
      if (response.ok) {
        setPhotos(prev => prev.filter(p => p.id !== id));
        setSelectedPhotoIndex(null);
        setShowDeleteConfirm(null);
      }
    } catch (err) {
      console.error('Error deleting photo:', err);
    }
  };

  const filteredPhotos = photos.filter(p =>
    filterCategory === 'All' || p.categories?.includes(filterCategory)
  );

  const displayedPhotos = filteredPhotos.slice(0, displayLimit);

  const getCount = (val: string) => {
    if (val === 'All') return photos.length;
    return photos.filter(p => p.categories?.includes(val)).length;
  };

  return (
    <div className="bg-zinc-950 rounded-3xl p-6 border border-zinc-800 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative w-16 h-16 md:w-20 md:h-20 overflow-hidden rounded-4xl border-2 border-zinc-800 shadow-2xl rotate-3 bg-zinc-900">
            <Image
              src="/sunclub-logo.jpg"
              alt="SunClub Logo"
              fill
              className="object-contain p-1"
              style={{ imageRendering: '-webkit-optimize-contrast' }}
              quality={100}
              priority
            />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-headline font-bold text-white tracking-tight">
              SunClub <span className="text-amber-500 italic">Gallery</span>
            </h1>
            <p className="text-zinc-500 mt-1 font-medium tracking-wide">Lưu trữ những khoảnh khắc vàng rực rỡ</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-zinc-950 hover:bg-amber-400 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
            Tải ảnh lên
          </button>
          <button
            onClick={() => { if (photos.length > 0) { setStoryIndex(0); setStoryProgress(0); setIsStoryPaused(false); setIsStoryMode(true); } }}
            disabled={photos.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-zinc-200 text-black rounded-xl font-bold transition-all shadow-lg shadow-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play size={20} fill="currentColor" />
            Phát Kỷ Niệm
          </button>

          <button
            onClick={() => setIsAwardMode(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-amber-900/20"
          >
            <Trophy size={20} />
            Lễ Trao Giải
          </button>
        </div>
      </div>

      {/* Professional Tab Filtering */}
      <div className="mt-8 mb-10 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-3 min-w-max pb-2">
          {FILTER_SECTIONS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setFilterCategory(tab.value);
                setDisplayLimit(14);
              }}
              className={`relative px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${filterCategory === tab.value
                ? 'text-zinc-950'
                : 'text-zinc-500 hover:text-zinc-300 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800'
                }`}
            >
              {filterCategory === tab.value && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-amber-500 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
              <span className={`relative z-10 text-[10px] px-1.5 py-0.5 rounded-md font-mono ${filterCategory === tab.value
                ? 'bg-black/20 text-black/70'
                : 'bg-zinc-800 text-zinc-500'
                }`}>
                {getCount(tab.value)}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 md:gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex justify-center">
            <Loader2 className="animate-spin text-amber-500" size={40} />
          </div>
        ) : (
          <>
            {displayedPhotos.length === 0 && (
              <EmptyState
                icon={ImageIcon}
                title="Chưa có hình ảnh nào"
                description="Bắt đầu chia sẻ những khoảnh khắc tuyệt vời của Sunclub."
                actionLabel="Tải ảnh lên"
                onAction={() => fileInputRef.current?.click()}
                className="col-span-full py-20"
              />
            )}
            {displayedPhotos.map((photo, idx) => (
              <div
                key={photo.id}
                className="break-inside-avoid mb-4 md:mb-6 rounded-2xl overflow-hidden bg-zinc-900 relative group cursor-pointer border border-zinc-800 hover:border-amber-500/50 transition-all duration-300"
                onClick={() => setSelectedPhotoIndex(idx)}
              >
                <Image
                  src={getOptimizedCloudinaryUrl(photo.url, 500)}
                  alt={photo.caption || "Sunclub memory"}
                  width={500}
                  height={750}
                  className="w-full h-auto block transition-transform duration-700 group-hover:scale-105"
                  unoptimized={!photo.url.includes('res.cloudinary.com')}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/0 to-zinc-950/0 opacity-0 group-hover:opacity-100 transition-opacity z-0" />
              </div>
            ))}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="break-inside-avoid mb-4 md:mb-6 w-full aspect-[4/5] rounded-2xl border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center text-zinc-600 hover:text-amber-500 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all"
            >
              <ImagePlus size={36} className="mb-4" />
              <span className="text-sm font-bold tracking-wide">Thêm ảnh</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
          </>
        )}
      </div>

      {/* Show More Button */}
      {!loading && filteredPhotos.length > displayedPhotos.length && (
        <div className="mt-12 flex justify-center">
          <button
            onClick={() => setDisplayLimit(prev => prev + 20)}
            className="px-8 py-3 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 rounded-2xl font-bold transition-all shadow-xl"
          >
            Xem thêm {filteredPhotos.length - displayedPhotos.length} ảnh
          </button>
        </div>
      )}

      <AnimatePresence>
        {showUploadModal && previewUrl && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-zinc-950/90 backdrop-blur-md" onClick={() => setShowUploadModal(false)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-[2rem] max-w-sm sm:max-w-md w-full shadow-2xl max-h-[90vh] flex flex-col overflow-hidden text-zinc-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-6 border-b border-zinc-800">
                <h3 className="text-lg font-bold text-amber-500">Tải ảnh lên Sunclub</h3>
                <button onClick={() => setShowUploadModal(false)} className="p-2 text-zinc-400 hover:bg-zinc-800 rounded-full transition-colors"><X size={20} /></button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-zinc-950 mb-6 relative border border-zinc-800">
                  <Image src={previewUrl} alt="Preview" fill sizes="(max-width: 768px) 100vw, 400px" className="object-contain" unoptimized />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3 text-zinc-300">Phân loại</label>
                  <div className="flex flex-col gap-2">
                    {SUNCLUB_SECTIONS.map(cat => (
                      <button
                        key={cat}
                        onClick={() => toggleUploadCategory(cat)}
                        className={`px-4 py-2.5 rounded-xl text-sm text-left font-medium transition-all ${uploadCategories.includes(cat) ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3 text-zinc-300">Chú thích</label>
                  <textarea
                    value={uploadCaption}
                    onChange={e => setUploadCaption(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:border-amber-500/50 text-zinc-200 placeholder-zinc-700"
                    rows={3}
                    placeholder="Viết vài dòng kỷ niệm..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t border-zinc-800 bg-zinc-900/50">
                <button onClick={() => setShowUploadModal(false)} className="px-5 py-2.5 text-sm font-bold text-zinc-400 hover:text-zinc-200">Hủy</button>
                <button onClick={handleUploadSubmit} className="px-6 py-2.5 text-sm font-bold bg-amber-500 text-zinc-950 hover:bg-amber-400 rounded-xl shadow-lg shadow-amber-500/20 transition-all">Tải lên</button>
              </div>
            </motion.div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-8 bg-zinc-950/90 backdrop-blur-md" onClick={() => setShowDeleteConfirm(null)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 max-w-[320px] w-full shadow-2xl text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6"><Trash2 size={28} /></div>
              <h3 className="text-xl font-bold mb-3 text-zinc-100">Xác nhận xóa</h3>
              <p className="text-zinc-400 mb-8 leading-relaxed">Bạn chắc chắn muốn xóa bức ảnh này khỏi Sunclub Gallery?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-3.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition-colors font-bold text-sm">Hủy</button>
                <button onClick={() => handleDelete(showDeleteConfirm)} className="flex-1 py-3.5 bg-red-500 text-white hover:bg-red-600 rounded-xl shadow-lg shadow-red-500/20 active:scale-95 transition-all font-bold text-sm">Xóa</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cinematic Story Mode */}
      <AnimatePresence>
        {isStoryMode && photos.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-[#0a0a0a] flex flex-col overflow-hidden font-sans"
          >
            <div className="absolute top-8 left-8 md:top-12 md:left-12 z-50 flex items-center gap-4">
              <div className="relative w-12 h-12 md:w-16 md:h-16 overflow-hidden rounded-full border border-zinc-800 shadow-xl">
                <Image src="/sunclub-logo.jpg" alt="SunClub Logo" fill className="object-cover" />
              </div>
              <div>
                <p className="text-[9px] md:text-[10px] tracking-[0.2em] text-zinc-500 font-bold uppercase mb-1">The Cinematic Archive</p>
                <h1 className="text-2xl md:text-3xl font-headline italic font-bold text-zinc-200">
                  SunClub <span className="font-sans font-normal text-zinc-500 italic">Badminton</span>
                </h1>
              </div>
            </div>

            {/* Top Right: Projector Mode Status */}
            <div className="absolute top-8 right-8 md:top-12 md:right-12 z-50">
              <p className="text-[9px] md:text-[10px] tracking-[0.2em] text-zinc-500 font-bold uppercase">Projector Mode: Enabled</p>
            </div>

            {/* Center Content: Title and Framed Image */}
            <div className="flex-1 w-full h-full relative flex flex-col items-center justify-center pt-20 pb-20">

              <div className="text-center mb-8 md:mb-12 flex flex-col items-center z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-[1px] w-6 md:w-10 bg-zinc-800"></div>
                  <p className="text-[11px] md:text-sm tracking-[0.2em] text-amber-500/80 uppercase font-bold font-sans">
                    {String(storyIndex + 1).padStart(2, '0')} : {photos[storyIndex].categories?.[0] || 'KHOẢNH KHẮC'}
                  </p>
                  <div className="h-[1px] w-6 md:w-10 bg-zinc-800"></div>
                </div>
                <h2 className="text-3xl md:text-5xl lg:text-7xl font-headline text-zinc-100 tracking-tight px-4 leading-tight">
                  {photos[storyIndex].caption || (
                    photos[storyIndex].categories?.[0] === 'Bước khởi đầu, tháng 9/ 2025' ? 'Hành trình bắt đầu từ những bước chân đầu tiên' :
                      photos[storyIndex].categories?.[0] === 'Quá trình sinh hoạt câu lạc bộ' ? 'Gắn kết đam mê qua từng đường cầu' :
                        photos[storyIndex].categories?.[0] === 'Các giải đấu & giao lưu' ? 'Bứt phá giới hạn, rực cháy trên sân đấu' :
                          photos[storyIndex].categories?.[0] === 'Cảm ơn & Hẹn gặp lại' ? 'Gia nhập Sunclub - Nơi đam mê tỏa sáng' :
                            'Sân Cầu Lông Đầy Cảm Xúc'
                  )}
                </h2>
              </div>

              <div className="relative w-[90vw] md:w-[80vw] max-w-5xl h-[45vh] md:h-[60vh] border border-amber-900/40 shadow-[0_0_40px_rgba(0,0,0,0.5)] z-0 bg-black overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={photos[storyIndex].id}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={getOptimizedCloudinaryUrl(photos[storyIndex].url, 1600)}
                      alt="Story"
                      fill
                      sizes="100vw"
                      className="object-contain"
                      unoptimized={!photos[storyIndex].url.includes('res.cloudinary.com')}
                      priority
                    />
                  </motion.div>
                </AnimatePresence>
                {/* Subtle vignette over the image border */}
                <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] pointer-events-none"></div>
              </div>

            </div>

            {/* Bottom Left: Timeline */}
            <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12 z-50">
              <p className="text-[9px] md:text-[10px] tracking-[0.2em] text-zinc-500 font-bold uppercase mb-4">Expedition Timeline</p>
              <div className="flex gap-2.5 items-center">
                {photos.slice(0, 10).map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-500 ${idx === storyIndex ? 'w-3 bg-amber-600 shadow-[0_0_8px_rgba(217,119,6,0.8)]' : 'w-1.5 bg-zinc-800'}`}
                  />
                ))}
                {photos.length > 10 && <span className="text-zinc-600 text-xs ml-2">...</span>}
              </div>
            </div>

            {/* Bottom Right: Controls and Audio */}
            <div className="absolute bottom-8 right-8 md:bottom-12 md:right-12 z-50 flex items-end gap-6 md:gap-8">
              <div className="text-right hidden sm:block">
                <p className="text-[9px] md:text-[10px] tracking-[0.2em] text-zinc-500 font-bold uppercase mb-2">Cinematic Aura</p>
                <p className="text-xs md:text-sm italic text-zinc-300 font-serif" style={{ fontFamily: 'Georgia, serif' }}>
                  Symphony for the Brave — Ambient Mix 44
                </p>
              </div>
              <div className="flex items-center gap-3 md:gap-4">
                <button className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:border-zinc-600 transition-colors">
                  <Volume2 size={16} className="md:w-[18px] md:h-[18px]" />
                </button>
                <button
                  onClick={() => setIsStoryPaused(!isStoryPaused)}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
                >
                  {isStoryPaused ? <Play size={16} fill="currentColor" className="md:w-[18px] md:h-[18px]" /> : <Pause size={16} fill="currentColor" className="md:w-[18px] md:h-[18px]" />}
                </button>
                <button
                  onClick={() => setIsStoryMode(false)}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white flex items-center justify-center text-black hover:bg-zinc-200 transition-colors ml-2 md:ml-4"
                >
                  <X size={16} className="md:w-[18px] md:h-[18px]" />
                </button>
              </div>
            </div>

            {/* Hidden interactive areas for left/right navigation */}
            <div className="absolute inset-y-0 left-0 w-1/4 z-40 cursor-pointer" onClick={(e) => { e.stopPropagation(); setStoryIndex((prev) => prev === 0 ? photos.length - 1 : prev - 1); setStoryProgress(0); }} />
            <div className="absolute inset-y-0 right-0 w-1/4 z-40 cursor-pointer" onClick={(e) => { e.stopPropagation(); setStoryIndex((prev) => prev === photos.length - 1 ? 0 : prev + 1); setStoryProgress(0); }} />

          </motion.div>
        )}
      </AnimatePresence>

      {/* Award Ceremony Mode */}
      <AnimatePresence>
        {isAwardMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[130] bg-[#15803d] flex flex-col items-center justify-center overflow-hidden font-sans"
          >
            {/* Energetic Green Background Effects */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-br from-[#22c55e] via-[#15803d] to-[#14532d]"></div>

              {/* Dynamic Light Beams */}
              <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-white/10 rounded-full blur-[150px] animate-pulse"></div>
              <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-amber-400/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>

              {/* Sporty Pattern */}
              <div className="absolute inset-0 opacity-[0.1]" style={{ backgroundImage: 'linear-gradient(45deg, #ffffff 1px, transparent 1px), linear-gradient(-45deg, #ffffff 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsAwardMode(false)}
              className="absolute top-8 right-8 z-[140] text-white/60 hover:text-white p-3 rounded-full bg-black/10 hover:bg-black/20 transition-all border border-white/10"
            >
              <X size={24} />
            </button>

            {/* Logo with clean glow */}
            <motion.div
              initial={{ y: -50, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="mb-14 z-10"
            >
              <div className="w-36 h-36 md:w-44 md:h-44 border-4 border-white/20 rounded-full flex items-center justify-center bg-white relative overflow-hidden shadow-[0_0_60px_rgba(255,255,255,0.2)]">
                <Image
                  src="/sunclub-logo.jpg"
                  alt="SunClub Logo"
                  fill
                  className="object-contain p-2"
                  style={{ imageRendering: '-webkit-optimize-contrast' }}
                  quality={100}
                />
                <div className="absolute inset-0 border-2 border-white/40 rounded-full animate-ping opacity-20"></div>
              </div>
            </motion.div>

            {/* Content */}
            <div className="text-center z-10 px-6 max-w-7xl">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="text-amber-300 font-bold tracking-[0.8em] uppercase text-xs md:text-sm mb-10 drop-shadow-lg"
              >
                Trao Thưởng
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 1.2, ease: [0.2, 0.65, 0.3, 0.9] }}
                className="text-5xl md:text-7xl lg:text-8xl font-headline font-bold text-white leading-[1.1] mb-12 uppercase tracking-tight"
                style={{
                  textShadow: '0 10px 30px rgba(0,0,0,0.3)'
                }}
              >
                Giải Cầu Lông <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]">
                  SUN CLUB Open
                </span> <br />
                <span className="text-xl md:text-3xl lg:text-4xl font-sans font-medium tracking-[0.5em] text-white/70 mt-10 block">
                  Lần 3 — 04/2026
                </span>
              </motion.h1>

              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "28rem", opacity: 1 }}
                transition={{ delay: 1.8, duration: 1.5 }}
                className="h-[2px] bg-gradient-to-r from-transparent via-white/40 to-transparent mx-auto mb-14"
              ></motion.div>

              <motion.p
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2.5, duration: 1 }}
                className="text-white font-headline font-bold italic text-2xl md:text-4xl tracking-[0.3em] uppercase drop-shadow-lg"
              >
                Cùng chơi, cùng tiến bộ
              </motion.p>
            </div>

            {/* Vibrant Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/20 pointer-events-none"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Standard Full View Modal */}
      <AnimatePresence>
        {selectedPhotoIndex !== null && photos[selectedPhotoIndex] && !isStoryMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-zinc-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-8"
            onClick={() => setSelectedPhotoIndex(null)}
          >
            <motion.button
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedPhotoIndex(null)}
              className="absolute top-6 right-6 md:top-10 md:right-10 text-zinc-300 hover:text-white p-4 rounded-full bg-zinc-900/50 hover:bg-zinc-800 transition-all z-[70] border border-white/5"
            >
              <X size={24} />
            </motion.button>

            {photos.length > 1 && (
              <>
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={(e) => { e.stopPropagation(); setSelectedPhotoIndex((prev) => prev !== null ? (prev === 0 ? photos.length - 1 : prev - 1) : null); }}
                  className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-4 rounded-full bg-zinc-900/50 hover:bg-zinc-800 transition-all z-[60]"
                >
                  <ChevronLeft size={32} />
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={(e) => { e.stopPropagation(); setSelectedPhotoIndex((prev) => prev !== null ? (prev === photos.length - 1 ? 0 : prev + 1) : null); }}
                  className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-4 rounded-full bg-zinc-900/50 hover:bg-zinc-800 transition-all z-[60]"
                >
                  <ChevronRight size={32} />
                </motion.button>
              </>
            )}

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative w-full h-[65vh] md:h-[75vh] z-[50] flex items-center justify-center touch-none"
              onClick={e => e.stopPropagation()}
            >
              <Image
                src={getOptimizedCloudinaryUrl(photos[selectedPhotoIndex].url, 1600)}
                alt="Full view"
                fill
                sizes="100vw"
                className="object-contain"
                unoptimized={!photos[selectedPhotoIndex].url.includes('res.cloudinary.com')}
                priority
              />
            </motion.div>

            {(photos[selectedPhotoIndex].caption ||
              (photos[selectedPhotoIndex].categories && photos[selectedPhotoIndex].categories.length > 0) ||
              (userProfile?.role === 'admin' || userProfile?.uid === photos[selectedPhotoIndex].authorUid)) && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="mt-8 w-full max-w-3xl bg-zinc-900/80 border border-zinc-800 p-6 md:p-8 rounded-[2rem] backdrop-blur-xl text-zinc-100 shadow-2xl"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      {photos[selectedPhotoIndex].caption ? (
                        <p className="text-xl md:text-2xl font-light italic mb-5 leading-relaxed text-zinc-200">"{photos[selectedPhotoIndex].caption}"</p>
                      ) : (photos[selectedPhotoIndex].categories?.length === 0) && (
                        <p className="text-zinc-500 italic mb-5">Không có mô tả</p>
                      )}

                      <div className="flex flex-wrap items-center gap-3">
                        {photos[selectedPhotoIndex].categories?.map(cat => (
                          <span key={cat} className="px-3.5 py-1.5 bg-amber-500/10 text-amber-500 rounded-xl text-xs font-bold uppercase tracking-wider border border-amber-500/20">
                            {cat}
                          </span>
                        ))}
                        <span className="ml-auto text-zinc-500 text-xs font-bold uppercase tracking-widest">
                          {new Date(photos[selectedPhotoIndex].date_taken || photos[selectedPhotoIndex].createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                    {(userProfile?.role === 'admin' || userProfile?.uid === photos[selectedPhotoIndex].authorUid) && (
                      <div className="relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowPhotoActions(!showPhotoActions); }}
                          className="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-2xl transition-all"
                        >
                          <MoreHorizontal size={24} />
                        </button>

                        <AnimatePresence>
                          {showPhotoActions && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: 10 }}
                              className="absolute bottom-full right-0 mb-3 w-40 bg-zinc-800 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden z-[80]"
                            >
                              <button
                                onClick={(e) => { e.stopPropagation(); setShowPhotoActions(false); setShowDeleteConfirm(photos[selectedPhotoIndex].id); }}
                                className="w-full flex items-center gap-3 px-5 py-4 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-sm font-bold"
                              >
                                <Trash2 size={18} />
                                Xóa ảnh
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
