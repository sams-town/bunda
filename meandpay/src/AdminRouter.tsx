/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  Bell,
  Settings,
  User,
  Users,
  ShieldCheck,
  FileText,
  UserMinus,
  Clock,
  Briefcase,
  MapPin,
  Database,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Plus,
  MoreHorizontal,
  Filter,
  Menu,
  X,
  ChevronLeftCircle,
  ChevronRightCircle,
  TrendingUp,
  Activity,
  Package,
  DollarSign,
  Share2,
  Lock,
  Receipt,
  AlertCircle,
  FileCheck,
  UserX,
  UserPlus,
  Stethoscope
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationsPage } from './components/NotificationsPage';
import { ProfilePage } from './components/ProfilePage';
import { EmployeesPage } from './components/EmployeesPage';
import { AllEmployeesPage } from './components/AllEmployeesPage';
import { RolesPage } from './components/RolesPage';
import { ContractsPage } from './components/ContractsPage';
import { ResignationsPage } from './components/ResignationsPage';
import { ShiftPage } from './components/ShiftPage';
import { DivisionsPage } from './components/DivisionsPage';
import { LocationsPage } from './components/LocationsPage';
import { DataRecapPage } from './components/DataRecapPage';
import { LeavePage } from './components/LeavePage';
import { AbsenPage } from './components/AbsenPage';
import { AttendancePage } from './components/AttendancePage';
import { DataAbsenPage } from './components/DataAbsenPage';
import { AbsenDinasPage } from './components/AbsenDinasPage';
import { AdminAbsenPage } from './components/AdminAbsenPage';
import { DataDinasPage } from './components/DataDinasPage';
import { OvertimeEntryPage } from './components/OvertimeEntryPage';
import { OvertimeDataPage } from './components/OvertimeDataPage';
import { VisitDokterPage } from './components/VisitDokterPage';
import { KunjunganPage } from './components/KunjunganPage';
import { PenugasanKerjaPage } from './components/PenugasanKerjaPage';
import { RapatPage } from './components/RapatPage';
import { JenisKinerjaPage } from './components/JenisKinerjaPage';
import { LaporanKinerjaPage } from './components/LaporanKinerjaPage';
import { KinerjaPegawaiPage } from './components/KinerjaPegawaiPage';
import { LaporanKerjaPage } from './components/LaporanKerjaPage';
import { OvertimePage } from './components/OvertimePage';
import { VisitPage } from './components/VisitPage';
import { InventoryPage } from './components/InventoryPage';
import { FinancePage } from './components/FinancePage';
import { DocumentsPage } from './components/DocumentsPage';
import { SocialMediaPage } from './components/SocialMediaPage';
import { SettingsPage } from './components/SettingsPage';
import { ChangePasswordPage } from './components/ChangePasswordPage';
import { PlaceholderPage } from './components/PlaceholderPage';
import { FinancePayrollPage } from './components/FinancePayrollPage';
import { FinanceStatusPajakPage } from './components/FinanceStatusPajakPage';
import { FinanceKategoriReimbursementPage } from './components/FinanceKategoriReimbursementPage';
import { FinanceReimbursementPage } from './components/FinanceReimbursementPage';
import { FinanceDetailTargetPage } from './components/FinanceDetailTargetPage';
import { FinanceTargetPage } from './components/FinanceTargetPage';
import { FinancePengajuanPage } from './components/FinancePengajuanPage';
import { FinanceKasbonPage } from './components/FinanceKasbonPage';
import { FinancePajakPage } from './components/FinancePajakPage';
import FinanceSalarySlipPage from './components/FinanceSalarySlipPage';
import { cn } from './lib/utils';

import { Page, PAGE_TO_PATH, PATH_TO_PAGE } from './lib/routes';


