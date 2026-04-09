import React, { useState, useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Milestone as MilestoneIcon, GraduationCap, Plane, Home, Baby, Briefcase, ArrowDownUp, ChevronDown, ChevronUp, Plus, Trash2, Edit2, Check, X, Loader2, ImagePlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

interface Milestone {
  id: string;
  title: string;
  date: string;
  display_date: string;
  icon_name: string;
  color: string;
  bg: string;
  category: string;
  people: string[];
  description: string;
  photos: string[];
  createdAt: string;
}

const ICONS: Record<string, any> = {
  Home, Plane, Briefcase, GraduationCap, Baby, MilestoneIcon
};

const CATEGORIES = ['Life Event', 'Travel', 'Career', 'Education', 'Family', 'Other'];
const PEOPLE_OPTIONS = ['Everyone', 'Mom', 'Dad', 'Sam', 'Min'];

export function GrowthPath({ onMilestoneCountChange }: { onMilestoneCountChange?: (count: number) => void }) {
  const { userProfile } = useAuth();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterPerson, setFilterPerson] = useState('All');
  const [sortDesc, setSortDesc] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMilestone, setNewMilestone] = useState<Partial<Milestone>>({
    title: '', date: new Date().toISOString().split('T')[0], category: 'Life Event', people: [], description: '', icon_name: 'MilestoneIcon', color: 'text-blue-500', bg: 'bg-blue-100', photos: []
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMilestone, setEditMilestone] = useState<Partial<Milestone>>({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  const addFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMilestones();
  }, []);

  const fetchMilestones = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('family_milestones')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) {
        console.error('Error fetching milestones:', error);
        // Fallback mock data
        const mockData: Milestone[] = [
          { id: '1', title: 'Moved to new house', date: '2025-10-15', display_date: 'Oct 2025', icon_name: 'Home', color: 'text-blue-500', bg: 'bg-blue-100', category: 'Life Event', people: ['Everyone'], description: 'After months of searching, we finally moved into our dream home.', photos: [], createdAt: new Date().toISOString() },
          { id: '2', title: 'Family trip to Japan', date: '2025-12-05', display_date: 'Dec 2025', icon_name: 'Plane', color: 'text-emerald-500', bg: 'bg-emerald-100', category: 'Travel', people: ['Everyone'], description: 'An unforgettable two-week journey.', photos: [], createdAt: new Date().toISOString() }
        ];
        setMilestones(mockData);
      } else if (data) {
        setMilestones(data.map((m: any) => ({ 
          ...m, 
          createdAt: m.created_at,
          display_date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMilestones = useMemo(() => {
    let result = milestones;
    if (filterCategory !== 'All') {
      result = result.filter(m => m.category === filterCategory);
    }
    if (filterPerson !== 'All') {
      result = result.filter(m => m.people.includes(filterPerson));
    }
    return result.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortDesc ? dateB - dateA : dateA - dateB;
    });
  }, [milestones, filterCategory, filterPerson, sortDesc]);

  useEffect(() => {
    if (onMilestoneCountChange) {
      onMilestoneCountChange(filteredMilestones.length);
    }
  }, [filteredMilestones.length, onMilestoneCountChange]);

  const toggleExpand = (id: string) => {
    if (editingId === id) return;
    setExpandedId(expandedId === id ? null : id);
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>, isEditing: boolean) => {
    const file = event.target.files?.[0];
    if (!file || !userProfile) return;

    setUploadingPhoto(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('caption', isEditing ? editMilestone.title || '' : newMilestone.title || '');
      formData.append('date_taken', isEditing ? editMilestone.date || '' : newMilestone.date || '');
      formData.append('authorUid', userProfile.uid);
      formData.append('authorName', userProfile.displayName);

      const response = await fetch('/api/photos', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload image via API');

      const data = await response.json();
      const imageUrl = data.url;

      if (isEditing) {
        setEditMilestone(prev => ({ ...prev, photos: [...(prev.photos || []), imageUrl] }));
      } else {
        setNewMilestone(prev => ({ ...prev, photos: [...(prev.photos || []), imageUrl] }));
      }
    } catch (err) {
      console.error('Error uploading photo:', err);
      alert('Failed to upload photo.');
    } finally {
      setUploadingPhoto(false);
      if (isEditing && editFileInputRef.current) editFileInputRef.current.value = '';
      if (!isEditing && addFileInputRef.current) addFileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number, isEditing: boolean) => {
    if (isEditing) {
      setEditMilestone(prev => ({ ...prev, photos: prev.photos?.filter((_, i) => i !== index) }));
    } else {
      setNewMilestone(prev => ({ ...prev, photos: prev.photos?.filter((_, i) => i !== index) }));
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestone.title || !newMilestone.date) return;

    const dateObj = new Date(newMilestone.date);
    const display_date = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    const milestoneToInsert = {
      title: newMilestone.title,
      date: newMilestone.date,
      category: newMilestone.category,
      people: newMilestone.people,
      description: newMilestone.description,
      icon_name: newMilestone.icon_name,
      color: newMilestone.color,
      bg: newMilestone.bg,
      photos: newMilestone.photos || []
    };

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('family_milestones')
        .insert([milestoneToInsert])
        .select();

      if (error) {
        console.error('Supabase error details:', error);
        throw new Error(error.message || 'Unknown Supabase error');
      }
      if (data) {
        setMilestones([{ 
          ...data[0], 
          createdAt: data[0].created_at,
          display_date: new Date(data[0].date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        }, ...milestones]);
        setShowAddForm(false);
        setNewMilestone({ title: '', date: new Date().toISOString().split('T')[0], category: 'Life Event', people: [], description: '', icon_name: 'MilestoneIcon', color: 'text-blue-500', bg: 'bg-blue-100', photos: [] });
      }
    } catch (err: any) {
      console.error('Error adding milestone:', err);
      alert(`Lỗi khi thêm cột mốc: ${err.message || 'Không xác định'}`);
      // Optimistic update fallback if needed, but better to show error
      // const mock = { ...milestoneToInsert, id: Math.random().toString(), createdAt: new Date().toISOString() } as Milestone;
      // setMilestones([mock, ...milestones]);
      // setShowAddForm(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/milestones/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete milestone');
      
      setMilestones(milestones.filter(m => m.id !== id));
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting milestone:', err);
      alert('Không thể xóa cột mốc. Vui lòng thử lại sau.');
      setShowDeleteConfirm(null);
    }
  };

  const startEdit = (milestone: Milestone) => {
    setEditingId(milestone.id);
    setEditMilestone(milestone);
    setExpandedId(milestone.id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditMilestone({});
  };

  const saveEdit = async () => {
    if (!editingId || !editMilestone.title || !editMilestone.date) return;

    const dateObj = new Date(editMilestone.date);
    const { display_date: _, createdAt: __, author_uid: ___, ...updatableFields } = editMilestone as any;
    const updatedData = { ...updatableFields, date: editMilestone.date };

    try {
      const response = await fetch(`/api/milestones/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) throw new Error('Failed to update milestone');
      
      const data = await response.json();
      setMilestones(milestones.map(m => m.id === editingId ? { 
        ...m, 
        ...data,
        display_date: new Date(data.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      } : m));
      setEditingId(null);
    } catch (err) {
      console.error('Error updating milestone:', err);
      alert('Không thể cập nhật cột mốc.');
      setEditingId(null);
    }
  };

  const togglePerson = (person: string, isEditing: boolean) => {
    if (isEditing) {
      const current = editMilestone.people || [];
      setEditMilestone({
        ...editMilestone,
        people: current.includes(person) ? current.filter(p => p !== person) : [...current, person]
      });
    } else {
      const current = newMilestone.people || [];
      setNewMilestone({
        ...newMilestone,
        people: current.includes(person) ? current.filter(p => p !== person) : [...current, person]
      });
    }
  };

  const categoriesFilter = ['All', ...Array.from(new Set(milestones.map(m => m.category)))];
  const peopleFilter = ['All', ...Array.from(new Set(milestones.flatMap(m => m.people)))];

  return (
    <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm h-full flex flex-col hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <MilestoneIcon className="text-primary" size={24} />
          <h2 className="text-xl font-bold text-stone-800">Hành Trình Khôn Lớn</h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-sm bg-stone-50 border border-stone-200 text-stone-600 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
          >
            {categoriesFilter.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          
          <select 
            value={filterPerson}
            onChange={(e) => setFilterPerson(e.target.value)}
            className="text-sm bg-stone-50 border border-stone-200 text-stone-600 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
          >
            {peopleFilter.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <button 
            onClick={() => setSortDesc(!sortDesc)}
            className="p-1.5 bg-stone-50 border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-100 transition-colors"
            title={sortDesc ? "Sort Oldest First" : "Sort Newest First"}
          >
            <ArrowDownUp size={16} />
          </button>
          
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors ml-2"
            title="Add Milestone"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[200px]">
        {showAddForm && (
          <form onSubmit={handleAddSubmit} className="bg-stone-50 p-4 rounded-2xl border border-primary/20 mb-6 animate-in fade-in slide-in-from-top-2">
            <h3 className="font-bold text-stone-800 mb-4">Thêm Cột Mốc Mới</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Tiêu đề</label>
                <input required type="text" value={newMilestone.title} onChange={e => setNewMilestone({...newMilestone, title: e.target.value})} className="w-full bg-white border border-stone-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Ngày</label>
                <input required type="date" value={newMilestone.date} onChange={e => setNewMilestone({...newMilestone, date: e.target.value})} className="w-full bg-white border border-stone-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Danh mục</label>
                <select value={newMilestone.category} onChange={e => setNewMilestone({...newMilestone, category: e.target.value})} className="w-full bg-white border border-stone-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Biểu tượng</label>
                <div className="flex gap-2">
                  {Object.keys(ICONS).map(iconName => {
                    const IconComp = ICONS[iconName];
                    return (
                      <button 
                        type="button" 
                        key={iconName} 
                        onClick={() => setNewMilestone({...newMilestone, icon_name: iconName})}
                        className={`p-1.5 rounded-lg border ${newMilestone.icon_name === iconName ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-white border-stone-200 text-stone-500'}`}
                      >
                        <IconComp size={16} />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-stone-500 mb-1">Người tham gia</label>
                <div className="flex flex-wrap gap-1">
                  {PEOPLE_OPTIONS.map(p => (
                    <button type="button" key={p} onClick={() => togglePerson(p, false)} className={`text-xs px-2 py-1 rounded-full border ${newMilestone.people?.includes(p) ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-white border-stone-200 text-stone-500'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium text-stone-500 mb-1">Mô tả</label>
              <textarea value={newMilestone.description} onChange={e => setNewMilestone({...newMilestone, description: e.target.value})} className="w-full bg-white border border-stone-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" rows={3} />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium text-stone-500 mb-2">Hình ảnh</label>
              <div className="flex flex-wrap gap-2">
                {newMilestone.photos?.map((photo, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-stone-200 group">
                    <Image src={photo} alt="Upload preview" fill className="object-cover" unoptimized />
                    <button type="button" onClick={() => removePhoto(idx, false)} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={14} className="text-white" />
                    </button>
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={() => addFileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="w-16 h-16 rounded-lg border-2 border-dashed border-stone-300 flex items-center justify-center text-stone-400 hover:text-orange-500 hover:border-orange-300 hover:bg-orange-50 transition-colors disabled:opacity-50"
                >
                  {uploadingPhoto ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />}
                </button>
                <input type="file" ref={addFileInputRef} onChange={(e) => handlePhotoUpload(e, false)} accept="image/*" className="hidden" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm font-medium text-stone-500 hover:bg-stone-200 rounded-lg transition-colors">Hủy</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90 rounded-lg transition-colors">Lưu Cột Mốc</button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-stone-400" size={24} />
          </div>
        ) : filteredMilestones.length === 0 ? (
          <div className="text-center py-8 text-stone-400">
            <p>No milestones found for these filters.</p>
          </div>
        ) : (
          <div className="relative space-y-12 mt-8 mb-4">
            {/* Vertical line for desktop */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-stone-200 -translate-x-1/2"></div>
            
            {filteredMilestones.map((milestone, idx) => {
              const Icon = ICONS[milestone.icon_name] || MilestoneIcon;
              const isEditing = editingId === milestone.id;
              const isEven = idx % 2 === 0;
              
              if (isEditing) {
                return (
                  <div key={milestone.id} className="relative z-20 bg-white p-6 rounded-3xl border border-primary/30 shadow-md">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-stone-500 mb-1">Tiêu đề</label>
                          <input type="text" value={editMilestone.title} onChange={e => setEditMilestone({...editMilestone, title: e.target.value})} className="w-full bg-white border border-stone-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-stone-500 mb-1">Ngày</label>
                          <input type="date" value={editMilestone.date} onChange={e => setEditMilestone({...editMilestone, date: e.target.value})} className="w-full bg-white border border-stone-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-stone-500 mb-1">Danh mục</label>
                          <select value={editMilestone.category} onChange={e => setEditMilestone({...editMilestone, category: e.target.value})} className="w-full bg-white border border-stone-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-stone-500 mb-1">Biểu tượng</label>
                          <div className="flex gap-2">
                            {Object.keys(ICONS).map(iconName => {
                              const IconComp = ICONS[iconName];
                              return (
                                <button 
                                  type="button" 
                                  key={iconName} 
                                  onClick={() => setEditMilestone({...editMilestone, icon_name: iconName})}
                                  className={`p-1.5 rounded-lg border ${editMilestone.icon_name === iconName ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-white border-stone-200 text-stone-500'}`}
                                >
                                  <IconComp size={16} />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-stone-500 mb-1">Người tham gia</label>
                          <div className="flex flex-wrap gap-1">
                            {PEOPLE_OPTIONS.map(p => (
                              <button type="button" key={p} onClick={() => togglePerson(p, true)} className={`text-[10px] px-2 py-1 rounded-full border ${editMilestone.people?.includes(p) ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-white border-stone-200 text-stone-500'}`}>
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-stone-500 mb-1">Mô tả</label>
                        <textarea value={editMilestone.description} onChange={e => setEditMilestone({...editMilestone, description: e.target.value})} className="w-full bg-white border border-stone-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" rows={3} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-stone-500 mb-2">Hình ảnh</label>
                        <div className="flex flex-wrap gap-2">
                          {editMilestone.photos?.map((photo, idx) => (
                            <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-stone-200 group">
                              <Image src={photo} alt="Upload preview" fill className="object-cover" unoptimized />
                              <button type="button" onClick={() => removePhoto(idx, true)} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={14} className="text-white" />
                              </button>
                            </div>
                          ))}
                          <button 
                            type="button" 
                            onClick={() => editFileInputRef.current?.click()}
                            disabled={uploadingPhoto}
                            className="w-16 h-16 rounded-lg border-2 border-dashed border-stone-300 flex items-center justify-center text-stone-400 hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-colors disabled:opacity-50"
                          >
                            {uploadingPhoto ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />}
                          </button>
                          <input type="file" ref={editFileInputRef} onChange={(e) => handlePhotoUpload(e, true)} accept="image/*" className="hidden" />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={(e) => { e.stopPropagation(); cancelEdit(); }} className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-200 rounded-lg transition-colors">
                          <X size={16} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); saveEdit(); }} className="p-1.5 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                          <Check size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={milestone.id} className={`relative flex flex-col md:flex-row gap-6 md:gap-0 group ${!isEven ? 'md:flex-row-reverse' : ''}`}>
                  
                  {/* Left Side (Title & Date) */}
                  <div className={`md:w-1/2 flex flex-col pt-4 ${isEven ? 'md:pr-12 md:items-end text-left md:text-right' : 'md:pl-12 md:items-start text-left'}`}>
                    <p className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-2">{milestone.display_date}</p>
                    <h3 className="text-2xl md:text-3xl font-bold text-stone-800 mb-3">{milestone.title}</h3>
                    
                    <div className={`flex flex-wrap gap-1.5 mb-4 ${isEven ? 'md:justify-end' : 'md:justify-start'}`}>
                      <span className="text-[10px] font-medium px-2 py-1 bg-stone-100 rounded-md text-stone-500 border border-stone-200">
                        {milestone.category}
                      </span>
                      {milestone.people?.map(person => (
                        <span key={person} className="text-[10px] font-medium px-2 py-1 bg-primary/5 text-primary rounded-md border border-primary/10">
                          {person}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      {userProfile?.role === 'admin' && (
                        <>
                          <button onClick={() => startEdit(milestone)} className="p-1.5 text-stone-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => setShowDeleteConfirm(milestone.id)} className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Center Icon */}
                  <div className="hidden md:flex absolute left-1/2 top-8 -translate-x-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-white border-2 border-white shadow-sm text-stone-400 group-hover:scale-110 transition-transform">
                    <div className={`p-2 rounded-full ${milestone.bg} ${milestone.color}`}>
                      <Icon size={18} />
                    </div>
                  </div>

                  {/* Right Side (Card with Description & Image) */}
                  <div className={`md:w-1/2 ${isEven ? 'md:pl-12' : 'md:pr-12'}`}>
                    <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all">
                      {milestone.description && (
                        <p className="text-stone-600 leading-relaxed mb-4">{milestone.description}</p>
                      )}
                      {milestone.photos && milestone.photos.length > 0 && (
                        <div className="relative rounded-2xl overflow-hidden mb-2 bg-stone-900 h-64 md:h-80">
                          {/* Ambient Blur Background */}
                          <Image 
                            src={getOptimizedCloudinaryUrl(milestone.photos[0], 400)} 
                            alt="" 
                            fill
                            className="object-cover blur-xl opacity-40 scale-110" 
                            referrerPolicy="no-referrer" 
                            unoptimized={!milestone.photos[0].includes('res.cloudinary.com')}
                          />
                          {/* Main Image */}
                          <div className="relative w-full h-full p-2">
                             <Image 
                                src={getOptimizedCloudinaryUrl(milestone.photos[0], 800)} 
                                alt={milestone.title} 
                                fill
                                className="object-contain hover:scale-105 transition-transform duration-700" 
                                referrerPolicy="no-referrer" 
                                unoptimized={!milestone.photos[0].includes('res.cloudinary.com')}
                              />
                          </div>
                        </div>
                      )}
                      
                      {milestone.photos && milestone.photos.length > 1 && (
                         <div className="flex gap-2 mt-3 overflow-x-auto custom-scrollbar pb-1">
                           {milestone.photos.slice(1).map((photo, idx) => (
                             <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-stone-200 shrink-0">
                               <Image 
                                 src={getOptimizedCloudinaryUrl(photo, 150)} 
                                 alt="Thumbnail" 
                                 fill
                                 className="object-cover" 
                                 referrerPolicy="no-referrer" 
                                 unoptimized={!photo.includes('res.cloudinary.com')}
                               />
                             </div>
                           ))}
                         </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => setShowDeleteConfirm(null)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-stone-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-6 mx-auto">
                <Trash2 size={24} />
              </div>
              <h3 className="text-xl font-bold text-stone-800 mb-2 font-headline text-center">Xác nhận xóa</h3>
              <p className="text-stone-500 mb-8 leading-relaxed text-center">Bạn có chắc chắn muốn xóa cột mốc này không? Hành động này không thể hoàn tác.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-3 text-sm font-bold text-stone-500 hover:bg-stone-50 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="flex-1 py-3 text-sm font-bold bg-red-500 text-white hover:bg-red-600 rounded-xl transition-colors shadow-lg shadow-red-500/20 active:scale-95"
                >
                  Xóa
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
