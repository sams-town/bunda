import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Search, Plus, Edit, Trash2, ArrowLeft, Target,
    Calendar, AlertCircle, Trophy, User, Activity, Sparkles, Trash
} from 'lucide-react';
import { useToast } from './Toast';
import { cn } from '../lib/utils';

/* ─── Helpers ─── */
const fmt = (val: any) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(parseFloat(val) || 0);

const inputCls = [
    'w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold',
    'placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400',
    'transition-all duration-200'
].join(' ');

const tableInputCls = [
    'w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-bold',
    'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400',
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
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Hapus Target?</h3>
                    <p className="text-sm text-slate-500 mt-3 font-medium">Data Target <span className="font-bold text-slate-900">{name}</span> dan seluruh rincian team terkait akan dihapus permanen.</p>
                    <div className="grid grid-cols-2 gap-4 mt-8">
                        <button onClick={onCancel} className="py-4 bg-slate-50 rounded-2xl font-black text-slate-400 hover:bg-slate-100 transition-all active:scale-95">Batal</button>
                        <button onClick={onConfirm} className="py-4 bg-rose-500 rounded-2xl font-black text-white shadow-xl shadow-rose-200 hover:bg-rose-600 transition-all active:scale-95">Ya, Hapus</button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export function FinanceTargetPage() {
    const [view, setView] = useState<'list' | 'form'>('list');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const { addToast, updateToast } = useToast();

    // Master Dropdowns
    const [users, setUsers] = useState<any[]>([]);
    const [jabatans, setJabatans] = useState<any[]>([]);

    // Form State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

    const blankForm = () => ({
        nomor: '',
        target_team: '0',
        jumlah_persen_team: '0',
        bonus_team: '0',
        jackpot: '0',
        tanggal_awal: '',
        tanggal_akhir: ''
    });
    const [form, setForm] = useState(blankForm());

    // Teams Rows
    const blankRow = () => ({
        user_id: '',
        jabatan_id: '',
        target_pribadi: '0',
        jumlah_persen_pribadi: '0',
        bonus_pribadi: '0'
    });
    const [rows, setRows] = useState<any[]>([blankRow()]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Using target-detail to show individual employee rows in the list
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
            const [ru, rj] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_MEANDPAY}/users`, { headers: h }),
                fetch(`${import.meta.env.VITE_API_MEANDPAY}/jabatans`, { headers: h })
            ]);
            const du = await ru.json();
            const dj = await rj.json();
            if (du.success) setUsers(du.data || []);
            if (dj.success) setJabatans(dj.data || []);
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

    const handleEdit = async (masterId: string) => {
        if (!masterId) return;
        setLoading(true);
        try {
            const r = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/target-master/${masterId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const j = await r.json();
            if (j.success) {
                const master = j.data;
                setEditingId(master.id);
                setForm({
                    nomor: master.nomor || '',
                    target_team: master.target_team || '0',
                    jumlah_persen_team: master.jumlah_persen_team || '0',
                    bonus_team: master.bonus_team || '0',
                    jackpot: master.jackpot || '0',
                    tanggal_awal: master.tanggal_awal ? master.tanggal_awal.split('T')[0] : '',
                    tanggal_akhir: master.tanggal_akhir ? master.tanggal_akhir.split('T')[0] : ''
                });
                setRows(master.target_kinerja_teams.length > 0
                    ? master.target_kinerja_teams.map((t: any) => ({
                        user_id: t.user_id || '',
                        jabatan_id: t.jabatan_id || '',
                        target_pribadi: t.target_pribadi || '0',
                        jumlah_persen_pribadi: t.jumlah_persen_pribadi || '0',
                        bonus_pribadi: t.bonus_pribadi || '0'
                    }))
                    : [blankRow()]
                );
                setView('form');
            }
        } catch {
            addToast({ title: 'Error', message: 'Gagal mengambil detail', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const addRow = () => setRows([...rows, blankRow()]);
    const removeRow = (idx: number) => {
        if (rows.length === 1) return;
        setRows(rows.filter((_, i) => i !== idx));
    };
    const updateRow = (idx: number, field: string, val: any) => {
        const nr = [...rows];
        nr[idx] = { ...nr[idx], [field]: val };

        if (field === 'user_id') {
            const user = users.find(u => u.id.toString() === val);
            if (user && user.jabatan_id) {
                nr[idx].jabatan_id = user.jabatan_id.toString();
            }
        }

        setRows(nr);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const tid = addToast({ title: 'Menyimpan...', message: '', type: 'loading' });
        try {
            const payload = { ...form, teams: rows.filter(r => r.user_id) };
            const url = editingId
                ? `${import.meta.env.VITE_API_MEANDPAY}/target-master/${editingId}`
                : `${import.meta.env.VITE_API_MEANDPAY}/target-master`;
            const method = editingId ? 'PUT' : 'POST';

            const r = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(payload)
            });
            const j = await r.json();

            if (j.success) {
                updateToast(tid, { title: 'Berhasil!', message: j.message, type: 'success' });
                setView('list');
                fetchData();
                setForm(blankForm());
                setRows([blankRow()]);
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
            // Delete the whole master group
            const r = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/target-master/${deleteTarget.target_kinerja_id || deleteTarget.id}`, {
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
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="p-4 lg:p-10 max-w-[1700px] mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Tambah Target Team</h1>
                <button onClick={() => setView('list')} className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-100 transition-all active:scale-95">
                    Back
                </button>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden p-8 lg:p-10 space-y-10">
                <div>
                    <Field label="Nomor Target Kinerja">
                        <input required type="text" placeholder="TK/000000" value={form.nomor} onChange={e => setForm({ ...form, nomor: e.target.value })}
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:ring-4 focus:ring-indigo-100 transition-all outline-none" />
                    </Field>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-50 border border-slate-100 rounded-[2rem] overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Nama Pegawai</th>
                                    <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Jabatan</th>
                                    <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Target Pribadi</th>
                                    <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Jumlah %</th>
                                    <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Bonus Pribadi</th>
                                    <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rows.map((row, idx) => (
                                    <tr key={idx} className="bg-white/50 group">
                                        <td className="p-3">
                                            <select value={row.user_id} onChange={e => updateRow(idx, 'user_id', e.target.value)} className={tableInputCls}>
                                                <option value="">-- Pilih --</option>
                                                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                            </select>
                                        </td>
                                        <td className="p-3">
                                            <select disabled value={row.jabatan_id} className={cn(tableInputCls, "bg-slate-50 opacity-100")}>
                                                <option value="">-- Jabatan --</option>
                                                {jabatans.map(j => <option key={j.id} value={j.id}>{j.nama_jabatan}</option>)}
                                            </select>
                                        </td>
                                        <td className="p-3">
                                            <input type="number" value={row.target_pribadi} onChange={e => updateRow(idx, 'target_pribadi', e.target.value)} className={tableInputCls} />
                                        </td>
                                        <td className="p-3">
                                            <div className="relative">
                                                <input type="number" value={row.jumlah_persen_pribadi} onChange={e => updateRow(idx, 'jumlah_persen_pribadi', e.target.value)} className={cn(tableInputCls, "pr-8")} />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">%</span>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <input type="number" value={row.bonus_pribadi} onChange={e => updateRow(idx, 'bonus_pribadi', e.target.value)} className={tableInputCls} />
                                        </td>
                                        <td className="p-3 text-center">
                                            <button type="button" onClick={() => removeRow(idx)} disabled={rows.length === 1}
                                                className="w-10 h-10 flex items-center justify-center bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-lg transition-all active:scale-90 disabled:opacity-0">
                                                <Trash className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <button type="button" onClick={addRow}
                        className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-sm flex items-center gap-2 shadow-lg shadow-emerald-100 transition-all active:scale-95">
                        <Plus className="w-4 h-4" /> Tambah
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Field label="Target Team">
                        <input type="number" value={form.target_team} onChange={e => setForm({ ...form, target_team: e.target.value })} className={inputCls} />
                    </Field>
                    <Field label="Jumlah %">
                        <div className="relative">
                            <input type="number" value={form.jumlah_persen_team} onChange={e => setForm({ ...form, jumlah_persen_team: e.target.value })} className={cn(inputCls, "pr-12")} />
                            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">%</span>
                        </div>
                    </Field>
                    <Field label="Bonus Team">
                        <input type="number" value={form.bonus_team} onChange={e => setForm({ ...form, bonus_team: e.target.value })} className={inputCls} />
                    </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                    <Field label="Tanggal Awal Target">
                        <input type="date" value={form.tanggal_awal} onChange={e => setForm({ ...form, tanggal_awal: e.target.value })} className={inputCls} />
                    </Field>
                    <Field label="Tanggal Akhir Target">
                        <input type="date" value={form.tanggal_akhir} onChange={e => setForm({ ...form, tanggal_akhir: e.target.value })} className={inputCls} />
                    </Field>
                    <div className="flex items-center gap-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">Jackpot</label>
                        <input type="number" value={form.jackpot} onChange={e => setForm({ ...form, jackpot: e.target.value })}
                            className="w-full px-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-800 font-bold focus:ring-4 focus:ring-indigo-100 outline-none transition-all shadow-sm" />
                    </div>
                </div>

                <div className="flex justify-end pt-8">
                    <button type="submit" disabled={isSubmitting}
                        className="px-12 py-5 bg-[#2D5676] hover:bg-[#1a3d58] text-white rounded-2xl font-black text-base shadow-2xl shadow-slate-200 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-3">
                        {isSubmitting ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Submit'}
                    </button>
                </div>
            </form>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            {deleteTarget && <DeleteModal name={deleteTarget.nomor || deleteTarget.users?.name} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}

            {view === 'form' ? renderForm() : (
                <div className="p-4 lg:p-8 max-w-[1700px] mx-auto space-y-8">
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-200">
                                <Trophy className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Target Kinerja</h1>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Sistem Pemantauan Capaian Pegawai</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama pegawai..."
                                    className="w-full sm:w-72 pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none" />
                            </div>
                            <button onClick={() => { setForm(blankForm()); setRows([blankRow()]); setEditingId(null); setView('form'); }}
                                className="px-8 py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-slate-200">
                                <Plus className="w-5 h-5" /> Tambah Target
                            </button>
                        </div>
                    </div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[1500px]">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        {[
                                            'No.', 'Nomor Target', 'Nama Pegawai', 'Jabatan', 'Target Pribadi',
                                            '%', 'Bonus Pribadi', 'Target Team', '%', 'Bonus Team',
                                            'Tanggal Awal', 'Tanggal Akhir', 'Actions'
                                        ].map(h => (
                                            <th key={h} className="py-7 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading && data.length === 0 ? (
                                        <tr>
                                            <td colSpan={13} className="py-24 text-center">
                                                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto" />
                                                <p className="text-xs font-black text-slate-400 mt-6 uppercase tracking-[0.3em]">Loading Database...</p>
                                            </td>
                                        </tr>
                                    ) : data.length === 0 ? (
                                        <tr>
                                            <td colSpan={13} className="py-24 text-center">
                                                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-200">
                                                    <AlertCircle className="w-10 h-10" />
                                                </div>
                                                <h3 className="text-xl font-black text-slate-300">Tidak Ada Data</h3>
                                            </td>
                                        </tr>
                                    ) : (
                                        data.map((row, idx) => (
                                            <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="py-6 px-8 text-xs font-bold text-slate-300">{idx + 1}.</td>
                                                <td className="py-6 px-8">
                                                    <span className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg border border-indigo-100">
                                                        {row.target_kinerjas?.nomor || row.nomor}
                                                    </span>
                                                </td>
                                                <td className="py-6 px-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-indigo-100">
                                                            {row.users?.name?.charAt(0)}
                                                        </div>
                                                        <span className="text-sm font-black text-slate-800">{row.users?.name || '—'}</span>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-8 text-xs font-bold text-slate-500 whitespace-nowrap">{row.jabatans?.nama_jabatan || '—'}</td>
                                                <td className="py-6 px-8 font-black text-slate-900 text-sm">{fmt(row.target_pribadi)}</td>
                                                <td className="py-6 px-8 font-black text-indigo-500 text-xs text-center">{row.jumlah_persen_pribadi}%</td>
                                                <td className="py-6 px-8 font-black text-emerald-600 text-sm">{fmt(row.bonus_pribadi)}</td>
                                                <td className="py-6 px-8 font-black text-slate-700 text-sm">{fmt(row.target_kinerjas?.target_team)}</td>
                                                <td className="py-6 px-8 font-black text-purple-600 text-xs text-center">{row.target_kinerjas?.jumlah_persen_team}%</td>
                                                <td className="py-6 px-8 font-black text-amber-600 text-sm">{fmt(row.target_kinerjas?.bonus_team)}</td>
                                                <td className="py-6 px-8 text-xs font-bold text-slate-500 whitespace-nowrap">{row.target_kinerjas?.tanggal_awal ? new Date(row.target_kinerjas.tanggal_awal).toLocaleDateString() : '—'}</td>
                                                <td className="py-6 px-8 text-xs font-bold text-slate-500 whitespace-nowrap">{row.target_kinerjas?.tanggal_akhir ? new Date(row.target_kinerjas.tanggal_akhir).toLocaleDateString() : '—'}</td>
                                                <td className="py-6 px-8 text-right">
                                                    <div className="flex items-center justify-end gap-2  transition-all">
                                                        <button onClick={() => handleEdit(row.target_kinerja_id)} className="p-2.5 bg-white border border-slate-200 text-emerald-500 rounded-xl hover:bg-emerald-50 shadow-sm"><Edit className="w-4 h-4" /></button>
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
