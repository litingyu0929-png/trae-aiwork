import React, { useState, useEffect } from 'react';
import { AssetCard } from '../components/assets/AssetCard';
import { RssManagerModal } from '../components/assets/RssManagerModal';
import { Asset, Persona } from '../types';
import { Filter, Search, RefreshCw, Plus, X, Settings, Upload, FolderPlus, Folder } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { UploadAssetModal } from '../components/assets/UploadAssetModal';
import { ASSET_CATEGORIES } from '../lib/constants';
import { cn } from '../lib/utils';

interface PersonaDropZoneProps {
  persona: Persona;
  onDrop: (assetId: string, personaId: string) => void;
  onClick?: (personaId: string) => void;
  isActive?: boolean;
  currentDraggingId?: string | null;
  count?: number; // New prop for asset count
}

const PersonaDropZone: React.FC<PersonaDropZoneProps> = ({ persona, onDrop, onClick, isActive, currentDraggingId, count = 0 }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  // 計算此人設下的素材數量 (需要傳入 assets)
  // 由於這是一個簡單組件，我們可以在外部過濾或在此處傳入計數
  // 為了效能，我們暫時不顯示計數，或需要從外部 props 傳入
  // 這裡我們修改為接收一個可選的 count prop

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 只有當有東西在拖曳時才顯示效果
    if (currentDraggingId && !isDragOver) setIsDragOver(true);
  };
  
  // ... (rest of the component)

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    // 優先使用 dataTransfer，如果失敗則使用全域狀態 currentDraggingId
    const assetId = e.dataTransfer.getData('text/plain') || currentDraggingId;
    
    console.log('Drop Event:', { 
      transferData: e.dataTransfer.getData('text/plain'), 
      currentDraggingId, 
      resolvedAssetId: assetId 
    });
    
    if (assetId) {
      onDrop(assetId, persona.id);
    }
  };

  return (
    <div
      onClick={() => onClick?.(persona.id)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "p-3 rounded-lg border-2 border-dashed transition-all cursor-pointer flex items-center gap-3",
        isDragOver 
          ? "border-indigo-500 bg-indigo-50 scale-105 shadow-md ring-2 ring-indigo-200" 
          : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50",
        isActive && "border-indigo-500 bg-indigo-50"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors",
        isDragOver ? "bg-indigo-200 text-indigo-700" : "bg-gray-100 text-gray-500"
      )}>
        {persona.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 text-sm truncate flex justify-between items-center">
          {persona.name}
          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{count}</span>
        </h4>
        <p className="text-xs text-gray-500 truncate">
          {isDragOver ? '放開以歸檔' : '拖曳素材至此'}
        </p>
      </div>
      {isDragOver && <FolderPlus className="w-5 h-5 text-indigo-500 animate-bounce" />}
    </div>
  );
};

import { useRole } from '../contexts/RoleContext';
import { useAuth } from '../contexts/AuthContext';

