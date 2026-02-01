import React, { useEffect, useState } from 'react';
import { useRole } from '../../contexts/RoleContext';
import { ShieldAlert, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const RoleSwitcher: React.FC = () => {
  const { currentRole, setRole, roleLabels, simulatedStaffId, setSimulatedStaffId } = useRole();
  const [staffList, setStaffList] = useState<{ id: string, full_name: string, email: string }[]>([]);

  useEffect(() => {
    if (currentRole === 'staff') {
        const fetchStaff = async () => {
            const { data } = await supabase.from('profiles').select('id, full_name, email').eq('role', 'staff');
            if (data) {
                setStaffList(data);
                // If no simulated staff is selected, select the first one automatically
                if (!simulatedStaffId && data.length > 0) {
                    setSimulatedStaffId(data[0].id);
                }
            }
        };
        fetchStaff();
    } else {
        setSimulatedStaffId(null);
    }
  }, [currentRole]);

  return (
    <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
        <ShieldAlert className="w-4 h-4 text-indigo-600" />
        <span className="text-xs text-gray-500 font-medium">預覽權限:</span>
        <select
            value={currentRole}
            onChange={(e) => setRole(e.target.value as any)}
            className="bg-transparent text-sm font-semibold text-gray-700 border-none outline-none focus:ring-0 cursor-pointer"
        >
            {Object.entries(roleLabels).map(([role, label]) => (
            <option key={role} value={role}>
                {label}
            </option>
            ))}
        </select>
        </div>

        {currentRole === 'staff' && staffList.length > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 animate-in fade-in slide-in-from-left-2">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-gray-500 font-medium">模擬員工:</span>
                <select
                    value={simulatedStaffId || ''}
                    onChange={(e) => setSimulatedStaffId(e.target.value)}
                    className="bg-transparent text-sm font-semibold text-blue-700 border-none outline-none focus:ring-0 cursor-pointer min-w-[100px]"
                >
                    {staffList.map(staff => (
                        <option key={staff.id} value={staff.id}>
                            {staff.full_name || staff.email}
                        </option>
                    ))}
                </select>
            </div>
        )}
    </div>
  );
};
