import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { VaultForm } from './VaultForm';
import { MemoryInteractions } from './MemoryInteractions';
import { MessageSquareHeart, Trash2, Edit2, Globe, Users, Lock, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AnimatePresence, motion } from 'motion/react';

interface Memory {
  id: string;
  type: string;
  title: string;
  content: string;
  authorUid: string;
  authorName: string;
  authorPhoto: string;
  privacy: string;
  branch?: string;
  createdAt: string;
  updatedAt: string;
  likesList?: any[];
  commentsList?: any[];
}

export function FamilyVault({ onNoteCountChange }: { onNoteCountChange?: (count: number) => void }) {
  const { user, userProfile } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showVaultForm, setShowVaultForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchMemories();
  }, [user]);

  const fetchMemories = async () => {
    try {
      const response = await fetch('/api/memories');
      if (!response.ok) throw new Error('Failed to fetch memories');
      const data = await response.json();
      
      // Filter for notes, but be lenient if type is missing
      const filteredData = data.filter((m: Memory) => !m.type || m.type === 'note');

      setMemories(filteredData);
      if (onNoteCountChange) onNoteCountChange(filteredData.length);
    } catch (error) {
      console.error("Error fetching memories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMemory = async (content: string, privacy: string) => {
    if (!userProfile) return;

    try {
      const response = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'note',
          title: 'Ghi chú mới',
          content,
          authorUid: userProfile.uid,
          authorName: userProfile.displayName,
          authorPhoto: userProfile.photoURL || '',
          privacy,
        }),
      });

      if (response.ok) {
        const newMemory = await response.json();
        setMemories(prev => [newMemory, ...prev]);
        if (onNoteCountChange) onNoteCountChange(memories.length + 1);
        // Also fetch to ensure we have the latest from server (including counts)
        fetchMemories();
      }
    } catch (err) {
      console.error('Error adding memory:', err);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      const response = await fetch(`/api/memories/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setMemories(prev => prev.filter(m => m.id !== id));
        if (onNoteCountChange) onNoteCountChange(memories.length - 1);
        setShowDeleteConfirm(null);
      } else {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          alert(errorData.error || 'Không thể xóa ghi chú');
        } else {
          const errorText = await response.text();
          console.error('Server error (non-JSON):', errorText);
          alert('Có lỗi xảy ra từ máy chủ. Vui lòng thử lại sau.');
        }
      }
    } catch (err) {
      console.error('Error deleting memory:', err);
    }
  };

  const startEdit = (memory: Memory) => {
    setEditingId(memory.id);
    setEditContent(memory.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const saveEdit = async (id: string) => {
    if (!editContent.trim()) return;
    
    try {
      const response = await fetch(`/api/memories/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: editContent }),
      });
      
      if (response.ok) {
        setMemories(prev => prev.map(m => m.id === id ? { ...m, content: editContent, updatedAt: new Date().toISOString() } : m));
        setEditingId(null);
      }
    } catch (err) {
      console.error('Error updating memory:', err);
    }
  };

  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case 'public': return <Globe size={12} className="text-stone-400" />;
      case 'branch': return <Users size={12} className="text-stone-400" />;
      case 'private': return <Lock size={12} className="text-stone-400" />;
      default: return null;
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] h-full flex flex-col transition-shadow">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/5 rounded-xl text-primary">
            <MessageSquareHeart size={22} />
          </div>
          <h2 className="text-xl font-bold text-stone-800 font-headline">Góc Nhắn Nhủ</h2>
        </div>
        
        {userProfile && (
          <button 
            onClick={() => setShowVaultForm(true)}
            className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all active:scale-95"
            title="Thêm kỷ niệm"
          >
            <Plus size={20} />
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-4 min-h-[200px] pr-2 custom-scrollbar">
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-stone-50/50 p-4 rounded-2xl">
                <div className="h-4 bg-stone-100 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-stone-100 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : memories.length === 0 ? (
          <div className="text-center py-10 text-stone-400 flex flex-col items-center justify-center h-full">
            <MessageSquareHeart size={32} className="text-stone-200 mb-3" />
            <p className="text-sm">Chưa có lời nhắn nào. Hãy gửi lời yêu thương đầu tiên nhé!</p>
          </div>
        ) : (
          memories.map(memory => (
            <div key={memory.id} className="bg-white p-4 rounded-2xl border border-stone-100 hover:border-stone-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all group relative flex flex-col gap-3">
              <div className="flex items-center gap-2">
                {memory.authorPhoto ? (
                  <div className="relative w-8 h-8">
                    <Image src={memory.authorPhoto} alt="" fill className="rounded-full object-cover" referrerPolicy="no-referrer" unoptimized />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center">
                    <span className="text-stone-500 font-medium text-xs">{memory.authorName?.charAt(0)}</span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-stone-800">{memory.authorName}</p>
                  <div className="flex items-center gap-1">
                    <p className="text-[10px] text-stone-400">
                      {memory.createdAt ? new Date(memory.createdAt).toLocaleString('vi-VN') : 'Vừa xong'}
                    </p>
                    <span className="text-stone-300">•</span>
                    {getPrivacyIcon(memory.privacy)}
                  </div>
                </div>
              </div>

              {editingId === memory.id ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-stone-50 border-none rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
                    rows={3}
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={cancelEdit} className="px-3 py-1.5 text-xs font-medium text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors">
                      Hủy
                    </button>
                    <button onClick={() => saveEdit(memory.id)} className="px-3 py-1.5 text-xs font-medium bg-primary text-white hover:bg-primary/90 rounded-lg transition-colors">
                      Lưu
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {(userProfile?.role === 'admin' || userProfile?.uid === memory.authorUid) && (
                    <div className="absolute top-3 right-3 flex gap-1 bg-white/90 backdrop-blur-sm rounded-lg p-0.5 shadow-sm border border-stone-100 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
                      <button onClick={() => startEdit(memory)} className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors" title="Edit">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => setShowDeleteConfirm(memory.id)} className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                  <p className="text-stone-700 text-[15px] leading-relaxed whitespace-pre-wrap">{memory.content}</p>
                </>
              )}

              {/* Interactions (Likes, Comments) */}
              <MemoryInteractions 
                memoryId={memory.id} 
                authorUid={memory.authorUid} 
                initialLikes={memory.likesList || []}
                initialComments={memory.commentsList || []}
              />
            </div>
          ))
        )}
      </div>
      
      <AnimatePresence>
        {showVaultForm && userProfile && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-8 sm:p-12 bg-black/60 backdrop-blur-md" onClick={() => setShowVaultForm(false)}>
            <VaultForm 
              onAdd={handleAddMemory} 
              onClose={() => setShowVaultForm(false)} 
            />
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/60 backdrop-blur-md" onClick={() => setShowDeleteConfirm(null)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 350 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-[320px] w-full shadow-2xl border border-stone-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-6 mx-auto">
                <Trash2 size={24} />
              </div>
              <h3 className="text-xl font-bold text-stone-800 mb-2 font-headline text-center">Xác nhận xóa</h3>
              <p className="text-stone-500 mb-8 leading-relaxed text-center">Bạn có chắc chắn muốn xóa ghi chú này không? Hành động này không thể hoàn tác.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-3 text-sm font-bold text-stone-500 hover:bg-stone-50 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={() => handleDeleteMemory(showDeleteConfirm)}
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
