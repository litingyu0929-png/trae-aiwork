import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  Search, 
  UserPlus, 
  Download,
  Filter,
  Shield,
  Briefcase,
  UserCog,
  CheckCircle,
  X,
  ChevronRight,
  ChevronDown,
  Instagram,
  Facebook,
  Globe,
  AlertCircle,
  LayoutGrid,
  List,
  Edit2,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useRole } from '../contexts/RoleContext';
import { AccountMatrixView } from '../components/matrix/AccountMatrixView';
import { PersonaAccountsModal } from '../components/team/PersonaAccountsModal';
import { AccountOnboardingList } from '../components/dashboard/AccountOnboardingList';
import { AccountDetailsModal } from '../components/dashboard/AccountDetailsModal';
import { Account, Persona, Profile, AccountWithStaff } from '../types';

interface Staff {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'team_leader' | 'staff';
  staff_type: 'specialist' | 'operator' | 'closer';
  avatar_url?: string;
  assigned_personas?: Persona[];
  assigned_accounts?: AccountWithStaff[]; // Updated to AccountWithStaff
  created_at: string;
}

export default function TeamManagementPage() {
  const { currentRole, simulatedStaffId } = useRole();
  const [currentUser, setCurrentUser] = useState<Staff | null>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [allAccounts, setAllAccounts] = useState<AccountWithStaff[]>([]); // New State
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'members' | 'matrix'>('members');
  
  // Expanded Rows State
  const [expandedStaffIds, setExpandedStaffIds] = useState<Set<string>>(new Set());
  
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

  const togglePassword = (accId: string) => {
      setShowPassword(prev => ({
          ...prev,
          [accId]: !prev[accId]
      }));
  };

 // Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isEditStaffModalOpen, setIsEditStaffModalOpen] = useState(false);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false); // New
  const [isPersonaAccountsModalOpen, setIsPersonaAccountsModalOpen] = useState(false);
  const [selectedPersonaForAccounts, setSelectedPersonaForAccounts] = useState<{persona: Persona, staff: Staff} | null>(null);
  
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedPersonaIds, setSelectedPersonaIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // Password Reset State
  const [resetPassword, setResetPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Account Details Modal State
  const [selectedAccountForDetails, setSelectedAccountForDetails] = useState<Account | null>(null);

  const handleOpenPersonaAccounts = (persona: Persona, staff: Staff) => {
    setSelectedPersonaForAccounts({ persona, staff });
    setIsPersonaAccountsModalOpen(true);
  };

  // Constants
  const STAFF_TYPE_MAP: Record<string, string> = {
    closer: '收割大神',
    operator: '流量大神',
    specialist: '技術專家'
  };

  const STAFF_TYPE_OPTIONS = [
    { value: 'closer', label: '收割大神 (Closer)' },
    { value: 'operator', label: '流量大神 (Operator)' },
    { value: 'specialist', label: '技術專家 (Specialist)' }
  ];
  
  // Stats Calculation
  const stats = {
    totalStaff: staffList.length,
    activePersonas: personas.length,
    totalAccounts: allAccounts.length,
    activeAccounts: allAccounts.filter(a => a.status === 'active').length,
    pendingAccounts: allAccounts.filter(a => a.onboarding_status !== 'completed').length
  };

  const fetchMyAssignments = async (userId: string) => {
    try {
        const res = await fetch(`/api/team/mine?user_id=${userId}&t=${new Date().getTime()}`, {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        const result = await res.json();
        if (result.success) {
            setCurrentUser(result.data.profile); // Update profile info
            // Construct a "Staff" object that mimics the admin view structure but for single user
            const myStaffProfile: Staff = {
                ...result.data.profile,
                assigned_personas: result.data.assigned_personas || [], // Ensure array
                assigned_accounts: result.data.assigned_accounts || []   // Ensure array
            };
            setStaffList([myStaffProfile]); // Put in list for consistent rendering if needed, or just use currentUser
            setSelectedStaff(myStaffProfile); // Reuse selectedStaff for detail view
        }
    } catch (e) {
        console.error('Error fetching my assignments:', e);
    } finally {
        setIsLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    setIsLoading(true);
    try {
        let userId = '';

        if (currentRole === 'staff' && simulatedStaffId) {
            userId = simulatedStaffId;
        } else {
            // 1. Try to get real auth user
            const { data: { user } } = await supabase.auth.getUser();
            userId = user?.id || '';

            // 2. Fallback: Get first profile with 'staff' role (for dev/demo)
            if (!userId) {
                const { data: profile } = await supabase.from('profiles').select('id').eq('role', 'staff').limit(1).single();
                userId = profile?.id || '';
            }
        }

        if (userId) {
            fetchMyAssignments(userId);
        } else {
            // No staff user found
            setIsLoading(false);
        }
    } catch (e) {
        console.error(e);
        setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentRole === 'staff') {
        fetchCurrentUser();
    } else {
        fetchData();
    }
  }, [activeTab, currentRole, simulatedStaffId]);

  // Realtime subscription for staff
  useEffect(() => {
    if (currentRole !== 'staff' || !currentUser) return;

    const channel = supabase
      .channel('staff-assignments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'staff_persona_assignments',
          filter: `staff_id=eq.${currentUser.id}`
        },
        () => {
          console.log('Assignment updated, refreshing...');
          fetchMyAssignments(currentUser.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentRole, currentUser]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      
      // 1. Fetch Staff (Profiles)
      // Note: assigned_personas are already included from API
      const staffRes = await fetch(`/api/team?t=${new Date().getTime()}`, {
          headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (!staffRes.ok) {
          const errText = await staffRes.text();
          throw new Error(`Staff API ${staffRes.status}: ${errText.substring(0, 50)}`);
      }
      
      const staffResult = await staffRes.json();
      
      if (staffResult.success) {
        let staffs = staffResult.data as Staff[];
        
        // 2. Fetch Accounts (From API to bypass RLS)
        // We fetch ALL accounts to map them to staff locally
        const accountsRes = await fetch(`/api/accounts?t=${new Date().getTime()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (!accountsRes.ok) {
            const errText = await accountsRes.text();
            throw new Error(`Accounts API ${accountsRes.status}: ${errText.substring(0, 50)}`);
        }
        
        const accountsResult = await accountsRes.json();
        const accountsData = accountsResult.success ? accountsResult.data : [];
        console.log('Fetched Accounts:', accountsData.length, accountsData); // Debug log
        setAllAccounts(accountsData); // Set accounts state

        // Re-map to attach accounts to staff
        staffs = staffs.map(staff => {
           // Filter accounts where assigned_to matches the current staff ID
           // Note: API returns assigned_to as a string ID
           const myAccounts = accountsData?.filter((acc: any) => acc.assigned_to === staff.id) || [];

           return {
             ...staff,
             // Use the personas returned by the API (ensure array)
             assigned_personas: staff.assigned_personas || [],
             // Attach the fresh accounts list
             assigned_accounts: myAccounts
           };
        });

        setStaffList(staffs);
      }

      // Fetch Personas for assignment dropdown
      const { data: personasData, error: personasError } = await supabase.from('personas').select('*');
      if (personasError) throw new Error(`Supabase Error: ${personasError.message}`);
      setPersonas(personasData || []);

    } catch (error: any) {
      console.error('Error fetching team data:', error);
      // Show more detailed error message
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

  const toggleRow = (staffId: string) => {
    setExpandedStaffIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(staffId)) {
        newSet.delete(staffId);
      } else {
        newSet.add(staffId);
      }
      return newSet;
    });
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram className="w-3 h-3 text-pink-600" />;
      case 'facebook': return <Facebook className="w-3 h-3 text-blue-600" />;
      default: return <Globe className="w-3 h-3 text-gray-500" />;
    }
  };

  const handleOpenAssignModal = (staff: Staff) => {
    setSelectedStaff(staff);
    setSelectedPersonaIds(staff.assigned_personas?.map(p => p.id) || []);
    setIsAssignModalOpen(true);
  };

  const handleTogglePersona = (personaId: string) => {
    setSelectedPersonaIds(prev => 
      prev.includes(personaId) 
        ? prev.filter(id => id !== personaId)
        : [...prev, personaId]
    );
  };

  const handleOpenEditStaffModal = (staff: Staff) => {
    setSelectedStaff(staff);
    setIsEditStaffModalOpen(true);
  };

  const handleUpdateStaff = async (updates: Partial<Staff>) => {
    if (!selectedStaff) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/team/${selectedStaff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const result = await response.json();
      if (result.success) {
        setIsEditStaffModalOpen(false);
        fetchData();
      } else {
        alert('更新失敗: ' + result.error);
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('系統錯誤');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('確定要刪除此成員嗎？此操作將移除其所有權限與指派，且無法復原。')) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/team/${staffId}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (result.success) {
        setIsEditStaffModalOpen(false);
        fetchData(); // Refresh list, which updates Matrix too
        alert('成員已刪除');
      } else {
        alert('刪除失敗: ' + result.error);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('系統錯誤');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAssignment = async () => {
    if (!selectedStaff) return;
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/team/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: selectedStaff.id,
          persona_ids: selectedPersonaIds,
          assigned_by: 'current_user_id_placeholder' 
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setIsAssignModalOpen(false);
        // Force refresh by toggling a dummy state or re-calling fetchData
        await fetchData(); 
      } else {
        alert('指派失敗: ' + result.error);
      }
    } catch (error) {
      console.error('Assignment error:', error);
      alert('系統錯誤');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['姓名,Email,角色,職位類型,指派人設,加入時間'];
    const rows = filteredStaff.map(s => [
      s.full_name,
      s.email,
      s.role === 'team_leader' ? '組長' : s.role === 'admin' ? '管理員' : '員工',
      s.staff_type,
      `"${s.assigned_personas?.map(p => p.name).join(', ') || '無'}"`,
      new Date(s.created_at).toLocaleDateString()
    ].join(','));
    
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `team_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Filter Logic
  const filteredStaff = staffList.filter(staff => {
    // Add safe checks for full_name and email
    const name = staff.full_name || '';
    const email = staff.email || '';
    
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || staff.role === roleFilter;
    
    // RBAC: Team Leader can only see staff, Admin sees all
    const hasAccess = currentRole === 'admin' || (currentRole === 'team_leader' && staff.role === 'staff');
    
    return matchesSearch && matchesRole && hasAccess;
  });

  const [isProxyModalOpen, setIsProxyModalOpen] = useState(false);
  const [proxyTargetStaff, setProxyTargetStaff] = useState<Staff[]>([]);
  const { setSimulatedStaffId } = useRole();

  const handleOpenProxyModal = async () => {
    setIsProxyModalOpen(true);
    // Fetch all staff for selection
    try {
        const res = await fetch('/api/team');
        const result = await res.json();
        if (result.success) {
            setProxyTargetStaff(result.data);
        }
    } catch (e) {
        console.error('Failed to fetch staff for proxy:', e);
    }
  };

  const handleBindProxy = async (targetStaffId: string) => {
    try {
        // 1. Log the binding
        await fetch('/api/team/proxy-bind', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                proxy_user_id: currentUser?.id, // Current logged in user
                target_user_id: targetStaffId
            })
        });

        // 2. Update local view (Simulate)
        setSimulatedStaffId(targetStaffId);
        setIsProxyModalOpen(false);
        
        // 3. Refresh data
        await fetchMyAssignments(targetStaffId);
        alert('代辦帳號綁定成功！');

    } catch (e) {
        console.error('Bind failed:', e);
        alert('綁定失敗');
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: formData.get('email'),
                password: formData.get('password'),
                full_name: formData.get('full_name'),
                role: formData.get('role'),
                staff_type: 'operator'
            })
        });
        const result = await response.json();
        if (result.success) {
            setIsAddStaffModalOpen(false);
            fetchData();
            alert('成員建立成功');
        } else {
            alert('建立失敗: ' + result.error);
        }
    } catch (err) {
        console.error(err);
        alert('系統錯誤');
    } finally {
        setIsSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedStaff || !resetPassword) return;
    setIsResettingPassword(true);
    try {
        const response = await fetch(`/api/team/${selectedStaff.id}/reset-password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: resetPassword })
        });
        const result = await response.json();
        if (result.success) {
            setResetPassword('');
            alert('密碼重置成功');
        } else {
            alert('重置失敗: ' + result.error);
        }
    } catch (err) {
        console.error(err);
        alert('系統錯誤');
    } finally {
        setIsResettingPassword(false);
    }
  };

  if (currentRole === 'staff') {
    return (
        <div className="p-8 max-w-7xl mx-auto">
             <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <UserCog className="text-indigo-600" />
                        我的指派 (My Assignments)
                    </h1>
                    <p className="text-gray-500 mt-1">
                        查看您被指派管理的人設角色與相關帳號資產
                    </p>
                </div>
                
                <div className="flex gap-3">
                    <Button 
                        variant="outline" 
                        onClick={() => currentUser && fetchMyAssignments(currentUser.id)}
                        disabled={isLoading}
                        className="flex items-center gap-2"
                    >
                        <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        刷新數據
                    </Button>
                    <Button onClick={handleOpenProxyModal} variant="outline" className="flex items-center gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                        <UserPlus size={16} />
                        綁定代辦帳號
                    </Button>
                </div>
             </div>

             {/* Staff Dashboard Stats */}
             {currentUser && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">負責人設</p>
                            <h3 className="text-2xl font-bold text-gray-900">
                                {selectedStaff?.assigned_personas?.length || 0}
                                <span className="text-sm font-normal text-gray-400 ml-1">個</span>
                            </h3>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                            <UserCog size={20} />
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">管理帳號</p>
                            <h3 className="text-2xl font-bold text-gray-900">
                                {selectedStaff?.assigned_accounts?.length || 0}
                                <span className="text-sm font-normal text-gray-400 ml-1">個</span>
                            </h3>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Globe size={20} />
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">待辦設定</p>
                            <h3 className="text-2xl font-bold text-orange-600">
                                {selectedStaff?.assigned_accounts?.filter(a => a.onboarding_status !== 'completed').length || 0}
                                <span className="text-sm font-normal text-gray-400 ml-1">個</span>
                            </h3>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                            <AlertCircle size={20} />
                        </div>
                    </div>
                </div>
             )}

             {/* Proxy Indicator */}
             {simulatedStaffId && currentUser && simulatedStaffId !== currentUser.id && (
                 <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg mb-6 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                         <AlertCircle size={16} />
                         <span className="text-sm font-medium">
                            當前正在代辦查看：{staffList.find(s => s.id === simulatedStaffId)?.full_name || '未知員工'}
                         </span>
                     </div>
                     <button 
                        onClick={() => {
                            setSimulatedStaffId(null);
                            // Refresh with original ID (we need to store original ID or just reload page)
                            // Ideally useRole should handle persistence or we just reload
                            window.location.reload(); 
                        }}
                        className="text-xs underline hover:text-amber-900"
                     >
                         取消代辦
                     </button>
                 </div>
             )}

             {/* Onboarding Section */}
             {currentUser && (
                <div className="mb-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                    <AccountOnboardingList 
                        staffId={currentUser.id} 
                        onRefresh={() => fetchMyAssignments(currentUser.id)}
                    />
                </div>
             )}

             {isLoading ? (
                 <div className="text-center py-12 text-gray-500">載入中...</div>
             ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {selectedStaff && selectedStaff.assigned_personas && selectedStaff.assigned_personas.length > 0 ? (
                        selectedStaff.assigned_personas.map(persona => {
                            const personaAccounts = selectedStaff.assigned_accounts?.filter(acc => acc.persona_id === persona.id) || [];
                            return (
                                <div key={persona.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-fit">
                                    <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                                            {persona.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">{persona.name}</h3>
                                            <p className="text-sm text-gray-500">已綁定 {personaAccounts.length} 個社群帳號</p>
                                        </div>
                                    </div>
                                    <div className="p-6 max-h-[400px] overflow-y-auto custom-scrollbar">
                                        {personaAccounts.length > 0 ? (
                                            <div className="grid grid-cols-1 gap-4">
                                                {personaAccounts.map(acc => (
                                                    <div 
                                                        key={acc.id} 
                                                        onClick={() => setSelectedAccountForDetails(acc)}
                                                        className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors bg-white shadow-sm cursor-pointer hover:shadow-md"
                                                    >
                                                        <div className="p-2 bg-gray-50 rounded-lg">
                                                            {getPlatformIcon(acc.platform)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium text-gray-900 truncate">{acc.account_name}</div>
                                                            {/* Password Display */}
                                                            {acc.login_credentials && (acc.login_credentials as any).password && (
                                                                <div className="flex items-center gap-2 mt-1 mb-1">
                                                                    <div className={`text-xs px-2 py-0.5 rounded bg-gray-100 border border-gray-200 font-mono ${showPassword[acc.id] ? 'text-gray-800' : 'text-gray-400'}`}>
                                                                        {showPassword[acc.id] ? (acc.login_credentials as any).password : '••••••••'}
                                                                    </div>
                                                                    <button 
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            togglePassword(acc.id);
                                                                        }}
                                                                        className="text-gray-400 hover:text-indigo-600 focus:outline-none"
                                                                        title={showPassword[acc.id] ? "隱藏密碼" : "顯示密碼"}
                                                                    >
                                                                        {showPassword[acc.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                                                                    </button>
                                                                </div>
                                                            )}
                                                            <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                                                                <span className="capitalize">{acc.platform}</span>
                                                                <span className={`px-1.5 py-0.5 rounded text-[10px] ${acc.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                    {acc.status === 'active' ? '活躍' : '異常'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-gray-300">
                                                            <ChevronRight size={16} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-gray-400 italic bg-gray-50 rounded-lg border border-dashed border-gray-200">此人設尚未綁定任何帳號</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                     ) : (
                         <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
                             <Shield className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                             <h3 className="text-lg font-medium text-gray-900">目前沒有指派給您的任務</h3>
                             <p className="text-gray-500 mt-1">當管理員指派人設後，內容將會自動顯示於此</p>
                         </div>
                     )}
                 </div>
             )}
            
            {/* Account Details Modal (Staff View) */}
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

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="text-indigo-600" />
            團隊與權限管理
          </h1>
          <p className="text-gray-500 mt-1">
            全覽團隊成員狀態、人設指派與帳號資產分布
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'members' && (
            <>
              <Button variant="outline" onClick={handleExportCSV}>
                <Download className="w-4 h-4 mr-2" />
                導出報表
              </Button>
              {(currentRole === 'admin' || currentRole === 'team_leader') && (
                <Button onClick={() => setIsAddStaffModalOpen(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  新增成員
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {fetchError && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 flex items-center gap-2 border border-red-200">
            <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {fetchError}
            </div>
            <Button size="sm" variant="outline" onClick={testConnection} className="ml-2 bg-white hover:bg-blue-50 border-blue-200 text-blue-700">
                測試連線
            </Button>
            <Button size="sm" variant="outline" onClick={fetchData} className="ml-auto bg-white hover:bg-red-50 border-red-200 text-red-700">
                重試
            </Button>
        </div>
      )}

      {/* Header Stats for Admin/Leader */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
                <p className="text-sm text-gray-500 mb-1">團隊成員總數</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.totalStaff} <span className="text-sm font-normal text-gray-400">人</span></h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Users size={20} />
            </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
                <p className="text-sm text-gray-500 mb-1">營運人設總數</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.activePersonas} <span className="text-sm font-normal text-gray-400">個</span></h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                <UserCog size={20} />
            </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
                <p className="text-sm text-gray-500 mb-1">社群帳號資產</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-bold text-gray-900">{stats.totalAccounts}</h3>
                    <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full border border-green-100">
                        {stats.activeAccounts} 活躍
                    </span>
                </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Globe size={20} />
            </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow border-l-4 border-l-orange-400">
            <div>
                <p className="text-sm text-gray-500 mb-1">待處理綁定</p>
                <h3 className="text-2xl font-bold text-orange-600">{stats.pendingAccounts} <span className="text-sm font-normal text-gray-400 text-black">個帳號</span></h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                <AlertCircle size={20} />
            </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="border-b border-gray-100 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
            <div className="flex bg-gray-200/50 p-1 rounded-lg">
                <button 
                onClick={() => setActiveTab('members')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    activeTab === 'members' 
                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-gray-200' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                }`}
                >
                <Users size={16} />
                成員列表
                </button>
                <button 
                onClick={() => setActiveTab('matrix')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    activeTab === 'matrix' 
                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-gray-200' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                }`}
                >
                <LayoutGrid size={16} />
                資源矩陣視圖
                </button>
            </div>
        </div>

        {activeTab === 'matrix' ? (
            <div className="p-6">
                <AccountMatrixView 
                    staffList={staffList} 
                    accounts={allAccounts} 
                    personas={personas}
                    onRefresh={fetchData} 
                />
            </div>
        ) : (
            <>
            {/* Filters */}
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white">
                <div className="relative flex-1 w-full sm:w-auto max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                    type="text"
                    placeholder="搜尋成員姓名或 Email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <select 
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="bg-transparent border-none text-sm focus:outline-none text-gray-700 font-medium cursor-pointer min-w-[120px]"
                    >
                        <option value="all">所有角色</option>
                        <option value="team_leader">組長 (Team Leader)</option>
                        <option value="staff">員工 (Staff)</option>
                    </select>
                </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="w-10 px-4 py-4"></th>
                    <th className="px-6 py-4 font-medium">成員資訊</th>
                    <th className="px-6 py-4 font-medium">系統角色</th>
                    <th className="px-6 py-4 font-medium">職位類型</th>
                    <th className="px-6 py-4 font-medium">指派人設</th>
                    <th className="px-6 py-4 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        載入中...
                      </td>
                    </tr>
                  ) : filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        沒有找到符合條件的成員
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((staff) => (
                      <React.Fragment key={staff.id}>
                        <tr className={`hover:bg-gray-50 transition-colors cursor-pointer ${expandedStaffIds.has(staff.id) ? 'bg-gray-50' : ''}`} onClick={() => toggleRow(staff.id)}>
                          <td className="px-4 py-4 text-gray-400">
                            {expandedStaffIds.has(staff.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div>
                                <div className="font-medium text-gray-900">{staff.full_name || '未命名'}</div>
                                <div className="text-xs text-gray-500">{staff.email || '无 Email'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                              ${staff.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' : 
                                staff.role === 'team_leader' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                                'bg-gray-50 text-gray-700 border-gray-100'}`}>
                              {staff.role === 'admin' && <Shield className="w-3 h-3" />}
                              {staff.role === 'team_leader' ? '組長' : staff.role === 'admin' ? '管理員' : '一般員工'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2 group cursor-pointer" onClick={(e) => { e.stopPropagation(); handleOpenEditStaffModal(staff); }}>
                              <Briefcase className="w-4 h-4 text-gray-400" />
                              <span className="font-medium hover:text-indigo-600 transition-colors">
                                {STAFF_TYPE_MAP[staff.staff_type] || staff.staff_type}
                              </span>
                              <UserCog className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {staff.assigned_personas && staff.assigned_personas.length > 0 ? (
                                staff.assigned_personas.map(p => (
                                  <span key={p.id} className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs border border-green-100">
                                    {p.name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-gray-400 text-xs italic">未指派</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleOpenAssignModal(staff)}
                                  className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                >
                                  <UserCog className="w-4 h-4 mr-1" />
                                  指派
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleOpenEditStaffModal(staff)}
                                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                >
                                  <Edit2 className="w-4 h-4 mr-1" />
                                  編輯
                                </Button>
                            </div>
                          </td>
                        </tr>
                        
                        {/* Expanded Detail Row */}
                        {expandedStaffIds.has(staff.id) && (
                          <tr className="bg-gray-50/50">
                            <td colSpan={6} className="px-6 pb-6 pt-0">
                              <div className="ml-14 mt-2 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                  <Shield className="w-4 h-4 text-indigo-500" />
                                  資產管理狀態
                                </h4>
                                
                                <div className="space-y-6">
                                  {(() => {
                                    const explicitPersonas = staff.assigned_personas || [];
                                    // Removed logic that includes personas derived from accounts
                                    // const accountPersonas = staff.assigned_accounts
                                    //   ?.filter(acc => acc.persona)
                                    //   .map(acc => acc.persona) as Persona[] || [];
                                    
                                    // Only show explicit personas
                                    const allPersonas = explicitPersonas;
                                    const hasAnyData = allPersonas.length > 0;

                                    if (!hasAnyData && (!staff.assigned_accounts || staff.assigned_accounts.length === 0)) {
                                      return <div className="text-gray-400 text-sm italic text-center py-4">無指派人設與帳號</div>;
                                    }

                                    return (
                                      <>
                                        {allPersonas.map(persona => {
                                          // Filter accounts for this specific persona
                                          const personaAccounts = staff.assigned_accounts?.filter(acc => acc.persona_id === persona.id) || [];
                                          
                                          // It is always explicit now
                                          const isExplicitlyAssigned = true;

                                          return (
                                            <div key={persona.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                              {/* Persona Header */}
                                              <div 
                                                className="flex items-center gap-3 mb-4 cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition-colors group"
                                                onClick={() => handleOpenPersonaAccounts(persona, staff)}
                                              >
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm group-hover:bg-indigo-200 transition-colors">
                                                  {persona.name.charAt(0)}
                                                </div>
                                                <div>
                                                  <div className="font-bold text-gray-900 flex items-center gap-2">
                                                    {persona.name}
                                                    <span className="text-xs font-normal text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                                                      @{persona.name}
                                                    </span>
                                                    <Edit2 className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                  </div>
                                                  <div className="text-xs text-gray-500 mt-0.5">
                                                    已綁定 {personaAccounts.length} 個帳號
                                                  </div>
                                                </div>
                                                <div className="ml-auto">
                                                  <Button variant="ghost" size="sm" className="h-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                                                    管理綁定
                                                  </Button>
                                                </div>
                                              </div>

                                              {/* Accounts List for this Persona */}
                                              {personaAccounts.length > 0 ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pl-2">
                                                  {personaAccounts.map(acc => (
                                                    <div 
                                                      key={acc.id} 
                                                      onClick={() => setSelectedAccountForDetails(acc)}
                                                      className="flex items-center justify-between bg-white px-3 py-2.5 rounded-lg border border-gray-200 shadow-sm hover:border-indigo-300 transition-colors cursor-pointer"
                                                    >
                                                      <div className="flex items-center gap-3 min-w-0">
                                                        <div className="p-1.5 bg-gray-50 rounded-md shrink-0">
                                                          {getPlatformIcon(acc.platform)}
                                                        </div>
                                                        <div className="min-w-0">
                                                          <div className="font-medium text-sm text-gray-900 truncate" title={acc.account_name}>
                                                            {acc.account_name}
                                                          </div>
                                                          <div className="text-xs text-gray-500 flex items-center gap-1.5">
                                                            <span className="uppercase">{acc.platform}</span>
                                                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                            {acc.status === 'active' ? (
                                                              <span className="text-green-600 font-medium">活躍</span>
                                                            ) : (
                                                              <span className="text-red-600 font-medium">異常</span>
                                                            )}
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : (
                                                <div className="ml-12 p-3 bg-white/50 rounded-lg border border-dashed border-gray-200 text-sm text-gray-400 italic text-center">
                                                  此人設尚未綁定任何社群帳號
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </>
                                    );
                                  })()}
                                  
                                  {/* Unassigned Accounts Section (Including accounts for personas not explicitly assigned) */}
                                  {(() => {
                                    const explicitPersonaIds = (staff.assigned_personas || []).map(p => p.id);
                                    
                                    // Accounts that are either:
                                    // 1. Not linked to any persona
                                    // 2. Linked to a persona that is NOT explicitly assigned to this staff
                                    const unassignedAccounts = staff.assigned_accounts?.filter(acc => 
                                        !acc.persona_id || !explicitPersonaIds.includes(acc.persona_id)
                                    ) || [];

                                    if (unassignedAccounts.length > 0) {
                                      return (
                                        <div className="bg-orange-50/50 rounded-xl p-4 border border-orange-100 mt-4">
                                          <div className="flex items-center gap-2 mb-3 text-orange-800 font-bold text-sm">
                                            <AlertCircle className="w-4 h-4" />
                                            其他指派帳號 (未歸屬至您管理的人設)
                                          </div>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {unassignedAccounts.map(acc => (
                                              <div key={acc.id} className="flex items-center gap-3 bg-white px-3 py-2 rounded-lg border border-orange-200 shadow-sm opacity-90">
                                                <div className="p-1.5 bg-gray-50 rounded-md">
                                                  {getPlatformIcon(acc.platform)}
                                                </div>
                                                <div>
                                                  <div className="font-medium text-sm text-gray-900">{acc.account_name}</div>
                                                  <div className="text-xs text-orange-600">
                                                    {acc.persona ? `隸屬人設: ${acc.persona.name}` : '未綁定人設'}
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
        </>
      )}
      </div>

      {/* Add Staff Modal */}
      {isAddStaffModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <UserPlus className="text-indigo-600" />
                新增團隊成員
              </h3>
              <button onClick={() => setIsAddStaffModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateStaff} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                <input 
                  name="full_name"
                  placeholder="請輸入成員真實姓名"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">登入帳號</label>
                <input 
                  name="email"
                  type="email"
                  placeholder="member@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">登入密碼</label>
                <input 
                  name="password"
                  type="password"
                  placeholder="請設定初始密碼 (至少6位)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required 
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">系統角色</label>
                <select 
                  name="role"
                  defaultValue="staff"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="staff">一般員工 (Staff)</option>
                  <option value="team_leader">組長 (Team Leader)</option>
                  {currentRole === 'admin' && <option value="admin">管理員 (Admin)</option>}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsAddStaffModalOpen(false)}>取消</Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? '建立中...' : '確認新增'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {isEditStaffModalOpen && selectedStaff && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <UserCog className="text-indigo-600" />
                編輯員工資訊
              </h3>
              <button onClick={() => setIsEditStaffModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleUpdateStaff({
                full_name: formData.get('full_name') as string,
                staff_type: formData.get('staff_type') as any,
                role: formData.get('role') as any
              });
            }} className="p-6 space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                <input 
                  name="full_name"
                  defaultValue={selectedStaff.full_name}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">職位類型</label>
                <select 
                  name="staff_type"
                  defaultValue={selectedStaff.staff_type}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {STAFF_TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  收割大神：負責成交 (Closer) | 流量大神：負責運營 (Operator) | 技術專家：負責支援 (Specialist)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">系統角色</label>
                <select 
                  name="role"
                  defaultValue={selectedStaff.role}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="staff">一般員工 (Staff)</option>
                  <option value="team_leader">組長 (Team Leader)</option>
                  <option value="admin">管理員 (Admin)</option>
                </select>
              </div>

              {/* Reset Password Section */}
              <div className="pt-4 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">重置密碼</label>
                <div className="flex gap-2">
                    <input 
                        type="password"
                        placeholder="輸入新密碼"
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={handleResetPassword}
                        disabled={!resetPassword || isResettingPassword}
                    >
                        {isResettingPassword ? '重置中...' : '確認重置'}
                    </Button>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDeleteStaff(selectedStaff.id)}
                >
                  刪除成員
                </Button>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsEditStaffModalOpen(false)}>取消</Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? '儲存中...' : '儲存變更'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {isAssignModalOpen && selectedStaff && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <UserCog className="text-indigo-600" />
                指派人設給 {selectedStaff.full_name}
              </h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <p className="text-sm text-gray-500 mb-4">請選擇要指派給該員工管理的虛擬人設（可多選）：</p>
              
              <div className="space-y-2">
                {personas.map(persona => {
                  const isSelected = selectedPersonaIds.includes(persona.id);
                  return (
                    <div 
                      key={persona.id}
                      onClick={() => handleTogglePersona(persona.id)}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all
                        ${isSelected 
                          ? 'border-indigo-600 bg-indigo-50 shadow-sm' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center
                          ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'}`}>
                          {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                        </div>
                        <span className={`font-medium ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>
                          {persona.name}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>取消</Button>
              <Button onClick={handleSaveAssignment} disabled={isSaving}>
                {isSaving ? '儲存中...' : '確認指派'}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Persona Accounts Modal */}
      {isPersonaAccountsModalOpen && selectedPersonaForAccounts && (
        <PersonaAccountsModal
          isOpen={isPersonaAccountsModalOpen}
          onClose={() => setIsPersonaAccountsModalOpen(false)}
          persona={selectedPersonaForAccounts.persona as any}
          staff={selectedPersonaForAccounts.staff}
          existingAccounts={(selectedPersonaForAccounts.staff.assigned_accounts || []) as any[]}
          onUpdate={fetchData}
        />
      )}

      {/* Proxy Selection Modal */}
      {isProxyModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <UserCog className="text-indigo-600" />
                        選擇要綁定的代辦員工
                    </h3>
                    <button onClick={() => setIsProxyModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1">
                    <div className="mb-4">
                        <input 
                            type="text" 
                            placeholder="搜尋員工姓名..." 
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            onChange={(e) => {
                                // Simple client-side filter for now
                                const val = e.target.value.toLowerCase();
                                const items = document.querySelectorAll('.proxy-staff-item');
                                items.forEach((item: any) => {
                                    if (item.textContent.toLowerCase().includes(val)) {
                                        item.style.display = 'flex';
                                    } else {
                                        item.style.display = 'none';
                                    }
                                });
                            }}
                        />
                    </div>
                    
                    <div className="space-y-2">
                        {proxyTargetStaff
                            .filter(s => s.id !== currentUser?.id) // Exclude self
                            .map(staff => (
                            <div 
                                key={staff.id}
                                className="proxy-staff-item flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer transition-all"
                                onClick={() => handleBindProxy(staff.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">
                                        {staff.full_name?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">{staff.full_name}</div>
                                        <div className="text-xs text-gray-500 flex items-center gap-1">
                                            <span className="capitalize">{staff.role}</span>
                                            <span>•</span>
                                            <span>{staff.assigned_personas?.length || 0} 個人設</span>
                                        </div>
                                    </div>
                                </div>
                                <Button size="sm" variant="ghost" className="text-indigo-600">
                                    選擇
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}

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