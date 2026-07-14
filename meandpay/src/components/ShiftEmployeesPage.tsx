import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock, Users, Trash2, Search, Loader2, X,
  Calendar, ArrowLeft, Check,
  UserPlus, AlertTriangle, RefreshCw,
  Sun, Sunrise, Sunset, Moon, FileSpreadsheet,
  Download, Upload, ChevronRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { cn } from '../lib/utils';
import { useToast } from './Toast';
import Swal from 'sweetalert2';

const BASE_URL = import.meta.env.VITE_API_MEANDPAY;

/* ─── Types ─────────────────────────────────────────────── */
interface Shift {
  id: string;
  nama_shift: string;
  jam_masuk: string;
  jam_keluar: string;
  jam_mulai_istirahat?: string;
  jam_selesai_istirahat?: string;
}

interface Employee {
  id: string;
  name: string;
  username: string;
  foto_karyawan?: string | null;
  jabatan?: { id: string; nama_jabatan: string } | null;
  lokasi?: { id: string; nama_lokasi: string } | null;
}

interface MappingData {
  id: string;
  user_id: string;
  shift_id: string;
  tanggal: string;
  lock_location?: string;
  users?: any;
  shifts?: any;
}

interface ShiftEmployeesPageProps {
  onBack: () => void;
}

interface ImportMappingRow {
  rowIndex: number;
  user_id: string;
  user_name?: string;
  shift_id: string;
  shift_name?: string;
  tanggal_mulai: string;
  tanggal_akhir: string;
  lock_location: number;
  status: 'pending' | 'success' | 'error';
  message?: string;
}

/* ─── Helpers ────────────────────────────────────────────── */
function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

const avatarGradients = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-indigo-600',
  'from-sky-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-fuchsia-500 to-pink-600',
  'from-teal-500 to-cyan-600',
];

function avatarGradient(id: string) {
  return avatarGradients[parseInt(id) % avatarGradients.length];
}

type ShiftTheme = {
  icon: typeof Sun;
  label: string;
  accent: string;
  gradient: string;
  lightBg: string;
  lightText: string;
  lightRing: string;
};

function getShiftTheme(jamMasuk: string): ShiftTheme {
  const hour = parseInt(jamMasuk?.split(':')[0] || '0', 10);

  if (hour >= 5 && hour < 11) {
    return {
      icon: Sunrise,
      label: 'Pagi',
      accent: '#f59e0b',
      gradient: 'from-amber-400 to-orange-500',
      lightBg: 'bg-amber-50',
      lightText: 'text-amber-700',
      lightRing: 'ring-amber-200/60',
    };
  } else if (hour >= 11 && hour < 15) {
    return {
      icon: Sun,
      label: 'Siang',
      accent: '#f97316',
      gradient: 'from-orange-400 to-red-500',
      lightBg: 'bg-orange-50',
      lightText: 'text-orange-700',
      lightRing: 'ring-orange-200/60',
    };
  } else if (hour >= 15 && hour < 18) {
    return {
      icon: Sunset,
      label: 'Sore',
      accent: '#ec4899',
      gradient: 'from-pink-400 to-rose-500',
      lightBg: 'bg-pink-50',
      lightText: 'text-pink-700',
      lightRing: 'ring-pink-200/60',
    };
  } else {
    return {
      icon: Moon,
      label: 'Malam',
      accent: '#6366f1',
      gradient: 'from-indigo-500 to-violet-600',
      lightBg: 'bg-indigo-50',
      lightText: 'text-indigo-700',
      lightRing: 'ring-indigo-200/60',
    };
  }
}

