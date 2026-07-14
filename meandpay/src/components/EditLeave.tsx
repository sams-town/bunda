import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Save, X, Calendar, User, FileText, ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from './Toast';

interface EditLeaveProps {
    onBack: () => void;
    leave: any;
}

interface Employee {
    id: string;
    name: string;
    username?: string;
    lokasi_id: string;
    izin_cuti_total: string;
    izin_cuti_terpakai: string;
    izin_cuti_sisa: string;
    izin_telat_total: string;
    izin_telat_terpakai: string;
    izin_telat_sisa: string;
    izin_pulang_cepat_total: string;
    izin_pulang_cepat_terpakai: string;
    izin_pulang_cepat_sisa: string;
    izin_lainnya_total: string;
    izin_lainnya_terpakai: string;
    izin_lainnya_sisa: string;
    cuti_melahirkan? : string;
    cuti_kematian?: string;
}

export function EditLeave({ onBack, leave }: EditLeaveProps) {
    const { addToast } = useToast();

    const initialStart = leave?.tanggal?.split(' - ')[0] || '';
    const initialEnd = leave?.tanggal?.split(' - ')[1] || initialStart;

    // State for form data
    const [formData, setFormData] = useState({
        user_id: leave.user_id?.toString() || leave.pemohon?.id?.toString() || '',
        nama_cuti: leave.nama_cuti || '',
        tanggal_mulai: initialStart,
        tanggal_akhir: initialEnd,
        alasan_cuti: leave.alasan_cuti || ''
    });

    // State for file upload
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(leave.foto_cuti || null);

    // State for options
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);

    // Derived selected employee
    const selectedEmp = employees.find(e => e.id.toString() === formData.user_id.toString());

    // UI states
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            setLoadingEmployees(true);
            const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/users`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            if (data.success && data.data) {
                let fetched = data.data;
                const existing = fetched.find((e: Employee) => e.id.toString() === formData.user_id.toString());
                if (!existing && leave.pemohon) {
                    fetched.unshift({
                        id: leave.pemohon.id,
                        name: leave.pemohon.name,
                        username: leave.pemohon.name,
                        lokasi_id: leave.lokasi_id || '',
                        izin_cuti_total: '-',
                        izin_cuti_terpakai: '-',
                        izin_cuti_sisa: '-',
                        izin_telat_total: '-',
                        izin_telat_terpakai: '-',
                        izin_telat_sisa: '-',
                        izin_pulang_cepat_total: '-',
                        izin_pulang_cepat_terpakai: '-',
                        izin_pulang_cepat_sisa: '-',
                        izin_lainnya_total: '-',
                        izin_lainnya_terpakai: '-',
                        izin_lainnya_sisa: '-'
                    });
                }
                setEmployees(fetched);
            }
        } catch (err) {
            console.error('Error fetching employees:', err);
        } finally {
            setLoadingEmployees(false);
        }
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setPhotoPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.user_id || !formData.nama_cuti || !formData.tanggal_mulai || !formData.tanggal_akhir || !formData.alasan_cuti) {
            addToast({ type: 'error', message: 'Semua field wajib diisi' });
            return;
        }

        if (!selectedEmp?.lokasi_id) {
            addToast({ type: 'error', message: 'Karyawan yang dipilih tidak memiliki lokasi/outlet' });
            return;
        }

        try {
            setLoading(true);

            console.log('--- DATA PERBARUAN CUTI ---');
            console.log('FormData User ID:', formData.user_id);
            console.log('Selected Emp Data:', selectedEmp);
            console.log('Leave Prop ID:', leave.user_id);

            const fd = new FormData();
            fd.append('user_id', formData.user_id);
            fd.append('lokasi_id', selectedEmp.lokasi_id);
            fd.append('nama_cuti', formData.nama_cuti);
            fd.append('tanggal_mulai', formData.tanggal_mulai);
            fd.append('tanggal_akhir', formData.tanggal_akhir);
            fd.append('alasan_cuti', formData.alasan_cuti);

            if (photoFile) {
                fd.append('foto_cuti', photoFile);
            }

            const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/cutis/${leave.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: fd
            });

            const json = await res.json();

            if (json.success) {
                addToast({ type: 'success', message: 'Data cuti berhasil diperbarui' });
                onBack();
            } else {
                addToast({ type: 'error', message: json.message || 'Gagal memperbarui data cuti' });
            }
        } catch (err) {
            addToast({ type: 'error', message: 'Terjadi kesalahan pada server' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-6xl mx-auto space-y-8 pb-20"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white text-slate-500 hover:text-indigo-600 shadow-sm border border-slate-200 transition-all hover:border-indigo-200 active:scale-95"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Edit Formulir Cuti</h1>
                        <p className="text-sm font-medium text-slate-500">Perbarui data pengajuan cuti dan izin</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/40 border border-slate-200 space-y-8">

                {/* Nama Pegawai & Nama Cuti */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-500 ml-1">Nama Pegawai</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <select
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                                value={formData.user_id}
                                onChange={e => setFormData({ ...formData, user_id: e.target.value })}
                            >
                                <option value="">{loadingEmployees ? 'Memuat...' : 'Pilih Pegawai'}</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id.toString()}>{emp.name || emp.username}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-500 ml-1">Nama Cuti</label>
                        <div className="relative">
                            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <select
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                                value={formData.nama_cuti}
                                onChange={e => setFormData({ ...formData, nama_cuti: e.target.value })}
                            >
                                <option value="">Pilih Cuti</option>
                                <option value="Cuti Tahunan">Cuti Tahunan {selectedEmp?.izin_cuti_sisa ? `(Sisa: ${selectedEmp.izin_cuti_sisa}/${selectedEmp.izin_cuti_total})` : ''}</option>
                                <option value="Cuti Melahirkan">Cuti Melahirkan {selectedEmp?.cuti_melahirkan_sisa ? `(Sisa: ${selectedEmp.cuti_melahirkan_sisa}/${selectedEmp.cuti_melahirkan_total})` : ''}</option>
                                <option value="Cuti Keluarga Meninggal">Cuti Keluarga Meninggal {selectedEmp?.cuti_kematian_sisa ? `(Sisa: ${selectedEmp.cuti_kematian_sisa}/${selectedEmp.cuti_kematian_total})` : ''}</option>
                                <option value="Cuti Menikah">Cuti Menikah {selectedEmp?.izin_lainnya_sisa ? `(Sisa: ${selectedEmp.izin_lainnya_sisa}/${selectedEmp.izin_lainnya_total})` : ''}</option>
                                <option value="Off Dengan Surat Dokter">Off Dengan Surat Dokter {selectedEmp?.izin_lainnya_sisa ? `(Sisa: ${selectedEmp.izin_lainnya_sisa}/${selectedEmp.izin_lainnya_total})` : ''}</option>
                                <option value="Lain-Lain (Unpaid Leave)">Lain-Lain (Unpaid Leave) {selectedEmp?.izin_lainnya_sisa ? `(Sisa: ${selectedEmp.izin_lainnya_sisa}/${selectedEmp.izin_lainnya_total})` : ''}</option>
                                <option value="Izin Datang Terlambat">Izin Datang Terlambat {selectedEmp?.izin_telat_sisa ? `(Sisa: ${selectedEmp.izin_telat_sisa}/${selectedEmp.izin_telat_total})` : ''}</option>
                                <option value="Izin Pulang Cepat">Izin Pulang Cepat {selectedEmp?.izin_pulang_cepat_sisa ? `(Sisa: ${selectedEmp.izin_pulang_cepat_sisa}/${selectedEmp.izin_pulang_cepat_total})` : ''}</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Tanggal Mulai & Akhir */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-500 ml-1">Tanggal Mulai</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="date"
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                value={formData.tanggal_mulai}
                                onChange={e => setFormData({ ...formData, tanggal_mulai: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-500 ml-1">Tanggal Akhir</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="date"
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                value={formData.tanggal_akhir}
                                onChange={e => setFormData({ ...formData, tanggal_akhir: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500 ml-1">Unggah Foto</label>
                    <div className="flex items-center gap-6 p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:bg-slate-100 hover:border-indigo-300 transition-all">
                        <div className="relative group shrink-0">
                            <div className="w-24 h-24 rounded-2xl border-2 border-slate-200 bg-white flex items-center justify-center overflow-hidden shadow-sm">
                                {photoPreview ? (
                                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon className="w-8 h-8 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                )}
                            </div>
                            <input type="file" accept="image/*" onChange={handlePhotoChange} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                            {photoPreview && (
                                <button
                                    type="button"
                                    onClick={() => { setPhotoPreview(null); setPhotoFile(null); }}
                                    className="absolute -top-2 -right-2 w-7 h-7 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-rose-600 transition-all z-10"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-700">{photoFile ? photoFile.name : 'Tidak ada file baru yang dipilih'}</p>
                            <p className="text-xs font-medium text-slate-400 mt-1">Upload foto baru untuk mengganti (Max. 5MB)</p>
                        </div>
                    </div>
                </div>

                {/* Alasan Cuti */}
                <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500 ml-1">Alasan Cuti</label>
                    <textarea
                        rows={4}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none"
                        placeholder="Tulis alasan pengajuan cuti disini..."
                        value={formData.alasan_cuti}
                        onChange={e => setFormData({ ...formData, alasan_cuti: e.target.value })}
                    />
                </div>

                {/* Submit Button */}
                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="px-6 py-3.5 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 transition-all"
                        disabled={loading}
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        className="px-8 py-3.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95 shadow-xl shadow-indigo-600/30"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Perbarui Pengajuan
                    </button>
                </div>

            </form>
        </motion.div>
    );
}
