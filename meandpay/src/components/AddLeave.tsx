import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Save, X, Calendar, User, FileText, ImageIcon, Loader2, Download } from 'lucide-react';
import { cn } from '../lib/utils';
import { Card, SectionTitle, FormInput, FormSelect, Field, Toast } from './common/FormUI';

interface AddLeaveProps {
    onBack: () => void;
}

export function AddLeave({ onBack }: AddLeaveProps) {
    const [form, setForm] = useState({ user_id: '', nama_cuti: '', tanggal_mulai: '', tanggal_akhir: '', alasan_cuti: '' });
    const [photo, setPhoto] = useState<{ preview: string | null; file: File | null }>({ preview: null, file: null });
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [templateUrl, setTemplateUrl] = useState<string | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const getFileUrl = (path: string | null) => {
        if (!path) return null;
        if (path.startsWith('http') || path.startsWith('blob:')) return path;
        let cleanPath = path.replace(/^\//, '');
        if (cleanPath.startsWith('uploads/')) cleanPath = cleanPath.slice(8);
        return `https://rsthb.id/apihris/uploads/${cleanPath}`;
    };

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_MEANDPAY}/users`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(r => r.json()).then(j => j.success && setEmployees(j.data.map((e: any) => ({ value: String(e.id), label: e.name || e.username, data: e })))).catch(() => { });

        fetch(`${import.meta.env.VITE_API_MEANDPAY}/settings/1`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
            .then(r => r.json())
            .then(j => {
                const item = Array.isArray(j.data) ? j.data[0] : j.data;
                if (item?.file_form_cuti) setTemplateUrl(getFileUrl(item.file_form_cuti));
            })
            .catch(() => { });
    }, []);

    const selectedEmp = employees.find(e => e.value === form.user_id)?.data;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.user_id || !form.nama_cuti || !form.tanggal_mulai || !form.tanggal_akhir || !form.alasan_cuti) return setToast({ type: 'error', message: 'Lengkapi form' });
        if (!selectedEmp?.lokasi_id) return setToast({ type: 'error', message: 'Karyawan tidak punya lokasi' });

        setLoading(true);
        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
            fd.append('lokasi_id', selectedEmp.lokasi_id);
            if (photo.file) fd.append('foto_cuti', photo.file);

            const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/cutis`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: fd
            });
            if ((await res.json()).success) { setToast({ type: 'success', message: 'Berhasil diajukan' }); setTimeout(onBack, 1500); }
            else throw new Error();
        } catch { setToast({ type: 'error', message: 'Gagal' }); } finally { setLoading(false); }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto pb-20 space-y-6">
            <div className="flex gap-4 items-center">
                <button onClick={onBack} className="p-2.5 bg-white border rounded-2xl shadow-sm"><ArrowLeft /></button>
                <div><h1 className="text-xl font-bold">Formulir Cuti</h1><p className="text-sm text-slate-400">Ajukan cuti atau izin pegawai</p></div>
            </div>

            <Card className="space-y-6">
                {templateUrl && (
                    <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-2xl mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-indigo-900 uppercase tracking-tight">Template Formulir Cuti</p>
                                <p className="text-[10px] font-bold text-indigo-400">Unduh & lengkapi sebelum mengunggah</p>
                            </div>
                        </div>
                        <a
                            href={templateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200 active:scale-95 transition-all"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Unduh File
                        </a>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <FormSelect label="Pegawai" options={employees} value={form.user_id} onChange={(n: any, v: any) => setForm({ ...form, user_id: v })} icon={User} placeholder="Pilih Pegawai" />
                        <FormSelect label="Jenis Cuti" options={['Cuti Tahunan', 'Cuti Melahirkan', 'Cuti Keluarga Meninggal', 'Cuti Menikah', 'Off Dengan Surat Dokter', 'Lain-Lain (Unpaid Leave)', 'Izin Datang Terlambat', 'Izin Pulang Cepat']} value={form.nama_cuti} onChange={(n: any, v: any) => setForm({ ...form, nama_cuti: v })} icon={FileText} placeholder="Pilih Cuti" />
                        <FormInput label="Mulai" type="date" icon={Calendar} value={form.tanggal_mulai} onChange={(n: any, v: any) => setForm({ ...form, tanggal_mulai: v })} />
                        <FormInput label="Sampai" type="date" icon={Calendar} value={form.tanggal_akhir} onChange={(n: any, v: any) => setForm({ ...form, tanggal_akhir: v })} />
                    </div>

                    <Field label="Unggah Foto">
                        <div className="flex items-center gap-6 p-4 border-2 border-dashed rounded-2xl bg-slate-50">
                            <div className="relative size-20 border bg-white rounded-xl flex items-center justify-center overflow-hidden">
                                {photo.preview ? <img src={photo.preview} className="size-full object-cover" /> : <ImageIcon className="text-slate-200" />}
                                <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setPhoto({ file: f, preview: r.result as string }); r.readAsDataURL(f); } }} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                            <p className="text-xs text-slate-400">Lampiran bukti (opsional)</p>
                        </div>
                    </Field>

                    <Field label="Alasan"><textarea rows={3} value={form.alasan_cuti} onChange={e => setForm({ ...form, alasan_cuti: e.target.value })} className="w-full p-4 bg-slate-50 border rounded-xl outline-none focus:border-indigo-400 transition-all" placeholder="Tulis alasan..." /></Field>

                    <div className="flex justify-end gap-3 pt-6 border-t font-bold">
                        <button type="button" onClick={onBack} className="px-6 py-3 text-slate-500">Batal</button>
                        <button type="submit" disabled={loading} className="px-8 py-3 bg-indigo-600 text-white rounded-xl shadow-lg flex items-center gap-2">
                            {loading ? <Loader2 className="animate-spin" /> : <Save />} Simpan
                        </button>
                    </div>
                </form>
            </Card>
            <AnimatePresence>{toast && <Toast {...toast} onClose={() => setToast(null)} />}</AnimatePresence>
        </motion.div>
    );
}
