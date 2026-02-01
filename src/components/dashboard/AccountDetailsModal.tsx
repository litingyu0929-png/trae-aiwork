import React, { useState, useEffect } from 'react';
import { Account } from '../../types';
import { X, Copy, Check, Eye, EyeOff, Shield, Monitor } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AccountDetailsModalProps {
  account: Account;
  isOpen: boolean;
  onClose: () => void;
}

const CopyButton = ({ text, fieldName }: { text: string, fieldName: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        console.log(`Copied ${fieldName}`);
    };

    return (
        <button 
            onClick={handleCopy}
            className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-md transition-colors"
            title="複製"
        >
            {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
        </button>
    );
};

export const AccountDetailsModal: React.FC<AccountDetailsModalProps> = ({ account: initialAccount, isOpen, onClose }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [account, setAccount] = useState<Account>(initialAccount);

  // Auto-refresh account details to ensure persona is loaded
  useEffect(() => {
    if (isOpen && initialAccount.id) {
        setAccount(initialAccount); // Reset first
        
        const fetchDetails = async () => {
            const { data } = await supabase
                .from('accounts')
                .select(`
                    *,
                    persona:personas(id, name)
                `)
                .eq('id', initialAccount.id)
                .single();
            
            if (data) {
                console.log('Refreshed Account Details:', data);
                setAccount(data as Account);
            }
        };
        fetchDetails();
    }
  }, [initialAccount, isOpen]);

  if (!isOpen) return null;

  const credentials = (account.login_credentials as any) || {};

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white
                ${account.platform === 'instagram' ? 'bg-gradient-to-tr from-yellow-400 to-purple-600' : 
                  account.platform === 'tiktok' ? 'bg-black' : 'bg-gray-400'}`}>
                {account.platform?.charAt(0).toUpperCase()}
            </div>
            <div>
                <h3 className="text-xl font-bold text-gray-900">{account.account_name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="capitalize">{account.platform}</span>
                    <span>•</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${account.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {account.status === 'active' ? '活躍中' : '異常/封禁'}
                    </span>
                </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 bg-white overflow-y-auto">
            {/* Form Layout */}
            <div className="grid grid-cols-1 gap-6">
                
                {/* Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">歸屬人設 (Persona)</label>
                        <div className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm">
                            {(() => {
                                const p = (account as any).persona;
                                if (p && typeof p === 'object') {
                                    if (Array.isArray(p) && p.length > 0) return p[0].name;
                                    if (!Array.isArray(p) && p.name) return p.name;
                                }
                                return (account as any).persona_name || '未選擇';
                            })()}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            帳號名稱 <span className="text-red-500">*</span>
                        </label>
                        <div className="relative group">
                            <input 
                                readOnly
                                type="text"
                                value={account.account_name}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none cursor-default"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <CopyButton text={account.account_name} fieldName="account_name" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">帳號 ID / Handle</label>
                        <div className="relative group">
                            <input 
                                readOnly
                                type="text"
                                value={account.account_handle || ''}
                                placeholder="@ username"
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none cursor-default"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <CopyButton text={account.account_handle || ''} fieldName="account_handle" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">密碼</label>
                        <div className="relative group">
                            <input 
                                readOnly
                                type={showPassword ? "text" : "password"}
                                value={credentials.password || ''}
                                placeholder="輸入密碼"
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none cursor-default"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <button
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
                                >
                                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <CopyButton text={credentials.password || ''} fieldName="login_password" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">2FA 金鑰 (Secret Key)</label>
                        <div className="relative group">
                            <input 
                                readOnly
                                type={showPassword ? "text" : "password"}
                                value={credentials['two_factor_secret'] || credentials['2fa_key'] || ''}
                                placeholder="輸入 2FA 金鑰"
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none cursor-default"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                 <button
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
                                >
                                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <CopyButton text={credentials['two_factor_secret'] || credentials['2fa_key'] || ''} fieldName="2fa_key" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subsection: Static IP Data */}
                <div className="pt-4 border-t border-gray-100 mt-2">
                    <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Shield size={16} className="text-indigo-600" />
                        靜態IP登入資料
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-1">
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">登入帳號</label>
                            <div className="relative group">
                                <input 
                                    readOnly
                                    type="text"
                                    value={credentials.username || credentials.proxy_user || ''}
                                    placeholder="輸入登入帳號"
                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none cursor-default"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <CopyButton text={credentials.username || credentials.proxy_user || ''} fieldName="login_username" />
                                </div>
                            </div>
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">密碼</label>
                            <div className="relative group">
                                <input 
                                    readOnly
                                    type={showPassword ? "text" : "password"}
                                    value={credentials.proxy_password || credentials.proxy_pass || ''}
                                    placeholder="輸入密碼"
                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none cursor-default"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                     <button
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <CopyButton text={credentials.proxy_password || credentials.proxy_pass || ''} fieldName="proxy_pass" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">代理端口</label>
                            <div className="relative group">
                                <input 
                                    readOnly
                                    type="text"
                                    value={credentials.proxy_port || ''}
                                    placeholder="8080"
                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none cursor-default"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <CopyButton text={String(credentials.proxy_port || '')} fieldName="proxy_port" />
                                </div>
                            </div>
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">代理 IP</label>
                            <div className="relative group">
                                <input 
                                    readOnly
                                    type="text"
                                    value={credentials.proxy_host || credentials.ip_address || ''}
                                    placeholder="192.168.1.1"
                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none cursor-default"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <CopyButton text={credentials.proxy_host || credentials.ip_address || ''} fieldName="proxy_host" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subsection: Google Account Info */}
                <div className="pt-4 border-t border-gray-100 mt-2">
                    <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Monitor size={16} className="text-red-500" />
                        Google 帳號資訊
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-1">
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Google 帳號</label>
                            <div className="relative group">
                                <input 
                                    readOnly
                                    type="text"
                                    value={credentials.google_email || ''}
                                    placeholder="email@gmail.com"
                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none cursor-default"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <CopyButton text={credentials.google_email || ''} fieldName="google_email" />
                                </div>
                            </div>
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Google 密碼</label>
                            <div className="relative group">
                                <input 
                                    readOnly
                                    type={showPassword ? "text" : "password"}
                                    value={credentials.google_password || ''}
                                    placeholder="密碼"
                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none cursor-default"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                     <button
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <CopyButton text={credentials.google_password || ''} fieldName="google_password" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Google 2FA</label>
                            <div className="relative group">
                                <input 
                                    readOnly
                                    type={showPassword ? "text" : "password"}
                                    value={credentials.google_2fa || ''}
                                    placeholder="Secret Key"
                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none cursor-default"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                     <button
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <CopyButton text={credentials.google_2fa || ''} fieldName="google_2fa" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Line ID</label>
                            <div className="relative group">
                                <input 
                                    readOnly
                                    type="text"
                                    value={credentials.line_id || ''}
                                    placeholder="@id"
                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none cursor-default"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <CopyButton text={credentials.line_id || ''} fieldName="line_id" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
