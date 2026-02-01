import React from 'react';
import { Copy, Download, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { WorkTask } from '../../types';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

interface TaskCardProps {
  task: WorkTask;
  onComplete: (id: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onComplete }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
      {/* Card Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-3">
          {task.persona?.avatar_url && (
            <img 
              src={task.persona.avatar_url} 
              alt={task.persona.name} 
              className="w-10 h-10 rounded-full object-cover border border-gray-200"
            />
          )}
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{task.persona?.name || 'Unknown Persona'}</h3>
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium capitalize",
              task.platform === 'instagram' && "bg-pink-50 text-pink-600",
              task.platform === 'tiktok' && "bg-black/5 text-black",
              task.platform === 'threads' && "bg-gray-100 text-gray-700",
              task.platform === 'xiaohongshu' && "bg-red-50 text-red-600",
            )}>
              {task.platform}
            </span>
          </div>
        </div>
        <div className="flex items-center text-xs text-gray-500 gap-1">
          <Clock className="w-3 h-3" />
          {task.scheduled_time?.slice(0, 5) || 'Anytime'}
        </div>
      </div>

      {/* Content Preview */}
      <div className="p-4 space-y-4 flex-1">
        {task.asset && (
          <div className="aspect-video w-full rounded-lg overflow-hidden bg-gray-100 relative group">
            <img 
              src={task.asset.thumbnail_url || task.asset.content_url || ''} 
              alt="Content preview" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button className="p-2 bg-white rounded-full hover:bg-gray-100 text-gray-900" title="Download">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        
        <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 line-clamp-3 whitespace-pre-wrap">
          {task.content_text || 'No content generated yet.'}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 pt-0 flex gap-2">
        <button 
          onClick={() => navigate('/content-factory')}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          去內容工廠
        </button>
        <button 
          onClick={() => onComplete(task.id)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <CheckCircle className="w-4 h-4" />
          標記完成
        </button>
      </div>
    </div>
  );
};
