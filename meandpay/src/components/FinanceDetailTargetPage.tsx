import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Search, Plus, Edit, Trash2, ArrowLeft, Target,
    Calendar, DollarSign, AlertCircle, Activity, Sparkles, TrendingUp
} from 'lucide-react';
import { useToast } from './Toast';
import { cn } from '../lib/utils';

/* ─── Helpers ─── */
const fmt = (val: any) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(parseFloat(val) || 0);

const inputCls = [
    'w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold',
    'placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400',
    'transition-all duration-200'
].join(' ');

const labelCls = 'block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1';

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
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Hapus Detail Target?</h3>
                    <p className="text-sm text-slate-500 mt-3 font-medium">Data target untuk <span className="font-bold text-slate-900">{name}</span> akan dihapus permanen.</p>
                    <div className="grid grid-cols-2 gap-4 mt-10">
                        <button onClick={onCancel} className="py-4 bg-slate-50 rounded-2xl font-black text-slate-400 hover:bg-slate-100 transition-all active:scale-95">Batal</button>
                        <button onClick={onConfirm} className="py-4 bg-rose-500 rounded-2xl font-black text-white shadow-xl shadow-rose-200 hover:bg-rose-600 transition-all active:scale-95">Ya, Hapus</button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export function FinanceDetailTargetPage() {
    const [view, setView] = useState<'list' | 'form'>('list');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [masterTargets, setMasterTargets] = useState<any[]>([]);
    const [jabatans, setJabatans] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const { addToast, updateToast } = useToast();

    // Form State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

    const blankForm = () => ({
        target_kinerja_id: '',
        user_id: '',
        jabatan_id: '',
        judul: '',
        target_pribadi: '0',
        jumlah: '0',
        capai: '0',
        nilai: '',
        keterangan: '',
        bonus_p: '0',
        bonus_t: '0',
        bonus_j: '0'
    });
    const [form, setForm] = useState(blankForm());

    const fetchData = async () => {
        setLoading(true);
        try {
            const url = new URL(`${import.meta.env.VITE_API_MEANDPAY}/target-detail`);
            if (search) url.searchParams.append('search', search);
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

    const fetchDropdowns = async () => {
        try {
            const h = { Authorization: `Bearer ${localStorage.getItem('token')}` };
            const [ru, rj, rm] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_MEANDPAY}/users`, { headers: h }),
                fetch(`${import.meta.env.VITE_API_MEANDPAY}/jabatans`, { headers: h }),
                fetch(`${import.meta.env.VITE_API_MEANDPAY}/target-master`, { headers: h })
            ]);
            const du = await ru.json();
            const dj = await rj.json();
            const dm = await rm.json();
            if (du.success) setUsers(du.data || []);
            if (dj.success) setJabatans(dj.data || []);
            if (dm.success) setMasterTargets(dm.data || []);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchData();
        fetchDropdowns();
    }, []);

    useEffect(() => {
        const t = setTimeout(fetchData, 500);
        return () => clearTimeout(t);
    }, [search]);

    const handleEdit = (row: any) => {
        setEditingId(row.id);
        setForm({
            target_kinerja_id: row.target_kinerja_id || '',
            user_id: row.user_id || '',
            jabatan_id: row.jabatan_id || '',
            judul: row.judul || '',
            target_pribadi: row.target_pribadi || '0',
            jumlah: row.jumlah || '0',
            capai: row.capai?.toString() || '0',
            nilai: row.nilai || '',
            keterangan: row.keterangan || '',
            bonus_p: row.bonus_p || '0',
            bonus_t: row.bonus_t || '0',
            bonus_j: row.bonus_j || '0'
        });
        setView('form');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const tid = addToast({ title: 'Menyimpan...', message: '', type: 'loading' });
        try {
            const url = editingId
                ? `${import.meta.env.VITE_API_MEANDPAY}/target-detail/${editingId}`
                : `${import.meta.env.VITE_API_MEANDPAY}/target-detail`;
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
                setForm(blankForm());
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

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        const tid = addToast({ title: 'Menghapus...', message: '', type: 'loading' });
        try {
            const r = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/target-detail/${deleteTarget.id}`, {
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
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-4 lg:p-8 max-w-[1700px] mx-auto">
            <div className="flex items-center gap-6 mb-10">
                <button onClick={() => { setView('list'); setEditingId(null); }} className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all active:scale-95 shadow-sm">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">{editingId ? 'Edit Detail Target' : 'Tambah Detail Target'}</h2>
                    <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Manajemen Pencapaian & Evaluasi Pegawai</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-8">
                    <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                                <Activity className="w-4 h-4 text-indigo-500" />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Informasi Utama</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Field label="Pilih Pegawai">
                                <select required value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })} className={inputCls}>
                                    <option value="">Pilih Pegawai...</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </Field>
                            <Field label="Master Target">
                                <select required value={form.target_kinerja_id} onChange={e => setForm({ ...form, target_kinerja_id: e.target.value })} className={inputCls}>
                                    <option value="">Pilih Master Target...</option>
                                    {masterTargets.map(t => <option key={t.id} value={t.id}>{t.nomor}</option>)}
                                </select>
                            </Field>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Field label="Jabatan">
                                <select required value={form.jabatan_id} onChange={e => setForm({ ...form, jabatan_id: e.target.value })} className={inputCls}>
                                    <option value="">Pilih Jabatan...</option>
                                    {jabatans.map(j => <option key={j.id} value={j.id}>{j.nama_jabatan}</option>)}
                                </select>
                            </Field>
                            <Field label="Judul Target">
                                <input required type="text" placeholder="Masukkan judul..." value={form.judul} onChange={e => setForm({ ...form, judul: e.target.value })} className={inputCls} />
                            </Field>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Field label="Target Pribadi">
                                <input required type="number" value={form.target_pribadi} onChange={e => setForm({ ...form, target_pribadi: e.target.value })} className={inputCls} />
                            </Field>
                            <Field label="Jumlah Penjualan">
                                <input required type="number" value={form.jumlah} onChange={e => setForm({ ...form, jumlah: e.target.value })} className={inputCls} />
                            </Field>
                        </div>

                        <Field label="Keterangan">
                            <textarea rows={4} value={form.keterangan} onChange={e => setForm({ ...form, keterangan: e.target.value })} className={cn(inputCls, 'resize-none')} />
                        </Field>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl shadow-slate-200">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-indigo-400" />
                            </div>
                            <h3 className="text-sm font-black text-white/50 uppercase tracking-widest text-[10px]">Rewards & Penilaian</h3>
                        </div>
                        <div className="space-y-6">
                            <Field label="Bonus Pribadi (P)">
                                <input type="number" value={form.bonus_p} onChange={e => setForm({ ...form, bonus_p: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm font-bold text-white focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all" />
                            </Field>
                            <Field label="Bonus Team (T)">
                                <input type="number" value={form.bonus_t} onChange={e => setForm({ ...form, bonus_t: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm font-bold text-white focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all" />
                            </Field>
                            <Field label="Bonus Jackpot (J)">
                                <input type="number" value={form.bonus_j} onChange={e => setForm({ ...form, bonus_j: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm font-bold text-white focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all" />
                            </Field>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
                        <div className="grid grid-cols-2 gap-6">
                            <Field label="Nilai">
                                <input type="text" placeholder="A, B, C..." value={form.nilai} onChange={e => setForm({ ...form, nilai: e.target.value })} className={inputCls} />
                            </Field>
                            <Field label="Capai (%)">
                                <input type="number" step="0.01" value={form.capai} onChange={e => setForm({ ...form, capai: e.target.value })} className={inputCls} />
                            </Field>
                        </div>
                    </div>

                    <button disabled={isSubmitting} type="submit"
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-base shadow-2xl shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3">
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : <Target className="w-5 h-5" />}
                        {editingId ? 'Simpan Perubahan' : 'Publish Detail Target'}
                    </button>
                </div>
            </form>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            {deleteTarget && <DeleteModal name={deleteTarget.users?.name || 'Item'} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}

            {view === 'form' ? renderForm() : (
                <div className="p-4 lg:p-8 max-w-[1700px] mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-5 mb-2">
                            <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-200 rotate-3 transition-transform hover:rotate-0">
                                <Target className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Detail Target Kinerja</h1>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Audit & Monitoring Pencapaian Pegawai</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari pegawai..."
                                    className="w-full sm:w-72 pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none" />
                            </div>
                            <button onClick={() => { setForm(blankForm()); setEditingId(null); setView('form'); }}
                                className="px-8 py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-slate-200">
                                <Plus className="w-5 h-5" /> Tambah Detail
                            </button>
                        </div>
                    </div>

                    {/* Table Container */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden text-slate-100">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[2000px]">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        {[
                                            'No.', 'Nama Pegawai', 'Nomor Target', 'Judul', 'Target Pribadi',
                                            'Penjualan', 'Sisa', 'Sisa Target %', 'Capai %', 'Nilai',
                                            'Mulai', 'Selesai', 'Bonus P', 'Bonus T', 'Bonus J', 'Aksi'
                                        ].map(h => (
                                            <th key={h} className="py-7 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading && data.length === 0 ? (
                                        <tr>
                                            <td colSpan={16} className="py-24 text-center text-slate-900">
                                                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto text-slate-900" />
                                                <p className="text-xs font-black text-slate-400 mt-6 uppercase tracking-[0.3em] animate-pulse">Menghubungkan Server...</p>
                                            </td>
                                        </tr>
                                    ) : data.length === 0 ? (
                                        <tr>
                                            <td colSpan={16} className="py-24 text-center text-slate-900">
                                                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner text-slate-200">
                                                    <AlertCircle className="w-10 h-10" />
                                                </div>
                                                <h3 className="text-xl font-black text-slate-300">Tidak Ada Data</h3>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Silakan tambahkan detail target baru</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        data.map((row, idx) => (
                                            <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group text-slate-900">
                                                <td className="py-6 px-8 text-xs font-bold text-slate-300">{idx + 1}.</td>
                                                <td className="py-6 px-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 font-black text-xs">
                                                            {row.users?.name?.charAt(0)}
                                                        </div>
                                                        <span className="text-sm font-black text-slate-800">{row.users?.name || '—'}</span>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-8">
                                                    <span className="text-[10px] font-black text-indigo-500 px-3 py-1.5 bg-indigo-50 rounded-lg">
                                                        {row.target_kinerjas?.nomor || '—'}
                                                    </span>
                                                </td>
                                                <td className="py-6 px-8 text-sm font-medium text-slate-600">
                                                    {row.judul || '—'}
                                                </td>
                                                <td className="py-6 px-8 font-black text-slate-900 text-sm">
                                                    {fmt(row.target_pribadi)}
                                                </td>
                                                <td className="py-6 px-8 font-black text-emerald-600 text-sm">
                                                    {fmt(row.jumlah)}
                                                </td>
                                                <td className="py-6 px-8 font-black text-rose-500 text-sm">
                                                    {fmt(row.sisa)}
                                                </td>
                                                <td className="py-6 px-8 text-xs font-black text-rose-400">
                                                    {row.sisa_target_persen}%
                                                </td>
                                                <td className="py-6 px-8">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-indigo-500 rounded-full"
                                                                style={{ width: `${Math.min(100, parseFloat(row.capai_persen) || 0)}%` }} />
                                                        </div>
                                                        <span className="text-[10px] font-black text-indigo-600">{row.capai_persen}%</span>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-8">
                                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg border border-emerald-100">
                                                        {row.nilai || 'P'}
                                                    </span>
                                                </td>
                                                <td className="py-6 px-8 text-xs font-bold text-slate-500">
                                                    {row.target_kinerjas?.tanggal_awal ? new Date(row.target_kinerjas.tanggal_awal).toLocaleDateString('id-ID') : '—'}
                                                </td>
                                                <td className="py-6 px-8 text-xs font-bold text-slate-500">
                                                    {row.target_kinerjas?.tanggal_akhir ? new Date(row.target_kinerjas.tanggal_akhir).toLocaleDateString('id-ID') : '—'}
                                                </td>
                                                <td className="py-6 px-8 font-bold text-slate-700 text-xs">
                                                    {fmt(row.bonus_p)}
                                                </td>
                                                <td className="py-6 px-8 font-bold text-slate-700 text-xs">
                                                    {fmt(row.bonus_t)}
                                                </td>
                                                <td className="py-6 px-8 font-bold text-slate-700 text-xs">
                                                    {fmt(row.bonus_j)}
                                                </td>
                                                <td className="py-6 px-8">
                                                    <div className="flex items-center gap-2  transition-all">
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
