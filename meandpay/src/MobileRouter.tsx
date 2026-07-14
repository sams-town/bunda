import { useLocation, useNavigate } from 'react-router-dom';
import { ProfilePage } from './components/ProfilePage';
import { MobileAbsenPage } from './components/MobileAbsenPage';
import { MobileAbsenDinasPage } from './components/MobileAbsenDinasPage';
import { MobileBerandaPage } from './components/MobileBerandaPage';
import { MobileLeavePage } from './components/MobileLeavePage';
import { MobileOvertimeEntryPage } from './components/MobileOvertimeEntryPage';
import { MobileOvertimePage } from './components/MobileOvertimePage';
import { MobileLocationsPage } from './components/MobileLocationsPage';
import { ChangePasswordPage } from './components/ChangePasswordPage';
import { MobileEmployeesPage } from './components/MobileEmployeesPage';
import { MobileAttendancePage } from './components/MobileAttendancePage';
import { MobileHistoryDinasPage } from './components/MobileHistoryDinasPage';
import { MobileFinancePage } from './components/MobileFinancePage';
import { MobileVisitPage } from './components/MobileVisitPage';
import { MobileKinerjaPage } from './components/MobileKinerjaPage';
import { MobileLayout } from './components/MobileLayout';
import { MobileProfilePage } from './components/MobileProfilePage';
import { MobilePayrollPage } from './components/MobilePayrollPage';
import { MobileNotificationsPage } from './components/MobileNotificationsPage';

export function MobileRouter({ user, handleLogout, settings }: { user: any, handleLogout?: () => void, settings?: any }) {
  const location = useLocation();
  const navigate = useNavigate();

  let content;
  if (location.pathname === '/profile') content = <MobileProfilePage onLogout={handleLogout} settings={settings} />;
  else if (location.pathname === '/absen') content = <MobileAbsenPage />;
  else if (location.pathname === '/attendance-dinas') content = <MobileAbsenDinasPage />;
  else if (location.pathname === '/beranda' || location.pathname === '/dashboard') content = <MobileBerandaPage settings={settings} />;
  else if (location.pathname === '/leave') content = <MobileLeavePage />;
  else if (location.pathname === '/overtime-entry') content = <MobileOvertimeEntryPage />;
  else if (location.pathname === '/overtime-data') content = <MobileOvertimePage />;
  else if (location.pathname === '/locations') content = <MobileLocationsPage />;
  else if (location.pathname === '/change-password') content = <ChangePasswordPage user={user} onBack={() => navigate('/beranda')} />;
  else if (location.pathname === '/employees') content = <MobileEmployeesPage />;
  else if (location.pathname === '/attendance') content = <MobileAttendancePage />;
  else if (location.pathname === '/data-dinas') content = <MobileHistoryDinasPage />;
  else if (location.pathname === '/payroll') content = <MobilePayrollPage />;
  else if (location.pathname === '/notifications') content = <MobileNotificationsPage />;
  else if (['/finance-kasbon', '/finance-reimbursement', '/finance-pengajuan'].includes(location.pathname)) content = <MobileFinancePage />;
  else if (['/visit-kunjungan', '/visit-penugasan', '/visit-rapat', '/visit-dokter'].includes(location.pathname)) content = <MobileVisitPage />;
  else if (['/kinerja-pegawai', '/kinerja-laporan-kerja', '/finance-target-kinerja'].includes(location.pathname)) content = <MobileKinerjaPage />;
  else content = <MobileBerandaPage settings={settings} />;

  return <MobileLayout>{content}</MobileLayout>;
}
