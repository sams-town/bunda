import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Save, Calendar, User, Clock, FileText, Loader2, Download } from 'lucide-react';
import { useToast } from './Toast';

interface AddOvertimeProps {
    onBack: () => void;
}

export function AddOvertime({ onBack }: AddOvertimeProps) {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState<any[]>([]);
    const [templateUrl, setTemplateUrl] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        user_id: '',
        tanggal: new Date().toISOString().split('T')[0],
        jam_mulai: '17:00',
        jam_selesai: '20:00',
        alasan: ''
    });

    const getFileUrl = (path: string | null) => {
        if (!path) return null;
        if (path.startsWith('http') || path.startsWith('blob:')) return path;
        let cleanPath = path.replace(/^\//, '');
        if (cleanPath.startsWith('uploads/')) cleanPath = cleanPath.slice(8);
        const apiData = import.meta.env.VITE_API_MEANDPAY_DATA;
        const apiBase = import.meta.env.VITE_API_MEANDPAY;
        const base = (apiData || apiBase || 'https://rsthb.id/apihris').replace(/\/api$/, '').replace(/\/$/, '');
        return `${base}/uploads/${cleanPath}`;
    };

    useEffect(() => {
        fetchEmployees();
        fetchTemplate();
    }, []);

    const fetchTemplate = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/settings/1`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const json = await res.json();
            const item = Array.isArray(json.data) ? json.data[0] : json.data;
            if (item?.file_form_lembur) setTemplateUrl(getFileUrl(item.file_form_lembur));
        } catch (err) {
            console.error(err);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/users`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            if (data.success) setEmployees(data.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/lemburs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    ...formData,
                    // Map to existing API structure if needed
                    jam_masuk: `${formData.tanggal} ${formData.jam_mulai}`,
                    jam_pulang: `${formData.tanggal} ${formData.jam_selesai}`,
                    keterangan: formData.alasan
                })
            });
            const json = await res.json();
            if (json.success) {
                addToast({ type: 'success', message: 'Request lembur berhasil dikirim' });
                onBack();
            } else {
                addToast({ type: 'error', message: json.message || 'Gagal mengirim request' });
            }
        } catch {
            addToast({ type: 'error', message: 'Kesalahan sistem' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-8 pb-20"
        >
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-3 bg-white rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all">
                    <ArrowLeft className="w-5 h-5 text-slate-500" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Form Pengajuan Lembur</h1>
                    <p className="text-sm font-medium text-slate-500">Isi detail pengajuan lembur karyawan</p>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100 space-y-6">
                {templateUrl && (
                    <div className="flex items-center justify-between p-5 bg-amber-50 border border-amber-100 rounded-3xl mb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-600 shadow-sm border border-amber-50">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-amber-900 uppercase tracking-tight">Template Formulir Lembur</p>
                                <p className="text-[10px] font-bold text-amber-500">Unduh & tanda tangani sebelum dikirim</p>
                            </div>
                        </div>
                        <a 
                            href={templateUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-5 py-3 bg-amber-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-200 active:scale-95 transition-all"
                        >
                            <Download className="w-4 h-4" />
                            Unduh File
                        </a>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-slate-400 ml-1">Nama Pegawai</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <select 
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                                value={formData.user_id}
                                onChange={e => setFormData({...formData, user_id: e.target.value})}
                                required
                            >
                                <option value="">Pilih Pegawai</option>
                                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-slate-400 ml-1">Tanggal</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input 
                                    type="date" 
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                    value={formData.tanggal}
                                    onChange={e => setFormData({...formData, tanggal: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-slate-400 ml-1">Jam Mulai</label>
                            <div className="relative">
                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input 
                                    type="time" 
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                    value={formData.jam_mulai}
                                    onChange={e => setFormData({...formData, jam_mulai: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-slate-400 ml-1">Jam Selesai</label>
                            <div className="relative">
                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input 
                                    type="time" 
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                    value={formData.jam_selesai}
                                    onChange={e => setFormData({...formData, jam_selesai: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-slate-400 ml-1">Alasan Lembur</label>
                        <div className="relative">
                            <FileText className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                            <textarea 
                                rows={3}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none"
                                placeholder="Tulis alasan disini..."
                                value={formData.alasan}
                                onChange={e => setFormData({...formData, alasan: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                        <button type="button" onClick={onBack} className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">Batal</button>
                        <button type="submit" disabled={loading} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Simpan Pengajuan
                        </button>
                    </div>
                </form>
            </div>
        </motion.div>
    );
}
