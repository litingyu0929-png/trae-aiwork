
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { CheckCircle, XCircle, Calendar, User, ChevronLeft, ChevronRight } from 'lucide-react';

interface LeaveApplication {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  leave_type: string;
  reason: string;
  total_days: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

const LEAVE_TYPES: Record<string, string> = {
  'personal': '自排',
  'sick': '事假',
  'official': '公假',
};

export default function LeaveReviewPage() {
  const { user } = useAuth();
  const [pendingLeaves, setPendingLeaves] = useState<LeaveApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [rejectionModal, setRejectionModal] = useState<{ isOpen: boolean; id: string | null; reason: string }>({
    isOpen: false,
    id: null,
    reason: ''
  });

  useEffect(() => {
    fetchPendingLeaves();
  }, []);

  const fetchPendingLeaves = async () => {
    try {
      const response = await fetch('/api/leaves/pending');
      const result = await response.json();
      if (result.success) {
        setPendingLeaves(result.data);
      }
    } catch (error) {
      console.error('Error fetching pending leaves:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openRejectionModal = (id: string) => {
    setRejectionModal({ isOpen: true, id, reason: '' });
  };

  const closeRejectionModal = () => {
    setRejectionModal({ isOpen: false, id: null, reason: '' });
  };

  const confirmRejection = () => {
    if (rejectionModal.id && rejectionModal.reason.trim()) {
      handleReview(rejectionModal.id, 'rejected', rejectionModal.reason);
      closeRejectionModal();
    } else {
      alert('請輸入駁回原因');
    }
  };

  const handleReview = async (id: string, action: 'approved' | 'rejected', reason?: string) => {
    setProcessingId(id);
    try {
      const response = await fetch(`/api/leaves/${id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: action,
          approved_by: user?.id,
          rejection_reason: reason
        })
      });
      
      const result = await response.json();
      if (result.success) {
        // Remove from list
        setPendingLeaves(prev => prev.filter(l => l.id !== id));
        alert(`已${action === 'approved' ? '核准' : '駁回'}申請`);
      } else {
        alert('操作失敗: ' + result.error);
      }
    } catch (error) {
      console.error('Review error:', error);
      alert('系統錯誤');
    } finally {
      setProcessingId(null);
    }
  };

  // Calendar Logic
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const today = new Date();

    const days = [];
    // Empty cells
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50 border border-gray-100"></div>);
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isSelected = selectedDate === dateStr;
      const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
      
      // Find leaves for this day
      const dayLeaves = pendingLeaves.filter(l => {
        return l.start_date <= dateStr && l.end_date >= dateStr;
      });

      days.push(
        <div 
          key={day} 
          onClick={() => setSelectedDate(isSelected ? null : dateStr)}
          className={`h-24 border border-gray-100 p-2 relative transition-all cursor-pointer hover:bg-gray-50
            ${isSelected ? 'bg-indigo-50 ring-2 ring-indigo-500 ring-inset z-10' : 'bg-white'}
          `}
        >
          <div className="flex justify-between items-start">
            <span className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full
              ${isToday ? 'bg-indigo-600 text-white' : 'text-gray-700'}
            `}>
              {day}
            </span>
            {dayLeaves.length > 0 && (
               <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-bold border border-red-200">
                 {dayLeaves.length} 筆待審
               </span>
            )}
          </div>
          
          <div className="mt-1 space-y-1 overflow-y-auto max-h-[50px] scrollbar-hide">
            {dayLeaves.map(l => (
                <div key={l.id} className="text-[10px] truncate bg-orange-50 text-orange-700 px-1 rounded border border-orange-100">
                    {l.profiles?.full_name}
                </div>
            ))}
          </div>
        </div>
      );
    }
    return days;
  };

  // Filter leaves based on selection
  const displayedLeaves = selectedDate 
    ? pendingLeaves.filter(l => l.start_date <= selectedDate && l.end_date >= selectedDate)
    : pendingLeaves;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CheckCircle className="text-indigo-600" />
            休假審核
          </h1>
          <p className="text-gray-500 mt-1">
            點擊日期查看當日待審核項目
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
            {selectedDate && (
                <Button variant="outline" onClick={() => setSelectedDate(null)}>
                    顯示全部 ({pendingLeaves.length})
                </Button>
            )}
        </div>
      </div>

      {/* Calendar View */}
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

      {/* Review List */}
      <div className="mb-4 flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-900">
              {selectedDate ? `${selectedDate} 待審核項目` : '所有待審核項目'}
          </h2>
          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">
              {displayedLeaves.length}
          </span>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">載入中...</div>
      ) : displayedLeaves.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">無待審核項目</h3>
            <p className="text-gray-500 mt-2">
                {selectedDate ? '該日期沒有待審核的休假申請' : '目前所有申請都已處理完畢'}
            </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
            {displayedLeaves.map(leave => (
                <div key={leave.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:border-indigo-200 transition-colors">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                    {leave.profiles?.full_name?.charAt(0) || <User size={20}/>}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">{leave.profiles?.full_name || '未知員工'}</h4>
                                    <p className="text-xs text-gray-500">{leave.profiles?.email}</p>
                                </div>
                                <span className="ml-auto md:ml-4 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100">
                                    {LEAVE_TYPES[leave.leave_type] || leave.leave_type}
                                </span>
                            </div>
                            
                            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500 block mb-1">休假期間</span>
                                    <span className="font-medium flex items-center gap-2">
                                        <Calendar size={14} className="text-gray-400"/>
                                        {leave.start_date} ~ {leave.end_date}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block mb-1">總天數</span>
                                    <span className="font-bold text-gray-900">{leave.total_days} 天</span>
                                </div>
                            </div>
                            
                            <div className="mt-4 bg-gray-50 p-3 rounded-lg text-sm text-gray-700 border border-gray-100">
                                <span className="text-gray-400 text-xs block mb-1">申請原因：</span>
                                {leave.reason}
                            </div>
                            
                            <div className="mt-2 text-xs text-gray-400">
                                申請時間: {new Date(leave.created_at).toLocaleString()}
                            </div>
                        </div>
                        
                        <div className="flex flex-row md:flex-col justify-center gap-3 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 min-w-[120px]">
                            <Button 
                                className="w-full bg-green-600 hover:bg-green-700"
                                onClick={() => handleReview(leave.id, 'approved')}
                                disabled={!!processingId}
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                核准
                            </Button>
                            <Button 
                                variant="outline"
                                className="w-full text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => openRejectionModal(leave.id)}
                                disabled={!!processingId}
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                駁回
                            </Button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}
      {/* Rejection Modal */}
      {rejectionModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">駁回申請原因</h3>
            <textarea
              autoFocus
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none mb-4"
              rows={4}
              placeholder="請輸入駁回原因..."
              value={rejectionModal.reason}
              onChange={(e) => setRejectionModal(prev => ({ ...prev, reason: e.target.value }))}
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={closeRejectionModal}>取消</Button>
              <Button onClick={confirmRejection} className="bg-red-600 hover:bg-red-700 text-white">
                確認駁回
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
