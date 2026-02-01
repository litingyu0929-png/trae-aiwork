import React, { useState } from 'react';
import { WorkTask } from '../../types';
import { CheckCircle, Circle, AlertCircle, Clock, MoreHorizontal } from 'lucide-react';
import { OpsTaskCard } from './OpsTaskCard';
import { TaskCard } from './TaskCard';

// Time Blocks Definition
const TIME_BLOCKS = [
  { id: 'wake_up', label: '14:00 Wake Up', icon: '🌅' },
  { id: 'warm_up', label: '15:00 Warm Up', icon: '🔥' },
  { id: 'production', label: '16:00 Production', icon: '🚀' },
  { id: 'war', label: '19:00 The War', icon: '⚔️' },
  { id: 'closing', label: '22:00 Closing', icon: '🌙' }
];

interface AccountMap {
  account_id: string;
  persona_id: string;
  account: {
    id: string;
    account_name: string;
    account_handle: string | null;
    platform: string;
  };
  persona: {
    id: string;
    name: string;
    avatar_url: string | null;
    role_category?: string;
  };
}

interface RunbookMatrixProps {
  tasks: WorkTask[];
  accountsMap: AccountMap[];
  currentTimeBlock: string;
  onTaskUpdate: (task: WorkTask) => void;
  onTaskComplete: (taskId: string) => void;
}

