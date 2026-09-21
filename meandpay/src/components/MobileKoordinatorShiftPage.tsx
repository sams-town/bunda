import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Search, Users, Calendar, Loader2, ChevronRight
} from 'lucide-react';
import { cn, formatPhotoUrl } from '../lib/utils';
import { MappingShift } from './MappingShift';

const BASE_URL = import.meta.env.VITE_API_MEANDPAY;

/* ─── Types ─────────────────────────────────────────────── */
interface Employee {
  id: string;
  name: string;
  username: string;
  foto_karyawan?: string | null;
  jabatan?: { id: string; nama_jabatan: string } | null;
  lokasi?: { id: string; nama_lokasi: string } | null;
}

interface MobileKoordinatorShiftPageProps {
  onBack: () => void;
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

/* ─── Main Component ─────────────────────────────────────── */
export function MobileKoordinatorShiftPage({ onBack }: MobileKoordinatorShiftPageProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/users?limit=1000`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setEmployees(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.jabatan?.nama_jabatan || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.lokasi?.nama_lokasi || '').toLowerCase().includes(search.toLowerCase())
  );

  // When an employee is selected, show the MappingShift component
  if (selectedEmployee) {
    return (
      <MappingShift
        employee={selectedEmployee}
        onBack={() => setSelectedEmployee(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* ── Header ── */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={onBack} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Kelola Jadwal Shift</h1>
            <p className="text-xs text-slate-400 mt-0.5">Pilih pegawai untuk mengatur jadwal shift</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 rounded-full">
            <Users className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-bold text-teal-700">{filtered.length}</span>
          </div>
        </div>

        {/* ── Search ── */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama, jabatan, lokasi..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 transition-colors">
                <span className="text-slate-400 text-xs font-bold">✕</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Employee List ── */}
      <div className="px-4 py-4 space-y-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
            <p className="text-sm text-slate-400 font-medium">Memuat data pegawai...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Users className="w-10 h-10 text-slate-300" />
            <p className="text-sm text-slate-400 font-medium">
              {search ? 'Tidak ditemukan pegawai yang cocok' : 'Belum ada data pegawai'}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map((emp, i) => (
              <motion.button
                key={emp.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2, delay: i * 0.02 }}
                onClick={() => setSelectedEmployee(emp)}
                className="w-full flex items-center gap-3.5 p-3.5 bg-white rounded-2xl border border-slate-100 hover:border-teal-200 hover:shadow-md hover:shadow-teal-50 active:scale-[0.98] transition-all group"
              >
                {/* Avatar */}
                {emp.foto_karyawan ? (
                  <img
                    src={formatPhotoUrl(emp.foto_karyawan)}
                    alt={emp.name}
                    className="w-11 h-11 rounded-xl object-cover ring-2 ring-slate-100 group-hover:ring-teal-200 transition-all"
                  />
                ) : (
                  <div className={cn(
                    'w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-sm font-bold ring-2 ring-slate-100 group-hover:ring-teal-200 transition-all',
                    avatarGradient(emp.id)
                  )}>
                    {initials(emp.name)}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-teal-700 transition-colors">{emp.name}</p>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {emp.jabatan?.nama_jabatan || 'Belum ada jabatan'}
                    {emp.lokasi?.nama_lokasi ? ` · ${emp.lokasi.nama_lokasi}` : ''}
                  </p>
                </div>

                {/* Arrow */}
                <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                  <Calendar className="w-4 h-4 text-teal-500" />
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-500 transition-colors" />
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
