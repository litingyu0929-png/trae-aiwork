import React, { useState, useEffect } from 'react';
import { Account } from '../../types';
import { Button } from '../ui/Button';
import { X, CheckCircle, ArrowRight, Shield, User, MessageSquare, AlertTriangle, FileImage } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AccountSetupModalProps {
  account: Account;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const AccountSetupModal: React.FC<AccountSetupModalProps> = ({ account, isOpen, onClose, onComplete }) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignedPersonas, setAssignedPersonas] = useState<any[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('');

  // Fetch assigned personas for the staff
  useEffect(() => {
    if (isOpen && account.assigned_to) {
        const fetchPersonas = async () => {
            const { data, error } = await (supabase as any)
                .from('staff_persona_assignments')
                .select('persona:personas(*)')
                .eq('staff_id', account.assigned_to);
            
            if (data && !error) {
                const personas = data.map((item: any) => item.persona).filter(Boolean);
                setAssignedPersonas(personas);
            }
        };
        fetchPersonas();
    }
  }, [isOpen, account.assigned_to]);

  if (!isOpen) return null;

  const handleBind = async () => {
    setIsSubmitting(true);
    // Simulate OAuth delay
    setTimeout(async () => {
      // Update status to 'setting_persona'
      await supabase.from('accounts').update({ onboarding_status: 'setting_persona' } as any).eq('id', account.id);
      setIsSubmitting(false);
      setStep(2);
    }, 1500);
  };

  const handleSubmit = async () => {
    if (!selectedPersonaId) return;
    setIsSubmitting(true);
    try {
      // Update Account with selected persona using API to bypass RLS
      const res = await fetch(`/api/accounts/${account.id}/bind`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona_id: selectedPersonaId })
      });
      
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Binding failed');

      // Small delay to ensure DB propagation before UI refresh
      await new Promise(resolve => setTimeout(resolve, 500));

      alert('綁定完成！');
      onComplete();
      onClose();
    } catch (error: any) {
      console.error('Setup failed:', error);
      alert('綁定失敗: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] z-[10000]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">帳號綁定與人設配置</h3>
            <p className="text-xs text-gray-500 mt-1">
              {account.platform} - {account.account_name}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Steps Indicator */}
        <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-center gap-4">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-blue-100' : 'bg-gray-100'}`}>1</div>
            <span className="text-sm font-medium">平台綁定</span>
          </div>
          <div className="w-12 h-px bg-gray-200"></div>
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-blue-100' : 'bg-gray-100'}`}>2</div>
            <span className="text-sm font-medium">選擇人設</span>
          </div>
        </div>

        <div className="overflow-y-auto p-8 flex-1">
          {step === 1 ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-6">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-2">
                <Shield size={32} />
              </div>
              <div className="text-center max-w-md">
                <h4 className="text-xl font-bold text-gray-900 mb-2">準備綁定帳號</h4>
                <p className="text-gray-500 text-sm">
                  即將開始帳號與人設的綁定流程。系統將進行連線檢查，驗證通過後即可選擇此帳號所屬的人設角色。
                </p>
              </div>
              
              <Button onClick={handleBind} disabled={isSubmitting} className="w-full max-w-xs h-12 text-base">
                {isSubmitting ? '正在連接...' : `開始綁定流程`}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h4 className="text-lg font-bold text-gray-900">選擇要綁定的人設</h4>
                <p className="text-gray-500 text-sm mt-1">
                  請從您被指派的人設清單中，選擇此帳號所屬的角色。
                </p>
              </div>

              {assignedPersonas.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
                  <p className="text-gray-900 font-medium">您尚未被指派任何人設</p>
                  <p className="text-sm text-gray-500 mt-1">請聯繫管理員為您指派人設後再試。</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {assignedPersonas.map(persona => (
                    <div 
                      key={persona.id}
                      onClick={() => setSelectedPersonaId(persona.id)}
                      className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all hover:shadow-sm
                        ${selectedPersonaId === persona.id 
                          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold mr-4
                        ${selectedPersonaId === persona.id ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {persona.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h5 className={`font-bold ${selectedPersonaId === persona.id ? 'text-blue-900' : 'text-gray-900'}`}>
                          {persona.name}
                        </h5>
                        <p className="text-xs text-gray-500 line-clamp-1">{persona.description || '無描述'}</p>
                      </div>
                      {selectedPersonaId === persona.id && (
                        <CheckCircle className="text-blue-600 w-6 h-6" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-xl flex justify-between items-center">
            {step === 2 && (
                <Button variant="ghost" onClick={() => setStep(1)} disabled={isSubmitting}>
                    上一步
                </Button>
            )}
            <div className="ml-auto flex gap-3">
                <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                    稍後處理
                </Button>
                {step === 2 && (
                    <Button onClick={handleSubmit} disabled={isSubmitting || !selectedPersonaId}>
                        {isSubmitting ? '處理中...' : '確認綁定'}
                    </Button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
