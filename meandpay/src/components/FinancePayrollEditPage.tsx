import React, { useState, useEffect } from 'react';
import {
    X, Save, User, Calendar, Percent, Briefcase, Hash, DollarSign,
    Utensils, Truck, HeartPulse, Shield, FileText, MinusCircle, PlusCircle,
    Clock, AlertTriangle, Gift, Star, Zap, CreditCard, ChevronRight, ArrowLeft
} from 'lucide-react';
import { useToast } from './Toast';
import { cn } from '../lib/utils';

interface FinancePayrollEditPageProps {
    id: string;
    onBack: () => void;
    onSaveSuccess: () => void;
}

export function FinancePayrollEditPage({ id, onBack, onSaveSuccess }: FinancePayrollEditPageProps) {
    const [formData, setFormData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_MEANDPAY}/payrolls/${id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
            .then(res => res.json())
            .then(j => {
                if (j.success) setFormData(j.data);
                setLoading(false);
            })
            .catch(() => {
                addToast({ title: 'Error', message: 'Gagal mengambil data payroll', type: 'error' });
                setLoading(false);
            });

        // DEFINITIVE ENTER BLOCKER: Block Enter from any input to prevent accidental submission/close
        const handleGlobalEnter = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
                e.preventDefault();
                e.stopPropagation();
            }
        };
        window.addEventListener('keydown', handleGlobalEnter, true);
        return () => window.removeEventListener('keydown', handleGlobalEnter, true);
    }, [id]);

    const handleSave = async (e?: React.FormEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        setSaving(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/payrolls/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });
            const j = await res.json();
            if (j.success) {
                addToast({ title: 'Berhasil', message: 'Data payroll telah diperbarui', type: 'success' });
                onSaveSuccess();
                onBack();
            } else {
                addToast({ title: 'Error', message: j.message || 'Gagal memperbarui data', type: 'error' });
            }
        } catch {
            addToast({ title: 'Error', message: 'Terjadi kesalahan sistem', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => {
            const newData = { ...prev, [field]: value };

            // Auto-calculate totals if numeric fields change
            const addFields = [
                'gaji_pokok', 'total_reimbursement', 'total_tunjangan_transport',
                'total_tunjangan_makan', 'total_tunjangan_bpjs_kesehatan',
                'total_tunjangan_bpjs_ketenagakerjaan', 'total_lembur',
                'total_kehadiran', 'bonus_pribadi', 'bonus_team', 'bonus_jackpot', 'total_thr'
            ];
            const subFields = [
                'total_potongan_bpjs_kesehatan', 'total_potongan_bpjs_ketenagakerjaan',
                'total_terlambat', 'total_mangkir', 'total_izin', 'bayar_kasbon', 'loss'
            ];

            // Sync total fields if quantity/unit-price changes
            if (field === 'jumlah_tunjangan_makan' || field === 'uang_tunjangan_makan') {
                newData.total_tunjangan_makan = (parseFloat(newData.jumlah_tunjangan_makan) || 0) * (parseFloat(newData.uang_tunjangan_makan) || 0);
            }
            if (field === 'jumlah_tunjangan_transport' || field === 'uang_tunjangan_transport') {
                newData.total_tunjangan_transport = (parseFloat(newData.jumlah_tunjangan_transport) || 0) * (parseFloat(newData.uang_tunjangan_transport) || 0);
            }
            if (field === 'jumlah_lembur' || field === 'uang_lembur') {
                newData.total_lembur = (parseFloat(newData.jumlah_lembur) || 0) * (parseFloat(newData.uang_lembur) || 0);
            }
            if (field === 'jumlah_kehadiran' || field === 'uang_kehadiran') {
                newData.total_kehadiran = (parseFloat(newData.jumlah_kehadiran) || 0) * (parseFloat(newData.uang_kehadiran) || 0);
            }
            if (field === 'jumlah_mangkir' || field === 'uang_mangkir') {
                newData.total_mangkir = (parseFloat(newData.jumlah_mangkir) || 0) * (parseFloat(newData.uang_mangkir) || 0);
            }
            if (field === 'jumlah_terlambat' || field === 'uang_terlambat') {
                newData.total_terlambat = (parseFloat(newData.jumlah_terlambat) || 0) * (parseFloat(newData.uang_terlambat) || 0);
            }
            if (field === 'jumlah_izin' || field === 'uang_izin') {
                newData.total_izin = (parseFloat(newData.jumlah_izin) || 0) * (parseFloat(newData.uang_izin) || 0);
            }

            // Always recalculate totals
            let sumAdd = 0;
            addFields.forEach(f => sumAdd += parseFloat(newData[f]) || 0);

            let sumSub = 0;
            subFields.forEach(f => sumSub += parseFloat(newData[f]) || 0);

            newData.total_penjumlahan = sumAdd;
            newData.total_pengurangan = sumSub;
            newData.grand_total = sumAdd - sumSub;

            return newData;
        });
    };

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!formData) return null;

    const InputLabel = ({ children }: { children: React.ReactNode }) => (
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
            {children}
        </label>
    );

    const Field = ({ label, children, className }: { label: string, children: React.ReactNode, className?: string }) => (
        <div className={cn("space-y-1", className)}>
            <InputLabel>{label}</InputLabel>
            {children}
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
            <style>{`
                input::-webkit-outer-spin-button,
                input::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                input[type=number] {
                    -moz-appearance: textfield;
                }
            `}</style>
            {/* Form Wrapper to prevent default submission on Enter */}
            <div className="flex-1 flex flex-col min-h-0">
                {/* Professional Top Bar */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-50">
                    <div className="flex items-center gap-6">
                        <button
                            type="button"
                            onClick={onBack}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="h-8 w-px bg-slate-200" />
                        <div>
                            <h1 className="text-lg font-bold tracking-tight">Edit Detail Payroll</h1>
                            <p className="text-xs text-slate-500 font-medium">System / Payroll / {formData.employee?.name || formData.user?.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onBack}
                            className="px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSave()}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-sm font-bold rounded-lg transition-all shadow-sm shadow-indigo-200 active:translate-y-px"
                        >
                            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                            {!saving && <ChevronRight className="w-4 h-4 ml-1" />}
                        </button>
                    </div>
                </header>

                {/* Main Content Grid */}
                <main className="flex-1 overflow-y-auto p-10">
                    <div className="max-w-[1400px] mx-auto grid grid-cols-12 gap-8">

                        {/* Left Column: Profile Card & General Info */}
                        <div className="col-span-12 lg:col-span-3 space-y-6">
                            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="h-20 bg-gradient-to-r from-slate-800 to-indigo-950" />
                                <div className="px-6 pb-6 -mt-10 text-center">
                                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-lg mb-3 border border-slate-100 uppercase text-2xl font-black text-indigo-600">
                                        {(formData.employee?.name || formData.user?.name || '').substring(0, 2)}
                                    </div>
                                    <h2 className="text-lg font-bold truncate">{formData.employee?.name || formData.user?.name}</h2>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-tight mb-4">
                                        {formData.employee?.jabatan?.nama_jabatan || formData.user?.jabatan?.nama_jabatan || 'Employee'}
                                    </p>
                                    <div className="h-px bg-slate-100 w-full mb-4" />
                                    <div className="space-y-3 text-left">
                                        <Field label="No Gaji">
                                            <input
                                                value={formData.no_gaji}
                                                onChange={e => handleChange('no_gaji', e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                                            />
                                        </Field>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Field label="Bulan">
                                                <input
                                                    value={formData.bulan}
                                                    onChange={e => handleChange('bulan', e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                                                />
                                            </Field>
                                            <Field label="Tahun">
                                                <input
                                                    value={formData.tahun}
                                                    onChange={e => handleChange('tahun', e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                                                />
                                            </Field>
                                        </div>
                                        <Field label="Kehadiran (%)">
                                            <input
                                                value={formData.persentase_kehadiran}
                                                onChange={e => handleChange('persentase_kehadiran', e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                                            />
                                        </Field>
                                    </div>
                                </div>
                            </section>

                            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">Periode Kerja</h3>
                                <Field label="Tgl Mulai">
                                    <input
                                        type="date"
                                        value={formData.tanggal_mulai?.substring(0, 10)}
                                        onChange={e => handleChange('tanggal_mulai', e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                                    />
                                </Field>
                                <Field label="Tgl Akhir">
                                    <input
                                        type="date"
                                        value={formData.tanggal_akhir?.substring(0, 10)}
                                        onChange={e => handleChange('tanggal_akhir', e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                                    />
                                </Field>
                            </section>
                        </div>

                        {/* Middle Column: Detailed Earnings */}
                        <div className="col-span-12 lg:col-span-5 space-y-6">
                            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
                                <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                                        <PlusCircle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Rincian Penghasilan</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Semua penambahan gaji bulan ini</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <Field label="Gaji Pokok Utama">
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</span>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={formData.gaji_pokok || 0}
                                                onChange={e => {
                                                    const val = e.target.value.replace(/[^0-9.]/g, '');
                                                    handleChange('gaji_pokok', val);
                                                }}
                                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                    </Field>

                                    <div className="grid grid-cols-2 gap-6">
                                        <Field label="Tunjangan Makan">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={formData.jumlah_tunjangan_makan || 0}
                                                        onChange={e => handleChange('jumlah_tunjangan_makan', e.target.value.replace(/[^0-9.]/g, ''))}
                                                        className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                                                    />
                                                    <span className="text-[10px] text-slate-400 font-black uppercase">Kali</span>
                                                </div>
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={formData.uang_tunjangan_makan || 0}
                                                    onChange={e => handleChange('uang_tunjangan_makan', e.target.value.replace(/[^0-9.]/g, ''))}
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                                                />
                                                <p className="text-[10px] font-bold text-slate-400 italic">Total: Rp {new Intl.NumberFormat('id-ID').format(formData.total_tunjangan_makan || 0)}</p>
                                            </div>
                                        </Field>
                                        <Field label="Tunjangan Transport">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={formData.jumlah_tunjangan_transport || 0}
                                                        onChange={e => handleChange('jumlah_tunjangan_transport', e.target.value.replace(/[^0-9.]/g, ''))}
                                                        className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                                                    />
                                                    <span className="text-[10px] text-slate-400 font-black uppercase">Kali</span>
                                                </div>
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={formData.uang_tunjangan_transport || 0}
                                                    onChange={e => handleChange('uang_tunjangan_transport', e.target.value.replace(/[^0-9.]/g, ''))}
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                                                />
                                                <p className="text-[10px] font-bold text-slate-400 italic">Total: Rp {new Intl.NumberFormat('id-ID').format(formData.total_tunjangan_transport || 0)}</p>
                                            </div>
                                        </Field>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <Field label="BPJS Kesehatan (Tunjangan)">
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={formData.total_tunjangan_bpjs_kesehatan || 0}
                                                onChange={e => handleChange('total_tunjangan_bpjs_kesehatan', e.target.value.replace(/[^0-9.]/g, ''))}
                                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                                            />
                                        </Field>
                                        <Field label="BPJS Ketenagakerjaan (Tun)">
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={formData.total_tunjangan_bpjs_ketenagakerjaan || 0}
                                                onChange={e => handleChange('total_tunjangan_bpjs_ketenagakerjaan', e.target.value.replace(/[^0-9.]/g, ''))}
                                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                                            />
                                        </Field>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100 italic">
                                        <Field label="Lembur (Jam & Nominal)" className="col-span-1">
                                            <div className="flex flex-col gap-2">
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={formData.jumlah_lembur || 0}
                                                    onChange={e => handleChange('jumlah_lembur', e.target.value.replace(/[^0-9.]/g, ''))}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                                                    placeholder="Jam"
                                                />
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={formData.uang_lembur || 0}
                                                    onChange={e => handleChange('uang_lembur', e.target.value.replace(/[^0-9.]/g, ''))}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                                                    placeholder="Uang /jam"
                                                />
                                            </div>
                                        </Field>
                                        <Field label="Bonus 100% Kehadiran" className="col-span-1">
                                            <div className="flex flex-col gap-2">
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={formData.jumlah_kehadiran || 0}
                                                    onChange={e => handleChange('jumlah_kehadiran', e.target.value.replace(/[^0-9.]/g, ''))}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                                                    placeholder="Kali"
                                                />
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={formData.uang_kehadiran || 0}
                                                    onChange={e => handleChange('uang_kehadiran', e.target.value.replace(/[^0-9.]/g, ''))}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                                                    placeholder="Uang Bonus"
                                                />
                                            </div>
                                        </Field>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-slate-100">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Star className="w-3 h-3 text-amber-500" />
                                            Bonus & Lainnya
                                        </h4>
                                        <div className="grid grid-cols-3 gap-4">
                                            <Field label="Pribadi">
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={formData.bonus_pribadi || 0}
                                                    onChange={e => handleChange('bonus_pribadi', e.target.value.replace(/[^0-9.]/g, ''))}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                                                />
                                            </Field>
                                            <Field label="Team">
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={formData.bonus_team || 0}
                                                    onChange={e => handleChange('bonus_team', e.target.value.replace(/[^0-9.]/g, ''))}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                                                />
                                            </Field>
                                            <Field label="Jackpot">
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={formData.bonus_jackpot || 0}
                                                    onChange={e => handleChange('bonus_jackpot', e.target.value.replace(/[^0-9.]/g, ''))}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                                                />
                                            </Field>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Field label="Total Reimbursement">
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={formData.total_reimbursement || 0}
                                                    onChange={e => handleChange('total_reimbursement', e.target.value.replace(/[^0-9.]/g, ''))}
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                                                />
                                            </Field>
                                            <Field label="Total THR">
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={formData.total_thr || 0}
                                                    onChange={e => handleChange('total_thr', e.target.value.replace(/[^0-9.]/g, ''))}
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                                                />
                                            </Field>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Right Column: Deductions & Calculations */}
                        <div className="col-span-12 lg:col-span-4 space-y-6">
                            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
                                <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                                    <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
                                        <MinusCircle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Potongan (-)</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Semua pengurangan gaji bulan ini</p>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <Field label="BPJS Kes (Potongan)">
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={formData.total_potongan_bpjs_kesehatan || 0}
                                                onChange={e => handleChange('total_potongan_bpjs_kesehatan', e.target.value.replace(/[^0-9.]/g, ''))}
                                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                                            />
                                        </Field>
                                        <Field label="BPJS Ket (Potongan)">
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={formData.total_potongan_bpjs_ketenagakerjaan || 0}
                                                onChange={e => handleChange('total_potongan_bpjs_ketenagakerjaan', e.target.value.replace(/[^0-9.]/g, ''))}
                                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                                            />
                                        </Field>
                                    </div>

                                    <div className="space-y-4 bg-rose-50/30 p-4 rounded-xl border border-rose-100">
                                        <Field label="Absensi: Mangkir & Izin">
                                            <div className="grid grid-cols-2 gap-3 mb-3">
                                                <div className="space-y-1">
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={formData.jumlah_mangkir || 0}
                                                        onChange={e => handleChange('jumlah_mangkir', e.target.value.replace(/[^0-9.]/g, ''))}
                                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                                                        placeholder="Hari"
                                                    />
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={formData.uang_mangkir || 0}
                                                        onChange={e => handleChange('uang_mangkir', e.target.value.replace(/[^0-9.]/g, ''))}
                                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                                                        placeholder="Rp /hari"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={formData.jumlah_izin || 0}
                                                        onChange={e => handleChange('jumlah_izin', e.target.value.replace(/[^0-9.]/g, ''))}
                                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                                                        placeholder="Hari"
                                                    />
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={formData.uang_izin || 0}
                                                        onChange={e => handleChange('uang_izin', e.target.value.replace(/[^0-9.]/g, ''))}
                                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                                                        placeholder="Rp /hari"
                                                    />
                                                </div>
                                            </div>
                                        </Field>
                                        <Field label="Terlambat (Menit & Nominal)">
                                            <div className="flex gap-3">
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={formData.jumlah_terlambat || 0}
                                                    onChange={e => handleChange('jumlah_terlambat', e.target.value.replace(/[^0-9.]/g, ''))}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                                                    placeholder="Menit"
                                                />
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={formData.uang_terlambat || 0}
                                                    onChange={e => handleChange('uang_terlambat', e.target.value.replace(/[^0-9.]/g, ''))}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                                                    placeholder="Rp /menit"
                                                />
                                            </div>
                                        </Field>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <Field label="Bayar Kasbon">
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={formData.bayar_kasbon || 0}
                                                onChange={e => handleChange('bayar_kasbon', e.target.value.replace(/[^0-9.]/g, ''))}
                                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                                            />
                                        </Field>
                                        <Field label="Loss / Lainnya">
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={formData.loss || 0}
                                                onChange={e => handleChange('loss', e.target.value.replace(/[^0-9.]/g, ''))}
                                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                                            />
                                        </Field>
                                    </div>
                                </div>
                            </section>

                            <section className="bg-slate-900 rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-indigo-500/20 transition-all duration-700" />

                                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Ringkasan Perhitungan
                                </h3>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-slate-400">
                                        <span className="text-[10px] font-black uppercase">Total Penjumlahan</span>
                                        <span className="text-sm font-bold text-emerald-400">+{new Intl.NumberFormat('id-ID').format(formData.total_penjumlahan || 0)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-400">
                                        <span className="text-[10px] font-black uppercase">Total Pengurangan</span>
                                        <span className="text-sm font-bold text-rose-400">-{new Intl.NumberFormat('id-ID').format(formData.total_pengurangan || 0)}</span>
                                    </div>
                                    <div className="h-px bg-white/10 my-4" />
                                    <div className="space-y-2">
                                        <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest leading-none">Netto Salary (Gaji Bersih)</span>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-lg font-bold text-slate-500">Rp</span>
                                            <h4 className="text-4xl font-black tracking-tighter italic text-indigo-50">
                                                {new Intl.NumberFormat('id-ID').format(formData.grand_total || 0)}
                                            </h4>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default FinancePayrollEditPage;
