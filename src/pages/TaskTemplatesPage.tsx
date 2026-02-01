import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  SquareKanban, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Save, 
  X,
  Clock,
  AlertCircle,
  MoreVertical,
  CheckCircle2,
  ListTodo
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

// Types
interface TaskTemplate {
  id: string;
  task_type: string;
  time_slot: string;
  priority: number;
  persona_id: string;
  rule: any;
  frequency: string;
  enabled: boolean;
  personas?: { name: string };
}

interface Persona {
  id: string;
  name: string;
}

export default function TaskTemplatesPage() {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    task_type: '',
    time_slot: '09:00',
    priority: 1,
    persona_id: '',
    frequency: 'daily',
    weekly_days: [], // Array of days 0-6 (Sun-Sat) or 1-7
    enabled: true
  });
  
  // SOP Steps State
  // Removed separate sopTitle state, will use formData.task_type
  const [sopSteps, setSopSteps] = useState<{id: number, text: string}[]>([
    { id: 1, text: '步驟一' },
    { id: 2, text: '步驟二' }
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch Templates via API instead of direct Supabase call to avoid type issues
      const response = await fetch('/api/admin/templates');
      const result = await response.json();
      
      if (!result.success) throw new Error(result.error);
      setTemplates(result.data || []);

      // Fetch Personas
      const { data: personasData, error: personasError } = await supabase
        .from('personas')
        .select('id, name');
        
      if (personasError) throw personasError;
      setPersonas(personasData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      alert('載入失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (template?: TaskTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        task_type: template.task_type,
        time_slot: template.time_slot,
        priority: template.priority,
        persona_id: template.persona_id || '',
        frequency: template.frequency,
        weekly_days: template.rule?.weekly_days || [], // Load from rule
        enabled: template.enabled
      });
      
      // Parse rule to UI state
      const rule = template.rule || {};
      // setSopTitle(rule.title || '無標題 SOP'); // Use task_type instead
      setSopSteps(Array.isArray(rule.steps) ? rule.steps : []);
      
    } else {
      setEditingTemplate(null);
      setFormData({
        task_type: '',
        time_slot: '09:00',
        priority: 1,
        persona_id: '',
        frequency: 'daily',
        weekly_days: [],
        enabled: true
      });
      // setSopTitle('新任務 SOP');
      setSopSteps([
        { id: 1, text: '' },
        { id: 2, text: '' }
      ]);
    }
    setIsModalOpen(true);
  };

  const handleAddStep = () => {
    const newId = sopSteps.length > 0 ? Math.max(...sopSteps.map(s => s.id)) + 1 : 1;
    setSopSteps([...sopSteps, { id: newId, text: '' }]);
  };

  const handleDeleteStep = (id: number) => {
    setSopSteps(sopSteps.filter(s => s.id !== id));
  };

  const handleStepChange = (id: number, text: string) => {
    setSopSteps(sopSteps.map(s => s.id === id ? { ...s, text } : s));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Construct rule object from UI state
      const ruleObject = {
        title: formData.task_type, // Use task_type as title
        steps: sopSteps.filter(s => s.text.trim() !== ''), // Filter out empty steps
        weekly_days: formData.frequency === 'weekly_custom' ? formData.weekly_days : []
      };

      const payload = {
        task_type: formData.task_type,
        time_slot: formData.time_slot,
        priority: formData.priority,
        persona_id: formData.persona_id || null,
        frequency: formData.frequency,
        rule: ruleObject,
        enabled: formData.enabled
      };
      
      // ... existing API call ...

      let response;
      if (editingTemplate) {
        // Update
        response = await fetch(`/api/admin/templates/${editingTemplate.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
      } else {
        // Create
        response = await fetch('/api/admin/templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
      }

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving template:', error);
      alert('儲存失敗：' + (error as any).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此 SOP 模板嗎？')) return;
    
    try {
      // Delete
      const response = await fetch(`/api/admin/templates/${id}`, {
          method: 'DELETE'
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      
      fetchData();
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('刪除失敗');
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.task_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.personas?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <SquareKanban className="text-indigo-600" />
            SOP 管理中心
          </h1>
          <p className="text-gray-500 mt-1">
            設定每日自動生成的標準作業程序與任務模板
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          新增 SOP 模板
        </Button>
      </div>

      {/* Search & Stats */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="搜尋 SOP 名稱或人設..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Templates Table */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">載入中...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">執行時間</th>
                  <th className="px-6 py-4 font-medium">SOP 名稱</th>
                  <th className="px-6 py-4 font-medium">綁定人設</th>
                  <th className="px-6 py-4 font-medium">頻率</th>
                  <th className="px-6 py-4 font-medium">優先級</th>
                  <th className="px-6 py-4 font-medium text-center">狀態</th>
                  <th className="px-6 py-4 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTemplates.map((template) => (
                  <tr key={template.id} className={`hover:bg-gray-50 transition-colors ${!template.enabled ? 'opacity-60 bg-gray-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 font-mono text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded w-fit">
                         <Clock className="w-3 h-3" />
                         {template.time_slot}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{template.task_type}</div>
                      <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                        {template.rule?.steps?.length || 0} 個執行步驟
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {template.personas?.name ? (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-md border border-blue-100">
                          {template.personas.name}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs italic">通用</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {template.frequency === 'daily' ? '每日' : 
                       template.frequency === 'weekday' ? '平日' :
                       template.frequency === 'weekend' ? '週末' : template.frequency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <div className="flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${
                             template.priority >= 8 ? 'bg-red-500' : 
                             template.priority >= 5 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}></span>
                          <span className="text-sm font-medium text-gray-700">{template.priority}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                       {template.enabled ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                             啟用
                          </span>
                       ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                             停用
                          </span>
                       )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(template)} 
                          className="p-1.5 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-md transition-colors"
                          title="編輯"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(template.id)} 
                          className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-md transition-colors"
                          title="刪除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredTemplates.length === 0 && (
            <div className="text-center py-16">
              <ListTodo className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <h3 className="text-gray-900 font-medium mb-1">沒有找到符合的 SOP 模板</h3>
              <p className="text-gray-500 text-sm">請嘗試調整搜尋關鍵字或新增一個模板</p>
            </div>
          )}
        </div>
      )}

      {/* Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {editingTemplate ? '編輯 SOP 模板' : '新增 SOP 模板'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-12 gap-6">
                {/* Left Column: Basic Info */}
                <div className="col-span-12 lg:col-span-5 space-y-5">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 border-b pb-1">基本設定</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SOP 名稱</label>
                    <input
                      type="text"
                      required
                      value={formData.task_type}
                      onChange={e => setFormData({...formData, task_type: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="例如：檢查私訊及留言"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">綁定人設 (Persona)</label>
                    <select
                      value={formData.persona_id}
                      onChange={e => setFormData({...formData, persona_id: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="">不指定 (通用)</option>
                      {personas.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">執行時間</label>
                      <input
                        type="time"
                        required
                        value={formData.time_slot}
                        onChange={e => setFormData({...formData, time_slot: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">優先級</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formData.priority}
                        onChange={e => setFormData({...formData, priority: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">執行頻率</label>
                    <select
                      value={formData.frequency}
                      onChange={e => setFormData({...formData, frequency: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="daily">每日 (Daily)</option>
                      <option value="weekday">平日 (Weekday)</option>
                      <option value="weekend">週末 (Weekend)</option>
                      <option value="weekly">每週一次</option>
                      <option value="weekly_custom">自訂週曆 (Custom)</option>
                    </select>
                    
                    {formData.frequency === 'weekly_custom' && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">選擇重複日期</label>
                        <div className="flex flex-wrap gap-2">
                          {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => {
                            const isSelected = formData.weekly_days.includes(index);
                            return (
                              <button
                                key={index}
                                type="button"
                                onClick={() => {
                                  const newDays = isSelected
                                    ? formData.weekly_days.filter(d => d !== index)
                                    : [...formData.weekly_days, index];
                                  setFormData({...formData, weekly_days: newDays});
                                }}
                                className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                                  isSelected 
                                    ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200' 
                                    : 'bg-white text-gray-500 border border-gray-200 hover:border-indigo-300'
                                }`}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          {formData.weekly_days.length > 0 
                            ? `將在每週 ${formData.weekly_days.sort().map(d => ['日','一','二','三','四','五','六'][d]).join('、')} 執行` 
                            : '請至少選擇一天'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="enabled"
                      checked={formData.enabled}
                      onChange={e => setFormData({...formData, enabled: e.target.checked})}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="enabled" className="text-sm font-medium text-gray-700 cursor-pointer select-none">啟用此 SOP 模板</label>
                  </div>
                </div>

                {/* Right Column: Steps */}
                <div className="col-span-12 lg:col-span-7 flex flex-col h-full">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 border-b pb-1">執行步驟 (SOP Steps)</h4>
                  
                  <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 p-4 overflow-y-auto max-h-[400px]">
                    <div className="space-y-3">
                      {sopSteps.map((step, index) => (
                        <div key={step.id} className="group flex items-start gap-2 bg-white p-2 rounded-lg border border-gray-100 shadow-sm hover:border-indigo-200 transition-colors">
                          <span className="flex-none flex items-center justify-center w-6 h-8 text-xs font-bold text-gray-400 bg-gray-50 rounded mt-0.5">
                            {index + 1}
                          </span>
                          <textarea
                            value={step.text}
                            onChange={e => handleStepChange(step.id, e.target.value)}
                            className="flex-1 px-3 py-1.5 border-0 focus:ring-0 text-sm resize-none min-h-[2.5rem] bg-transparent"
                            placeholder={
                              index === 0 ? "例如：打開 Instagram App，檢查私訊收件匣" :
                              index === 1 ? "例如：針對未讀訊息，根據「客服回覆規範」進行初步回覆" :
                              index === 2 ? "例如：若遇到無法處理的客訴，請截圖並標記 @主管" :
                              `請輸入步驟 ${index + 1} 的具體執行內容...`
                            }
                            rows={1}
                            style={{ height: 'auto' }}
                            onInput={(e) => {
                              const target = e.target as HTMLTextAreaElement;
                              target.style.height = 'auto';
                              target.style.height = `${target.scrollHeight}px`;
                            }}
                          />
                          <button 
                            type="button"
                            onClick={() => handleDeleteStep(step.id)}
                            className="flex-none p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                            title="刪除步驟"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <button 
                      type="button" 
                      onClick={handleAddStep}
                      className="w-full mt-4 py-3 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      新增執行步驟
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-400 mt-2 px-1">
                    提示：詳細的步驟說明能幫助 AI 與員工更準確地執行任務。空白的步驟將在儲存時自動過濾。
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? '儲存中...' : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      儲存設定
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}