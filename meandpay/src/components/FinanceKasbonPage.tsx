import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import {
    Search, Plus, Edit, Trash2, ArrowLeft, Send,
    FileText, Calendar, DollarSign, User, AlertCircle,
    CheckCircle2, XCircle, Clock, ExternalLink,
    Filter, ChevronRight, MoreVertical, Download,
    Banknote, Info
} from 'lucide-react';
import { useToast } from './Toast';
import { cn } from '../lib/utils';

/* ─── Helpers ─── */
const fmt = (val: any) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(parseFloat(val) || 0);

const statusCls: Record<string, string> = {
    'PENDING': 'bg-amber-50 text-amber-600 border-amber-100',
    'ACC': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'REJECTED': 'bg-rose-50 text-rose-600 border-rose-100'
};

const inputCls = [
    'w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold',
    'placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400',
    'transition-all duration-200 shadow-sm'
].join(' ');

const labelCls = 'block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1';

function Badge({ status }: { status: string }) {
    return (
        <span className={cn(
            "px-3 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider",
            statusCls[status] || 'bg-slate-50 text-slate-500 border-slate-100'
        )}>
            {status}
        </span>
    );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={cn("space-y-1", className)}>
            <label className={labelCls}>{label}</label>
            {children}
        </div>
    );
}

