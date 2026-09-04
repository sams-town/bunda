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
  Stethoscope,
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
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NotificationsPage } from './components/NotificationsPage';
import { ProfilePage } from './components/ProfilePage';
import { EmployeesPage } from './components/EmployeesPage';
import { AllEmployeesPage } from './components/AllEmployeesPage';
import { RolesPage } from './components/RolesPage';
import { ContractsPage } from './components/ContractsPage';
import { ResignationsPage } from './components/ResignationsPage';
import { ShiftPage } from './components/ShiftPage';
import { MappingShiftMatrixPage } from './components/MappingShiftMatrixPage';
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
import { cn, formatPhotoUrl } from './lib/utils';

import { Page, PAGE_TO_PATH, PATH_TO_PAGE } from './lib/routes';
import { PremiumSidebar } from './components/common/PremiumSidebar';
import { PremiumHeader } from './components/common/PremiumHeader';
import { PremiumDashboard } from './components/common/PremiumDashboard';



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

  const fetchDashboardStats = async (month?: number, year?: number) => {
    try {
      let url = `${import.meta.env.VITE_API_MEANDPAY}/dashboard/stats`;
      const targetMonth = month !== undefined ? month + 1 : calendarDate.getMonth() + 1;
      const targetYear = year !== undefined ? year : calendarDate.getFullYear();
      if (month !== undefined && year !== undefined) {
        url += `?month=${targetMonth}&year=${targetYear}`;
      }
      
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
      
      const res = await fetch(url, { headers });
      const j = await res.json();
      let stats = j.success ? j.data : {};

      // Synchronize data from actual endpoints
      try {
        const usersRes = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/users?limit=1`, { headers });
        const usersJson = await usersRes.json();
        if (usersJson.success) stats.total_pegawai = usersJson.meta?.total || usersJson.data?.length || 0;

        const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
        const lastDay = new Date(targetYear, targetMonth, 0).getDate();
        const endDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${lastDay}`;
        
        const absRes = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/absensi?start_date=${startDate}&end_date=${endDate}&limit=10000`, { headers });
        const absJson = await absRes.json();
        
        let masuk = 0, alfa = 0, cuti = 0, izin = 0, sakit = 0, lembur = 0, izin_telat = 0, izin_pulang_cepat = 0;
        if (absJson.success && Array.isArray(absJson.data)) {
          absJson.data.forEach((a: any) => {
            const status = String(a.status).toLowerCase();
            if (status === 'hadir' || status === 'masuk') masuk++;
            if (status === 'alfa' || status === 'alpha') alfa++;
            if (status === 'cuti') cuti++;
            if (status === 'izin') izin++;
            if (status === 'sakit') sakit++;
            if (a.is_lembur || a.lembur) lembur++;
            if (a.is_telat || a.terlambat) izin_telat++;
            if (a.is_pulang_cepat || a.pulang_cepat) izin_pulang_cepat++;
          });
        }
        
        stats.attendance = {
          ...stats.attendance,
          masuk, alfa, cuti, izin, sakit, lembur, izin_telat, izin_pulang_cepat
        };
      } catch (e) {
        console.error('Error syncing dashboard stats from endpoints:', e);
      }

      setDashboardStats(stats);
    } catch (e) {
      console.error('Error dashboard stats:', e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardStats(calendarDate.getMonth(), calendarDate.getFullYear());
    }
  }, [user, calendarDate]);
  return (
    <div className="h-screen flex overflow-hidden font-sans bg-[#F8FAFC]">
      <PremiumSidebar 
         user={user}
         settings={settings}
         currentPage={currentPage}
         isSidebarCollapsed={isSidebarCollapsed}
         setCurrentPage={setCurrentPage as any}
         unreadCount={unreadCount}
         isAdmin={isAdmin}
         hasPermission={hasPermission}
         handleLogout={handleLogout}
         isAbsensiOpen={isAbsensiOpen}
         isOvertimeOpen={isOvertimeOpen}
         isVisitOpen={isVisitOpen}
         isFinanceOpen={isFinanceOpen}
         setIsAbsensiOpen={setIsAbsensiOpen}
         setIsOvertimeOpen={setIsOvertimeOpen}
         setIsVisitOpen={setIsVisitOpen}
         setIsFinanceOpen={setIsFinanceOpen}
      />
      <main className="flex-1 flex flex-col relative z-0 min-w-0">
        <PremiumHeader 
           user={user}
           isSidebarCollapsed={isSidebarCollapsed}
           setIsSidebarCollapsed={setIsSidebarCollapsed}
           unreadCount={unreadCount}
           isNotificationsOpen={isNotificationsOpen}
           setIsNotificationsOpen={setIsNotificationsOpen}
           isProfileMenuOpen={isProfileMenuOpen}
           setIsProfileMenuOpen={setIsProfileMenuOpen}
           handleLogout={handleLogout}
           profileMenuRef={profileMenuRef}
           bellRef={bellRef}
           previewNotifications={previewNotifications}
           handleMarkRead={handleMarkRead}
           currentPage={currentPage}
        />
        <div className="flex-1 overflow-y-auto scrollbar-hide relative z-0">
          <AnimatePresence mode="wait">
            {currentPage === 'dashboard' ? (
                <PremiumDashboard 
                   dashboardStats={dashboardStats}
                   calendarDate={calendarDate}
                   setCalendarDate={setCalendarDate}
                   calendarView={calendarView}
                   setCalendarView={setCalendarView}
                />
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
            ) : currentPage === 'mapping-shift-matrix' ? (
              <MappingShiftMatrixPage key="mapping-shift-matrix" />
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
