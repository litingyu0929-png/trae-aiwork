import React from 'react';
import { WorkTask } from '../../../types';
import { Calendar, Info, MessageSquare, CheckCircle, Circle, MoreHorizontal, Lock, Plus } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface AirtableGridProps {
  tasks: WorkTask[];
  onTaskClick: (task: WorkTask) => void;
  onTaskUpdate?: (taskId: string, updates: any) => void;
}

// Map task kinds to pill styles
const getTaskPill = (taskKind: string = '', payload: any) => {
  const instruction = (typeof payload === 'string' ? JSON.parse(payload).instruction : payload?.instruction) || '';
  const title = (typeof payload === 'string' ? JSON.parse(payload).title : payload?.title) || '';
  const post_content = (typeof payload === 'string' ? JSON.parse(payload).post_content : payload?.post_content) || '';
  
  // Use instruction text if taskKind is generic, or map specific kinds
  // Mapping based on visual reference and common ops types
  if (taskKind === 'ops_predict') return { label: '賽事預測', color: 'bg-[#E3F2FD] text-[#1976D2]' }; // Blue
  if (taskKind === 'ops_script_kill') return { label: '劇情殺製作', color: 'bg-[#E3F2FD] text-[#1976D2]' }; // Blue
  if (taskKind === 'ops_hype') return { label: '炒群與帶單', color: 'bg-[#FFF3E0] text-[#E65100]' }; // Orange
  if (taskKind === 'ops_reply') return { label: '回覆與私訊', color: 'bg-[#FFF8E1] text-[#F57F17]' }; // Yellow
  if (taskKind === 'ops_intercept') return { label: '按讚留言7則', color: 'bg-[#E0F2F1] text-[#00695C]' }; // Teal/Greenish
  
  // Default fallback based on content
  if (title) return { label: title, color: 'bg-[#E3F2FD] text-[#1976D2]' };
  if (post_content) return { label: post_content.length > 10 ? post_content.substring(0, 10) + '...' : post_content, color: 'bg-[#F3E5F5] text-[#7B1FA2]' }; // Purple for content
  if (instruction.includes('預測') || instruction.includes('推單')) return { label: '賽事預測', color: 'bg-[#E3F2FD] text-[#1976D2]' };
  if (instruction.includes('私訊') || instruction.includes('回覆')) return { label: '回覆與私訊', color: 'bg-[#FFF8E1] text-[#F57F17]' };
  
  return { label: taskKind.replace('ops_', '') || '一般任務', color: 'bg-gray-100 text-gray-700' };
};

export const AirtableGrid: React.FC<AirtableGridProps> = ({ tasks, onTaskClick, onTaskUpdate }) => {
  return (
    <div className="flex-1 overflow-auto bg-white relative">
      <table className="w-full min-w-[800px] border-collapse">
        {/* Header */}
        <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.1)]">
          <tr className="h-10 text-left">
            {/* Checkbox Column */}
            <th className="w-10 border-r border-b border-gray-200 bg-[#F5F6F8] text-center sticky left-0 z-20">
              <input type="checkbox" className="rounded border-gray-300" />
            </th>
            
            {/* Index Column Placeholder in Body */}
            
            {/* Content Subject (Date/Time) */}
            <th className="min-w-[180px] border-r border-b border-gray-200 px-3 py-2">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                <Lock size={12} />
                <Calendar size={12} />
                任務時間
              </div>
            </th>

            {/* Work Task */}
            <th className="min-w-[250px] border-r border-b border-gray-200 px-3 py-2">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                <MoreHorizontal size={12} className="rotate-90" /> {/* List icon approximation */}
                工作任務
                <Info size={12} />
              </div>
            </th>

            {/* Task Completed (Action Button) */}
            <th className="w-[140px] border-r border-b border-gray-200 px-3 py-2">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                <MessageSquare size={12} />
                任務已完成
              </div>
            </th>

            {/* Progress */}
            <th className="w-[120px] border-b border-gray-200 px-3 py-2">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                <CheckCircle size={12} />
                進度
              </div>
            </th>
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {tasks.map((task, index) => {
            const pill = getTaskPill(task.task_kind, task.payload);
            const isCompleted = task.status === 'completed';
            const dateStr = task.task_date?.replace(/-/g, '/') || '2026/01/21';
            const timeStr = task.scheduled_time || '14:00';

            return (
              <tr key={task.id} className="group hover:bg-gray-50 h-12 transition-colors">
                {/* Index / Checkbox */}
                <td className="border-r border-b border-gray-200 bg-white group-hover:bg-gray-50 text-center sticky left-0 z-10 w-10 text-xs text-gray-400 font-medium">
                  <div className="relative w-full h-full flex items-center justify-center">
                    <span className="group-hover:hidden">{index + 1}</span>
                    <input type="checkbox" className="hidden group-hover:block rounded border-gray-300" />
                  </div>
                </td>

                {/* Date/Time */}
                <td className="border-r border-b border-gray-200 px-3 py-2 text-sm text-gray-900 font-mono">
                  <span className="text-gray-900 font-bold">{timeStr}</span>
                </td>

                {/* Task Pills */}
                <td className="border-r border-b border-gray-200 px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap shadow-sm", pill.color)}>
                      {pill.label}
                    </span>
                  </div>
                </td>

                {/* Action Button */}
                <td className="border-r border-b border-gray-200 px-3 py-2 text-center">
                  <button 
                    onClick={() => onTaskClick(task)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium py-1.5 rounded transition-colors shadow-sm"
                  >
                    執行任務
                  </button>
                </td>

                {/* Status Pill */}
                <td className="border-b border-gray-200 px-3 py-2">
                  <div className={cn(
                    "w-fit px-3 py-1 rounded-full text-xs font-bold text-white text-center min-w-[60px]",
                    isCompleted ? "bg-[#2ECC71]" : "bg-[#E74C3C]"
                  )}>
                    {isCompleted ? "已完成" : "未開始"}
                  </div>
                </td>
              </tr>
            );
          })}
          
          {/* Empty Rows Filler */}
          {Array.from({ length: Math.max(0, 10 - tasks.length) }).map((_, i) => (
            <tr key={`empty-${i}`} className="h-12">
               <td className="border-r border-b border-gray-200 text-center text-xs text-gray-300">{tasks.length + i + 1}</td>
               <td className="border-r border-b border-gray-200"></td>
               <td className="border-r border-b border-gray-200"></td>
               <td className="border-r border-b border-gray-200"></td>
               <td className="border-b border-gray-200"></td>
            </tr>
          ))}
          
          {/* Plus Row */}
          <tr className="h-10 border-b border-gray-200">
             <td className="border-r border-gray-200 text-center sticky left-0 bg-white z-10 text-gray-400">
                <Plus size={14} className="mx-auto" />
             </td>
             <td colSpan={4} className="bg-gray-50/30"></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
