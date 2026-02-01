import React, { useState, useEffect } from 'react';
import { X, Save, CheckCircle, Calendar, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { WorkTask } from '../../types';

interface SaveToTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  originalContent?: string;
  platform: string;
  accountId: string;
  personaId: string;
}

export const SaveToTaskModal: React.FC<SaveToTaskModalProps> = ({
  isOpen,
  onClose,
  content,
  originalContent,
  platform,
  accountId,
  personaId
}) => {
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('new');
  const [newTaskNote, setNewTaskNote] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchTodaysTasks();
    }
  }, [isOpen, accountId]);

  const fetchTodaysTasks = async () => {
    try {
      // Fetch pending tasks for today for this account
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('work_tasks')
        .select('*')
        .eq('task_date', today)
        // .eq('account_id', accountId) // In a real app, filter by account too
        .neq('status', 'published') // Only show pending tasks
        .order('scheduled_time', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Failed to fetch tasks', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (selectedTaskId === 'new') {
        // Create new task
        const { error } = await supabase
          .from('work_tasks')
          .insert([{
            task_date: new Date().toISOString().split('T')[0],
            account_id: accountId, // We might need a real UUID here if FK enforced
            persona_id: personaId, // Real UUID needed
            content_text: content,
            original_content: originalContent || content, // Store original content
            platform: platform,
            status: 'completed', // Auto complete since we have content? Or 'pending_publish'?
            task_kind: 'content_post',
            task_type: 'content_post',
            notes: newTaskNote || '由內容工廠生成',
            // Mock required fields if FK constraints exist
            // For now assuming the schema allows nulls or we have valid IDs
          }]);
        
        if (error) {
            // Fallback for demo if FK fails: just alert
            alert('儲存失敗 (可能是缺少關聯資料): ' + error.message);
            throw error;
        }
      } else {
        // Update existing task
        const { error } = await supabase
          .from('work_tasks')
          .update({
            content_text: content,
            original_content: originalContent || undefined, // Update only if provided (or keep existing?)
            status: 'completed', // Mark as ready/completed
            completed_at: new Date().toISOString()
          })
          .eq('id', selectedTaskId);

        if (error) throw error;
      }

      // Success
      alert('儲存成功！');
      onClose();

      // Trigger feedback loop if task ID is available (existing task)
      if (selectedTaskId !== 'new') {
        try {
            await fetch(`/api/content/${selectedTaskId}/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    final_content: content
                })
            });
            console.log('Feedback loop triggered successfully');
        } catch (feedbackError) {
            console.warn('Failed to trigger feedback loop', feedbackError);
        }
      }

    } catch (error: any) {
      console.error('Save failed', error);
      // alert('儲存失敗: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl w-full max-w-md p-6 relative shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Save className="w-5 h-5 text-green-600" />
          儲存文案到任務
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              選擇目標任務
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-2">
              <label className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer border border-transparent hover:border-blue-200">
                <input
                  type="radio"
                  name="task"
                  value="new"
                  checked={selectedTaskId === 'new'}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center gap-2">
                  <div className="bg-blue-100 p-1.5 rounded text-blue-600">
                    <Plus size={16} />
                  </div>
                  <span className="font-medium text-gray-900">建立新任務</span>
                </div>
              </label>

              {tasks.map(task => (
                <label key={task.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer border border-transparent hover:border-blue-200">
                  <input
                    type="radio"
                    name="task"
                    value={task.id}
                    checked={selectedTaskId === task.id}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                        {task.scheduled_time?.slice(0, 5) || '無時間'}
                      </span>
                      <span className="font-medium text-gray-900 text-sm">
                        {task.task_kind === 'ops_hype' ? '🔥 炒群帶風向' : 
                         task.task_kind === 'ops_reply' ? '💬 回覆私訊' : 
                         '📝 社群發文'}
                      </span>
                    </div>
                    {task.payload?.instruction && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                        {task.payload.instruction}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {selectedTaskId === 'new' && (
            <div className="animate-in slide-in-from-top-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                任務備註 (選填)
              </label>
              <input
                type="text"
                value={newTaskNote}
                onChange={(e) => setNewTaskNote(e.target.value)}
                placeholder="例如：下午茶分享文"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          )}

          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <h4 className="text-xs font-bold text-gray-500 mb-1 uppercase">即將儲存的內容預覽</h4>
            <p className="text-sm text-gray-700 line-clamp-3">
              {content}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              '儲存中...'
            ) : (
              <>
                <CheckCircle size={16} />
                確認儲存
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
