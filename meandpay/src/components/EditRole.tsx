import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Save, ShieldCheck, CheckSquare, Square, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from './Toast';
import Swal from 'sweetalert2';

interface EditRoleProps {
    roleId: string;
    onBack: () => void;
}

const permissionGroups = {
    "Absen": ["absen.create", "absen.delete", "absen.edit", "absen.view"],
    "Berita": ["berita.create", "berita.delete", "berita.edit", "berita.publish", "berita.view"],
    "Change-password": ["change-password.update"],
    "Dashboard": ["dashboard.view"],
    "Data-absen": ["data-absen.export", "data-absen.view"],
    "Data-cuti": ["data-cuti.approve", "data-cuti.create", "data-cuti.delete", "data-cuti.edit", "data-cuti.reject", "data-cuti.view"],
    "Data-dinas-luar": ["data-dinas-luar.export", "data-dinas-luar.view"],
    "Data-lembur": ["data-lembur.export", "data-lembur.view"],
    "Data-patroli": ["data-patroli.export", "data-patroli.view"],
    "Detail-target-kinerja": ["detail-target-kinerja.create", "detail-target-kinerja.delete", "detail-target-kinerja.edit", "detail-target-kinerja.view"],
    "Dinas-luar": ["dinas-luar.approve", "dinas-luar.create", "dinas-luar.delete", "dinas-luar.edit", "dinas-luar.view"],
    "Dokumen": ["dokumen.create", "dokumen.delete", "dokumen.download", "dokumen.edit", "dokumen.view"],
    "Exit": ["exit.create", "exit.delete", "exit.edit", "exit.export", "exit.view"],
    "Inventory": ["inventory.create", "inventory.delete", "inventory.edit", "inventory.export", "inventory.view"],
    "Jabatan": ["jabatan.create", "jabatan.delete", "jabatan.edit", "jabatan.view"],
    "Jenis-kinerja": ["jenis-kinerja.create", "jenis-kinerja.delete", "jenis-kinerja.edit", "jenis-kinerja.view"],
    "Kasbon": ["kasbon.approve", "kasbon.create", "kasbon.delete", "kasbon.edit", "kasbon.view"],
    "Kategori": ["kategori.create", "kategori.delete", "kategori.edit", "kategori.view"],
    "Kinerja-pegawai": ["kinerja-pegawai.create", "kinerja-pegawai.delete", "kinerja-pegawai.edit", "kinerja-pegawai.evaluate", "kinerja-pegawai.view"],
    "Kontrak": ["kontrak.create", "kontrak.delete", "kontrak.edit", "kontrak.export", "kontrak.view"],
    "Kunjungan": ["kunjungan.create", "kunjungan.delete", "kunjungan.edit", "kunjungan.export", "kunjungan.view"],
    "Laporan-kerja": ["laporan-kerja.approve", "laporan-kerja.create", "laporan-kerja.delete", "laporan-kerja.edit", "laporan-kerja.view"],
    "Laporan-kinerja": ["laporan-kinerja.create", "laporan-kinerja.delete", "laporan-kinerja.edit", "laporan-kinerja.view"],
    "Lembur": ["lembur.approve", "lembur.create", "lembur.delete", "lembur.edit", "lembur.view"],
    "List-pengajuan-keuangan": ["list-pengajuan-keuangan.approve", "list-pengajuan-keuangan.reject", "list-pengajuan-keuangan.view"],
    "Lokasi-kantor": ["lokasi-kantor.create", "lokasi-kantor.delete", "lokasi-kantor.edit", "lokasi-kantor.view"],
    "My-profile": ["my-profile.edit", "my-profile.view"],
    "Notifications": ["notifications.delete", "notifications.read", "notifications.view"],
    "Pajak": ["pajak.create", "pajak.delete", "pajak.edit", "pajak.view"],
    "Patroli": ["patroli.create", "patroli.delete", "patroli.edit", "patroli.view"],
    "Payroll": ["payroll.create", "payroll.delete", "payroll.edit", "payroll.export", "payroll.view"],
    "Pegawai": ["pegawai.create", "pegawai.delete", "pegawai.edit", "pegawai.export", "pegawai.view"],
    "Penugasan": ["penugasan.assign", "penugasan.create", "penugasan.delete", "penugasan.edit", "penugasan.view"],
    "Petunjuk": ["petunjuk.view"],
    "Rapat": ["rapat.attend", "rapat.create", "rapat.delete", "rapat.edit", "rapat.view"],
    "Reimbursement": ["reimbursement.approve", "reimbursement.create", "reimbursement.delete", "reimbursement.edit", "reimbursement.view"],
    "Rekap-data": ["rekap-data.export", "rekap-data.print", "rekap-data.view"],
    "Role": ["role.create", "role.delete", "role.edit", "role.view"],
    "Settings": ["settings.edit", "settings.update", "settings.view"],
    "Shift": ["shift.create", "shift.delete", "shift.edit", "shift.view"],
    "Status-pajak": ["status-pajak.create", "status-pajak.delete", "status-pajak.edit", "status-pajak.view"],
    "Switch": ["switch.user"],
    "Target-kinerja": ["target-kinerja.create", "target-kinerja.delete", "target-kinerja.edit", "target-kinerja.view"]
};

