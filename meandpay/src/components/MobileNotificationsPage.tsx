import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
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
  CheckCheck,
  ChevronLeft,
  Calendar,
  Zap,
  Navigation,
  Fingerprint
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

export function MobileNotificationsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState<'all' | 'unread'>('all');
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
        const transformed: Notification[] = json.data.map((item: any) => {
          let parsedData: any = {};
          try {
            parsedData = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
          } catch (e) {
            console.error('Failed to parse notification data', e);
          }

          const isUnread = Number(item.notifiable_id) === Number(user.id);
          const fromName = parsedData.from || 'System';

          const fotoKaryawan = item.user?.foto_karyawan;
          const avatarUrl = fotoKaryawan
            ? fotoKaryawan
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(fromName)}&background=random`;

          return {
            id: item.id,
            type: determineType(parsedData.message),
            title: determineTitle(parsedData.message, fromName),
            message: parsedData.message || 'You have a new notification',
            time: new Date(item.created_at).toLocaleDateString('id-ID', { 
              day: 'numeric', 
              month: 'short', 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
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
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleViewDetail = (notification: Notification) => {
    if (notification.unread) {
      handleMarkAsRead(notification.id);
    }
    
    const msg = notification.message?.toLowerCase();
    if (notification.type === 'alert' || msg.includes('kontrak') || msg.includes('pkwt')) {
      navigate('/beranda');
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
        action = `attendance?user_id=${userId}`;
      } else if (msg.includes('lembur')) {
        action = `overtime-data?user_id=${userId}`;
      } else if (msg.includes('dinas')) {
        action = `data-dinas?user_id=${userId}`;
      }
    }

    if (action) {
      const actionLower = action.toLowerCase();
      if (actionLower.includes('cuti') || actionLower.includes('leave')) {
        navigate('/leave', { state: { userId } });
      } else if (actionLower.includes('absensi') || actionLower.includes('absen') || actionLower.includes('attendance')) {
        navigate('/attendance', { state: { userId } });
      } else if (actionLower.includes('lembur') || actionLower.includes('overtime')) {
        navigate('/overtime-data', { state: { userId } });
      } else if (actionLower.includes('dinas')) {
        navigate('/data-dinas', { state: { userId } });
      } else {
        navigate('/beranda');
      }
    }
  };

  const filteredNotifications = notifications.filter(n => 
    activeTab === 'all' || (activeTab === 'unread' && n.unread)
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* ─── HEADER ─── */}
      <div className="bg-gradient-to-br from-indigo-700 to-violet-600 pt-14 pb-8 px-6 sticky top-0 z-[100] overflow-hidden shadow-lg">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/beranda')}
              className="w-11 h-11 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 active:scale-90 transition-all"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <div>
              <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-0.5">Informasi</p>
              <h2 className="text-2xl font-black text-white tracking-tight">Notifikasi</h2>
            </div>
          </div>
          
          <button
            onClick={handleMarkAllAsRead}
            className="w-11 h-11 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 active:scale-90 transition-all"
          >
            <CheckCheck className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* ─── TABS ─── */}
      <div className="px-6 py-4 bg-white border-b border-slate-100 flex gap-4 sticky top-[124px] z-[90]">
        <button 
          onClick={() => setActiveTab('all')}
          className={cn(
            "flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'all' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-slate-50 text-slate-400"
          )}
        >
          Semua {notifications.length > 0 && `(${notifications.length})`}
        </button>
        <button 
          onClick={() => setActiveTab('unread')}
          className={cn(
            "flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'unread' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-slate-50 text-slate-400"
          )}
        >
          Belum Dibaca {notifications.filter(n => n.unread).length > 0 && `(${notifications.filter(n => n.unread).length})`}
        </button>
      </div>

      {/* ─── LIST ─── */}
      <div className="px-5 py-6 pb-32">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Memuat...</p>
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="space-y-4">
            {filteredNotifications.map((notif, i) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleViewDetail(notif)}
                className={cn(
                  "p-5 rounded-[2rem] border transition-all active:scale-[0.98] relative",
                  notif.unread 
                    ? "bg-white border-indigo-100 shadow-xl shadow-indigo-500/5" 
                    : "bg-slate-50/50 border-slate-100"
                )}
              >
                {notif.unread && (
                  <div className="absolute top-6 left-2 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                )}
                
                <div className="flex gap-4">
                  <div className="relative shrink-0">
                    <img 
                      src={notif.user?.avatar} 
                      className="w-12 h-12 rounded-2xl object-cover shadow-md"
                      alt="avatar"
                      referrerPolicy="no-referrer"
                    />
                    <div className={cn(
                      "absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center border-2 border-white shadow-sm",
                      getIconBg(notif.type)
                    )}>
                      {getIcon(notif.type, "w-3 h-3 text-white")}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={cn(
                        "text-sm font-black tracking-tight truncate",
                        notif.unread ? "text-slate-900" : "text-slate-500"
                      )}>
                        {notif.title}
                      </h4>
                      <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap ml-2">
                        {notif.time}
                      </span>
                    </div>
                    <p className={cn(
                      "text-xs font-medium leading-relaxed line-clamp-2",
                      notif.unread ? "text-slate-600" : "text-slate-400"
                    )}>
                      {notif.message}
                    </p>
                  </div>
                </div>

                {(notif.action || notif.type === 'alert' || notif.type === 'request' || notif.message?.toLowerCase().includes('kontrak') || notif.message?.toLowerCase().includes('pkwt') || notif.message?.toLowerCase().includes('cuti') || notif.message?.toLowerCase().includes('lembur') || notif.message?.toLowerCase().includes('izin')) && (
                  <div className="mt-4 flex justify-end">
                    <button className="px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all">
                      Lihat Detail
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <Bell className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Tidak ada notifikasi</h3>
            <p className="text-xs font-bold text-slate-400 mt-2 max-w-[200px]">Semua informasi akan muncul di sini saat tersedia.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function getIcon(type: Notification['type'], className = 'w-3 h-3') {
  switch (type) {
    case 'request': return <UserPlus className={className} />;
    case 'mention': return <MessageSquare className={className} />;
    case 'system': return <Clock className={className} />;
    case 'alert': return <AlertCircle className={className} />;
    default: return <Bell className={className} />;
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
