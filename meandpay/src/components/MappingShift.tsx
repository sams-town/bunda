import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
    Search, Trash2, Clock, Calendar,
    ChevronDown, Loader2, Edit2, Check, X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from './Toast';
import Swal from 'sweetalert2';

/* ─── Types ─────────────────────────────────────────────── */
interface Shift {
    id: string;
    nama_shift: string;
    jam_masuk: string;
    jam_keluar: string;
}

interface MappingData {
    id: string;
    tanggal: string;
    shift_id: string;
    shifts?: {
        nama_shift: string;
        jam_masuk: string;
        jam_keluar: string;
    } | null;
}

interface Employee {
    id: string;
    name: string;
}

interface MappingShiftProps {
    employee: Employee;
    onBack: () => void;
}

/* ─── Main Component ─────────────────────────────────────── */
export function MappingShift({ employee, onBack }: MappingShiftProps) {
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [mapping, setMapping] = useState<MappingData[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [lockLocation, setLockLocation] = useState(true);
    const { addToast, updateToast } = useToast();

    // Form State
    const [selectedShiftId, setSelectedShiftId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [search, setSearch] = useState('');

    // Inline Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editShiftId, setEditShiftId] = useState('');
    const [editSaveLoading, setEditSaveLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, [employee.id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [shiftRes, mappingRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_MEANDPAY}/shifts`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                }),
                fetch(`${import.meta.env.VITE_API_MEANDPAY}/absensi?user_id=${employee.id}&limit=1000`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                }),
            ]);

            const shiftJson = await shiftRes.json();
            const mappingJson = await mappingRes.json();

            if (shiftJson.success) setShifts(shiftJson.data);
            if (mappingJson.success) {
                const userMappings = mappingJson.data.filter((m: any) => m.user_id === employee.id);
                setMapping(userMappings);
            }
        } catch (err) {
            console.error('Error fetching mapping data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedShiftId || !startDate || !endDate) {
            Swal.fire({ icon: 'warning', title: 'Lengkapi data!', text: 'Silakan isi semua field yang wajib.' });
            return;
        }

        setSubmitLoading(true);
        const toastId = addToast({
            type: 'loading',
            title: 'Menyimpan Mapping',
            message: 'Sedang memproses data mapping shift...'
        });

        try {
            const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/mapping-shifts/bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    user_id: employee.id,
                    shift_id: selectedShiftId,
                    start_date: startDate,
                    end_date: endDate,
                    lock_location: lockLocation ? 1 : 0
                })
            });
            const json = await res.json();
            if (json.success) {
                updateToast(toastId, {
                    type: 'success',
                    title: 'Berhasil',
                    message: 'Mapping shift berhasil disimpan!'
                });
                fetchData();
                setSelectedShiftId('');
                setStartDate('');
                setEndDate('');
            } else {
                updateToast(toastId, {
                    type: 'error',
                    title: 'Gagal',
                    message: json.message || 'Gagal menyimpan mapping'
                });
            }
        } catch (err: any) {
            updateToast(toastId, {
                type: 'error',
                title: 'Error',
                message: err.message || 'Terjadi kesalahan sistem'
            });
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: 'Hapus mapping ini?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        });
        if (!result.isConfirmed) return;

        const toastId = addToast({
            type: 'loading',
            title: 'Menghapus',
            message: 'Sedang menghapus data...'
        });

        try {
            const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/absensi/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const json = await res.json();
            if (json.success) {
                updateToast(toastId, { type: 'success', title: 'Berhasil', message: 'Data berhasil dihapus' });
                setMapping(prev => prev.filter(m => m.id !== id));
            } else {
                updateToast(toastId, { type: 'error', title: 'Gagal', message: json.message || 'Gagal menghapus data' });
            }
        } catch (err: any) {
            updateToast(toastId, { type: 'error', title: 'Error', message: err.message || 'Terjadi kesalahan sistem' });
        }
    };

    // ── Inline Edit ───────────────────────────────────────
    const startEdit = (row: MappingData) => {
        setEditingId(row.id);
        setEditShiftId(row.shift_id);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditShiftId('');
    };

    const handleEditSave = async (id: string) => {
        if (!editShiftId) {
            Swal.fire({ icon: 'warning', title: 'Pilih shift!', text: 'Pilih shift terlebih dahulu sebelum menyimpan.' });
            return;
        }

        setEditSaveLoading(true);
        const toastId = addToast({ type: 'loading', title: 'Menyimpan', message: 'Sedang mengupdate data...' });

        try {
            const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/absensi/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ shift_id: editShiftId })
            });
            const json = await res.json();
            if (json.success) {
                updateToast(toastId, { type: 'success', title: 'Berhasil', message: 'Data berhasil diupdate' });
                const updatedShift = shifts.find(s => s.id === editShiftId);
                setMapping(prev => prev.map(m =>
                    m.id === id
                        ? {
                            ...m,
                            shift_id: editShiftId,
                            shifts: updatedShift
                                ? { nama_shift: updatedShift.nama_shift, jam_masuk: updatedShift.jam_masuk, jam_keluar: updatedShift.jam_keluar }
                                : m.shifts
                        }
                        : m
                ));
                setEditingId(null);
                setEditShiftId('');
            } else {
                updateToast(toastId, { type: 'error', title: 'Gagal', message: json.message || 'Gagal mengupdate data' });
            }
        } catch (err: any) {
            updateToast(toastId, { type: 'error', title: 'Error', message: err.message || 'Terjadi kesalahan sistem' });
        } finally {
            setEditSaveLoading(false);
        }
    };

    const filteredMapping = mapping.filter(m =>
        m.tanggal.toLowerCase().includes(search.toLowerCase()) ||
        (m.shifts?.nama_shift || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto space-y-6 pb-20"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">Mapping Shift</h1>
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#F43F5E] hover:bg-rose-600 text-white rounded-xl text-xs font-black tracking-widest uppercase transition-all shadow-lg shadow-rose-500/20 active:scale-95"
                >
                    Back
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Panel: Form */}
                <div className="w-full lg:w-96 shrink-0">
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40 p-10 space-y-8 h-fit">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Shift Select */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Shift</label>
                                <div className="relative group">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-500 transition-colors">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <select
                                        value={selectedShiftId}
                                        onChange={(e) => setSelectedShiftId(e.target.value)}
                                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer appearance-none"
                                        required
                                    >
                                        <option value="">Pilih Shift</option>
                                        {shifts.map(s => (
                                            <option key={s.id} value={s.id}>{s.nama_shift} ({s.jam_masuk} - {s.jam_keluar})</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <ChevronDown className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>

                            {/* Start Date */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal Mulai</label>
                                <div className="relative">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-mono"
                                        required
                                    />
                                </div>
                            </div>

                            {/* End Date */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal Akhir</label>
                                <div className="relative">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-mono"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Lock Location */}
                            <div className="flex items-center gap-3 px-1">
                                <input
                                    type="checkbox"
                                    id="lockLocation"
                                    checked={lockLocation}
                                    onChange={(e) => setLockLocation(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label htmlFor="lockLocation" className="text-xs font-bold text-slate-500 tracking-tight cursor-pointer">
                                    Lock Location
                                </label>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={submitLoading}
                                    className="w-full py-4 bg-[#1E3A5F] hover:bg-[#152a45] text-white rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all shadow-lg shadow-indigo-500/10 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Panel: Table */}
                <div className="flex-1 min-w-0">
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col h-[700px]">
                        <div className="px-10 py-8 border-b border-slate-50">
                            <h2 className="text-3xl font-black text-slate-800 text-center tracking-tight uppercase">{employee.name}</h2>
                        </div>

                        <div className="px-10 py-6">
                            <div className="flex items-center gap-4 bg-slate-100/50 rounded-2xl px-5 py-3 w-fit border border-slate-100 shadow-inner">
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Tanggal"
                                    className="bg-transparent text-sm font-bold text-slate-500 outline-none w-32 placeholder:text-slate-300"
                                />
                                <Search className="w-5 h-5 text-slate-900 stroke-[3]" />
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto custom-scrollbar px-10">
                            <table className="w-full border-collapse">
                                <thead className="sticky top-0 bg-white z-10 border-b border-slate-100">
                                    <tr>
                                        <th className="py-5 text-[11px] font-black text-slate-900 uppercase tracking-widest text-left w-12 border-r border-slate-100">No.</th>
                                        <th className="py-5 px-6 text-[11px] font-black text-slate-900 uppercase tracking-widest text-left border-r border-slate-100">Tanggal</th>
                                        <th className="py-5 px-6 text-[11px] font-black text-slate-900 uppercase tracking-widest text-left border-r border-slate-100">Shift Pegawai</th>
                                        <th className="py-5 px-6 text-[11px] font-black text-slate-900 uppercase tracking-widest text-left border-r border-slate-100">Jam Masuk</th>
                                        <th className="py-5 px-6 text-[11px] font-black text-slate-900 uppercase tracking-widest text-left border-r border-slate-100">Jam Keluar</th>
                                        <th className="py-5 px-6 text-[11px] font-black text-slate-900 uppercase tracking-widest text-left">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 border-b border-slate-900/50">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="py-20">
                                                <div className="flex flex-col items-center justify-center gap-4">
                                                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                                                    <p className="text-sm font-bold text-slate-400 tracking-widest uppercase">Memuat data...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredMapping.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-32 text-center text-sm font-bold text-slate-300 tracking-widest">
                                                No data available in table
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredMapping.map((row, idx) => {
                                            const isEditing = editingId === row.id;
                                            const editedShift = shifts.find(s => s.id === editShiftId);

                                            return (
                                                <tr
                                                    key={row.id}
                                                    className={cn(
                                                        "group transition-colors border-l border-r border-slate-100",
                                                        isEditing ? "bg-indigo-50/60" : "hover:bg-slate-50/50"
                                                    )}
                                                >
                                                    <td className="py-4 text-xs font-bold text-slate-900 border-r border-slate-100">{idx + 1}.</td>
                                                    <td className="py-4 px-6 text-xs font-bold text-slate-900 border-r border-slate-100">
                                                        {new Date(row.tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                                                    </td>

                                                    {/* Shift Cell */}
                                                    <td className="py-4 px-6 border-r border-slate-100">
                                                        {isEditing ? (
                                                            <select
                                                                value={editShiftId}
                                                                onChange={e => setEditShiftId(e.target.value)}
                                                                className="w-full px-3 py-1.5 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                                                            >
                                                                <option value="">Pilih Shift</option>
                                                                {shifts.map(s => (
                                                                    <option key={s.id} value={s.id}>{s.nama_shift}</option>
                                                                ))}
                                                            </select>
                                                        ) : (
                                                            <span className="text-xs font-bold text-slate-900">{row.shifts?.nama_shift || '-'}</span>
                                                        )}
                                                    </td>

                                                    {/* Jam Masuk */}
                                                    <td className="py-4 px-6 border-r border-slate-100">
                                                        <span className={cn("text-xs font-bold underline", isEditing ? "text-indigo-400" : "text-emerald-500")}>
                                                            {isEditing ? (editedShift?.jam_masuk ?? row.shifts?.jam_masuk ?? '-') : (row.shifts?.jam_masuk || '-')}
                                                        </span>
                                                    </td>

                                                    {/* Jam Keluar */}
                                                    <td className="py-4 px-6 border-r border-slate-100">
                                                        <span className={cn("text-xs font-bold underline", isEditing ? "text-indigo-400" : "text-rose-500")}>
                                                            {isEditing ? (editedShift?.jam_keluar ?? row.shifts?.jam_keluar ?? '-') : (row.shifts?.jam_keluar || '-')}
                                                        </span>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="py-4 px-6">
                                                        {isEditing ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <button
                                                                    onClick={() => handleEditSave(row.id)}
                                                                    disabled={editSaveLoading}
                                                                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-emerald-600 transition-all"
                                                                    title="Simpan"
                                                                >
                                                                    {editSaveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                                </button>
                                                                <button
                                                                    onClick={cancelEdit}
                                                                    className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-500 transition-all"
                                                                    title="Batal"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5  transition-all">
                                                                <button
                                                                    onClick={() => startEdit(row)}
                                                                    className="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-500 transition-all"
                                                                    title="Edit"
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(row.id)}
                                                                    className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 transition-all"
                                                                    title="Hapus"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}