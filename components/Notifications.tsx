import React, { useState } from 'react';
import { Bell, BellDot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function Notifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  const notifications = [
    { id: 1, title: 'Kỷ niệm mới', message: 'Mẹ vừa thêm một ảnh mới vào thư viện.', time: '2 giờ trước' },
    { id: 2, title: 'Sắp đến sinh nhật', message: 'Sinh nhật của Bố sẽ diễn ra vào tuần tới.', time: '1 ngày trước' },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setHasUnread(false);
        }}
        className="p-3 rounded-full bg-stone-100 hover:bg-stone-200 transition-all relative group"
      >
        {hasUnread ? (
          <BellDot className="text-primary group-hover:scale-110 transition-transform" size={20} />
        ) : (
          <Bell className="text-stone-500 group-hover:scale-110 transition-transform" size={20} />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 bg-white rounded-3xl shadow-xl border border-stone-100 py-4 z-20 overflow-hidden"
            >
              <div className="px-6 pb-3 border-b border-stone-50">
                <h3 className="text-sm font-bold text-stone-900">Thông báo</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((notif) => (
                  <div key={notif.id} className="px-6 py-4 hover:bg-stone-50 transition-colors cursor-pointer border-b border-stone-50 last:border-0">
                    <p className="text-sm font-bold text-stone-800">{notif.title}</p>
                    <p className="text-xs text-stone-500 mt-1">{notif.message}</p>
                    <p className="text-[10px] text-stone-400 mt-2 font-medium uppercase tracking-widest">{notif.time}</p>
                  </div>
                ))}
              </div>
              <div className="px-6 pt-3 text-center">
                <button className="text-xs font-bold text-primary hover:underline">Xem tất cả</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
