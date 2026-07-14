import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Edit, Trash2, X } from 'lucide-react';
import { useToast } from './Toast';
import { cn } from '../lib/utils';

export function FinanceKategoriReimbursementPage() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const { addToast, updateToast } = useToast();

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, id: string | number | null }>({ isOpen: false, id: null });

    const [formData, setFormData] = useState({
        name: '',
        jumlah: '',
        status: 'Aktif'
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const url = new URL(`${import.meta.env.VITE_API_MEANDPAY}/kategori-reimbursement`);
            if (search) url.searchParams.append('search', search);

            const response = await fetch(url.toString(), {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const result = await response.json();
            if (result.success) {
                setData(result.data);
            } else {
                addToast({ title: 'Gagal', message: result.message, type: 'error' });
            }
        } catch (error) {
            addToast({ title: 'Error', message: 'Gagal mengambil data', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchData();
        }, 500);
        return () => clearTimeout(debounce);
    }, [search]);

    const formatCurrency = (val: string | number | null) => {
        if (val === null || val === undefined) return 'Rp 0';
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
    };

    const handleOpenModal = (item: any = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({ name: item.name, jumlah: item.jumlah || '', status: item.status });
        } else {
            setEditingItem(null);
            setFormData({ name: '', jumlah: '', status: 'Aktif' });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const toastId = addToast({ title: 'Memproses', message: editingItem ? 'Memperbarui kategori...' : 'Menambahkan kategori...', type: 'loading' });

        try {
            const url = editingItem
                ? `${import.meta.env.VITE_API_MEANDPAY}/kategori-reimbursement/${editingItem.id}`
                : `${import.meta.env.VITE_API_MEANDPAY}/kategori-reimbursement`;

            const method = editingItem ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                updateToast(toastId, {
                    title: 'Berhasil',
                    message: result.message,
                    type: 'success'
                });
                setIsModalOpen(false);
                fetchData();
            } else {
                updateToast(toastId, {
                    title: 'Gagal',
                    message: result.message,
                    type: 'error'
                });
            }
        } catch (error) {
            updateToast(toastId, { title: 'Error', message: 'Terjadi kesalahan sistem', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm.id) return;
        setIsSubmitting(true);
        const toastId = addToast({ title: 'Menghapus', message: 'Sedang menghapus kategori...', type: 'loading' });

        try {
            const response = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/kategori-reimbursement/${deleteConfirm.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const result = await response.json();

            if (result.success) {
                updateToast(toastId, { title: 'Berhasil', message: result.message, type: 'success' });
                setDeleteConfirm({ isOpen: false, id: null });
                fetchData();
            } else {
                updateToast(toastId, { title: 'Gagal', message: result.message, type: 'error' });
            }
        } catch (error) {
            updateToast(toastId, { title: 'Error', message: 'Terjadi kesalahan sistem', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-[1400px] mx-auto pb-20"
        >
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Kategori Reimbursement</h1>
                    <p className="text-sm font-medium text-slate-400">Kelola daftar kategori dan limit biaya reimbursement.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-6 py-3 bg-[#1e3a5f] text-white rounded-xl font-bold hover:bg-[#152a45] transition-all flex items-center gap-2 shadow-lg shadow-[#1e3a5f]/20 active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    Tambah Kategori
                </button>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 pt-6">
                <div className="flex items-center gap-4 mb-8">
                    <div className="relative flex-1 group">
                        <input
                            type="text"
                            placeholder="Cari kategori..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                            <Search className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-left">
                                <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest w-20">No.</th>
                                <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Nama Kategori</th>
                                <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Limit Nominal</th>
                                <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="py-5 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest w-32">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading && data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                                        <p className="text-sm font-bold text-slate-400 mt-4">Memuat data...</p>
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center text-sm font-bold text-slate-400">Tidak ada kategori ditemukan</td>
                                </tr>
                            ) : (
                                data.map((row, index) => (
                                    <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-5 px-6 text-sm font-bold text-slate-400">{index + 1}.</td>
                                        <td className="py-5 px-6">
                                            <span className="text-sm font-bold text-slate-700">{row.name}</span>
                                        </td>
                                        <td className="py-5 px-6">
                                            <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                                                {formatCurrency(row.jumlah)}
                                            </span>
                                        </td>
                                        <td className="py-5 px-6">
                                            <span className={cn(
                                                "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                                row.status === 'Aktif'
                                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                    : "bg-rose-50 text-rose-600 border-rose-100"
                                            )}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleOpenModal(row)}
                                                    className="w-9 h-9 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-emerald-500 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all shadow-sm active:scale-90"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm({ isOpen: true, id: row.id })}
                                                    className="w-9 h-9 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-rose-500 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all shadow-sm active:scale-90"
                                                >
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
            </div>

            {/* Modal ADD/EDIT */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100"
                        >
                            <div className="px-10 py-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-slate-800 tracking-tight">
                                        {editingItem ? 'Edit Kategori' : 'Tambah Kategori Baru'}
                                    </h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Informasi Reimbursement</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white hover:shadow-sm rounded-2xl transition-all text-slate-400 hover:text-rose-500">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="p-10 space-y-8">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nama Kategori</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Contoh: Bensin Pertalite"
                                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Limit Nominal</label>
                                            <input
                                                required
                                                type="number"
                                                value={formData.jumlah}
                                                onChange={(e) => setFormData({ ...formData, jumlah: e.target.value })}
                                                placeholder="Contoh: 200000"
                                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none font-mono"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                                            <select
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none appearance-none cursor-pointer"
                                            >
                                                <option value="Aktif">Aktif</option>
                                                <option value="Non-Aktif">Non-Aktif</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-8 py-5 rounded-2xl text-sm font-black text-slate-500 hover:bg-slate-50 transition-all active:scale-95 border border-transparent hover:border-slate-200"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 px-8 py-5 bg-indigo-600 text-white rounded-2xl text-sm font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Menyimpan...' : 'Simpan Kategori'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal DELETE CONFIRMATION */}
            <AnimatePresence>
                {deleteConfirm.isOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 p-10 text-center"
                        >
                            <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                                <Trash2 className="w-10 h-10 text-rose-500" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Hapus Kategori?</h3>
                            <p className="text-sm font-medium text-slate-400 leading-relaxed mb-10 px-4">
                                Kategori ini akan dihapus permanen. Data reimbursement yang sudah ada tidak akan hilang.
                            </p>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setDeleteConfirm({ isOpen: false, id: null })}
                                    className="flex-1 px-6 py-5 rounded-2xl text-sm font-black text-slate-500 hover:bg-slate-50 transition-all active:scale-95 border border-slate-100"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isSubmitting}
                                    className="flex-1 px-6 py-5 bg-rose-500 text-white rounded-2xl text-sm font-black shadow-xl shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
