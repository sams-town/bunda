import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Edit, Trash2, ArrowUpDown, X } from 'lucide-react';
import { useToast } from './Toast';

export function FinanceStatusPajakPage() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const { addToast } = useToast();

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, id: string | number | null }>({ isOpen: false, id: null });
    const [formData, setFormData] = useState({
        name: '',
        ptkp: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/status-pajak`);
            const result = await response.json();
            if (result.success) {
                setData(result.data);
            } else {
                addToast({ title: 'Gagal', message: result.message || 'Gagal mengambil data', type: 'error' });
            }
        } catch (error) {
            console.error('Error fetching status pajak:', error);
            addToast({ title: 'Error', message: 'Terjadi kesalahan saat mengambil data', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const formatCurrency = (val: string | number) => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
    };

    const handleOpenModal = (item: any = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({ name: item.name, ptkp: item.ptkp });
        } else {
            setEditingItem(null);
            setFormData({ name: '', ptkp: '' });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const url = editingItem
            ? `${import.meta.env.VITE_API_MEANDPAY}/status-pajak/${editingItem.id}`
            : `${import.meta.env.VITE_API_MEANDPAY}/status-pajak`;
        const method = editingItem ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            if (result.success) {
                addToast({ title: 'Berhasil', message: `Data berhasil ${editingItem ? 'diperbarui' : 'ditambahkan'}`, type: 'success' });
                setIsModalOpen(false);
                fetchData();
            } else {
                addToast({ title: 'Gagal', message: result.message || 'Gagal menyimpan data', type: 'error' });
            }
        } catch (error) {
            addToast({ title: 'Error', message: 'Kesalahan server', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm.id) return;
        setIsSubmitting(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/status-pajak/${deleteConfirm.id}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            if (result.success) {
                addToast({ title: 'Berhasil', message: 'Data berhasil dihapus', type: 'success' });
                setDeleteConfirm({ isOpen: false, id: null });
                fetchData();
            } else {
                addToast({ title: 'Gagal', message: result.message || 'Gagal menghapus data', type: 'error' });
            }
        } catch (error) {
            addToast({ title: 'Error', message: 'Kesalahan server', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredData = data.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-[1400px] mx-auto pb-20"
        >
            <div className="bg-white rounded-t-2xl shadow-sm border border-slate-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">Status Pajak</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-5 py-2.5 bg-[#1e3a5f] text-white rounded-md font-bold hover:bg-[#152a45] transition-all flex items-center gap-2 text-sm"
                >
                    <Plus className="w-4 h-4" />
                    Tambah
                </button>
            </div>

            <div className="bg-white rounded-b-2xl shadow-sm border border-slate-100 p-8 pt-6">
                <div className="flex items-center gap-4 mb-8">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Search...."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-md px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto border-t border-slate-100 pt-4">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="py-4 px-4 text-xs font-bold text-slate-800 text-left w-20">No.</th>
                                <th className="py-4 px-4 text-xs font-bold text-slate-800 text-left">Nama Status</th>
                                <th className="py-4 px-4 text-xs font-bold text-slate-800 text-left">Nilai PTKP</th>
                                <th className="py-4 px-4 text-xs font-bold text-slate-800 text-left w-32">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center">
                                        <div className="w-8 h-8 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 animate-spin mx-auto"></div>
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center text-sm font-medium text-slate-400">Tidak ada data status pajak</td>
                                </tr>
                            ) : (
                                filteredData.map((row, index) => (
                                    <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 px-4 text-sm font-semibold text-slate-600">{index + 1}.</td>
                                        <td className="py-4 px-4 text-sm font-semibold text-slate-700">{row.name}</td>
                                        <td className="py-4 px-4 text-sm font-semibold text-slate-700">{formatCurrency(row.ptkp)}</td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleOpenModal(row)}
                                                    className="text-emerald-500 hover:text-emerald-700 transition-colors"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm({ isOpen: true, id: row.id })}
                                                    className="text-rose-500 hover:text-rose-700 transition-colors"
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
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100"
                        >
                            <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">
                                    {editingItem ? 'Edit Status Pajak' : 'Tambah Status Pajak'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-400 hover:text-rose-500">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nama Status</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Contoh: TK/0"
                                            className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nilai PTKP</label>
                                        <input
                                            required
                                            type="number"
                                            value={formData.ptkp}
                                            onChange={(e) => setFormData({ ...formData, ptkp: e.target.value })}
                                            placeholder="Contoh: 54000000"
                                            className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-6 py-4 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-extrabold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
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
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 p-8 text-center"
                        >
                            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Trash2 className="w-10 h-10 text-rose-500" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">Hapus Data?</h3>
                            <p className="text-sm font-medium text-slate-500 leading-relaxed mb-8">
                                Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin menghapus status pajak ini?
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm({ isOpen: false, id: null })}
                                    className="flex-1 px-6 py-4 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isSubmitting}
                                    className="flex-1 px-6 py-4 bg-rose-500 text-white rounded-2xl text-sm font-extrabold shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95 disabled:opacity-50"
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
