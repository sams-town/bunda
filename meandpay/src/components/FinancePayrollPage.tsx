import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import {
    Search, FileText, Download, Calendar, ExternalLink,
    Printer, X, Mail, Phone, MapPin, Building2, UserCircle2,
    DollarSign, Briefcase, CreditCard, Plus, Settings, Trash2, Edit,
    ChevronUp, ChevronDown, ArrowUpDown, ChevronRight, ClipboardList, AlertTriangle, Zap
} from 'lucide-react';
import { useToast } from './Toast';
import { cn } from '../lib/utils';
import { FinancePayrollEditPage } from './FinancePayrollEditPage';

const fmt = (val: any) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(parseFloat(val) || 0);

const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

const SortArrows = () => (
    <div className="inline-flex flex-col ml-2 opacity-30 group-hover:opacity-100 transition-opacity">
        <ChevronUp className="w-2.5 h-2.5 -mb-0.5" />
        <ChevronDown className="w-2.5 h-2.5" />
    </div>
);

interface FinancePayrollPageProps {
    key?: React.Key;
    onNavigate?: (page: string, filters?: any) => void;
    initialFilters?: any;
}

export function FinancePayrollPage({ onNavigate, initialFilters }: FinancePayrollPageProps) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [bulan, setBulan] = useState('');
    const [tahun, setTahun] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, type: 'single' | 'bulk', id: string | null, count?: number }>({ isOpen: false, type: 'single', id: null });
    const [isDeleting, setIsDeleting] = useState(false);
    const [showGenerateAll, setShowGenerateAll] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [showGenModal, setShowGenModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [genData, setGenData] = useState({
        bulan: months[new Date().getMonth()],
        tahun: new Date().getFullYear().toString(),
        tanggal_mulai: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        tanggal_akhir: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
    });
    const { addToast, updateToast } = useToast();

    const fetchData = async () => {
        setLoading(true);
        try {
            const url = new URL(`${import.meta.env.VITE_API_MEANDPAY}/payrolls`);
            url.searchParams.append('bulan', bulan);
            url.searchParams.append('tahun', tahun);
            if (search) url.searchParams.append('search', search);

            const r = await fetch(url.toString(), {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const j = await r.json();
            if (j.success) setData(j.data);
        } catch {
            addToast({ title: 'Error', message: 'Gagal memuat data payroll', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        setSelectedIds([]);
    }, [bulan, tahun]);

    useEffect(() => {
        if (initialFilters?.editId) {
            setEditingId(initialFilters.editId);
        }
    }, [initialFilters]);

    useEffect(() => {
        const t = setTimeout(fetchData, 500);
        return () => clearTimeout(t);
    }, [search]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(data.map(item => item.id.toString()));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectItem = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(i => i !== id));
        }
    };

    const handlePrint = (id: string) => {
        window.open(`/#/salary-slip?id=${id}`, '_blank', 'width=900,height=900');
    };

    const handleDeleteBulk = async () => {
        setIsDeleting(true);
        try {
            await Promise.all(selectedIds.map(id =>
                fetch(`${import.meta.env.VITE_API_MEANDPAY}/payrolls/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                })
            ));
            addToast({ title: 'Success', message: `Berhasil menghapus ${selectedIds.length} data`, type: 'success' });
            setSelectedIds([]);
            setDeleteConfirm({ isOpen: false, type: 'bulk', id: null });
            fetchData();
        } catch {
            addToast({ title: 'Error', message: 'Gagal menghapus data', type: 'error' });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm.id) return;
        setIsDeleting(true);
        try {
            const r = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/payrolls/${deleteConfirm.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const j = await r.json();
            if (j.success) {
                addToast({ title: 'Success', message: 'Data payroll berhasil dihapus', type: 'success' });
                setDeleteConfirm({ isOpen: false, type: 'single', id: null });
                fetchData();
            }
        } catch {
            addToast({ title: 'Error', message: 'Gagal menghapus data', type: 'error' });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleGenerateAll = async () => {
        setGenerating(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/payrolls/generate-all`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(genData)
            });
            const j = await res.json();
            if (j.success) {
                addToast({ title: 'Success', message: j.message, type: 'success' });
                setShowGenModal(false);
                fetchData();
            } else {
                addToast({ title: 'Info', message: j.message || 'Tidak ada data baru yang dicheck', type: 'info' });
            }
        } catch {
            addToast({ title: 'Error', message: 'Gagal men-generate data', type: 'error' });
        } finally {
            setGenerating(false);
        }
    };

    const handleExportExcel = async () => {
        const toastId = addToast({ type: 'loading', title: 'Export Excel', message: 'Sedang menyiapkan data...' });
        try {
            const url = new URL(`${import.meta.env.VITE_API_MEANDPAY}/payrolls`);
            url.searchParams.append('limit', '100000');
            url.searchParams.append('bulan', bulan);
            url.searchParams.append('tahun', tahun);

            const r = await fetch(url.toString(), {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const j = await r.json();
            if (!j.success) throw new Error(j.message);

            const exportData = j.data.map((row: any) => ({
                'Nama': row.employee?.name || '',
                'Jabatan': row.employee?.jabatan?.nama_jabatan || '—',
                'Gaji Pokok': parseFloat(row.gaji_pokok) || 0,
                'Tunjangan Jabatan': parseFloat(row.total_tunjangan_bpjs_kesehatan) || 0,
                'Masa Kerja': parseFloat(row.total_tunjangan_bpjs_ketenagakerjaan) || 0,
                'Transportasi': parseFloat(row.total_tunjangan_transport) || 0,
                'Uang Makan': parseFloat(row.total_tunjangan_makan) || 0,
                'Jaga Malam': parseFloat(row.bonus_team) || 0,
                'Insentif BPJS': parseFloat(row.bonus_pribadi) || 0,
                'Lembur': parseFloat(row.total_lembur) || 0,
                'Insentif Paramedis Umum': parseFloat(row.bonus_jackpot) || 0,
                'Insentif Tetap': 0,
                'Jasa Tindakan': parseFloat(row.total_reimbursement) || 0,
                'Lain-Lain': parseFloat(row.total_thr) || 0,
                'Jasa SIP/SIK/SIB/SIPA': 0,
                'TOTAL GAJI': parseFloat(row.total_penjumlahan) || 0,
                'Cicilan Obat': parseFloat(row.bayar_kasbon) || 0,
                'BPJS Ketenagakerjaan': parseFloat(row.total_potongan_bpjs_ketenagakerjaan) || 0,
                'Koperasi': parseFloat(row.potongan_koperasi) || 0,
                'BPJS Kes': parseFloat(row.total_potongan_bpjs_kesehatan) || 0,
                'Potongan Uang Makan': parseFloat(row.total_mangkir) || 0,
                'Potongan Uang Transport': parseFloat(row.total_izin) || 0,
                'Potongan Lain-Lain': parseFloat(row.total_terlambat) || 0,
                'TOTAL Potongan': parseFloat(row.total_pengurangan) || 0,
                'Gaji Yg Dibyr': parseFloat(row.grand_total) || 0,
                'Pembulatan Gaji': parseFloat(row.grand_total) || 0,
            }));

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Payroll');

            ws['!cols'] = [
                { wch: 25 }, // Nama
                { wch: 20 }, // Jabatan
                { wch: 15 }, // Gaji Pokok
                { wch: 18 }, // Tunjangan Jabatan
                { wch: 15 }, // Masa Kerja
                { wch: 15 }, // Transportasi
                { wch: 15 }, // Uang Makan
                { wch: 15 }, // Jaga Malam
                { wch: 15 }, // Insentif BPJS
                { wch: 15 }, // Lembur
                { wch: 22 }, // Insentif Paramedis Umum
                { wch: 15 }, // Insentif Tetap
                { wch: 15 }, // Jasa Tindakan
                { wch: 15 }, // Lain-Lain
                { wch: 22 }, // Jasa SIP/SIK/SIB/SIPA
                { wch: 18 }, // TOTAL GAJI
                { wch: 15 }, // Cicilan Obat
                { wch: 22 }, // BPJS Ketenagakerjaan
                { wch: 15 }, // Koperasi
                { wch: 15 }, // BPJS Kes
                { wch: 20 }, // Potongan Uang Makan
                { wch: 22 }, // Potongan Uang Transport
                { wch: 20 }, // Potongan Lain-Lain
                { wch: 18 }, // TOTAL Potongan
                { wch: 18 }, // Gaji Yg Dibyr
                { wch: 18 }  // Pembulatan Gaji
            ];

            XLSX.writeFile(wb, `Data_Payroll_${bulan}_${tahun}.xlsx`);
            updateToast(toastId, { type: 'success', title: 'Berhasil', message: 'Data berhasil di-export ke Excel' });
        } catch (err: any) {
            console.error('Export error:', err);
            updateToast(toastId, { type: 'error', title: 'Gagal', message: err.message || 'Gagal mengekspor data' });
        }
    };

    if (editingId) {
        return (
            <FinancePayrollEditPage
                id={editingId}
                onBack={() => setEditingId(null)}
                onSaveSuccess={fetchData}
            />
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <div className="p-6 lg:p-10 mx-auto space-y-6">

                {/* Header Section from User Screenshot */}
                <div className="bg-white p-4 rounded-xl flex items-center justify-between shadow-sm border border-slate-100 mb-6">
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        Payroll
                    </h1>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => onNavigate?.('data-recap')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#2D4A6B] hover:bg-[#1e324a] text-white rounded-xl font-bold text-[13px] transition-all active:scale-95 shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Tambah</span>
                        </button>
                        <button
                            onClick={() => {
                                setGenData(prev => ({ ...prev, bulan, tahun }));
                                setShowGenModal(true);
                            }}
                            disabled={generating}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#6AB04C] hover:bg-[#5a9c3d] text-white rounded-xl font-bold text-[13px] transition-all active:scale-95 shadow-sm"
                        >
                            <Settings className="w-4 h-4" />
                            <span>Generate All</span>
                        </button>
                        <button
                            onClick={() => setShowImportModal(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#4A69BD] hover:bg-[#3c569b] text-white rounded-xl font-bold text-[13px] transition-all active:scale-95 shadow-sm"
                        >
                            <ClipboardList className="w-4 h-4" />
                            <span>Import</span>
                        </button>
                        <AnimatePresence>
                            {selectedIds.length > 0 && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    onClick={() => setDeleteConfirm({ isOpen: true, type: 'bulk', id: null, count: selectedIds.length })}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-[#FF2D55] hover:bg-rose-700 text-white rounded-xl font-bold text-[13px] transition-all shadow-sm"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Delete ({selectedIds.length})</span>
                                </motion.button>
                            )}
                        </AnimatePresence>
                        <button
                            onClick={handleExportExcel}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#54A0FF] hover:bg-[#408adb] text-white rounded-xl font-bold text-[13px] transition-all shadow-sm"
                        >
                            <ClipboardList className="w-4 h-4" />
                            <span>Export</span>
                            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                        </button>
                    </div>
                </div>

                {/* Filters & Actions Area */}
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="w-48 relative">
                                <select value={tahun} onChange={e => setTahun(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none appearance-none">
                                    <option value="">Semua Tahun</option>
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                            <div className="w-48 relative">
                                <select value={bulan} onChange={e => setBulan(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none appearance-none">
                                    <option value="">Semua Bulan</option>
                                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-10 pr-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 w-full sm:w-64" />
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-slate-500 self-end">
                            <label className="text-sm font-bold cursor-pointer">Select All</label>
                            <input type="checkbox" checked={data.length > 0 && selectedIds.length === data.length} onChange={e => handleSelectAll(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                        </div>
                    </div>

                    <div className="mt-8 overflow-x-auto rounded-xl border border-slate-100">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 font-black text-slate-400 text-[10px] uppercase tracking-wider">
                                    <th className="py-5 px-6 border-b border-slate-100">
                                        <input type="checkbox" checked={data.length > 0 && selectedIds.length === data.length} onChange={e => handleSelectAll(e.target.checked)} className="w-4 h-4 cursor-pointer" />
                                    </th>
                                    <th className="py-5 px-6 border-b border-slate-100 group cursor-pointer">
                                        <div className="flex items-center">No. <SortArrows /></div>
                                    </th>
                                    <th className="py-5 px-6 border-b border-slate-100 group cursor-pointer">
                                        <div className="flex items-center">Nomor Gaji <SortArrows /></div>
                                    </th>
                                    <th className="py-5 px-6 border-b border-slate-100 group cursor-pointer">
                                        <div className="flex items-center">Nama <SortArrows /></div>
                                    </th>
                                    <th className="py-5 px-6 border-b border-slate-100 group cursor-pointer">
                                        <div className="flex items-center">Jabatan <SortArrows /></div>
                                    </th>
                                    <th className="py-5 px-6 border-b border-slate-100 group cursor-pointer">
                                        <div className="flex items-center">Bulan <SortArrows /></div>
                                    </th>
                                    <th className="py-5 px-6 border-b border-slate-100 group cursor-pointer">
                                        <div className="flex items-center">Grand Total <SortArrows /></div>
                                    </th>
                                    <th className="py-5 px-6 border-b border-slate-100 text-center group cursor-pointer">
                                        <div className="flex items-center justify-center">Actions <SortArrows /></div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="py-20 text-center">
                                            <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto" />
                                        </td>
                                    </tr>
                                ) : data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-20 text-center text-slate-300 font-bold">No data available in table</td>
                                    </tr>
                                ) : (
                                    data.map((row, idx) => (
                                        <tr key={row.id} className={cn("hover:bg-slate-50/50 transition-colors", selectedIds.includes(row.id.toString()) && "bg-indigo-50/30")}>
                                            <td className="py-5 px-6">
                                                <input type="checkbox" checked={selectedIds.includes(row.id.toString())} onChange={e => handleSelectItem(row.id.toString(), e.target.checked)} className="w-4 h-4 cursor-pointer" />
                                            </td>
                                            <td className="py-5 px-6 text-sm font-bold text-slate-400">{idx + 1}.</td>
                                            <td className="py-5 px-6 text-sm font-bold text-slate-800">{row.no_gaji}</td>
                                            <td className="py-5 px-6 text-sm font-bold text-slate-800">{row.employee?.name}</td>
                                            <td className="py-5 px-6 text-sm font-bold text-slate-500">{row.employee?.jabatan?.nama_jabatan || '—'}</td>
                                            <td className="py-5 px-6 text-sm font-bold text-slate-500">{row.bulan} {row.tahun}</td>
                                            <td className="py-5 px-6 text-sm font-black text-slate-700">{fmt(row.grand_total)}</td>
                                            <td className="py-5 px-6">
                                                <div className="flex items-center justify-center gap-3">
                                                    <button onClick={() => handlePrint(row.id.toString())} className="text-indigo-600 hover:scale-110 transition-transform"><Printer className="w-5 h-5" /></button>
                                                    <button onClick={() => setEditingId(row.id.toString())} className="text-amber-400 hover:scale-110 transition-transform"><Edit className="w-5 h-5" /></button>
                                                    <button onClick={() => setDeleteConfirm({ isOpen: true, type: 'single', id: row.id.toString() })} className="text-rose-600 hover:scale-110 transition-transform"><Trash2 className="w-5 h-5" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* DELETE MODAL */}
            <AnimatePresence>
                {deleteConfirm.isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-[400px] overflow-hidden border border-slate-100 p-8 text-center relative"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-500 to-rose-300" />

                            <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 relative group">
                                <div className="absolute inset-0 bg-rose-200/30 rounded-[2rem] scale-110 blur-xl  transition-opacity" />
                                <Trash2 className="w-10 h-10 text-rose-500 relative z-10" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight lg:mb-3">
                                {deleteConfirm.type === 'single' ? 'Hapus Payroll?' : `Hapus ${deleteConfirm.count} Data?`}
                            </h3>
                            <p className="text-[13px] font-bold text-slate-400 leading-relaxed max-w-[280px] mx-auto mb-10">
                                {deleteConfirm.type === 'single'
                                    ? 'Apakah Anda yakin ingin menghapus data payroll ini? Tindakan ini tidak dapat dibatalkan.'
                                    : `Anda akan menghapus ${deleteConfirm.count} data payroll sekaligus. Apakah Anda yakin?`}
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
                                    className="px-6 py-4 rounded-2xl text-[13px] font-black text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all active:scale-95"
                                >
                                    BATAL
                                </button>
                                <button
                                    onClick={deleteConfirm.type === 'single' ? handleDelete : handleDeleteBulk}
                                    disabled={isDeleting}
                                    className="px-6 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl text-[13px] font-black shadow-xl shadow-rose-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        'YA, HAPUS'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Generate All Modal */}
            <AnimatePresence>
                {showGenModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 space-y-6">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                        <Settings className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black tracking-tight">Generate Payroll</h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Massive Production</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Bulan</label>
                                            <select
                                                value={genData.bulan}
                                                onChange={e => setGenData({ ...genData, bulan: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 appearance-none"
                                            >
                                                {months.map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tahun</label>
                                            <input
                                                value={genData.tahun}
                                                onChange={e => setGenData({ ...genData, tahun: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tanggal Mulai Periode</label>
                                        <input
                                            type="date"
                                            value={genData.tanggal_mulai}
                                            onChange={e => setGenData({ ...genData, tanggal_mulai: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tanggal Akhir Periode</label>
                                        <input
                                            type="date"
                                            value={genData.tanggal_akhir}
                                            onChange={e => setGenData({ ...genData, tanggal_akhir: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                                        />
                                    </div>

                                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                                        <p className="text-[11px] font-bold text-amber-700 leading-relaxed">
                                            <span className="block font-black uppercase text-[10px] mb-0.5">Perhatian!</span>
                                            Proses ini akan generate payroll untuk semua karyawan aktif sekaligus.
                                            Pastikan data periode sudah benar sebelum melanjutkan.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 pt-2">
                                    <button
                                        onClick={handleGenerateAll}
                                        disabled={generating}
                                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-[1.25rem] font-black text-[13px] transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-2 active:scale-95"
                                    >
                                        {generating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Zap className="w-4 h-4" />}
                                        GENERATE ALL PAYROLL
                                    </button>
                                    <button
                                        onClick={() => setShowGenModal(false)}
                                        className="w-full py-4 text-slate-400 hover:text-slate-600 font-bold text-[13px] transition-colors text-center"
                                    >
                                        Batal
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Import Payroll Modal */}
            <AnimatePresence>
                {showImportModal && (
                    <PayrollImportModal
                        isOpen={showImportModal}
                        onClose={() => setShowImportModal(false)}
                        onSuccess={() => {
                            setShowImportModal(false);
                            fetchData();
                        }}
                        currentBulan={bulan}
                        currentTahun={tahun}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

interface ImportRow {
    nama_pegawai: string;
    gaji_pokok: string;
    total_reimbursement: string;
    total_tunjangan_transport: string;
    total_tunjangan_makan: string;
    total_tunjangan_bpjs_kesehatan: string;
    total_tunjangan_bpjs_ketenagakerjaan: string;
    total_potongan_bpjs_kesehatan: string;
    total_potongan_bpjs_ketenagakerjaan: string;
    total_lembur: string;
    bonus_pribadi: string;
    bonus_team: string;
    bonus_jackpot: string;
    total_terlambat: string;
    total_mangkir: string;
    total_izin: string;
    bayar_kasbon: string;
    potongan_koperasi: string;
    total_thr: string;

    // Status validation
    status: 'pending' | 'success' | 'error';
    message: string;
}

interface PayrollImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    currentBulan: string;
    currentTahun: string;
}

function PayrollImportModal({ isOpen, onClose, onSuccess, currentBulan, currentTahun }: PayrollImportModalProps) {
    const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'done'>('upload');
    const [rows, setRows] = useState<ImportRow[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [bulan, setBulan] = useState(currentBulan || months[new Date().getMonth()]);
    const [tahun, setTahun] = useState(currentTahun || new Date().getFullYear().toString());
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState({ total: 0, success: 0, failed: 0 });
    const { addToast } = useToast();

    // Load employees list on open for client-side name matching
    useEffect(() => {
        if (!isOpen) return;
        setStep('upload');
        setRows([]);
        setProgress(0);

        const loadEmployees = async () => {
            try {
                const r = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/users?limit=10000`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                const j = await r.json();
                if (j.success) {
                    setEmployees(j.data);
                }
            } catch (err) {
                console.error("Gagal memuat list pegawai", err);
            }
        };
        loadEmployees();
    }, [isOpen]);

    const handleDownloadTemplate = () => {
        // Header sesuai format Excel referensi
        // Kolom TOTAL GAJI, TOTAL Potongan, Gaji Yg Dibyr, Pembulatan Gaji dihitung otomatis oleh sistem
        const headers = [
            "Nama",
            "Gaji Pokok",
            "Tunjangan Jabatan",
            "Masa Kerja",
            "Transportasi",
            "Uang Makan",
            "Jaga Malam",
            "Insentif BPJS",
            "Lembur",
            "Insentif Paramedis Umum",
            "Insentif Tetap",
            "Jasa Tindakan",
            "Lain-Lain",
            "Jasa SIP/SIK/SIB/SIPA",
            "Cicilan Obat",
            "BPJS Ketenagakerjaan",
            "Koperasi",
            "BPJS Kes",
            "Potongan Uang Makan",
            "Potongan Uang Transport",
            "Potongan Lain-Lain"
        ];
        const contoh = [
            [
                "Budi Santoso",  // Nama (harus cocok dengan nama di sistem)
                2000000,  // Gaji Pokok
                100000,   // Tunjangan Jabatan → total_tunjangan_bpjs_kesehatan
                100000,   // Masa Kerja → total_tunjangan_bpjs_ketenagakerjaan
                500000,   // Transportasi → total_tunjangan_transport
                100000,   // Uang Makan → total_tunjangan_makan
                0,        // Jaga Malam → bonus_team
                0,        // Insentif BPJS → bonus_pribadi
                0,        // Lembur → total_lembur
                0,        // Insentif Paramedis Umum → bonus_jackpot
                0,        // Insentif Tetap (tidak dipakai / reserved)
                0,        // Jasa Tindakan → total_reimbursement
                0,        // Lain-Lain → total_thr
                0,        // Jasa SIP/SIK/SIB/SIPA (reserved)
                0,        // Cicilan Obat → bayar_kasbon
                179983,   // BPJS Ketenagakerjaan → total_potongan_bpjs_ketenagakerjaan
                59954,    // Koperasi → potongan_koperasi
                50000,    // BPJS Kes → total_potongan_bpjs_kesehatan
                0,        // Potongan Uang Makan → total_mangkir
                0,        // Potongan Uang Transport → total_izin
                0         // Potongan Lain-Lain → total_terlambat
            ]
        ];

        const wb = XLSX.utils.book_new();
        const ws1 = XLSX.utils.aoa_to_sheet([headers, ...contoh]);

        // Set lebar kolom agar lebih mudah dibaca
        ws1['!cols'] = [
            { wch: 28 },  // Nama
            { wch: 14 },  // Gaji Pokok
            { wch: 18 },  // Tunjangan Jabatan
            { wch: 14 },  // Masa Kerja
            { wch: 14 },  // Transportasi
            { wch: 14 },  // Uang Makan
            { wch: 14 },  // Jaga Malam
            { wch: 16 },  // Insentif BPJS
            { wch: 12 },  // Lembur
            { wch: 24 },  // Insentif Paramedis Umum
            { wch: 16 },  // Insentif Tetap
            { wch: 16 },  // Jasa Tindakan
            { wch: 12 },  // Lain-Lain
            { wch: 22 },  // Jasa SIP/SIK/SIB/SIPA
            { wch: 14 },  // Cicilan Obat
            { wch: 22 },  // BPJS Ketenagakerjaan
            { wch: 12 },  // Koperasi
            { wch: 12 },  // BPJS Kes
            { wch: 20 },  // Potongan Uang Makan
            { wch: 22 },  // Potongan Uang Transport
            { wch: 20 },  // Potongan Lain-Lain
        ];

        XLSX.utils.book_append_sheet(wb, ws1, 'Template Payroll');

        const petunjuk = [
            ["PETUNJUK PENGISIAN TEMPLATE IMPORT PAYROLL"],
            [],
            ["PENTING: Template ini sudah sesuai format Excel payroll yang digunakan."],
            ["Jika Anda memiliki file Excel payroll yang sudah ada, bisa langsung diupload (sistem akan membaca kolom yang sama)."],
            [],
            ["1. Kolom 'Nama' wajib diisi dan harus persis dengan nama pegawai di aplikasi."],
            ["2. Kolom angka diisi tanpa desimal atau simbol mata uang (IDR/Rp). Jika tidak ada, isi dengan 0."],
            ["3. Kolom TOTAL GAJI, TOTAL Potongan, Gaji Yg Dibyr, dan Pembulatan Gaji akan dihitung otomatis oleh sistem."],
            ["4. Transportasi: Total tunjangan transport per bulan."],
            ["5. Uang Makan: Total tunjangan makan per bulan."],
            ["6. Tunjangan Jabatan → dipetakan ke Tunjangan BPJS Kesehatan."],
            ["7. Masa Kerja → dipetakan ke Tunjangan BPJS Ketenagakerjaan."],
            ["8. BPJS Ketenagakerjaan & BPJS Kes: Nilai potongan BPJS yang dibebankan kepada karyawan."],
            ["9. Cicilan Obat → bayar kasbon karyawan."],
            ["10. Koperasi → potongan koperasi."],
            [],
            ["Selamat menggunakan!"]
        ];
        const ws2 = XLSX.utils.aoa_to_sheet(petunjuk);
        ws2['!cols'] = [{ wch: 80 }];
        XLSX.utils.book_append_sheet(wb, ws2, 'Petunjuk');

        XLSX.writeFile(wb, 'Template_Import_Payroll.xlsx');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
            addToast({ title: 'Format Salah', message: 'Hanya mendukung file Excel (.xlsx, .xls, .csv)', type: 'error' });
            return;
        }

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = new Uint8Array(evt.target?.result as ArrayBuffer);
                const wb = XLSX.read(data, { type: 'array' });
                const sheetName = wb.SheetNames.includes('Template Payroll') ? 'Template Payroll' : wb.SheetNames[0];
                const ws = wb.Sheets[sheetName];
                const raw = XLSX.utils.sheet_to_json<any>(ws, { defval: '' });

                const getVal = (row: any, keys: string[]) => {
                    const normalizedRow: Record<string, any> = {};
                    for (const [key, val] of Object.entries(row)) {
                        const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
                        normalizedRow[normKey] = val;
                    }

                    for (const k of keys) {
                        const normK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
                        const v = normalizedRow[normK];
                        if (v !== undefined && v !== null && String(v).trim() !== '') {
                            return String(v).trim();
                        }
                    }
                    return '0';
                };

                const employeeNamesMap = new Set(employees.map(emp => emp.name.toLowerCase().trim()));

                if (raw.length > 0) {
                    const rawHeaders = Object.keys(raw[0]).join(', ');
                    addToast({ title: 'Excel Headers (Tolong Screenshot Ini!)', message: rawHeaders, type: 'info' });
                }

                const parsedRows: ImportRow[] = raw.map((row: any) => {
                    const nama = getVal(row, ['Nama Pegawai*', 'Nama Pegawai', 'Nama', 'nama_pegawai', 'name']);
                    const nameKey = nama.toLowerCase().trim();
                    const isMatched = employeeNamesMap.has(nameKey);

                    // Determine if using the old template (has explicit "Potongan BPJS Ketenagakerjaan" column)
                    const normalizedRowKeys = Object.keys(row).map(k => k.toLowerCase().replace(/[^a-z0-9]/g, ''));
                    const isOldTemplate = normalizedRowKeys.includes('potonganbpjsketenagakerjaan');

                    // If old template:
                    // - Tunjangan BPJS Ketenagakerjaan uses BPJS Ketenagakerjaan
                    // - Potongan BPJS Ketenagakerjaan uses Potongan BPJS Ketenagakerjaan
                    // If new/exported template:
                    // - Tunjangan BPJS Ketenagakerjaan uses Masa Kerja
                    // - Potongan BPJS Ketenagakerjaan uses BPJS Ketenagakerjaan
                    const tunjanganBpjsKetKeys = isOldTemplate
                        ? ['BPJS Ketenagakerjaan', 'tunjangan_bpjs_ketenagakerjaan']
                        : ['Masa Kerja', 'total_tunjangan_bpjs_ketenagakerjaan'];

                    const potonganBpjsKetKeys = isOldTemplate
                        ? ['Potongan BPJS Ketenagakerjaan', 'potongan_potongan_bpjs_ketenagakerjaan']
                        : ['BPJS Ketenagakerjaan', 'total_potongan_bpjs_ketenagakerjaan'];

                    const obatKey = Object.keys(row).find(k => {
                        const norm = k.toLowerCase().replace(/[^a-z0-9]/g, '');
                        return norm.includes('obatbulan') || (norm.includes('obat') && !norm.includes('cicilan') && !norm.includes('sebelumnya'));
                    });
                    const obatBulanIni = (obatKey && row[obatKey] !== undefined) ? row[obatKey] : '0';

                    const rewardKey = Object.keys(row).find(k => {
                        const norm = k.toLowerCase().replace(/[^a-z0-9]/g, '');
                        return norm.includes('reward') || norm.includes('kedisiplinan') || norm.includes('kehadiran');
                    });
                    const rewardVal = (rewardKey && row[rewardKey] !== undefined) ? row[rewardKey] : '0';

                    return {
                        nama_pegawai: nama,
                        // Penjumlahan (sesuai urutan kolom Excel referensi)
                        gaji_pokok: getVal(row, ['Gaji Pokok', 'gaji_pokok', 'Gaji']),
                        total_tunjangan_bpjs_kesehatan: getVal(row, ['Tunjangan Jabatan', 'BPJS Kesehatan', 'total_tunjangan_bpjs_kesehatan', 'tunjangan_bpjs_kesehatan']),
                        total_tunjangan_bpjs_ketenagakerjaan: getVal(row, tunjanganBpjsKetKeys),
                        total_tunjangan_transport: getVal(row, ['Transportasi', 'Tunjangan Transport', 'Tunjangan Transportasi', 'Transport', 'total_tunjangan_transport', 'transport']),
                        total_tunjangan_makan: getVal(row, ['Uang Makan', 'Tunjangan Makan', 'total_tunjangan_makan', 'makan']),
                        bonus_team: getVal(row, ['Jaga Malam', 'Bonus Team', 'bonus_team']),
                        bonus_pribadi: getVal(row, ['Insentif BPJS', 'Insentif BPJS 2026', 'Bonus Pribadi', 'bonus_pribadi']),
                        total_lembur: getVal(row, ['Lembur', 'total_lembur', 'lembur']),
                        bonus_jackpot: getVal(row, ['Insentif Paramedis Umum', 'Bonus Jackpot', 'bonus_jackpot']),
                        insentif_tetap: getVal(row, ['Insentif Tetap', 'insentif_tetap']),
                        total_reimbursement: getVal(row, ['Jasa Tindakan', 'Total Reimbursement', 'total_reimbursement', 'reimbursement']),
                        total_thr: getVal(row, ['Lain-Lain', 'THR', 'total_thr', 'thr']),
                        jasa_sip: getVal(row, ['Jasa SIP/SIK/SIB/SIPA', 'Jasa SIP', 'jasa_sip']),
                        total_kehadiran: rewardVal,
                        
                        // Potongan (sesuai urutan kolom Excel referensi)
                        bayar_kasbon: getVal(row, ['Cicilan Obat', 'Cicilan Obat Sebelumnya', 'Bayar Kasbon', 'bayar_kasbon', 'kasbon']),
                        obat_bulan_ini: obatBulanIni,
                        total_potongan_bpjs_ketenagakerjaan: getVal(row, potonganBpjsKetKeys),
                        potongan_koperasi: getVal(row, ['Koperasi', 'Potongan Koperasi', 'potongan_koperasi', 'koperasi']),
                        total_potongan_bpjs_kesehatan: getVal(row, ['BPJS Kes', 'BPJS Kesehatan (Potongan)', 'Potongan BPJS Kesehatan', 'total_potongan_bpjs_kesehatan', 'potongan_bpjs_kesehatan']),
                        total_mangkir: getVal(row, ['Potongan Uang Makan', 'Potongan Mangkir', 'total_mangkir', 'mangkir']),
                        total_izin: getVal(row, ['Potongan Uang Transport', 'Potongan Izin', 'total_izin', 'izin']),
                        total_terlambat: getVal(row, ['Potongan Lain-Lain', 'Potongan Terlambat', 'total_terlambat', 'terlambat']),
                        status: (isMatched ? 'pending' : 'error') as 'pending' | 'error' | 'success',
                        message: isMatched ? '' : 'Pegawai tidak ditemukan di database'
                    };
                }).filter(row => row.nama_pegawai !== '' && row.nama_pegawai !== '0');

                if (parsedRows.length === 0) {
                    addToast({ title: 'Data Kosong', message: 'Tidak ada baris data yang valid ditemukan.', type: 'error' });
                    return;
                }

                setRows(parsedRows);
                setStep('preview');
            } catch (err) {
                addToast({ title: 'Error', message: 'Gagal memproses file Excel', type: 'error' });
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleImportSubmit = async () => {
        const validRows = rows.filter(r => r.status !== 'error');
        if (validRows.length === 0) {
            addToast({ title: 'Validation Error', message: 'Tidak ada baris valid untuk diimport', type: 'error' });
            return;
        }

        setStep('importing');
        setProgress(30);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/payrolls/bulk-import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ 
                    bulan,
                    tahun,
                    payrolls: validRows,
                    rawKeys: rows.length > 0 ? Object.keys(rows[0]) : []
                })
            });

            const j = await response.json();
            if (response.ok && j.success) {
                setProgress(100);
                const skippedCount = j.skipped?.length || (rows.length - validRows.length);
                setResult({
                    total: rows.length,
                    success: j.data?.length || validRows.length,
                    failed: skippedCount
                });
                addToast({ title: 'Success', message: j.message || `Berhasil mengimport ${validRows.length} payroll`, type: 'success' });
                setStep('done');
                onSuccess();
            } else {
                throw new Error(j.message || 'Gagal menyimpan data ke database');
            }
        } catch (err: any) {
            addToast({ title: 'Import Gagal', message: err.message || 'Terjadi kesalahan sistem', type: 'error' });
            setStep('preview');
        }
    };

    if (!isOpen) return null;

    const errorCount = rows.filter(r => r.status === 'error').length;
    const validCount = rows.length - errorCount;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
                <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                            <ClipboardList className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black tracking-tight">Import Payroll Excel</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Bulk Spreadsheet Injection</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 flex-1 overflow-y-auto min-h-0 space-y-6">
                    {step === 'upload' && (
                        <div className="space-y-6">
                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/20 hover:bg-indigo-50/50 rounded-3xl p-12 transition-all group relative cursor-pointer">
                                <input
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <div className="w-16 h-16 bg-white shadow-xl shadow-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform mb-4">
                                    <ClipboardList className="w-8 h-8" />
                                </div>
                                <h4 className="text-base font-black text-slate-800 mb-1">Pilih File Spreadsheet</h4>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Mendukung format .xlsx, .xls, .csv</p>
                                <div className="px-6 py-2.5 bg-indigo-600 text-white text-xs font-black uppercase rounded-xl tracking-wider shadow-lg shadow-indigo-200 group-hover:bg-indigo-700 transition-colors">
                                    Browse Files
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                <div className="flex gap-4 items-center">
                                    <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center font-black text-sm">?</div>
                                    <div>
                                        <h5 className="text-sm font-black text-slate-800 leading-tight">Gunakan Template yang Benar</h5>
                                        <p className="text-[11px] font-bold text-slate-400 leading-none">Unduh format Excel standar untuk meminimalisir kegagalan mapping.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleDownloadTemplate}
                                    className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-black shadow-sm transition-all active:scale-95 shrink-0"
                                >
                                    <Download className="w-4 h-4 text-indigo-600" />
                                    DOWNLOAD TEMPLATE
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'preview' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-4 shrink-0">
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-200/50 text-slate-700 rounded-xl flex items-center justify-center font-bold text-lg">{rows.length}</div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Total Baris</p>
                                        <p className="text-xs font-bold text-slate-700">Terbaca dari file</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-bold text-lg">{validCount}</div>
                                    <div>
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-0.5">Data Valid</p>
                                        <p className="text-xs font-bold text-emerald-700">Nama pegawai cocok</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3">
                                    <div className="w-10 h-10 bg-rose-100 text-rose-700 rounded-xl flex items-center justify-center font-bold text-lg">{errorCount}</div>
                                    <div>
                                        <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest leading-none mb-0.5">Data Error</p>
                                        <p className="text-xs font-bold text-rose-700">Perlu koreksi</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 bg-slate-50 border border-slate-100 p-4 rounded-3xl shrink-0 items-center">
                                <div className="text-xs font-black uppercase text-slate-500 tracking-wider ml-2 shrink-0">Pilih Periode Import:</div>
                                <select
                                    value={bulan}
                                    onChange={e => setBulan(e.target.value)}
                                    className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 appearance-none min-w-[120px]"
                                >
                                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                                <select
                                    value={tahun}
                                    onChange={e => setTahun(e.target.value)}
                                    className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 min-w-[100px]"
                                >
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>

                            <div className="border border-slate-100 rounded-[1.5rem] overflow-hidden flex flex-col max-h-[30vh]">
                                <div className="overflow-x-auto min-h-0">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/80 sticky top-0 backdrop-blur-sm z-10">
                                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">No</th>
                                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Status</th>
                                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Nama Pegawai</th>
                                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Gaji Pokok</th>
                                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Lembur</th>
                                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Kasbon</th>
                                                <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Koperasi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 text-xs font-bold">
                                            {rows.map((row, idx) => (
                                                <tr key={idx} className={cn("hover:bg-slate-50/50 transition-colors", row.status === 'error' ? 'bg-rose-50/20' : '')}>
                                                    <td className="py-3.5 px-4 text-slate-400">{idx + 1}</td>
                                                    <td className="py-3.5 px-4">
                                                        {row.status === 'error' ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 text-[10px] font-black uppercase">
                                                                <X className="w-3 h-3" /> Error
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase">
                                                                ✓ Ready
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <p className="text-slate-800">{row.nama_pegawai}</p>
                                                        {row.status === 'error' && <p className="text-[10px] font-bold text-rose-500 mt-0.5">{row.message}</p>}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-slate-600">{fmt(row.gaji_pokok)}</td>
                                                    <td className="py-3.5 px-4 text-slate-600">{fmt(row.total_lembur)}</td>
                                                    <td className="py-3.5 px-4 text-rose-500">-{fmt(row.bayar_kasbon)}</td>
                                                    <td className="py-3.5 px-4 text-rose-500">-{fmt(row.potongan_koperasi)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'importing' && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-6">
                            <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600 animate-bounce">
                                <ClipboardList className="w-8 h-8" />
                            </div>
                            <div className="text-center space-y-2">
                                <h4 className="text-lg font-black text-slate-800">Menyimpan Data Payroll</h4>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sistem sedang memperbarui database...</p>
                            </div>
                            <div className="w-full max-w-md bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                <motion.div
                                    className="bg-indigo-600 h-full rounded-full"
                                    initial={{ width: '0%' }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>
                    )}

                    {step === 'done' && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-6">
                            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl shadow-xl shadow-emerald-100">✓</div>
                            <div className="text-center space-y-2">
                                <h4 className="text-xl font-black text-slate-800">Import Selesai!</h4>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Proses data spreadsheet telah berhasil dieksekusi</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 w-full max-w-sm pt-2">
                                <div className="p-4 bg-slate-50 rounded-2xl text-center">
                                    <p className="text-lg font-black text-slate-800">{result.success}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Berhasil Diimport</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl text-center">
                                    <p className="text-lg font-black text-slate-800">{result.failed}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Gagal/Dilewati</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 shrink-0">
                    {step === 'preview' && (
                        <>
                            <button
                                onClick={() => setStep('upload')}
                                className="px-6 py-3.5 text-slate-500 hover:text-slate-800 text-xs font-black uppercase transition-all"
                            >
                                UPLOAD ULANG
                            </button>
                            <button
                                onClick={handleImportSubmit}
                                disabled={validCount === 0}
                                className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-indigo-100 transition-all active:scale-95"
                            >
                                IMPORT SEKARANG ({validCount} Data)
                            </button>
                        </>
                    )}
                    {step === 'done' && (
                        <button
                            onClick={onClose}
                            className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-indigo-100 transition-all active:scale-95"
                        >
                            TUTUP DIALOG
                        </button>
                    )}
                    {step === 'upload' && (
                        <button
                            onClick={onClose}
                            className="px-8 py-3.5 text-slate-400 hover:text-slate-600 text-xs font-black uppercase transition-colors"
                        >
                            BATAL
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
