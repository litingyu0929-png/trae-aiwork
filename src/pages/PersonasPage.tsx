import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Loader2, Edit, Trash2, X, Save, User, LayoutGrid, Users, ChevronRight, Instagram, Facebook, Globe } from 'lucide-react';
import { Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useRole } from '@/contexts/RoleContext';
import { AccountDetailsModal } from '@/components/dashboard/AccountDetailsModal';
import { Account } from '@/types';

interface Persona {
  id: string;
  name: string;
  description: string;
  tone: string;
  role_category: string;
  matrix_type: 'traffic' | 'trust' | 'harvesting';
  persona_state: 'newbie' | 'growth' | 'veteran';
  gender: 'male' | 'female' | 'neutral';
  created_at: string;
  assigned_staff?: {
    id: string;
    full_name: string;
    avatar_url: string;
  }[];
  accounts?: Account[];
}

interface PersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Persona>) => Promise<void>;
  persona?: Persona | null;
}

const PersonaModal: React.FC<PersonaModalProps> = ({ isOpen, onClose, onSave, persona }) => {
  const [formData, setFormData] = useState<Partial<Persona>>({
    name: '',
    description: '',
    tone: '',
    role_category: '',
    gender: 'neutral',
    // We will use these local states for the UI fields, 
    // but onSave they need to be packed/handled.
    // For now, let's just keep the description as the main storage,
    // or add temporary fields if we want to show them separately.
  });
  
  // Separate states for the structured fields
  const [identity, setIdentity] = useState('');
  const [voice, setVoice] = useState('');
  const [emotionRules, setEmotionRules] = useState('');
  const [values, setValues] = useState('');
  const [hardLimits, setHardLimits] = useState('');
  const [whyFollow, setWhyFollow] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [referenceUrl, setReferenceUrl] = useState('');
  const [lineId, setLineId] = useState('');
  const [igUsername, setIgUsername] = useState('');
  const [bio, setBio] = useState('');

  // Helper to parse description back to fields if possible
  useEffect(() => {
    if (persona) {
      setFormData({
        name: persona.name,
        description: persona.description,
        tone: persona.tone,
        role_category: persona.role_category,
        gender: persona.gender,
      });
      
      // Auto-populate fields from description if it exists
      if (persona.description) {
        handleContentPaste(persona.description);
      }
    } else {
      setFormData({
        name: '',
        description: '',
        tone: '',
        role_category: '',
        gender: 'neutral',
      });
      setIdentity('');
      setVoice('');
      setEmotionRules('');
      setValues('');
      setHardLimits('');
      setWhyFollow('');
      setReferenceUrl('');
      setLineId('');
      setIgUsername('');
      setBio('');
    }
  }, [persona, isOpen]);

  const handleContentPaste = (val: string) => {
    try {
      // 1. Try JSON Parse
      if (val.trim().startsWith('{')) {
        const json = JSON.parse(val);
        if (json.persona?.name) setFormData(prev => ({ ...prev, name: json.persona.name }));
        if (json.persona?.gender) setFormData(prev => ({ ...prev, gender: json.persona.gender === 'male' ? 'male' : json.persona.gender === 'female' ? 'female' : 'neutral' }));
        
        if (json.one_liner_identity) setIdentity(json.one_liner_identity);
        
        // Voice: Combine tone_summary and speech_style
        let voiceText = json.voice?.tone_summary || '';
        if (json.voice?.speech_style) {
             voiceText += '\n' + JSON.stringify(json.voice.speech_style, null, 2);
        }
        if (voiceText) setVoice(voiceText);

        if (json.emotion_translation_rules) setEmotionRules(typeof json.emotion_translation_rules === 'string' ? json.emotion_translation_rules : JSON.stringify(json.emotion_translation_rules, null, 2));
        if (json.values_anchor) setValues(json.values_anchor);
        if (json.hard_limits) setHardLimits(Array.isArray(json.hard_limits) ? json.hard_limits.join('\n') : json.hard_limits);
        if (json.why_follow) setWhyFollow(json.why_follow);
        if (json.reference_url) setReferenceUrl(json.reference_url);
        if (json.line_id) setLineId(json.line_id);
        if (json.ig_username) setIgUsername(json.ig_username);
        if (json.bio) setBio(json.bio);
        return;
      }

      // 2. Try Markdown/Text Parse (Pattern matching)
      const patterns = [
        { key: 'identity', regex: /### 1️⃣ 身份感（一句話）\s*([\s\S]*?)(?=###|$)/ },
        { key: 'voice', regex: /### 2️⃣ 說話感覺（語氣）\s*([\s\S]*?)(?=###|$)/ },
        { key: 'emotion', regex: /### 3️⃣ 情緒轉譯規則（非常重要）\s*([\s\S]*?)(?=###|$)/ },
        { key: 'values', regex: /### 4️⃣ 價值觀錨點（一句話）\s*([\s\S]*?)(?=###|$)/ },
        { key: 'hardLimits', regex: /### 5️⃣ 永久禁止行為（防漂移硬限制）\s*([\s\S]*?)(?=###|$)/ },
        { key: 'whyFollow', regex: /### 6️⃣ 為什麼值得追蹤（一句話）\s*([\s\S]*?)(?=###|$)/ },
        { key: 'referenceUrl', regex: /### 參考網址\s*([\s\S]*?)(?=###|$)/ },
        { key: 'lineId', regex: /### Line ID\s*([\s\S]*?)(?=###|$)/ },
        { key: 'igUsername', regex: /### IG Username\s*([\s\S]*?)(?=###|$)/ },
        { key: 'bio', regex: /### Bio\s*([\s\S]*?)(?=###|$)/ },
      ];

      patterns.forEach(p => {
        const match = val.match(p.regex);
        if (match && match[1]) {
          const content = match[1].trim();
          if (p.key === 'identity') setIdentity(content);
          if (p.key === 'voice') setVoice(content);
          if (p.key === 'emotion') setEmotionRules(content);
          if (p.key === 'values') setValues(content);
          if (p.key === 'hardLimits') setHardLimits(content);
          if (p.key === 'whyFollow') setWhyFollow(content);
          if (p.key === 'referenceUrl') setReferenceUrl(content);
          if (p.key === 'lineId') setLineId(content);
          if (p.key === 'igUsername') setIgUsername(content);
          if (p.key === 'bio') setBio(content);
        }
      });

      // Try to extract name/gender from the top if they follow "名字：阿豪｜性別：男生"
      const nameGenderMatch = val.match(/名字：\s*([^\s｜]+)\s*｜性別：\s*([^\s]+)/);
      if (nameGenderMatch) {
        setFormData(prev => ({ ...prev, name: nameGenderMatch[1] }));
        const genderStr = nameGenderMatch[2];
        if (genderStr.includes('男')) setFormData(prev => ({ ...prev, gender: 'male' }));
        else if (genderStr.includes('女')) setFormData(prev => ({ ...prev, gender: 'female' }));
      }

    } catch (err) {
      console.error('Parse error:', err);
    }
  };

  const handleJsonPaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    handleContentPaste(val);
  };

  const handleUrlFetch = async () => {
    // Just a placeholder for UI, no action needed as requested
    alert('此欄位僅供記錄參考網址，儲存時會一併保存。');
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Construct the full description from the fields
    const fullDescription = `
### 1️⃣ 身份感（一句話）
${identity}

### 2️⃣ 說話感覺（語氣）
${voice}

### 3️⃣ 情緒轉譯規則（非常重要）
${emotionRules}

### 4️⃣ 價值觀錨點（一句話）
${values}

### 5️⃣ 永久禁止行為（防漂移硬限制）
${hardLimits}

### 6️⃣ 為什麼值得追蹤（一句話）
${whyFollow}

### 參考網址
${referenceUrl}

### Line ID
${lineId}

### IG Username
${igUsername}

### Bio
${bio}
`.trim();

    try {
      await onSave({
        ...formData,
        description: fullDescription
      });
      onClose();
    } catch (error) {
      console.error('Failed to save persona', error);
      alert('儲存失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
          <h3 className="font-bold text-gray-900">
            {persona ? '編輯人設' : '新增人設'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-grow overflow-hidden flex flex-col">
            <div className="flex-grow overflow-y-auto p-6">
                {/* Top Section: Basic Info & Reference */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">人設名稱 (Name)</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name || ''}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="例如：科技宅男小明"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">性別 (Gender)</label>
                                <select
                                    value={formData.gender || 'neutral'}
                                    onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="male">男 (Male)</option>
                                    <option value="female">女 (Female)</option>
                                    <option value="neutral">中性 (Neutral)</option>
                                </select>
                            </div>
                        </div>
                        <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">人設參考網址 (Reference URL)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={referenceUrl}
                                        onChange={e => setReferenceUrl(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                        placeholder="https://instagram.com/..."
                                    />
                                    {/* Removed 'Analyze' button as requested, saving is handled by the main form submit */}
                                </div>
                                <p className="text-xs text-gray-400 mt-1">輸入社群帳號來源網址</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Line ID</label>
                                <input
                                    type="text"
                                    value={lineId}
                                    onChange={e => setLineId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                    placeholder="例如：@yourlineid"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">IG 用戶名稱 (Username)</label>
                                <input
                                    type="text"
                                    value={igUsername}
                                    onChange={e => setIgUsername(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                    placeholder="例如：instagram_user"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bio (簡介)</label>
                                <textarea
                                    rows={3}
                                    value={bio}
                                    onChange={e => setBio(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                    placeholder="輸入人設簡介..."
                                />
                            </div>
                    </div>

                    {/* Quick JSON Import */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">快速匯入 (Paste JSON / Text)</label>
                        <textarea
                            rows={5}
                            value={formData.description || ''}
                            onChange={(e) => {
                                setFormData({ ...formData, description: e.target.value });
                                handleJsonPaste(e);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono bg-gray-50"
                            placeholder="貼上完整的人設描述或 JSON 設定檔，系統將自動填入下方欄位..."
                        />
                    </div>
                </div>

                <div className="border-t border-gray-100 my-4"></div>

                {/* Detailed Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">1️⃣ 身份感 (Identity)</label>
                            <textarea
                                rows={3}
                                value={identity}
                                onChange={e => setIdentity(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="一句話描述這個人是誰..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">3️⃣ 情緒轉譯規則 (Emotion Rules)</label>
                            <textarea
                                rows={4}
                                value={emotionRules}
                                onChange={e => setEmotionRules(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                placeholder="定義將文字轉化為情緒的規則..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">5️⃣ 永久禁止行為 (Hard Limits)</label>
                            <textarea
                                rows={3}
                                value={hardLimits}
                                onChange={e => setHardLimits(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-red-50/30 border-red-100"
                                placeholder="絕對不能做的事情..."
                            />
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">2️⃣ 說話感覺 (Voice/Tone)</label>
                            <textarea
                                rows={3}
                                value={voice}
                                onChange={e => setVoice(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="語氣、口頭禪、說話風格..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">4️⃣ 價值觀錨點 (Values)</label>
                            <textarea
                                rows={3}
                                value={values}
                                onChange={e => setValues(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="核心價值觀與信念..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">6️⃣ 為什麼值得追蹤 (Why Follow)</label>
                            <textarea
                                rows={3}
                                value={whyFollow}
                                onChange={e => setWhyFollow(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50/30 border-blue-100"
                                placeholder="給粉絲一個追蹤的理由..."
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                    取消
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    儲存設定
                </Button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default function PersonasPage() {
  const { currentRole, simulatedStaffId } = useRole();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Staff View State
  const [staffList, setStaffList] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'all' | 'by_staff'>('all');
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [selectedAccountForDetails, setSelectedAccountForDetails] = useState<Account | null>(null);

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram className="w-3 h-3 text-pink-600" />;
      case 'facebook': return <Facebook className="w-3 h-3 text-blue-600" />;
      default: return <Globe className="w-3 h-3 text-gray-500" />;
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // If we are simulating another staff, use that ID, otherwise use real user ID
      const activeUserId = simulatedStaffId || user?.id;
      
      if (currentRole === 'staff' && activeUserId) {
        // Staff: Fetch only assigned personas
        const res = await fetch(`/api/team/mine?user_id=${activeUserId}`);
        const result = await res.json();
        if (result.success) {
          // IMPORTANT: The API returns { assigned_personas: [...], assigned_accounts: [...] }
          // We need to map accounts to personas for the UI to display them
          const rawPersonas = result.data.assigned_personas || [];
          const rawAccounts = result.data.assigned_accounts || [];

          const personasWithAccounts = rawPersonas.map((p: any) => ({
            ...p,
            accounts: rawAccounts.filter((a: any) => a.persona_id === p.id)
          }));

          setPersonas(personasWithAccounts);
        }
        // Staff doesn't need staffList
      } else {
        // Admin/Team Leader: Fetch all personas & staff list
        const resPersonas = await fetch('/api/personas');
        const resultPersonas = await resPersonas.json();
        if (resultPersonas.success) {
          setPersonas(resultPersonas.data);
        }

        const resStaff = await fetch('/api/team');
        const resultStaff = await resStaff.json();
        if (resultStaff.success) {
          setStaffList(resultStaff.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentRole, simulatedStaffId]); // Re-fetch when role or simulation changes

  const handleSave = async (data: Partial<Persona>) => {
    const url = editingPersona 
      ? `/api/personas/${editingPersona.id}`
      : '/api/personas';
    
    const method = editingPersona ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    if (!result.success) throw new Error(result.error);
    
    fetchData(); // Refresh list
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此人設嗎？')) return;
    
    try {
      const res = await fetch(`/api/personas/${id}`, {
        method: 'DELETE'
      });
      const result = await res.json();
      if (result.success) {
        setPersonas(prev => prev.filter(p => p.id !== id));
      } else {
        alert('刪除失敗: ' + result.error);
      }
    } catch (error) {
      console.error('Delete failed', error);
      alert('刪除失敗');
    }
  };

  const handleAssignStaff = async (personaId: string, staffId: string) => {
    try {
        const res = await fetch(`/api/personas/${personaId}/assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ staff_id: staffId === 'unassigned' ? null : staffId })
        });
        
        const result = await res.json();
        if (result.success) {
            // Update local state
            setPersonas(prev => prev.map(p => {
                if (p.id === personaId) {
                    if (staffId === 'unassigned') {
                        return { ...p, assigned_staff: [] };
                    }
                    const staff = staffList.find(s => s.id === staffId);
                    return { ...p, assigned_staff: staff ? [staff] : [] };
                }
                return p;
            }));
            
            // Show simple toast feedback
            const staffName = staffId === 'unassigned' 
                ? '未指派' 
                : staffList.find(s => s.id === staffId)?.full_name || '未知員工';
            
            // We can use a temporary alert or a better toast system if available.
            // For now, let's use a custom floating toast
            const toast = document.createElement('div');
            toast.className = 'fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50 animate-in slide-in-from-bottom-5 fade-in duration-300';
            toast.textContent = `已更新指派：${staffName}`;
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.classList.add('fade-out', 'slide-out-to-bottom-5');
                setTimeout(() => toast.remove(), 300);
            }, 2000);

        } else {
            alert('分配失敗: ' + result.error);
        }
    } catch (error) {
        console.error('Assign failed', error);
        alert('分配失敗');
    }
  };

  const filteredPersonas = personas.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.role_category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (viewMode === 'by_staff' && selectedStaffId) {
        const staff = staffList.find(s => s.id === selectedStaffId);
        // staff.assigned_personas is array of {id, name}
        const assignedIds = staff?.assigned_personas?.map((ap: any) => ap.id) || [];
        return matchesSearch && assignedIds.includes(p.id);
    }
    
    return matchesSearch;
  });

  return (
    <div className="container mx-auto p-6 max-w-[1600px] min-h-screen bg-gray-50/50">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">人設管理中心</h1>
          <p className="text-gray-500">管理 AI 生成內容的虛擬人設與風格設定</p>
        </div>
        <div className="flex items-center gap-3">
            {currentRole !== 'staff' && (
                <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                    <button
                        onClick={() => setViewMode('all')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                            viewMode === 'all' 
                            ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <LayoutGrid size={16} />
                        全部人設
                    </button>
                    <button
                        onClick={() => setViewMode('by_staff')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                            viewMode === 'by_staff' 
                            ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Users size={16} />
                        依員工檢視
                    </button>
                </div>
            )}
            {currentRole !== 'staff' && (
                <button 
                    onClick={() => {
                        setEditingPersona(null);
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    新增人設
                </button>
            )}
        </div>
      </div>

      <div className="flex gap-6 items-start">
        {/* Staff Sidebar (Only visible in by_staff mode) */}
        {viewMode === 'by_staff' && (
            <div className="w-72 flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-24">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">選擇員工</h3>
                </div>
                <div className="divide-y divide-gray-100 max-h-[calc(100vh-250px)] overflow-y-auto">
                    {staffList.map(staff => (
                        <div 
                            key={staff.id}
                            onClick={() => setSelectedStaffId(staff.id)}
                            className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                                selectedStaffId === staff.id 
                                ? 'bg-indigo-50 border-l-4 border-indigo-600' 
                                : 'hover:bg-gray-50 border-l-4 border-transparent'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold overflow-hidden">
                                    {staff.avatar_url ? (
                                        <img src={staff.avatar_url} alt={staff.full_name} className="w-full h-full object-cover" />
                                    ) : (
                                        staff.full_name?.[0] || '?'
                                    )}
                                </div>
                                <div>
                                    <div className={`font-medium ${selectedStaffId === staff.id ? 'text-indigo-900' : 'text-gray-900'}`}>
                                        {staff.full_name || 'Unknown'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {staff.assigned_personas?.length || 0} 個人設
                                    </div>
                                </div>
                            </div>
                            {selectedStaffId === staff.id && <ChevronRight size={16} className="text-indigo-500" />}
                        </div>
                    ))}
                    {staffList.length === 0 && (
                        <div className="p-8 text-center text-gray-400 text-sm">
                            暫無員工資料
                        </div>
                    )}
                </div>
            </div>
        )}

        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="搜尋人設名稱或類別..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
          <div className="flex gap-2">
            <span className="text-sm text-gray-500 flex items-center gap-2">
              <Filter size={16} />
              共 {filteredPersonas.length} 個角色
            </span>
          </div>
        </div>

        {loading ? (
           <div className="flex justify-center items-center py-12 text-gray-500">
             <Loader2 className="animate-spin w-6 h-6 mr-2" />
             載入中...
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">頭像</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">人設名稱</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">性別 / 類別</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">綁定帳號</th>
                  {currentRole !== 'staff' && (
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">負責員工</th>
                  )}
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">描述預覽</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredPersonas.map(persona => (
                  <tr 
                    key={persona.id} 
                    className="hover:bg-gray-50/80 transition-colors group cursor-pointer"
                    onClick={() => {
                        setEditingPersona(persona);
                        setIsModalOpen(true);
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`
                        w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm
                        ${persona.gender === 'female' 
                          ? 'bg-gradient-to-br from-pink-400 to-rose-500' 
                          : persona.gender === 'male'
                            ? 'bg-gradient-to-br from-blue-400 to-indigo-500'
                            : 'bg-gradient-to-br from-gray-400 to-slate-500'
                        }
                      `}>
                        {persona.name?.[0] || '?'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{persona.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">Created {new Date(persona.created_at || Date.now()).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span className={`
                          inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide uppercase
                          ${persona.gender === 'female' ? 'bg-rose-50 text-rose-600' : persona.gender === 'male' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600'}
                        `}>
                          <User size={10} className="stroke-[2.5]" />
                          {persona.gender === 'male' ? 'Male' : persona.gender === 'female' ? 'Female' : 'Neutral'}
                        </span>
                        {persona.role_category && (
                           <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 tracking-wide border border-gray-200">
                             {persona.role_category}
                           </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <div className="flex flex-col gap-1.5">
                          {persona.accounts && persona.accounts.length > 0 ? (
                              persona.accounts.slice(0, 3).map(acc => (
                                  <div 
                                    key={acc.id} 
                                    className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-indigo-600 cursor-pointer transition-colors p-1 -ml-1 rounded hover:bg-gray-100" 
                                    title={acc.account_name}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedAccountForDetails(acc);
                                    }}
                                  >
                                      <div className="p-1 bg-gray-50 rounded-full border border-gray-100">
                                        {getPlatformIcon(acc.platform)}
                                      </div>
                                      <span className="truncate max-w-[120px] font-medium">{acc.account_name}</span>
                                      {acc.status === 'active' ? (
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" title="活躍"></div>
                                      ) : (
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400" title="異常"></div>
                                      )}
                                  </div>
                              ))
                          ) : (
                              <span className="text-gray-400 text-xs italic pl-1">未綁定</span>
                          )}
                          {persona.accounts && persona.accounts.length > 3 && (
                             <div className="text-[10px] text-gray-400 pl-1">+{persona.accounts.length - 3} 更多...</div>
                          )}
                       </div>
                    </td>
                    {currentRole !== 'staff' && (
                        <td className="px-6 py-4 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                            <div className="relative">
                                <select 
                                    className="w-full pl-2 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-gray-50 hover:bg-white transition-colors appearance-none cursor-pointer"
                                    value={persona.assigned_staff?.[0]?.id || 'unassigned'}
                                    onChange={(e) => handleAssignStaff(persona.id, e.target.value)}
                                >
                                    <option value="unassigned" className="text-gray-400">未指派</option>
                                    {staffList.map(staff => (
                                        <option key={staff.id} value={staff.id}>
                                            {staff.full_name}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <ChevronRight size={14} className="rotate-90" />
                                </div>
                            </div>
                        </td>
                    )}
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-500 line-clamp-2 max-w-md">
                        {persona.description || <span className="text-gray-300 italic">暫無描述...</span>}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingPersona(persona);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="編輯"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(persona.id);
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="刪除"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredPersonas.length === 0 && (
               <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white">
                 <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300">
                    <Search size={32} />
                 </div>
                 <p className="text-lg font-medium text-gray-500">沒有找到符合條件的人設</p>
                 <p className="text-sm text-gray-400 mt-1">試著調整搜尋關鍵字</p>
               </div>
            )}
          </div>
        )}
      </div>
      </div>

      <PersonaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        persona={editingPersona}
      />

      {/* Account Details Modal */}
      {selectedAccountForDetails && (
        <AccountDetailsModal 
            account={selectedAccountForDetails}
            isOpen={!!selectedAccountForDetails}
            onClose={() => setSelectedAccountForDetails(null)}
        />
      )}
    </div>
  );
}
