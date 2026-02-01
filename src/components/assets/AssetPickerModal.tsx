import React, { useState, useEffect } from 'react';
import { Search, X, Image as ImageIcon, FileText, CheckCircle, Folder } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Asset, Persona } from '../../types';
import { Button } from '../ui/Button';

interface AssetPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (assets: Asset[]) => void;
  selectedAssets?: Asset[];
}

export const AssetPickerModal: React.FC<AssetPickerModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelect,
  selectedAssets = [] 
}) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]); // State for personas
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPersonaFilter, setSelectedPersonaFilter] = useState<string>('all'); // State for filter
  const [localSelected, setLocalSelected] = useState<Asset[]>(selectedAssets);

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setLocalSelected(selectedAssets);
    }
  }, [isOpen, selectedAssets]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Assets
      const { data: assetsData, error: assetsError } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (assetsError) throw assetsError;
      setAssets(assetsData || []);

      // Fetch Personas
      const { data: personasData, error: personasError } = await supabase
        .from('personas')
        .select('*')
        .order('name', { ascending: true });
      
      if (personasError) throw personasError;
      setPersonas(personasData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAsset = (asset: Asset) => {
    setLocalSelected(prev => {
      const exists = prev.find(a => a.id === asset.id);
      if (exists) {
        return prev.filter(a => a.id !== asset.id);
      } else {
        return [...prev, asset];
      }
    });
  };

  const handleConfirm = () => {
    onSelect(localSelected);
    onClose();
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = (asset.title?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
                          (asset.description?.toLowerCase().includes(searchTerm.toLowerCase()) || '');
    const matchesPersona = selectedPersonaFilter === 'all' || asset.persona_id === selectedPersonaFilter;
    
    return matchesSearch && matchesPersona;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">選擇素材庫內容</h3>
            <p className="text-sm text-gray-500">已選擇 {localSelected.length} 個素材</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Filters & Search */}
        <div className="p-4 border-b border-gray-100 bg-white space-y-3">
          {/* Persona Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
            <button
              onClick={() => setSelectedPersonaFilter('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap border ${
                selectedPersonaFilter === 'all'
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Folder size={12} />
              全部素材
            </button>
            {personas.map(persona => (
              <button
                key={persona.id}
                onClick={() => setSelectedPersonaFilter(persona.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap border ${
                  selectedPersonaFilter === persona.id
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-gray-200/20 flex items-center justify-center text-[10px]">
                  {persona.name.charAt(0)}
                </div>
                {persona.name}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="搜尋素材標題或描述..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {loading ? (
            <div className="flex justify-center py-12 text-gray-500">載入中...</div>
          ) : filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <ImageIcon size={48} className="mb-4 opacity-20" />
              <p>沒有找到符合的素材</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredAssets.map(asset => {
                const isSelected = localSelected.some(a => a.id === asset.id);
                return (
                  <div 
                    key={asset.id}
                    onClick={() => toggleAsset(asset)}
                    className={`
                      group relative aspect-square rounded-lg border-2 overflow-hidden cursor-pointer transition-all
                      ${isSelected ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-gray-200 hover:border-indigo-300'}
                    `}
                  >
                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 z-10 bg-indigo-600 text-white rounded-full p-0.5 shadow-sm">
                        <CheckCircle size={16} fill="white" className="text-indigo-600" />
                      </div>
                    )}
                    
                    {/* Thumbnail */}
                    <div className="w-full h-full bg-white flex items-center justify-center">
                      {asset.thumbnail_url || asset.content_url ? (
                        <img 
                          src={asset.thumbnail_url || asset.content_url || ''} 
                          alt={asset.title || 'asset'} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-gray-300">
                          <FileText size={32} />
                          <span className="text-[10px] mt-1">純文字</span>
                        </div>
                      )}
                    </div>

                    {/* Overlay Title */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs font-medium truncate">
                        {asset.title || '未命名'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleConfirm} disabled={localSelected.length === 0}>
            確認選擇 ({localSelected.length})
          </Button>
        </div>
      </div>
    </div>
  );
};