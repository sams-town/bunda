import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Wallet, 
  HandCoins, 
  Banknote, 
  Loader2,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  History,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_API_MEANDPAY;

type FinanceType = 'kasbon' | 'reimbursement' | 'pengajuan';

export function MobileFinancePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FinanceType>('kasbon');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinanceData();
  }, [activeTab]);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      let endpoint = '';
      if (activeTab === 'kasbon') endpoint = '/finance-kasbon';
      else if (activeTab === 'reimbursement') endpoint = '/reimbursements';
      else endpoint = '/finance-pengajuan';

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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'approved' || s === 'diterima' || s === 'lunas') return 'bg-emerald-50 text-emerald-600';
    if (s === 'rejected' || s === 'ditolak') return 'bg-rose-50 text-rose-600';
    return 'bg-amber-50 text-amber-600';
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
            <h1 className="text-xl font-black tracking-tight">Keuangan Saya</h1>
          </div>
          <button className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-700 shadow-lg active:scale-95">
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-1 flex relative z-10 border border-white/10">
          {(['kasbon', 'reimbursement', 'pengajuan'] as FinanceType[]).map((tab) => (
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

      {/* Stats Area */}
      <div className="px-6 -mt-12 relative z-20">
        <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-slate-100">
           <div className="flex items-center gap-4 mb-6">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg",
                activeTab === 'kasbon' ? "bg-blue-50 text-blue-500" : 
                activeTab === 'reimbursement' ? "bg-emerald-50 text-emerald-500" : "bg-purple-50 text-purple-500"
              )}>
                {activeTab === 'kasbon' ? <Wallet className="w-8 h-8" /> : 
                 activeTab === 'reimbursement' ? <HandCoins className="w-8 h-8" /> : <Banknote className="w-8 h-8" />}
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo {activeTab}</p>
                 <p className="text-2xl font-black text-slate-900">
                   {formatCurrency(data.filter(item => item.status?.toLowerCase() === 'approved').reduce((acc, curr) => acc + (Number(curr.nominal) || 0), 0))}
                 </p>
              </div>
           </div>
        </div>
      </div>

      {/* List */}
      <div className="mt-8 px-6 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mengambil data keuangan...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center py-24 bg-white rounded-[2.5rem] border border-slate-100 shadow-inner">
             <CreditCard className="w-12 h-12 text-slate-200 mb-2" />
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Belum ada riwayat {activeTab}</p>
          </div>
        ) : (
          data.map((item, i) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/20 border border-slate-100"
            >
              <div className="flex items-start justify-between mb-4">
                 <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      {new Date(item.created_at || item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <h3 className="text-base font-black text-slate-800 tracking-tight leading-tight truncate pr-2">
                       {item.perincian || item.keperluan || item.keterangan || activeTab.toUpperCase()}
                    </h3>
                 </div>
                 <span className={cn(
                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0",
                    getStatusColor(item.status || item.status_approval || 'Pending')
                 )}>
                    {item.status || item.status_approval || 'Pending'}
                 </span>
              </div>

              <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-4">
                 <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                       <ArrowUpRight className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-black text-slate-700">{formatCurrency(Number(item.nominal || item.total_nominal) || 0)}</p>
                 </div>
                 <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Detail</button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
