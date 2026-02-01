
import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Search, User, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface LeaveRecord {
  id: string;
  start_date: string;
  end_date: string;
  leave_type: string;
  profiles: {
    full_name: string;
    email: string;
    role: string;
    avatar_url?: string;
  };
}

const LEAVE_TYPES: Record<string, { label: string, color: string }> = {
  'personal': { label: '自排', color: 'bg-blue-100 text-blue-700' },
  'sick': { label: '事假', color: 'bg-orange-100 text-orange-700' },
  'official': { label: '公假', color: 'bg-green-100 text-green-700' },
};

export default function LeaveStatusPage() {
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date()); // For Calendar Month
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // For Highlight View
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMonthLeaves();
  }, [currentDate]); 

  const fetchMonthLeaves = async () => {
    setIsLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const response = await fetch(`/api/leaves/board?startDate=${startDate}&endDate=${endDate}`);
      const result = await response.json();
      if (result.success) {
        setLeaves(result.data);
      }
    } catch (error) {
      console.error('Error fetching leave board:', error);
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

  // Filter for specific date (Today/Selected)
  const getLeavesForDate = (dateStr: string) => {
    return leaves.filter(l => {
        return l.start_date <= dateStr && l.end_date >= dateStr;
    });
  };

  const selectedDateLeaves = getLeavesForDate(selectedDate).filter(l => 
    l.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.profiles.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 bg-gray-50 border border-gray-100"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = isCurrentMonth && today.getDate() === day;
      const isSelected = selectedDate === dateStr;
      
      const dayLeaves = getLeavesForDate(dateStr);

      days.push(
        <div 
          key={day} 
          onClick={() => setSelectedDate(dateStr)}
          className={`h-32 border border-gray-100 p-2 relative transition-all cursor-pointer hover:bg-gray-50
            ${isSelected ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500 ring-inset z-10' : 'bg-white'}
          `}
        >
          <div className="flex justify-between items-start mb-1">
            <span className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full
              ${isToday ? 'bg-indigo-600 text-white' : 'text-gray-700'}
            `}>
              {day}
            </span>
            {dayLeaves.length > 0 && (
                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-1.5 rounded-full">
                    {dayLeaves.length}
                </span>
            )}
          </div>
          
          <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
            {dayLeaves.map(leave => (
                <div key={leave.id} className={`text-[10px] px-1.5 py-0.5 rounded truncate border
                    ${LEAVE_TYPES[leave.leave_type]?.color || 'bg-gray-100 text-gray-700'}
                    bg-opacity-80 border-opacity-20
                `}>
                    {leave.profiles.full_name}
                </div>
            ))}
          </div>
        </div>
      );
    }
    return days;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="text-indigo-600" />
            休假看板 (月曆總覽)
          </h1>
          <p className="text-gray-500 mt-1">
            點擊日期查看當日詳細休假人員
          </p>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-md text-gray-600">
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-4 font-bold text-gray-900 min-w-[140px] text-center">
                    {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
                </span>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-md text-gray-600">
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
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

      {/* Selected Date Details */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="text-orange-500 w-5 h-5" />
                {selectedDate === new Date().toISOString().split('T')[0] ? '今日' : selectedDate} 休假明細 ({selectedDateLeaves.length})
            </h2>
            <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                    type="text" 
                    placeholder="搜尋姓名..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
        </div>
        
        {isLoading ? (
            <div className="text-center py-12 text-gray-500">載入中...</div>
        ) : selectedDateLeaves.length === 0 ? (
            <div className="bg-green-50 rounded-xl border border-green-100 p-8 text-center text-green-800">
                <p className="font-medium">該日全員到齊！</p>
                <p className="text-sm opacity-80 mt-1">沒有人請假，團隊戰力滿點 💪</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {selectedDateLeaves.map(leave => (
                    <div key={leave.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className={`absolute top-0 left-0 w-1 h-full ${LEAVE_TYPES[leave.leave_type]?.color.split(' ')[0].replace('bg-', 'bg-') || 'bg-gray-400'}`}></div>
                        
                        <div className="flex items-start justify-between mb-3 pl-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 overflow-hidden">
                                    {leave.profiles.avatar_url ? (
                                        <img src={leave.profiles.avatar_url} alt={leave.profiles.full_name} className="w-full h-full object-cover"/>
                                    ) : (
                                        <span className="font-bold">{leave.profiles.full_name.charAt(0)}</span>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{leave.profiles.full_name}</h3>
                                    <p className="text-xs text-gray-500">{leave.profiles.role}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="pl-2">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEAVE_TYPES[leave.leave_type]?.color || 'bg-gray-100'}`}>
                                    {LEAVE_TYPES[leave.leave_type]?.label || leave.leave_type}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-gray-400" />
                                {leave.start_date} ~ {leave.end_date}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}
