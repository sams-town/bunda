import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import * as XLSX from 'xlsx';
import {
    Search, Download, Filter, Calendar, AlertCircle, Info
} from 'lucide-react';
import { useToast } from './Toast';
import { cn } from '../lib/utils';

const fmt = (val: any) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(parseFloat(val) || 0);

const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

export function FinancePajakPage() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [bulan, setBulan] = useState(months[new Date().getMonth()]);
    const [tahun, setTahun] = useState(new Date().getFullYear().toString());
    const { addToast, updateToast } = useToast();

    const fetchData = async () => {
        setLoading(true);
        try {
            const url = new URL(`${import.meta.env.VITE_API_MEANDPAY}/pajak-report`);
            url.searchParams.append('bulan', bulan);
            url.searchParams.append('tahun', tahun);
            if (search) url.searchParams.append('search', search);

            const r = await fetch(url.toString(), {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const j = await r.json();
            if (j.success) setData(j.data);
        } catch {
            addToast({ title: 'Error', message: 'Gagal memuat data pajak', type: 'error' });
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

    const handleExportExcel = async () => {
        const toastId = addToast({ type: 'loading', title: 'Export Excel', message: 'Sedang menyiapkan data...' });
        try {
            const url = new URL(`${import.meta.env.VITE_API_MEANDPAY}/pajak-report`);
            url.searchParams.append('bulan', bulan);
            url.searchParams.append('tahun', tahun);
            url.searchParams.append('limit', '100000');

            const r = await fetch(url.toString(), {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const j = await r.json();
            if (!j.success) throw new Error(j.message);

            const exportData = j.data.map((row: any, idx: number) => ({
                'No': idx + 1,
                'Nama Pegawai': row.nama_pegawai || '—',
                'Bulan': row.bulan,
                'Tahun': row.tahun,
                'Status Pajak': row.status_pajak,
                'Penghasilan Bruto': row.bruto,
                'Netto Sebulan': row.netto_sebulan,
                'Netto Setahun': row.netto_setahun,
                'PTKP': row.ptkp,
                'PKP Setahun': row.pk_setahun,
                'PPH 21 Setahun': row.pph21_setahun,
                'PPH 21 Sebulan': row.pph21_sebulan,
            }));

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Laporan Pajak');

            ws['!cols'] = [
                { wch: 5 }, { wch: 25 }, { wch: 10 }, { wch: 10 }, { wch: 15 },
                { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
                { wch: 20 }, { wch: 20 }
            ];

            XLSX.writeFile(wb, `Laporan_Pajak_${bulan}_${tahun}.xlsx`);
            updateToast(toastId, { type: 'success', title: 'Berhasil', message: 'Data berhasil di-export ke Excel' });
        } catch (err: any) {
            console.error('Export error:', err);
            updateToast(toastId, { type: 'error', title: 'Gagal', message: err.message || 'Gagal mengekspor data' });
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            <div className="p-4 lg:p-10 max-w-[1700px] mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 px-4">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Pajak</h1>
                    <button
                        onClick={handleExportExcel}
                        className="px-8 py-3.5 bg-[#5CAB5C] hover:bg-[#4d914d] text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-100"
                    >
                        <Download className="w-4 h-4" /> Export
                    </button>
                </div>

                {/* Filters Section */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                        <div className="relative flex-1">
                            <select value={bulan} onChange={e => setBulan(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none appearance-none cursor-pointer">
                                {months.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div className="relative flex-1">
                            <select value={tahun} onChange={e => setTahun(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none appearance-none cursor-pointer">
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div className="relative flex-[2] min-w-[200px] group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama pegawai..." className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none" />
                        </div>
                    </div>
                </div>

                {/* Table Data Section */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[2200px]">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">
                                    <th className="py-7 px-8 text-center sticky left-0 bg-slate-50 z-10 border-r border-slate-100">No.</th>
                                    <th className="py-7 px-8 text-center sticky left-[80px] bg-slate-50 z-10 border-r border-slate-100 min-w-[250px]">Nama Pegawai</th>
                                    <th className="py-7 px-8 text-center">Bulan</th>
                                    <th className="py-7 px-8 text-center">Tahun</th>
                                    <th className="py-7 px-8 text-center">Status Pajak</th>
                                    <th className="py-7 px-8 text-center font-black text-slate-900 border-x border-slate-100 bg-slate-50/80">Penghasilan Bruto</th>
                                    <th className="py-7 px-8 text-center bg-slate-50/30">Penghasilan Netto Sebulan</th>
                                    <th className="py-7 px-8 text-center bg-slate-50/50">Penghasilan Netto Setahun</th>
                                    <th className="py-7 px-8 text-center font-black text-slate-900 border-x border-slate-100 bg-slate-50/80">PTKP</th>
                                    <th className="py-7 px-8 text-center">PKP Setahun</th>
                                    <th className="py-7 px-8 text-center font-black text-indigo-600 bg-indigo-50">PPH 21 Setahun</th>
                                    <th className="py-7 px-8 text-center font-black text-emerald-600 bg-emerald-50">PPH 21 Sebulan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading && data.length === 0 ? (
                                    <tr>
                                        <td colSpan={12} className="py-32 text-center">
                                            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                                            <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Memuat Laporan...</p>
                                        </td>
                                    </tr>
                                ) : data.length === 0 ? (
                                    <tr>
                                        <td colSpan={12} className="py-32 text-center text-slate-300 uppercase tracking-widest font-black text-xl">Tidak Ada Data</td>
                                    </tr>
                                ) : (
                                    data.map((row, idx) => (
                                        <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-6 px-8 text-xs font-bold text-slate-400 text-center sticky left-0 bg-white border-r border-slate-100">{idx + 1}.</td>
                                            <td className="py-6 px-8 sticky left-[80px] bg-white border-r border-slate-100 z-10 font-black text-slate-800 text-sm text-center">
                                                {row.nama_pegawai || '—'}
                                            </td>
                                            <td className="py-6 px-8 text-center text-sm font-bold text-slate-500">{row.bulan}</td>
                                            <td className="py-6 px-8 text-center text-sm font-bold text-slate-500">{row.tahun}</td>
                                            <td className="py-6 px-8 text-center">
                                                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg border border-slate-200 uppercase whitespace-nowrap">
                                                    {row.status_pajak}
                                                </span>
                                            </td>
                                            <td className="py-6 px-8 text-center font-black text-slate-900 text-sm border-x border-slate-100">{fmt(row.bruto)}</td>
                                            <td className="py-6 px-8 text-center font-bold text-slate-600 text-sm italic">{fmt(row.netto_sebulan)}</td>
                                            <td className="py-6 px-8 text-center font-bold text-slate-600 text-sm italic">{fmt(row.netto_setahun)}</td>
                                            <td className="py-6 px-8 text-center font-black text-slate-900 text-sm border-x border-slate-100">{fmt(row.ptkp)}</td>
                                            <td className="py-6 px-8 text-center font-bold text-amber-600 text-sm">{fmt(row.pk_setahun)}</td>
                                            <td className="py-6 px-8 text-center font-black text-indigo-700 text-sm bg-indigo-50/30">{fmt(row.pph21_setahun)}</td>
                                            <td className="py-6 px-8 text-center font-black text-emerald-700 text-sm bg-emerald-50/30">{fmt(row.pph21_sebulan)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Pagination Placeholder (Matches the screenshot layout) */}
                <div className="flex justify-end pr-4">
                    <div className="flex items-center gap-1">
                        <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 text-sm">‹</button>
                        <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-indigo-600 text-white font-black text-sm">1</button>
                        <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 text-sm font-bold">2</button>
                        <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 text-sm font-bold">3</button>
                        <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 text-sm">›</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
