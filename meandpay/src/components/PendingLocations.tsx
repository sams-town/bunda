import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { AnimatePresence } from 'motion/react';
import {
    MapPin,
    ChevronLeft,
    Loader2,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Trash2,
    Check,
    Edit2,
    CheckCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from './Toast';
import { EditLocation } from './EditLocation';

interface Location {
    id: string;
    nama_lokasi: string;
    lat_kantor: string;
    long_kantor: string;
    radius: string;
    keterangan: string;
    status: string;
    created_by: string;
    approved_by: string | null;
    created_at: string;
    updated_at: string;
    users_lokasis_created_byTousers: { id: string; name: string } | null;
    users_lokasis_approved_byTousers: { id: string; name: string } | null;
}

interface ApiResponse {
    success: boolean;
    message: string;
    data: Location[];
}

export function PendingLocations({ onBack }: { onBack: () => void }) {
    const { addToast, updateToast } = useToast();
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [approvingId, setApprovingId] = useState<string | null>(null);
    const [isApproving, setIsApproving] = useState(false);

    useEffect(() => {
        fetchPendingLocations();
    }, []);

    const fetchPendingLocations = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/lokasi/pending`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const json: ApiResponse = await res.json();
            if (json.success) {
                setLocations(json.data);
            } else {
                setError(json.message || 'Gagal mengambil data lokasi pending');
            }
        } catch (err) {
            setError('Tidak dapat terhubung ke server');
        } finally {
            setLoading(false);
        }
    };

    const executeDelete = async () => {
        if (!deletingId) return;
        setIsDeleting(true);
        const tid = addToast({ type: 'loading', title: 'Menghapus...', message: '' });
        try {
            const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/lokasi/${deletingId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const json = await res.json();
            if (json.success) {
                updateToast(tid, { type: 'success', title: 'Berhasil', message: 'Lokasi berhasil dihapus' });
                setLocations(locations.filter(l => l.id !== deletingId));
                setDeletingId(null);
            } else {
                updateToast(tid, { type: 'error', title: 'Gagal', message: json.message || 'Gagal menghapus lokasi' });
            }
        } catch {
            updateToast(tid, { type: 'error', title: 'Error Server', message: 'Terdapat masalah saat menghubungi server.' });
        } finally {
            setIsDeleting(false);
        }
    };

    const executeApprove = async () => {
        if (!approvingId) return;
        setIsApproving(true);
        const tid = addToast({ type: 'loading', title: 'Menyetujui...', message: '' });
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/lokasi/${approvingId}/approve`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ approved_by: user.id || '' })
            });
            const json = await res.json();
            if (json.success) {
                updateToast(tid, { type: 'success', title: 'Berhasil', message: 'Lokasi berhasil disetujui' });
                setLocations(locations.filter(l => l.id !== approvingId));
                setApprovingId(null);
            } else {
                updateToast(tid, { type: 'error', title: 'Gagal', message: json.message || 'Gagal menyetujui lokasi' });
            }
        } catch {
            updateToast(tid, { type: 'error', title: 'Error Server', message: 'Terdapat masalah saat menghubungi server.' });
        } finally {
            setIsApproving(false);
        }
    };

    if (editingId) {
        return <EditLocation locationId={editingId} onBack={() => { setEditingId(null); fetchPendingLocations(); }} />;
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-7xl mx-auto space-y-8 pb-20"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={onBack}
                            className="p-4 bg-white text-slate-500 rounded-2xl hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-xl shadow-slate-200/20 active:scale-95 border border-slate-100"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Pending Lokasi</h1>
                            <p className="text-slate-500 font-medium">Daftar lokasi yang menunggu konfirmasi/approval.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/30 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {loading ? 'Loading...' : `Menampilkan ${locations.length} Lokasi Pending`}
                        </p>
                    </div>

                    <div className="overflow-x-auto scrollbar-hide">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                                <p className="text-sm font-bold text-slate-400">Memuat data lokasi pending...</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center">
                                    <AlertCircle className="w-7 h-7 text-rose-500" />
                                </div>
                                <p className="text-sm font-bold text-slate-600">{error}</p>
                                <button
                                    onClick={fetchPendingLocations}
                                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all active:scale-95"
                                >
                                    Coba Lagi
                                </button>
                            </div>
                        ) : locations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center shadow-inner">
                                    <MapPin className="w-8 h-8 text-slate-400" />
                                </div>
                                <p className="text-sm font-bold text-slate-400">Tidak ada pengajuan lokasi pending.</p>
                            </div>
                        ) : (
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">No.</th>
                                        <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">Nama Lokasi</th>
                                        <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">Lat & Long</th>
                                        <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">Radius (m)</th>
                                        <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">Keterangan</th>
                                        <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">Status</th>
                                        <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">Diajukan Oleh</th>
                                        <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right border-b border-slate-100">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {locations.map((item, index) => (
                                        <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="py-6 px-8 text-sm font-black text-slate-300 group-hover:text-slate-900 transition-colors">{(index + 1).toString().padStart(2, '0')}</td>
                                            <td className="py-6 px-8">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                                                        <MapPin className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-sm font-black text-slate-900">{item.nama_lokasi}</span>
                                                </div>
                                            </td>
                                            <td className="py-6 px-8">
                                                <p className="text-sm font-bold text-slate-600">{item.lat_kantor}</p>
                                                <p className="text-[10px] font-medium text-slate-400 mt-0.5">{item.long_kantor}</p>
                                            </td>
                                            <td className="py-6 px-8 text-sm font-bold text-slate-600">{item.radius}</td>
                                            <td className="py-6 px-8 text-sm font-bold text-slate-600 truncate max-w-[150px]">{item.keterangan || '-'}</td>
                                            <td className="py-6 px-8">
                                                <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="py-6 px-8 text-sm font-bold text-slate-600">
                                                {item.users_lokasis_created_byTousers?.name || '-'}
                                            </td>
                                            <td className="py-6 px-8">
                                                <div className="flex items-center justify-end gap-2  transition-opacity">
                                                    <button onClick={() => setApprovingId(item.id)} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all active:scale-90" title="Approve">
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => setEditingId(item.id)} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-90" title="Edit">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => setDeletingId(item.id)} className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all active:scale-90" title="Delete">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </motion.div>

            <AnimatePresence>
                {deletingId && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100"
                        >
                            <div className="flex flex-col items-center text-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                                    <AlertCircle className="w-8 h-8 text-rose-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Hapus Lokasi?</h3>
                                    <p className="text-sm text-slate-500 mt-1">Data pengajuan lokasi tidak dapat dikembalikan lagi.</p>
                                </div>
                                <div className="flex gap-3 w-full mt-2">
                                    <button
                                        onClick={() => setDeletingId(null)}
                                        disabled={isDeleting}
                                        className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all disabled:opacity-50"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={executeDelete}
                                        disabled={isDeleting}
                                        className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ya, Hapus'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {approvingId && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100"
                        >
                            <div className="flex flex-col items-center text-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Setujui Lokasi?</h3>
                                    <p className="text-sm text-slate-500 mt-1">Lokasi pending akan disetujui dan ditambahkan.</p>
                                </div>
                                <div className="flex gap-3 w-full mt-2">
                                    <button
                                        onClick={() => setApprovingId(null)}
                                        disabled={isApproving}
                                        className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all disabled:opacity-50"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={executeApprove}
                                        disabled={isApproving}
                                        className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ya, Setujui'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
