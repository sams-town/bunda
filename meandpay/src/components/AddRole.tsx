import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Save, ShieldCheck, CheckSquare, Square } from 'lucide-react';
import { cn } from '../lib/utils';
import { Card, SectionTitle, FormInput } from './common/FormUI';
import Swal from 'sweetalert2';

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

export function AddRole({ onBack }: { onBack: () => void }) {
    const [form, setForm] = useState({ name: '', guard_name: 'web' });
    const [perms, setPerms] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!form.name.trim()) return Swal.fire({ icon: 'warning', title: 'Validasi Gagal', text: 'Nama Role wajib diisi!' });
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/roles`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ ...form, permissions: Array.from(perms) }),
            });
            const json = await res.json();
            if (json.success) { 
                Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Role baru berhasil ditambahkan!', timer: 2000, showConfirmButton: false });
                setTimeout(onBack, 1500); 
            } else {
                Swal.fire({ icon: 'error', title: 'Gagal', text: json.message || 'Gagal menambahkan role' });
            }
        } catch { 
            Swal.fire({ icon: 'error', title: 'Error', text: 'Terjadi kesalahan sistem' }); 
        } finally { 
            setLoading(false); 
        }
    };

    const toggleP = (p: string) => { const s = new Set(perms); if (s.has(p)) s.delete(p); else s.add(p); setPerms(s); };
    const toggleG = (ps: string[]) => { const s = new Set(perms); const all = ps.every(p => s.has(p)); ps.forEach(p => all ? s.delete(p) : s.add(p)); setPerms(s); };

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-7xl mx-auto space-y-8 pb-20">
            <div className="flex justify-between items-center">
                <div className="flex gap-4 items-center">
                    <button onClick={onBack} className="p-3 bg-white border rounded-2xl shadow-sm"><ArrowLeft/></button>
                    <div><h1 className="text-xl font-bold">Tambah Role</h1><p className="text-sm text-slate-400">Atur hak akses jabatan baru</p></div>
                </div>
                <button onClick={handleSubmit} disabled={loading} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg">{loading ? '...' : <Save />} Simpan</button>
            </div>

            <div className="grid grid-cols-4 gap-8">
                <Card className="col-span-1 h-fit space-y-4">
                    <SectionTitle icon={ShieldCheck} title="Info Role" />
                    <FormInput label="Nama Role" value={form.name} onChange={(n:any,v:any)=>setForm({...form,name:v})} />
                    <FormInput label="Guard" value={form.guard_name} onChange={(n:any,v:any)=>setForm({...form,guard_name:v})} />
                </Card>

                <Card className="col-span-3 space-y-6">
                    <SectionTitle icon={CheckSquare} title="Hak Akses" />
                    <div className="grid grid-cols-3 gap-4">
                        {Object.entries(permissionGroups).map(([group, ps]) => (
                            <div key={group} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                <button onClick={() => toggleG(ps)} className="flex items-center gap-2 mb-3 pb-2 border-b font-bold text-xs uppercase tracking-wider text-slate-600 w-full text-left">
                                    {ps.every(p => perms.has(p)) ? <CheckSquare className="size-4 text-indigo-600" /> : <Square className="size-4 text-slate-300" />} {group}
                                </button>
                                <div className="space-y-2">
                                    {ps.map(p => (
                                        <button key={p} onClick={() => toggleP(p)} className="flex items-center gap-2 text-[11px] text-slate-500 hover:text-slate-900 w-full text-left">
                                            {perms.has(p) ? <CheckSquare className="size-3.5 text-indigo-500" /> : <Square className="size-3.5 text-slate-200" />} {p.split('.')[1]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </motion.div>
    );
}
