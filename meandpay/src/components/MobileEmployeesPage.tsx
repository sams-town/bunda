import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  User,
  MapPin,
  Briefcase,
  Calendar,
  Phone,
  ArrowRight,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_API_MEANDPAY;

interface Employee {
  id: string;
  name: string;
  username: string;
  foto_karyawan: string | null;
  jabatan: { id: string; nama_jabatan: string } | null;
  lokasi: { id: string; nama_lokasi: string } | null;
  roles: string[];
  telepon: string | null;
  tgl_join: string | null;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function MobileEmployeesPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  const fetchEmployees = useCallback(async (currentPage: number, currentSearch: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '10',
        ...(currentSearch ? { search: currentSearch } : {}),
      });
      const res = await fetch(`${BASE_URL}/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const json = await res.json();
      if (json.success) {
        setEmployees(json.data);
        setMeta(json.meta);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees(page, search);
  }, [page, search, fetchEmployees]);

  const handleSearch = (val: string) => {
    setSearchInput(val);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      setSearch(val);
    }, 500);
  };

  const getPhotoUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const filename = path.includes('/') ? path.split('/').pop() : path;
    return `${BASE_URL.replace('/api', '')}/uploads/${filename}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      {/* Premium Header */}
      <div className="bg-indigo-700 pt-12 pb-24 px-6 rounded-b-[3.5rem] relative overflow-hidden shadow-2xl shadow-indigo-500/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 rounded-full blur-2xl -ml-16 -mb-16" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={() => navigate('/beranda')}
              className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 text-white active:scale-90 transition-all"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Pegawai</h1>
              <p className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em]">Daftar Rekan Kerja</p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-6 text-white/90">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg border border-indigo-500/30">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Total</p>
                <p className="text-sm font-black">{meta.total} Orang</p>
              </div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30 shadow-lg">
                <UserCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Aktif</p>
                <p className="text-sm font-black text-emerald-50">{meta.total} User</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-6 -mt-10 relative z-20">
        <div className="bg-white rounded-[2rem] shadow-2xl shadow-indigo-500/5 p-2 border border-slate-100 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              value={searchInput}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Cari nama atau username..."
              className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Employee List */}
      <div className="mt-8 px-6 space-y-4">
        {loading && employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-xl flex items-center justify-center">
              <Loader2 className="w-7 h-7 text-indigo-500 animate-spin" />
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Memuat database...</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] mt-4 border border-slate-100 shadow-inner">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Users className="w-10 h-10 text-slate-200" />
             </div>
             <p className="text-sm font-black text-slate-400 tracking-tight">Tidak ada pegawai ditemukan</p>
          </div>
        ) : (
          employees.map((emp, i) => (
            <motion.div
              key={emp.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/30 border border-slate-100 group active:scale-[0.98] transition-all relative overflow-hidden"
              onClick={() => {/* View detail maybe? */}}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 group-hover:bg-indigo-100 transition-colors duration-500" />
              
              <div className="relative z-10 flex items-start gap-5">
                {/* Avatar */}
                <div className="shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 border-2 border-white shadow-xl overflow-hidden relative">
                    {emp.foto_karyawan ? (
                      <img 
                        src={getPhotoUrl(emp.foto_karyawan)!} 
                        className="w-full h-full object-cover"
                        alt={emp.name}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-indigo-300">
                        <User className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-base font-black text-slate-900 tracking-tight truncate pr-4">{emp.name}</h3>
                  </div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 pr-4 truncate">
                    {emp.jabatan?.nama_jabatan || 'Position TBD'}
                  </p>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center gap-2 text-slate-500">
                      <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <span className="text-[10px] font-bold truncate">{emp.lokasi?.nama_lokasi || 'Remote / Unassigned'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <span className="text-[10px] font-bold">{emp.telepon || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="shrink-0 self-center">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:translate-x-1">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && meta.totalPages > 1 && (
        <div className="mt-10 px-6 flex items-center justify-center gap-4">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="w-12 h-12 bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center text-slate-400 disabled:opacity-30 active:scale-90 transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="bg-slate-900 px-6 py-3 rounded-2xl shadow-xl">
             <span className="text-xs font-black text-white tracking-widest uppercase">Page {page} / {meta.totalPages}</span>
          </div>
          <button 
            disabled={page === meta.totalPages}
            onClick={() => setPage(p => p + 1)}
            className="w-12 h-12 bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center text-slate-400 disabled:opacity-30 active:scale-90 transition-all"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}
