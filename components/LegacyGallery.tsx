'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ImagePlus, Camera, Trash2, Loader2, X, Filter, ChevronLeft, ChevronRight, Edit2, Check, Play, Pause, Image as ImageIcon, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/contexts/AuthContext';
import { MemoryInteractions } from './MemoryInteractions';
import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary';
import { EmptyState } from './EmptyState';

interface Photo {
  id: string;
  url: string;
  people?: string[];
  createdAt: string;
  caption?: string;
  date_taken?: string;
  authorUid?: string;
  authorName?: string;
}

const PEOPLE_OPTIONS = ['Mẹ', 'Bố', 'Sam', 'Min'];

export function LegacyGallery() {
  const { userProfile } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadPeople, setUploadPeople] = useState<string[]>([]);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [filterPerson, setFilterPerson] = useState('All');
  const [filterAlbum, setFilterAlbum] = useState('All');
  const [displayLimit, setDisplayLimit] = useState(14);

  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [editPeople, setEditPeople] = useState<string[]>([]);
  const [updatingTags, setUpdatingTags] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const [isStoryMode, setIsStoryMode] = useState(false);
  const [storyIndex, setStoryIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const [isStoryPaused, setIsStoryPaused] = useState(false);
  const [showPhotoActions, setShowPhotoActions] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (filterPerson !== 'All') params.append('person', filterPerson);
        if (filterAlbum !== 'All') params.append('album', filterAlbum);

        const [photosRes, albumsRes] = await Promise.all([
          fetch(`/api/photos?${params.toString()}`),
          fetch('/api/albums')
        ]);
        
        if (photosRes.ok && albumsRes.ok) {
          const photosData = await photosRes.json();
          const albumsData = await albumsRes.json();
          setPhotos(photosData);
          setAlbums(albumsData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filterPerson, filterAlbum]);

  useEffect(() => {
    setIsEditingTags(false);
    if (selectedPhotoIndex !== null && photos[selectedPhotoIndex]) {
      setEditPeople(photos[selectedPhotoIndex].people || []);
    }
    setShowPhotoActions(false);
  }, [selectedPhotoIndex, photos]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPhotoIndex === null) return;
      if (e.key === 'Escape') setSelectedPhotoIndex(null);
      if (e.key === 'ArrowLeft') {
        setSelectedPhotoIndex((prev) => prev !== null ? (prev === 0 ? photos.length - 1 : prev - 1) : null);
      }
      if (e.key === 'ArrowRight') {
        setSelectedPhotoIndex((prev) => prev !== null ? (prev === photos.length - 1 ? 0 : prev + 1) : null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoIndex, photos]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;

    if (isStoryMode && photos.length > 0 && !isStoryPaused) {
      progressInterval = setInterval(() => {
        setStoryProgress(prev => Math.min(prev + (50 / 5000) * 100, 100));
      }, 50);

      interval = setInterval(() => {
        setStoryIndex(prev => {
          if (prev === photos.length - 1) {
            setIsStoryMode(false);
            return prev;
          }
          setStoryProgress(0);
          return prev + 1;
        });
      }, 5000);
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
    setUploadPeople([]);
    setUploadCaption('');
    setUploadDate(new Date().toISOString().split('T')[0]);
  };

  const toggleUploadPerson = (person: string) => {
    setUploadPeople(prev => 
      prev.includes(person) ? prev.filter(p => p !== person) : [...prev, person]
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
      uploadPeople.forEach(person => formData.append('people', person));

      const response = await fetch('/api/photos', {
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
      const response = await fetch(`/api/photos/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setPhotos(prev => prev.filter(p => p.id !== id));
        setSelectedPhotoIndex(null);
        setShowDeleteConfirm(null);
      }
    } catch (err) {
      console.error('Error deleting photo:', err);
    }
  };

  const toggleEditPerson = (person: string) => {
    setEditPeople(prev => 
      prev.includes(person) ? prev.filter(p => p !== person) : [...prev, person]
    );
  };

  const handleUpdateTags = async () => {
    if (selectedPhotoIndex === null) return;
    const photo = photos[selectedPhotoIndex];
    setUpdatingTags(true);
    try {
      const response = await fetch(`/api/photos/${photo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ people: editPeople, caption: photo.caption }),
      });

      if (response.ok) {
        setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, people: editPeople } : p));
        setIsEditingTags(false);
      }
    } finally {
      setUpdatingTags(false);
    }
  };

  const displayedPhotos = photos.slice(0, displayLimit);

  return (
    <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Camera className="text-primary" size={24} />
          <h2 className="text-xl font-bold text-stone-800 font-headline">Thư Viện Ảnh</h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white hover:bg-primary/90 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
            Tải ảnh lên
          </button>
          <button 
            onClick={() => { if (photos.length > 0) { setStoryIndex(0); setStoryProgress(0); setIsStoryPaused(false); setIsStoryMode(true); } }}
            disabled={photos.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-sm font-medium transition-colors"
          >
            <Play size={16} fill="currentColor" />
            Phát Kỷ Niệm
          </button>
          <div className="flex items-center gap-2 border-l border-stone-200 pl-3">
            <Filter size={16} className="text-stone-400" />
            <select 
              value={filterPerson}
              onChange={(e) => setFilterPerson(e.target.value)}
              className="text-sm bg-stone-50 border border-stone-200 text-stone-600 rounded-lg px-2 py-1.5 focus:outline-none"
            >
              <option value="All">Cả nhà</option>
              {PEOPLE_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </div>
      
      <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3 md:gap-6">
        {loading ? (
          <div className="col-span-full py-12 flex justify-center">
            <Loader2 className="animate-spin text-stone-400" size={32} />
          </div>
        ) : (
          <>
            {displayedPhotos.length === 0 && (
              <EmptyState 
                icon={ImageIcon}
                title="Thư viện trống"
                description="Bắt đầu lưu giữ những khoảnh khắc quý giá của gia đình ngay hôm nay."
                actionLabel="Tải ảnh lên"
                onAction={() => fileInputRef.current?.click()}
                className="col-span-full py-16 mb-6"
              />
            )}
            {displayedPhotos.map((photo, idx) => (
              <div 
                key={photo.id} 
                className="break-inside-avoid mb-4 md:mb-6 rounded-2xl overflow-hidden bg-stone-100 relative group cursor-pointer border border-stone-200 shadow-sm transition-all"
                onClick={() => setSelectedPhotoIndex(idx)}
              >
                <Image 
                  src={getOptimizedCloudinaryUrl(photo.url, 500)} 
                  alt={photo.caption || "Family memory"} 
                  width={500} 
                  height={750}
                  className="w-full h-auto block transition-transform duration-700 group-hover:scale-105"
                  unoptimized={!photo.url.includes('res.cloudinary.com')}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity z-0" />
              </div>
            ))}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="break-inside-avoid mb-4 md:mb-6 w-full aspect-[4/5] rounded-2xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center text-stone-400 hover:text-primary transition-all"
            >
              <ImagePlus size={32} className="mb-3" />
              <span className="text-sm font-medium">Thêm ảnh</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
          </>
        )}
      </div>

      <AnimatePresence>
        {showUploadModal && previewUrl && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 sm:p-12 bg-black/60 backdrop-blur-md" onClick={() => setShowUploadModal(false)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 350 }}
              className="bg-white rounded-[2.5rem] max-w-sm sm:max-w-md w-full shadow-2xl max-h-[85vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-6 border-b border-stone-100">
                <h3 className="text-lg font-bold">Gắn thẻ & Tải lên</h3>
                <button onClick={() => setShowUploadModal(false)} className="p-2 text-stone-400 hover:bg-stone-100 rounded-full"><X size={20} /></button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 text-stone-800">
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-stone-100 mb-6 relative">
                  <Image src={previewUrl} alt="Preview" fill sizes="(max-width: 768px) 100vw, 400px" className="object-contain" unoptimized />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Có ai trong ảnh?</label>
                  <div className="flex flex-wrap gap-2">
                    {PEOPLE_OPTIONS.map(p => (
                      <button key={p} onClick={() => toggleUploadPerson(p)} className={`px-3 py-1.5 rounded-full text-sm ${uploadPeople.includes(p) ? 'bg-primary text-white' : 'bg-stone-100 text-stone-600'}`}>{p}</button>
                    ))}
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Chú thích</label>
                  <textarea value={uploadCaption} onChange={e => setUploadCaption(e.target.value)} className="w-full px-3 py-2 border rounded-lg" rows={2} />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t bg-stone-50">
                <button onClick={() => setShowUploadModal(false)} className="px-4 py-2 text-sm">Hủy</button>
                <button onClick={handleUploadSubmit} className="px-4 py-2 text-sm bg-primary text-white rounded-xl">Tải ảnh lên</button>
              </div>
            </motion.div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-8 bg-black/60 backdrop-blur-md" onClick={() => setShowDeleteConfirm(null)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-[320px] w-full shadow-2xl text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4"><Trash2 size={24} /></div>
              <h3 className="text-xl font-bold mb-2">Xác nhận xóa</h3>
              <p className="text-stone-500 mb-6">Bạn chắc chắn muốn xóa ảnh này?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-3 text-stone-500 hover:bg-stone-50 rounded-xl transition-colors">Hủy</button>
                <button onClick={() => handleDelete(showDeleteConfirm)} className="flex-1 py-3 bg-red-500 text-white rounded-xl shadow-lg shadow-red-500/20 active:scale-95 transition-all font-bold">Xóa</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Story Mode */}
      {isStoryMode && photos.length > 0 && (
        <div className="fixed inset-0 z-[120] bg-black flex flex-col">
          <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-4">
            {photos.map((_, idx) => (
              <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-white transition-all" style={{ width: idx < storyIndex ? '100%' : idx === storyIndex ? `${storyProgress}%` : '0%' }} />
              </div>
            ))}
          </div>
          <div className="absolute top-10 left-0 right-0 z-10 flex justify-between items-center px-4">
            <span className="text-white text-sm">{new Date(photos[storyIndex].date_taken || photos[storyIndex].createdAt).toLocaleDateString('vi-VN')}</span>
            <button onClick={() => setIsStoryMode(false)} className="text-white"><X size={28} /></button>
          </div>
          <div className="flex-1 relative bg-black flex items-center justify-center">
            <Image key={photos[storyIndex].id} src={getOptimizedCloudinaryUrl(photos[storyIndex].url, 1200)} alt="Story" fill sizes="(max-width: 768px) 100vw, 1200px" className="object-contain" unoptimized />
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedPhotoIndex !== null && photos[selectedPhotoIndex] && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4" 
            onClick={() => setSelectedPhotoIndex(null)}
          >
            <motion.button 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedPhotoIndex(null)} 
              className="absolute top-4 right-4 md:top-10 md:right-10 text-white p-4 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 transition-all z-[70] flex items-center justify-center shadow-lg border border-white/10"
              title="Close"
            >
              <X size={24} className="md:w-8 md:h-8" />
            </motion.button>
            
            {photos.length > 1 && (
              <>
                <motion.button 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={(e) => { e.stopPropagation(); setSelectedPhotoIndex((prev) => prev !== null ? (prev === 0 ? photos.length - 1 : prev - 1) : null); }} 
                  className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 text-white p-4 rounded-full bg-black/20 backdrop-blur-sm md:bg-transparent hover:bg-white/10 transition-all z-[60]"
                >
                  <ChevronLeft size={32} className="md:w-10 md:h-10" />
                </motion.button>
                <motion.button 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={(e) => { e.stopPropagation(); setSelectedPhotoIndex((prev) => prev !== null ? (prev === photos.length - 1 ? 0 : prev + 1) : null); }} 
                  className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 text-white p-4 rounded-full bg-black/20 backdrop-blur-sm md:bg-transparent hover:bg-white/10 transition-all z-[60]"
                >
                  <ChevronRight size={32} className="md:w-10 md:h-10" />
                </motion.button>
              </>
            )}

            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative w-full h-[65vh] md:h-[75vh] z-[50] flex items-center justify-center touch-none" 
              onClick={e => e.stopPropagation()}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                const swipe = info.offset.x;
                if (swipe < -50) {
                  setSelectedPhotoIndex((prev) => prev !== null ? (prev === photos.length - 1 ? 0 : prev + 1) : null);
                } else if (swipe > 50) {
                  setSelectedPhotoIndex((prev) => prev !== null ? (prev === 0 ? photos.length - 1 : prev - 1) : null);
                }
              }}
            >
              <Image 
                src={getOptimizedCloudinaryUrl(photos[selectedPhotoIndex].url, 1600)} 
                alt="Full view" 
                fill 
                sizes="100vw"
                className="object-contain pointer-events-none" 
                unoptimized={!photos[selectedPhotoIndex].url.includes('res.cloudinary.com')}
                priority
              />
            </motion.div>
            
            {(photos[selectedPhotoIndex].caption || 
              (photos[selectedPhotoIndex].people && photos[selectedPhotoIndex].people.length > 0) ||
              (userProfile?.role === 'admin' || userProfile?.uid === photos[selectedPhotoIndex].authorUid)) && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mt-8 w-full max-w-2xl bg-black/40 border border-white/10 p-6 rounded-3xl backdrop-blur-md text-white" 
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {photos[selectedPhotoIndex].caption ? (
                      <p className="text-xl font-light font-headline italic mb-3">{photos[selectedPhotoIndex].caption}</p>
                    ) : (photos[selectedPhotoIndex].people?.length === 0) && (
                      <p className="text-stone-400 text-sm italic mb-3">Không có mô tả</p>
                    )}
                    
                    <div className="flex flex-wrap gap-2">
                      {photos[selectedPhotoIndex].people?.map(person => (
                        <span key={person} className="px-2.5 py-1 bg-white/10 rounded-lg text-[11px] font-bold uppercase tracking-wider border border-white/5">
                          {person}
                        </span>
                      ))}
                      <span className="ml-auto text-white/40 text-[10px] font-bold uppercase tracking-widest self-center">
                        {new Date(photos[selectedPhotoIndex].date_taken || photos[selectedPhotoIndex].createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                  {(userProfile?.role === 'admin' || userProfile?.uid === photos[selectedPhotoIndex].authorUid) && (
                    <div className="relative">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setShowPhotoActions(!showPhotoActions); }}
                        className="p-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-2xl transition-all active:scale-95"
                        title="Tùy chọn"
                      >
                        <MoreHorizontal size={20} />
                      </button>
                      
                      <AnimatePresence>
                        {showPhotoActions && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className="absolute bottom-full right-0 mb-2 w-32 bg-stone-900 border border-white/10 rounded-2xl shadow-xl overflow-hidden z-[80]"
                          >
                            <button 
                              onClick={(e) => { e.stopPropagation(); setShowPhotoActions(false); setShowDeleteConfirm(photos[selectedPhotoIndex].id); }}
                              className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium"
                            >
                              <Trash2 size={16} />
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
