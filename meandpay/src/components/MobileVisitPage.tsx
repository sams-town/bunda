import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  MapPin, 
  Search, 
  Plus, 
  Loader2,
  Navigation,
  Stethoscope,
  Presentation,
  ClipboardList,
  Briefcase,
  History,
  Calendar,
  MoreVertical,
  Clock
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_API_MEANDPAY;

type VisitType = 'kunjungan' | 'penugasan' | 'rapat' | 'dokter';

export function MobileVisitPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<VisitType>('kunjungan');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVisitData();
  }, [activeTab]);

  const fetchVisitData = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      let endpoint = '';
      if (activeTab === 'kunjungan') endpoint = '/visit-kunjungan';
      else if (activeTab === 'penugasan') endpoint = '/visit-penugasan';
      else if (activeTab === 'rapat') endpoint = '/visit-rapat';
      else endpoint = '/visit-dokter';

      const res = await fetch(`${BASE_URL}${endpoint}?user_id=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const icons = {
    kunjungan: Navigation,
    penugasan: ClipboardList,
    rapat: Presentation,
    dokter: Stethoscope
  };

  const Icon = icons[activeTab];

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32">
      {/* Header */}
      <div className="bg-indigo-700 pt-12 pb-24 px-6 rounded-b-[3.5rem] relative shadow-2xl shadow-indigo-500/20">
        <div className="flex items-center justify-between relative z-10 text-white mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/beranda')} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-black tracking-tight">Kunjungan & Tugas</h1>
          </div>
          <button className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-700 shadow-lg active:scale-95">
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Switcher - Scrollable */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 relative z-10">
          {(['kunjungan', 'penugasan', 'rapat', 'dokter'] as VisitType[]).map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={cn(
                 "px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap",
                 activeTab === tab ? "bg-white text-indigo-700 shadow-lg" : "bg-white/10 text-white/60 backdrop-blur-md"
               )}
             >
               {tab}
             </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="mt-8 px-6 space-y-4 -mt-10 relative z-20">
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sinkronisasi data...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center py-24 bg-white rounded-[2.5rem] border border-slate-100 shadow-inner">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Icon className="w-10 h-10 text-slate-200" />
             </div>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Belum ada riwayat {activeTab}</p>
          </div>
        ) : (
          data.map((item, i) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/20 border border-slate-100 relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-4">
                 <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
                      activeTab === 'kunjungan' ? "bg-amber-50 text-amber-500" :
                      activeTab === 'penugasan' ? "bg-blue-50 text-blue-500" :
                      activeTab === 'rapat' ? "bg-rose-50 text-rose-500" : "bg-sky-50 text-sky-500"
                    )}>
                       <Icon className="w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="text-sm font-black text-slate-800 leading-tight">
                         {item.tujuan_kunjungan || item.nama_penugasan || item.nama_rapat || item.keperluan || 'Aktivitas Luar'}
                       </h3>
                       <p className="text-[10px] font-bold text-slate-400">{new Date(item.created_at || item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                 </div>
                 <button className="p-2 text-slate-300"><MoreVertical className="w-5 h-5" /></button>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                 <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">{item.lokasi || 'Lokasi tidak spesifik'}</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">{item.jam || '--:--'}</span>
                 </div>
                 {item.keterangan && (
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic border-t border-slate-200 pt-2 transition-all">
                       "{item.keterangan}"
                    </p>
                 )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
