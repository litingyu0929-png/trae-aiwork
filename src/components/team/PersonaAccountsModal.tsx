import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Eye, EyeOff, Save, Loader2, Link, Globe, Edit2 } from 'lucide-react';
import { Account, Persona, Profile } from '../../types';
import { Button } from '../ui/Button';

interface PersonaAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  persona: Persona;
  staff: Profile | any; // Ideally typed properly
  existingAccounts: Account[];
  onUpdate: () => void;
}

const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', color: 'text-pink-600', bg: 'bg-pink-50' },
  { id: 'threads', name: 'Threads', color: 'text-gray-900', bg: 'bg-gray-100' },
  { id: 'tiktok', name: 'TikTok', color: 'text-black', bg: 'bg-gray-50' },
  { id: 'xiaohongshu', name: '小紅書', color: 'text-red-600', bg: 'bg-red-50' },
  { id: 'youtube', name: 'YouTube', color: 'text-red-600', bg: 'bg-red-50' },
  { id: 'web', name: 'Website', color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'rss', name: 'RSS', color: 'text-orange-600', bg: 'bg-orange-50' },
];

export const PersonaAccountsModal: React.FC<PersonaAccountsModalProps> = ({
  isOpen,
  onClose,
  persona,
  staff,
  existingAccounts,
  onUpdate
}) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // State for new account form
  const [isAdding, setIsAdding] = useState(false);
  const [newAccount, setNewAccount] = useState<Partial<Account>>({
    platform: 'instagram',
    account_name: '',
    account_handle: '',
    status: 'active',
    login_credentials: { password: '' }
  });

  // State for editing account
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Account>>({});

  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      // Filter accounts for this persona
      // Note: existingAccounts passed from parent might be all accounts for the staff, 
      // so we filter by persona_id just in case, though parent should probably pass correct ones.
      const filtered = existingAccounts.filter(a => a.persona_id === persona.id);
      setAccounts(filtered);
      setIsAdding(false);
      setEditingId(null);
    }
  }, [isOpen, existingAccounts, persona.id]);

  if (!isOpen) return null;

  const handleSaveNew = async () => {
    if (!newAccount.account_name) return;
    setIsSaving(true);
    try {
      const payload = {
        ...newAccount,
        assigned_to: staff.id,
        persona_id: persona.id
      };

      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      if (result.success) {
        setAccounts([...accounts, result.data]);
        setIsAdding(false);
        setNewAccount({
          platform: 'instagram',
          account_name: '',
          account_handle: '',
          status: 'active',
          login_credentials: { password: '' }
        });
        onUpdate();
      } else {
        alert('新增失敗: ' + result.error);
      }
    } catch (error) {
      console.error(error);
      alert('系統錯誤');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (id: string) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      
      const result = await res.json();
      if (result.success) {
        setAccounts(accounts.map(a => a.id === id ? result.data : a));
        setEditingId(null);
        onUpdate();
      } else {
        alert('更新失敗: ' + result.error);
      }
    } catch (error) {
      console.error(error);
      alert('系統錯誤');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要移除此綁定嗎？')) return;
    try {
      const res = await fetch(`/api/accounts/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setAccounts(accounts.filter(a => a.id !== id));
        onUpdate();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
              {persona.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                {persona.name}
                <span className="text-xs font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                  @{persona.name}
                </span>
              </h3>
              <p className="text-xs text-gray-500">
                綁定帳號管理 (負責人: {staff.full_name})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          
          {/* List Existing Accounts */}
          <div className="space-y-4 mb-6">
            {accounts.map(acc => {
              const isEditing = editingId === acc.id;
              const platformInfo = PLATFORMS.find(p => p.id === acc.platform);
              
              if (isEditing) {
                return (
                  <div key={acc.id} className="bg-white p-4 rounded-xl border-2 border-indigo-500 shadow-md">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">平台</label>
                        <select 
                          value={editForm.platform} 
                          onChange={e => setEditForm({...editForm, platform: e.target.value as any})}
                          className="w-full text-sm border rounded p-2"
                        >
                          {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">狀態</label>
                        <select 
                          value={editForm.status} 
                          onChange={e => setEditForm({...editForm, status: e.target.value as any})}
                          className="w-full text-sm border rounded p-2"
                        >
                          <option value="active">活躍</option>
                          <option value="verification_needed">需驗證</option>
                          <option value="banned">封禁</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">
                          帳號名稱 (方便內部識別用)
                        </label>
                        <input 
                          value={editForm.account_name} 
                          onChange={e => setEditForm({...editForm, account_name: e.target.value})}
                          className="w-full text-sm border rounded p-2"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">帳號 ID / Handle</label>
                        <input 
                          value={editForm.account_handle || ''} 
                          onChange={e => setEditForm({...editForm, account_handle: e.target.value})}
                          className="w-full text-sm border rounded p-2"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-bold text-gray-500 mb-1 block">密碼 / 憑證</label>
                        <div className="relative">
                          <input 
                            type={showPassword[acc.id] ? "text" : "password"}
                            value={editForm.login_credentials?.password || ''} 
                            onChange={e => setEditForm({
                              ...editForm, 
                              login_credentials: { ...editForm.login_credentials, password: e.target.value }
                            })}
                            className="w-full text-sm border rounded p-2 pr-10"
                            placeholder="輸入密碼..."
                          />
                          <button 
                            type="button"
                            onClick={() => togglePasswordVisibility(acc.id)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword[acc.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>取消</Button>
                      <Button size="sm" onClick={() => handleUpdate(acc.id)} disabled={isSaving}>儲存</Button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={acc.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between group hover:border-indigo-200 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${platformInfo?.bg} ${platformInfo?.color}`}>
                      <Globe size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900">{acc.account_name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                          acc.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                          acc.status === 'banned' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }`}>
                          {acc.status === 'active' ? '活躍' : acc.status === 'banned' ? '封禁' : '需驗證'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mb-2">@{acc.account_handle} • {platformInfo?.name}</div>
                      
                      {/* Password Display (Masked) */}
                      <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded w-fit">
                        <span className="font-mono">
                          {showPassword[acc.id] ? (acc.login_credentials?.password || '未設定密碼') : '••••••••'}
                        </span>
                        <button onClick={() => togglePasswordVisibility(acc.id)} className="hover:text-gray-600">
                          {showPassword[acc.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        setEditingId(acc.id);
                        setEditForm(acc);
                      }}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                    >
                      <Edit2 size={16} /> {/* Note: Ensure Edit2 is imported, currently assuming it is or using generic Edit */}
                    </button>
                    <button 
                      onClick={() => handleDelete(acc.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}

            {accounts.length === 0 && !isAdding && (
              <div className="text-center py-8 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="mb-2">此人設尚未綁定任何社群帳號</p>
                <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
                  <Plus size={14} className="mr-1" />
                  立即綁定
                </Button>
              </div>
            )}
          </div>

          {/* Add New Form */}
          {isAdding && (
            <div className="bg-white p-4 rounded-xl border-2 border-indigo-500 shadow-md animate-in slide-in-from-bottom-2">
              <h4 className="text-sm font-bold text-gray-900 mb-4">新增綁定帳號</h4>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">平台</label>
                  <select 
                    value={newAccount.platform} 
                    onChange={e => setNewAccount({...newAccount, platform: e.target.value as any})}
                    className="w-full text-sm border rounded p-2 bg-gray-50 focus:bg-white"
                  >
                    {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">狀態</label>
                  <select 
                    value={newAccount.status} 
                    onChange={e => setNewAccount({...newAccount, status: e.target.value as any})}
                    className="w-full text-sm border rounded p-2 bg-gray-50 focus:bg-white"
                  >
                    <option value="active">活躍</option>
                    <option value="verification_needed">需驗證</option>
                    <option value="banned">封禁</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">
                    帳號名稱 (方便內部識別用) <span className="text-red-500">*</span>
                  </label>
                  <input 
                    value={newAccount.account_name} 
                    onChange={e => setNewAccount({...newAccount, account_name: e.target.value})}
                    className="w-full text-sm border rounded p-2"
                    placeholder="例如：IG-主帳號、Threads-分身1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">帳號 ID / Handle</label>
                  <input 
                    value={newAccount.account_handle || ''} 
                    onChange={e => setNewAccount({...newAccount, account_handle: e.target.value})}
                    className="w-full text-sm border rounded p-2"
                    placeholder="username"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-500 mb-1 block">密碼 / 憑證</label>
                  <input 
                    type="password"
                    value={newAccount.login_credentials?.password || ''} 
                    onChange={e => setNewAccount({
                      ...newAccount, 
                      login_credentials: { ...newAccount.login_credentials, password: e.target.value }
                    })}
                    className="w-full text-sm border rounded p-2"
                    placeholder="輸入登入密碼..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>取消</Button>
                <Button size="sm" onClick={handleSaveNew} disabled={isSaving}>
                  {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4 mr-1" />}
                  確認新增
                </Button>
              </div>
            </div>
          )}

          {!isAdding && accounts.length > 0 && (
            <button 
              onClick={() => setIsAdding(true)}
              className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 font-medium hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              綁定更多帳號
            </button>
          )}

        </div>
      </div>
    </div>
  );
};
