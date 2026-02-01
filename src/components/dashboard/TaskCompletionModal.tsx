import React, { useState } from 'react';
import { WorkTask } from '../../types';
import { X, Link, FileText, CheckCircle, Save } from 'lucide-react';
import { Button } from '../ui/Button';

interface TaskCompletionModalProps {
  task: WorkTask;
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskId: string, data: { post_url?: string; notes?: string; status?: string }) => Promise<void>;
}

export const TaskCompletionModal: React.FC<TaskCompletionModalProps> = ({ task, isOpen, onClose, onSave }) => {
  const [postUrl, setPostUrl] = useState(task.post_url || '');
  const [notes, setNotes] = useState((task as any).notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const payload = typeof task.payload === 'string' ? JSON.parse(task.payload) : task.payload || {};
  const steps = Array.isArray(payload.steps) ? payload.steps : [];
  const title = payload.title || payload.instruction || '任務詳情';

  if (!isOpen) return null;

  const handleSubmit = async (markAsDone: boolean) => {
    setIsSubmitting(true);
    try {
      await onSave(task.id, {
        post_url: postUrl,
        notes: notes,
        status: markAsDone ? 'completed' : task.status
      });
      onClose();
    } catch (error) {
      console.error('Failed to save task', error);
      alert('儲存失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle className="text-blue-600" size={20} />
              {title}
            </h3>
            {task.task_kind && (
               <span className="text-xs text-gray-500 ml-7 bg-gray-200 px-2 py-0.5 rounded-full">{task.task_kind}</span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Steps Checklist */}
          {steps.length > 0 && (
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-4">
              <h4 className="text-sm font-bold text-indigo-900 mb-2">執行步驟 (SOP Checklist)</h4>
              <ul className="space-y-2">
                {steps.map((step: any, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-indigo-800">
                    <input type="checkbox" className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500" />
                    <span>{step.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Link size={14} className="text-blue-500" />
              證明連結 (Evidence URL)
            </label>
            <input
              type="url"
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
              placeholder="https://instagram.com/p/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <FileText size={14} className="text-orange-500" />
              執行結果 / 備註 (Notes)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="已完成回覆 5 則，成效良好..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <Button variant="outline" onClick={() => handleSubmit(false)} disabled={isSubmitting}>
            <Save size={16} className="mr-2" />
            僅儲存
          </Button>
          <Button 
            onClick={() => handleSubmit(true)} 
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 text-white border-none"
          >
            <CheckCircle size={16} className="mr-2" />
            完成任務
          </Button>
        </div>
      </div>
    </div>
  );
};
