import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

export function KinerjaPegawaiPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = new URL(`${import.meta.env.VITE_API_MEANDPAY}/kinerja-pegawais`);
      if (search) url.searchParams.append('search', search);

      const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Kinerja Pegawai</h1>
      </div>

      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-8 space-y-8">
        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama pegawai..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-bold text-slate-600 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
            />
          </div>
          <button onClick={fetchData} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Search className="w-5 h-5" />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto -mx-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-y border-slate-100">
                <th className="py-4 px-8 text-[11px] font-black text-slate-500 uppercase tracking-widest text-left whitespace-nowrap">No.</th>
                <th className="py-4 px-8 text-[11px] font-black text-slate-500 uppercase tracking-widest text-left whitespace-nowrap">
                  <div className="flex items-center gap-2 group cursor-pointer">
                    Nama Pegawai
                    <ArrowUpDown className="w-3 h-3  transition-opacity" />
                  </div>
                </th>
                <th className="py-4 px-8 text-[11px] font-black text-slate-500 uppercase tracking-widest text-left whitespace-nowrap">
                  <div className="flex items-center gap-2 group cursor-pointer">
                    Skor Kinerja
                    <ArrowUpDown className="w-3 h-3  transition-opacity" />
                  </div>
                </th>
                <th className="py-4 px-8 text-[11px] font-black text-slate-500 uppercase tracking-widest text-left whitespace-nowrap">
                  <div className="flex items-center gap-2 group cursor-pointer">
                    Status
                    <ArrowUpDown className="w-3 h-3  transition-opacity" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="py-20 text-center"><div className="w-8 h-8 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 animate-spin mx-auto"></div></td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={4} className="py-12 text-center text-sm font-medium text-slate-400">Pegawai tidak ditemukan.</td></tr>
              ) : data.map((item, index) => (
                <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                  <td className="py-4 px-8 text-sm font-bold text-slate-600">{index + 1}.</td>
                  <td className="py-4 px-8 text-sm font-bold text-slate-900">{item.name}</td>
                  <td className="py-4 px-8 text-sm font-bold text-slate-600">
                    <span className={cn("px-2 py-1 rounded-lg text-xs font-black", Number(item.performance) < 0 ? "text-rose-600 bg-rose-50" : Number(item.performance) > 100 ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50")}>
                      {item.performance}
                    </span>
                  </td>
                  <td className="py-4 px-8">
                    <span className={cn("px-3 py-1.5 rounded-md text-[10px] font-black text-white uppercase tracking-wider", item.color)}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination placeholder */}
        <div className="flex items-center justify-end gap-2">
          <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 rounded-lg bg-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-600/20">1</button>
          <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
