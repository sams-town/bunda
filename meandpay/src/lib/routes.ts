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
  Search,
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

export type Page =
  | 'dashboard'
  | 'notifications'
  | 'profile'
  | 'employees'
  | 'all-employees'
  | 'roles'
  | 'contracts'
  | 'resignations'
  | 'shift'
  | 'divisions'
  | 'locations'
  | 'data-recap'
  | 'leave'
  | 'attendance'
  | 'absen'
  | 'data-attendance'
  | 'attendance-dinas'
  | 'data-dinas'
  | 'overtime'
  | 'overtime-entry'
  | 'overtime-data'
  | 'visit'
  | 'visit-dokter'
  | 'visit-kunjungan'
  | 'visit-penugasan'
  | 'visit-rapat'
  | 'kinerja-jenis'
  | 'kinerja-laporan'
  | 'kinerja-pegawai'
  | 'kinerja-laporan-kerja'
  | 'inventory'
  | 'finance'
  | 'finance-payroll'
  | 'finance-pajak'
  | 'finance-kasbon'
  | 'finance-reimbursement'
  | 'finance-kategori-reimbursement'
  | 'finance-pengajuan'
  | 'finance-status-pajak'
  | 'finance-target-kinerja'
  | 'finance-detail-target'
  | 'documents'
  | 'social-media'
  | 'settings'
  | 'salary-slip'
  | 'change-password'
  | 'beranda'
  | 'doctors';

// Map Page type to URL path
export const PAGE_TO_PATH: Record<Page, string> = {
  'dashboard': '/dashboard',
  'notifications': '/notifications',
  'profile': '/profile',
  'employees': '/employees',
  'all-employees': '/all-employees',
  'doctors': '/doctors',
  'roles': '/roles',
  'contracts': '/contracts',
  'resignations': '/resignations',
  'shift': '/shift',
  'divisions': '/divisions',
  'locations': '/locations',
  'data-recap': '/data-recap',
  'leave': '/leave',
  'attendance': '/attendance',
  'absen': '/absen_admin',
  'data-attendance': '/data-attendance',
  'attendance-dinas': '/attendance-dinas',
  'data-dinas': '/data-dinas',
  'overtime': '/overtime',
  'overtime-entry': '/overtime-entry',
  'overtime-data': '/overtime-data',
  'visit': '/visit',
  'visit-dokter': '/visit-dokter',
  'visit-kunjungan': '/visit-kunjungan',
  'visit-penugasan': '/visit-penugasan',
  'visit-rapat': '/visit-rapat',
  'kinerja-jenis': '/kinerja-jenis',
  'kinerja-laporan': '/kinerja-laporan',
  'kinerja-pegawai': '/kinerja-pegawai',
  'kinerja-laporan-kerja': '/kinerja-laporan-kerja',
  'inventory': '/inventory',
  'finance': '/finance',
  'finance-payroll': '/finance-payroll',
  'finance-pajak': '/finance-pajak',
  'finance-kasbon': '/finance-kasbon',
  'finance-reimbursement': '/finance-reimbursement',
  'finance-kategori-reimbursement': '/finance-kategori-reimbursement',
  'finance-pengajuan': '/finance-pengajuan',
  'finance-status-pajak': '/finance-status-pajak',
  'finance-target-kinerja': '/finance-target-kinerja',
  'finance-detail-target': '/finance-detail-target',
  'documents': '/documents',
  'social-media': '/social-media',
  'settings': '/settings',
  'salary-slip': '/salary-slip',
  'change-password': '/change-password',
  'beranda': '/beranda',
};

// Normalize keys so we handle routes and params flexibly
export const normalizePath = (path: string) => `/${path.split('/').filter(Boolean)[0] || 'dashboard'}`;

// Reverse map: URL path to Page type
export const PATH_TO_PAGE: Record<string, Page> = Object.entries(PAGE_TO_PATH).reduce(
  (acc, [page, path]) => ({ ...acc, [path]: page as Page }),
  {} as Record<string, Page>
);
