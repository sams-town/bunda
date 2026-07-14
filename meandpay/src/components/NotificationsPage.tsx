import React from 'react';
import { motion } from 'motion/react';
import {
  Bell,
  CheckCircle2,
  Clock,
  MessageSquare,
  UserPlus,
  AlertCircle,
  MoreVertical,
  Search,
  Filter,
  Trash2,
  CheckCheck
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Notification {
  id: string;
  type: 'request' | 'system' | 'mention' | 'alert';
  title: string;
  message: string;
  time: string;
  user?: {
    name: string;
    avatar: string;
  };
  unread: boolean;
  action?: string;
  apiData?: any;
}

interface NotificationsPageProps {
  onNavigate?: (page: string, filters?: Record<string, string>) => void;
  onRefreshCount?: () => void;
}

export function NotificationsPage({ onNavigate, onRefreshCount }: NotificationsPageProps) {
  const [activeTab, setActiveTab] = React.useState<'all' | 'unread' | 'requests'>('all');
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/notifications?notifiable_id=${user.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();
      if (json.success) {
        // Transform API data to UI format
        const transformed: Notification[] = json.data.map((item: any) => {
          let parsedData: any = {};
          try {
            parsedData = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
          } catch (e) {
            console.error('Failed to parse notification data', e);
          }

          const isUnread = Number(item.notifiable_id) === Number(user.id);
          const fromName = parsedData.from || 'System';

          // Use foto_karyawan if available, otherwise fallback to ui-avatars
          const fotoKaryawan = item.user?.foto_karyawan;
          const avatarUrl = fotoKaryawan
            ? fotoKaryawan
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(fromName)}&background=random`;

          return {
            id: item.id,
            type: determineType(parsedData.message),
            title: determineTitle(parsedData.message, fromName),
            message: parsedData.message || 'You have a new notification',
            time: new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            user: {
              name: fromName,
              avatar: avatarUrl
            },
            unread: isUnread,
            action: parsedData.action,
            apiData: item
          };
        });
        setNotifications(transformed);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const determineType = (text: string = ''): Notification['type'] => {
    const lower = text.toLowerCase();
    if (lower.includes('kontrak') || lower.includes('pkwt')) return 'alert';
    if (lower.includes('approval') || lower.includes('pengajuan') || lower.includes('mengajukan')) return 'request';
    if (lower.includes('diterima') || lower.includes('ditolak') || lower.includes('approve')) return 'system';
    return 'mention';
  };

  const determineTitle = (text: string = '', from: string): string => {
    const lower = text.toLowerCase();
    if (lower.includes('kontrak') || lower.includes('pkwt')) return 'Pemberitahuan Kontrak';
    if (lower.includes('sakit')) return 'Pemberitahuan Sakit';
    if (lower.includes('izin masuk')) return 'Pemberitahuan Izin Masuk';
    if (lower.includes('izin telat')) return 'Pemberitahuan Izin Telat';
    if (lower.includes('pulang cepat')) return 'Pemberitahuan Izin Pulang Cepat';
    if (lower.includes('cuti')) return 'Pemberitahuan Cuti';
    if (lower.includes('lembur')) return 'Pemberitahuan Lembur';
    if (lower.includes('lokasi')) return 'Pemberitahuan Lokasi';
    return `Pemberitahuan dari ${from}`;
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await fetch(`${import.meta.env.VITE_API_MEANDPAY}/notifications/${notificationId}/clear`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, unread: false, apiData: { ...n.apiData, notifiable_id: 0 } } : n));
      if (onRefreshCount) onRefreshCount();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => n.unread);
      await Promise.all(unreadNotifications.map(n =>
        fetch(`${import.meta.env.VITE_API_MEANDPAY}/notifications/${n.id}/clear`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ));
      setNotifications(prev => prev.map(n => ({ ...n, unread: false, apiData: { ...n.apiData, notifiable_id: 0 } })));
      if (onRefreshCount) onRefreshCount();
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleViewDetail = (notification: Notification) => {
    // Mark as read
    if (notification.unread) {
      handleMarkAsRead(notification.id);
    }
    // Navigate to the corresponding page within the SPA
    if (onNavigate) {
      const msg = notification.message?.toLowerCase();
      if (notification.type === 'alert' || msg.includes('kontrak') || msg.includes('pkwt')) {
        onNavigate('contracts');
        return;
      }

      let action = notification.action;
      let userId = '';

      if (!action && msg) {
        let parsedData: any = {};
        try {
          parsedData = typeof notification.apiData?.data === 'string'
            ? JSON.parse(notification.apiData.data)
            : notification.apiData?.data;
        } catch (e) {}
        userId = parsedData?.user_id || '';

        if (msg.includes('cuti') || msg.includes('izin')) {
          action = `leave?user_id=${userId}`;
        } else if (msg.includes('absen') || msg.includes('absensi')) {
          action = `data-attendance?user_id=${userId}`;
        } else if (msg.includes('lembur')) {
          action = `overtime-data?user_id=${userId}`;
        } else if (msg.includes('dinas')) {
          action = `data-dinas?user_id=${userId}`;
        }
      }

      if (action) {
        const actionLower = action.toLowerCase();
        // Parse query params from action
        const queryString = action.split('?')[1] || '';
        const urlParams = new URLSearchParams(queryString);

        const params: Record<string, string> = {
          userId: urlParams.get('user_id') || userId || '',
          startDate: urlParams.get('mulai') || '',
          endDate: urlParams.get('akhir') || ''
        };

        if (actionLower.includes('data-cuti') || actionLower.includes('cuti') || actionLower.includes('leave')) {
          onNavigate('leave', params);
        } else if (actionLower.includes('absensi') || actionLower.includes('absen') || actionLower.includes('attendance')) {
          onNavigate('data-attendance', params);
        } else if (actionLower.includes('lembur') || actionLower.includes('overtime')) {
          onNavigate('overtime-data', params);
        } else if (actionLower.includes('dinas')) {
          onNavigate('data-dinas', params);
        } else {
          onNavigate('dashboard');
        }
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1600px] mx-auto space-y-8"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Notifications</h1>
          <p className="text-slate-500 font-medium">Stay updated with the latest activities and requests.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
          >
            <CheckCheck className="w-4 h-4 text-indigo-600" />
            Mark all as read
          </button>
          <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/30 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto">
          <TabButton
            label="All"
            active={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
            count={notifications.length}
          />
          <TabButton
            label="Unread"
            active={activeTab === 'unread'}
            onClick={() => setActiveTab('unread')}
            count={notifications.filter(n => n.unread).length}
          />
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search notifications..."
            className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications
            .filter(n => activeTab === 'all' || (activeTab === 'unread' && n.unread))
            .map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "group relative bg-white p-6 rounded-[2rem] border transition-all hover:shadow-2xl hover:shadow-slate-200/50 flex items-start gap-6",
                  notification.unread ? "border-indigo-100 bg-indigo-50/10" : "border-slate-100"
                )}
              >
                {/* Unread Indicator */}
                {notification.unread && (
                  <div className="absolute top-8 left-3 w-2 h-2 bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]"></div>
                )}

                {/* Icon/Avatar */}
                <div className="shrink-0">
                  {notification.user ? (
                    <div className="relative">
                      <img
                        src={notification.user.avatar}
                        alt={notification.user.name}
                        className="w-14 h-14 rounded-2xl object-cover shadow-lg"
                        referrerPolicy="no-referrer"
                      />
                      <div className={cn(
                        "absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center border-2 border-white shadow-sm",
                        getIconBg(notification.type)
                      )}>
                        {getIcon(notification.type)}
                      </div>
                    </div>
                  ) : (
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg",
                      getIconBg(notification.type)
                    )}>
                      {getIcon(notification.type, 'w-7 h-7')}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div 
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => handleViewDetail(notification)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={cn(
                      "text-lg font-black tracking-tight truncate",
                      notification.unread ? "text-slate-900" : "text-slate-600"
                    )}>
                      {notification.title}
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap ml-4">
                      {notification.time}
                    </span>
                  </div>
                  <p className="text-slate-500 font-medium leading-relaxed mb-4">
                    {notification.message}
                  </p>

                  {(notification.action || notification.type === 'alert' || notification.type === 'request' || notification.message?.toLowerCase().includes('kontrak') || notification.message?.toLowerCase().includes('pkwt') || notification.message?.toLowerCase().includes('cuti') || notification.message?.toLowerCase().includes('lembur') || notification.message?.toLowerCase().includes('izin')) && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleViewDetail(notification)}
                        className="px-6 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-100 transition-all active:scale-95"
                      >
                        Lihat Detail
                      </button>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <button className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all ">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </motion.div>
            ))}
          {notifications.length === 0 && (
            <div className="text-center py-10">
              <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900">Belum Ada Notifikasi</h3>
              <p className="text-slate-500 mt-1">Anda sudah melihat semua informasi terbaru.</p>
            </div>
          )}
        </div>
      )}

      {/* Load More */}
      <div className="flex justify-center pt-4">
        <button className="px-8 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-500 hover:text-indigo-600 hover:border-indigo-100 transition-all active:scale-95 shadow-lg shadow-slate-200/20">
          Load Older Notifications
        </button>
      </div>
    </motion.div>
  );
}

function TabButton({ label, active, onClick, count }: { label: string, active: boolean, onClick: () => void, count?: number }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-6 py-2.5 text-xs font-black uppercase tracking-widest transition-all rounded-xl flex items-center gap-2",
        active
          ? "bg-white text-indigo-600 shadow-sm"
          : "text-slate-500 hover:text-slate-900"
      )}
    >
      {label}
      {count !== undefined && (
        <span className={cn(
          "px-1.5 py-0.5 rounded-md text-[10px]",
          active ? "bg-indigo-50 text-indigo-600" : "bg-slate-200 text-slate-500"
        )}>
          {count}
        </span>
      )}
    </button>
  );
}

function getIcon(type: Notification['type'], className = 'w-3 h-3') {
  switch (type) {
    case 'request': return <UserPlus className={cn(className, "text-white")} />;
    case 'mention': return <MessageSquare className={cn(className, "text-white")} />;
    case 'system': return <Clock className={cn(className, "text-white")} />;
    case 'alert': return <AlertCircle className={cn(className, "text-white")} />;
    default: return <Bell className={cn(className, "text-white")} />;
  }
}

function getIconBg(type: Notification['type']) {
  switch (type) {
    case 'request': return 'bg-emerald-500';
    case 'mention': return 'bg-indigo-500';
    case 'system': return 'bg-amber-500';
    case 'alert': return 'bg-rose-500';
    default: return 'bg-slate-500';
  }
}
