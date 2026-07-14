import React from 'react';
import { motion } from 'motion/react';
import {
  Database,
  Calendar,
  Send,
  Download,
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Printer,
  DollarSign
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from './Toast';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { X, BarChart3, PieChart as PieChartIcon, Table as TableIcon } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

interface RecapData {
  user_id: string;
  user: {
    name: string;
    foto_karyawan?: string | null;
  };
  total_cuti: number;
  total_izin_masuk: number;
  total_sakit: number;
  total_izin_pulang_cepat: number;
  total_hadir: number;
  total_alfa: number;
  total_libur: number;
  total_telat: number;
  total_hari_telat?: number;
  total_pulang_cepat: number;
  total_lembur: string;
  persentase_kehadiran: number;
}

interface DataRecapPageProps {
  key?: React.Key;
  onNavigate?: (page: string, filters?: any) => void;
}

export function DataRecapPage({ onNavigate }: DataRecapPageProps) {
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<RecapData[]>([]);
  const [showResults, setShowResults] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [startDate, setStartDate] = React.useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [exportModal, setExportModal] = React.useState<{ show: boolean, type: 'rekap' | 'detail', userId?: string, userName?: string }>({ show: false, type: 'rekap' });
  const { addToast } = useToast();

  const handleFetchRecap = async () => {
    setLoading(true);
    try {
      const url = new URL(`${import.meta.env.VITE_API_MEANDPAY}/absensi/recap`);
      url.searchParams.append('start_date', startDate);
      url.searchParams.append('end_date', endDate);

      const r = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const j = await r.json();
      if (j.success) {
        setResults(j.data);
        setShowResults(true);
      } else {
        addToast({ title: 'Error', message: j.message || 'Gagal memuat rekap data', type: 'error' });
      }
    } catch {
      addToast({ title: 'Error', message: 'Terjadi kesalahan sistem', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadIndividual = async (userId?: string, userName?: string) => {
    try {
      const url = new URL(`${import.meta.env.VITE_API_MEANDPAY}/absensi`);
      if (userId && userId !== 'undefined') url.searchParams.append('user_id', userId);
      url.searchParams.append('start_date', startDate);
      url.searchParams.append('end_date', endDate);

      const r = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const j = await r.json();
      if (!j.success) throw new Error(j.message);

      const logs = j.data || [];

      const header = ['Nama Pegawai', 'Shift', 'Tanggal', 'Jam Masuk', 'Telat', 'Keterangan Masuk', 'Jam Pulang', 'Pulang Cepat', 'Keterangan Pulang', 'Status Absen'];

      const data = logs.map((log: any) => [
        userName || log.users?.name || '—',
        log.shifts ? `${log.shifts.nama_shift} ${log.shifts.jam_masuk} - ${log.shifts.jam_keluar}` : '—',
        log.tanggal ? log.tanggal.split('T')[0] : '—',
        log.jam_absen || '—',
        log.telat || '0',
        log.keterangan_masuk || '',
        log.jam_pulang || '—',
        log.pulang_cepat || '0',
        log.keterangan_pulang || '',
        log.status_absen || '—'
      ]);

      const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Attendance Details");
      const filename = userId ? `Detail_Absensi_${userName}_${startDate}_${endDate}.xlsx` : `Detail_Absensi_Semua_${startDate}_${endDate}.xlsx`;
      XLSX.writeFile(wb, filename);

      addToast({ title: 'Success', message: 'Data Detail berhasil didownload (XLSX)', type: 'success' });
    } catch (error: any) {
      addToast({ title: 'Error', message: error.message || 'Gagal download data', type: 'error' });
    }
  };

  const handleExportRekap = () => {
    const header = ['Nama Pegawai', 'Cuti', 'Izin Masuk', 'Sakit', 'Izin Pulang', 'Hadir', 'Alfa', 'Libur', 'Telat (Menit)', 'Pulang Cepat (Menit)', 'Persentase'];

    const data = results.map(item => [
      item.user.name,
      item.total_cuti,
      item.total_izin_masuk,
      item.total_sakit,
      item.total_izin_pulang_cepat,
      item.total_hadir,
      item.total_alfa,
      item.total_libur,
      item.total_telat,
      item.total_pulang_cepat,
      `${item.persentase_kehadiran}%`
    ]);

    const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance Recap");
    XLSX.writeFile(wb, `Rekap_Absensi_${startDate}_${endDate}.xlsx`);

    addToast({ title: 'Success', message: 'Rekap berhasil didownload (XLSX)', type: 'success' });
  };

  const handleExportPDF = async (type: 'rekap' | 'detail', userId?: string, userName?: string) => {
    try {
      const doc = new jsPDF('landscape');

      if (type === 'rekap') {
        doc.text(`Rekap Absensi (${startDate} s/d ${endDate})`, 14, 15);
        const header = [['Nama Pegawai', 'Cuti', 'Izin', 'Sakit', 'Hadir', 'Alfa', 'Telat', 'P. Cepat', '%']];
        const data = results.map(item => [
          item.user.name,
          `${item.total_cuti}x`,
          `${item.total_izin_masuk}x`,
          `${item.total_sakit}x`,
          `${item.total_hadir}x`,
          `${item.total_alfa}x`,
          `${item.total_telat}m`,
          `${item.total_pulang_cepat}m`,
          `${item.persentase_kehadiran}%`
        ]);
        autoTable(doc, { head: header, body: data, startY: 20 });
        doc.save(`Rekap_Absensi_${startDate}_${endDate}.pdf`);
      } else {
        // Individual detail
        const url = new URL(`${import.meta.env.VITE_API_MEANDPAY}/absensi`);
        if (userId && userId !== 'undefined') url.searchParams.append('user_id', userId);
        url.searchParams.append('start_date', startDate);
        url.searchParams.append('end_date', endDate);

        const r = await fetch(url.toString(), {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const j = await r.json();
        const logs = j.data || [];

        doc.text(`Detail Absensi ${userName || 'Semua Pegawai'} (${startDate} s/d ${endDate})`, 14, 15);
        const header = [['Nama', 'Shift', 'Tanggal', 'Masuk', 'Telat', 'Keterangan', 'Pulang', 'Plg Cpt', 'Status']];
        const data = logs.map((l: any) => [
          userName || l.users?.name || l.user?.name || '',
          l.shifts ? l.shifts.nama_shift : '',
          l.tanggal ? l.tanggal.split('T')[0] : '',
          l.jam_absen || '',
          l.telat || '0',
          l.keterangan_masuk || '',
          l.jam_pulang || '',
          l.pulang_cepat || '0',
          l.status_absen || ''
        ]);
        autoTable(doc, { head: header, body: data, startY: 20 });
        doc.save(`Detail_Absensi_${userName || 'Semua'}_${startDate}_${endDate}.pdf`);
      }
      addToast({ title: 'Success', message: 'Data berhasil di-export ke PDF', type: 'success' });
    } catch (e) {
      addToast({ title: 'Error', message: 'Gagal generate PDF', type: 'error' });
    }
  };

  const handleGeneratePayroll = async (userId: string) => {
    try {
      const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      const d = new Date(startDate);
      const bulan = monthNames[d.getMonth()];
      const tahun = d.getFullYear().toString();

      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/payrolls/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          user_id: userId,
          bulan,
          tahun,
          tanggal_mulai: startDate,
          tanggal_akhir: endDate
        })
      });
      const j = await res.json();
      if (j.success) {
        addToast({ title: 'Success', message: 'Payroll berhasil di-generate', type: 'success' });
        onNavigate?.('finance-payroll', { editId: j.data.id });
      } else {
        addToast({ title: 'Error', message: j.message || 'Gagal generate payroll', type: 'error' });
      }
    } catch {
      addToast({ title: 'Error', message: 'Gagal menghubungi server', type: 'error' });
    }
  };

  const filteredResults = results.filter(row =>
    row.user.name.toLowerCase().includes(search.toLowerCase())
  );

  // Chart data
  const chartData = filteredResults
    .filter(item => (
      item.total_hadir > 0 ||
      item.total_sakit > 0 ||
      (item.total_izin_masuk + item.total_izin_pulang_cepat) > 0 ||
      item.total_cuti > 0 ||
      item.total_alfa > 0 ||
      (item.total_hari_telat || 0) > 0
    ))
    .slice(0, 10)
    .map(item => ({
      name: item.user.name.split(' ')[0], // First name for chart brevity
      Hadir: item.total_hadir,
      Sakit: item.total_sakit,
      Izin: item.total_izin_masuk + item.total_izin_pulang_cepat,
      Cuti: item.total_cuti,
      Alfa: item.total_alfa,
      Terlambat: item.total_hari_telat || 0
    }));

  const pieData = [
    { name: 'Hadir', value: results.reduce((acc, curr) => acc + curr.total_hadir, 0) },
    { name: 'Sakit', value: results.reduce((acc, curr) => acc + curr.total_sakit, 0) },
    { name: 'Izin', value: results.reduce((acc, curr) => acc + (curr.total_izin_masuk + curr.total_izin_pulang_cepat), 0) },
    { name: 'Cuti', value: results.reduce((acc, curr) => acc + curr.total_cuti, 0) },
    { name: 'Alfa', value: results.reduce((acc, curr) => acc + curr.total_alfa, 0) },
  ].filter(d => d.value > 0);
  const COLORS = ['#10b981', '#f43f5e', '#3b82f6', '#f59e0b', '#64748b'];

  const [viewMode, setViewMode] = React.useState<'table' | 'chart'>('table');

  if (showResults) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[1600px] mx-auto space-y-8 pb-20 p-6 lg:p-10"
      >
        {/* Modal Export */}
        {exportModal.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Pilih Format Export</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Export {exportModal.type === 'rekap' ? 'Rekap Data' : `Details ${exportModal.userName || 'Semua Pegawai'}`}</p>
                </div>
                <button
                  onClick={() => setExportModal({ show: false, type: 'rekap' })}
                  className="p-3 hover:bg-slate-100 rounded-full transition-all"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="p-8 space-y-4">
                <button
                  onClick={() => {
                    if (exportModal.type === 'rekap') handleExportRekap();
                    else handleDownloadIndividual(exportModal.userId, exportModal.userName);
                    setExportModal({ show: false, type: 'rekap' });
                  }}
                  className="w-full flex items-center gap-4 p-6 bg-emerald-50 border-2 border-emerald-100 rounded-3xl group hover:border-emerald-500 transition-all"
                >
                  <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shrink-0 group-hover:rotate-6 transition-transform">
                    <Download className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-emerald-900 leading-none">Export to Excel</p>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-2">Microsoft Excel Data</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    handleExportPDF(exportModal.type, exportModal.userId, exportModal.userName);
                    setExportModal({ show: false, type: 'rekap' });
                  }}
                  className="w-full flex items-center gap-4 p-6 bg-rose-50 border-2 border-rose-100 rounded-3xl group hover:border-rose-500 transition-all"
                >
                  <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shrink-0 group-hover:rotate-6 transition-transform">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-rose-900 leading-none">Export to PDF</p>
                    <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mt-2">Adobe Acrobat Document</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-4 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Rekap Data Absensi</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Management Overview & Statistics</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              <button
                onClick={() => setViewMode('table')}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all gap-2 flex items-center",
                  viewMode === 'table' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
                )}
              >
                <TableIcon className="w-4 h-4" /> Pivot Table
              </button>
              <button
                onClick={() => setViewMode('chart')}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all gap-2 flex items-center",
                  viewMode === 'chart' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
                )}
              >
                <BarChart3 className="w-4 h-4" /> Grafik & Bar
              </button>
            </div>

            <button
              onClick={() => setExportModal({ show: true, type: 'detail' })}
              className="flex items-center gap-3 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-xs transition-all active:scale-95 shadow-lg shadow-emerald-200"
            >
              <Download className="w-5 h-5" />
              <span>Export Details</span>
            </button>
            <button
              onClick={() => setExportModal({ show: true, type: 'rekap' })}
              className="flex items-center gap-3 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs transition-all active:scale-95 shadow-lg shadow-indigo-200"
            >
              <FileText className="w-5 h-5" />
              <span>Export Rekap</span>
            </button>
            <button
              onClick={() => setShowResults(false)}
              className="flex items-center gap-3 px-6 py-3.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-black text-xs transition-all active:scale-95 shadow-lg shadow-rose-200"
            >
              <span>Back</span>
            </button>
          </div>
        </div>

        {viewMode === 'chart' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
              <h3 className="text-lg font-black text-slate-800 tracking-tight mb-6">Grafik Bar Perbandingan Kehadiran (Top 10)</h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '10px' }} />
                    <Bar dataKey="Hadir" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Sakit" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Izin" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Cuti" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Alfa" fill="#64748b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Terlambat" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 flex flex-col items-center">
              <h3 className="text-lg font-black text-slate-800 tracking-tight mb-6 w-full text-left">Proporsi Keseluruhan</h3>
              <div className="h-64 w-full flex-1 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full space-y-3 mt-4">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex flex-col">
                    <div className="flex items-center justify-between text-sm font-bold">
                      <div className="flex items-center gap-2 text-slate-700">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        {entry.name}
                      </div>
                      <span className="text-slate-900">{entry.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
                <div className="relative">
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
                <button
                  onClick={handleFetchRecap}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold shadow-lg hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white animate-spin rounded-full"></div> : <Search className="w-4 h-4" />}
                  <span>Filter</span>
                </button>
              </div>
              <div className="w-72 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama pegawai..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b border-slate-100 whitespace-nowrap">
                    Nama Pegawai <ArrowUpDown className="inline-block w-3 h-3 ml-1 opacity-40" />
                  </th>
                  <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b border-slate-100">Cuti</th>
                  <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b border-slate-100 whitespace-nowrap">Izin Masuk</th>
                  <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b border-slate-100 whitespace-nowrap">Sakit</th>
                  <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b border-slate-100 whitespace-nowrap">Izin Pulang</th>
                  <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b border-slate-100 whitespace-nowrap">Hadir</th>
                  <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b border-slate-100 whitespace-nowrap">Alfa</th>
                  <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b border-slate-100 whitespace-nowrap">Libur</th>
                  <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b border-slate-100">Telat</th>
                  <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b border-slate-100 whitespace-nowrap">Pulang Cepat</th>
                  <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b border-slate-100 whitespace-nowrap">Lembur</th>
                  <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b border-slate-100 whitespace-nowrap">Persentase</th>
                  <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-100 font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredResults.map((item) => (
                  <tr key={item.user_id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-6 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-[10px] font-bold shrink-0">
                          {item.user.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <span className="text-sm font-bold text-slate-800 whitespace-nowrap">{item.user.name}</span>
                      </div>
                    </td>
                    <td className="py-6 px-6 text-sm font-bold text-slate-500">{item.total_cuti} x</td>
                    <td className="py-6 px-6 text-sm font-bold text-slate-500">{item.total_izin_masuk} x</td>
                    <td className="py-6 px-6 text-sm font-bold text-slate-500">{item.total_sakit} x</td>
                    <td className="py-6 px-6 text-sm font-bold text-slate-500">{item.total_izin_pulang_cepat} x</td>
                    <td className="py-6 px-6 text-sm font-bold text-slate-500">{item.total_hadir} x</td>
                    <td className="py-6 px-6 text-sm font-bold text-slate-500">{item.total_alfa} x</td>
                    <td className="py-6 px-6 text-sm font-bold text-slate-500">{item.total_libur} x</td>
                    <td className="py-6 px-6">
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all inline-block whitespace-nowrap",
                        item.total_telat === 0 ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-rose-50 border-rose-200 text-rose-600"
                      )}>
                        {item.total_telat === 0 ? "Tidak Pernah Telat" : `${item.total_telat} Menit`}
                      </span>
                    </td>
                    <td className="py-6 px-6">
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all inline-block whitespace-nowrap",
                        item.total_pulang_cepat === 0 ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-rose-50 border-rose-200 text-rose-600"
                      )}>
                        {item.total_pulang_cepat === 0 ? "Tidak Pernah Pulang Cepat" : `${item.total_pulang_cepat} Menit`}
                      </span>
                    </td>
                    <td className="py-6 px-6">
                      <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                        {item.total_lembur || '0 Jam 0 Menit'}
                      </span>
                    </td>
                    <td className="py-6 px-6">
                      <span className="text-sm font-black text-slate-900">{item.persentase_kehadiran} %</span>
                    </td>
                    <td className="py-6 px-6 text-center">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleGeneratePayroll(item.user_id)}
                          className="p-2 text-[#FF9F1C] hover:scale-110 transition-transform"
                        >
                          <DollarSign className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setExportModal({ show: true, type: 'detail', userId: item.user_id, userName: item.user.name })}
                          className="p-2 text-[#2D4A6B] hover:scale-110 transition-transform"
                        >
                          <Printer className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-black text-slate-900 border-t-2 border-slate-200">
                <tr>
                  <td className="py-6 px-8 text-sm">TOTAL KESELURUHAN</td>
                  <td className="py-6 px-8 text-sm">{results.reduce((acc, curr) => acc + curr.total_cuti, 0)} x</td>
                  <td className="py-6 px-8 text-sm">{results.reduce((acc, curr) => acc + curr.total_izin_masuk, 0)} x</td>
                  <td className="py-6 px-8 text-sm">{results.reduce((acc, curr) => acc + curr.total_sakit, 0)} x</td>
                  <td className="py-6 px-8 text-sm">{results.reduce((acc, curr) => acc + curr.total_izin_pulang_cepat, 0)} x</td>
                  <td className="py-6 px-8 text-sm">{results.reduce((acc, curr) => acc + curr.total_hadir, 0)} x</td>
                  <td className="py-6 px-8 text-sm">{results.reduce((acc, curr) => acc + curr.total_alfa, 0)} x</td>
                  <td className="py-6 px-8 text-sm">{results.reduce((acc, curr) => acc + curr.total_libur, 0)} x</td>
                  <td className="py-6 px-8 text-sm text-rose-600">{results.reduce((acc, curr) => acc + curr.total_telat, 0)} m</td>
                  <td className="py-6 px-8 text-sm text-rose-600">{results.reduce((acc, curr) => acc + curr.total_pulang_cepat, 0)} m</td>
                  <td className="py-6 px-8"></td>
                  <td className="py-6 px-8 text-sm">{(results.reduce((acc, curr) => acc + curr.persentase_kehadiran, 0) / (results.length || 1)).toFixed(1)} %</td>
                  <td className="py-6 px-8"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8 pb-20 p-6 lg:p-10"
    >
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Rekap Data Absensi</h1>
        <p className="text-slate-500 font-medium">Generate comprehensive attendance reports for a specific date range.</p>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden max-w-2xl mx-auto">
        <div className="p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Tanggal Mulai</label>
              <div className="relative group">
                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Tanggal Akhir</label>
              <div className="relative group">
                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={handleFetchRecap}
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-12 py-5 bg-indigo-600 text-white rounded-[1.5rem] text-sm font-black transition-all shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white animate-spin rounded-full"></div> : <Send className="w-5 h-5" />}
              Submit
            </button>
            <button
              onClick={() => setExportModal({ show: true, type: 'rekap' })}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-12 py-5 bg-slate-100 text-slate-600 rounded-[1.5rem] text-sm font-black transition-all hover:bg-slate-200 active:scale-95"
            >
              <Download className="w-5 h-5" />
              Export Options
            </button>
          </div>
        </div>

        <div className="bg-slate-50/50 p-10 border-t border-slate-100">
          <div className="flex items-start gap-6">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 mb-1">Report Preview</h4>
              <p className="text-xs font-medium text-slate-500 leading-relaxed max-w-md">
                Once submitted, the system will compile all attendance logs, including check-ins, check-outs, and external duties for the selected period.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
