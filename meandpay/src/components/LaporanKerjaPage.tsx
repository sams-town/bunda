import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search } from 'lucide-react';

export function LaporanKerjaPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = new URL(`${import.meta.env.VITE_API_MEANDPAY}/laporan-kerjas`);
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
    // Only re-fetch if you want immediate search reactions (debounced ideally) or just load once
    // Currently fetching once and re-fetching automatically when Search is updated.
    const debounce = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(debounce);
  }, [search]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Laporan Kerja</h1>
      </div>

      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-8 space-y-8">
        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari laporan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-bold text-slate-600 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
            />
          </div>
          <button onClick={fetchData} className="p-3 bg-slate-200 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-300 transition-all shadow-sm">
            <Search className="w-5 h-5" />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto -mx-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-200">
                {['No.', 'Nama Pegawai', 'Tanggal', 'Informasi Umum', 'Pekerjaan Yang Dilaksanakan', 'Pekerjaan Belum Selesai', 'Catatan'].map((header) => (
                  <th key={header} className="py-4 px-8 text-[11px] font-black text-slate-600 uppercase tracking-widest text-left whitespace-nowrap border-r border-white/20 last:border-0">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-20 text-center"><div className="w-8 h-8 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 animate-spin mx-auto"></div></td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-sm font-medium text-slate-400">Belum ada Laporan Kerja.</td></tr>
              ) : data.map((item, index) => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-8 text-sm font-bold text-slate-600">{index + 1}.</td>
                  <td className="py-4 px-8 text-sm font-bold text-slate-900">{item.nama_pegawai}</td>
                  <td className="py-4 px-8 text-sm font-bold text-slate-600 whitespace-nowrap">
                    {item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                  </td>
                  <td className="py-4 px-8 text-sm font-medium text-slate-500 min-w-[200px] whitespace-pre-wrap">{item.informasi_umum || '-'}</td>
                  <td className="py-4 px-8 text-sm font-medium text-slate-500 min-w-[200px] whitespace-pre-wrap">{item.pekerjaan_dilaksanakan || '-'}</td>
                  <td className="py-4 px-8 text-sm font-medium text-slate-500 min-w-[200px] whitespace-pre-wrap">{item.pekerjaan_belum_selesai || '-'}</td>
                  <td className="py-4 px-8 text-sm font-medium text-slate-500 min-w-[200px] whitespace-pre-wrap">{item.catatan || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
