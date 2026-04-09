import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Connection,
  Edge,
  Node,
  Panel,
  ReactFlowProvider,
  useReactFlow,
  OnConnect,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus, Download, Upload, Trash2, Edit2, Network, UserPlus, Heart, Baby, User, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { FamilyMemberNode } from './FamilyMemberNode';
import { FamilyMember, Gender } from '@/types';
import { mockFamilyData } from '@/mockData';
import { getLayoutedElements } from '@/utils/layout';

import { createClient } from '@/lib/supabase/client';

const nodeTypes = {
  familyMember: FamilyMemberNode,
};

const defaultEdgeOptions = {
  type: 'smoothstep',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#a8a29e',
  },
  style: { strokeWidth: 2, stroke: '#a8a29e' },
};

function FamilyTreeContent({ isPage = false }: { isPage?: boolean }) {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const { fitView } = useReactFlow();

  // Load from Supabase on mount
  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        // Map snake_case to camelCase
        const mappedMembers: FamilyMember[] = data.map(m => ({
          id: m.id,
          name: m.name,
          gender: m.gender as Gender,
          dateOfBirth: m.date_of_birth,
          avatar: m.avatar,
          bio: m.bio,
          parentIds: m.parent_ids || [],
          spouseIds: m.spouse_ids || [],
          childrenIds: m.children_ids || []
        }));
        setMembers(mappedMembers);
      } else {
        // If no data, use mock data as initial state
        setMembers(mockFamilyData);
      }
    } catch (err) {
      console.error('Error fetching family members:', err);
      setMembers(mockFamilyData);
    } finally {
      setLoading(false);
    }
  };

  const saveMembers = async (updatedMembers: FamilyMember[]) => {
    try {
      // Upsert all members
      const upsertData = updatedMembers.map(m => ({
        id: m.id,
        name: m.name,
        gender: m.gender,
        date_of_birth: m.dateOfBirth,
        avatar: m.avatar,
        bio: m.bio,
        parent_ids: m.parentIds,
        spouse_ids: m.spouseIds,
        children_ids: m.childrenIds
      }));

      const { error } = await supabase
        .from('family_members')
        .upsert(upsertData);

      if (error) {
        console.error('Supabase error saving family members:', JSON.stringify(error, null, 2));
        throw error;
      }
    } catch (err) {
      console.error('Caught error saving family members:', err);
    }
  };

  // Convert members to nodes and edges
  const updateGraph = useCallback((currentMembers: FamilyMember[], shouldFitView = false) => {
    const newNodes: Node[] = currentMembers.map((member) => ({
      id: member.id,
      type: 'familyMember',
      data: { ...member },
      position: { x: 0, y: 0 }, // Position will be calculated by dagre
    }));

    const newEdges: Edge[] = [];

    currentMembers.forEach((member) => {
      // Parent-child edges
      member.childrenIds.forEach((childId) => {
        newEdges.push({
          id: `e-${member.id}-${childId}`,
          source: member.id,
          target: childId,
          label: 'Con',
          labelStyle: { fontSize: 10, fill: '#78716c' },
        });
      });
    });

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, newEdges);

    // Add spouse edges after layout to ensure they connect correctly horizontally
    currentMembers.forEach((member) => {
      member.spouseIds.forEach((spouseId) => {
        if (member.id < spouseId) {
          const sourceNode = layoutedNodes.find(n => n.id === member.id);
          const targetNode = layoutedNodes.find(n => n.id === spouseId);
          
          if (sourceNode && targetNode) {
            // Determine which node is on the left
            const isSourceLeft = sourceNode.position.x < targetNode.position.x;
            
            layoutedEdges.push({
              id: `s-${member.id}-${spouseId}`,
              source: isSourceLeft ? member.id : spouseId,
              target: isSourceLeft ? spouseId : member.id,
              sourceHandle: 'spouse-right',
              targetHandle: 'spouse-left',
              type: 'straight',
              label: 'Vợ/Chồng',
              labelStyle: { fontSize: 10, fill: '#e11d48', fontWeight: 'bold' },
              style: { stroke: '#fb7185', strokeWidth: 3, strokeDasharray: '5 5' },
              markerEnd: undefined,
            });
          }
        }
      });
    });

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);

    if (shouldFitView) {
      window.requestAnimationFrame(() => {
        fitView({ duration: 800, padding: 0.2 });
      });
    }
  }, [setNodes, setEdges, fitView]);

  useEffect(() => {
    updateGraph(members);
    if (members.length > 0) {
      saveMembers(members);
    }
  }, [members, updateGraph]);

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const member = members.find((m) => m.id === node.id);
    if (member) {
      setSelectedMember(member);
      setIsPanelOpen(true);
      setIsEditMode(false);
    }
  }, [members]);

  const onPaneClick = useCallback(() => {
    setIsPanelOpen(false);
    setSelectedMember(null);
  }, []);

  const handleAddMember = () => {
    const newId = uuidv4();
    const newMember: FamilyMember = {
      id: newId,
      name: 'Thành viên mới',
      gender: 'male',
      parentIds: [],
      spouseIds: [],
      childrenIds: [],
    };
    setMembers([...members, newMember]);
    setSelectedMember(newMember);
    setIsPanelOpen(true);
    setIsEditMode(true);
  };

  const handleUpdateMember = (updatedMember: FamilyMember) => {
    setMembers((prevMembers) => {
      // Create a map for quick access
      const memberMap = new Map<string, FamilyMember>(prevMembers.map(m => [m.id, { ...m }]));
      
      // Update the current member
      memberMap.set(updatedMember.id, { ...updatedMember });
      
      // Synchronize relationships
      // 1. Spouses
      updatedMember.spouseIds.forEach(spouseId => {
        const spouse = memberMap.get(spouseId);
        if (spouse && !spouse.spouseIds.includes(updatedMember.id)) {
          spouse.spouseIds = [...spouse.spouseIds, updatedMember.id];
        }
      });
      
      // 2. Parents -> Children
      updatedMember.parentIds.forEach(parentId => {
        const parent = memberMap.get(parentId);
        if (parent && !parent.childrenIds.includes(updatedMember.id)) {
          parent.childrenIds = [...parent.childrenIds, updatedMember.id];
        }
      });
      
      // 3. Children -> Parents
      updatedMember.childrenIds.forEach(childId => {
        const child = memberMap.get(childId);
        if (child && !child.parentIds.includes(updatedMember.id)) {
          child.parentIds = [...child.parentIds, updatedMember.id];
        }
      });
      
      // Clean up old relationships (if they were removed in the form)
      const oldMember = prevMembers.find(m => m.id === updatedMember.id);
      if (oldMember) {
        // Remove from old spouses
        oldMember.spouseIds.filter(id => !updatedMember.spouseIds.includes(id)).forEach(id => {
          const spouse = memberMap.get(id);
          if (spouse) spouse.spouseIds = spouse.spouseIds.filter(sid => sid !== updatedMember.id);
        });
        
        // Remove from old parents
        oldMember.parentIds.filter(id => !updatedMember.parentIds.includes(id)).forEach(id => {
          const parent = memberMap.get(id);
          if (parent) parent.childrenIds = parent.childrenIds.filter(cid => cid !== updatedMember.id);
        });
        
        // Remove from old children
        oldMember.childrenIds.filter(id => !updatedMember.childrenIds.includes(id)).forEach(id => {
          const child = memberMap.get(id);
          if (child) child.parentIds = child.parentIds.filter(pid => pid !== updatedMember.id);
        });
      }

      return Array.from(memberMap.values());
    });
    setSelectedMember(updatedMember);
    setIsEditMode(false);
  };

  const handleDeleteMember = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thành viên này?')) {
      setMembers(members.filter((m) => m.id !== id));
      setIsPanelOpen(false);
      setSelectedMember(null);
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(members, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "family_tree.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          setMembers(json);
        } catch (err) {
          alert('Lỗi định dạng file JSON!');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleResetLayout = () => {
    updateGraph(members, true);
  };

  return (
    <div className={`${isPage ? 'h-full w-full' : 'h-[800px] w-full'} bg-stone-50 rounded-3xl border border-stone-200 overflow-hidden relative shadow-inner`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        className="family-tree-flow"
      >
        <Background color="#e7e5e4" gap={20} />
        <Controls />
        <MiniMap
          nodeStrokeColor={(n) => (n.data as any).gender === 'male' ? '#3b82f6' : '#f43f5e'}
          nodeColor={(n) => (n.data as any).gender === 'male' ? '#dbeafe' : '#ffe4e6'}
          nodeBorderRadius={8}
        />
        
        <Panel position="top-left" className="flex flex-col gap-2">
          <div className="bg-white/80 backdrop-blur-md p-2 rounded-2xl border border-stone-200 shadow-sm flex flex-col gap-2">
            <button
              onClick={handleAddMember}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all shadow-sm"
            >
              <Plus size={18} />
              <span className="text-sm font-medium">Thêm thành viên</span>
            </button>
            <button
              onClick={handleResetLayout}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-stone-800 text-white rounded-xl hover:bg-stone-900 transition-all shadow-sm"
              title="Tối ưu layout & Căn chỉnh"
            >
              <Maximize2 size={18} />
              <span className="text-sm font-medium">Căn chỉnh lại</span>
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white text-stone-600 rounded-xl border border-stone-200 hover:bg-stone-50 transition-all"
                title="Xuất JSON"
              >
                <Download size={16} />
              </button>
              <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white text-stone-600 rounded-xl border border-stone-200 hover:bg-stone-50 transition-all cursor-pointer">
                <Upload size={16} />
                <input type="file" className="hidden" accept=".json" onChange={handleImport} />
              </label>
            </div>
          </div>
        </Panel>

        <Panel position="top-right">
          <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-stone-200 shadow-sm flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-blue-400" />
              <span className="text-xs font-medium text-stone-600">Nam</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-400" />
              <span className="text-xs font-medium text-stone-600">Nữ</span>
            </div>
          </div>
        </Panel>
      </ReactFlow>

      {/* Detail Panel */}
      <AnimatePresence>
        {isPanelOpen && selectedMember && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute right-0 top-0 h-full w-full md:w-[400px] bg-white shadow-2xl z-50 border-l border-stone-200 flex flex-col"
          >
            <MemberPanel
              member={selectedMember}
              members={members}
              isEditMode={isEditMode}
              onClose={() => setIsPanelOpen(false)}
              onUpdate={handleUpdateMember}
              onDelete={() => handleDeleteMember(selectedMember.id)}
              onSetEditMode={setIsEditMode}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FamilyTree({ isPage = false }: { isPage?: boolean }) {
  return (
    <div className={`${isPage ? 'h-full w-full' : 'mb-16'}`}>
      {!isPage && (
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl">
            <Network size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-stone-800 font-headline">Cây Gia Phả Trực Quan</h2>
            <p className="text-stone-500 text-sm mt-1">Khám phá cội nguồn và các mối quan hệ gia đình</p>
          </div>
        </div>
      )}
      
      <ReactFlowProvider>
        <FamilyTreeContent isPage={isPage} />
      </ReactFlowProvider>

      {!isPage && (
        <div className="mt-6 bg-stone-100 p-6 rounded-3xl border border-stone-200">
          <h3 className="font-bold text-stone-800 mb-2 flex items-center gap-2">
            <Edit2 size={18} className="text-primary" />
            Hướng dẫn sử dụng
          </h3>
          <ul className="text-sm text-stone-600 space-y-2 list-disc list-inside">
            <li><strong>Xem chi tiết:</strong> Click vào một thành viên để xem thông tin và chỉnh sửa.</li>
            <li><strong>Thêm thành viên:</strong> Sử dụng nút "Thêm thành viên" ở góc trên bên trái.</li>
            <li><strong>Kết nối quan hệ:</strong> Trong bảng chi tiết, bạn có thể chọn Cha/Mẹ, Vợ/Chồng hoặc Con cái.</li>
            <li><strong>Tự động sắp xếp:</strong> Cây sẽ tự động layout theo phân cấp thế hệ.</li>
            <li><strong>Di chuyển & Phóng to:</strong> Sử dụng chuột để kéo (pan) và cuộn để phóng to/thu nhỏ (zoom).</li>
          </ul>
        </div>
      )}
    </div>
  );
}

interface MemberPanelProps {
  member: FamilyMember;
  members: FamilyMember[];
  isEditMode: boolean;
  onClose: () => void;
  onUpdate: (m: FamilyMember) => void;
  onDelete: () => void;
  onSetEditMode: (val: boolean) => void;
}

function MemberPanel({ member, members, isEditMode, onClose, onUpdate, onDelete, onSetEditMode }: MemberPanelProps) {
  const [formData, setFormData] = useState<FamilyMember>(member);

  useEffect(() => {
    setFormData(member);
  }, [member]);

  const handleChange = (field: keyof FamilyMember, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Update relationships in other members too
    // For simplicity, we just update the current member here.
    // In a real app, you'd want to ensure consistency (e.g., if A is B's parent, B must have A as parent).
    onUpdate(formData);
  };

  const otherMembers = members.filter(m => m.id !== member.id);

  return (
    <>
      <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
        <h3 className="text-xl font-bold text-stone-800">
          {isEditMode ? 'Chỉnh sửa thành viên' : 'Chi tiết thành viên'}
        </h3>
        <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors">
          <Trash2 size={20} className="hidden" /> {/* Placeholder */}
          <Edit2 size={20} className="hidden" /> {/* Placeholder */}
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex flex-col items-center gap-4">
          <div className={`w-32 h-32 rounded-full border-4 ${formData.gender === 'male' ? 'border-blue-200' : 'border-rose-200'} overflow-hidden shadow-lg`}>
            {formData.avatar ? (
              <div className="relative w-full h-full">
                <Image src={formData.avatar} alt={formData.name} fill className="object-cover" referrerPolicy="no-referrer" unoptimized />
              </div>
            ) : (
              <div className="w-full h-full bg-stone-100 flex items-center justify-center">
                <User size={48} className="text-stone-400" />
              </div>
            )}
          </div>
          {isEditMode && (
            <input
              type="text"
              placeholder="Link ảnh đại diện (URL)"
              value={formData.avatar || ''}
              onChange={(e) => handleChange('avatar', e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-stone-200 text-sm"
            />
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Họ và tên</label>
            {isEditMode ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            ) : (
              <p className="text-lg font-bold text-stone-800">{formData.name}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Giới tính</label>
              {isEditMode ? (
                <select
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value as Gender)}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                >
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              ) : (
                <p className="font-medium text-stone-700">{formData.gender === 'male' ? 'Nam' : formData.gender === 'female' ? 'Nữ' : 'Khác'}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Ngày sinh</label>
              {isEditMode ? (
                <input
                  type="date"
                  value={formData.dateOfBirth || ''}
                  onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              ) : (
                <p className="font-medium text-stone-700">{formData.dateOfBirth || 'Chưa cập nhật'}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Tiểu sử</label>
            {isEditMode ? (
              <textarea
                value={formData.bio || ''}
                onChange={(e) => handleChange('bio', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
              />
            ) : (
              <p className="text-stone-600 text-sm leading-relaxed">{formData.bio || 'Không có thông tin tiểu sử.'}</p>
            )}
          </div>

          <div className="pt-4 border-t border-stone-100 space-y-4">
            <h4 className="text-sm font-bold text-stone-800 flex items-center gap-2">
              <Network size={16} className="text-primary" />
              Mối quan hệ
            </h4>

            {/* Parent Selection */}
            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <UserPlus size={12} /> Cha / Mẹ
              </label>
              {isEditMode ? (
                <div className="space-y-2">
                  <select
                    multiple
                    value={formData.parentIds}
                    onChange={(e) => {
                      const select = e.target as HTMLSelectElement;
                      const values = Array.from(select.selectedOptions, option => option.value);
                      handleChange('parentIds', values);
                    }}
                    className="w-full px-4 py-2 rounded-xl border border-stone-200 h-24"
                  >
                    {otherMembers.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-stone-400">Giữ Ctrl/Cmd để chọn nhiều người</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {formData.parentIds.length > 0 ? (
                    formData.parentIds.map(id => {
                      const p = members.find(m => m.id === id);
                      return p ? <span key={id} className="px-3 py-1 bg-stone-100 rounded-full text-xs font-medium">{p.name}</span> : null;
                    })
                  ) : <span className="text-xs text-stone-400 italic">Chưa có thông tin</span>}
                </div>
              )}
            </div>

            {/* Spouse Selection */}
            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Heart size={12} className="text-rose-500" /> Vợ / Chồng
              </label>
              {isEditMode ? (
                <select
                  multiple
                  value={formData.spouseIds}
                  onChange={(e) => {
                    const select = e.target as HTMLSelectElement;
                    const values = Array.from(select.selectedOptions, option => option.value);
                    handleChange('spouseIds', values);
                  }}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 h-24"
                >
                  {otherMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {formData.spouseIds.length > 0 ? (
                    formData.spouseIds.map(id => {
                      const s = members.find(m => m.id === id);
                      return s ? <span key={id} className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-xs font-medium">{s.name}</span> : null;
                    })
                  ) : <span className="text-xs text-stone-400 italic">Chưa có thông tin</span>}
                </div>
              )}
            </div>

            {/* Children Selection */}
            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Baby size={12} className="text-blue-500" /> Con cái
              </label>
              {isEditMode ? (
                <select
                  multiple
                  value={formData.childrenIds}
                  onChange={(e) => {
                    const select = e.target as HTMLSelectElement;
                    const values = Array.from(select.selectedOptions, option => option.value);
                    handleChange('childrenIds', values);
                  }}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 h-24"
                >
                  {otherMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {formData.childrenIds.length > 0 ? (
                    formData.childrenIds.map(id => {
                      const c = members.find(m => m.id === id);
                      return c ? <span key={id} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">{c.name}</span> : null;
                    })
                  ) : <span className="text-xs text-stone-400 italic">Chưa có thông tin</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-stone-100 flex gap-3 bg-stone-50/50">
        {isEditMode ? (
          <>
            <button
              onClick={() => onSetEditMode(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 font-medium text-stone-600 hover:bg-stone-100 transition-all"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-all shadow-md"
            >
              Lưu thay đổi
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onDelete}
              className="px-4 py-2.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-all"
            >
              <Trash2 size={20} />
            </button>
            <button
              onClick={() => onSetEditMode(true)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-stone-800 text-white font-medium hover:bg-stone-900 transition-all flex items-center justify-center gap-2"
            >
              <Edit2 size={18} />
              Chỉnh sửa
            </button>
          </>
        )}
      </div>
    </>
  );
}