export function EditRole({ roleId, onBack }: EditRoleProps) {
    const [roleName, setRoleName] = useState('');
    const [guardName, setGuardName] = useState('web');
    const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const { addToast, updateToast } = useToast();

    useEffect(() => {
        const fetchRole = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/roles/${roleId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const json = await res.json();
                if (json.success && json.data) {
                    setRoleName(json.data.name);
                    setGuardName(json.data.guard_name);
                    if (json.data.permissions && Array.isArray(json.data.permissions)) {
                        const permNames = json.data.permissions.map((p: any) => p.name || p);
                        setSelectedPermissions(new Set(permNames));
                    }
                } else {
                    addToast({ type: 'error', title: 'Error', message: 'Gagal memuat role' });
                }
            } catch (err) {
                console.error(err);
                addToast({ type: 'error', title: 'Error', message: 'Terjadi kesalahan sistem' });
            } finally {
                setFetchLoading(false);
            }
        };
        fetchRole();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roleId]);

    const handleSubmit = async () => {
        if (!roleName.trim()) {
            addToast({ type: 'error', title: 'Validasi Gagal', message: 'Nama Role wajib diisi!' });
            return;
        }

        setLoading(true);
        const toastId = addToast({ type: 'loading', title: 'Menyimpan', message: 'Mohon tunggu sebentar...' });

        try {
            const payload = {
                name: roleName,
                guard_name: guardName,
                permissions: Array.from(selectedPermissions)
            };

            const response = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/roles/${roleId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json().catch(() => ({}));

            if (response.ok || (result && result.success)) {
                updateToast(toastId, { type: 'success', title: 'Berhasil', message: 'Role berhasil diperbarui!' });
                onBack();
            } else {
                updateToast(toastId, { type: 'error', title: 'Gagal', message: result.message || 'Gagal memperbarui role' });
            }
        } catch (error) {
            console.error('Error saving role:', error);
            updateToast(toastId, { type: 'error', title: 'Error', message: 'Terjadi kesalahan sistem' });
        } finally {
            setLoading(false);
        }
    };

    const togglePermission = (perm: string) => {
        const newSet = new Set(selectedPermissions);
        if (newSet.has(perm)) {
            newSet.delete(perm);
        } else {
            newSet.add(perm);
        }
        setSelectedPermissions(newSet);
    };

    const toggleGroup = (groupName: string, perms: string[]) => {
        const newSet = new Set(selectedPermissions);
        const allSelected = perms.every(p => newSet.has(p));

        if (allSelected) {
            perms.forEach(p => newSet.delete(p));
        } else {
            perms.forEach(p => newSet.add(p));
        }
        setSelectedPermissions(newSet);
    };

    if (fetchLoading) {
        return (
            <div className="max-w-7xl mx-auto py-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-sm font-bold text-slate-400">Memuat data role...</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-7xl mx-auto space-y-8 pb-20"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all active:scale-90 shadow-sm">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">Edit Role</h1>
                        <p className="text-slate-500 font-medium text-sm">Perbarui informasi dan hak akses role.</p>
                    </div>
                </div>

                <button onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black transition-all shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">
                    <Save className="w-5 h-5" />
                    {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/30">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <h2 className="text-lg font-black text-slate-900 tracking-tight">Info Role</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nama Role</label>
                                <input type="text" value={roleName} onChange={e => setRoleName(e.target.value)} placeholder="Mis. Admin" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Guard</label>
                                <input type="text" value={guardName} onChange={e => setGuardName(e.target.value)} placeholder="web" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/30">
                        <div className="mb-8">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Hak Akses Permission</h2>
                            <p className="text-slate-500 font-medium text-sm">Pilih pengaturan akses (permission) yang dapat digunakan oleh role ini.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {Object.entries(permissionGroups).map(([groupName, perms]) => {
                                const allSelected = perms.every(p => selectedPermissions.has(p));
                                const someSelected = perms.some(p => selectedPermissions.has(p));

                                return (
                                    <div key={groupName} className="p-5 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-slate-200 transition-colors">
                                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200 cursor-pointer group" onClick={() => toggleGroup(groupName, perms)}>
                                            <button className={cn("transition-colors", allSelected ? "text-indigo-600" : someSelected ? "text-indigo-400" : "text-slate-300 group-hover:text-slate-400")}>
                                                {allSelected ? <CheckSquare className="w-5 h-5" /> : someSelected ? <CheckSquare className="w-5 h-5 opacity-50" /> : <Square className="w-5 h-5" />}
                                            </button>
                                            <h3 className="font-bold text-slate-900 tracking-tight">{groupName}</h3>
                                        </div>
                                        <div className="space-y-3">
                                            {perms.map(perm => {
                                                const isSelected = selectedPermissions.has(perm);
                                                return (
                                                    <div key={perm} className="flex items-center gap-3 cursor-pointer group" onClick={() => togglePermission(perm)}>
                                                        <button className={cn("transition-colors", isSelected ? "text-indigo-600" : "text-slate-300 group-hover:text-slate-400")}>
                                                            {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                                        </button>
                                                        <span className={cn("text-sm font-medium transition-colors", isSelected ? "text-slate-900" : "text-slate-500 group-hover:text-slate-700")}>{perm}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