export const AssetsLibrary: React.FC = () => {
  const navigate = useNavigate();
  const { currentRole, simulatedStaffId } = useRole();
  const { profile: authProfile } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('all'); // 'all', 'my', 'shared'
  const [isCrawling, setIsCrawling] = useState(false);
  const [isRssManagerOpen, setIsRssManagerOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [draggingAssetId, setDraggingAssetId] = useState<string | null>(null);

  // 載入人設
  const fetchPersonas = async () => {
    try {
      let currentStaffId = null;

      if (currentRole === 'admin' || currentRole === 'team_leader') {
        // Admin sees ALL accounts/personas OR based on simulatedStaffId if set (simulating user)
        if (simulatedStaffId) {
          currentStaffId = simulatedStaffId;
        }
      } else {
        // Regular staff sees ONLY their assigned personas
        currentStaffId = simulatedStaffId || authProfile?.id;
      }

      let query = supabase.from('personas').select('*').order('created_at', { ascending: false });

      // If we have a target staff ID, filter personas assigned to this staff
      if (currentStaffId && currentRole !== 'admin') {
        // First get assigned persona IDs from staff_persona_assignments
        const { data: assignments } = await supabase
          .from('staff_persona_assignments' as any)
          .select('persona_id')
          .eq('staff_id', currentStaffId);
        
        if (assignments && assignments.length > 0) {
          const personaIds = assignments.map((a: any) => a.persona_id);
          query = query.in('id', personaIds);
        } else {
          // Staff has no assignments
          setPersonas([]);
          return;
        }
      }

      const { data, error } = await query;
      
      if (data) {
        setPersonas(data);
        console.log('[Personas] Loaded:', data.length);
      }
    } catch (error) {
      console.error('Failed to fetch personas:', error);
    }
  };

  useEffect(() => {
    fetchPersonas();
  }, [currentRole, simulatedStaffId, authProfile]);

  // 載入真實素材
  const fetchAssets = async () => {
    try {
      // Use the API to fetch assets with the view filter
      const res = await fetch(`/api/assets?view=${view}`);
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setAssets(data);
        // Debug: Log asset counts per persona
        const counts = data.reduce((acc: any, curr: Asset) => {
          if (curr.persona_id) {
            acc[curr.persona_id] = (acc[curr.persona_id] || 0) + 1;
          }
          return acc;
        }, {});
        console.log('[Assets] Counts per persona:', counts);
      } else {
        console.error('Fetched data is not an array:', data);
        setAssets([]);
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [view]); // Refetch when view changes

  // 觸發爬蟲
  const handleCrawl = async () => {
    setIsCrawling(true);
    try {
      const res = await fetch('/api/crawler/run', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        alert(`採集完成！新增 ${data.results.reduce((acc: number, r: any) => acc + r.new_items, 0)} 筆素材`);
        fetchAssets(); // 重新載入
      } else {
        alert('採集失敗');
      }
    } catch (error) {
      console.error(error);
      alert('採集發生錯誤');
    } finally {
      setIsCrawling(false);
    }
  };

  const handleAdopt = (id: string) => {
    // Optimistic update
    setAssets(assets.map(asset => 
      asset.id === id ? { ...asset, status: 'adopted', adopted_by: 'current-user' } : asset
    ));
    
    if (window.confirm('領養成功！是否立即前往內容工廠生成文案？')) {
        const asset = assets.find(a => a.id === id);
        navigate('/content-lab', { state: { asset } });
    }
  };

  const handleDelete = async (id: string) => {
    // 根據當前是否選中人設，顯示不同的確認訊息
    const message = selectedPersonaId 
      ? '確定要將此素材從當前人設中移除嗎？（素材仍會保留在總庫中）'
      : '確定要永久刪除此素材嗎？此操作無法復原。';

    if (!window.confirm(message)) return;

    try {
      if (selectedPersonaId) {
        // 如果是在人設資料夾中，只執行「移除歸檔」(更新 persona_id 為 null)
        const res = await fetch(`/api/assets/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ persona_id: null }) // 設定為 null 代表移除歸檔
        });

        if (res.ok) {
          // 更新 UI：將該素材的 persona_id 設為 null
          // 這會導致它從當前篩選列表 (filteredAssets) 中消失，因為它不再符合 selectedPersonaId
          setAssets(assets.map(a => a.id === id ? { ...a, persona_id: null } : a));
        } else {
          const data = await res.json();
          alert('移除失敗: ' + data.error);
        }

      } else {
        // 如果是在全部/我的視圖，執行「物理刪除」
        const res = await fetch(`/api/assets/${id}`, {
          method: 'DELETE'
        });
        
        if (res.ok) {
          // Remove from UI
          setAssets(assets.filter(a => a.id !== id));
        } else {
          const data = await res.json();
          alert('刪除失敗: ' + data.error);
        }
      }
    } catch (error) {
      console.error(error);
      alert('操作發生錯誤');
    }
  };
  
  const handleVisibilityChange = async (id: string, visibility: 'private' | 'shared') => {
    try {
      const res = await fetch(`/api/assets/${id}/visibility`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility })
      });
      
      if (res.ok) {
        // Update local state
        setAssets(assets.map(a => a.id === id ? { ...a, visibility } : a));
      } else {
        const data = await res.json();
        alert('更新失敗: ' + data.error);
      }
    } catch (error) {
      console.error(error);
      alert('更新發生錯誤');
    }
  };

  const handleDragStart = (e: React.DragEvent, asset: Asset) => {
    // 必須設置這兩個屬性才能在 Firefox 等瀏覽器正常運作，且能傳遞數據
    e.dataTransfer.effectAllowed = 'copyMove';
    e.dataTransfer.setData('text/plain', asset.id); // Fallback
    e.dataTransfer.setData('assetId', asset.id);
    
    // 設置拖曳時的視覺效果 (可選)
    // const img = new Image();
    // img.src = asset.thumbnail_url || '';
    // e.dataTransfer.setDragImage(img, 10, 10);
    
    setDraggingAssetId(asset.id);
  };

  const handlePersonaDrop = async (assetId: string, personaId: string) => {
    setDraggingAssetId(null);
    const persona = personas.find(p => p.id === personaId);
    
    // 再次確認 ID 有效性
    if (!assetId || !personaId) {
      console.error('Invalid drop data:', { assetId, personaId });
      return;
    }

    // Optimistic UI update
    setAssets(prev => prev.map(a => 
      a.id === assetId ? { ...a, persona_id: personaId } : a
    ));

    try {
      console.log(`[API] Assigning asset ${assetId} to persona ${personaId}`);

      const res = await fetch(`/api/assets/${assetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona_id: personaId })
      });

      if (res.ok) {
        // Success feedback
        console.log(`Asset ${assetId} successfully assigned to persona ${personaId}`);
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'API responded with error');
      }
    } catch (error) {
      console.error('Drop error:', error);
      // Revert on failure
      fetchAssets();
      alert('歸檔失敗，請檢查網路連線或重試');
    }
  };

  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null); // New state for selected persona

  // ... (existing code)

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = (asset.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                          (asset.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    // Use asset_type for filter
    let matchesFilter = filter === 'all' || asset.asset_type === filter || asset.category === filter;
    
    // Add persona filter
    if (selectedPersonaId) {
        matchesFilter = matchesFilter && asset.persona_id === selectedPersonaId;
    }
    
    return matchesSearch && matchesFilter;
  });

  const handlePersonaClick = (personaId: string) => {
      // Toggle selection: if clicking the same one, deselect it
      if (selectedPersonaId === personaId) {
          setSelectedPersonaId(null);
      } else {
          setSelectedPersonaId(personaId);
      }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-6rem)]">
      <RssManagerModal 
        isOpen={isRssManagerOpen} 
        onClose={() => setIsRssManagerOpen(false)} 
      />
      
      <UploadAssetModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => {
            setIsUploadModalOpen(false);
            fetchAssets();
        }}
      />

      {/* Left Sidebar: Persona Folders */}
      <div className="w-full lg:w-64 flex-none space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sticky top-4">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Folder className="w-4 h-4 text-indigo-600" />
            人設資料夾
          </h3>
          <p className="text-xs text-gray-500 mb-4">拖曳素材至下方人設以進行歸檔</p>
          
          <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-1 custom-scrollbar">
            {personas.length > 0 ? (
              personas.map(persona => (
                <PersonaDropZone 
                  key={persona.id} 
                  persona={persona} 
                  onDrop={handlePersonaDrop}
                  onClick={handlePersonaClick}
                  isActive={selectedPersonaId === persona.id} // Highlight active
                  currentDraggingId={draggingAssetId}
                  count={assets.filter(a => a.persona_id === persona.id).length}
                />
              ))
            ) : (
              <div className="text-center py-6 text-gray-400 text-sm border border-dashed rounded-lg bg-gray-50">
                尚未建立人設
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">智能素材庫</h1>
            <p className="text-gray-500 mt-1">已採集 {assets.length} 個真實素材</p>
          </div>
          
          <div className="flex gap-2">
             <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              <Upload className="w-4 h-4" />
              上傳圖片
            </button>
            
            <button 
              onClick={handleCrawl}
              disabled={isCrawling}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isCrawling ? 'animate-spin' : ''}`} />
              {isCrawling ? '採集中...' : '立即採集'}
            </button>
            <button 
              onClick={() => setIsRssManagerOpen(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50 text-gray-700"
            >
              <Settings className="w-4 h-4" />
              管理來源
            </button>
          </div>
        </div>

        {/* View Tabs & Search */}
        <div className="flex flex-col gap-4 mb-6">
          {/* View Tabs */}
          <div className="flex border-b border-gray-200">
              <button
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${view === 'all' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setView('all')}
              >
                  全部
              </button>
              <button
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${view === 'my' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setView('my')}
              >
                  我的素材
              </button>
              <button
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${view === 'shared' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setView('shared')}
              >
                  👥 團隊共享
              </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input 
                  type="text" 
                  placeholder="搜尋標題或內容..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                  {ASSET_CATEGORIES.map(category => (
                  <button 
                      key={category.value}
                      onClick={() => setFilter(category.value)}
                      className={`px-4 py-1.5 rounded-full border text-sm transition-colors whitespace-nowrap ${
                          filter === category.value 
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                          : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-500 hover:text-indigo-600'
                      }`}
                  >
                      {category.label}
                  </button>
                  ))}
              </div>
          </div>
        </div>

        {/* Grid */}
        {filteredAssets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[15px] pb-8">
              {filteredAssets.map(asset => (
              <AssetCard 
                  key={asset.id} 
                  asset={asset} 
                  onAdopt={handleAdopt}
                  onDelete={handleDelete}
                  onVisibilityChange={handleVisibilityChange}
                  draggable={true}
                  onDragStart={handleDragStart}
                  isPersonaView={!!selectedPersonaId} // Pass this prop
              />
              ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500 text-lg">暫無素材</p>
              <p className="text-gray-400 text-sm mt-2">
                  {view === 'my' ? '您還沒有上傳任何素材' : '請點擊「新增 RSS」並「立即採集」來獲取內容'}
              </p>
          </div>
        )}
      </div>
    </div>
  );
};
