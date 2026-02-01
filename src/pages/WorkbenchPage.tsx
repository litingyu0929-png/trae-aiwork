import React, { useState, useEffect } from 'react';
import { WorkTask, Profile, Persona } from '../types';
import { useRole } from '../contexts/RoleContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { RefreshCw, Zap, Calendar, LayoutGrid, List, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { AirtableTabs } from '../components/dashboard/airtable/AirtableTabs';
import { AirtableGrid } from '../components/dashboard/airtable/AirtableGrid';
import { TaskCompletionModal } from '../components/dashboard/TaskCompletionModal';
import { WeeklyCalendar } from '../components/scheduler/WeeklyCalendar';
import { addWeeks, subWeeks, format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

export default function WorkbenchPage() {
  const { currentRole, simulatedStaffId } = useRole();
  const { profile: authProfile } = useAuth();
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [accountsMap, setAccountsMap] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<Profile | null>(null);
  const [allStaff, setAllStaff] = useState<Profile[]>([]); // Store all staff for selector
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activePersonaId, setActivePersonaId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  
  // Calendar State
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date()); // Selected Date
  const [calendarViewStart, setCalendarViewStart] = useState(new Date()); // View Start Date
  const [calendarTasks, setCalendarTasks] = useState<WorkTask[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);

  // Modal State
  const [editingTask, setEditingTask] = useState<WorkTask | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initial Fetch Logic
  useEffect(() => {
    const fetchInit = async () => {
        // Fetch Personas for filter
        const { data: personasData } = await supabase.from('personas').select('*');
        if (personasData) setPersonas(personasData);

        // Fetch Staff Logic
        let currentStaff: Profile | null = null;
        
        if (currentRole === 'admin' || currentRole === 'team_leader') {
             // If Admin/Team Leader, fetch ALL staff to populate selector
             const { data: profiles } = await supabase
                 .from('profiles')
                 .select('*')
                 .order('full_name');
             
             if (profiles && profiles.length > 0) {
                 setAllStaff(profiles);
                 // Default to the first staff member if none selected yet
                 // Or if we have a simulatedStaffId (e.g. from context switch), try to use that
                 if (simulatedStaffId) {
                     currentStaff = profiles.find(p => p.id === simulatedStaffId) || profiles[0];
                 } else {
                     // Default to current user if in list, otherwise first
                     currentStaff = profiles.find(p => p.id === authProfile?.id) || profiles[0];
                 }
             }
        } else {
             // Regular Staff Logic
             if (simulatedStaffId) {
                 // Use simulated staff
                 const { data } = await supabase.from('profiles').select('*').eq('id', simulatedStaffId).single();
                 currentStaff = data;
             } else {
                 // Use own profile
                 currentStaff = authProfile;
             }
        }
        
        setStaff(currentStaff || null);
    };
    fetchInit();
  }, [currentRole, simulatedStaffId, authProfile]);

  // Fetch List Data (Today's Runbook)
  const fetchRunbookData = async () => {
    setLoading(true);
    if (staff) {
      try {
        const res = await fetch(`/api/runbook/today?staff_id=${staff.id}&date=${selectedDate}`);
        const result = await res.json();
        
        if (result.success) {
          setTasks(result.data.tasks);
          setAccountsMap(result.data.accounts_map);
          
          if (!activePersonaId && result.data.accounts_map.length > 0) {
            setActivePersonaId(result.data.accounts_map[0].persona_id);
          }
          if (!activePersonaId && result.data.tasks.length > 0) {
             const firstTaskPersona = result.data.tasks[0].persona_id;
             setActivePersonaId(firstTaskPersona);
          }
        } else {
          console.error('Failed to fetch runbook:', result.error);
        }
      } catch (error) {
        console.error('API Error:', error);
      }
    }
    setLoading(false);
  };

  // Fetch Calendar Data (Weekly Tasks)
  const fetchCalendarTasks = async () => {
    setLoading(true);
    try {
      if (!staff) return; // Must have staff

      // Fetch based on calendarViewStart (rolling 7 days)
      // We fetch a bit more buffer (+/- 7 days) to be safe
      const start = new Date(calendarViewStart);
      start.setDate(start.getDate() - 7);
      const end = new Date(calendarViewStart);
      end.setDate(end.getDate() + 14);

      let query = supabase
        .from('work_tasks')
        .select('*')
        .eq('staff_id', staff.id) // IMPORTANT: Filter by staff!
        .gte('task_date', start.toISOString().split('T')[0])
        .lte('task_date', end.toISOString().split('T')[0])
        .order('task_date', { ascending: true })
        .order('scheduled_time', { ascending: true });

      if (activePersonaId && activePersonaId !== 'all') {
        query = query.eq('persona_id', activePersonaId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setCalendarTasks(data || []);
    } catch (error) {
      console.error('Failed to fetch calendar tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'list') {
        fetchRunbookData();
    } else if (viewMode === 'calendar') {
        fetchCalendarTasks();
    }
  }, [selectedDate, staff, viewMode, calendarViewStart, activePersonaId]); // Dependencies updated

  const generateRunbook = async () => {
    if (!staff) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/runbook/generate-daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_id: staff.id, date: selectedDate })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Generation failed');
      }
      
      fetchRunbookData();
      alert('本週任務生成成功！');

    } catch (err: any) {
      console.error('Generation Error:', err);
      alert('生成失敗: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter tasks based on active persona tab (for List View)
  const filteredListTasks = activePersonaId 
    ? tasks
        .filter(t => t.persona_id === activePersonaId)
        .sort((a, b) => (b.priority || 0) - (a.priority || 0)) 
    : [];

  const handleTaskClick = (task: WorkTask) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleTaskSave = async (taskId: string, data: { post_url?: string; notes?: string; status?: string }) => {
    try {
      const response = await fetch(`/api/work_tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        // Update local state based on view mode
        if (viewMode === 'list') {
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...data } : t));
        } else {
            setCalendarTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...data } : t));
        }
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  // Prepare tabs data
  const personaTabs = accountsMap.map(map => ({
      id: map.persona_id,
      name: map.persona?.name || 'Unknown',
      hasNotification: tasks.some(t => t.persona_id === map.persona_id && t.status === 'pending_publish' && new Date(t.scheduled_time || '') < new Date())
  }));

  // Auto-switch tab logic for Admin View
  useEffect(() => {
     if (!loading && personaTabs.length > 0) {
         // If activePersonaId is not in the current tabs (e.g. switched staff), reset it
         const exists = personaTabs.find(t => t.id === activePersonaId);
         if (!exists) {
             setActivePersonaId(personaTabs[0].id);
         }
     } else if (!loading && personaTabs.length === 0) {
         setActivePersonaId(null);
     }
  }, [loading, personaTabs, activePersonaId]);

  const handleWeekChange = (direction: 'prev' | 'next') => {
    setCalendarViewStart(prev => direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1));
  };

  return (
    <div className="h-screen flex flex-col bg-[#F5F6F8]">
      {/* Global Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm z-20">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutGrid className="text-blue-600" size={20} />
            員工工作台
            {allStaff.length > 0 ? (
                <select 
                    className="ml-2 text-sm font-normal text-gray-700 bg-white border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={staff?.id || ''}
                    onChange={(e) => {
                        const selected = allStaff.find(s => s.id === e.target.value);
                        if (selected) setStaff(selected);
                    }}
                >
                    {allStaff.map(s => (
                        <option key={s.id} value={s.id}>
                            {s.full_name || s.email}
                        </option>
                    ))}
                </select>
            ) : (
                staff && (
                    <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200 ml-2">
                        {staff.full_name}
                    </span>
                )
            )}
          </h1>
          
          {/* View Switcher */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
                <List size={14} /> 列表
            </button>
            <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
                <Calendar size={14} /> 行事曆
            </button>
          </div>

          {/* Date Picker (Only for List View) */}
          {viewMode === 'list' && (
            <div className="relative">
                <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="pl-8 pr-2 py-1 text-sm bg-gray-50 border border-gray-200 rounded hover:border-blue-400 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <Calendar className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2" />
            </div>
          )}

          {/* Calendar Navigation (Only for Calendar View) */}
          {viewMode === 'calendar' && (
             <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border border-gray-200">
                <button onClick={() => handleWeekChange('prev')} className="p-1 hover:bg-white rounded text-gray-500"><ChevronLeft size={14} /></button>
                <span className="px-2 text-xs font-medium min-w-[100px] text-center">{format(calendarViewStart, 'yyyy 年 M 月', { locale: zhTW })}</span>
                <button onClick={() => handleWeekChange('next')} className="p-1 hover:bg-white rounded text-gray-500"><ChevronRight size={14} /></button>
                <button onClick={() => {
                    const today = new Date();
                    setCurrentCalendarDate(today);
                    setCalendarViewStart(today);
                }} className="text-xs text-blue-600 px-2 font-medium hover:underline">今天</button>
             </div>
          )}
        </div>

        <div className="flex items-center gap-3">
            {viewMode === 'list' && (
                <button 
                onClick={generateRunbook}
                disabled={loading || !staff}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors shadow-sm"
                >
                {loading ? <RefreshCw className="animate-spin w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                生成本週任務
                </button>
            )}
             {viewMode === 'calendar' && (
                <button 
                onClick={fetchCalendarTasks}
                disabled={loading}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                title="重新整理"
                >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Render Tabs */}
        <AirtableTabs 
        personas={personaTabs} 
        activeId={activePersonaId} 
        onSelect={setActivePersonaId} 
        />

        {/* Content */}
        {loading ? (
           <div className="flex-1 flex items-center justify-center text-gray-400">
              <RefreshCw className="animate-spin mr-2" /> 載入中...
           </div>
        ) : (
          <>
            {viewMode === 'list' && (
                <AirtableGrid 
                    tasks={filteredListTasks} 
                    onTaskClick={handleTaskClick} 
                />
            )}
            
            {viewMode === 'calendar' && (
                <div className="flex-1 p-4 overflow-hidden">
                    <WeeklyCalendar 
                        tasks={calendarTasks}
                        selectedDate={currentCalendarDate}
                        startDate={calendarViewStart}
                        onDateChange={setCurrentCalendarDate}
                        onTaskClick={handleTaskClick}
                    />
                </div>
            )}
          </>
        )}
        
        {/* Task Modal */}
        {editingTask && (
          <TaskCompletionModal
            task={editingTask}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleTaskSave}
          />
        )}
      </div>
    </div>
  );
}