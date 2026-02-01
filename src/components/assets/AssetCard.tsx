import React from 'react';
import { Instagram, Youtube, Globe, Rss, Lock, Unlock, Download, Trash2, ExternalLink, Users, Upload, FolderMinus } from 'lucide-react';
import { Asset } from '../../types';
import { cn } from '../../lib/utils';

interface AssetCardProps {
  asset: Asset;
  onAdopt: (id: string) => void;
  onDelete?: (id: string) => void;
  onVisibilityChange?: (id: string, visibility: 'private' | 'shared') => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, asset: Asset) => void;
  isPersonaView?: boolean; // New prop to indicate if we are in persona view
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset, onAdopt, onDelete, onVisibilityChange, draggable, onDragStart, isPersonaView }) => {
  const isAdopted = asset.status === 'adopted';
  const isShared = asset.visibility === 'shared';
  const isManualUpload = asset.upload_method === 'manual_upload';

  const getPlatformIcon = (platform: string | null) => {
    switch (platform) {
      case 'instagram': return <Instagram className="w-4 h-4" />;
      case 'tiktok': return <span className="text-xs font-bold">Tk</span>;
      case 'xiaohongshu': return <span className="text-xs font-bold">Red</span>;
      case 'youtube': return <Youtube className="w-4 h-4" />;
      case 'rss': return <Rss className="w-4 h-4" />;
      case 'upload': return <Upload className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onVisibilityChange) return;
    
    const newVisibility = isShared ? 'private' : 'shared';
    const message = isShared 
      ? '確定要將此素材設為私人？只有您能看到。' 
      : '確定要將此素材設為團隊共享？所有員工都能看到並使用。';
      
    if (window.confirm(message)) {
      onVisibilityChange(asset.id, newVisibility);
    }
  };

  return (
    <div 
      className={cn(
        "bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-4 group relative hover:shadow-lg transition-all duration-300 h-full flex flex-col",
        draggable && "cursor-move"
      )}
      draggable={draggable}
      onDragStart={(e) => onDragStart && onDragStart(e, asset)}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden w-full aspect-[4/3] bg-gray-100 select-none">
        <img 
          src={asset.thumbnail_url || asset.content_url || ''} 
          alt={asset.title || 'Asset'} 
          className="w-full h-full object-cover transform group-hover:scale-[1.2] transition-transform duration-300 ease-in-out"
          loading="lazy"
          draggable={false}
        />
        
        {/* Dark Overlay on Hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 pointer-events-none" />

        <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded text-xs flex items-center gap-1 z-10">
          {getPlatformIcon(asset.source_platform)}
          <span className="capitalize">{asset.source_platform === 'upload' ? '手動上傳' : asset.source_platform}</span>
        </div>
        
        {/* Visibility Badge */}
        <div className="absolute top-2 right-2 flex gap-1 z-10">
          {isShared ? (
            <div 
              className={cn(
                "px-2 py-1 rounded text-xs flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity",
                "bg-green-500/90 text-white backdrop-blur-sm"
              )}
              onClick={handleToggleVisibility}
              title="點擊切換可見性"
            >
              <Users className="w-3 h-3" />
              共享
            </div>
          ) : (
            <div 
              className={cn(
                "px-2 py-1 rounded text-xs flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity",
                "bg-gray-500/90 text-white backdrop-blur-sm"
              )}
              onClick={handleToggleVisibility}
              title="點擊切換可見性"
            >
              <Lock className="w-3 h-3" />
              私人
            </div>
          )}
        </div>
        
        {isAdopted && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
            <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-2 text-sm font-medium text-gray-900">
              <Lock className="w-4 h-4" />
              已被領養
            </div>
          </div>
        )}

        {/* Hover Overlay Buttons */}
        {!isAdopted && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 z-20 pointer-events-none">
            <button 
              onClick={() => onAdopt(asset.id)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 pointer-events-auto"
            >
              <Unlock className="w-4 h-4" />
              領養素材
            </button>
            {onDelete && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(asset.id);
                }}
                className={cn(
                  "bg-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-75 pointer-events-auto",
                  isPersonaView 
                    ? "text-orange-600 hover:bg-orange-50" 
                    : "text-red-600 hover:bg-red-50"
                )}
                title={isPersonaView ? "移出人設資料夾" : "永久刪除"}
              >
                {isPersonaView ? <FolderMinus className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                {isPersonaView ? '移出' : '刪除'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-2 flex-none" title={asset.title || asset.description || ''}>
          {asset.title || asset.description || 'Untitled Asset'}
        </h3>
        
        <div className="flex flex-wrap gap-1 mb-auto">
          {asset.category && (
             <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full border border-blue-100">
              {asset.category}
            </span>
          )}
          {asset.tags?.slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
              #{tag}
            </span>
          ))}
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 flex-none">
          <span>{new Date(asset.created_at).toLocaleDateString()}</span>
          <div className="flex items-center gap-2">
            {asset.content_url && (
              <a 
                href={asset.content_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                onClick={(e) => e.stopPropagation()}
                className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-50 rounded transition-colors"
                title="下載"
              >
                <Download size={14} />
              </a>
            )}
            {asset.source_url && (
              <a 
                href={asset.source_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                onClick={(e) => e.stopPropagation()}
                className="text-indigo-500 hover:text-indigo-700 p-1 hover:bg-indigo-50 rounded transition-colors"
                title="查看原始連結"
              >
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