export function AdminRouter({ user, handleLogout, settingsFromApp }: { user: any, handleLogout: () => void, settingsFromApp?: any }) {
  const navigate = useNavigate();
  const location = useLocation();

  const pathParts = location.pathname.split('/').filter(Boolean);
  const baseSegment = pathParts[0] ? `/${pathParts[0]}` : '/dashboard';
  // Check if baseSegment exists within valid routes, if not fallback to dashboard
  const isKnownRoute = !!PATH_TO_PAGE[baseSegment];
  const activeBaseSegment = isKnownRoute ? baseSegment : '/dashboard';

  const paramParts = pathParts.slice(isKnownRoute ? 1 : 0); // Preserve parameters
  const paramSegment = paramParts.length > 0 ? `/${paramParts.join('/')}` : '';

  // Derive currentPage from the URL path
  const currentPage: Page = PATH_TO_PAGE[activeBaseSegment] || 'dashboard';

  // Navigate helper that updates the URL
  const setCurrentPage = useCallback((page: Page) => {
    // Navigate without params by default when clicking sidebar
    navigate(`${PAGE_TO_PATH[page] || '/dashboard'}`);
  }, [navigate]);

  const hasPermission = (permission: string) => {
    if (user?.is_admin === 'admin') return true;
    const perms = user?.permissions || [];
    return perms.includes(permission) || perms.some((p: any) => p.name === permission);
  };

  const isAdmin = user?.is_admin === 'admin';
  const isSuperAdmin = isAdmin; // Standard admin now sees everything

  // Backwards compatibility for the existing isWorker logic if needed, 
  // though App.tsx already handles the split between Mobile and Admin
  const isWorker = user?.is_admin !== 'admin';
  const [isAbsensiOpen, setIsAbsensiOpen] = useState(true);
  const [isOvertimeOpen, setIsOvertimeOpen] = useState(false);
  const [isVisitOpen, setIsVisitOpen] = useState(false);
  const [isFinanceOpen, setIsFinanceOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [navFilters, setNavFilters] = useState<Record<string, string>>({});

  const [profileMenuRef, setProfileMenuRef] = useState<HTMLDivElement | null>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [previewNotifications, setPreviewNotifications] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day' | 'list'>('month');
  const [settings, setSettings] = useState<any>(settingsFromApp || null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (settingsFromApp) {
      setSettings(settingsFromApp);
    }
  }, [settingsFromApp]);

  const fetchUnreadCount = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/notifications?notifiable_id=${user.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();
      if (json.success) {
        const raw = json.data || [];
        setPreviewNotifications(raw.slice(0, 10)); // Keep latest 10 for preview

        const count = raw.filter((n: any) => Number(n.notifiable_id) === Number(user.id)).length;
        setUnreadCount(count);
      }
    } catch (err) {
      console.error('Error fetching notification count:', err);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`${import.meta.env.VITE_API_MEANDPAY}/notifications/${id}/clear`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      fetchUnreadCount();
    } catch (err) {
      console.error('Error clearing notification:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      // Refetch every 2 minutes or when switching pages to keep it semi-sync
      const interval = setInterval(fetchUnreadCount, 120000);
      return () => clearInterval(interval);
    }
  }, [user, currentPage]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef && !profileMenuRef.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileMenuRef]);

  useEffect(() => {
    if (['attendance', 'absen', 'data-attendance', 'attendance-dinas', 'data-dinas'].includes(currentPage)) {
      setIsAbsensiOpen(true);
    } else if (['overtime-entry', 'overtime-data'].includes(currentPage)) {
      setIsOvertimeOpen(true);
    } else if (['visit-dokter', 'visit-kunjungan', 'visit-penugasan', 'visit-rapat', 'kinerja-jenis', 'kinerja-laporan', 'kinerja-pegawai', 'kinerja-laporan-kerja'].includes(currentPage)) {
      setIsVisitOpen(true);
    } else if (['finance-payroll', 'finance-pajak', 'finance-kasbon', 'finance-reimbursement', 'finance-kategori-reimbursement', 'finance-pengajuan', 'finance-status-pajak', 'finance-target-kinerja', 'finance-detail-target'].includes(currentPage)) {
      setIsFinanceOpen(true);
    }
  }, [currentPage]);


  useEffect(() => {
    if (user) {
      if (!settingsFromApp) fetchSettings();
    }
  }, [user, settingsFromApp]);



  const fetchSettings = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/settings/1`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();
      if (json.success) {
        setSettings(Array.isArray(json.data) ? json.data[0] : json.data);
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
    }
  };

  const getFileUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('blob:')) return path;
    let cleanPath = path.replace(/^\//, '');
    if (cleanPath.startsWith('uploads/')) cleanPath = cleanPath.slice(8);
    return `https://rsthb.id/apihris/uploads/${cleanPath}`;
  };

  const fetchDashboardStats = async (month?: number, year?: number) => {
    try {
      let url = `${import.meta.env.VITE_API_MEANDPAY}/dashboard/stats`;
      if (month !== undefined && year !== undefined) {
        url += `?month=${month + 1}&year=${year}`;
      }
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const j = await res.json();
      if (j.success) setDashboardStats(j.data);
    } catch (e) {
      console.error('Error dashboard stats:', e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardStats(calendarDate.getMonth(), calendarDate.getFullYear());
    }
  }, [user, calendarDate]);
  function HRStatCard({ title, value, icon: Icon, color, bg }: { key?: string, title: string, value: string, icon: any, color: string, bg: string }) {
    return (
      <motion.div
        whileHover={{ y: -6, scale: 1.01 }}
        className="bg-white p-6 rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/20 flex flex-col items-center text-center group transition-all w-64 shrink-0 snap-start relative overflow-hidden cursor-pointer"
      >
        {/* Professional Hover Background Layer */}
        <div className="absolute inset-0 bg-[#2D455C] opacity-0 group-hover:opacity-100 transition-all duration-400 pointer-events-none" />

        {/* Decorative Radial Elements (Circles) */}
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 delay-75 ease-out" />
        <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 delay-150 ease-out" />

        {/* Content Container */}
        <div className="relative z-10 flex flex-col items-center w-full">
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all duration-500 shadow-inner group-hover:rotate-12 group-hover:scale-110",
            bg, color, "group-hover:bg-white/10 group-hover:text-white"
          )}>
            <Icon className="w-7 h-7" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 group-hover:text-slate-200 transition-colors duration-300">
            {title}
          </p>
          <h3 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-white transition-colors duration-300">
            {value}
          </h3>
        </div>
      </motion.div>
    );
  }

  function StatsCarousel({ dashboardStats }: { dashboardStats: any }) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
      if (!scrollRef.current) return;
      const cardWidth = 256 + 24; // w-64 (256px) + gap-6 (24px)
      const scrollAmount = cardWidth * 2;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    };

    const cards = [
      <HRStatCard key="staff" title="Total Pegawai" value={dashboardStats?.total_pegawai || '0'} icon={Users} color="text-orange-600" bg="bg-orange-50" />,
      <HRStatCard key="masuk" title="Masuk" value={dashboardStats?.attendance?.masuk || '0'} icon={Database} color="text-emerald-600" bg="bg-emerald-50" />,
      <HRStatCard key="alfa" title="Alfa" value={dashboardStats?.attendance?.alfa || '0'} icon={UserX} color="text-rose-600" bg="bg-rose-50" />,
      <HRStatCard key="cuti" title="Cuti" value={dashboardStats?.attendance?.cuti || '0'} icon={CalendarIcon} color="text-amber-600" bg="bg-amber-50" />,
      <HRStatCard key="izin" title="Izin" value={dashboardStats?.attendance?.izin || '0'} icon={FileCheck} color="text-orange-600" bg="bg-orange-50" />,
      <HRStatCard key="sakit" title="Sakit" value={dashboardStats?.attendance?.sakit || '0'} icon={Activity} color="text-rose-600" bg="bg-rose-50" />,
      <HRStatCard key="lembur" title="Lembur" value={dashboardStats?.attendance?.lembur || '0'} icon={Clock} color="text-emerald-600" bg="bg-emerald-50" />,
      <HRStatCard key="telat" title="Izin Telat" value={dashboardStats?.attendance?.izin_telat || '0'} icon={AlertCircle} color="text-orange-600" bg="bg-orange-50" />,
      <HRStatCard key="pc" title="Izin Pulang Cepat" value={dashboardStats?.attendance?.izin_pulang_cepat || '0'} icon={LogOut} color="text-blue-600" bg="bg-blue-50" />,
      <HRStatCard
        key="payroll"
        title={`Payroll ${dashboardStats?.finance?.month} ${dashboardStats?.finance?.year}`}
        value={`Rp ${Number(dashboardStats?.finance?.payroll || 0).toLocaleString('id-ID')}`}
        icon={DollarSign} color="text-orange-600" bg="bg-orange-50"
      />,
      <HRStatCard
        key="kasbon"
        title={`Kasbon ${dashboardStats?.finance?.month} ${dashboardStats?.finance?.year}`}
        value={`Rp ${Number(dashboardStats?.finance?.kasbon || 0).toLocaleString('id-ID')}`}
        icon={Wallet} color="text-amber-600" bg="bg-amber-50"
      />,
      <HRStatCard
        key="reim"
        title={`Reimbursement ${dashboardStats?.finance?.month} ${dashboardStats?.finance?.year}`}
        value={`Rp ${Number(dashboardStats?.finance?.reimbursement || 0).toLocaleString('id-ID')}`}
        icon={Receipt} color="text-emerald-600" bg="bg-emerald-50"
      />
    ];

    // Triple duplication for seamless infinite scroll
    const items = [...cards, ...cards, ...cards];

    const handleScroll = () => {
      if (!scrollRef.current) return;
      const { scrollLeft, scrollWidth } = scrollRef.current;
      const singleSetWidth = scrollWidth / 3;

      if (scrollLeft <= 1) {
        scrollRef.current.scrollLeft = singleSetWidth + 1;
      } else if (scrollLeft >= singleSetWidth * 2 - 2) {
        scrollRef.current.scrollLeft = singleSetWidth - 2;
      }
    };

    useEffect(() => {
      if (scrollRef.current) {
        const singleSetWidth = scrollRef.current.scrollWidth / 3;
        scrollRef.current.scrollLeft = singleSetWidth;
      }
    }, [dashboardStats]);

    return (
      <div className="relative group/carousel">
        {/* Navigation Buttons */}
        <button
          onClick={() => scroll('left')}
          className="absolute -left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-[#F97316] text-white rounded-full shadow-xl shadow-orange-500/40 flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-all hover:scale-110 active:scale-95 translate-x-4 group-hover/carousel:translate-x-0"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={() => scroll('right')}
          className="absolute -right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-[#F97316] text-white rounded-full shadow-xl shadow-orange-500/40 flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-all hover:scale-110 active:scale-95 -translate-x-4 group-hover/carousel:translate-x-0"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-6 px-4"
        >
          <div className="flex gap-6 pb-2 w-max px-4">
            {items}
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="h-screen flex bg-[#F8FAFC] overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarCollapsed ? 100 : 288 }}
        className="bg-[#1A1C1E] text-white flex flex-col sticky top-0 h-screen overflow-hidden shadow-[20px_0_40px_rgba(0,0,0,0.2)] z-50 shrink-0 border-r border-white/5"
      >
        {/* Fixed Header */}
        <div className={cn("p-8 flex items-center transition-all duration-300 shrink-0", isSidebarCollapsed ? "justify-center" : "gap-4")}>
          <div className="w-12 h-12 flex items-center justify-center shrink-0">
            <img
              src={settings?.logo ? getFileUrl(settings.logo) : "https://picsum.photos/seed/logo/64/64"}
              alt="Logo"
              className="w-10 h-10 object-contain"
            />
          </div>
          {!isSidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <span className="text-2xl font-black tracking-tighter block bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent italic">
                {settings?.name?.split(' ')[0] || 'HRIS'}
              </span>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] -mt-1 block">
                {settings?.name?.split(' ').slice(1).join(' ') || '---------------'}
              </span>
            </motion.div>
          )}
        </div>

        {/* Scrollable Menu */}
        <div className="px-4 py-2 flex-1 overflow-y-auto scrollbar-hide">
          <div className="mb-4 px-4">
            {!isSidebarCollapsed && <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Main Menusss</p>}
          </div>
          <nav className="space-y-1.5">
            <SidebarItem
              icon={LayoutDashboard}
              label="Dashboard"
              active={currentPage === 'dashboard'}
              collapsed={isSidebarCollapsed}
              onClick={() => setCurrentPage('dashboard')}
            />
            <SidebarItem
              icon={Bell}
              label="Notifications"
              active={currentPage === 'notifications'}
              collapsed={isSidebarCollapsed}
              onClick={() => setCurrentPage('notifications')}
              badge={unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount.toString()) : undefined}
            />
            <SidebarItem
              icon={User}
              label="My Profile"
              active={currentPage === 'profile'}
              collapsed={isSidebarCollapsed}
              onClick={() => setCurrentPage('profile')}
            />

            {isAdmin && (
              <>
                {hasPermission('pegawai.view') && (
                  <SidebarItem
                    icon={Users}
                    label="Pegawai"
                    active={currentPage === 'employees'}
                    collapsed={isSidebarCollapsed}
                    onClick={() => setCurrentPage('employees')}
                  />
                )}
                {hasPermission('pegawai.view') && (
                  <SidebarItem
                    icon={Users}
                    label="Semua Pegawai"
                    active={currentPage === 'all-employees'}
                    collapsed={isSidebarCollapsed}
                    onClick={() => setCurrentPage('all-employees')}
                  />
                )}
                {hasPermission('pegawai.view') && (
                  <SidebarItem
                    icon={Stethoscope}
                    label="Data Dokter"
                    active={currentPage === 'doctors'}
                    collapsed={isSidebarCollapsed}
                    onClick={() => setCurrentPage('doctors')}
                  />
                )}
                {hasPermission('exit.view') && (
                  <SidebarItem
                    icon={UserMinus}
                    label="Pegawai Keluar"
                    active={currentPage === 'resignations'}
                    collapsed={isSidebarCollapsed}
                    onClick={() => setCurrentPage('resignations')}
                  />
                )}
                {hasPermission('role.view') && (
                  <SidebarItem
                    icon={ShieldCheck}
                    label="Role"
                    active={currentPage === 'roles'}
                    collapsed={isSidebarCollapsed}
                    onClick={() => setCurrentPage('roles')}
                  />
                )}
                {hasPermission('kontrak.view') && (
                  <SidebarItem
                    icon={FileText}
                    label="Kontrak"
                    active={currentPage === 'contracts'}
                    collapsed={isSidebarCollapsed}
                    onClick={() => setCurrentPage('contracts')}
                  />
                )}

                {hasPermission('shift.view') && (
                  <SidebarItem
                    icon={Clock}
                    label="Shift"
                    active={currentPage === 'shift'}
                    collapsed={isSidebarCollapsed}
                    onClick={() => setCurrentPage('shift')}
                  />
                )}
                {hasPermission('jabatan.view') && (
                  <SidebarItem
                    icon={Briefcase}
                    label="Divisi"
                    active={currentPage === 'divisions'}
                    collapsed={isSidebarCollapsed}
                    onClick={() => setCurrentPage('divisions')}
                  />
                )}
                {hasPermission('lokasi-kantor.view') && (
                  <SidebarItem
                    icon={MapPin}
                    label="Lokasi"
                    active={currentPage === 'locations'}
                    collapsed={isSidebarCollapsed}
                    onClick={() => setCurrentPage('locations')}
                  />
                )}
                {hasPermission('rekap-data.view') && (
                  <SidebarItem
                    icon={Database}
                    label="Rekap Data"
                    active={currentPage === 'data-recap'}
                    collapsed={isSidebarCollapsed}
                    onClick={() => setCurrentPage('data-recap')}
                  />
                )}
                {hasPermission('data-cuti.view') && (
                  <SidebarItem
                    icon={CalendarIcon}
                    label="Cuti"
                    active={currentPage === 'leave'}
                    collapsed={isSidebarCollapsed}
                    onClick={() => setCurrentPage('leave')}
                  />
                )}
              </>
            )}

            {/* Expandable Absensi */}
            <div className="px-0 relative">
              <button
                onClick={() => !isSidebarCollapsed && setIsAbsensiOpen(!isAbsensiOpen)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all group relative overflow-hidden",
                  ['attendance', 'data-attendance', 'attendance-dinas', 'data-dinas'].includes(currentPage)
                    ? "bg-white/10 text-white shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]"
                    : "text-white/40 hover:text-white hover:bg-white/5",
                  isSidebarCollapsed ? "justify-center" : ""
                )}
              >
                {['attendance', 'absen', 'data-attendance', 'attendance-dinas', 'data-dinas'].includes(currentPage) && (
                  <motion.div layoutId="active-pill" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#F97316] rounded-r-full shadow-[0_0_15px_rgba(249,115,22,0.8)]" />
                )}
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                    ['attendance', 'absen', 'data-attendance', 'attendance-dinas', 'data-dinas'].includes(currentPage) ? "bg-[#F97316]/20 shadow-inner" : "bg-white/5 group-hover:bg-white/10"
                  )}>
                    <Clock className={cn("w-4 h-4 transition-colors", ['attendance', 'absen', 'data-attendance', 'attendance-dinas', 'data-dinas'].includes(currentPage) ? "text-[#F97316]" : "text-white/40 group-hover:text-white")} />
                  </div>
                  {!isSidebarCollapsed && <span>Absensi</span>}
                </div>
                {!isSidebarCollapsed && <ChevronDown className={cn("w-4 h-4 transition-transform duration-300 opacity-40 group-hover:opacity-100", isAbsensiOpen ? "rotate-180" : "")} />}
              </button>

              <AnimatePresence>
                {isAbsensiOpen && !isSidebarCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-1 space-y-1 ml-4 border-l border-white/5"
                  >
                    <SidebarSubItem label="Absen Masuk/Pulang" onClick={() => setCurrentPage('absen')} active={currentPage === 'absen' || location.pathname === '/absen_admin'} />

                    <SidebarSubItem label="Riwayat Absen" onClick={() => setCurrentPage('attendance')} active={currentPage === 'attendance'} />
                    {hasPermission('data-absen.view') && <SidebarSubItem label="Data Absen" onClick={() => setCurrentPage('data-attendance')} active={currentPage === 'data-attendance'} />}
                    {hasPermission('dinas-luar.view') && <SidebarSubItem label="Absen Dinas" onClick={() => setCurrentPage('attendance-dinas')} active={currentPage === 'attendance-dinas'} />}
                    {hasPermission('data-dinas-luar.view') && <SidebarSubItem label="Data Dinas" onClick={() => setCurrentPage('data-dinas')} active={currentPage === 'data-dinas'} />}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Expandable Overtime (Visible for everyone to entry, but Data might be restricted?) */}
            {/* Keeping it simple for now as it's entry based */}
            <div className="px-0 relative">
              <button
                onClick={() => !isSidebarCollapsed && setIsOvertimeOpen(!isOvertimeOpen)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all group relative overflow-hidden",
                  ['overtime-entry', 'overtime-data'].includes(currentPage)
                    ? "bg-white/10 text-white shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]"
                    : "text-white/40 hover:text-white hover:bg-white/5",
                  isSidebarCollapsed ? "justify-center" : ""
                )}
              >
                {['overtime-entry', 'overtime-data'].includes(currentPage) && (
                  <motion.div layoutId="active-pill" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#F97316] rounded-r-full shadow-[0_0_15px_rgba(249,115,22,0.8)]" />
                )}
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                    ['overtime-entry', 'overtime-data'].includes(currentPage) ? "bg-[#F97316]/20 shadow-inner" : "bg-white/5 group-hover:bg-white/10"
                  )}>
                    <TrendingUp className={cn("w-4 h-4 transition-colors", ['overtime-entry', 'overtime-data'].includes(currentPage) ? "text-[#F97316]" : "text-white/40 group-hover:text-white")} />
                  </div>
                  {!isSidebarCollapsed && <span>Overtime</span>}
                </div>
                {!isSidebarCollapsed && <ChevronDown className={cn("w-4 h-4 transition-transform duration-300 opacity-40 group-hover:opacity-100", isOvertimeOpen ? "rotate-180" : "")} />}
              </button>

              <AnimatePresence>
                {isOvertimeOpen && !isSidebarCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-1 space-y-1 ml-4 border-l border-white/5"
                  >
                    <SidebarSubItem label="Lembur" onClick={() => setCurrentPage('overtime-entry')} active={currentPage === 'overtime-entry'} />
                    <SidebarSubItem label="Data Lembur" onClick={() => setCurrentPage('overtime-data')} active={currentPage === 'overtime-data'} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Expandable Visit & Kinerja */}
            <div className="px-0 relative">
              <button
                onClick={() => !isSidebarCollapsed && setIsVisitOpen(!isVisitOpen)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all group relative overflow-hidden",
                  ['visit', 'visit-dokter', 'visit-kunjungan', 'visit-penugasan', 'visit-rapat', 'kinerja-jenis', 'kinerja-laporan', 'kinerja-pegawai', 'kinerja-laporan-kerja'].includes(currentPage)
                    ? "bg-white/10 text-white shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]"
                    : "text-white/40 hover:text-white hover:bg-white/5",
                  isSidebarCollapsed ? "justify-center" : ""
                )}
              >
                {['visit', 'visit-dokter', 'visit-kunjungan', 'visit-penugasan', 'visit-rapat', 'kinerja-jenis', 'kinerja-laporan', 'kinerja-pegawai', 'kinerja-laporan-kerja'].includes(currentPage) && (
                  <motion.div layoutId="active-pill" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#F97316] rounded-r-full shadow-[0_0_15px_rgba(249,115,22,0.8)]" />
                )}
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                    ['visit', 'visit-dokter', 'visit-kunjungan', 'visit-penugasan', 'visit-rapat', 'kinerja-jenis', 'kinerja-laporan', 'kinerja-pegawai', 'kinerja-laporan-kerja'].includes(currentPage) ? "bg-[#F97316]/20 shadow-inner" : "bg-white/5 group-hover:bg-white/10"
                  )}>
                    <Activity className={cn("w-4 h-4 transition-colors", ['visit', 'visit-dokter', 'visit-kunjungan', 'visit-penugasan', 'visit-rapat', 'kinerja-jenis', 'kinerja-laporan', 'kinerja-pegawai', 'kinerja-laporan-kerja'].includes(currentPage) ? "text-[#F97316]" : "text-white/40 group-hover:text-white")} />
                  </div>
                  {!isSidebarCollapsed && <span>Visit & Kinerja</span>}
                </div>
                {!isSidebarCollapsed && <ChevronDown className={cn("w-4 h-4 transition-transform duration-300 opacity-40 group-hover:opacity-100", isVisitOpen ? "rotate-180" : "")} />}
              </button>

              <AnimatePresence>
                {isVisitOpen && !isSidebarCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-1 space-y-1 ml-4 border-l border-white/5"
                  >
                    <SidebarSubItem label="Patroli Petugas Security" onClick={() => setCurrentPage('visit-dokter')} active={currentPage === 'visit-dokter'} />
                    <SidebarSubItem label="Kunjungan" onClick={() => setCurrentPage('visit-kunjungan')} active={currentPage === 'visit-kunjungan'} />
                    <SidebarSubItem label="Penugasan" onClick={() => setCurrentPage('visit-penugasan')} active={currentPage === 'visit-penugasan'} />
                    <SidebarSubItem label="Rapat" onClick={() => setCurrentPage('visit-rapat')} active={currentPage === 'visit-rapat'} />
                    <SidebarSubItem label="Jenis Kinerja" onClick={() => setCurrentPage('kinerja-jenis')} active={currentPage === 'kinerja-jenis'} />
                    <SidebarSubItem label="Laporan Kinerja" onClick={() => setCurrentPage('kinerja-laporan')} active={currentPage === 'kinerja-laporan'} />
                    <SidebarSubItem label="Kinerja Pegawai" onClick={() => setCurrentPage('kinerja-pegawai')} active={currentPage === 'kinerja-pegawai'} />
                    <SidebarSubItem label="Laporan Kerja" onClick={() => setCurrentPage('kinerja-laporan-kerja')} active={currentPage === 'kinerja-laporan-kerja'} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {hasPermission('inventory.view') && (
              <SidebarItem
                icon={Package}
                label="Inventory"
                active={currentPage === 'inventory'}
                collapsed={isSidebarCollapsed}
                onClick={() => setCurrentPage('inventory')}
              />
            )}

            {/* Expandable Keuangan & Target */}
            {(hasPermission('payroll.view') || hasPermission('pajak.view') || hasPermission('kasbon.view') || hasPermission('reimbursement.view') || hasPermission('target-kinerja.view')) && (
              <div className="px-0 relative">
                <button
                  onClick={() => !isSidebarCollapsed && setIsFinanceOpen(!isFinanceOpen)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all group relative overflow-hidden",
                    ['finance-payroll', 'finance-pajak', 'finance-kasbon', 'finance-reimbursement', 'finance-kategori-reimbursement', 'finance-pengajuan', 'finance-status-pajak', 'finance-target-kinerja', 'finance-detail-target'].includes(currentPage)
                      ? "bg-white/10 text-white shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]"
                      : "text-white/40 hover:text-white hover:bg-white/5",
                    isSidebarCollapsed ? "justify-center" : ""
                  )}
                >
                  {['finance-payroll', 'finance-pajak', 'finance-kasbon', 'finance-reimbursement', 'finance-kategori-reimbursement', 'finance-pengajuan', 'finance-status-pajak', 'finance-target-kinerja', 'finance-detail-target'].includes(currentPage) && (
                    <motion.div layoutId="active-pill" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#F97316] rounded-r-full shadow-[0_0_15px_rgba(249,115,22,0.8)]" />
                  )}
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                      ['finance-payroll', 'finance-pajak', 'finance-kasbon', 'finance-reimbursement', 'finance-kategori-reimbursement', 'finance-pengajuan', 'finance-status-pajak', 'finance-target-kinerja', 'finance-detail-target'].includes(currentPage) ? "bg-[#F97316]/20 shadow-inner" : "bg-white/5 group-hover:bg-white/10"
                    )}>
                      <DollarSign className={cn("w-4 h-4 transition-colors", ['finance-payroll', 'finance-pajak', 'finance-kasbon', 'finance-reimbursement', 'finance-kategori-reimbursement', 'finance-pengajuan', 'finance-status-pajak', 'finance-target-kinerja', 'finance-detail-target'].includes(currentPage) ? "text-[#F97316]" : "text-white/40 group-hover:text-white")} />
                    </div>
                    {!isSidebarCollapsed && <span>Keuangan & Target</span>}
                  </div>
                  {!isSidebarCollapsed && <ChevronDown className={cn("w-4 h-4 transition-transform duration-300 opacity-40 group-hover:opacity-100", isFinanceOpen ? "rotate-180" : "")} />}
                </button>

                <AnimatePresence>
                  {isFinanceOpen && !isSidebarCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-1 space-y-1 ml-4 border-l border-white/5"
                    >
                      {hasPermission('payroll.view') && <SidebarSubItem label="Payroll" onClick={() => setCurrentPage('finance-payroll')} active={currentPage === 'finance-payroll'} />}
                      {hasPermission('pajak.view') && <SidebarSubItem label="Pajak" onClick={() => setCurrentPage('finance-pajak')} active={currentPage === 'finance-pajak'} />}
                      {hasPermission('kasbon.view') && <SidebarSubItem label="Kasbon" onClick={() => setCurrentPage('finance-kasbon')} active={currentPage === 'finance-kasbon'} />}
                      {hasPermission('reimbursement.view') && <SidebarSubItem label="Reimbursement" onClick={() => setCurrentPage('finance-reimbursement')} active={currentPage === 'finance-reimbursement'} />}
                      {hasPermission('kategori.view') && <SidebarSubItem label="Kategori Reimbursement" onClick={() => setCurrentPage('finance-kategori-reimbursement')} active={currentPage === 'finance-kategori-reimbursement'} />}
                      {hasPermission('list-pengajuan-keuangan.view') && <SidebarSubItem label="Penyesuaian Gaji" onClick={() => setCurrentPage('finance-pengajuan')} active={currentPage === 'finance-pengajuan'} />}
                      {hasPermission('status-pajak.view') && <SidebarSubItem label="Status Pajak" onClick={() => setCurrentPage('finance-status-pajak')} active={currentPage === 'finance-status-pajak'} />}
                      {hasPermission('target-kinerja.view') && <SidebarSubItem label="Target Kinerja" onClick={() => setCurrentPage('finance-target-kinerja')} active={currentPage === 'finance-target-kinerja'} />}
                      {hasPermission('detail-target-kinerja.view') && <SidebarSubItem label="Detail Target" onClick={() => setCurrentPage('finance-detail-target')} active={currentPage === 'finance-detail-target'} />}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <SidebarItem
              icon={FileText}
              label="Dokumen Pegawai"
              active={currentPage === 'documents'}
              collapsed={isSidebarCollapsed}
              onClick={() => setCurrentPage('documents')}
            />
            <SidebarItem
              icon={Share2}
              label="Manajemen Sosial Media"
              active={currentPage === 'social-media'}
              collapsed={isSidebarCollapsed}
              onClick={() => setCurrentPage('social-media')}
            />
            <SidebarItem
              icon={Settings}
              label="Settings"
              active={currentPage === 'settings'}
              collapsed={isSidebarCollapsed}
              onClick={() => setCurrentPage('settings')}
            />
          </nav>
        </div>

        {/* Fixed Footer */}
        <div className="p-6 border-t border-white/5 shrink-0 bg-[#1A1C1E]">
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-sm font-bold text-white/40 hover:bg-rose-500/10 hover:text-rose-400 transition-all group relative overflow-hidden",
              isSidebarCollapsed ? "justify-center" : ""
            )}
          >
            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-rose-500/20 transition-colors shrink-0 border border-white/5 group-hover:border-rose-500/20">
              <LogOut className="w-4 h-4" />
            </div>
            {!isSidebarCollapsed && <span className="tracking-tight">Sign Out</span>}
            {!isSidebarCollapsed && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-4 h-4" />
              </div>
            )}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F8FAFC]">
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 flex items-center justify-between px-10 shrink-0 z-40">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 transition-all active:scale-90 shadow-sm"
            >
              {isSidebarCollapsed ? <ChevronRightCircle className="w-6 h-6" /> : <ChevronLeftCircle className="w-6 h-6" />}
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage('dashboard')}
                className={cn(
                  "px-6 py-3 rounded-2xl text-sm font-black transition-all active:scale-95 uppercase tracking-widest",
                  currentPage === 'dashboard'
                    ? "bg-[#F97316] text-white shadow-[0_10px_20px_rgba(249,115,22,0.3)] hover:bg-[#EA580C]"
                    : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
                )}
              >
                Dashboard
              </button>

            </div>
          </div>

          <div className="flex items-center gap-8">


            <div className="flex items-center gap-4">
              <div className="relative" ref={bellRef}>
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className={cn(
                    "p-3 rounded-2xl transition-all relative group border shadow-sm",
                    isNotificationsOpen || currentPage === 'notifications'
                      ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                      : "bg-white border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50"
                  )}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-[0_4px_12px_rgba(244,63,94,0.4)]">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {isNotificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full pt-3 w-80 sm:w-96 z-50"
                    >
                      <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                          <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase">NOTIFIKASI</h3>
                          {unreadCount > 0 && <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">{unreadCount} UNREAD</span>}
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                          {previewNotifications.length > 0 ? (
                            previewNotifications.map((n, i) => {
                              let d: any = {};
                              try { d = typeof n.data === 'string' ? JSON.parse(n.data) : n.data; } catch (_) { }
                              const isUnread = Number(n.notifiable_id) === Number(user.id);
                              return (
                                <button
                                  key={n.id}
                                  onClick={() => {
                                    handleMarkRead(n.id);
                                    setIsNotificationsOpen(false);
                                    setCurrentPage('notifications');
                                  }}
                                  className={cn(
                                    "w-full p-4 flex gap-4 text-left border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-all",
                                    isUnread ? "bg-indigo-50/20" : ""
                                  )}
                                >
                                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                                    <Bell className="w-4 h-4 text-indigo-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={cn("text-xs font-bold truncate mb-0.5", isUnread ? "text-slate-900" : "text-slate-500")}>
                                      {d.from || 'System'}
                                    </p>
                                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                                      {d.message || 'New notification'}
                                    </p>
                                    <p className="text-[9px] text-slate-300 mt-2 font-medium">
                                      {new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                  {isUnread && <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 shadow-[0_0_8px_rgba(79,70,229,0.4)]"></div>}
                                </button>
                              );
                            })
                          ) : (
                            <div className="py-12 text-center text-slate-300">
                              <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                              <p className="text-xs font-bold uppercase tracking-widest">No notifications</p>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => { setIsNotificationsOpen(false); setCurrentPage('notifications'); }}
                          className="w-full p-4 text-[10px] font-black text-indigo-600 uppercase tracking-widest text-center bg-slate-50/50 hover:bg-slate-50 transition-all"
                        >
                          Lihat Semua Notifikasi
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="h-8 w-px bg-slate-200 mx-2"></div>

              <div
                className="relative cursor-pointer"
                ref={setProfileMenuRef}
                onMouseEnter={() => setIsProfileMenuOpen(true)}
                onMouseLeave={() => setIsProfileMenuOpen(false)}
              >
                <div
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-4 pl-2 group"
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-black text-slate-900 leading-none group-hover:text-indigo-600 transition-colors tracking-tight">{user?.name || 'Super Admin'}</p>
                    <p className="text-[9px] text-indigo-500 font-black mt-1.5 uppercase tracking-[0.2em]">{user?.jabatan?.nama_jabatan || user?.roles?.[0] || 'Member Access'}</p>
                  </div>
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 border-2 border-white shadow-xl overflow-hidden group-hover:scale-105 transition-transform group-hover:rotate-2">
                      <img src="https://picsum.photos/seed/admin/120/120" alt="Admin" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-lg"></div>
                  </div>
                </div>

                <AnimatePresence>
                  {isProfileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full pt-3 w-56 z-50"
                    >
                      <div className="bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                        <div className="p-4 border-b border-slate-50">
                          <p className="text-sm font-black text-slate-800 tracking-tight">{user?.name || 'Super Admin'}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{user?.roles?.name || 'Admin'}</p>
                        </div>
                        <div className="py-2">
                          <button
                            onClick={() => { setCurrentPage('profile'); setIsProfileMenuOpen(false); }}
                            className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                          >
                            <User className="w-4 h-4" />
                            Account
                          </button>
                          <button
                            onClick={() => { setCurrentPage('change-password'); setIsProfileMenuOpen(false); }}
                            className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                          >
                            <Lock className="w-4 h-4" />
                            Change Password
                          </button>
                        </div>
                        <div className="border-t border-slate-50 py-2">
                          <button
                            onClick={() => { handleLogout(); setIsProfileMenuOpen(false); }}
                            className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-rose-500 hover:bg-rose-50 transition-all"
                          >
                            <LogOut className="w-4 h-4" />
                            Log Out
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-10 space-y-10 pb-32">
          <AnimatePresence mode="wait">
            {currentPage === 'dashboard' ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-12"
              >
                {/* Stats Carousel */}
                <StatsCarousel dashboardStats={dashboardStats} />

                {/* Calendar Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden"
                >
                  <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                      <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50">
                        <button
                          onClick={() => {
                            const newDate = new Date(calendarDate);
                            newDate.setMonth(newDate.getMonth() - 1);
                            setCalendarDate(newDate);
                          }}
                          className="p-3 hover:bg-white hover:shadow-md rounded-xl text-slate-600 transition-all hover:text-indigo-600 active:scale-90"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            const newDate = new Date(calendarDate);
                            newDate.setMonth(newDate.getMonth() + 1);
                            setCalendarDate(newDate);
                          }}
                          className="p-3 hover:bg-white hover:shadow-md rounded-xl text-slate-600 transition-all hover:text-indigo-600 active:scale-90"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                      <button
                        onClick={() => setCalendarDate(new Date())}
                        className="px-8 py-3.5 bg-slate-900 hover:bg-black text-white rounded-2xl text-xs font-black transition-all active:scale-95 shadow-lg shadow-slate-200"
                      >
                        Today
                      </button>
                    </div>

                    <div className="text-center">
                      <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-none">
                        {calendarView === 'month' ? (
                          new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(calendarDate)
                        ) : calendarView === 'week' ? (
                          (() => {
                            const start = new Date(calendarDate);
                            start.setDate(start.getDate() - start.getDay());
                            const end = new Date(start);
                            end.setDate(end.getDate() + 6);
                            return `${new Intl.DateTimeFormat('id-ID', { month: 'short', day: 'numeric' }).format(start)} - ${end.getDate()}, ${end.getFullYear()}`;
                          })()
                        ) : calendarView === 'day' ? (
                          new Intl.DateTimeFormat('id-ID', { month: 'long', day: 'numeric', year: 'numeric' }).format(calendarDate)
                        ) : (
                          "Upcoming Events"
                        )}
                      </h2>
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mt-3">Attendance & Events Calendar</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50">
                        <CalendarViewButton label="Month" active={calendarView === 'month'} onClick={() => setCalendarView('month')} />
                        <CalendarViewButton label="Week" active={calendarView === 'week'} onClick={() => setCalendarView('week')} />
                        <CalendarViewButton label="Day" active={calendarView === 'day'} onClick={() => setCalendarView('day')} />
                        <CalendarViewButton label="List" active={calendarView === 'list'} onClick={() => setCalendarView('list')} />
                      </div>
                    </div>
                  </div>
                  <div className="p-0 overflow-x-auto scrollbar-hide">
                    {calendarView === 'month' ? (
                      <table className="w-full border-collapse min-w-[1000px]">
                        <thead>
                          <tr>
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                              <th key={day} className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-r border-slate-100 bg-slate-50/30 text-left">
                                {day}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const year = calendarDate.getFullYear();
                            const month = calendarDate.getMonth();
                            const firstDay = new Date(year, month, 1).getDay();
                            const daysInMonth = new Date(year, month + 1, 0).getDate();
                            const today = new Date();

                            const rows = [];
                            let dayCount = 1;

                            for (let i = 0; i < 6; i++) {
                              const cells = [];
                              for (let j = 0; j < 7; j++) {
                                const cellIndex = i * 7 + j;
                                if (cellIndex < firstDay || dayCount > daysInMonth) {
                                  cells.push(<td key={j} className="h-44 p-4 border-r border-b border-slate-50 bg-slate-50/10"></td>);
                                } else {
                                  const currentDay = dayCount;
                                  const isToday = today.getDate() === currentDay && today.getMonth() === month && today.getFullYear() === year;
                                  cells.push(
                                    <td key={j} className={cn(
                                      "h-44 p-4 border-r border-b border-slate-100 align-top transition-all relative group cursor-pointer",
                                      isToday ? "bg-indigo-50/30" : "hover:bg-slate-50/50"
                                    )}>
                                      <div className="flex justify-between items-center mb-3">
                                        <span className={cn(
                                          "text-sm font-black transition-colors",
                                          isToday ? "text-indigo-600" : "text-slate-300 group-hover:text-slate-900"
                                        )}>
                                          {currentDay.toString().padStart(2, '0')}
                                        </span>
                                        <button className="p-1 hover:bg-white rounded-lg transition-all">
                                          <Plus className="w-3 h-3" />
                                        </button>
                                      </div>

                                      {/* Dynamic Events from Backend */}
                                      <div className="space-y-1.5">
                                        {dashboardStats?.calendar_events?.filter((e: any) => {
                                          const eventDate = new Date(e.date);
                                          return eventDate.getDate() === currentDay;
                                        }).map((evt: any, idx: number) => (
                                          <CalendarEvent key={idx} label={evt.label} color={evt.color} />
                                        ))}
                                      </div>
                                      {isToday && (
                                        <div className="absolute bottom-4 right-4">
                                          <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                                        </div>
                                      )}
                                    </td>
                                  );
                                  dayCount++;
                                }
                              }
                              rows.push(<tr key={i}>{cells}</tr>);
                              if (dayCount > daysInMonth) break;
                            }
                            return rows;
                          })()}
                        </tbody>
                      </table>
                    ) : calendarView === 'week' ? (
                      <table className="w-full border-collapse min-w-[1000px]">
                        <thead>
                          <tr>
                            <th className="w-24 p-4 border-b border-r border-slate-100 bg-slate-50/30"></th>
                            {(() => {
                              const start = new Date(calendarDate);
                              start.setDate(start.getDate() - start.getDay());
                              return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => {
                                const d = new Date(start);
                                d.setDate(d.getDate() + idx);
                                return (
                                  <th key={day} className="py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-r border-slate-100 bg-slate-50/30 text-center">
                                    {day} {d.getMonth() + 1}/{d.getDate()}
                                  </th>
                                );
                              });
                            })()}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-100">
                            <td className="p-4 text-[10px] font-black text-slate-400 uppercase border-r border-slate-100 bg-slate-50/10">all-day</td>
                            {(() => {
                              const start = new Date(calendarDate);
                              start.setDate(start.getDate() - start.getDay());
                              return [...Array(7)].map((_, idx) => {
                                const d = new Date(start);
                                d.setDate(d.getDate() + idx);
                                const dayEvents = dashboardStats?.calendar_events?.filter((e: any) => {
                                  const ed = new Date(e.date);
                                  return ed.getDate() === d.getDate() && ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear();
                                }) || [];
                                return (
                                  <td key={idx} className="p-4 border-r border-slate-100 align-top transition-all hover:bg-slate-50/50">
                                    <div className="space-y-1">
                                      {dayEvents.map((evt: any, i: number) => (
                                        <CalendarEvent key={i} label={evt.label} color={evt.color} />
                                      ))}
                                    </div>
                                  </td>
                                );
                              });
                            })()}
                          </tr>
                          {[...Array(24)].map((_, hour) => (
                            <tr key={hour} className="border-b border-slate-50">
                              <td className="p-4 text-[10px] font-black text-slate-400 uppercase border-r border-slate-50 bg-slate-50/5 text-right align-top">
                                {hour === 0 ? '12am' : hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`}
                              </td>
                              {[...Array(7)].map((_, i) => (
                                <td key={i} className="h-12 border-r border-slate-50 transition-all hover:bg-slate-50/30"></td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : calendarView === 'day' ? (
                      <table className="w-full border-collapse min-w-[1000px]">
                        <thead>
                          <tr>
                            <th className="w-24 p-4 border-b border-r border-slate-100 bg-slate-50/30"></th>
                            <th className="py-6 px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-r border-slate-100 bg-slate-50/30 text-center">
                              {new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(calendarDate)}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-100">
                            <td className="p-4 text-[10px] font-black text-slate-400 uppercase border-r border-slate-100 bg-slate-50/10">all-day</td>
                            <td className="p-4 border-r border-slate-100 align-top transition-all hover:bg-slate-50/50">
                              <div className="space-y-1">
                                {dashboardStats?.calendar_events?.filter((e: any) => {
                                  const ed = new Date(e.date);
                                  return ed.getDate() === calendarDate.getDate() && ed.getMonth() === calendarDate.getMonth() && ed.getFullYear() === calendarDate.getFullYear();
                                }).map((evt: any, i: number) => (
                                  <CalendarEvent key={i} label={evt.label} color={evt.color} />
                                ))}
                              </div>
                            </td>
                          </tr>
                          {[...Array(24)].map((_, hour) => (
                            <tr key={hour} className="border-b border-slate-50">
                              <td className="p-4 text-[10px] font-black text-slate-400 uppercase border-r border-slate-50 bg-slate-50/5 text-right align-top">
                                {hour === 0 ? '12am' : hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`}
                              </td>
                              <td className="h-12 border-r border-slate-50 transition-all hover:bg-slate-50/30"></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-8 space-y-6">
                        {(() => {
                          const events = dashboardStats?.calendar_events || [];
                          if (events.length === 0) return <div className="text-center py-10 text-slate-400 font-bold uppercase tracking-widest text-[10px]">No upcoming events for this period</div>;

                          const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                          // Group by date
                          const groups = sortedEvents.reduce((acc: any, e: any) => {
                            const dateStr = new Date(e.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                            if (!acc[dateStr]) acc[dateStr] = [];
                            acc[dateStr].push(e);
                            return acc;
                          }, {});

                          return Object.entries(groups).map(([date, evts]: [any, any]) => (
                            <div key={date} className="space-y-4">
                              <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2">{date}</h3>
                              {evts.map((evt: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-4 group cursor-pointer">
                                  <div className={cn("w-2 h-2 rounded-full", evt.color, "shadow-lg")}></div>
                                  <span className="text-[10px] font-black text-slate-400 w-16 uppercase">all-day</span>
                                  <div className={cn("px-4 py-2 rounded-xl transition-all flex-1 bg-slate-50 group-hover:bg-slate-100")}>
                                    <span className={cn("text-xs font-bold text-slate-700")}>{evt.label}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            ) : currentPage === 'notifications' ? (
              <NotificationsPage
                onNavigate={(page, filters) => {
                  setNavFilters(filters || {});
                  setCurrentPage(page as Page);
                }}
                onRefreshCount={fetchUnreadCount}
              />
            ) : currentPage === 'profile' ? (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <ProfilePage onBack={() => setCurrentPage('dashboard')} />
              </motion.div>
            ) : currentPage === 'employees' ? (
              <EmployeesPage key="employees" />
            ) : currentPage === 'all-employees' ? (
              <AllEmployeesPage key="all-employees" />
            ) : currentPage === 'doctors' ? (
              <AllEmployeesPage key="doctors" initialRole="dokter" />
            ) : currentPage === 'roles' ? (
              <RolesPage key="roles" />
            ) : currentPage === 'contracts' ? (
              <ContractsPage key="contracts" />
            ) : currentPage === 'resignations' ? (
              <ResignationsPage key="resignations" />
            ) : currentPage === 'shift' ? (
              <ShiftPage key="shift" />
            ) : currentPage === 'divisions' ? (
              <DivisionsPage key="divisions" />
            ) : currentPage === 'locations' ? (
              <LocationsPage key="locations" />
            ) : currentPage === 'data-recap' ? (
              <DataRecapPage key="data-recap" onNavigate={(page, filters) => { setNavFilters(filters || {}); setCurrentPage(page as any); }} />
            ) : currentPage === 'leave' ? (
              <LeavePage initialFilters={navFilters} />
            ) : currentPage === 'attendance' ? (
              <AttendancePage key="attendance" />
            ) : currentPage === 'absen' ? (
              <AbsenPage key="absen" />
            ) : currentPage === 'data-attendance' ? (
              <DataAbsenPage key="data-attendance" initialFilters={navFilters} />
            ) : currentPage === 'attendance-dinas' ? (
              <AbsenDinasPage key="attendance-dinas" />
            ) : currentPage === 'data-dinas' ? (
              <DataDinasPage key="data-dinas" initialFilters={navFilters} />
            ) : currentPage === 'overtime' ? (
              <OvertimePage key="overtime" />
            ) : currentPage === 'overtime-entry' ? (
              <OvertimeEntryPage key="overtime-entry" />
            ) : currentPage === 'overtime-data' ? (
              <OvertimeDataPage key="overtime-data" initialFilters={navFilters} />
            ) : currentPage === 'visit' ? (
              <VisitPage key="visit" />
            ) : currentPage === 'visit-dokter' ? (
              <VisitDokterPage key="visit-dokter" />
            ) : currentPage === 'visit-kunjungan' ? (
              <KunjunganPage key="visit-kunjungan" />
            ) : currentPage === 'visit-penugasan' ? (
              <PenugasanKerjaPage key="visit-penugasan" />
            ) : currentPage === 'visit-rapat' ? (
              <RapatPage key="visit-rapat" />
            ) : currentPage === 'kinerja-jenis' ? (
              <JenisKinerjaPage key="kinerja-jenis" />
            ) : currentPage === 'kinerja-laporan' ? (
              <LaporanKinerjaPage key="kinerja-laporan" />
            ) : currentPage === 'kinerja-pegawai' ? (
              <KinerjaPegawaiPage key="kinerja-pegawai" />
            ) : currentPage === 'kinerja-laporan-kerja' ? (
              <LaporanKerjaPage key="kinerja-laporan-kerja" />
            ) : currentPage === 'inventory' ? (
              <InventoryPage key="inventory" />
            ) : currentPage === 'finance' ? (
              <FinancePage key="finance" />
            ) : currentPage === 'finance-payroll' ? (
              <FinancePayrollPage key="finance-payroll" onNavigate={(page, filters) => { setNavFilters(filters || {}); setCurrentPage(page as any); }} initialFilters={navFilters} />
            ) : currentPage === 'finance-pajak' ? (
              <FinancePajakPage key="finance-pajak" />
            ) : currentPage === 'finance-kasbon' ? (
              <FinanceKasbonPage key="finance-kasbon" />
            ) : currentPage === 'finance-reimbursement' ? (
              <FinanceReimbursementPage key="finance-reimbursement" />
            ) : currentPage === 'finance-kategori-reimbursement' ? (
              <FinanceKategoriReimbursementPage key="finance-kategori-reimbursement" />
            ) : currentPage === 'finance-pengajuan' ? (
              <FinancePengajuanPage key="finance-pengajuan" />
            ) : currentPage === 'finance-status-pajak' ? (
              <FinanceStatusPajakPage key="finance-status-pajak" />
            ) : currentPage === 'finance-target-kinerja' ? (
              <FinanceTargetPage key="finance-target-kinerja" />
            ) : currentPage === 'finance-detail-target' ? (
              <FinanceDetailTargetPage key="finance-detail-target" />
            ) : currentPage === 'documents' ? (
              <DocumentsPage key="documents" />
            ) : currentPage === 'change-password' ? (
              <motion.div
                key="change-password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <ChangePasswordPage user={user} onBack={() => setCurrentPage('dashboard')} />
              </motion.div>
            ) : currentPage === 'social-media' ? (
              <SocialMediaPage key="social-media" />
            ) : (
              <SettingsPage key="settings" />
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
function SidebarItem({ icon: Icon, label, active = false, badge = undefined, collapsed = false, onClick, hasChevron = false }: { icon: any, label: string, active?: boolean, badge?: string, collapsed?: boolean, onClick?: () => void, hasChevron?: boolean }) {
  return (
    <div className="px-0 relative">
      <button
        onClick={onClick}
        className={cn(
          "w-full flex items-center px-4 py-3.5 rounded-2xl text-sm font-bold transition-all group relative overflow-hidden",
          active
            ? 'bg-white/10 text-white shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]'
            : 'text-white/40 hover:text-white hover:bg-white/5',
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {active && (
          <motion.div
            layoutId="active-pill"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#F97316] rounded-r-full shadow-[0_0_15px_rgba(249,115,22,0.8)]"
          />
        )}
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
            active ? "bg-[#F97316]/20 shadow-inner" : "bg-white/5 group-hover:bg-white/10"
          )}>
            <Icon className={cn("w-4 h-4 transition-colors shrink-0", active ? "text-[#F97316]" : "text-white/40 group-hover:text-white")} />
          </div>
          {!collapsed && <span className="tracking-tight">{label}</span>}
        </div>
        {!collapsed && (badge || hasChevron) && (
          <div className="flex items-center gap-2">
            {badge && (
              <span className="bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow-lg shadow-rose-500/20">
                {badge}
              </span>
            )}
            {hasChevron && <ChevronRight className="w-3 h-3 opacity-20 group-hover:opacity-100 transition-opacity" />}
          </div>
        )}
      </button>
    </div>
  );
}

function SidebarSubItem({ label, onClick, active }: { label: string, onClick?: () => void, active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-8 py-2.5 text-xs font-bold transition-all relative group",
        active ? "text-[#F97316]" : "text-white/30 hover:text-white"
      )}
    >
      <div className={cn(
        "w-1.5 h-1.5 rounded-full transition-all",
        active ? "bg-[#F97316] shadow-[0_0_8px_rgba(249,115,22,0.8)] scale-125" : "bg-white/10 group-hover:bg-white/30"
      )}></div>
      <span className="tracking-tight">{label}</span>
      {active && (
        <motion.div
          layoutId="sub-active-line"
          className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#F97316] rounded-l-full"
        />
      )}
    </button>
  );
}

function CalendarViewButton({ label, active = false, onClick }: { label: string, active?: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-6 py-2.5 text-xs font-black uppercase tracking-widest transition-all rounded-xl",
        active
          ? "bg-white text-indigo-600 shadow-sm"
          : "text-slate-500 hover:text-slate-900"
      )}>
      {label}
    </button>
  );
}

function CalendarEvent({ label, color }: { key?: any, label: string, color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "px-3 py-2 rounded-xl text-[10px] font-bold text-white truncate shadow-lg shadow-black/5 flex items-center gap-2",
        color
      )}
    >
      <div className="w-1.5 h-1.5 bg-white/40 rounded-full shrink-0"></div>
      {label}
    </motion.div>
  );
}
