import React, { useState, useEffect, useMemo } from 'react';
import { CalendarHeart, Gift, Heart, PartyPopper, Calendar as CalendarIcon, Plus, Trash2, Loader2, X, Flower2, LayoutList, LayoutGrid } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Lunar } from 'lunar-javascript';
import { useAuth } from '@/contexts/AuthContext';
import { EmptyState } from './EmptyState';
import { motion, AnimatePresence } from 'motion/react';

interface FamilyEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: string;
  is_lunar?: boolean;
  createdAt: string;
}

const EVENT_TYPES = ['Birthday', 'Anniversary', 'Holiday', 'Memorial', 'Other'];

const TYPE_ICONS: Record<string, any> = {
  Birthday: Gift,
  Anniversary: Heart,
  Holiday: PartyPopper,
  Memorial: Flower2,
  Other: CalendarIcon
};

const TYPE_COLORS: Record<string, string> = {
  Birthday: 'bg-orange-50 text-orange-700 border-orange-100',
  Anniversary: 'bg-rose-50 text-rose-700 border-rose-100',
  Holiday: 'bg-amber-50 text-amber-700 border-amber-100',
  Memorial: 'bg-stone-100 text-stone-600 border-stone-200',
  Other: 'bg-teal-50 text-teal-700 border-teal-100'
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function ImportantDates() {
  const { userProfile } = useAuth();
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState<'upcoming' | 'monthly'>('upcoming');
  const [newEvent, setNewEvent] = useState<Partial<FamilyEvent>>({
    title: '', date: new Date().toISOString().split('T')[0], type: 'Birthday', is_lunar: false
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setError(null);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('family_events')
        .select('*');
      
      if (error) throw error;
      if (data) setEvents(data.map((e: any) => ({ ...e, createdAt: e.created_at })));
    } catch (err: any) {
      console.error('Error fetching events:', err);
      setError(err.message || 'Failed to connect to Supabase. Please check your credentials and database schema.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) return;

    const eventToInsert = {
      ...newEvent,
      authoruid: userProfile?.uid || 'guest'
    };

    try {
      setError(null);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('family_events')
        .insert([eventToInsert])
        .select();

      if (error) {
        console.error('Supabase error details:', error);
        throw new Error(error.message || 'Unknown Supabase error');
      }
      if (data) {
        setEvents([...events, { ...data[0], createdAt: data[0].created_at }]);
        setShowAddForm(false);
        setNewEvent({ title: '', date: new Date().toISOString().split('T')[0], type: 'Birthday', is_lunar: false });
      }
    } catch (err: any) {
      console.error('Error adding event:', err);
      setError(err.message || 'Failed to add event to Supabase.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setError(null);
      const supabase = createClient();
      const { error } = await supabase
        .from('family_events')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setEvents(events.filter(e => e.id !== id));
    } catch (err: any) {
      console.error('Error deleting event:', err);
      setError(err.message || 'Failed to delete event from Supabase.');
    }
  };

  // Calculate upcoming events and next occurrences
  const processedEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentYear = today.getFullYear();

    return events.map(event => {
      const [_, monthStr, dayStr] = event.date.split('-');
      const month = parseInt(monthStr, 10);
      const day = parseInt(dayStr, 10);
      
      let nextOccurrence: Date;

      if (event.is_lunar) {
        // Calculate next solar date for this lunar event
        let lunar = Lunar.fromYmd(currentYear, month, day);
        let solar = lunar.getSolar();
        nextOccurrence = new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay());
        
        if (nextOccurrence < today) {
          lunar = Lunar.fromYmd(currentYear + 1, month, day);
          solar = lunar.getSolar();
          nextOccurrence = new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay());
        }
      } else {
        nextOccurrence = new Date(currentYear, month - 1, day);
        if (nextOccurrence < today) {
          nextOccurrence.setFullYear(currentYear + 1);
        }
      }

      const diffTime = nextOccurrence.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return { ...event, nextOccurrence, diffDays };
    }).sort((a, b) => a.diffDays - b.diffDays);
  }, [events]);

  // Group events by month for Monthly View
  const monthlyEvents = useMemo(() => {
    const grouped: Record<number, typeof processedEvents> = {};
    for (let i = 0; i < 12; i++) grouped[i] = [];
    
    processedEvents.forEach(event => {
      const month = event.nextOccurrence.getMonth();
      grouped[month].push(event);
    });
    
    // Sort events within each month by date
    for (let i = 0; i < 12; i++) {
      grouped[i].sort((a, b) => a.nextOccurrence.getDate() - b.nextOccurrence.getDate());
    }
    
    return grouped;
  }, [processedEvents]);

  return (
    <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <CalendarHeart className="text-primary" size={24} />
          <h2 className="text-xl font-bold text-stone-800 font-headline">Ngày Kỷ Niệm</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex bg-stone-100 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode('upcoming')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'upcoming' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-400 hover:text-stone-600'}`}
              title="Sắp tới"
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('monthly')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'monthly' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-400 hover:text-stone-600'}`}
              title="Hàng tháng"
            >
              <LayoutList size={18} />
            </button>
          </div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors ml-2"
            title="Thêm ngày"
          >
            {showAddForm ? <X size={20} /> : <Plus size={20} />}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          <p className="font-bold mb-1">Lỗi cơ sở dữ liệu:</p>
          <p>{error}</p>
          <p className="mt-2 text-xs text-red-500">
            Vui lòng kiểm tra lại cấu hình Supabase.
          </p>
        </div>
      )}

      <AnimatePresence>
        {showAddForm && (
          <motion.form 
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleAddSubmit} 
            className="bg-stone-50 p-4 rounded-2xl border border-stone-200 overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Tên ngày kỷ niệm</label>
                <input required type="text" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="w-full bg-white border border-stone-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="VD: Sinh nhật ông nội" />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Ngày</label>
                <input required type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="w-full bg-white border border-stone-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Loại</label>
                <select value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value})} className="w-full bg-white border border-stone-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={newEvent.is_lunar} 
                    onChange={e => setNewEvent({...newEvent, is_lunar: e.target.checked})}
                    className="w-4 h-4 text-primary border-stone-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-stone-700">Ngày Âm lịch</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" className="px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90 rounded-lg transition-colors">Lưu ngày</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center py-8">
            <Loader2 className="animate-spin text-stone-400" size={24} />
          </motion.div>
        ) : processedEvents.length === 0 ? (
          <EmptyState 
            icon={CalendarHeart}
            title="Chưa có ngày kỷ niệm"
            description="Hãy thêm những ngày sinh nhật, ngày lễ hoặc các dịp đặc biệt của gia đình."
            actionLabel="Thêm ngày đầu tiên"
            onAction={() => setShowAddForm(true)}
            className="py-12"
          />
        ) : viewMode === 'upcoming' ? (
          <motion.div 
            key="upcoming"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex overflow-x-auto gap-4 pb-4 custom-scrollbar snap-x"
          >
            <AnimatePresence>
              {processedEvents.map((event) => {
                const Icon = TYPE_ICONS[event.type] || CalendarIcon;
                const colorClass = TYPE_COLORS[event.type] || TYPE_COLORS.Other;
                const isToday = event.diffDays === 0;

                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    key={event.id} 
                    className={`min-w-[200px] md:min-w-[240px] p-5 rounded-2xl border snap-start relative group transition-all hover:shadow-md ${isToday ? 'bg-primary border-primary/20 text-white shadow-primary/20 shadow-lg scale-105' : 'bg-white border-stone-100'}`}
                  >
                    <button 
                      onClick={() => handleDelete(event.id)}
                      className={`absolute top-3 right-3 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${isToday ? 'bg-white/20 hover:bg-white/40 text-white' : 'bg-stone-100 hover:bg-primary/10 text-stone-400 hover:text-primary'}`}
                    >
                      <Trash2 size={14} />
                    </button>

                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${isToday ? 'bg-white/20 text-white' : colorClass}`}>
                      <Icon size={20} />
                    </div>
                    
                    <h3 className={`font-bold text-lg mb-1 truncate pr-6 ${isToday ? 'text-white' : 'text-stone-800'}`}>
                      {event.title}
                    </h3>
                    
                    <p className={`text-sm mb-3 flex flex-col gap-0.5 ${isToday ? 'text-white/80' : 'text-stone-500'}`}>
                      <span>{event.nextOccurrence.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                      {event.is_lunar && (
                        <span className={`text-xs ${isToday ? 'text-white/60' : 'text-stone-400'}`}>
                          (Âm lịch: {event.date.substring(5).replace('-', '/')})
                        </span>
                      )}
                    </p>
                    
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${isToday ? 'bg-white text-primary' : 'bg-stone-100 text-stone-600'}`}>
                      {isToday ? 'Hôm nay!' : `Còn ${event.diffDays} ngày`}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div 
            key="monthly"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="max-h-[360px] overflow-y-auto custom-scrollbar pr-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {MONTH_NAMES.map((monthName, index) => {
                const monthEvents = monthlyEvents[index];
                if (monthEvents.length === 0) return null;
                
                const isCurrentMonth = new Date().getMonth() === index;

                return (
                  <div key={monthName} className="relative">
                    {/* Minimalist Month Header */}
                    <div className="flex items-center gap-3 mb-3 sticky top-0 bg-white/90 backdrop-blur-sm py-1 z-10">
                      <h3 className={`text-xs font-bold uppercase tracking-widest ${isCurrentMonth ? 'text-primary' : 'text-stone-400'}`}>
                        {monthName}
                      </h3>
                      <div className="h-px flex-1 bg-stone-100"></div>
                    </div>
                    
                    {/* Compact Event List */}
                    <div className="flex flex-col">
                      <AnimatePresence>
                        {monthEvents.map(event => {
                          const isToday = event.diffDays === 0;
                          
                          return (
                            <motion.div 
                              layout
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              key={event.id} 
                              className="flex items-center justify-between group py-2 border-b border-stone-50 last:border-0 hover:bg-stone-50/50 rounded-lg -mx-2 px-2 transition-colors overflow-hidden"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-6 text-center ${isToday ? 'text-primary font-bold' : 'text-stone-400 font-medium'}`}>
                                  <span className="text-sm">{event.nextOccurrence.getDate()}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className={`text-sm ${isToday ? 'text-primary font-semibold' : 'text-stone-700'}`}>
                                    {event.title}
                                  </span>
                                  {event.is_lunar && (
                                    <span className="text-[10px] text-stone-400">Âm lịch: {event.date.substring(5).replace('-', '/')}</span>
                                  )}
                                </div>
                              </div>
                              <button 
                                onClick={() => handleDelete(event.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-primary transition-opacity"
                                title="Xóa"
                              >
                                <Trash2 size={14} />
                              </button>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
