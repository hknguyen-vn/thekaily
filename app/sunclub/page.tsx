import { SunclubGallery } from '@/components/SunclubGallery';

export const metadata = {
  title: 'Sunclub Gallery - Kaily',
  description: 'Thư viện ảnh sự kiện câu lạc bộ cầu lông Sunclub',
};

export default function SunclubPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 selection:bg-amber-500/30 selection:text-amber-200">
      <div className="max-w-[1920px] mx-auto p-4 md:p-8 lg:p-12">
        <SunclubGallery />
      </div>
    </div>
  );
}
