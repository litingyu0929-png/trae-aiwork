import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, ShieldCheck, ShieldAlert, ShieldX, X, Save, Loader2, Edit2, Trash2, CheckCircle, AlertCircle, RefreshCw, Link, Instagram, Youtube, Globe, Smartphone, Monitor } from 'lucide-react';
import { Account, Profile, AccountWithStaff } from '../../types';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Account> | Partial<Account>[]) => Promise<void>;
  account?: AccountWithStaff | null;
  staffList: Profile[];
}

const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-200' },
  { id: 'tiktok', name: 'TikTok', icon: () => <span className="font-bold">Tk</span>, color: 'text-black', bg: 'bg-gray-50', border: 'border-gray-200' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
];

const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose, onSave, account, staffList }) => {
  // If editing, only one platform is active. If creating, multiple can be.
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram']);
  
  // Store form data for each platform: { [platformId]: { ...data } }
  const [formsData, setFormsData] = useState<Record<string, Partial<Account>>>({});
  const [personas, setPersonas] = useState<{ id: string, name: string }[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    const fetchPersonas = async () => {
      const { data } = await supabase.from('personas').select('id, name');
      if (data) setPersonas(data);
    };
    fetchPersonas();
  }, []);

  useEffect(() => {
    if (account) {
      // Edit Mode
      setSelectedPlatforms([account.platform]);
      setFormsData({
        [account.platform]: {
          platform: account.platform,
          account_name: account.account_name,
          account_handle: account.account_handle,
          status: account.status,
          assigned_to: account.assigned_to,
          persona_id: account.persona_id,
          login_credentials: account.login_credentials || {} // Load credentials
        }
      });
    } else {
      // Create Mode - Reset
      if (!isOpen) {
        setSelectedPlatforms(['instagram']);
        setFormsData({});
      }
    }
  }, [account, isOpen]);

  const handlePlatformToggle = (platformId: string) => {
    if (account) return; // Disable toggling in edit mode

    setSelectedPlatforms(prev => {
      const isSelected = prev.includes(platformId);
      if (isSelected) {
        // Don't allow deselecting the last one
        if (prev.length === 1) return prev;
        return prev.filter(p => p !== platformId);
      } else {
        return [...prev, platformId];
      }
    });

    // Initialize data if not exists
    if (!formsData[platformId]) {
      setFormsData((prev: Record<string, Partial<Account>>) => ({
        ...prev,
        [platformId]: {
          platform: platformId as any,
          account_name: '',
          account_handle: '',
          status: 'active',
          assigned_to: '',
          persona_id: null,
          login_credentials: {}
        }
      }));
    }
  };

  const updateFormData = (platformId: string, field: keyof Account, value: any) => {
    setFormsData((prev: Record<string, Partial<Account>>) => ({
      ...prev,
      [platformId]: {
        ...prev[platformId],
        platform: platformId as any,
        [field]: value
      }
    }));
  };
  
  const updateCredentials = (platformId: string, field: string, value: string) => {
    setFormsData((prev: Record<string, Partial<Account>>) => {
        const currentData = prev[platformId] || {};
        const currentCreds = currentData.login_credentials || {};
        
        return {
            ...prev,
            [platformId]: {
                ...currentData,
                login_credentials: {
                    ...currentCreds,
                    [field]: value
                }
            }
        };
    });
  };

  const handleManualSync = () => {
    // Simulate sync
    setLastSyncTime(new Date());
    // In a real app, this might fetch data from platform API
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (account) {
        // Single Update
        const data = formsData[account.platform];
        if (data) await onSave(data);
      } else {
        // Batch Create
        const payload = selectedPlatforms.map(pid => {
          const formData = formsData[pid] || {};
          return {
            ...formData,
            platform: pid as any,
            status: formData.status || 'active',
            account_name: formData.account_name || `${PLATFORMS.find(p => p.id === pid)?.name} Account`, // Default name if empty
            account_url: (formData as any).account_url || null 
          };
        });
        await onSave(payload as any);
      }
      onClose();
    } catch (error: any) {
      console.error('Failed to save account', error);
      alert('儲存失敗: ' + (error.message || '未知錯誤'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">
              {account ? '編輯帳號綁定' : '新增帳號綁定'}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {account ? '修改現有帳號資訊' : '選擇並設定要綁定的社群平台'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-3">
          {/* 1. Platform Selection */}
          <section>
            <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-2">
              <Link className="w-3 h-3 text-indigo-500" />
              1. 選擇平台 (Platform)
            </h4>
            <div className="flex gap-2">
              {PLATFORMS.map(platform => {
                const isSelected = selectedPlatforms.includes(platform.id);
                const Icon = platform.icon;
                return (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => handlePlatformToggle(platform.id)}
                    className={`
                      relative flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all duration-200 w-20
                      ${isSelected 
                        ? `${platform.border} ${platform.bg} ring-1 ring-offset-1 ${platform.color.replace('text-', 'ring-')}` 
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-400 grayscale'
                      }
                      ${account ? 'cursor-default' : 'cursor-pointer'}
                    `}
                  >
                    {isSelected && (
                      <div className="absolute top-1 right-1 text-green-500">
                        <CheckCircle size={12} fill="white" />
                      </div>
                    )}
                    <div className={`mb-1 ${isSelected ? platform.color : 'text-gray-400'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] font-bold ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>
                      {platform.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2. Account Details Inputs */}
          <section>
             <div className="flex justify-between items-end mb-2">
                <h4 className="text-xs font-bold text-gray-700 flex items-center gap-2">
                  <Smartphone className="w-3 h-3 text-indigo-500" />
                  2. 帳號設定 (Settings)
                </h4>
                {lastSyncTime && (
                  <span className="text-[10px] text-gray-400">
                    最後同步: {lastSyncTime.toLocaleTimeString()}
                  </span>
                )}
             </div>
            
            <div className="space-y-3">
              {selectedPlatforms.map(platformId => {
                const platform = PLATFORMS.find(p => p.id === platformId);
                const data = formsData[platformId] || {};
                const Icon = platform?.icon || Globe;

                return (
                  <div key={platformId} className="bg-gray-50 rounded-lg p-3 border border-gray-200 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                      <div className={`p-1 rounded-md ${platform?.bg} ${platform?.color}`}>
                         {/* @ts-ignore */}
                         <Icon size={14} />
                      </div>
                      <span className="font-bold text-xs text-gray-700">{platform?.name}</span>
                      <span className="ml-auto text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                        {data.account_name ? '已填寫' : '未設定'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-0.5">
                          歸屬人設 (Persona)
                        </label>
                        <select
                          value={data.persona_id || ''}
                          onChange={e => updateFormData(platformId, 'persona_id', e.target.value || null)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">未選擇</option>
                          {personas.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-0.5">
                          帳號名稱 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={data.account_name || ''}
                          onChange={e => updateFormData(platformId, 'account_name', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          placeholder="例如：樂樂-IG小號"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-0.5">帳號 ID / Handle</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">@</span>
                          <input
                            type="text"
                            value={data.account_handle || ''}
                            onChange={e => updateFormData(platformId, 'account_handle', e.target.value)}
                            className="w-full pl-7 pr-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            placeholder="username"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-0.5">密碼</label>
                        <input
                          type="text"
                          value={(data.login_credentials as any)?.password || ''}
                          onChange={e => updateCredentials(platformId, 'password', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          placeholder="輸入密碼"
                        />
                      </div>
                      
                      {/* 2FA Key - Moved here */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-0.5">
                          2FA 金鑰 (Secret Key)
                        </label>
                        <input
                          type="text"
                          value={(data.login_credentials as any)?.two_factor_secret || ''}
                          onChange={e => updateCredentials(platformId, 'two_factor_secret', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono"
                          placeholder="輸入 2FA 金鑰"
                        />
                      </div>
                      
                      {/* Login Credentials Section */}
                      <div className="col-span-1 sm:col-span-3 bg-white p-2 rounded-lg border border-gray-200 mt-1">
                        <h5 className="text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-indigo-500" />
                            靜態IP登入資料
                        </h5>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {/* Username/Email/Phone for Login */}
                            <div>
                                <label className="block text-[10px] font-medium text-gray-400 mb-0.5">登入帳號</label>
                                <input
                                    type="text"
                                    value={(data.login_credentials as any)?.username || ''}
                                    onChange={e => updateCredentials(platformId, 'username', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                    placeholder="輸入登入帳號"
                                />
                            </div>
                            
                            {/* Password */}
                            <div>
                                <label className="block text-[10px] font-medium text-gray-400 mb-0.5">密碼</label>
                                <input
                                    type="text" 
                                    value={(data.login_credentials as any)?.proxy_password || ''}
                                    onChange={e => updateCredentials(platformId, 'proxy_password', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                                    placeholder="輸入密碼"
                                />
                            </div>

                            {/* Proxy Port */}
                            <div>
                                <label className="block text-[10px] font-medium text-gray-400 mb-0.5">代理端口</label>
                                <input
                                    type="text"
                                    value={(data.login_credentials as any)?.proxy_port || ''}
                                    onChange={e => updateCredentials(platformId, 'proxy_port', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                                    placeholder="8080"
                                />
                            </div>
                            
                            {/* Proxy IP */}
                            <div>
                                <label className="block text-[10px] font-medium text-gray-400 mb-0.5">代理 IP</label>
                                <input
                                    type="text"
                                    value={(data.login_credentials as any)?.proxy_host || ''}
                                    onChange={e => updateCredentials(platformId, 'proxy_host', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                                    placeholder="192.168.1.1"
                                />
                            </div>
                        </div>
                      </div>

                      {/* Google Account Info Section */}
                      <div className="col-span-1 sm:col-span-3 bg-white p-2 rounded-lg border border-gray-200 mt-1">
                        <h5 className="text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                            <Monitor className="w-3 h-3 text-red-500" />
                            Google 帳號資訊
                        </h5>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {/* Google Email */}
                            <div>
                                <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Google 帳號</label>
                                <input
                                    type="text"
                                    value={(data.login_credentials as any)?.google_email || ''}
                                    onChange={e => updateCredentials(platformId, 'google_email', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                    placeholder="email@gmail.com"
                                />
                            </div>
                            
                            {/* Google Password */}
                            <div>
                                <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Google 密碼</label>
                                <input
                                    type="text" 
                                    value={(data.login_credentials as any)?.google_password || ''}
                                    onChange={e => updateCredentials(platformId, 'google_password', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                                    placeholder="密碼"
                                />
                            </div>

                            {/* Google 2FA */}
                            <div>
                                <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Google 2FA</label>
                                <input
                                    type="text"
                                    value={(data.login_credentials as any)?.google_2fa || ''}
                                    onChange={e => updateCredentials(platformId, 'google_2fa', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                                    placeholder="Secret Key"
                                />
                            </div>
                            
                            {/* Line ID (Optional) */}
                            <div>
                                <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Line ID</label>
                                <input
                                    type="text"
                                    value={(data.login_credentials as any)?.line_id || ''}
                                    onChange={e => updateCredentials(platformId, 'line_id', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                    placeholder="@id"
                                />
                            </div>
                        </div>
                      </div>

                      <div>
                         <label className="block text-xs font-medium text-gray-500 mb-0.5">狀態</label>
                         <select
                           value={data.status || 'active'}
                           onChange={e => updateFormData(platformId, 'status', e.target.value)}
                           className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                         >
                           <option value="active">活躍 (Active)</option>
                           <option value="verification_needed">需驗證</option>
                           <option value="banned">封禁</option>
                         </select>
                      </div>

                      <div>
                         <label className="block text-xs font-medium text-gray-500 mb-0.5">指派員工</label>
                         {data.persona_id ? (
                            <div className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 italic">
                                將自動跟隨人設負責人
                            </div>
                         ) : (
                          <select
                              value={data.assigned_to || ''}
                              onChange={e => updateFormData(platformId, 'assigned_to', e.target.value || null)}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                              <option value="">未指派</option>
                              {staffList.map(s => (
                              <option key={s.id} value={s.id}>{s.full_name}</option>
                              ))}
                          </select>
                         )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-xl flex justify-between items-center">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={handleManualSync}
            className="text-gray-500 hover:text-indigo-600"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            手動同步
          </Button>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              儲存設定
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AccountMatrixView: React.FC<{ 
  staffList: any[], 
  accounts: AccountWithStaff[], 
  personas?: { id: string, name: string }[],
  onRefresh: () => void 
}> = ({ staffList, accounts, personas: initialPersonas, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStaffId, setFilterStaffId] = useState<string>('all'); // New filter state
  const [loading, setLoading] = useState(false); // Controlled by parent essentially, but we can keep for local filtering if needed
  
  // Selection State for Batch Operations
  const [selectedAccountIds, setSelectedAccountIds] = useState<Set<string>>(new Set());
  const [isBatchAssigning, setIsBatchAssigning] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountWithStaff | null>(null);

  // Removed internal fetchData and useEffect

  const handleSave = async (data: Partial<Account> | Partial<Account>[]) => {
    // If array, it's a batch create
    if (Array.isArray(data)) {
      try {
          const promises = data.map(async (item) => {
            const res = await fetch('/api/accounts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item)
            });
            const result = await res.json();
            if (!result.success) throw new Error(result.error);
            return result;
          });
          
          await Promise.all(promises);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Keep delay
          onRefresh();
      } catch (e: any) {
          console.error('Batch create failed:', e);
          alert('批量新增失敗: ' + e.message);
          throw e; // Re-throw to prevent modal closing if caller handles it, but handleSubmit catches it
      }
      return;
    }

    const url = editingAccount 
      ? `/api/accounts/${editingAccount.id}`
      : '/api/accounts';
    
    const method = editingAccount ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    if (!result.success) throw new Error(result.error);
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Increase delay to 1000ms
    onRefresh(); // Refresh list via parent
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此帳號嗎？')) return;
    
    try {
      const res = await fetch(`/api/accounts/${id}`, {
        method: 'DELETE'
      });
      const result = await res.json();
      if (result.success) {
        onRefresh();
      } else {
        alert('刪除失敗: ' + result.error);
      }
    } catch (error) {
      console.error('Delete failed', error);
      alert('刪除失敗');
    }
  };

  const stats = {
    total: accounts.length,
    active: accounts.filter(a => a.status === 'active').length,
    warning: accounts.filter(a => a.status === 'verification_needed').length,
    banned: accounts.filter(a => a.status === 'banned').length,
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = (account.account_name?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (account.account_handle?.toLowerCase().includes(searchTerm.toLowerCase()) || '');

    const matchesStaff = filterStaffId === 'all' 
      ? true 
      : filterStaffId === 'unassigned'
        ? !account.assigned_to
        : account.assigned_to === filterStaffId;

    return matchesSearch && matchesStaff;
  });

  const handleQuickReassign = async (accountId: string, newStaffId: string) => {
    try {
      const res = await fetch(`/api/accounts/${accountId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: newStaffId || null })
      });
      
      const result = await res.json();
      if (result.success) {
        onRefresh(); // Trigger parent refresh (TeamManagementPage)
      } else {
        alert('重新指派失敗: ' + result.error);
      }
    } catch (error) {
      console.error('Reassign failed', error);
      alert('系統錯誤');
    }
  };

  // Batch Operations
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedAccountIds(new Set(filteredAccounts.map(a => a.id)));
    } else {
      setSelectedAccountIds(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedAccountIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleBatchAssign = async (staffId: string) => {
    if (selectedAccountIds.size === 0) return;
    setIsBatchAssigning(true);
    try {
      const promises = Array.from(selectedAccountIds).map(id => 
        fetch(`/api/accounts/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assigned_to: staffId || null })
        })
      );
      
      await Promise.all(promises);
      
      onRefresh();
      setSelectedAccountIds(new Set()); 
      alert(`已成功將 ${selectedAccountIds.size} 個帳號重新指派`);
    } catch (error) {
      console.error('Batch assign error:', error);
      alert('批量指派部分失敗，請重試');
    } finally {
      setIsBatchAssigning(false);
    }
  };

  return (
    <div>
      {/* Top Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex gap-2 w-full md:w-auto">
           {selectedAccountIds.size > 0 ? (
             <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100 animate-in fade-in">
               <span className="text-indigo-700 font-medium text-sm">已選擇 {selectedAccountIds.size} 個項目</span>
               <div className="h-4 w-px bg-indigo-200"></div>
               <select 
                 className="bg-white border-indigo-200 text-sm rounded px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500"
                 onChange={(e) => handleBatchAssign(e.target.value)}
                 disabled={isBatchAssigning}
                 value=""
               >
                 <option value="" disabled>批量指派給...</option>
                 <option value="">(取消指派)</option>
                 {staffList.map(s => (
                   <option key={s.id} value={s.id}>{s.full_name}</option>
                 ))}
               </select>
             </div>
           ) : (
             <div className="flex gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <ShieldCheck className="w-4 h-4 text-green-500" /> 
                  <span>活躍: {stats.active}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <ShieldX className="w-4 h-4 text-red-500" /> 
                  <span>封禁: {stats.banned}</span>
                </div>
             </div>
           )}
        </div>

        <button 
          onClick={() => {
            setEditingAccount(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          新增帳號資源
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="搜尋帳號名稱、ID 或平台..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select 
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filterStaffId}
            onChange={(e) => setFilterStaffId(e.target.value)}
          >
            <option value="all">所有員工</option>
            <option value="unassigned">未指派</option>
            {staffList.map(s => (
              <option key={s.id} value={s.id}>{s.full_name}</option>
            ))}
          </select>
          <select className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="all">所有平台</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
          </select>
        </div>
      </div>

      {/* Card Grid Layout */}
      {loading ? (
        <div className="flex justify-center items-center py-12 text-gray-500">
          <Loader2 className="animate-spin w-6 h-6 mr-2" />
          載入中...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAccounts.map((account) => (
            <div 
              key={account.id} 
              className={`group relative bg-white rounded-xl border transition-all duration-200 hover:shadow-md
                ${selectedAccountIds.has(account.id) ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/10' : 'border-gray-200'}
              `}
            >
              {/* Checkbox (Absolute Top Left) */}
              <div className="absolute top-3 left-3 z-10">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                  checked={selectedAccountIds.has(account.id)}
                  onChange={() => handleSelectOne(account.id)}
                />
              </div>

              {/* Status Badge (Absolute Top Right) */}
              <div className="absolute top-3 right-3">
                {account.status === 'active' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700 border border-green-100">
                    <CheckCircle className="w-3 h-3 mr-1" /> 活躍
                  </span>
                )}
                {account.status === 'banned' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-700 border border-red-100">
                    <ShieldX className="w-3 h-3 mr-1" /> 封禁
                  </span>
                )}
                {account.status === 'verification_needed' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-50 text-yellow-700 border border-yellow-100">
                    <AlertCircle className="w-3 h-3 mr-1" /> 需驗證
                  </span>
                )}
              </div>

              <div className="p-5 pt-8">
                {/* Account Info */}
                <div className="flex flex-col items-center text-center mb-4">
                  {(() => {
                    const platformConfig = PLATFORMS.find(p => p.id === account.platform);
                    const Icon = platformConfig?.icon || Globe;
                    
                    return (
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${platformConfig?.bg || 'bg-gray-100'}`}>
                        <div className={platformConfig?.color || 'text-gray-500'}>
                          {/* @ts-ignore */}
                          <Icon size={24} className="w-6 h-6" />
                        </div>
                      </div>
                    );
                  })()}
                  <h3 className="font-bold text-gray-900 truncate w-full px-2" title={account.account_name}>
                    {account.account_name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-1">@{account.account_handle}</p>
                  
                  {/* Persona Badge */}
                  {account.persona ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-100 mb-1">
                      {account.persona.name}
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400 mb-1 italic">未綁定人設</span>
                  )}

                  {/* Onboarding Status Badge */}
                  {account.assigned_to && account.onboarding_status && account.onboarding_status !== 'completed' && (
                    <div className="mb-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border
                            ${account.onboarding_status === 'notified' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                            account.onboarding_status === 'setting_persona' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            'bg-gray-50 text-gray-600 border-gray-100'
                            }`}>
                            {account.onboarding_status === 'notified' ? '等待綁定' : 
                             account.onboarding_status === 'setting_persona' ? '人設設定中' : '綁定進行中'}
                        </span>
                    </div>
                  )}

                  <span className="text-[10px] uppercase tracking-wider text-gray-400 border px-1.5 rounded bg-gray-50">
                    {account.platform}
                  </span>
                </div>

                {/* Assignment Selector */}
                <div className="mb-4">
                  <label className="text-[10px] font-medium text-gray-400 uppercase mb-1 block">負責人</label>
                  {account.persona ? (
                    <div 
                        className="w-full text-sm bg-gray-100 border border-gray-200 rounded px-2 py-1.5 text-gray-500 cursor-not-allowed flex items-center justify-between"
                        title="此帳號由人設自動管理指派"
                    >
                        <span>{staffList.find(s => s.id === account.assigned_to)?.full_name || '未指派 (人設)'}</span>
                        <span className="text-[10px] text-gray-400 italic">(人設鎖定)</span>
                    </div>
                  ) : (
                    <select 
                        className="w-full text-sm bg-gray-50 border border-gray-200 rounded px-2 py-1.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors cursor-pointer hover:border-gray-300"
                        value={account.assigned_to || ''}
                        onChange={(e) => handleQuickReassign(account.id, e.target.value)}
                    >
                        <option value="">未指派</option>
                        {staffList.map(staff => (
                        <option key={staff.id} value={staff.id}>{staff.full_name}</option>
                        ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Action Footer (The DIV block for buttons) */}
              <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50 rounded-b-xl flex items-center justify-between">
                <button 
                  onClick={() => handleDelete(account.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
                  title="刪除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => {
                    setEditingAccount(account);
                    setIsModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  編輯資料
                </button>
              </div>
            </div>
          ))}
          
          {/* Empty State */}
          {filteredAccounts.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p>沒有找到符合條件的帳號</p>
            </div>
          )}
        </div>
      )}

      <AccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        account={editingAccount}
        staffList={staffList}
      />
    </div>
  );
};
