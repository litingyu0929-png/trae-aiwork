import React, { useState } from 'react';
import { WorkTask } from '../../types';
import { CheckCircle, AlertCircle, Clock, Send, MessageSquare, Zap, TrendingUp, BarChart2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface OpsTaskCardProps {
  task: WorkTask;
  onComplete: (id: string) => void;
}

export const OpsTaskCard: React.FC<OpsTaskCardProps> = ({ task, onComplete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [inboundCount, setInboundCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getIcon = () => {
    switch (task.task_kind) {
      case 'ops_reply': return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'ops_hype': return <Zap className="w-5 h-5 text-yellow-500" />;
      case 'ops_intercept': return <TrendingUp className="w-5 h-5 text-orange-500" />;
      case 'ops_report': return <BarChart2 className="w-5 h-5 text-purple-500" />;
      default: return <CheckCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTitle = () => {
    switch (task.task_kind) {
      case 'ops_reply': return '回覆與私訊';
      case 'ops_hype': return '炒群與帶單';
      case 'ops_intercept': return '流量截擊';
      case 'ops_report': return '日結報表';
      case 'ops_warmup': return '暖號';
      case 'ops_admin': return '開工儀式';
      case 'ops_predict': return '賽事預測';
      case 'ops_script_kill': return '劇情殺製作';
      case 'ops_redirect': return '跨平台導流';
      default: return 'Ops 任務';
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 1. Log completion
      await supabase.from('work_task_logs').insert({
        task_id: task.id,
        staff_id: task.staff_id,
        result_status: 'done',
        evidence_url: evidenceUrl,
        notes: notes,
        counts: { inbound_count: inboundCount }
      });

      // 2. Update task status
      await supabase.from('work_tasks').update({
        status: 'completed',
        completed_at: new Date().toISOString()
      }).eq('id', task.id);

      onComplete(task.id);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error completing task:', error);
      alert('提交失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full">
        <div>
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gray-50 rounded-lg">
                {getIcon()}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{getTitle()}</h3>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock size={12} /> {task.scheduled_time?.slice(0, 5) || 'Anytime'}
                </span>
              </div>
            </div>
            {task.priority && task.priority > 0 && (
              <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-bold">高優先級</span>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm text-gray-700">
            <p className="font-medium mb-1">指令：</p>
            {task.payload?.instruction}
          </div>

          {task.account?.account_name && (
             <p className="text-xs text-gray-500 mb-2">
               Target: <span className="font-medium text-gray-700">{task.account.account_name}</span>
             </p>
          )}
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full mt-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <CheckCircle size={16} /> 完成任務
        </button>
      </div>

      {/* Completion Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">回報任務結果</h3>
            
            <div className="space-y-4">
              {task.task_kind === 'ops_report' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">今日進線數 (Inbound)</label>
                  <input
                    type="number"
                    value={inboundCount}
                    onChange={(e) => setInboundCount(parseInt(e.target.value))}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">備註 / 執行狀況</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border rounded-lg p-2 h-24 resize-none"
                  placeholder="遇到的問題或觀察..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">證明連結 (選填)</label>
                <input
                  type="text"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  className="w-full border rounded-lg p-2"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSubmitting ? '提交中...' : '確認完成'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
