import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Database } from '../types/database.types';
import { useAuth } from './AuthContext';

type Role = Database['public']['Tables']['profiles']['Row']['role'];

interface RoleContextType {
  currentRole: Role;
  setRole: (role: Role) => void; // Kept for compatibility but might warn or be no-op if real auth is strict
  roleLabels: Record<Role, string>;
  simulatedStaffId: string | null;
  setSimulatedStaffId: (id: string | null) => void;
  isLoading: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { profile, loading: authLoading } = useAuth();
  const [currentRole, setCurrentRole] = useState<Role>('staff');
  const [simulatedStaffId, setSimulatedStaffIdState] = useState<string | null>(null);

  const roleLabels: Record<Role, string> = {
    admin: '管理員 (Admin)',
    team_leader: '組長 (Team Leader)',
    staff: '員工 (Staff)',
  };

  useEffect(() => {
    if (profile?.role) {
      setCurrentRole(profile.role);
    }
  }, [profile]);

  useEffect(() => {
    const savedStaffId = localStorage.getItem('dev_simulated_staff_id');
    if (savedStaffId) {
        setSimulatedStaffIdState(savedStaffId);
    }
  }, []);

  const setRole = (role: Role) => {
    // In a real system, you can't just set your role.
    // But for now, we update local state.
    setCurrentRole(role);
  };

  const setSimulatedStaffId = (id: string | null) => {
    setSimulatedStaffIdState(id);
    if (id) {
        localStorage.setItem('dev_simulated_staff_id', id);
    } else {
        localStorage.removeItem('dev_simulated_staff_id');
    }
  };

  return (
    <RoleContext.Provider value={{ 
      currentRole, 
      setRole, 
      roleLabels, 
      simulatedStaffId, 
      setSimulatedStaffId,
      isLoading: authLoading
    }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
