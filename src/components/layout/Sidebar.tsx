import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Library, 
  FlaskConical, 
  Users, 
  BarChart3, 
  Calendar,
  Settings,
  LogOut,
  Briefcase,
  SquareKanban,
  BookOpen,
  UserCog,
  Book,
  CalendarCheck,
  ClipboardCheck,
  CalendarDays
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useRole } from '../../contexts/RoleContext';
import { useAuth } from '../../contexts/AuthContext';
import { Database } from '../../types/database.types';

type Role = Database['public']['Tables']['profiles']['Row']['role'];

const navItems = [
  { name: '戰情室', href: '/', icon: LayoutDashboard, roles: ['admin', 'team_leader', 'staff'] as Role[] },
  { name: '員工工作台', href: '/workbench', icon: Briefcase, roles: ['admin', 'staff'] as Role[] },
  { name: '素材庫', href: '/assets', icon: Library, roles: ['admin', 'team_leader', 'staff'] as Role[] },
  { name: '人設管理中心', href: '/personas', icon: UserCog, roles: ['admin', 'team_leader', 'staff'] as Role[] },
  { name: '語料庫管理', href: '/knowledge', icon: BookOpen, roles: ['admin', 'team_leader', 'staff'] as Role[] },
  { name: 'SOP 管理中心', href: '/templates', icon: SquareKanban, roles: ['admin', 'team_leader'] as Role[] },
  { name: '內容工廠', href: '/content-factory', icon: FlaskConical, roles: ['admin', 'team_leader', 'staff'] as Role[] },
  { name: '矩陣帳號管理', href: '/matrix-accounts', icon: Users, roles: ['admin', 'team_leader'] as Role[] },
  { name: '團隊與權限管理', href: '/team', icon: Users, roles: ['admin', 'team_leader', 'staff'] as Role[] },
  { name: '休假申請', href: '/leaves/apply', icon: CalendarCheck, roles: ['admin', 'team_leader', 'staff'] as Role[] },
  { name: '休假審核', href: '/leaves/review', icon: ClipboardCheck, roles: ['admin', 'team_leader'] as Role[] },
  { name: '休假看板', href: '/leaves/board', icon: CalendarDays, roles: ['admin', 'team_leader', 'staff'] as Role[] },
  { name: '員工手冊', href: '/handbook', icon: Book, roles: ['admin', 'team_leader', 'staff'] as Role[] },
];

export const Sidebar: React.FC = () => {
  const { currentRole } = useRole();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // 1. Sign out from Supabase
      await signOut();
      
      // 2. Clear any local storage if used
      localStorage.clear(); // Optional: Clear all local storage to be safe
      
      // 3. Force redirect to login
      navigate('/login', { replace: true });
      window.location.href = '/login'; // Double force via window.location
    } catch (error) {
      console.error('Logout failed', error);
      // Even if API fails, force redirect
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 w-64 fixed left-0 top-0 bottom-0 z-10">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
          <span className="text-2xl">⚡</span> LEGO999
        </h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems
          .filter(item => item.roles.includes(currentRole))
          .map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors group",
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon 
                  className={cn(
                    "mr-3 h-5 w-5",
                    isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-500"
                  )} 
                />
                {item.name}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        {currentRole === 'admin' && (
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors group mb-1",
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )
            }
          >
            <Settings className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
            系統設定
          </NavLink>
        )}
        <button 
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          登出系統
        </button>
      </div>
    </div>
  );
};
