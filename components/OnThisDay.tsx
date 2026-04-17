import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { CalendarHeart, ChevronLeft, ChevronRight } from 'lucide-react';
import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary';
import { EmptyState } from './EmptyState';

interface Photo {
  id: string;
  url: string;
  createdAt: string;
  people?: string[];
  authorUid?: string;
  authorName?: string;
}

export function OnThisDay() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOnThisDayPhotos();
  }, []);

  const fetchOnThisDayPhotos = async () => {
    try {
      const response = await fetch('/api/photos');
      if (!response.ok) throw new Error('Failed to fetch photos');
      
      const data = await response.json();
      
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentDate = today.getDate();
      const currentYear = today.getFullYear();

      const onThisDayPhotos = data.filter((photo: Photo) => {
        const photoDate = new Date(photo.createdAt);
        return (
          photoDate.getMonth() === currentMonth &&
          photoDate.getDate() === currentDate &&
          photoDate.getFullYear() < currentYear
        );
      });

      setPhotos(onThisDayPhotos);
    } catch (err) {
      console.error('Error fetching On This Day photos:', err);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const prevSlide = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  if (loading) return null;

  if (photos.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <CalendarHeart className="text-rose-500" size={24} />
          <h2 className="text-xl font-headline font-light text-stone-900">Ngày này năm xưa</h2>
        </div>
        <EmptyState 
          icon={CalendarHeart}
          title="Không có kỷ niệm cũ"
          description="Hôm nay chưa có kỷ niệm nào từ những năm trước. Hãy tạo kỷ niệm mới hôm nay nhé!"
          className="flex-1"
        />
      </div>
    );
  }

  const currentPhoto = photos[currentIndex];
  const yearsAgo = new Date().getFullYear() - new Date(currentPhoto.createdAt).getFullYear();

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <CalendarHeart className="text-rose-500" size={24} />
        <h2 className="text-xl font-headline font-light text-stone-900">Ngày này năm xưa</h2>
      </div>
      <div className="relative flex-1 rounded-3xl overflow-hidden group shadow-sm bg-stone-100">
        <Image
          src={getOptimizedCloudinaryUrl(currentPhoto.url, 800)}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 400px"
          className="object-cover"
          referrerPolicy="no-referrer"
          unoptimized={!currentPhoto.url.includes('res.cloudinary.com')}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        <div className="absolute bottom-6 left-6 right-6 text-white">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-3xl font-bold">{yearsAgo}</span>
            <span className="text-sm font-medium uppercase tracking-widest opacity-80">Năm trước</span>
          </div>
          <p className="text-sm opacity-90 line-clamp-2">
            Kỷ niệm ngày {new Date(currentPhoto.createdAt).toLocaleDateString('vi-VN')}
          </p>
        </div>

        {photos.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/20 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/20 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
