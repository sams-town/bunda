import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '../lib/utils';

export function LaporanKinerjaPage() {
  const [kinerjaData, setKinerjaData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchKinerja = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/laporan-kinerjas`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const json = await res.json();
      if (json.success) {
        setKinerjaData(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKinerja();
  }, []);

  // Filter Logic
  const filteredData = kinerjaData.filter((item) => {
    const qMatches =
      (item.nama_pegawai || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.nama_jenis || '').toLowerCase().includes(searchQuery.toLowerCase());

    let dateMatches = true;
    if (startDate || endDate) {
      const itemDate = new Date(item.tanggal).getTime();
      if (startDate && endDate) {
        const sDate = new Date(startDate).setHours(0, 0, 0, 0);
        const eDate = new Date(endDate).setHours(23, 59, 59, 999);
        dateMatches = itemDate >= sDate && itemDate <= eDate;
      } else if (startDate) {
        const sDate = new Date(startDate).setHours(0, 0, 0, 0);
        dateMatches = itemDate >= sDate;
      } else if (endDate) {
        const eDate = new Date(endDate).setHours(23, 59, 59, 999);
        dateMatches = itemDate <= eDate;
      }
    }

    return qMatches && dateMatches;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, startDate, endDate]);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Laporan Kinerja</h1>
      </div>

      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-8 space-y-8">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Tanggal Mulai"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              onFocus={(e) => e.target.type = 'date'}
              onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all w-48"
            />
            <input
              type="text"
              placeholder="Tanggal Akhir"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              onFocus={(e) => e.target.type = 'date'}
              onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all w-48"
            />
          </div>

          <div className="relative flex-1 max-w-sm">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari nama pegawai atau jenis kinerja..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
            />
          </div>
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
                    Tanggal
                    <ArrowUpDown className="w-3 h-3  transition-opacity" />
                  </div>
                </th>
                <th className="py-4 px-8 text-[11px] font-black text-slate-500 uppercase tracking-widest text-left whitespace-nowrap">
                  <div className="flex items-center gap-2 group cursor-pointer">
                    Jenis Kinerja
                    <ArrowUpDown className="w-3 h-3  transition-opacity" />
                  </div>
                </th>
                <th className="py-4 px-8 text-[11px] font-black text-slate-500 uppercase tracking-widest text-left whitespace-nowrap">
                  <div className="flex items-center gap-2 group cursor-pointer">
                    Bobot Penilaian
                    <ArrowUpDown className="w-3 h-3  transition-opacity" />
                  </div>
                </th>
                <th className="py-4 px-8 text-[11px] font-black text-slate-500 uppercase tracking-widest text-left whitespace-nowrap">
                  <div className="flex items-center gap-2 group cursor-pointer">
                    Penilaian Berjalan
                    <ArrowUpDown className="w-3 h-3  transition-opacity" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center"><div className="w-8 h-8 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 animate-spin mx-auto"></div></td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center font-bold text-slate-400">Tidak ada data ditemukan.</td>
                </tr>
              ) : paginatedData.map((item, index) => (
                <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                  <td className="py-4 px-8 text-sm font-bold text-slate-600">{(currentPage - 1) * itemsPerPage + index + 1}.</td>
                  <td className="py-4 px-8 text-sm font-bold text-slate-900">{item.nama_pegawai}</td>
                  <td className="py-4 px-8 text-sm font-bold text-slate-600">{item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : '-'}</td>
                  <td className="py-4 px-8 text-sm font-bold text-slate-600 truncate max-w-[200px]" title={item.nama_jenis}>{item.nama_jenis}</td>
                  <td className="py-4 px-8 text-sm font-bold text-slate-600">
                    <span className={cn("px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest", Number(item.bobot) < 0 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600")}>
                      {Number(item.bobot) > 0 ? `+${item.bobot}` : item.bobot}
                    </span>
                  </td>
                  <td className="py-4 px-8 text-sm font-bold text-slate-600">{item.penilaian_berjalan || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Info & Controls */}
        {!loading && filteredData.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="text-sm font-semibold text-slate-500">
              Menampilkan {((currentPage - 1) * itemsPerPage) + 1} hingga {Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} data
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-400"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1.5 max-w-[200px] sm:max-w-md overflow-x-auto no-scrollbar pb-1">
                {(() => {
                  const pages = [];
                  const showEllipsisStart = currentPage > 3;
                  const showEllipsisEnd = currentPage < totalPages - 2;

                  if (totalPages <= 5) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    pages.push(1);
                    if (showEllipsisStart) pages.push('...');

                    const start = Math.max(2, currentPage - 1);
                    const end = Math.min(totalPages - 1, currentPage + 1);
                    for (let i = start; i <= end; i++) pages.push(i);

                    if (showEllipsisEnd) pages.push('...');
                    pages.push(totalPages);
                  }

                  return pages.map((page, i) => {
                    if (page === '...') {
                      return (
                        <div key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-slate-400">
                          <MoreHorizontal className="w-4 h-4" />
                        </div>
                      );
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => typeof page === 'number' && setCurrentPage(page)}
                        className={cn(
                          "w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg text-xs font-bold transition-all",
                          currentPage === page
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-600/20"
                            : "text-slate-500 hover:bg-slate-100 border border-transparent hover:border-slate-200"
                        )}
                      >
                        {page}
                      </button>
                    );
                  });
                })()}
              </div>

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-400"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
