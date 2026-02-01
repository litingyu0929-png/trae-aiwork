import React, { useState, useEffect } from 'react';
import { Account, Profile } from '../../types';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Loader2, AlertCircle, CheckCircle, ArrowRight, Instagram, Youtube, Globe } from 'lucide-react';
import { AccountSetupModal } from './AccountSetupModal';

interface AccountOnboardingListProps {
  staffId: string;
  onRefresh?: () => void;
}

export const AccountOnboardingList: React.FC<AccountOnboardingListProps> = ({ staffId, onRefresh }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      // Use API instead of direct Supabase client to bypass RLS
      const res = await fetch('/api/accounts');
      const result = await res.json();
      
      if (result.success) {
        // Filter on client side
        const allAccounts = result.data as Account[];
        const filtered = allAccounts.filter(acc => 
            acc.assigned_to === staffId && 
            acc.onboarding_status !== 'completed'
        );
        setAccounts(filtered);
      } else {
        console.error('Failed to fetch accounts:', result.error);
      }
    } catch (error) {
      console.error('Error fetching assigned accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (staffId) {
      fetchAccounts();
    }
  }, [staffId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 className="animate-spin mr-2" /> 載入待辦任務...
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-white rounded-xl border border-dashed border-gray-200 p-12 m-4">
        <CheckCircle className="w-12 h-12 mb-4 text-green-100" />
        <h3 className="text-lg font-medium text-gray-900">太棒了！目前沒有待辦的帳號設定</h3>
        <p className="text-sm mt-1">所有指派給您的帳號都已完成設定。</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <AlertCircle className="text-orange-500" />
            待辦帳號設定 ({accounts.length})
        </h2>
        <p className="text-sm text-gray-500 mt-1">
            請完成以下帳號的平台綁定與人設配置，以開始進行內容運營。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(account => {
            const Icon = account.platform === 'instagram' ? Instagram : 
                         account.platform === 'youtube' ? Youtube : Globe;
            
            return (
                <div key={account.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-50 rounded-lg text-gray-600">
                                <Icon size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 truncate max-w-[150px]" title={account.account_name}>
                                    {account.account_name}
                                </h3>
                                <p className="text-xs text-gray-500 capitalize">{account.platform}</p>
                            </div>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border
                            ${account.onboarding_status === 'notified' ? 'bg-red-50 text-red-600 border-red-100' : 
                              account.onboarding_status === 'binding' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                              'bg-blue-50 text-blue-600 border-blue-100'
                            }`}>
                            {account.onboarding_status === 'notified' ? '待處理' : 
                             account.onboarding_status === 'setting_persona' ? '人設設定中' : '進行中'}
                        </span>
                    </div>
                    
                    <div className="mt-auto pt-4 border-t border-gray-50">
                        <Button 
                            onClick={() => {
                                console.log('Clicking account:', account);
                                setSelectedAccount(account);
                            }} 
                            className="w-full justify-between group"
                        >
                            開始設定
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                </div>
            );
        })}
      </div>

      {selectedAccount && (
        <AccountSetupModal
            account={selectedAccount}
            isOpen={!!selectedAccount}
            onClose={() => setSelectedAccount(null)}
            onComplete={() => {
                setSelectedAccount(null);
                fetchAccounts();
                if (onRefresh) onRefresh();
            }}
        />
      )}
    </div>
  );
};
