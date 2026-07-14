import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  MapPin, 
  Clock, 
  Loader2,
  Calendar,
  History,
  Eye,
  Camera,
  CornerDownRight,
  User as UserIcon,
  CircleCheck,
  CircleX,
  Map as MapIcon,
  Info
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_API_MEANDPAY;

interface AttendanceRecord {
  id: string;
  tanggal: string;
  jam_absen: string | null;
  jam_pulang: string | null;
  telat: string;
  pulang_cepat: string;
  foto_jam_absen: string | null;
  foto_jam_pulang: string | null;
  status_absen: string;
  keterangan_masuk: string | null;
  keterangan_pulang: string | null;
  lat_absen: string | null;
  long_absen: string | null;
  lat_pulang: string | null;
  long_pulang: string | null;
  shifts?: {
    nama_shift: string;
    jam_masuk: string;
    jam_keluar: string;
  } | null;
}

const toDateInput = (d: Date) => d.toISOString().split('T')[0];

export function MobileAttendancePage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Default: hari ini
  const today = toDateInput(new Date());
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);

  useEffect(() => {
    fetchRecords();
  }, [dateFrom, dateTo]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user?.id) {
        setRecords([]);
        return;
      }

      // Bangun URL: jika ada filter tanggal, sertakan; jika tidak, ambil semua data
      const url = dateFrom && dateTo
        ? `${BASE_URL}/absensi_user_history/${user.id}/${dateFrom}/${dateTo}`
        : `${BASE_URL}/absensi_user_history/${user.id}`;
        console.log('url', url)

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const json = await res.json();
      if (json.success) {
        const raw = json.data;
        const arr: AttendanceRecord[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
        setRecords(arr.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()));
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.error(err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const getPhotoUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const filename = path.split('/').pop();
    return `${BASE_URL.replace('/api', '')}/uploads/${filename}`;
  };

  const filteredRecords = records.filter(record => {
    const t = new Date(record.tanggal).getTime();
    const from = dateFrom ? new Date(dateFrom).getTime() : null;
    const to = dateTo ? new Date(dateTo + 'T23:59:59').getTime() : null;
    if (from && t < from) return false;
    if (to && t > to) return false;
    return true;
  });

  const hasFilter = dateFrom || dateTo;
  const clearFilter = () => { setDateFrom(today); setDateTo(today); };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-28">
      {/* Premium Header */}
      <div className="bg-indigo-700 pt-14 pb-20 px-6 rounded-b-[3rem] relative overflow-hidden shadow-2xl shadow-indigo-500/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-400/20 rounded-full blur-2xl -ml-10 -mb-10" />
        
        <div className="relative z-10 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/beranda')} 
                className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 active:scale-90 transition-all"
              >
                <ChevronLeft className="text-white w-6 h-6" />
              </button>
              <div>
                <h1 className="text-white text-xl font-black tracking-tight leading-tight">Riwayat Kehadiran</h1>
                <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mt-0.5">Logs & Analytics</p>
              </div>
           </div>
        </div>
      </div>

      <div className="px-6 -mt-10 relative z-20 space-y-4">

        {/* ─── FILTER DATE RANGE CARD ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] shadow-xl shadow-indigo-500/10 border border-white p-4"
        >
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Calendar className="w-3 h-3" /> Filter Periode
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Dari</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Sampai</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                min={dateFrom || undefined}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
              />
            </div>
          </div>
          <AnimatePresence>
            {hasFilter && (
              <motion.button
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                onClick={clearFilter}
                className="mt-3 w-full py-2 rounded-xl bg-rose-50 border border-rose-100 text-[10px] font-black text-rose-500 uppercase tracking-wider"
              >
                Reset Filter
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Summary Mini Card */}
        <div className="bg-white rounded-[2.2rem] p-5 shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center justify-around divide-x divide-slate-100">
           <div className="text-center px-4">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
              <p className="text-xl font-black text-slate-800">{filteredRecords.length}</p>
           </div>
           <div className="text-center px-4">
              <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Hadir</p>
              <p className="text-xl font-black text-emerald-600">
                {filteredRecords.filter(r => r.jam_absen).length}
              </p>
           </div>
           <div className="text-center px-4">
              <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">Telat</p>
              <p className="text-xl font-black text-rose-600">
                {filteredRecords.filter(r => Number(r.telat) > 0).length}
              </p>
           </div>
        </div>

        {/* List of records */}
        <div className="space-y-5">
          {loading ? (
             <div className="flex flex-col items-center py-24 gap-4">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Menyiapkan Arsip Kehadiran...</p>
             </div>
          ) : filteredRecords.length === 0 ? (
             <div className="bg-white rounded-[2.5rem] p-16 text-center border border-slate-100 shadow-sm">
                <div className="w-20 h-20 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
                   <History className="w-10 h-10 text-slate-200" />
                </div>
                <h3 className="text-lg font-black text-slate-800">Tidak Ada Data</h3>
                <p className="text-xs text-slate-400 font-bold mt-1">Belum ada catatan kehadiran untuk periode ini.</p>
                {hasFilter && (
                  <button onClick={clearFilter} className="mt-6 text-xs font-black text-indigo-600 uppercase underline tracking-widest">Lihat Semua</button>
                )}
             </div>
          ) : (
            filteredRecords.map((record, i) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-[2.5rem] overflow-hidden shadow-lg shadow-slate-200/60 border border-slate-100"
              >
                {/* Card Header: Date & Shift */}
                <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center">
                         <p className="text-indigo-600 text-xs font-black leading-none">
                            {new Date(record.tanggal).getDate()}
                         </p>
                      </div>
                      <div>
                         <p className="text-xs font-black text-slate-800 tracking-tight">
                            {new Date(record.tanggal).toLocaleDateString('id-ID', { weekday: 'long', month: 'long', year: 'numeric' })}
                         </p>
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mt-0.5">
                            {record.shifts?.nama_shift || 'Reguler Shift'}
                         </p>
                      </div>
                   </div>
                   <div className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider",
                      record.status_absen === 'Masuk' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                      record.status_absen === 'Libur' ? "bg-indigo-50 text-indigo-600 border border-indigo-100" :
                      "bg-rose-50 text-rose-500 border border-rose-100"
                   )}>
                      {record.status_absen || 'Belum Absen'}
                   </div>
                </div>

                {/* Card Content: Split IN & OUT */}
                <div className="p-6">
                   <div className="grid grid-cols-2 gap-6 relative">
                      {/* Vertical separator */}
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-100 -translate-x-1/2" />

                      {/* Masuk */}
                      <div className="space-y-4">
                         <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                               <Clock className="w-3 h-3 text-emerald-500" />
                            </div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Check In</span>
                         </div>
                         
                         {record.jam_absen ? (
                            <div className="space-y-3">
                               <div>
                                  <p className="text-xl font-black text-slate-800 tabular-nums leading-none">{record.jam_absen}</p>
                                  <p className={cn(
                                     "text-[8px] font-black uppercase tracking-tighter mt-1.5",
                                     Number(record.telat) > 0 ? "text-rose-500" : "text-emerald-500"
                                  )}>
                                     {Number(record.telat) > 0 ? `Telat ${record.telat} Menit` : '✓ Tepat Waktu'}
                                  </p>
                               </div>

                               <div className="flex gap-2">
                                  {record.foto_jam_absen && (
                                     <button className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-100 shadow-sm active:scale-90 transition-all">
                                        <img src={getPhotoUrl(record.foto_jam_absen)!} className="w-full h-full object-cover" alt="" />
                                        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                                           <Camera className="w-3 h-3 text-white drop-shadow-md" />
                                        </div>
                                     </button>
                                  )}
                                  {record.lat_absen && (
                                     <button className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 active:scale-90 transition-all">
                                        <MapIcon className="w-4 h-4" />
                                     </button>
                                  )}
                               </div>

                               {record.keterangan_masuk && (
                                  <div className="flex gap-2 items-start p-2 bg-slate-50 rounded-xl border border-dotted border-slate-200">
                                     <Info className="w-2.5 h-2.5 text-slate-300 mt-0.5" />
                                     <p className="text-[8px] font-bold text-slate-500 italic leading-tight">{record.keterangan_masuk}</p>
                                  </div>
                               )}
                            </div>
                         ) : (
                            <div className="py-2">
                               <p className="text-xs font-bold text-slate-300 italic">No entry data</p>
                            </div>
                         )}
                      </div>

                      {/* Pulang */}
                      <div className="space-y-4">
                         <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center">
                               <Clock className="w-3 h-3 text-rose-500" />
                            </div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Check Out</span>
                         </div>

                         {record.jam_pulang ? (
                            <div className="space-y-3">
                               <div>
                                  <p className="text-xl font-black text-slate-800 tabular-nums leading-none">{record.jam_pulang}</p>
                                  <p className={cn(
                                     "text-[8px] font-black uppercase tracking-tighter mt-1.5",
                                     Number(record.pulang_cepat) > 0 ? "text-amber-500" : "text-emerald-500"
                                  )}>
                                     {Number(record.pulang_cepat) > 0 ? `Pulang Cepat` : '✓ Tepat Waktu'}
                                  </p>
                               </div>

                               <div className="flex gap-2">
                                  {record.foto_jam_pulang && (
                                     <button className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-100 shadow-sm active:scale-90 transition-all">
                                        <img src={getPhotoUrl(record.foto_jam_pulang)!} className="w-full h-full object-cover" alt="" />
                                        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                                           <Camera className="w-3 h-3 text-white drop-shadow-md" />
                                        </div>
                                     </button>
                                  )}
                                  {record.lat_pulang && (
                                     <button className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 active:scale-90 transition-all">
                                        <MapIcon className="w-4 h-4" />
                                     </button>
                                  )}
                               </div>

                               {record.keterangan_pulang && (
                                  <div className="flex gap-2 items-start p-2 bg-slate-50 rounded-xl border border-dotted border-slate-200">
                                     <Info className="w-2.5 h-2.5 text-slate-300 mt-0.5" />
                                     <p className="text-[8px] font-bold text-slate-500 italic leading-tight">{record.keterangan_pulang}</p>
                                  </div>
                               )}
                            </div>
                         ) : (
                            <div className="py-2">
                               <p className="text-xs font-bold text-slate-300 italic">Working...</p>
                            </div>
                         )}
                      </div>
                   </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
