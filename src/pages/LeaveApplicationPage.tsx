import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Calendar as CalendarIcon, Clock, CheckCircle, XCircle, Plus, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface LeaveApplication {
  id: string;
  start_date: string;
  end_date: string;
  leave_type: string;
  reason: string;
  total_days: number;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
}

const LEAVE_TYPES = [
  { value: 'personal', label: '自排' },
  { value: 'sick', label: '事假' },
  { value: 'official', label: '公假' },
];

export default function LeaveApplicationPage() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [leaveType, setLeaveType] = useState('annual');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Constants
  const MONTHLY_OFF_DAYS = 7;

  useEffect(() => {
    if (user) {
      fetchMyLeaves();
    }
  }, [user]);

  const fetchMyLeaves = async () => {
    try {
      const response = await fetch(`/api/leaves/my-leaves?userId=${user?.id}&t=${new Date().getTime()}`);
      
      // Check if response is ok
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server returned ${response.status}: ${text.substring(0, 100)}`);
      }

      const result = await response.json();
      if (result.success) {
        setLeaves(result.data);
      }
    } catch (error) {
      console.error('Error fetching leaves:', error);
      // Optional: set an error state to show in UI
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const handleDateClick = (dateStr: string) => {
    // Only allow selection if modal is open
    if (!isModalOpen) return;

    if (selectedDates.includes(dateStr)) {
      setSelectedDates(prev => prev.filter(d => d !== dateStr));
    } else {
      if (selectedDates.length >= 10) {
        alert('一次最多只能申請 10 天休假');
        return;
      }
      setSelectedDates(prev => [...prev, dateStr].sort());
    }
  };

  const handleOpenModal = () => {
    setSelectedDates([]);
    setLeaveType('annual');
    setReason('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || selectedDates.length === 0) return;
    
    setIsSubmitting(true);
    try {
      // Send the list of selected dates directly. 
      // The backend will group them into contiguous ranges and create multiple records if necessary.
      const response = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          dates: selectedDates,
          leave_type: leaveType,
          reason: reason
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setIsModalOpen(false);
        fetchMyLeaves();
        alert('申請已提交');
      } else {
        alert('提交失敗: ' + result.error);
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('系統錯誤');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    const days = [];
    // Empty cells for days before start of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50 border border-gray-100"></div>);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isSelected = selectedDates.includes(dateStr);
      const isToday = isCurrentMonth && today.getDate() === day;
      
      // Check if this date has any leave status
      const dayLeave = leaves.find(l => {
        const start = new Date(l.start_date);
        const end = new Date(l.end_date);
        const current = new Date(dateStr);
        return current >= start && current <= end; // Simplified check
      });

      let statusColor = '';
      if (dayLeave) {
        if (dayLeave.status === 'approved') statusColor = 'bg-green-100 border-green-200';
        else if (dayLeave.status === 'rejected') statusColor = 'bg-red-50 border-red-100 opacity-50';
        else statusColor = 'bg-orange-50 border-orange-100';
      }

      days.push(
        <div 
          key={day} 
          onClick={() => handleDateClick(dateStr)}
          className={`h-24 border border-gray-100 p-2 relative transition-all
            ${isSelected ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500 ring-inset z-10' : 'bg-white hover:bg-gray-50'}
            ${isModalOpen ? 'cursor-pointer' : ''}
            ${statusColor}
          `}
        >
          <div className="flex justify-between items-start">
            <span className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full
              ${isToday ? 'bg-indigo-600 text-white' : 'text-gray-700'}
            `}>
              {day}
            </span>
            {dayLeave && (
               <span className={`text-[10px] px-1 rounded border
                 ${dayLeave.status === 'approved' ? 'text-green-700 border-green-200 bg-green-50' : 
                   dayLeave.status === 'pending' ? 'text-orange-700 border-orange-200 bg-orange-50' : 'text-red-700 border-red-200 bg-red-50'}
               `}>
                 {dayLeave.status === 'approved' ? '休假' : dayLeave.status === 'pending' ? '審核中' : '駁回'}
               </span>
            )}
          </div>
          
          {dayLeave && (
            <div className="mt-1 space-y-1">
                <div className="text-xs truncate text-gray-500">
                  {LEAVE_TYPES.find(t => t.value === dayLeave.leave_type)?.label}
                </div>
                {dayLeave.status === 'rejected' && dayLeave.rejection_reason && (
                    <div className="text-[10px] text-red-600 bg-red-50 p-1 rounded border border-red-100 truncate" title={dayLeave.rejection_reason}>
                        駁回原因: {dayLeave.rejection_reason}
                    </div>
                )}
            </div>
          )}
          
          {isSelected && (
            <div className="absolute bottom-2 right-2">
              <CheckCircle className="w-4 h-4 text-indigo-600" />
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  // Stats calculation
  const currentMonthLeaves = leaves.filter(l => {
    const d = new Date(l.start_date);
    return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear() && l.status === 'approved';
  }).reduce((acc, curr) => acc + curr.total_days, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="text-indigo-600" />
            休假申請 (月曆模式)
          </h1>
          <p className="text-gray-500 mt-1">
            本月休假額度: {MONTHLY_OFF_DAYS} 天 | 已排休: {currentMonthLeaves} 天 | 剩餘: {Math.max(0, MONTHLY_OFF_DAYS - currentMonthLeaves)} 天
          </p>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-md text-gray-600">
                    <ChevronLeft size={20} />
                </button>
                <span className="px-4 font-bold text-gray-900 min-w-[140px] text-center">
                    {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
                </span>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-md text-gray-600">
                    <ChevronRight size={20} />
                </button>
            </div>
            
            <Button onClick={handleOpenModal} disabled={isModalOpen}>
                <Plus className="w-4 h-4 mr-2" />
                開始排休
            </Button>
        </div>
      </div>

      {/* Helper Banner when scheduling */}
      {isModalOpen && (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 px-4 py-3 rounded-xl mb-6 flex items-center justify-between animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-2 rounded-full">
                    <CalendarIcon size={20} className="text-indigo-600" />
                </div>
                <div>
                    <p className="font-bold">正在排休模式</p>
                    <p className="text-sm opacity-80">請直接點擊下方月曆日期進行選擇（可多選），完成後點擊右側表單提交。</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-sm font-medium">已選擇</p>
                <p className="text-2xl font-bold">{selectedDates.length} <span className="text-sm font-normal">天</span></p>
            </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar Grid */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                {['週日', '週一', '週二', '週三', '週四', '週五', '週六'].map(d => (
                    <div key={d} className="py-3 text-center text-sm font-medium text-gray-500">
                        {d}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7">
                {renderCalendar()}
            </div>
        </div>

        {/* Sidebar / Form */}
        {isModalOpen && (
            <div className="w-full lg:w-80 shrink-0">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sticky top-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-gray-900">確認休假申請</h3>
                        <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">已選日期</label>
                            <div className="min-h-[40px] p-3 bg-gray-50 rounded-lg text-sm text-gray-600 max-h-[150px] overflow-y-auto">
                                {selectedDates.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedDates.sort().map(date => (
                                            <span key={date} className="bg-white border border-gray-200 px-2 py-1 rounded text-xs">
                                                {date}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-gray-400 italic">請點擊左側日期...</span>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">休假類型</label>
                            <div className="grid grid-cols-3 gap-2">
                                {LEAVE_TYPES.map(type => (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => setLeaveType(type.value)}
                                        className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all ${
                                            leaveType === type.value
                                                ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm'
                                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">申請原因</label>
                            <textarea 
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="請說明休假原因... (選填)"
                            />
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-gray-600">總計天數</span>
                                <span className="text-xl font-bold text-indigo-600">{selectedDates.length} 天</span>
                            </div>
                            <Button type="submit" className="w-full" disabled={isSubmitting || selectedDates.length === 0}>
                                {isSubmitting ? '提交中...' : '送出申請'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}