/* ─── Import Template Generator ──────────────────────────── */
function generateMappingTemplate(availableShifts: Shift[], allEmployees: Employee[] = []) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Template
  const headers = [
    'ID Karyawan*', 'Nama Karyawan (Info)', 'ID Shift*', 'Nama Shift (Info)',
    'Tanggal Mulai* (DD/MM/YYYY)', 'Tanggal Akhir* (DD/MM/YYYY)', 'Lock Location (1/0)'
  ];
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  // First and last day of current month
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const fmt = (d: Date) => {
    const day = String(d.getDate()).padStart(2, '0');
    const mon = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${mon}/${d.getFullYear()}`;
  };

  const contoh = [
    ['101', 'Budi Santoso', '1', 'Shift Pagi', fmt(firstDay), fmt(lastDay), '1'],
    ['102', 'Siti Rahayu', '2', 'Shift Siang', fmt(firstDay), fmt(lastDay), '0'],
  ];

  const ws1 = XLSX.utils.aoa_to_sheet([headers, ...contoh]);
  ws1['!cols'] = [
    { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 25 },
    { wch: 25 }, { wch: 25 }, { wch: 18 }
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'Import Mapping Shift');

  // Sheet 2: Daftar Shift (Referensi)
  const shiftData = availableShifts.map(s => [s.id, s.nama_shift, s.jam_masuk, s.jam_keluar]);
  const ws2 = XLSX.utils.aoa_to_sheet([['ID Shift', 'Nama Shift', 'Jam Masuk', 'Jam Keluar'], ...shiftData]);
  ws2['!cols'] = [{ wch: 10 }, { wch: 25 }, { wch: 12 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'Referensi Shift');

  // Sheet 3: Daftar Karyawan (Referensi)
  if (allEmployees.length > 0) {
    const empData = allEmployees.map(e => [e.id, e.name, e.username, e.jabatan?.nama_jabatan || '-']);
    const ws3 = XLSX.utils.aoa_to_sheet([['ID Karyawan', 'Nama Karyawan', 'Username', 'Jabatan'], ...empData]);
    ws3['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, ws3, 'Referensi Karyawan');
  }

  XLSX.writeFile(wb, 'Template_Import_Shift_Pegawai.xlsx');
}

/* ─── Main Component ─────────────────────────────────────── */
export function ShiftEmployeesPage({ onBack }: ShiftEmployeesPageProps) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [mappings, setMappings] = useState<MappingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ userId: string; userName: string } | null>(null);
  const [search, setSearch] = useState('');
  const { addToast, updateToast } = useToast();

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [shiftRes, empRes, mappingRes] = await Promise.all([
        fetch(`${BASE_URL}/shifts`, { headers }),
        fetch(`${BASE_URL}/users?limit=100000`, { headers }),
        fetch(`${BASE_URL}/absensi?limit=100000`, { headers }),
      ]);

      const shiftJson = await shiftRes.json();
      const empJson = await empRes.json();
      const mappingJson = await mappingRes.json();

      if (shiftJson.success) setShifts(shiftJson.data);
      if (empJson.success) setAllEmployees(empJson.data);
      if (mappingJson.success && Array.isArray(mappingJson.data)) setMappings(mappingJson.data);
    } catch (err) {
      console.error('Error fetching shift data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getEmployeesForShift = (shiftId: string) => {
    const userMap = new Map<string, { startDate: string; endDate: string; lockLocation: boolean }>();
    mappings
      .filter(m => m.shift_id === shiftId)
      .forEach(m => {
        const existing = userMap.get(m.user_id);
        const tgl = m.tanggal?.split('T')[0] || '';
        const isLocked = m.lock_location === '1' || m.lock_location === 1;

        if (!existing) {
          userMap.set(m.user_id, { startDate: tgl, endDate: tgl, lockLocation: isLocked });
        } else {
          if (tgl < existing.startDate) existing.startDate = tgl;
          if (tgl > existing.endDate) existing.endDate = tgl;
          if (isLocked) existing.lockLocation = true;
        }
      });
    return allEmployees
      .filter(e => userMap.get(e.id))
      .map(e => ({ ...e, assignment: userMap.get(e.id)! }));
  };

  const handleRemoveEmployee = async (userId: string, shiftId: string) => {
    setDeleteConfirm(null);
    setSelectedShift(null);
    
    // Find the assignment dates for this user/shift
    const employees = getEmployeesForShift(shiftId);
    const target = employees.find(e => e.id === userId);
    
    if (!target || !target.assignment) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Data mapping tidak ditemukan.' });
      return;
    }

    const toastId = addToast({ type: 'loading', title: 'Menghapus', message: 'Menghapus karyawan dari shift...' });

    try {
      const res = await fetch(`${BASE_URL}/mapping-shifts/bulk`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({
          user_id: userId,
          start_date: target.assignment.startDate,
          end_date: target.assignment.endDate
        })
      });
      
      const json = await res.json();
      if (json.success) {
        updateToast(toastId, { type: 'success', title: 'Berhasil', message: `Mapping shift untuk ${target.name} berhasil dihapus` });
        setMappings(prev => prev.filter(m => !(m.user_id === userId && m.shift_id === shiftId)));
      } else {
        updateToast(toastId, { type: 'error', title: 'Gagal', message: json.message || 'Gagal menghapus data' });
      }
    } catch (err: any) {
      updateToast(toastId, { type: 'error', title: 'Error', message: err.message || 'Terjadi kesalahan' });
    }
  };

  const filteredShifts = shifts.filter(s =>
    s.nama_shift.toLowerCase().includes(search.toLowerCase())
  );

  /* ── Loading Skeleton ── */
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto pb-20">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-200 animate-pulse" />
            <div>
              <div className="h-6 w-48 bg-slate-200 rounded-lg animate-pulse" />
              <div className="h-4 w-72 bg-slate-100 rounded-lg animate-pulse mt-2" />
            </div>
          </div>
          <div className="flex gap-2.5">
            <div className="h-10 w-24 bg-slate-200 rounded-xl animate-pulse" />
            <div className="h-10 w-28 bg-slate-300 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[0, 1, 2].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200/80 px-5 py-4 shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-slate-100 animate-pulse" />
                <div>
                  <div className="h-7 w-12 bg-slate-200 rounded-lg animate-pulse" />
                  <div className="h-3 w-20 bg-slate-100 rounded animate-pulse mt-2" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search skeleton */}
        <div className="h-12 w-96 bg-slate-100 rounded-2xl animate-pulse mb-8" />

        {/* Cards skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm" style={{ borderLeft: '4px solid #e2e8f0' }}>
              <div className="p-5 pb-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-[14px] bg-slate-200 animate-pulse shrink-0" />
                  <div className="flex-1">
                    <div className="h-5 w-32 bg-slate-200 rounded-lg animate-pulse" />
                    <div className="flex gap-1.5 mt-2">
                      <div className="h-4 w-12 bg-slate-100 rounded-md animate-pulse" />
                      <div className="h-4 w-28 bg-slate-100 rounded-md animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mx-5 h-px bg-slate-100" />
              <div className="p-4 pt-3 space-y-2">
                {[0, 1, 2].map(j => (
                  <div key={j} className="flex items-center gap-2.5 px-2.5 py-2">
                    <div className="w-4 h-3 bg-slate-100 rounded animate-pulse" />
                    <div className="w-8 h-8 rounded-[10px] bg-slate-200 animate-pulse" />
                    <div className="flex-1">
                      <div className="h-4 w-28 bg-slate-200 rounded animate-pulse" />
                      <div className="h-3 w-20 bg-slate-100 rounded animate-pulse mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const totalEmployeesInShifts = new Set(mappings.map(m => m.user_id)).size;

  /* ── Render ── */
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto pb-20"
      >
        {/* ── Page Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 blur-lg opacity-30" />
              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manajemen Shift</h1>
              <p className="text-[13px] text-slate-400 font-medium mt-0.5">Kelola jadwal shift & penugasan karyawan</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => generateMappingTemplate(shifts, allEmployees)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-[13px] font-semibold text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm active:scale-[0.97]"
            >
              <Download className="w-3.5 h-3.5" /> Template
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-[13px] font-semibold text-slate-500 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm active:scale-[0.97]"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Import
            </button>
            <button
              onClick={() => fetchData()}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-[13px] font-semibold text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-all shadow-sm active:scale-[0.97]"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold rounded-xl shadow-lg shadow-slate-900/20 transition-all active:scale-[0.97]"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Kembali
            </button>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Shift', value: shifts.length, icon: Clock, color: 'from-indigo-500 to-violet-600', lightBg: 'bg-indigo-50', lightIcon: 'text-indigo-500' },
            { label: 'Karyawan Aktif', value: totalEmployeesInShifts, icon: Users, color: 'from-emerald-500 to-teal-600', lightBg: 'bg-emerald-50', lightIcon: 'text-emerald-500' },
            { label: 'Jadwal Terjadwal', value: mappings.length, icon: Calendar, color: 'from-violet-500 to-purple-600', lightBg: 'bg-violet-50', lightIcon: 'text-violet-500' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white rounded-2xl border border-slate-200/80 px-5 py-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3.5">
                <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", stat.lightBg)}>
                  <stat.icon className={cn("w-5 h-5", stat.lightIcon)} />
                </div>
                <div>
                  <p className="text-[22px] font-black text-slate-800 leading-none">{stat.value}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.12em] mt-1">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Search ── */}
        <div className="relative w-full max-w-md mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari shift berdasarkan nama..."
            className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200/80 rounded-2xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* ── Shifts Grid ── */}
        {filteredShifts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center">
              <Clock className="w-9 h-9 text-slate-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-500">Tidak ada shift ditemukan</p>
              <p className="text-xs text-slate-400 mt-1">Coba ubah kata kunci pencarian</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredShifts.map((shift, shiftIdx) => {
              const employeesInShift = getEmployeesForShift(shift.id);
              const theme = getShiftTheme(shift.jam_masuk);
              const ShiftIcon = theme.icon;
              return (
                <motion.div
                  key={shift.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: shiftIdx * 0.04, duration: 0.35 }}
                  className="bg-white rounded-2xl overflow-hidden transition-all duration-300 group border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:border-slate-300/80"
                  style={{ borderLeft: `4px solid ${theme.accent}` }}
                >
                  {/* Card Header */}
                  <div className="p-5 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className={cn(
                          "w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0 bg-gradient-to-br shadow-lg",
                          theme.gradient
                        )} style={{ boxShadow: `0 4px 14px ${theme.accent}33` }}>
                          <ShiftIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-[15px] font-extrabold text-slate-800 leading-tight truncate flex items-center gap-2">
                            {shift.nama_shift}
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-100/50 px-1.5 py-0.5 rounded border border-slate-200/50">ID: {shift.id}</span>
                          </h3>
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <span className={cn(
                              "text-[9px] font-black uppercase tracking-[0.12em] px-2 py-[2px] rounded-md ring-1",
                              theme.lightBg, theme.lightText, theme.lightRing
                            )}>
                              {theme.label}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100/80 px-2 py-[2px] rounded-md">
                              <Clock className="w-2.5 h-2.5 text-slate-400" />
                              {shift.jam_masuk} — {shift.jam_keluar}
                            </span>
                          </div>
                          {shift.jam_mulai_istirahat && shift.jam_selesai_istirahat && (
                            <p className="text-[10px] text-slate-400 mt-1.5">
                              ☕ Istirahat: {shift.jam_mulai_istirahat} – {shift.jam_selesai_istirahat}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => { setSelectedShift(shift); setShowAddModal(true); }}
                        className="p-2 rounded-xl bg-white text-slate-400 hover:text-indigo-600 ring-1 ring-slate-200 hover:ring-indigo-300 hover:bg-indigo-50 transition-all active:scale-90 shrink-0 shadow-sm"
                        title="Tambah Karyawan"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="mx-5 flex items-center gap-2.5">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] flex items-center gap-1.5 whitespace-nowrap">
                      <Users className="w-3 h-3" /> {employeesInShift.length} Karyawan
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                  </div>

                  {/* Employee List */}
                  <div className="p-4 pt-3 max-h-60 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                    {employeesInShift.length === 0 ? (
                      <div className="py-6 flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-2.5">
                          <Users className="w-5 h-5 text-slate-200" />
                        </div>
                        <p className="text-[11px] text-slate-400 font-semibold">Belum ada karyawan terdaftar</p>
                        <button
                          onClick={() => { setSelectedShift(shift); setShowAddModal(true); }}
                          className="mt-2 text-[11px] font-bold text-indigo-500 hover:text-indigo-700 transition-colors"
                        >
                          + Tambah sekarang
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        {employeesInShift.map((emp, empIdx) => (
                          <div
                            key={emp.id}
                            className="flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-slate-50 transition-all duration-150 group/item"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-[10px] font-black text-slate-300/80 w-4 text-right shrink-0 tabular-nums">
                                {empIdx + 1}
                              </span>
                              <div className={cn(
                                "w-8 h-8 rounded-[10px] flex items-center justify-center text-white text-[10px] font-bold shrink-0 bg-gradient-to-br shadow-sm",
                                avatarGradient(emp.id)
                              )}>
                                {initials(emp.name)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13px] font-semibold text-slate-700 truncate leading-tight flex items-center gap-1.5">
                                  {emp.name}
                                  <span className="text-[9px] font-mono text-slate-400">#{emp.id}</span>
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <p className="text-[10px] text-slate-400 truncate leading-tight">{emp.jabatan?.nama_jabatan || 'Pegawai'}</p>
                                  {emp.assignment && (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[9px] text-slate-400/70 font-mono flex items-center gap-0.5 shrink-0">
                                        <Calendar className="w-2.5 h-2.5" />
                                        {new Date(emp.assignment.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} – {new Date(emp.assignment.endDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })}
                                      </span>
                                      <div className={cn(
                                        "flex items-center gap-0.5 px-1 py-[1px] rounded-[4px] text-[8px] font-black uppercase tracking-tighter",
                                        emp.assignment.lockLocation 
                                          ? "bg-indigo-50 text-indigo-500 ring-1 ring-indigo-100" 
                                          : "bg-slate-50 text-slate-400 ring-1 ring-slate-100"
                                      )}>
                                        {emp.assignment.lockLocation ? <Check className="w-2 h-2" /> : <X className="w-2 h-2" />}
                                        {emp.assignment.lockLocation ? 'LOCK' : 'FREE'}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={async () => {
                                const result = await Swal.fire({
                                  title: 'Hapus dari Shift?',
                                  text: `${emp.name} akan dihapus dari shift ${shift.nama_shift}`,
                                  icon: 'warning',
                                  showCancelButton: true,
                                  confirmButtonColor: '#d33',
                                  confirmButtonText: 'Ya, Hapus!',
                                  cancelButtonText: 'Batal'
                                });
                                if (result.isConfirmed) {
                                  handleRemoveEmployee(emp.id, shift.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-transparent group-hover/item:text-slate-300 hover:!text-rose-500 hover:!bg-rose-50 transition-all shrink-0"
                              title="Hapus dari shift"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ── Add Employee Modal ── */}
      <AnimatePresence>
        {showAddModal && selectedShift && (
          <AddEmployeeToShiftModal
            shift={selectedShift}
            allEmployees={allEmployees}
            existingMappings={mappings}
            onClose={() => { setShowAddModal(false); setSelectedShift(null); }}
            onSuccess={() => { fetchData(); setShowAddModal(false); setSelectedShift(null); }}
            addToast={addToast}
            updateToast={updateToast}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation is now handled by SweetAlert */}
      {/* ── Import Mapping Modal ── */}
      <AnimatePresence>
        {showImportModal && (
          <ImportMappingModal
            shifts={shifts}
            allEmployees={allEmployees}
            onClose={() => setShowImportModal(false)}
            onSuccess={() => { fetchData(); setShowImportModal(false); }}
            addToast={addToast}
            updateToast={updateToast}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Add Employee to Shift Modal ────────────────────────── */
function AddEmployeeToShiftModal({
  shift,
  allEmployees,
  existingMappings,
  onClose,
  onSuccess,
  addToast,
  updateToast
}: {
  shift: Shift;
  allEmployees: Employee[];
  existingMappings: MappingData[];
  onClose: () => void;
  onSuccess: () => void;
  addToast: any;
  updateToast: any;
}) {
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [lockLocation, setLockLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');

  const existingUserIds = new Set(
    existingMappings.filter(m => m.shift_id === shift.id).map(m => m.user_id)
  );

  const filteredEmployees = allEmployees.filter(emp =>
    emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
    emp.username.toLowerCase().includes(employeeSearch.toLowerCase())
  );

  const toggleEmployee = (id: string) => {
    setSelectedEmployees(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (selectedEmployees.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Pilih Karyawan!', text: 'Pilih minimal 1 karyawan untuk ditambahkan.' });
      return;
    }
    if (!startDate || !endDate) {
      Swal.fire({ icon: 'warning', title: 'Lengkapi Tanggal!', text: 'Silakan isi tanggal mulai dan tanggal akhir.' });
      return;
    }

    setSubmitting(true);
    const toastId = addToast({ type: 'loading', title: 'Menambahkan', message: 'Menambahkan karyawan ke shift...' });

    try {
      let successCount = 0;
      let failCount = 0;

      for (const empId of selectedEmployees) {
        const res = await fetch(`${BASE_URL}/mapping-shifts/bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            user_id: empId,
            shift_id: shift.id,
            start_date: startDate,
            end_date: endDate,
            lock_location: lockLocation ? 1 : 0
          })
        });
        const json = await res.json();
        if (json.success) successCount++;
        else failCount++;
      }

      if (failCount === 0) {
        updateToast(toastId, { type: 'success', title: 'Berhasil', message: `${successCount} karyawan berhasil ditambahkan ke shift ${shift.nama_shift}` });
      } else {
        updateToast(toastId, { type: 'error', title: 'Sebagian Gagal', message: `${successCount} berhasil, ${failCount} gagal` });
      }

      onSuccess();
    } catch (err: any) {
      updateToast(toastId, { type: 'error', title: 'Error', message: err.message || 'Terjadi kesalahan' });
    } finally {
      setSubmitting(false);
    }
  };

  const theme = getShiftTheme(shift.jam_masuk);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-7 pt-7 pb-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className={cn("w-11 h-11 rounded-[14px] bg-gradient-to-br flex items-center justify-center shadow-lg", theme.gradient)}>
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">Tambah Karyawan</h3>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{shift.nama_shift} • {shift.jam_masuk} – {shift.jam_keluar}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Date Range */}
        <div className="px-7 py-5 border-b border-slate-100 shrink-0 bg-slate-50/50">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal Mulai</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all font-mono shadow-sm"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal Akhir</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all font-mono shadow-sm"
                  required
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3 px-1">
            <input
              type="checkbox"
              id="lockLocationAdd"
              checked={lockLocation}
              onChange={e => setLockLocation(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="lockLocationAdd" className="text-xs font-bold text-slate-500 tracking-tight cursor-pointer">
              Lock Location
            </label>
          </div>
        </div>

        {/* Employee Search */}
        <div className="px-7 py-4 border-b border-slate-100 shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={employeeSearch}
              onChange={e => setEmployeeSearch(e.target.value)}
              placeholder="Cari karyawan..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all"
            />
          </div>
          {selectedEmployees.length > 0 && (
            <p className="text-[11px] font-bold text-emerald-600 mt-2 flex items-center gap-1">
              <Check className="w-3 h-3" /> {selectedEmployees.length} karyawan dipilih
            </p>
          )}
        </div>

        {/* Employee List */}
        <div className="flex-1 overflow-y-auto px-7 py-4 space-y-1.5 min-h-0">
          {filteredEmployees.map(emp => {
            const isSelected = selectedEmployees.includes(emp.id);
            const isExisting = existingUserIds.has(emp.id);
            return (
              <button
                key={emp.id}
                onClick={() => !isExisting && toggleEmployee(emp.id)}
                disabled={isExisting}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
                  isExisting
                    ? "bg-slate-50 opacity-40 cursor-not-allowed"
                    : isSelected
                    ? "bg-emerald-50 border border-emerald-200 ring-2 ring-emerald-500/20"
                    : "bg-white border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30"
                )}
              >
                <div className={cn("w-8 h-8 rounded-[10px] flex items-center justify-center text-white text-[10px] font-bold shrink-0 bg-gradient-to-br shadow-sm", avatarGradient(emp.id))}>
                  {initials(emp.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-slate-700 truncate">{emp.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">@{emp.username} · {emp.jabatan?.nama_jabatan || '-'}</p>
                </div>
                {isExisting ? (
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg shrink-0">Sudah ada</span>
                ) : isSelected ? (
                  <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0 shadow-sm">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-lg border-2 border-slate-200 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-7 py-5 border-t border-slate-100 flex gap-3 shrink-0 bg-slate-50/50">
          <button onClick={onClose} className="flex-1 py-3 text-slate-600 font-bold bg-white hover:bg-slate-100 rounded-xl transition-all active:scale-95 border border-slate-200">
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || selectedEmployees.length === 0}
            className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {submitting ? 'Menambahkan...' : `Tambah (${selectedEmployees.length})`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Import Mapping Modal ───────────────────────────────── */
function ImportMappingModal({
  shifts,
  allEmployees,
  onClose,
  onSuccess,
  addToast,
  updateToast
}: {
  shifts: Shift[];
  allEmployees: Employee[];
  onClose: () => void;
  onSuccess: () => void;
  addToast: any;
  updateToast: any;
}) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'done'>('upload');
  const [rows, setRows] = useState<ImportMappingRow[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string } | null>(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ total: number; success: number; failed: number } | null>(null);
  const [filterError, setFilterError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      Swal.fire({ icon: 'error', title: 'Format Tidak Didukung', text: 'Gunakan .xlsx, .xls, atau .csv' });
      return;
    }
    try {
      const parsed = await parseMappingExcel(file);
      setRows(parsed);
      setFileInfo({
        name: file.name,
        size: file.size < 1024 * 1024
          ? `${(file.size / 1024).toFixed(1)} KB`
          : `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      });
      setStep('preview');
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Gagal Membaca File', text: err.message || 'Gagal membaca file Excel' });
    }
  };

  const handleImport = async () => {
    setStep('importing');
    setProgress(0);

    const updated = [...rows];
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const res = await fetch(`${BASE_URL}/mapping-shifts/bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            user_id: row.user_id,
            shift_id: row.shift_id,
            start_date: row.tanggal_mulai,
            end_date: row.tanggal_akhir,
            lock_location: row.lock_location
          })
        });
        const json = await res.json();
        if (json.success) {
          updated[i] = { ...row, status: 'success', message: 'Berhasil' };
          successCount++;
        } else {
          updated[i] = { ...row, status: 'error', message: json.message || 'Gagal' };
          failedCount++;
        }
      } catch (err: any) {
        updated[i] = { ...row, status: 'error', message: err.message || 'Error Server' };
        failedCount++;
      }
      setRows([...updated]);
      setProgress(Math.round(((i + 1) / rows.length) * 100));
      // Subtle delay to show progress
      if (rows.length < 50) await new Promise(r => setTimeout(r, 50));
    }

    setResult({ total: rows.length, success: successCount, failed: failedCount });
    setStep('done');
    if (successCount > 0) onSuccess();
  };

  const errorCount = rows.filter(r => r.status === 'error').length;
  const validCount = rows.filter(r => r.status !== 'error').length;
  const displayRows = filterError ? rows.filter(r => r.status === 'error') : rows;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-8 pt-7 pb-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">Import Jadwal Shift</h3>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Bulk Upload Karyawan ke Shift</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 rounded-2xl hover:bg-slate-100 text-slate-400 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50/30">
          {step === 'upload' && (
            <div className="p-10 space-y-6">
              <div className="flex items-center justify-between p-5 rounded-3xl bg-emerald-50 border border-emerald-100 mb-2">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-emerald-100 flex items-center justify-center">
                    <Download className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800">Download Template Import</h4>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">Isi data jadwal shift sesuai format agar tidak terjadi kesalahan</p>
                  </div>
                </div>
                <button onClick={() => generateMappingTemplate(shifts, allEmployees)} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-200">
                  Unduh Template
                </button>
              </div>
              <div
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={e => { e.preventDefault(); setIsDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-[32px] p-16 text-center cursor-pointer transition-all duration-300",
                  isDragOver ? "border-emerald-400 bg-emerald-50/50 shadow-inner" : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50/50"
                )}
              >
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
                <div className="flex flex-col items-center gap-5">
                  <div className={cn("w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-300 shadow-lg", isDragOver ? "bg-emerald-500 scale-110" : "bg-slate-900")}>
                    <Upload className={cn("w-9 h-9 text-white")} />
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-800">Upload File Excel Anda</p>
                    <p className="text-sm text-slate-400 font-medium mt-1">Drag & drop file template yang sudah diisi di sini</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="flex flex-col h-full">
              <div className="px-8 py-4 border-b border-slate-100 bg-white flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-[11px] font-bold text-slate-500">
                    <FileSpreadsheet className="w-3.5 h-3.5" /> {fileInfo?.name} ({fileInfo?.size})
                  </div>
                  <div className="h-4 w-px bg-slate-200" />
                  <span className="text-[12px] font-extrabold text-emerald-600">{rows.length} Baris ditemukan</span>
                </div>
                {errorCount > 0 && (
                  <button onClick={() => setFilterError(!filterError)} className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all", filterError ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-500 hover:bg-rose-50")}>
                    {filterError ? 'Tampilkan Semua' : `Lihat ${errorCount} Error Saja`}
                  </button>
                )}
              </div>
              <div className="overflow-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white shadow-sm z-10">
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="px-6 py-4">Baris</th>
                      <th className="px-4 py-4">ID User</th>
                      <th className="px-4 py-4">ID Shift</th>
                      <th className="px-4 py-4">Tgl Mulai</th>
                      <th className="px-4 py-4">Tgl Akhir</th>
                      <th className="px-4 py-4">Loc</th>
                      <th className="px-4 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayRows.map((r) => (
                      <tr key={r.rowIndex} className="text-sm hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-[11px] text-slate-300">#{r.rowIndex}</td>
                        <td className="px-4 py-4">
                          <p className="font-bold text-slate-800 leading-none">{r.user_id}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{r.user_name || '-'}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-bold text-slate-800 leading-none">{r.shift_id}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{r.shift_name || '-'}</p>
                        </td>
                        <td className="px-4 py-4 font-mono text-xs text-slate-600">{r.tanggal_mulai}</td>
                        <td className="px-4 py-4 font-mono text-xs text-slate-600">{r.tanggal_akhir}</td>
                        <td className="px-4 py-4">
                          <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-black", r.lock_location ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-400")}>
                            {r.lock_location ? 'YES' : 'NO'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider", r.status === 'error' ? "bg-rose-50 text-rose-500" : r.status === 'success' ? "bg-emerald-50 text-emerald-500" : "bg-slate-100 text-slate-400")}>
                            {r.status === 'pending' && <Clock className="w-3 h-3" />}
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="p-20 flex flex-col items-center gap-10">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-200 blur-3xl opacity-30 animate-pulse" />
                <div className="relative w-32 h-32 rounded-[40px] bg-slate-900 flex items-center justify-center shadow-2xl">
                  <Loader2 className="w-12 h-12 text-white animate-spin" />
                </div>
              </div>
              <div className="text-center">
                <h4 className="text-2xl font-black text-slate-900">Mengimport Data...</h4>
                <p className="text-slate-400 font-medium mt-2">Mohon jangan tutup jendela ini sampai selesai</p>
                
                <div className="mt-10 w-full max-w-sm mx-auto">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
                    <span className="text-lg font-black text-emerald-500">{progress}%</span>
                  </div>
                  <div className="h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner p-1">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full" 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'done' && result && (
            <div className="p-12 flex flex-col items-center gap-8">
              <div className={cn("w-24 h-24 rounded-[40px] flex items-center justify-center shadow-xl", result.failed === 0 ? "bg-emerald-500" : "bg-amber-500")}>
                <Check className="w-12 h-12 text-white" />
              </div>
              <div className="text-center">
                <h4 className="text-2xl font-black text-slate-800">Import Selesai!</h4>
                <div className="flex items-center justify-center gap-4 mt-4">
                  <div className="px-5 py-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <p className="text-2xl font-black text-emerald-600">{result.success}</p>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Berhasil</p>
                  </div>
                  <div className="px-5 py-3 bg-rose-50 rounded-2xl border border-rose-100">
                    <p className="text-2xl font-black text-rose-600">{result.failed}</p>
                    <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Gagal</p>
                  </div>
                </div>
              </div>
              <div className="w-full max-w-lg border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 font-bold text-slate-400 text-[10px] uppercase">
                    <tr>
                      <th className="px-4 py-3">Baris</th>
                      <th className="px-4 py-3">Hasil</th>
                      <th className="px-4 py-3">Pesan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {rows.map(r => (
                      <tr key={r.rowIndex}>
                        <td className="px-4 py-3 font-mono text-[10px] text-slate-300">#{r.rowIndex}</td>
                        <td className="px-4 py-3">
                          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-black uppercase", r.status === 'success' ? "text-emerald-500 bg-emerald-50" : "text-rose-500 bg-rose-50")}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{r.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 shrink-0">
          {step === 'upload' && (
            <button onClick={onClose} className="px-8 py-3 bg-white border border-slate-200 text-slate-600 font-black rounded-2xl hover:bg-slate-50 transition-all text-sm uppercase tracking-wider">Batal</button>
          )}
          {step === 'preview' && (
            <>
              <button onClick={() => setStep('upload')} className="px-8 py-3 bg-white border border-slate-200 text-slate-400 font-black rounded-2xl hover:bg-slate-50 transition-all text-sm uppercase tracking-wider">Ganti File</button>
              <button onClick={handleImport} className="px-8 py-3 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all text-sm uppercase tracking-wider flex items-center gap-2">Import Data <ChevronRight className="w-4 h-4" /></button>
            </>
          )}
          {step === 'done' && (
            <button onClick={onClose} className="px-10 py-3 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all text-sm uppercase tracking-wider">Selesai</button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function parseMappingExcel(file: File): Promise<ImportMappingRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const raw = XLSX.utils.sheet_to_json<any>(ws, { defval: '' });

        const getVal = (row: any, keys: string[]) => {
          for (const k of keys) {
            const v = row[k] ?? row[k.toLowerCase()] ?? '';
            if (v !== '') return String(v).trim();
          }
          return '';
        };

        const rows: ImportMappingRow[] = raw
          .slice(0, 1000)
          .map((row: any, i: number) => {
            const startDateRaw = getVal(row, ['Tanggal Mulai*', 'Tanggal Mulai', 'start_date', 'Tanggal Mulai* (DD/MM/YYYY)']);
            const endDateRaw = getVal(row, ['Tanggal Akhir*', 'Tanggal Akhir', 'end_date', 'Tanggal Akhir* (DD/MM/YYYY)']);
            
            const formatDate = (v: any) => {
              if (!v) return '';
              if (v instanceof Date) {
                const y = v.getUTCFullYear();
                const m = String(v.getUTCMonth() + 1).padStart(2, '0');
                const d = String(v.getUTCDate()).padStart(2, '0');
                return `${y}-${m}-${d}`;
              }
              const s = String(v).trim();
              if (s.includes('/')) {
                const parts = s.split('/');
                if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
              }
              return s;
            };

            return {
              rowIndex: 0,
              user_id: getVal(row, ['ID Karyawan*', 'id_user', 'user_id', 'id_karyawan']),
              user_name: getVal(row, ['Nama Karyawan (Info)', 'nama_karyawan', 'user_name']),
              shift_id: getVal(row, ['ID Shift*', 'id_shift', 'shift_id']),
              shift_name: getVal(row, ['Nama Shift (Info)', 'nama_shift', 'shift_name']),
              tanggal_mulai: formatDate(startDateRaw),
              tanggal_akhir: formatDate(endDateRaw),
              lock_location: parseInt(getVal(row, ['Lock Location (1/0)', 'lock_location'])) || 0,
              status: 'pending' as const,
            };
          })
          .filter((r: ImportMappingRow) => r.user_id && r.shift_id)
          .map((r: ImportMappingRow, i: number) => ({ ...r, rowIndex: i + 1 }));

        resolve(rows);
      } catch (err) {
        reject(new Error('File tidak valid atau format tidak sesuai template'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsArrayBuffer(file);
  });
}
