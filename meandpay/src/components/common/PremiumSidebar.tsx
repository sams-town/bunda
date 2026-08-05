import React from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard, Bell, Users, Stethoscope, UserMinus, Clock, Briefcase, MapPin, Database,
  Calendar, CreditCard, ShieldCheck, FileText, Settings, User, LogOut, ChevronRight
} from 'lucide-react';
import { cn, formatPhotoUrl } from '../../lib/utils';
import { Page } from '../../lib/routes';

interface PremiumSidebarProps {
  user: any;
  settings: any;
  currentPage: string;
  isSidebarCollapsed: boolean;
  setCurrentPage: (page: Page) => void;
  unreadCount: number;
  isAdmin: boolean;
  hasPermission: (permission: string) => boolean;
  handleLogout: () => void;
  isAbsensiOpen: boolean;
  isOvertimeOpen: boolean;
  isVisitOpen: boolean;
  isFinanceOpen: boolean;
  setIsAbsensiOpen: (v: boolean) => void;
  setIsOvertimeOpen: (v: boolean) => void;
  setIsVisitOpen: (v: boolean) => void;
  setIsFinanceOpen: (v: boolean) => void;
}

export function PremiumSidebar({
  user, settings, currentPage, isSidebarCollapsed, setCurrentPage,
  unreadCount, isAdmin, hasPermission, handleLogout,
  isAbsensiOpen, isOvertimeOpen, isVisitOpen, isFinanceOpen,
  setIsAbsensiOpen, setIsOvertimeOpen, setIsVisitOpen, setIsFinanceOpen
}: PremiumSidebarProps) {
  
  function SidebarItem({ icon: Icon, label, active, badge, onClick, hasChevron, isCollapsed }: any) {
    return (
      <div className="px-4 relative mb-1.5">
        <button
          onClick={onClick}
          className={cn(
            "w-full flex items-center px-4 py-3 rounded-2xl text-[14px] font-semibold transition-all group relative overflow-hidden",
            active
              ? 'bg-[#EAF8F8] text-[#34959E] shadow-[0_4px_12px_rgba(52,149,158,0.05)]'
              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50',
            isCollapsed ? "justify-center px-0 py-4" : "justify-between"
          )}
        >
          {active && (
            <motion.div
              layoutId="active-pill"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-[6px] h-8 bg-[#34959E] rounded-r-full"
            />
          )}
          <div className="flex items-center gap-3.5">
            <div className={cn(
              "flex items-center justify-center transition-all",
              active ? "text-[#34959E]" : "text-[#64748B] group-hover:text-[#34959E]"
            )}>
              <Icon className={cn("w-5 h-5", active ? "fill-[#34959E]/10 stroke-[2.5]" : "stroke-2")} />
            </div>
            {!isCollapsed && <span className="tracking-tight">{label}</span>}
          </div>
          {!isCollapsed && (badge || hasChevron) && (
            <div className="flex items-center gap-2">
              {badge && (
                <span className="bg-[#FB9917] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  {badge}
                </span>
              )}
              {hasChevron && <ChevronRight className={cn("w-4 h-4 transition-transform", active && "rotate-90 text-[#34959E] opacity-100", !active && "opacity-40 group-hover:opacity-100")} />}
            </div>
          )}
        </button>
      </div>
    );
  }

  function SidebarSubItem({ label, active, onClick }: any) {
    if (isSidebarCollapsed) return null;
    return (
      <button
        onClick={onClick}
        className={cn(
          "w-full flex items-center gap-3 pl-14 pr-4 py-2.5 text-[13px] font-medium transition-all group",
          active ? "text-[#34959E] bg-[#EAF8F8]/50 rounded-r-xl" : "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50/80 rounded-r-xl"
        )}
      >
        <span className="tracking-wide">{label}</span>
      </button>
    );
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: isSidebarCollapsed ? 90 : 280 }}
      className="bg-white flex flex-col sticky top-0 h-screen overflow-hidden shadow-[1px_0_40px_rgba(15,23,42,0.03)] z-50 shrink-0 border-r border-[#E2E8F0]"
    >
      {/* Brand Header */}
      <div className={cn("p-6 mb-2 flex items-center transition-all duration-300 shrink-0", isSidebarCollapsed ? "justify-center" : "gap-3.5")}>
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#34959E] to-[#2F7F87] p-0.5 shadow-lg shadow-[#34959E]/20 flex items-center justify-center shrink-0">
          <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center">
            {settings?.logo ? (
                <img src={formatPhotoUrl(settings.logo)} alt="Logo" className="w-7 h-7 object-contain" onError={(e: any) => e.target.style.display='none'} />
            ) : <Settings className="w-5 h-5 text-[#34959E]" />}
          </div>
        </div>
        {!isSidebarCollapsed && (
          <div className="flex flex-col">
            <span className="text-[16px] font-bold tracking-tight text-[#0F172A] leading-tight">
              {settings?.name || 'RS Bunda Halimah'}
            </span>
            <span className="text-[10px] font-semibold text-[#64748B] mt-0.5">
              Hospital HRIS Platform
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-2">
        <div className="mb-6">
          {!isSidebarCollapsed && <div className="px-8 mb-3 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Overview</div>}
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={currentPage === 'dashboard'} onClick={() => setCurrentPage('dashboard')} isCollapsed={isSidebarCollapsed} />
          <SidebarItem icon={Bell} label="Notifications" active={currentPage === 'notifications'} onClick={() => setCurrentPage('notifications')} badge={unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount.toString()) : undefined} isCollapsed={isSidebarCollapsed} />
        </div>

        {isAdmin && (
          <div className="mb-6">
            {!isSidebarCollapsed && <div className="px-8 mb-3 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">HR Management</div>}
            
            {hasPermission('pegawai.view') && (
              <>
                <SidebarItem icon={Users} label="Pegawai" active={currentPage === 'employees'} onClick={() => setCurrentPage('employees')} isCollapsed={isSidebarCollapsed} />
                <SidebarItem icon={Stethoscope} label="Data Dokter" active={currentPage === 'doctors'} onClick={() => setCurrentPage('doctors')} isCollapsed={isSidebarCollapsed} />
              </>
            )}
            
            {hasPermission('exit.view') && (
              <SidebarItem icon={UserMinus} label="Pegawai Keluar" active={currentPage === 'resignations'} onClick={() => setCurrentPage('resignations')} isCollapsed={isSidebarCollapsed} />
            )}

            <SidebarItem icon={Briefcase} label="Organisasi" active={['divisions', 'roles', 'locations'].includes(currentPage)} onClick={() => { if(!isSidebarCollapsed) setIsAbsensiOpen(!isAbsensiOpen); else setCurrentPage('divisions'); }} hasChevron isCollapsed={isSidebarCollapsed} />
            {isAbsensiOpen && !isSidebarCollapsed && (
              <div className="mb-2 relative before:absolute before:left-8 before:top-0 before:bottom-0 before:w-[1px] before:bg-slate-200">
                {hasPermission('divisi.view') && <SidebarSubItem label="Divisi" active={currentPage === 'divisions'} onClick={() => setCurrentPage('divisions')} />}
                {hasPermission('jabatan.view') && <SidebarSubItem label="Jabatan" active={currentPage === 'roles'} onClick={() => setCurrentPage('roles')} />}
                {hasPermission('lokasi.view') && <SidebarSubItem label="Lokasi Kerja" active={currentPage === 'locations'} onClick={() => setCurrentPage('locations')} />}
              </div>
            )}
          </div>
        )}

        <div className="mb-6">
          {!isSidebarCollapsed && <div className="px-8 mb-3 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Kehadiran</div>}
          
          <SidebarItem icon={Clock} label="Absensi" active={['absen', 'attendance', 'data-attendance', 'attendance-dinas', 'data-dinas'].includes(currentPage)} onClick={() => setIsAbsensiOpen(!isAbsensiOpen)} hasChevron isCollapsed={isSidebarCollapsed} />
          {isAbsensiOpen && !isSidebarCollapsed && (
            <div className="mb-2 relative before:absolute before:left-8 before:top-0 before:bottom-0 before:w-[1px] before:bg-slate-200">
               <SidebarSubItem label="Absen Masuk/Pulang" onClick={() => setCurrentPage('absen' as any)} active={currentPage === 'absen'} />
               <SidebarSubItem label="Riwayat Absen" onClick={() => setCurrentPage('attendance' as any)} active={currentPage === 'attendance'} />
               {hasPermission('data-absen.view') && <SidebarSubItem label="Data Absen" onClick={() => setCurrentPage('data-attendance' as any)} active={currentPage === 'data-attendance'} />}
            </div>
          )}

          {hasPermission('cuti.view') && (
            <SidebarItem icon={Calendar} label="Cuti & Izin" active={currentPage === 'leave'} onClick={() => setCurrentPage('leave')} isCollapsed={isSidebarCollapsed} />
          )}

          <SidebarItem icon={CreditCard} label="Payroll" active={currentPage === 'finance-payroll'} onClick={() => setCurrentPage('finance-payroll')} isCollapsed={isSidebarCollapsed} />
        </div>
      </div>

      {/* User Card at bottom */}
      <div className="p-4 mb-2 shrink-0">
        <div className={cn(
          "bg-white rounded-[20px] p-2 border border-[#E2E8F0] shadow-[0_12px_40px_rgba(15,23,42,0.04)] flex flex-col",
          isSidebarCollapsed ? "items-center" : ""
        )}>
          {!isSidebarCollapsed && (
             <div className="flex items-center gap-3 p-2 mb-2">
                <img src={user?.photo_url ? formatPhotoUrl(user.photo_url) : `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=34959E&color=fff`} className="w-10 h-10 rounded-full border border-slate-100" alt="Profile" />
                <div className="flex flex-col truncate pr-2">
                   <span className="text-[13px] font-bold text-[#0F172A] truncate">{user?.name}</span>
                   <span className="text-[11px] font-medium text-[#64748B] truncate">{user?.role_name || user?.is_admin}</span>
                </div>
             </div>
          )}
          <button
            onClick={handleLogout}
            className={cn("flex items-center justify-center gap-2 p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-[14px] transition-all font-semibold text-[13px]", isSidebarCollapsed ? "w-10 h-10" : "w-full")}
          >
            <LogOut className="w-4 h-4" />
            {!isSidebarCollapsed && "Sign Out"}
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
