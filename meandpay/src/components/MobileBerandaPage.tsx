import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  Clock, 
  MapPin, 
  QrCode, 
  Wifi, 
  FileText, 
  Zap, 
  Map as MapIcon, 
  Lock, 
  Users, 
  LayoutGrid,
  Home,
  History,
  Fingerprint,
  User,
  DollarSign,
  HandCoins,
  Wallet,
  CreditCard,
  FileStack,
  Calendar,
  Activity,
  Sparkles,
  FilePlus,
  Banknote,
  Navigation,
  Briefcase,
  ClipboardList,
  Presentation,
  UserMinus,
  Stethoscope,
  FileSearch,
  Target,
  ClipboardCheck,
  Book,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  TrendingUp,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';

const BASE_URL = import.meta.env.VITE_API_MEANDPAY;

export function MobileBerandaPage({ settings }: { settings?: any }) {
  // Format jam ke HH:MM saja (handle format HH:MM:SS dari data lama)
  const formatJam = (jam: string | null | undefined): string => {
    if (!jam) return 'Belum';
    // Ambil hanya bagian HH:MM (2 bagian pertama)
    const parts = jam.split(':');
    if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
    return jam;
  };

  const getFileUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('blob:')) return path;
    let cleanPath = path.replace(/^\//, '');
    if (cleanPath.startsWith('uploads/')) cleanPath = cleanPath.slice(8);
    return `https://rsthb.id/apihris/uploads/${cleanPath}`;
  };
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [isAllMenuOpen, setIsAllMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [absenData, setAbsenData] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserData(user);
    fetchShiftInfo(user.id);
    if (user.id) fetchUnreadCount(user.id);

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchUnreadCount = async (userId: string) => {
    try {
      const res = await fetch(`${BASE_URL}/notifications?notifiable_id=${userId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();
      if (json.success) {
        // Notifications with notifiable_id = userId are considered unread
        // When cleared, notifiable_id is set to 0 in the backend
        const count = (json.data || []).filter((n: any) => Number(n.notifiable_id) === Number(userId)).length;
        setUnreadCount(count);
      }
    } catch (_) {}
  };

  const fetchShiftInfo = async (userId: string) => {
    try {
      const todayStr = new Date().toLocaleDateString('en-CA');
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toLocaleDateString('en-CA');

      const res = await fetch(`${BASE_URL}/absensi_user_history/${userId}/${yesterdayStr}/${todayStr}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();
      console.log('absen data', json);
      if (json.success && json.data && json.data.length > 0) {
        const openNightShift = json.data.find((s: any) => {
          if (s.jam_absen && !s.jam_pulang && s.shifts) {
            const { jam_masuk, jam_keluar } = s.shifts;
            const isNightShift = jam_keluar < jam_masuk;
            if (isNightShift) {
              const [h, m] = s.jam_absen.split(':').map(Number);
              const datePart = s.tanggal.split('T')[0];
              const [year, month, day] = datePart.split('-').map(Number);
              const checkInTime = new Date(year, month - 1, day, h, m);
              const elapsedHours = (new Date().getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
              return elapsedHours > 0 && elapsedHours < 18;
            }
          }
          return false;
        });

        let activeShift = openNightShift;
        if (!activeShift) {
          activeShift = json.data.find((s: any) => {
            if (!s.tanggal) return false;
            const shiftDate = s.tanggal.split('T')[0];
            return shiftDate === todayStr;
          }) || json.data[0];
        }

        setAbsenData(activeShift || null);
      } else {
        setAbsenData(null);
      }
    } catch (_) {}
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/absen';
  };

  const hasPermission = (permission: string) => {
    if (!permission) return true;
    if (userData?.is_admin === 'admin') return true;
    
    const perms = userData?.permissions || [];
    return perms.includes(permission) || perms.some((p: any) => p.name === permission);
  };

  const layananObj = [
    { label: 'Absensi',       icon: Fingerprint,   color: 'from-indigo-500 to-indigo-600', path: '/absen', perm: '' },
    { label: 'Cuti & Izin',   icon: Calendar,       color: 'from-sky-500 to-sky-600',      path: '/leave', perm: '' },
    { label: 'Dinas Luar',    icon: Navigation,     color: 'from-amber-500 to-amber-600',  path: '/attendance-dinas', perm: '' },
    { label: 'Lembur',        icon: Zap,            color: 'from-yellow-400 to-orange-500',path: '/overtime-entry', perm: '' },
    { label: 'Lokasi',        icon: MapPin,         color: 'from-rose-500 to-pink-600',    path: '/locations', perm: 'lokasi-kantor.view' },
    { label: 'Password',      icon: Lock,           color: 'from-slate-600 to-slate-700',  path: '/change-password', perm: '' },
    { label: 'Pegawai',       icon: Users,          color: 'from-teal-500 to-emerald-600', path: '/employees', perm: 'pegawai.view' },
    { label: 'Lainnya',       icon: LayoutGrid,     color: 'from-violet-500 to-purple-600',path: '#', perm: '' },
  ];

  const allMenusObj = [
    { label: 'Absensi',            icon: QrCode,        color: 'bg-sky-50 text-sky-600',       path: '/absen', perm: '' },
    { label: 'Kartu Pegawai',      icon: CreditCard,    color: 'bg-slate-50 text-slate-600',   path: '#', perm: '' },
    { label: 'Cuti & Izin',        icon: Wifi,          color: 'bg-blue-50 text-blue-600',     path: '/leave', perm: '' },
    { label: 'Dinas Luar',         icon: FileText,      color: 'bg-amber-50 text-amber-600',   path: '/attendance-dinas', perm: '' },
    { label: 'Lembur',             icon: Zap,           color: 'bg-yellow-50 text-yellow-600', path: '/overtime-entry', perm: '' },
    { label: 'Request Location',   icon: MapIcon,       color: 'bg-orange-50 text-orange-600', path: '/locations', perm: 'lokasi-kantor.view' },
    { label: 'Change Password',    icon: Lock,          color: 'bg-indigo-50 text-indigo-600', path: '/change-password', perm: '' },
    { label: 'Pegawai',            icon: Users,         color: 'bg-teal-50 text-teal-600',     path: '/employees', perm: 'pegawai.view' },
    { label: 'Payroll',            icon: DollarSign,    color: 'bg-sky-50 text-sky-600',       path: '#', perm: 'payroll.view' },
    { label: 'Dokumen',            icon: FileStack,     color: 'bg-amber-50 text-amber-600',   path: '/documents', perm: 'dokumen.view' },
    { label: 'Kasbon',             icon: Wallet,        color: 'bg-blue-50 text-blue-600',     path: '/finance-kasbon', perm: 'kasbon.view' },
    { label: 'History Absen',      icon: History,       color: 'bg-indigo-50 text-indigo-600', path: '/attendance', perm: '' },
    { label: 'History Dinas',      icon: Calendar,      color: 'bg-rose-50 text-rose-600',     path: '/data-dinas', perm: '' },
    { label: 'History Lembur',     icon: Activity,      color: 'bg-orange-50 text-orange-600', path: '/overtime-data', perm: '' },
    { label: 'Euforia',            icon: Sparkles,      color: 'bg-teal-50 text-teal-600',     path: '#', perm: '' },
    { label: 'Pengajuan Absensi',  icon: FilePlus,      color: 'bg-blue-50 text-blue-600',     path: '#', perm: '' },
    { label: 'Reimbursement',      icon: HandCoins,     color: 'bg-emerald-50 text-emerald-600',path: '/finance-reimbursement', perm: 'reimbursement.view' },
    { label: 'Pengajuan Keuangan', icon: Banknote,      color: 'bg-blue-50 text-blue-600',     path: '/finance-pengajuan', perm: 'list-pengajuan-keuangan.view' },
    { label: 'Kunjungan',          icon: Navigation,    color: 'bg-amber-50 text-amber-600',   path: '/visit-kunjungan', perm: '' },
    { label: 'Kinerja Pegawai',    icon: Briefcase,     color: 'bg-sky-50 text-sky-600',       path: '/kinerja-pegawai', perm: 'kinerja-pegawai.view' },
    { label: 'Penugasan',          icon: ClipboardList, color: 'bg-indigo-50 text-indigo-600', path: '/visit-penugasan', perm: '' },
    { label: 'Rapat Kerja',        icon: Presentation,  color: 'bg-rose-50 text-rose-600',     path: '/visit-rapat', perm: '' },
    { label: 'Pegawai Keluar',     icon: UserMinus,     color: 'bg-rose-50 text-rose-600',     path: '/resignations', perm: 'exit.view' },
    { label: 'Visit Dokter',       icon: Stethoscope,   color: 'bg-sky-50 text-sky-600',       path: '/visit-dokter', perm: '' },
    { label: 'Data Visit Dokter',  icon: FileSearch,    color: 'bg-emerald-50 text-emerald-600',path: '#', perm: 'data-patroli.view' },
    { label: 'Target Kinerja',     icon: Target,        color: 'bg-orange-50 text-orange-600', path: '/finance-target-kinerja', perm: 'target-kinerja.view' },
    { label: 'Laporan Kerja',      icon: ClipboardCheck,color: 'bg-blue-50 text-blue-600',     path: '/kinerja-laporan-kerja', perm: 'laporan-kerja.view' },
    { label: 'Profile',            icon: User,          color: 'bg-rose-50 text-rose-600',     path: '/profile', perm: '' },
    { label: 'Petunjuk',           icon: Book,          color: 'bg-amber-50 text-amber-600',   path: '#', perm: 'petunjuk.view' },
    { label: 'Logout',             icon: LogOut,        color: 'bg-rose-50 text-rose-600',     path: 'logout', perm: '' },
  ];

  const layanan = layananObj.filter(m => hasPermission(m.perm));
  const allMenus = allMenusObj.filter(m => hasPermission(m.perm));

  const handleMenuClick = (path: string) => {
    if (path === 'logout') {
      handleLogout();
    } else if (path !== '#') {
      navigate(path);
    }
  };

  const greeting = () => {
    const h = currentTime.getHours();
    if (h < 11) return 'Selamat Pagi';
    if (h < 15) return 'Selamat Siang';
    if (h < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const timeStr = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const dateStr = currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#F0F4FF] pb-28 font-sans">

      {/* ─── HERO HEADER ─── */}
      <div className="relative bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 pt-14 pb-32 px-6 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-400/20 rounded-full blur-3xl" />
        <div className="absolute top-20 left-1/2 w-32 h-32 bg-sky-400/10 rounded-full blur-2xl" />

        {/* Top Row */}
        <div className="relative z-10 flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white/30 shadow-xl bg-white/20 flex items-center justify-center shrink-0">
              {userData?.foto_karyawan ? (
                <img src={userData.foto_karyawan} className="w-full h-full object-cover" alt="Avatar" referrerPolicy="no-referrer" />
              ) : (
                <User className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">{greeting()}</p>
              <h1 className="text-white text-base font-black tracking-tight leading-tight">{userData?.name || 'Pengguna'}</h1>
            </div>
          </div>
          <div className="relative flex items-center gap-2">
            {settings?.logo && (
              <div className="w-11 h-11 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                <img src={getFileUrl(settings.logo)} className="w-6 h-6 object-contain" alt="Company Logo" />
              </div>
            )}
            <button 
              onClick={() => navigate('/notifications')}
              className="relative w-11 h-11 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 active:scale-95 transition-all"
            >
              <Bell className="w-5 h-5 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[9px] font-black rounded-full border-2 border-[#545CEB] flex items-center justify-center shadow-lg">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Live Clock */}
        <div className="relative z-10 text-center mt-2">
          <p className="text-white text-5xl font-black tracking-tight tabular-nums drop-shadow-lg">
            {timeStr}
          </p>
          <p className="text-white/50 text-[11px] font-bold mt-2 uppercase tracking-widest">{dateStr}</p>
        </div>
      </div>

      {/* ─── INFO CARD (floating over header) ─── */}
      <div className="px-5 -mt-20 relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-500/10 p-6 border border-white"
        >
          <div className="grid grid-cols-3 gap-2 divide-x divide-slate-100">
            {/* Jam Kerja (Shift) */}
            <div className="flex flex-col items-center text-center px-2">
              <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center mb-2">
                <Clock className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Jam Kerja</p>
              <p className="text-[11px] font-black text-slate-800">
                {absenData?.shifts?.jam_masuk || '--:--'} - {absenData?.shifts?.jam_keluar || '--:--'}
              </p>
              <p className="text-[9px] font-bold text-slate-400 mt-0.5">{absenData?.shifts?.nama_shift || '-'}</p>
            </div>
            {/* Jam Absen Masuk Aktual */}
            <div className="flex flex-col items-center text-center px-2">
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center mb-2",
                absenData?.jam_absen ? 'bg-emerald-50' : 'bg-slate-50'
              )}>
                <Fingerprint className={cn(
                  "w-4 h-4",
                  absenData?.jam_absen ? 'text-emerald-500' : 'text-slate-400'
                )} />
              </div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Jam Masuk</p>
              <p className={cn(
                "text-[11px] font-black",
                absenData?.jam_absen ? 'text-emerald-600' : 'text-slate-400'
              )}>
                {formatJam(absenData?.jam_absen)}
              </p>
            </div>
            {/* Jam Pulang Aktual */}
            <div className="flex flex-col items-center text-center px-2">
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center mb-2",
                absenData?.jam_pulang ? 'bg-rose-50' : 'bg-slate-50'
              )}>
                <TrendingUp className={cn(
                  "w-4 h-4",
                  absenData?.jam_pulang ? 'text-rose-500' : 'text-slate-400'
                )} />
              </div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Jam Pulang</p>
              <p className={cn(
                "text-[11px] font-black",
                absenData?.jam_pulang ? 'text-rose-600' : 'text-slate-400'
              )}>
                {formatJam(absenData?.jam_pulang)}
              </p>
            </div>
          </div>

          {/* Finance Quick Stats */}
          <div className="mt-5 pt-5 border-t border-slate-50 grid grid-cols-3 gap-3">
            {[
              { label: 'Payroll', icon: DollarSign, color: 'text-indigo-500 bg-indigo-50', value: null, path: '/payroll' },
              { label: 'Reimburse', icon: HandCoins, color: 'text-emerald-500 bg-emerald-50', value: `Rp ${Number(userData?.saldo_kasbon || 0).toLocaleString('id-ID')}`, path: '/finance-reimbursement' },
              { label: 'Kasbon', icon: Wallet, color: 'text-amber-500 bg-amber-50', value: 'Rp 0', path: '/finance-kasbon' },
            ].map((item, i) => (
              <button key={i} onClick={() => navigate(item.path)} className="flex flex-col items-center gap-2 p-3 bg-slate-50/60 rounded-2xl border border-slate-100 active:scale-95 transition-all">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', item.color)}>
                  <item.icon className="w-5 h-5" />
                </div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter text-center">{item.label}</p>
                {item.value && <p className="text-[10px] font-black text-slate-700">{item.value}</p>}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ─── QUICK ABSEN CTA ─── */}
      <div className="px-5 mt-5">
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/absen')}
          className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 rounded-[2rem] p-6 flex items-center justify-between shadow-xl shadow-indigo-500/25 overflow-hidden relative"
        >
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute right-4 bottom-0 w-20 h-20 bg-white/5 rounded-full" />
          <div className="relative z-10">
            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Mulai Hari Ini</p>
            <p className="text-lg font-black text-white tracking-tight">Rekam Kehadiran</p>
          </div>
          <div className="relative z-10 w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <Fingerprint className="w-8 h-8 text-indigo-600" />
          </div>
        </motion.button>
      </div>

      {/* ─── LAYANAN SECTION ─── */}
      <div className="mt-8 px-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-black text-slate-800 tracking-tight">Layanan Cepat</h2>
          <button
            onClick={() => setIsAllMenuOpen(true)}
            className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1"
          >
            Semua <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {layanan.map((item, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 * i + 0.3 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => item.label === 'Lainnya' ? setIsAllMenuOpen(true) : handleMenuClick(item.path)}
              className="flex flex-col items-center gap-2.5"
            >
              <div className={cn(
                "w-full aspect-square rounded-[1.5rem] flex items-center justify-center shadow-lg bg-gradient-to-br",
                item.color
              )}>
                <item.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-[9px] font-black text-slate-500 text-center leading-tight uppercase">{item.label}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ─── RECENT ACTIVITY SECTION ─── */}
      <div className="mt-8 px-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-black text-slate-800 tracking-tight">Aktivitas Terakhir</h2>
          <button onClick={() => navigate('/attendance')} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1">
            Lihat <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-3">
          {[
            { label: 'Riwayat Absensi', path: '/attendance', icon: History, color: 'bg-indigo-50 text-indigo-600', desc: 'Lihat log masuk & pulang' },
            { label: 'Riwayat Dinas', path: '/data-dinas', icon: Navigation, color: 'bg-amber-50 text-amber-600', desc: 'Laporan perjalanan dinas' },
            { label: 'Riwayat Lembur', path: '/overtime-data', icon: Zap, color: 'bg-orange-50 text-orange-600', desc: 'Catatan jam lembur' },
          ].map((item, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              onClick={() => navigate(item.path)}
              className="w-full bg-white rounded-[1.75rem] p-5 flex items-center gap-4 shadow-sm border border-slate-100 active:scale-[0.98] transition-all"
            >
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner", item.color)}>
                <item.icon className="w-6 h-6" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-black text-slate-800 tracking-tight">{item.label}</p>
                <p className="text-[10px] font-bold text-slate-400">{item.desc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </motion.button>
          ))}
        </div>
      </div>

      {/* ─── ALL MENUS FULLSCREEN MODAL ─── */}
      <AnimatePresence>
        {isAllMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="fixed inset-0 z-[200] bg-[#F0F4FF] flex flex-col"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-indigo-700 to-violet-600 pt-14 pb-8 px-6 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-1">Navigasi</p>
                  <h2 className="text-2xl font-black text-white tracking-tight">Semua Menu</h2>
                </div>
                <button
                  onClick={() => setIsAllMenuOpen(false)}
                  className="w-11 h-11 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Grid of menus */}
            <div className="flex-1 overflow-y-auto px-5 py-6 pb-36">
              <div className="grid grid-cols-4 gap-x-3 gap-y-6">
                {allMenus.map((item, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.02 }}
                    whileTap={{ scale: 0.88 }}
                    onClick={() => {
                      if (item.path !== '#') setIsAllMenuOpen(false);
                      handleMenuClick(item.path);
                    }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className={cn(
                      "w-14 h-14 rounded-[1.25rem] flex items-center justify-center shadow-sm border border-white",
                      item.color
                    )}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <p className="text-[9px] font-black text-slate-500 text-center leading-tight uppercase tracking-tight">{item.label}</p>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
