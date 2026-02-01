
import React, { useState, useEffect } from 'react';
import { Bell, Search, User } from 'lucide-react';
import { RoleSwitcher } from '../common/RoleSwitcher';
import { useRole } from '../../contexts/RoleContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';

interface Notification {
    id: string;
    title: string;
    type: string;
    content: {
        message: string;
        application_count?: number;
        applicant_id?: string;
    };
    status: 'unread' | 'read';
    created_at: string;
}

export const Header: React.FC = () => {
  const { currentRole, roleLabels } = useRole();
  const { user } = useAuth();

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
        fetchNotifications();
        // Optional: Poll every minute
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
        const response = await fetch(`/api/notifications?userId=${user.id}&t=${Date.now()}`); // Add timestamp to prevent caching
        
        // Handle non-JSON responses (e.g. 500 error page from Vercel)
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            // console.error("Received non-JSON response:", await response.text());
            return;
        }

        const result = await response.json();
        if (result.success) {
            setNotifications(result.data);
            setUnreadCount(result.data.filter((n: Notification) => n.status === 'unread').length);
        }
    } catch (error) {
        console.error('Failed to fetch notifications', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
        await fetch('/api/notifications/read-all', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id })
        });
        setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
        setUnreadCount(0);
    } catch (error) {
        console.error('Failed to mark all as read', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
      if (notification.status === 'unread') {
          try {
              await fetch(`/api/notifications/${notification.id}/read`, { method: 'PUT' });
              setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, status: 'read' } : n));
              setUnreadCount(prev => Math.max(0, prev - 1));
          } catch (error) {
              console.error('Failed to mark as read', error);
          }
      }
      
      // Navigate based on type
      if (notification.type === 'leave_request') {
          window.location.href = '/leaves/review'; // Or use useNavigate
      }
      setShowNotifications(false);
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 fixed top-0 right-0 left-64 z-10 px-8 flex items-center justify-between">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="搜尋素材、任務或帳號..."
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <RoleSwitcher />
        
        <div className="h-8 w-px bg-gray-200 mx-2"></div>

        <div className="relative">
          <button 
            className="relative p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 transition-colors"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="h-6 w-6" />
            {unreadCount > 0 && (
                <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                <span className="font-semibold text-gray-700">通知中心</span>
                {unreadCount > 0 && (
                    <span 
                        className="text-xs text-blue-600 cursor-pointer hover:underline"
                        onClick={markAllAsRead}
                    >
                        全部已讀
                    </span>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-gray-500 text-sm">
                        暫無通知
                    </div>
                ) : (
                    notifications.map(n => (
                    <div 
                        key={n.id} 
                        className={`px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 cursor-pointer ${n.status === 'unread' ? 'bg-blue-50/50' : ''}`}
                        onClick={() => handleNotificationClick(n)}
                    >
                        <div className="flex justify-between items-start mb-1">
                        <span className={`text-sm font-medium ${n.status === 'unread' ? 'text-blue-700' : 'text-gray-800'}`}>{n.title}</span>
                        <span className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: zhTW })}
                        </span>
                        </div>
                        <p className="text-xs text-gray-600 leading-snug">{n.content.message}</p>
                    </div>
                    ))
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="h-8 w-px bg-gray-200 mx-2"></div>
        
        <div className="flex items-center gap-3 pl-2">
          <div className="flex flex-col text-right hidden sm:block">
            <span className="text-sm font-medium text-gray-900">{user?.user_metadata?.full_name || user?.email || 'User'}</span>
            <span className="text-xs text-gray-500">{roleLabels[currentRole]}</span>
          </div>
          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200 overflow-hidden">
             {user?.user_metadata?.avatar_url ? (
                 <img src={user.user_metadata.avatar_url} alt="avatar" className="w-full h-full object-cover"/>
             ) : (
                <User className="h-6 w-6 text-indigo-600" />
             )}
          </div>
        </div>
      </div>
    </header>
  );
};
