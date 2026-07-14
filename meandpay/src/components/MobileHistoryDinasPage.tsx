import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  Search, 
  MapPin, 
  Clock, 
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  History
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

interface DinasData {
  id: string;
  user_id: string;
  shift_id: string;
  tanggal: string;
  jam_absen: string | null;
  telat: string;
  jarak_masuk: string | null;
  foto_jam_absen: string | null;
  jam_pulang: string | null;
  pulang_cepat: string;
  jarak_pulang: string | null;
  foto_jam_pulang: string | null;
  status_absen: string;
  users: {
    name: string;
    foto_karyawan?: string | null;
  } | null;
  shifts?: {
    nama_shift: string;
    jam_masuk: string;
    jam_keluar: string;
  } | null;
}

export function MobileHistoryDinasPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DinasData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      // Fetch all dinas luar data and filter by user on the frontend, similar to other history pages
     // console.log('cekurl',${import.meta.env.VITE_API_MEANDPAY}/dinas-luar);
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/dinas-luar`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const json = await res.json();
      if (json.success) {
        let result = json.data || [];
        // Ensure result is an array
        if (!Array.isArray(result)) {
           result = [result];
        }
        
        // For mobile "My Dinas Luar", filter by user_id if it's a regular pegawai
        if (user.role_id === 8 || user.role_id === '8') {
          result = result.filter((item: any) => String(item.user_id) === String(user.id));
        } else {
          // For other roles, also filter by user_id on this "My Dinas Luar" page to show only their own data
          // based on the page title "My Dinas Luar"
          
          result = result.filter((item: any) => String(item.user_id) === String(user.id));
        }

        // Sort descending by date
        result.sort((a: any, b: any) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

        setData(result);
      } else {
        setError(json.message || 'Gagal mengambil data dinas');
      }
    } catch (err) {
      setError('Masalah koneksi ke server');
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter(item => {
    if (!filterStart && !filterEnd) return true;
    const itemDate = new Date(item.tanggal).getTime();
    if (filterStart && itemDate < new Date(filterStart).getTime()) return false;
    if (filterEnd && itemDate > new Date(filterEnd).getTime()) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      {/* Premium Header */}
      <div className="bg-indigo-700 pt-12 pb-20 px-6 rounded-b-[3rem] relative overflow-hidden shadow-xl shadow-indigo-500/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-400/20 rounded-full blur-2xl -ml-10 -mb-10" />
        
        <div className="relative z-10 flex items-center gap-4">
          <button 
            onClick={() => navigate('/beranda')}
            className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 text-white active:scale-90 transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-black text-white tracking-tight">My Dinas Luar</h1>
        </div>
      </div>

      {/* Filter Card */}
      <div className="px-6 -mt-10 relative z-20">
        <div className="bg-white rounded-3xl shadow-xl shadow-indigo-500/5 p-4 border border-slate-100 flex items-center gap-3">
          <div className="flex-1 space-y-1">
            <input 
              type="date" 
              value={filterStart}
              onChange={(e) => setFilterStart(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 outline-none focus:border-indigo-500 transition-all"
              placeholder="Tanggal Mulai"
            />
          </div>
          <div className="flex-1 space-y-1">
            <input 
              type="date" 
              value={filterEnd}
              onChange={(e) => setFilterEnd(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 outline-none focus:border-indigo-500 transition-all"
              placeholder="Tanggal Akhir"
            />
          </div>
          <button className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all">
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content Table */}
      <div className="mt-8 px-6">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">No.</th>
                  <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Nama Pegawai</th>
                  <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Shift</th>
                  <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Tanggal</th>
                  <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Jam Masuk</th>
                  <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Telat</th>
                  <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Lokasi</th>
                  <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Foto</th>
                  <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Pulang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-20">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                        <p className="text-xs font-black text-slate-400 tracking-widest uppercase">Memuat data...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center shadow-inner">
                          <History className="w-8 h-8 text-slate-200" />
                        </div>
                        <p className="text-xs font-black text-slate-400 tracking-widest uppercase">No data available in table</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredData.map((item, idx) => (
                  <tr key={item.id} className="active:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 text-xs font-black text-slate-300">{idx + 1}</td>
                    <td className="py-4 px-6 text-xs font-black text-slate-700">{item.users?.name || '-'}</td>
                    <td className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase">{item.shifts?.nama_shift || '-'}</td>
                    <td className="py-4 px-6 text-xs font-bold text-slate-500">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1">
                        <span className={cn(
                          "px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter",
                          item.jam_absen ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"
                        )}>
                          {item.jam_absen || '--:--'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs font-bold text-rose-500">{item.telat ? `${item.telat}m` : '-'}</td>
                    <td className="py-4 px-6">
                      <MapPin className="w-4 h-4 text-slate-300" />
                    </td>
                    <td className="py-4 px-6">
                      {item.foto_jam_absen ? (
                        <div className="w-8 h-8 rounded-lg bg-slate-100 overflow-hidden border border-slate-200">
                          <img 
                            src={`${import.meta.env.VITE_API_MEANDPAY.replace('/api', '')}/uploads/${item.foto_jam_absen.split('/').pop()}`} 
                            className="w-full h-full object-cover"
                            alt="Foto"
                          />
                        </div>
                      ) : (
                        <ImageIcon className="w-4 h-4 text-slate-200" />
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className={cn(
                        "px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter",
                        item.jam_pulang ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"
                      )}>
                        {item.jam_pulang || '--:--'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mt-8 px-6">
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500" />
            <p className="text-xs font-bold text-rose-600">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
