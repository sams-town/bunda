import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import {
    Search, Plus, Edit, Trash2, ArrowLeft,
    Upload, DollarSign, X, Eye, Download,
    Receipt, TrendingUp, Sparkles, AlertTriangle
} from 'lucide-react';
import { useToast } from './Toast';
import { cn } from '../lib/utils';

/* ─── helpers ─── */
const fmt = (val: any) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(parseFloat(val) || 0);

const statusCfg: Record<string, { dot: string; pill: string }> = {
    Approved: { dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
    Rejected: { dot: 'bg-red-500', pill: 'bg-red-50 text-red-700 ring-1 ring-red-200' },
    Pending: { dot: 'bg-amber-500', pill: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
};

const inputCls = [
    'w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl text-gray-800',
    'placeholder:text-gray-400 focus:outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50',
    'transition-all duration-200'
].join(' ');

const labelCls = 'block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return <div><label className={labelCls}>{label}</label>{children}</div>;
}

function Card({ title, children, accent = 'violet' }: { title: string; children: React.ReactNode; accent?: string }) {
    const bar: Record<string, string> = {
        violet: 'bg-violet-500', emerald: 'bg-emerald-500',
        indigo: 'bg-indigo-500', sky: 'bg-sky-500',
    };
    return (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="px-6 pt-5 pb-1 flex items-center gap-3">
                <div className={cn('w-1 h-5 rounded-full', bar[accent])} />
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{title}</h3>
            </div>
            <div className="px-6 pb-6 pt-4">{children}</div>
        </div>
    );
}

/* ─── Delete Confirm Modal ─── */
function DeleteModal({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
                onClick={onCancel}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 16 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    onClick={e => e.stopPropagation()}
                    className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-8 border border-slate-100"
                >
                    <div className="flex flex-col items-center text-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                            <Trash2 className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">Hapus Reimbursement?</h2>
                            <p className="text-sm text-gray-500 mt-1.5">
                                Data <span className="font-semibold text-gray-700">{name}</span> akan dihapus permanen dan tidak bisa dikembalikan.
                            </p>
                        </div>
                        <div className="flex gap-3 w-full mt-2">
                            <button onClick={onCancel}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                                Batal
                            </button>
                            <button onClick={onConfirm}
                                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors">
                                Hapus
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

/* ─── MAIN ─── */
export function FinanceReimbursementPage() {
    const [view, setView] = useState<'list' | 'form'>('list');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
    const { addToast, updateToast } = useToast();

    const handleExportExcel = async () => {
        const toastId = addToast({ type: 'loading', title: 'Export Excel', message: 'Sedang menyiapkan data...' });
        try {
            const url = new URL(`${import.meta.env.VITE_API_MEANDPAY}/reimbursements`);
            url.searchParams.append('limit', '100000');

            const r = await fetch(url.toString(), {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const j = await r.json();
            if (!j.success) throw new Error(j.message);

            const exportData = j.data.map((row: any, idx: number) => ({
                'No': idx + 1,
                'Tanggal': row.tanggal ? new Date(row.tanggal).toLocaleDateString('id-ID') : '—',
                'Nama Karyawan': row.users?.name || '—',
                'Event / Keterangan': row.event || '—',
                'Kategori': row.kategoris?.name || '—',
                'Status': row.status || 'Pending',
                'Jumlah': row.jumlah,
                'Qty': row.qty,
                'Total': row.total,
                'Sisa': row.sisa
            }));

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Reimbursement');

            ws['!cols'] = [
                { wch: 5 }, { wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 20 },
                { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 15 }
            ];

            XLSX.writeFile(wb, `Data_Reimbursement_${new Date().toISOString().split('T')[0]}.xlsx`);
            updateToast(toastId, { type: 'success', title: 'Berhasil', message: 'Data berhasil di-export ke Excel' });
        } catch (err: any) {
            console.error('Export error:', err);
            updateToast(toastId, { type: 'error', title: 'Gagal', message: err.message || 'Gagal mengekspor data' });
        }
    };

    const blankForm = () => ({
        tanggal: new Date().toISOString().split('T')[0],
        user_id: '', event: '', kategori_id: '',
        jumlah: '0', qty: '1', items: [] as any[]
    });
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [jabatans, setJabatans] = useState<any[]>([]);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setCurrentUser(user);
        fetch(`${import.meta.env.VITE_API_MEANDPAY}/jabatans`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(r => r.json()).then(j => j.success && setJabatans(j.data));
    }, []);

    const [form, setForm] = useState(blankForm());

    const total = (parseFloat(form.jumlah) || 0) * (parseInt(form.qty) || 0);
    const feeTotal = form.items.reduce((s: number, i: any) => s + (parseFloat(i.fee) || 0), 0);
    const sisa = total - feeTotal;

    const fetchData = async () => {
        setLoading(true);
        try {
            const url = new URL(`${import.meta.env.VITE_API_MEANDPAY}/reimbursements`);
            if (search) url.searchParams.append('search', search);
            const r = await fetch(url.toString(), { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            const j = await r.json();
            if (j.success) {
                let result = j.data;
                const activeUser = currentUser || JSON.parse(localStorage.getItem('user') || '{}');
                const isMaster = activeUser?.id?.toString() === '1' || Number(activeUser?.id) === 1 || activeUser?.is_admin === 'superadmin' || activeUser?.is_admin === 'admin' || activeUser?.role === 'superadmin' || activeUser?.role === 'admin';

                if (!isMaster) {
                    const managedDivisions = jabatans
                        .filter((j: any) => j.manager?.toString() === activeUser?.id?.toString())
                        .map((j: any) => j.id.toString());
                    
                    result = result.filter((item: any) => {
                        const pemohon = users.find((u: any) => u.id?.toString() === item.user_id?.toString());
                        const empDivId = pemohon?.jabatan_id || pemohon?.jabatan?.id;
                        return managedDivisions.includes(empDivId?.toString());
                    });
                }
                setData(result);
            }
        } catch { addToast({ title: 'Error', message: 'Gagal memuat data', type: 'error' }); }
        finally { setLoading(false); }
    };

    const fetchDropdowns = async () => {
        try {
            const [ru, rc] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_MEANDPAY}/users`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
                fetch(`${import.meta.env.VITE_API_MEANDPAY}/kategori-reimbursement`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
            ]);
            const du = await ru.json(); const dc = await rc.json();
            if (du.success) setUsers(du.data || []);
            if (dc.success) setCategories(dc.data || []);
        } catch (e) { console.error(e); }
    };

    useEffect(() => { fetchData(); fetchDropdowns(); }, [currentUser, users.length, jabatans.length]);
    useEffect(() => { const t = setTimeout(fetchData, 500); return () => clearTimeout(t); }, [search]);

    const resetAndOpen = () => { setForm(blankForm()); setEditingId(null); setSelectedFile(null); setView('form'); };

    const handleEdit = (row: any) => {
        setEditingId(row.id);
        setForm({
            tanggal: row.tanggal ? new Date(row.tanggal).toISOString().split('T')[0] : '',
            user_id: row.user_id, event: row.event || '',
            kategori_id: row.kategori_id, jumlah: row.jumlah || '0',
            qty: row.qty?.toString() || '1',
            items: (row.reimbursements_items || []).map((i: any) => ({ user_id: i.user_id, fee: i.fee || '0' }))
        });
        setView('form');
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        const tid = addToast({ title: 'Menghapus...', message: '', type: 'loading' });
        setDeleteTarget(null);
        try {
            const r = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/reimbursements/${deleteTarget.id}`, {
                method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const j = await r.json();
            if (j.success) { updateToast(tid, { title: 'Dihapus', message: j.message, type: 'success' }); fetchData(); }
            else updateToast(tid, { title: 'Gagal', message: j.message, type: 'error' });
        } catch { updateToast(tid, { title: 'Error', message: 'Kesalahan sistem', type: 'error' }); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setIsSubmitting(true);
        const tid = addToast({ title: 'Menyimpan...', message: '', type: 'loading' });
        try {
            const fd = new FormData();
            fd.append('tanggal', form.tanggal); fd.append('user_id', form.user_id);
            fd.append('event', form.event); fd.append('kategori_id', form.kategori_id);
            fd.append('jumlah', form.jumlah); fd.append('qty', form.qty);
            fd.append('total', total.toString()); fd.append('sisa', sisa.toString());
            fd.append('status', 'Pending'); fd.append('items', JSON.stringify(form.items));
            if (selectedFile) fd.append('file', selectedFile);

            const url = editingId ? `${import.meta.env.VITE_API_MEANDPAY}/reimbursements/${editingId}` : `${import.meta.env.VITE_API_MEANDPAY}/reimbursements`;
            const method = editingId ? 'PUT' : 'POST';
            const r = await fetch(url, { method, headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, body: fd });
            const j = await r.json();

            if (j.success) {
                updateToast(tid, { title: 'Tersimpan!', message: j.message, type: 'success' });
                setView('list'); fetchData(); setForm(blankForm()); setEditingId(null); setSelectedFile(null);
            } else {
                updateToast(tid, { title: 'Gagal', message: j.message, type: 'error' });
            }
        } catch { updateToast(tid, { title: 'Error', message: 'Kesalahan sistem', type: 'error' }); }
        finally { setIsSubmitting(false); }
    };

    const addItem = () => setForm(f => ({ ...f, items: [...f.items, { user_id: '', fee: '0' }] }));
    const removeItem = (i: number) => setForm(f => { const items = [...f.items]; items.splice(i, 1); return { ...f, items }; });
    const changeItem = (i: number, k: string, v: string) => setForm(f => {
        const items = [...f.items]; items[i] = { ...items[i], [k]: v }; return { ...f, items };
    });

    const totalReimb = data.reduce((s, r) => s + (parseFloat(r.total) || 0), 0);
    const totalSisa = data.reduce((s, r) => s + (parseFloat(r.sisa) || 0), 0);
    const pendingCount = data.filter(r => r.status === 'Pending').length;

    /* ══ FORM ══ */
    if (view === 'form') return (
        <>
            {deleteTarget && (
                <DeleteModal
                    name={deleteTarget.name}
                    onConfirm={confirmDelete}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                className="min-h-screen bg-gray-50">

                <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-8 py-3.5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <button onClick={() => { setView('list'); setForm(blankForm()); setEditingId(null); }}
                            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Kembali
                        </button>
                        <div className="w-px h-4 bg-gray-200" />
                        <span className="text-sm font-semibold text-gray-700">
                            {editingId ? 'Edit Reimbursement' : 'Reimbursement Baru'}
                        </span>
                    </div>
                    <button type="submit" form="reimb-form" disabled={isSubmitting}
                        className="flex items-center gap-2 px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm shadow-violet-200">
                        {isSubmitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>

                <form id="reimb-form" onSubmit={handleSubmit}
                    className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-3 gap-5">
                    <div className="col-span-2 space-y-5">
                        <Card title="Informasi Dasar" accent="violet">
                            <div className="grid grid-cols-2 gap-5">
                                <Field label="Tanggal">
                                    <input required type="date" value={form.tanggal}
                                        onChange={e => setForm(f => ({ ...f, tanggal: e.target.value }))}
                                        className={inputCls} />
                                </Field>
                                <Field label="Nama Karyawan">
                                    <select required value={form.user_id}
                                        onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))}
                                        className={inputCls}>
                                        <option value="">Pilih karyawan...</option>
                                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                </Field>
                                <Field label="Kategori">
                                    <select required value={form.kategori_id}
                                        onChange={e => {
                                            const cat = categories.find(c => c.id.toString() === e.target.value);
                                            setForm(f => ({ ...f, kategori_id: e.target.value, jumlah: cat?.jumlah || '0' }));
                                        }}
                                        className={inputCls}>
                                        <option value="">Pilih kategori...</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </Field>
                                <Field label="Event / Keterangan">
                                    <input type="text" value={form.event}
                                        placeholder="Nama event atau keterangan..."
                                        onChange={e => setForm(f => ({ ...f, event: e.target.value }))}
                                        className={inputCls} />
                                </Field>
                            </div>
                        </Card>

                        <Card title="Partner & Peserta" accent="emerald">
                            <div className="flex justify-end mb-4">
                                <button type="button" onClick={addItem}
                                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors ring-1 ring-emerald-200">
                                    <Plus className="w-3.5 h-3.5" /> Tambah Partner
                                </button>
                            </div>
                            {form.items.length === 0 ? (
                                <div className="py-10 text-center text-sm text-gray-400">Belum ada partner ditambahkan</div>
                            ) : (
                                <div className="space-y-2.5">
                                    <div className="grid grid-cols-[1fr_148px_36px] gap-3 px-1">
                                        <span className={labelCls}>Nama Partner</span>
                                        <span className={labelCls}>Fee (Rp)</span>
                                        <span />
                                    </div>
                                    {form.items.map((item: any, i: number) => (
                                        <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                            className="grid grid-cols-[1fr_148px_36px] gap-3 items-center">
                                            <select value={item.user_id} onChange={e => changeItem(i, 'user_id', e.target.value)} className={inputCls}>
                                                <option value="">Pilih partner...</option>
                                                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                            </select>
                                            <input type="number" value={item.fee}
                                                onChange={e => changeItem(i, 'fee', e.target.value)} className={inputCls} />
                                            <button type="button" onClick={() => removeItem(i)}
                                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>

                    <div className="space-y-5">
                        <Card title="Kalkulasi" accent="indigo">
                            <div className="space-y-4">
                                <Field label="Jumlah / Unit">
                                    <input type="number" value={form.jumlah}
                                        onChange={e => setForm(f => ({ ...f, jumlah: e.target.value }))}
                                        className={inputCls} />
                                </Field>
                                <Field label="Qty">
                                    <input type="number" value={form.qty}
                                        onChange={e => setForm(f => ({ ...f, qty: e.target.value }))}
                                        className={inputCls} />
                                </Field>
                                <div className="pt-4 border-t border-gray-100 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Total</span>
                                        <span className="font-semibold text-gray-800">{fmt(total)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Fee Partner</span>
                                        <span className="font-semibold text-red-500">− {fmt(feeTotal)}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                                        <span className="text-sm font-bold text-gray-700">Sisa</span>
                                        <span className="text-xl font-black text-violet-600">{fmt(sisa)}</span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card title="Lampiran Bukti" accent="sky">
                            <label className="block cursor-pointer">
                                <div className={cn(
                                    'flex flex-col items-center justify-center gap-3 py-8 rounded-xl border-2 border-dashed transition-all',
                                    selectedFile ? 'border-violet-300 bg-violet-50' : 'border-gray-200 hover:border-violet-300 hover:bg-violet-50/40'
                                )}>
                                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', selectedFile ? 'bg-violet-100' : 'bg-gray-100')}>
                                        <Upload className={cn('w-5 h-5', selectedFile ? 'text-violet-600' : 'text-gray-400')} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-semibold text-gray-700">
                                            {selectedFile ? selectedFile.name : 'Klik untuk upload'}
                                        </p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">PDF, JPG, PNG — maks 5MB</p>
                                    </div>
                                </div>
                                <input type="file" className="hidden" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
                            </label>
                            {selectedFile && (
                                <button type="button" onClick={() => setSelectedFile(null)}
                                    className="mt-2 text-xs text-red-500 hover:text-red-700 w-full text-center transition-colors">
                                    Hapus file
                                </button>
                            )}
                        </Card>
                    </div>
                </form>
            </motion.div>
        </>
    );

    /* ══ LIST ══ */
    return (
        <>
            {/* Delete Modal */}
            {deleteTarget && (
                <DeleteModal
                    name={deleteTarget.name}
                    onConfirm={confirmDelete}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}

            <div className="min-h-screen bg-gray-50 p-6 space-y-6">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div>
                        <div className="flex items-center gap-4 mb-1">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-500 flex items-center justify-center shadow-xl shadow-indigo-200">
                                <Receipt className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-800 tracking-tight">Reimbursement</h1>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Kelola pengajuan reimbursement karyawan</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={handleExportExcel}
                            className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-black shadow-xl shadow-emerald-200 transition-all active:scale-95">
                            <Download className="w-5 h-5" /> Export
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={resetAndOpen}
                            className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-slate-900 hover:bg-black text-white text-sm font-black shadow-xl shadow-slate-200 transition-all active:scale-95">
                            <Plus className="w-5 h-5" /> Tambah Data
                        </motion.button>
                    </div>
                </motion.div>

                {/* Summary cards — style like screenshot */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .05 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        {
                            icon: DollarSign, label: 'TOTAL REIMBURSEMENT', value: fmt(totalReimb),
                            iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600',
                        },
                        {
                            icon: TrendingUp, label: 'TOTAL SISA', value: fmt(totalSisa),
                            iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600',
                        },
                        {
                            icon: Sparkles, label: 'MENUNGGU APPROVAL', value: `${pendingCount}`,
                            iconBg: 'bg-amber-50', iconColor: 'text-amber-600',
                        },
                    ].map((s, i) => (
                        <motion.div key={i}
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .08 + i * .04 }}
                            className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 flex items-center gap-6 group hover:shadow-lg transition-all duration-300">
                            <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 group-hover:rotate-6', s.iconBg)}>
                                <s.icon className={cn('w-7 h-7', s.iconColor)} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{s.label}</p>
                                <p className="text-2xl font-black text-slate-800 tracking-tight">{s.value}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Search */}
                <div className="flex flex-col lg:flex-row items-center gap-6">
                    <div className="relative flex-1 group w-full">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Cari nama pegawai, event pengajuan..."
                            className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white border border-slate-200 text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all shadow-sm" />
                    </div>
                </div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/80">
                                    {['No.', 'Tanggal', 'Nama', 'Event', 'Kategori', 'Status', 'Jumlah', 'Qty', 'Total', 'Partner', 'Sisa', 'File', 'Aksi'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading && data.length === 0 ? (
                                    <tr><td colSpan={13} className="py-20 text-center text-sm text-gray-400">Memuat data...</td></tr>
                                ) : data.length === 0 ? (
                                    <tr><td colSpan={13} className="py-20 text-center text-sm text-gray-400">Tidak ada data reimbursement</td></tr>
                                ) : data.map((row, idx) => {
                                    const sc = statusCfg[row.status] || statusCfg.Pending;
                                    return (
                                        <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors group">
                                            <td className="px-4 py-3.5 text-gray-300 text-xs font-medium">{idx + 1}</td>
                                            <td className="px-4 py-3.5 whitespace-nowrap text-gray-500 text-xs">
                                                {row.tanggal ? new Date(row.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap font-semibold text-gray-900">{row.users?.name || '—'}</td>
                                            <td className="px-4 py-3.5 text-gray-500 max-w-[150px] truncate text-xs">{row.event || '—'}</td>
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <span className="px-2.5 py-0.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 rounded-lg ring-1 ring-indigo-100">
                                                    {row.kategoris?.name || '—'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <span className={cn('flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-[10px] font-bold', sc.pill)}>
                                                    <span className={cn('w-1.5 h-1.5 rounded-full', sc.dot)} />
                                                    {row.status || 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap text-gray-600 text-xs font-medium">{fmt(row.jumlah)}</td>
                                            <td className="px-4 py-3.5 text-center text-gray-600 text-xs">{row.qty ?? '—'}</td>
                                            <td className="px-4 py-3.5 whitespace-nowrap text-gray-700 text-xs font-semibold">{fmt(row.total)}</td>
                                            <td className="px-4 py-3.5 text-center">
                                                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                                                    {row.reimbursements_items?.length || 0}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap font-bold text-violet-600 text-xs">{fmt(row.sisa)}</td>
                                            <td className="px-4 py-3.5">
                                                {row.file_path
                                                    ? <a href={row.file_path} target="_blank" rel="noreferrer"
                                                        className="flex items-center gap-1 text-[10px] font-semibold text-sky-600 hover:text-sky-800 transition-colors">
                                                        <Eye className="w-3.5 h-3.5" /> Lihat
                                                    </a>
                                                    : <span className="text-gray-300 text-xs">—</span>}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-1  transition-opacity">
                                                    <button onClick={() => handleEdit(row)}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-all">
                                                        <Edit className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTarget({ id: row.id, name: row.users?.name || 'data ini' })}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </>
    );
}