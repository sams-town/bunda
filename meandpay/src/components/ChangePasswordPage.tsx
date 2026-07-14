import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, User, Eye, EyeOff, Loader2, KeyRound } from 'lucide-react';
import { useToast } from './Toast';

export function ChangePasswordPage({ user, onBack }: { user: any, onBack: () => void }) {
    const [formData, setFormData] = useState({
        password: '',
        password_confirmation: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const { addToast, updateToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.password_confirmation) {
            addToast({ type: 'error', title: 'Error', message: 'Password dan konfirmasi password tidak cocok' });
            return;
        }

        if (formData.password.length < 6) {
            addToast({ type: 'error', title: 'Error', message: 'Password minimal 6 karakter' });
            return;
        }

        const toastId = addToast({ type: 'loading', title: 'Menyimpan', message: 'Sedang memperbarui password...' });
        setLoading(true);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/me`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password: formData.password }),
            });
            const json = await res.json();
            if (json.success) {
                updateToast(toastId, { type: 'success', title: 'Berhasil', message: 'Password berhasil diperbarui' });
                setFormData({ password: '', password_confirmation: '' });
            } else {
                updateToast(toastId, { type: 'error', title: 'Gagal', message: json.message || 'Gagal memperbarui password' });
            }
        } catch (err: any) {
            updateToast(toastId, { type: 'error', title: 'Error', message: err.message || 'Terjadi kesalahan sistem' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-[1600px] mx-auto space-y-8 pb-20 px-4"
        >
            <div className="mb-8">
                <h1 className="text-4xl font-black text-slate-800 tracking-tight">Ganti Password</h1>
                <p className="text-slate-500 font-medium italic mt-1">Perbarui password akun Anda</p>
            </div>

            <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-indigo-500/5 overflow-hidden">
                {/* Header info */}
                <div className="p-10 border-b border-slate-50 flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center">
                        <KeyRound className="w-8 h-8 text-indigo-500" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <User className="w-4 h-4 text-slate-400" />
                            <p className="text-sm font-black text-slate-800">{user?.name || 'Super Admin'}</p>
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Keamanan Akun</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Password Baru</label>
                            <div className="relative">
                                <input
                                    required
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Masukkan password baru"
                                    className="w-full pl-14 pr-14 py-4.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all"
                                />
                                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Konfirmasi Password</label>
                            <div className="relative">
                                <input
                                    required
                                    type={showConfirm ? 'text' : 'password'}
                                    value={formData.password_confirmation}
                                    onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                                    placeholder="Ulangi password baru"
                                    className="w-full pl-14 pr-14 py-4.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all"
                                />
                                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                                >
                                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {formData.password && formData.password_confirmation && formData.password !== formData.password_confirmation && (
                                <p className="text-xs font-bold text-rose-500 mt-2 ml-1">Password tidak cocok</p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onBack}
                            className="flex-1 py-4.5 bg-slate-50 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 transition-all"
                        >
                            Kembali
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.password || !formData.password_confirmation}
                            className="flex-[2] py-4.5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Simpan Password
                        </button>
                    </div>
                </form>
            </div>
        </motion.div>
    );
}
