import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronDown,
  Search,
  DollarSign,
  Download,
  FileText,
  Printer,
  Calendar,
  Briefcase,
  Hash,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  X,
  Inbox
} from 'lucide-react';
import { cn } from '../lib/utils';

const BASE_URL = import.meta.env.VITE_API_MEANDPAY;

const fmt = (val: any) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(parseFloat(val) || 0);

const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

export function MobilePayrollPage() {
  const userId = JSON.parse(localStorage.getItem('user') || '{}')?.id;

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [bulan, setBulan] = useState(months[new Date().getMonth()]);
  const [tahun, setTahun] = useState(new Date().getFullYear().toString());
  const [showFilter, setShowFilter] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const fetchData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const url = new URL(`${BASE_URL}/payrolls_user/${userId}/${bulan}/${tahun}`);
      if (search) url.searchParams.append('search', search);

      const r = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const j = await r.json();
      if (j.success) {
        const raw = j.data;
        setData(Array.isArray(raw) ? raw : raw ? [raw] : []);
      } else {
        setData([]);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [bulan, tahun]);

  useEffect(() => {
    const t = setTimeout(fetchData, 500);
    return () => clearTimeout(t);
  }, [search]);

  const handlePrint = (id: string) => {
    window.open(`/#/salary-slip?id=${id}`, '_blank', 'width=900,height=900');
  };

  const totalGrand = data.reduce((sum, row) => sum + (parseFloat(row.grand_total) || 0), 0);

  return (
    <div className="min-h-screen bg-[#F0F4FF] pb-28 font-sans">

      {/* ─── HERO HEADER ─── */}
      <div className="relative bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 pt-14 pb-28 px-6 overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-400/20 rounded-full blur-3xl" />

        {/* Top Bar */}
        <div className="relative z-10 flex items-center justify-between mb-6">
          <button
            onClick={() => window.location.href = '/beranda'}
            className="w-10 h-10 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className="text-center">
            <p className="text-white/50 text-[10px] font-black uppercase tracking-widest">Finance</p>
            <h1 className="text-white text-base font-black tracking-tight">Data Penggajian</h1>
          </div>
          <button
            onClick={fetchData}
            className="w-10 h-10 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20"
          >
            <RefreshCw className={cn("w-4 h-4 text-white", loading && "animate-spin")} />
          </button>
        </div>

        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-1">
            {bulan} {tahun} · {data.length} Data
          </p>
          <p className="text-white text-3xl font-black tracking-tight tabular-nums">
            {fmt(totalGrand)}
          </p>
          <p className="text-white/40 text-[10px] font-bold mt-1">Total Grand Payroll</p>
        </motion.div>
      </div>

      {/* ─── FILTER CARD (floating) ─── */}
      <div className="px-5 -mt-16 relative z-20 space-y-3">
        {/* Filter Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-[2rem] shadow-2xl shadow-indigo-500/10 p-4 border border-white"
        >
          <div className="flex gap-3">
            {/* Tahun */}
            <div className="relative flex-1">
              <select
                value={tahun}
                onChange={e => setTahun(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black text-slate-700 outline-none appearance-none"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            {/* Bulan */}
            <div className="relative flex-1">
              <select
                value={bulan}
                onChange={e => setBulan(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black text-slate-700 outline-none appearance-none"
              >
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

         
        </motion.div>

        {/* ─── PAYROLL LIST ─── */}
        <div className="space-y-3 mt-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm font-bold text-slate-400">Memuat data payroll...</p>
            </div>
          ) : data.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center py-20 gap-5"
            >
              {/* Icon */}
              <div className="relative">
                <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center shadow-inner">
                  <Inbox className="w-12 h-12 text-indigo-300" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-[10px] font-black">!</span>
                </div>
              </div>

              {/* Text */}
              <div className="text-center">
                <p className="text-base font-black text-slate-700">Data Tidak Tersedia</p>
                <p className="text-[12px] font-semibold text-slate-400 mt-1">Tidak ada data payroll untuk</p>
                <p className="text-[12px] font-black text-indigo-400 mt-0.5">{bulan} {tahun}</p>
              </div>
            </motion.div>
          ) : (
            data.map((row, idx) => (
              <motion.div
                key={row.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                onClick={() => setSelectedItem(row)}
                className="bg-white rounded-[1.75rem] p-5 shadow-sm border border-slate-100 active:scale-[0.98] transition-all cursor-pointer"
              >
                {/* Top Row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* Avatar/Index */}
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
                      <span className="text-white text-sm font-black">{idx + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800 leading-tight">
                        {row.user?.name || '—'}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                        {row.user?.jabatan?.nama_jabatan || '—'}
                      </p>
                    </div>
                  </div>
                  {/* Grand Total Badge */}
                  <div className="bg-indigo-50 px-3 py-1.5 rounded-xl">
                    <p className="text-[11px] font-black text-indigo-600">
                      {fmt(row.grand_total)}
                    </p>
                  </div>
                </div>

                {/* Info Row */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 bg-slate-50 rounded-xl px-3 py-1.5">
                    <Hash className="w-3 h-3 text-slate-400" />
                    <p className="text-[10px] font-black text-slate-500">{row.no_gaji}</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-50 rounded-xl px-3 py-1.5">
                    <Calendar className="w-3 h-3 text-emerald-500" />
                    <p className="text-[10px] font-black text-emerald-600">{row.bulan} {row.tahun}</p>
                  </div>
                </div>

                {/* Action Row */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50">
                  <button
                    onClick={e => { e.stopPropagation(); handlePrint(row.id.toString()); }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-2xl transition-all"
                  >
                    <Printer className="w-4 h-4 text-white" />
                    <span className="text-[11px] font-black text-white">Download Slip</span>
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* ─── DETAIL MODAL ─── */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-end"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              onClick={e => e.stopPropagation()}
              className="w-full bg-white rounded-t-[2.5rem] p-6 pb-10 space-y-4"
            >
              {/* Handle */}
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4" />

              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                  <DollarSign className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-800">{selectedItem.user?.name}</h2>
                  <p className="text-[11px] font-bold text-slate-400">{selectedItem.user?.jabatan?.nama_jabatan || '—'}</p>
                </div>
              </div>

              {/* Detail Fields */}
              <div className="space-y-3">
                {[
                  { label: 'Nomor Gaji', value: selectedItem.no_gaji, icon: Hash, color: 'text-slate-600' },
                  { label: 'Periode', value: `${selectedItem.bulan} ${selectedItem.tahun}`, icon: Calendar, color: 'text-emerald-600' },
                  { label: 'Jabatan', value: selectedItem.user?.jabatan?.nama_jabatan || '—', icon: Briefcase, color: 'text-sky-600' },
                  { label: 'Grand Total', value: fmt(selectedItem.grand_total), icon: TrendingUp, color: 'text-indigo-600', highlight: true },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex items-center justify-between px-4 py-3.5 rounded-2xl',
                      item.highlight ? 'bg-indigo-50 border border-indigo-100' : 'bg-slate-50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={cn('w-4 h-4', item.color)} />
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">{item.label}</p>
                    </div>
                    <p className={cn('text-sm font-black', item.highlight ? 'text-indigo-700' : 'text-slate-700')}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={() => handlePrint(selectedItem.id.toString())}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-[1.5rem] flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/25 active:scale-95 transition-all mt-2"
              >
                <Printer className="w-5 h-5 text-white" />
                <span className="text-sm font-black text-white">Download Slip Gaji</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