export const RunbookMatrix: React.FC<RunbookMatrixProps> = ({
  tasks,
  accountsMap,
  currentTimeBlock,
  onTaskUpdate,
  onTaskComplete
}) => {
  const [selectedTask, setSelectedTask] = useState<WorkTask | null>(null);

  // Helper to find task for a specific cell
  const getTaskForCell = (timeBlock: string, personaId: string) => {
    return tasks.find(t => t.time_block === timeBlock && t.persona_id === personaId);
  };

  // Check if a persona has overdue tasks (simple logic: pending tasks in past blocks)
  const hasOverdue = (personaId: string) => {
    const currentBlockIndex = TIME_BLOCKS.findIndex(b => b.id === currentTimeBlock);
    if (currentBlockIndex <= 0) return false;

    return tasks.some(t => {
      const taskBlockIndex = TIME_BLOCKS.findIndex(b => b.id === t.time_block);
      return (
        t.persona_id === personaId &&
        t.status !== 'completed' &&
        taskBlockIndex < currentBlockIndex &&
        taskBlockIndex !== -1
      );
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Scrollable Container */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full border-collapse min-w-[800px]">
          {/* Table Header: Personas */}
          <thead>
            <tr>
              {/* Corner Cell */}
              <th className="sticky left-0 z-20 bg-gray-50 border-b border-r border-gray-200 p-4 min-w-[140px] text-left">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Time / Persona</span>
              </th>
              
              {/* Persona Columns */}
              {accountsMap.map((mapItem) => (
                <th key={mapItem.persona_id} className="border-b border-gray-200 p-3 min-w-[180px] text-left bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img 
                        src={mapItem.persona?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mapItem.persona?.name}`} 
                        alt={mapItem.persona?.name}
                        className="w-10 h-10 rounded-full border border-gray-200 bg-white"
                      />
                      {hasOverdue(mapItem.persona_id) && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm truncate max-w-[120px]">
                        {mapItem.persona?.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate max-w-[120px]">
                        @{mapItem.account?.account_handle || mapItem.account?.account_name}
                      </div>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body: Time Blocks */}
          <tbody>
            {TIME_BLOCKS.map((block) => {
              const isCurrent = block.id === currentTimeBlock;
              
              return (
                <tr key={block.id} className={isCurrent ? 'bg-indigo-50/30' : 'hover:bg-gray-50/50 transition-colors'}>
                  {/* Row Header: Time Block */}
                  <th className={`sticky left-0 z-10 border-r border-b border-gray-100 p-4 text-left transition-colors ${isCurrent ? 'bg-indigo-50 border-indigo-100' : 'bg-white'}`}>
                    <div className={`flex flex-col ${isCurrent ? 'text-indigo-700' : 'text-gray-600'}`}>
                      <span className="text-xs font-bold uppercase tracking-wider mb-1 opacity-70">
                        {block.label.split(' ')[0]}
                      </span>
                      <span className="font-black text-sm flex items-center gap-1">
                        {block.icon} {block.label.split(' ').slice(1).join(' ')}
                      </span>
                    </div>
                  </th>

                  {/* Task Cells */}
                  {accountsMap.map((mapItem) => {
                    const task = getTaskForCell(block.id, mapItem.persona_id);
                    const isCompleted = task?.status === 'completed';
                    const isPending = task && !isCompleted;
                    
                    return (
                      <td key={`${block.id}-${mapItem.persona_id}`} className="border-b border-gray-100 p-2 align-top h-[100px]">
                        {task ? (
                          <div 
                            onClick={() => setSelectedTask(task)}
                            className={`
                              h-full rounded-lg p-3 border cursor-pointer transition-all hover:shadow-md flex flex-col justify-between relative overflow-hidden group
                              ${isCompleted 
                                ? 'bg-green-50 border-green-200 text-green-800' 
                                : isCurrent 
                                  ? 'bg-white border-indigo-300 ring-2 ring-indigo-100 shadow-sm' 
                                  : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-300'
                              }
                            `}
                          >
                            {/* Status Stripe */}
                            <div className={`absolute top-0 left-0 w-1 h-full ${
                              isCompleted ? 'bg-green-500' : 
                              task.task_kind?.startsWith('ops_') ? 'bg-amber-500' : 'bg-indigo-500'
                            }`}></div>

                            {/* Content */}
                            <div className="pl-2">
                              <div className="flex justify-between items-start mb-1">
                                <span className={`text-xs font-bold uppercase tracking-tight ${
                                  isCompleted ? 'text-green-700' : 'text-gray-500'
                                }`}>
                                  {task.task_kind?.replace('ops_', '').replace('_', ' ') || 'Task'}
                                </span>
                                {isCompleted ? (
                                  <CheckCircle size={14} className="text-green-600" />
                                ) : (
                                  <Circle size={14} className="text-gray-300 group-hover:text-indigo-400" />
                                )}
                              </div>
                              
                              <p className={`text-xs leading-tight line-clamp-2 font-medium ${isCompleted && 'line-through opacity-60'}`}>
                                {typeof task.payload === 'string' 
                                  ? JSON.parse(task.payload).instruction 
                                  : (task.payload as any)?.instruction || '執行任務...'}
                              </p>
                            </div>

                            {/* Hover Action */}
                            {!isCompleted && (
                              <div className="mt-2 pl-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                                  點擊執行
                                </span>
                              </div>
                            )}
                            
                            {/* Done Result Preview */}
                            {isCompleted && (
                              <div className="mt-1 pl-2 text-[10px] opacity-80 truncate">
                                {(task as any).notes || '已完成'}
                              </div>
                            )}

                          </div>
                        ) : (
                          // Empty State
                          <div className="h-full rounded-lg border border-dashed border-gray-100 bg-gray-50/50 flex flex-col items-center justify-center text-gray-300 select-none">
                            <span className="text-xl opacity-20">-</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-transparent w-full max-w-lg">
             {/* Reuse existing card components but wrapped in a closer */}
             <div className="relative">
                <button 
                  onClick={() => setSelectedTask(null)}
                  className="absolute -top-10 right-0 text-white hover:text-gray-200 transition-colors"
                >
                  關閉 [Esc]
                </button>
                
                {selectedTask.task_kind?.startsWith('ops_') ? (
                  <OpsTaskCard 
                    task={selectedTask} 
                    onComplete={(id) => {
                      onTaskComplete(id);
                      setSelectedTask(null);
                    }} 
                  />
                ) : (
                  <TaskCard 
                    task={selectedTask} 
                    onComplete={(id) => {
                      onTaskComplete(id);
                      setSelectedTask(null);
                    }} 
                  />
                )}
             </div>
          </div>
          {/* Click outside to close */}
          <div className="absolute inset-0 -z-10" onClick={() => setSelectedTask(null)}></div>
        </div>
      )}
    </div>
  );
};
