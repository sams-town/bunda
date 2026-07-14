import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Search, Plus, Edit, Trash2, ArrowLeft, Send,
    FileText, Calendar, DollarSign, User, AlertCircle,
    CheckCircle2, XCircle, Clock, ExternalLink,
    Filter, ChevronRight, MoreVertical, Download
} from 'lucide-react';
import { useToast } from './Toast';
import { cn } from '../lib/utils';

/* ─── Helpers ─── */
const fmt = (val: any) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(parseFloat(val) || 0);

const statusCls: Record<string, string> = {
    'PENDING': 'bg-amber-50 text-amber-600 border-amber-100',
    'APPROVED': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'REJECTED': 'bg-rose-50 text-rose-600 border-rose-100',
    'COMPLETED': 'bg-indigo-50 text-indigo-600 border-indigo-100'
};

const inputCls = [
    'w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold',
    'placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400',
    'transition-all duration-200'
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

/* ─── Main Component ─── */
export function FinancePengajuanPage() {
    const [view, setView] = useState<'list' | 'form'>('list');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const { addToast, updateToast } = useToast();

    // Fetch Data
    const fetchData = async () => {
        setLoading(true);
        try {
            const url = new URL(`${import.meta.env.VITE_API_MEANDPAY}/pengajuan-keuangan`);
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

    useEffect(() => {
        fetchData();
    }, [statusFilter]);

    useEffect(() => {
        const t = setTimeout(fetchData, 500);
        return () => clearTimeout(t);
    }, [search]);

    const handleDownload = (path: string) => {
        if (!path) return;
        window.open(`${import.meta.env.VITE_API_MEANDPAY}/${path}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            <div className="p-4 lg:p-10 max-w-[1700px] mx-auto space-y-8">
                {/* Header Card */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center shadow-xl shadow-slate-200">
                            <DollarSign className="w-7 h-7 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Pengajuan Keuangan</h1>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Kelola & Pantau Alur Kas Perusahaan</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text" value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Cari pengajuan..."
                                className="w-full sm:w-72 pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none appearance-none pr-10 cursor-pointer"
                                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
                            >
                                <option value="">Semua Status</option>
                                <option value="PENDING">PENDING</option>
                                <option value="APPROVED">APPROVED</option>
                                <option value="REJECTED">REJECTED</option>
                                <option value="COMPLETED">COMPLETED</option>
                            </select>
                            <button className="h-14 px-6 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-slate-200">
                                <Plus className="w-5 h-5" /> Buat Pengajuan
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1800px]">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">
                                    <th className="py-7 px-8">No.</th>
                                    <th className="py-7 px-8">Nomor Pengajuan</th>
                                    <th className="py-7 px-8">Nama Pegawai</th>
                                    <th className="py-7 px-8">Tanggal</th>
                                    <th className="py-7 px-8">Items</th>
                                    <th className="py-7 px-8">Total Pengajuan</th>
                                    <th className="py-7 px-8">Keterangan</th>
                                    <th className="py-7 px-8">File</th>
                                    <th className="py-7 px-8">Status</th>
                                    <th className="py-7 px-8">User Approval</th>
                                    <th className="py-7 px-8 text-center">Nota</th>
                                    <th className="py-7 px-8 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={12} className="py-32 text-center">
                                            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                                            <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Sinkronisasi Data...</p>
                                        </td>
                                    </tr>
                                ) : data.length === 0 ? (
                                    <tr>
                                        <td colSpan={12} className="py-32 text-center text-slate-300">
                                            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                                                <AlertCircle className="w-10 h-10" />
                                            </div>
                                            <h3 className="text-xl font-black uppercase tracking-widest">Tidak Ada Data</h3>
                                            <p className="text-xs font-bold mt-2">Belum ada pengajuan keuangan yang tercatat</p>
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((row, idx) => (
                                        <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group/row">
                                            <td className="py-6 px-8 text-xs font-bold text-slate-300">{idx + 1}.</td>
                                            <td className="py-6 px-8">
                                                <span className="font-black text-indigo-600 text-[10px] px-3 py-1.5 bg-indigo-50 rounded-lg border border-indigo-100">
                                                    {row.nomor || '—'}
                                                </span>
                                            </td>
                                            <td className="py-6 px-8 font-black text-slate-800 text-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white text-[10px] shadow-lg shadow-indigo-100">
                                                        {row.requester?.name?.charAt(0)}
                                                    </div>
                                                    {row.requester?.name || '—'}
                                                </div>
                                            </td>
                                            <td className="py-6 px-8 text-xs font-bold text-slate-500 whitespace-nowrap">
                                                {row.tanggal ? new Date(row.tanggal).toLocaleDateString() : '—'}
                                            </td>
                                            <td className="py-6 px-8">
                                                <div className="flex -space-x-2">
                                                    {row.items?.slice(0, 3).map((item: any, i: number) => (
                                                        <div key={i} className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm text-[9px] font-black text-slate-400 group-hover/row:border-indigo-200 transition-colors">
                                                            {i + 1}
                                                        </div>
                                                    ))}
                                                    {row.items?.length > 3 && (
                                                        <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-[8px] font-black text-slate-400">
                                                            +{row.items.length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-6 px-8 font-black text-slate-900 text-sm italic">
                                                {fmt(row.total_harga)}
                                            </td>
                                            <td className="py-6 px-8">
                                                <p className="text-xs font-bold text-slate-400 max-w-[200px] truncate">{row.keterangan || '—'}</p>
                                            </td>
                                            <td className="py-6 px-8">
                                                {row.pk_file_path ? (
                                                    <button onClick={() => handleDownload(row.pk_file_path)} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-indigo-500 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                                                        <FileText className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">—</span>
                                                )}
                                            </td>
                                            <td className="py-6 px-8">
                                                <Badge status={row.status} />
                                            </td>
                                            <td className="py-6 px-8 font-black text-slate-500 text-[10px] uppercase whitespace-nowrap">
                                                {row.approver?.name || 'BELUM DISETUJUI'}
                                            </td>
                                            <td className="py-6 px-8 text-center">
                                                {row.nota_file_path ? (
                                                    <button onClick={() => handleDownload(row.nota_file_path)} className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 hover:bg-indigo-600 hover:text-white transition-all mx-auto">
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <span className="text-[10px] font-black text-slate-200">TAMBAHKAN NOTA</span>
                                                )}
                                            </td>
                                            <td className="py-6 px-8 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover/row:opacity-100 transition-all">
                                                    <button className="p-2.5 bg-white border border-slate-200 text-emerald-500 rounded-xl hover:bg-emerald-50 transition-all shadow-sm">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button className="p-2.5 bg-white border border-slate-200 text-rose-500 rounded-xl hover:bg-rose-50 transition-all shadow-sm">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
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
        </div>
    );
}