/* ─── Modal ─── */
function DeleteModal({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onCancel}>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl border border-slate-100">
                    <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner text-rose-500">
                        <Trash2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Hapus Kasbon?</h3>
                    <p className="text-sm text-slate-500 mt-3 font-medium">Data kasbon <span className="font-bold text-slate-900">{name}</span> akan dihapus permanen.</p>
                    <div className="grid grid-cols-2 gap-4 mt-8">
                        <button onClick={onCancel} className="py-4 bg-slate-50 rounded-xl font-black text-slate-400 hover:bg-slate-100 transition-all active:scale-95 text-xs">Batal</button>
                        <button onClick={onConfirm} className="py-4 bg-rose-500 rounded-xl font-black text-white shadow-xl shadow-rose-200 hover:bg-rose-600 transition-all active:scale-95 text-xs">Ya, Hapus</button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

/* ─── Main Component ─── */
export function FinanceKasbonPage() {
    const [view, setView] = useState<'list' | 'form'>('list');
    const [data, setData] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
    const { addToast, updateToast } = useToast();

    const handleExportExcel = async () => {
        const toastId = addToast({ type: 'loading', title: 'Export Excel', message: 'Sedang menyiapkan data...' });
        try {
            const url = new URL(`${import.meta.env.VITE_API_MEANDPAY}/kasbons`);
            url.searchParams.append('limit', '100000');
            if (statusFilter) url.searchParams.append('status', statusFilter);

            const r = await fetch(url.toString(), {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const j = await r.json();
            if (!j.success) throw new Error(j.message);

            const exportData = j.data.map((row: any, idx: number) => ({
                'No': idx + 1,
                'Nama Pegawai': row.user?.name || '—',
                'Tanggal': row.tanggal ? new Date(row.tanggal).toLocaleDateString('id-ID') : '—',
                'Nominal': row.nominal,
                'Keperluan': row.keperluan || '—',
                'Status': row.status
            }));

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Data Kasbon');

            ws['!cols'] = [
                { wch: 5 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 40 }, { wch: 15 }
            ];

            XLSX.writeFile(wb, `Data_Kasbon_${new Date().toISOString().split('T')[0]}.xlsx`);
            updateToast(toastId, { type: 'success', title: 'Berhasil', message: 'Data berhasil di-export ke Excel' });
        } catch (err: any) {
            console.error('Export error:', err);
            updateToast(toastId, { type: 'error', title: 'Gagal', message: err.message || 'Gagal mengekspor data' });
        }
    };

    const blankForm = () => ({
        user_id: '',
        tanggal: new Date().toISOString().split('T')[0],
        nominal: '',
        keperluan: '',
        status: 'PENDING'
    });
    const [form, setForm] = useState(blankForm());

    // Fetch Data
    const fetchData = async () => {
        setLoading(true);
        try {
            const url = new URL(`${import.meta.env.VITE_API_MEANDPAY}/kasbons`);
            if (search) url.searchParams.append('search', search);
            if (statusFilter) url.searchParams.append('status', statusFilter);
            const r = await fetch(url.toString(), {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const j = await r.json();
            if (j.success) setData(j.data);
        } catch {
            addToast({ title: 'Error', message: 'Gagal memuat data', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const r = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/users`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const j = await r.json();
            if (j.success) setUsers(j.data);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchData();
        fetchUsers();
    }, [statusFilter]);

    useEffect(() => {
        const t = setTimeout(fetchData, 500);
        return () => clearTimeout(t);
    }, [search]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const tid = addToast({ title: 'Menyimpan...', message: '', type: 'loading' });
        try {
            const url = editingId
                ? `${import.meta.env.VITE_API_MEANDPAY}/kasbons/${editingId}`
                : `${import.meta.env.VITE_API_MEANDPAY}/kasbons`;
            const method = editingId ? 'PUT' : 'POST';
            const r = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(form)
            });
            const j = await r.json();
            if (j.success) {
                updateToast(tid, { title: 'Berhasil!', message: j.message, type: 'success' });
                setView('list');
                fetchData();
                setEditingId(null);
            } else {
                updateToast(tid, { title: 'Gagal', message: j.message, type: 'error' });
            }
        } catch {
            updateToast(tid, { title: 'Error', message: 'Kesalahan sistem', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (item: any) => {
        setEditingId(item.id);
        setForm({
            user_id: item.user_id,
            tanggal: item.tanggal ? item.tanggal.split('T')[0] : '',
            nominal: item.nominal,
            keperluan: item.keperluan,
            status: item.status
        });
        setView('form');
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        const tid = addToast({ title: 'Menghapus...', message: '', type: 'loading' });
        try {
            const r = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/kasbons/${deleteTarget.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const j = await r.json();
            if (j.success) {
                updateToast(tid, { title: 'Dihapus', message: j.message, type: 'success' });
                fetchData();
            } else {
                updateToast(tid, { title: 'Gagal', message: j.message, type: 'error' });
            }
        } catch {
            updateToast(tid, { title: 'Error', message: 'Kesalahan sistem', type: 'error' });
        } finally {
            setDeleteTarget(null);
        }
    };

    const renderForm = () => (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="p-4 lg:p-10 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    {editingId ? 'Edit Data Kasbon' : 'Tambah Data Kasbon'}
                </h1>
                <button onClick={() => setView('list')} className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-100 transition-all active:scale-95">
                    Back
                </button>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden p-8 lg:p-10 space-y-6">
                <Field label="Nama Pegawai">
                    <select required value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })} className={inputCls}>
                        <option value="">Pilih Pegawai</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                </Field>

                <Field label="Tanggal">
                    <input required type="date" value={form.tanggal} onChange={e => setForm({ ...form, tanggal: e.target.value })} className={inputCls} />
                </Field>

                <Field label="Nominal">
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">Rp</span>
                        <input required type="number" value={form.nominal} onChange={e => setForm({ ...form, nominal: e.target.value })} className={cn(inputCls, "pl-12")} placeholder="0" />
                    </div>
                </Field>

                <Field label="Keperluan">
                    <textarea required value={form.keperluan} onChange={e => setForm({ ...form, keperluan: e.target.value })} className={cn(inputCls, "min-h-[120px] resize-none")} placeholder="Tulis alasan kasbon..." />
                </Field>

                {editingId && (
                    <Field label="Status">
                        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inputCls}>
                            <option value="PENDING">PENDING</option>
                            <option value="ACC">ACC</option>
                            <option value="REJECTED">REJECTED</option>
                        </select>
                    </Field>
                )}

                <div className="pt-4">
                    <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-[#2D5676] hover:bg-[#1a3d58] text-white rounded-2xl font-black text-base shadow-2xl shadow-slate-200 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3">
                        {isSubmitting ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Submit'}
                    </button>
                </div>
            </form>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            {deleteTarget && <DeleteModal name={deleteTarget.user?.name} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}

            {view === 'form' ? renderForm() : (
                <div className="p-4 lg:p-10 max-w-[1700px] mx-auto space-y-8">
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-200">
                                <Banknote className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Data Kasbon Pegawai</h1>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Sertakan Rincian Kasbon Pegawai</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama pegawai..."
                                    className="w-full sm:w-72 pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none" />
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleExportExcel}
                                    className="px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-emerald-100"
                                >
                                    <Download className="w-5 h-5" /> Export
                                </button>
                                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none">
                                    <option value="">Semua Status</option>
                                    <option value="PENDING">PENDING</option>
                                    <option value="ACC">ACC</option>
                                    <option value="REJECTED">REJECTED</option>
                                </select>
                                <button onClick={() => { setForm(blankForm()); setEditingId(null); setView('form'); }}
                                    className="px-8 py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-slate-200">
                                    <Plus className="w-5 h-5" /> Tambah
                                </button>
                            </div>
                        </div>
                    </div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[1200px]">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        {['No.', 'Nama', 'Tanggal', 'Total', 'Keperluan', 'Status', 'Actions'].map(h => (
                                            <th key={h} className="py-7 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading && data.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-24 text-center">
                                                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto" />
                                            </td>
                                        </tr>
                                    ) : data.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-24 text-center sticky left-0 right-0">
                                                <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-200 shadow-inner">
                                                    <AlertCircle className="w-10 h-10" />
                                                </div>
                                                <h3 className="text-xl font-black text-slate-300 uppercase tracking-widest">Tidak Ada Data</h3>
                                                <p className="text-xs font-bold text-slate-400 mt-2">Belum ada kasbon yang tercatat</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        data.map((row, idx) => (
                                            <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="py-6 px-8 text-xs font-bold text-slate-300">{idx + 1}.</td>
                                                <td className="py-6 px-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-indigo-100">
                                                            {row.user?.name?.charAt(0)}
                                                        </div>
                                                        <span className="text-sm font-black text-slate-800">{row.user?.name || '—'}</span>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-8 text-xs font-bold text-slate-500">
                                                    {row.tanggal ? new Date(row.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
                                                </td>
                                                <td className="py-6 px-8 font-black text-indigo-600 text-sm">{fmt(row.nominal)}</td>
                                                <td className="py-6 px-8">
                                                    <p className="text-xs font-bold text-slate-400 max-w-[300px] truncate">{row.keperluan || '—'}</p>
                                                </td>
                                                <td className="py-6 px-8">
                                                    <Badge status={row.status} />
                                                </td>
                                                <td className="py-6 px-8 text-right">
                                                    <div className="flex items-center justify-end gap-2  transition-all">
                                                        <button onClick={() => handleEdit(row)} className="p-2.5 bg-white border border-slate-200 text-emerald-500 rounded-xl hover:bg-emerald-50 shadow-sm"><Edit className="w-4 h-4" /></button>
                                                        <button onClick={() => setDeleteTarget(row)} className="p-2.5 bg-white border border-slate-200 text-rose-500 rounded-xl hover:bg-rose-50 shadow-sm"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
