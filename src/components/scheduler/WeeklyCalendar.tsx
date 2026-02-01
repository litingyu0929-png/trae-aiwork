import React, { useMemo } from 'react';
import type { WorkTask } from '../../types';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface WeeklyCalendarProps {
  tasks: WorkTask[];
  selectedDate: Date;
  startDate: Date; // Added startDate prop
  onDateChange: (date: Date) => void;
  onTaskClick: (task: WorkTask) => void;
}

const getTimeValue = (task: WorkTask) => {
  if (task.task_date && task.scheduled_time) {
      return new Date(`${task.task_date}T${task.scheduled_time}`).getTime();
  }
  if (task.task_date) {
      return new Date(task.task_date).getTime();
  }
  if (task.scheduled_time && task.scheduled_time.includes('T')) {
      return new Date(task.scheduled_time).getTime();
  }
  return new Date(task.created_at || 0).getTime();
};

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  tasks,
  selectedDate,
  startDate, // Destructure startDate
  onDateChange,
  onTaskClick
}) => {
  // Generate days for the week view (7 days starting from startDate)
  const weekDays = useMemo(() => {
    // const start = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Old Logic
    const start = startDate; // New Logic: Start from provided startDate
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, [startDate]);

  // Group tasks by date and time
  const tasksByDate = useMemo(() => {
    const map = new Map<string, WorkTask[]>();
    tasks.forEach(task => {
      let dateKey = '';

      if (task.task_date) {
        dateKey = task.task_date; 
      } else if (task.scheduled_time && task.scheduled_time.includes('T')) {
         const dateObj = new Date(task.scheduled_time);
         if (!isNaN(dateObj.getTime())) {
            dateKey = format(dateObj, 'yyyy-MM-dd');
         }
      } else if (task.created_at) {
        const dateObj = new Date(task.created_at);
        if (!isNaN(dateObj.getTime())) {
             dateKey = format(dateObj, 'yyyy-MM-dd');
        }
      }

      if (!dateKey) return;

      const existing = map.get(dateKey) || [];
      map.set(dateKey, [...existing, task]);
    });

    // Sort each day's tasks
    map.forEach((dayTasks) => {
        dayTasks.sort((a, b) => {
            const timeA = getTimeValue(a);
            const timeB = getTimeValue(b);
            return timeA - timeB;
        });
    });

    return map;
  }, [tasks]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending_publish': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'failed': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 size={12} />;
      case 'pending_publish': return <Clock size={12} />;
      case 'failed': return <AlertCircle size={12} />;
      default: return <div className="w-3 h-3 rounded-full border-2 border-current" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header Row (Days) */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {weekDays.map(day => {
          const isToday = isSameDay(day, new Date());
          const isSelected = isSameDay(day, selectedDate);
          
          return (
            <div 
              key={day.toISOString()} 
              onClick={() => onDateChange(day)}
              className={cn(
                "p-3 text-center border-r border-gray-200 last:border-r-0 cursor-pointer transition-colors hover:bg-gray-100",
                isSelected && "bg-blue-50/50"
              )}
            >
              <div className={cn(
                "text-xs font-medium uppercase mb-1",
                isToday ? "text-blue-600" : "text-gray-500"
              )}>
                {format(day, 'EEE', { locale: zhTW })}
              </div>
              <div className={cn(
                "w-8 h-8 mx-auto flex items-center justify-center rounded-full text-sm font-bold transition-all",
                isToday 
                  ? "bg-blue-600 text-white shadow-md" 
                  : isSelected 
                    ? "bg-gray-900 text-white" 
                    : "text-gray-900 hover:bg-gray-200"
              )}>
                {format(day, 'd')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 grid grid-cols-7 overflow-y-auto min-h-0 bg-gray-50/30">
        {weekDays.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayTasks = tasksByDate.get(dateKey) || [];
          const isPast = day < new Date(new Date().setHours(0,0,0,0));

          return (
            <div 
              key={dateKey} 
              className={cn(
                "border-r border-gray-200 last:border-r-0 p-2 space-y-2 min-h-[150px]",
                isPast && "bg-gray-50/50"
              )}
            >
              {dayTasks.length > 0 ? (
                dayTasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className={cn(
                      "p-2 rounded-md border text-xs cursor-pointer hover:shadow-md transition-all group relative",
                      getStatusColor(task.status)
                    )}
                  >
                    <div className="flex items-center justify-between mb-1 opacity-80">
                      <span className="font-mono text-[10px]">
                        {task.scheduled_time ? task.scheduled_time.substring(0, 5) : format(new Date(task.created_at || ''), 'HH:mm')}
                      </span>
                      {getStatusIcon(task.status)}
                    </div>
                    <div className="font-medium line-clamp-2 leading-tight">
                      {task.task_type || '未命名任務'}
                    </div>
                    
                    {/* Tooltip */}
                    <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 w-48 bg-gray-900 text-white text-xs p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity">
                      <div className="font-bold mb-1">{task.task_type || '未命名任務'}</div>
                      <div className="opacity-80">{task.content_text || '無描述'}</div>
                      <div className="mt-1 pt-1 border-t border-gray-700 text-[10px] text-gray-400">
                        點擊查看詳情
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-300 opacity-50 select-none">
                  {/* Empty state placeholder */}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
