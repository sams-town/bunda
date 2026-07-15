import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Briefcase,
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Fingerprint,
  Shield,
  Clock,
  TrendingUp,
  LogIn,
  LogOut,
} from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
  settings?: any;
}

export function LoginPage({ onLogin, settings }: LoginPageProps) {
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
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        const user = responseData.data;
        console.log('Login User Data:', user); // Debug log

        // Strict is_admin check with safe fallback for legacy users
        const isAdmin = user.is_admin === 'admin';
        const isUser = user.is_admin === 'user' || !user.is_admin;

        if (isAdmin || isUser) {
          // Standardize is_admin if missing for local storage
          if (!user.is_admin) user.is_admin = 'user';
          
          localStorage.setItem('token', responseData.token);
          localStorage.setItem('user', JSON.stringify(user));
          onLogin();
        } else {
          setError('Akses ditolak. Periksa kembali akun Anda.');
        }
      } else {
        setError(responseData.message || 'Login gagal. Periksa kembali kredensial Anda.');
      }
    } catch (err) {
      setError('Koneksi gagal. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: Shield, label: 'Absensi Aman', desc: 'Face recognition & GPS tracking' },
    { icon: TrendingUp, label: 'Payroll Otomatis', desc: 'Kalkulasi gaji real-time' },
    { icon: Clock, label: 'Manajemen Cuti', desc: 'Pengajuan & persetujuan mudah' },
  ];

  return (
    <div className="min-h-screen w-full flex bg-[#F8FAFC] relative overflow-hidden">

      {/* ─── Background blobs removed ─── */}

      {/* ─── Wrapper: stacks vertically on mobile, side-by-side on lg ─── */}
      <div className="relative z-10 w-full flex flex-col lg:flex-row">

        {/* ════════════ LEFT / TOP: FORM ════════════ */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="
            flex-1 flex flex-col justify-center
            px-6 py-12
            sm:px-12 sm:py-16
            lg:px-16 lg:py-20
            lg:max-w-[520px]
          "
        >
          {/* Brand */}
          <div className="flex items-center gap-3 mb-10 sm:mb-14">
            <div className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
              {settings?.logo ? (
                 <img src={getFileUrl(settings.logo)} alt="Logo" className="w-9 h-9 sm:w-10 sm:h-10 object-contain" />
              ) : (
                <Briefcase className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-600" />
              )}
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 block leading-none">{settings?.name || 'MeAndPay'}</span>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-500">{settings?.name ? 'HRIS Platform' : 'HRIS Platform'}</span>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8 sm:mb-10">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2 sm:mb-3 tracking-tight leading-tight">
              Selamat Datang 👋
            </h1>
            <p className="text-slate-500 font-medium text-sm sm:text-base">
              Masukkan kredensial Anda untuk mengakses dashboard.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm font-semibold flex items-start gap-2.5"
                >
                  <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-rose-200 text-rose-600 text-[10px] font-black flex items-center justify-center">!</span>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Username */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Username</label>
              <div className="relative group">
                <User className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" />
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full pl-11 sm:pl-14 pr-5 py-4 sm:py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900 font-semibold text-sm sm:text-base placeholder:text-slate-300"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 sm:pl-14 pr-12 sm:pr-14 py-4 sm:py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900 font-semibold text-sm sm:text-base placeholder:text-slate-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 sm:py-5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all disabled:opacity-60 group shadow-xl shadow-slate-900/10 mt-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          </form>

          {/* Absen Masuk & Keluar */}
          <div className="mt-6 sm:mt-8">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#F8FAFC] px-4 text-[11px] font-black uppercase tracking-widest text-slate-300">
                  Akses Langsung
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Absen Masuk */}
              <motion.button
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/absen-masuk')}
                className="flex flex-col items-center gap-2 py-4 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-lg shadow-emerald-500/25 transition-all"
              >
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <LogIn className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-black tracking-widest uppercase">Absen Masuk</p>
                  <p className="text-[10px] text-white/60 font-medium mt-0.5">Clock In</p>
                </div>
              </motion.button>

              {/* Absen Keluar */}
              <motion.button
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/absen-keluar')}
                className="flex flex-col items-center gap-2 py-4 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl shadow-lg shadow-rose-500/25 transition-all"
              >
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <LogOut className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-black tracking-widest uppercase">Absen Keluar</p>
                  <p className="text-[10px] text-white/60 font-medium mt-0.5">Clock Out</p>
                </div>
              </motion.button>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-[11px] text-slate-300 font-medium">
            {settings?.footer || `© 2026 ${settings?.name || 'MeAndPay'} · HRIS Platform`}
          </p>
        </motion.div>

        {/* ════════════ RIGHT / BOTTOM: VISUAL — hidden on mobile ════════════ */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="hidden lg:flex flex-1 bg-slate-900 flex-col justify-center p-16 relative overflow-hidden"
        >
          {/* Abstract shapes */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-20 -right-20 w-80 h-80 border-[40px] border-white/5 rounded-full" />
            <div className="absolute bottom-1/4 -left-20 w-64 h-64 border-[20px] border-indigo-500/5 rounded-full" />
            <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-indigo-950/20 to-transparent" />
          </div>

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 bg-slate-500/10 border border-slate-400/20 rounded-full px-4 py-1.5 mb-8">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">All-in-one HRIS</span>
              </div>

              <h2 className="text-4xl xl:text-5xl font-black mb-6 leading-[1.1] tracking-tight text-white">
                Kelola SDM <br />
                <span className="text-slate-400">lebih efisien</span> <br />
                dengan teknologi modern.
              </h2>
              <p className="text-slate-400 text-base mb-12 max-w-sm font-medium leading-relaxed">
                Platform HRIS lengkap untuk absensi, payroll, manajemen cuti, dan laporan karyawan dalam satu tempat.
              </p>
            </motion.div>

            {/* Feature cards */}
            <div className="space-y-4">
              {features.map(({ icon: Icon, label, desc }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
                  className="flex items-center gap-4 p-4 bg-white/5 border border-white/8 rounded-2xl hover:bg-white/8 transition-all"
                >
                  <div className="w-10 h-10 bg-slate-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{label}</p>
                    <p className="text-xs text-slate-500 font-medium">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
