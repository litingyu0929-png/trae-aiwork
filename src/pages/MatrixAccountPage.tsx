import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AccountMatrixView } from '../components/matrix/AccountMatrixView';
import { LayoutGrid, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { AccountWithStaff, Persona } from '../types';

interface Staff {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'team_leader' | 'staff';
  staff_type: 'specialist' | 'operator' | 'closer';
  avatar_url?: string;
  assigned_personas?: Persona[];
  assigned_accounts?: AccountWithStaff[];
  created_at: string;
}

export default function MatrixAccountPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [allAccounts, setAllAccounts] = useState<AccountWithStaff[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      
      // 1. Fetch Staff
      const staffRes = await fetch(`/api/team?t=${new Date().getTime()}`);
      if (!staffRes.ok) {
        const errText = await staffRes.text();
        throw new Error(`Staff API ${staffRes.status}: ${errText.substring(0, 50)}`);
      }
      const staffResult = await staffRes.json();
      const staffs = staffResult.success ? staffResult.data : [];
      setStaffList(staffs);

      // 2. Fetch Accounts
      const accountsRes = await fetch(`/api/accounts?t=${new Date().getTime()}`);
      if (!accountsRes.ok) {
        const errText = await accountsRes.text();
        throw new Error(`Accounts API ${accountsRes.status}: ${errText.substring(0, 50)}`);
      }
      const accountsResult = await accountsRes.json();
      const accountsData = accountsResult.success ? accountsResult.data : [];
      setAllAccounts(accountsData);

      // 3. Fetch Personas
      const { data: personasData, error: personasError } = await supabase.from('personas').select('*');
      if (personasError) throw new Error(`Personas DB: ${personasError.message}`);
      setPersonas(personasData || []);

    } catch (error: any) {
      console.error('Error fetching matrix data:', error);
      const errorMsg = error?.message || '未知錯誤';
      setFetchError(`無法載入資料 [${errorMsg}]，請檢查伺服器連線。`);
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    try {
        const res = await fetch('/api/health');
        const text = await res.text();
        alert(`Connection Status: ${res.status}\nResult: ${text}`);
    } catch (e: any) {
        alert(`Connection Failed: ${e.message}`);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutGrid className="text-indigo-600" />
            矩陣帳號管理
          </h1>
          <p className="text-gray-500 mt-1">
            集中管理所有社群平台帳號、監控狀態與人設綁定
          </p>
        </div>
        <Button 
            variant="outline" 
            onClick={fetchData}
            disabled={isLoading}
        >
            重新整理
        </Button>
      </div>

      {fetchError && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 flex items-center gap-2 border border-red-200">
            <AlertCircle className="w-5 h-5" />
            {fetchError}
            <Button size="sm" variant="outline" onClick={testConnection} className="ml-2 bg-white hover:bg-blue-50 border-blue-200 text-blue-700">
                測試連線
            </Button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <AccountMatrixView 
            staffList={staffList} 
            accounts={allAccounts} 
            personas={personas}
            onRefresh={fetchData} 
        />
      </div>
    </div>
  );
}
