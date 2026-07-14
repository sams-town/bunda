import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  Target, 
  ClipboardCheck, 
  Briefcase, 
  Loader2,
  TrendingUp,
  Star,
  Activity,
  Plus,
  BarChart3,
  Award
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_API_MEANDPAY;

type KinerjaType = 'pegawai' | 'laporan' | 'target';

export function MobileKinerjaPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<KinerjaType>('pegawai');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKinerjaData();
  }, [activeTab]);

  const fetchKinerjaData = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      let endpoint = '';
      if (activeTab === 'pegawai') endpoint = '/kinerja-pegawai';
      else if (activeTab === 'laporan') endpoint = '/kinerja-laporan-kerja';
      else endpoint = '/finance-target-kinerja';

      const res = await fetch(`${BASE_URL}${endpoint}?user_id=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data.sort((a: any, b: any) => new Date(b.created_at || b.tanggal).getTime() - new Date(a.created_at || a.tanggal).getTime()));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32">
      {/* Header */}
      <div className="bg-indigo-700 pt-12 pb-24 px-6 rounded-b-[3.5rem] relative shadow-2xl shadow-indigo-500/20">
        <div className="flex items-center justify-between relative z-10 text-white mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/beranda')} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-black tracking-tight">Kinerja & Target</h1>
          </div>
          <button className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-700 shadow-lg active:scale-95">
            <TrendingUp className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-1 flex relative z-10 border border-white/10">
          {(['pegawai', 'laporan', 'target'] as KinerjaType[]).map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={cn(
                 "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                 activeTab === tab ? "bg-white text-indigo-700 shadow-lg" : "text-white/60"
               )}
             >
               {tab}
             </button>
          ))}
        </div>
      </div>

      {/* Hero Achievement */}
      <div className="px-6 -mt-12 relative z-20">
         <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2.5rem] shadow-xl p-8 text-white relative overflow-hidden">
            <div className="relative z-10 flex items-center justify-between">
               <div>
                  <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">Achievement Score</p>
                  <p className="text-4xl font-black tabular-nums">98.5%</p>
               </div>
               <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-lg border border-white/30">
                  <Award className="w-10 h-10 text-white" />
               </div>
            </div>
            <div className="mt-6 flex items-center gap-2">
               <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 w-[98.5%] shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
               </div>
               <span className="text-[10px] font-black">EXCELLENT</span>
            </div>
         </div>
      </div>

      {/* Content */}
      <div className="mt-8 px-6 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Menganalisa kinerja...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center py-24 bg-white rounded-[2.5rem] border border-slate-100 italic">
             <BarChart3 className="w-12 h-12 text-slate-200 mb-2" />
             <p className="text-xs font-bold text-slate-400">Data belum tersedia</p>
          </div>
        ) : (
          data.map((item, i) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-[2.5rem] p-7 shadow-xl shadow-slate-200/30 border border-slate-100 flex flex-col gap-4"
            >
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shadow-inner",
                      activeTab === 'pegawai' ? "bg-amber-50 text-amber-500" :
                      activeTab === 'laporan' ? "bg-blue-50 text-blue-500" : "bg-rose-50 text-rose-500"
                    )}>
                       {activeTab === 'pegawai' ? <Star className="w-5 h-5" /> :
                        activeTab === 'laporan' ? <ClipboardCheck className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                    </div>
                    <div>
                       <h3 className="text-sm font-black text-slate-800 leading-tight">
                         {item.nama_kegiatan || item.nama_kinerja || item.judul_target || 'Target Tahunan'}
                       </h3>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(item.created_at || item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                     <p className="text-xs font-black text-slate-900">{item.score || item.progress || '80'}%</p>
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Progress</p>
                  </div>
               </div>

               <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">
                    "{item.keterangan || item.uraian || 'Tingkatkan kualitas kerja untuk hasil terbaik.'}"
                  </p>
               </div>

               <div className="flex items-center justify-between gap-4">
                  <div className="flex -space-x-2">
                     <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-100 shadow-sm" />
                     <div className="w-8 h-8 rounded-full border-2 border-white bg-emerald-100 shadow-sm" />
                  </div>
                  <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-4 py-2 rounded-xl transition-all active:scale-95">Lihat Analisa</button>
               </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
