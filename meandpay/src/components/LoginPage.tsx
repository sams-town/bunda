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
  Shield,
  Clock,
  LogIn,
  LogOut,
  Heart,
  Calendar,
  CreditCard,
  ShieldAlert,
  Activity
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
    let base = (apiData || apiBase || 'https://rsthb.id/apihris').replace(/\/api$/, '').replace(/\/$/, '');
    if (!base.startsWith('http')) {
      base = 'https://rsthb.id/apihris';
    }
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
    { 
      icon: Shield, 
      label: 'Absensi Aman & Terverifikasi', 
      desc: 'Sistem absensi dilengkapi dengan Face Recognition dan pelacakan GPS akurat.',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'group-hover:border-emerald-500/30'
    },
    { 
      icon: CreditCard, 
      label: 'Payroll Otomatis & Transparan', 
      desc: 'Kalkulasi gaji, tunjangan, dan potongan BPJS secara real-time dan akurat.',
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'group-hover:border-indigo-500/30'
    },
    { 
      icon: Calendar, 
      label: 'Manajemen Cuti & Izin Efisien', 
      desc: 'Pengajuan cuti, sakit, dan izin lembur langsung diproses dengan alur persetujuan cepat.',
      color: 'text-teal-400',
      bg: 'bg-teal-500/10',
      border: 'group-hover:border-teal-500/30'
    },
  ];

  return (
    <div className="min-h-screen w-full flex bg-[#F8FAFC] relative overflow-hidden font-sans">
      
      {/* Background soft ambient glow (decorative) */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-200/20 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/2 w-96 h-96 bg-teal-200/20 rounded-full filter blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full flex flex-col lg:flex-row">
        
        {/* ════════════ LEFT: LOGIN FORM PANEL ════════════ */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-16 xl:px-20 lg:max-w-[560px] bg-white/80 backdrop-blur-md border-r border-slate-100 shadow-2xl z-20"
        >
          {/* Brand Header */}
          <div className="flex items-center gap-3.5 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-teal-500 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center shrink-0">
              <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center overflow-hidden">
                {settings?.logo ? (
                  <img 
                    src={getFileUrl(settings.logo)} 
                    alt="Logo" 
                    className="w-8 h-8 object-contain" 
                    onError={(e) => {
                      // Fallback if image fails to load
                      (e.target as HTMLElement).style.display = 'none';
                      const fallback = document.getElementById('logo-fallback');
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  id="logo-fallback" 
                  style={{ display: settings?.logo ? 'none' : 'flex' }}
                  className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-indigo-50 to-teal-50 text-indigo-600"
                >
                  <Activity className="w-5 h-5 animate-pulse" />
                </div>
              </div>
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-800 block leading-tight">
                {settings?.name || 'RS Bunda Halimah'}
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] bg-gradient-to-r from-indigo-600 to-teal-500 bg-clip-text text-transparent">
                HRIS PLATFORM
              </span>
            </div>
          </div>

          {/* Greetings */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2.5 tracking-tight leading-tight flex items-center gap-2">
              Selamat Datang <span className="animate-bounce">👋</span>
            </h1>
            <p className="text-slate-500 font-medium text-sm">
              Silakan masukkan kredensial Anda untuk masuk ke sistem kepegawaian RS Bunda Halimah Batam.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  className="p-4 bg-rose-50/80 border border-rose-100 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-3 shadow-sm"
                >
                  <div className="w-6 h-6 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                  </div>
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Username Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">
                Username
              </label>
              <div className="relative group">
                <User className="absolute left-4.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" />
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username Anda"
                  className="w-full pl-12 pr-5 py-4 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100/50 transition-all text-slate-800 font-semibold text-sm placeholder:text-slate-300"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-4 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100/50 transition-all text-slate-800 font-semibold text-sm placeholder:text-slate-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileTap={{ scale: 0.985 }}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-2xl font-bold text-sm tracking-wide flex items-center justify-center gap-2.5 transition-all disabled:opacity-60 group shadow-lg shadow-indigo-600/20 active:scale-[0.99] mt-3"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          </form>

          {/* Quick Access Area (Absen Masuk/Keluar) */}
          <div className="mt-8">
            <div className="relative mb-5.5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Akses Cepat Kepegawaian
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              {/* Clock In */}
              <motion.button
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/absen-masuk')}
                className="flex items-center gap-3.5 p-3.5 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl shadow-lg shadow-emerald-500/10 transition-all text-left"
              >
                <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
                  <LogIn className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-black tracking-wider uppercase text-white/90">Absen Masuk</p>
                  <p className="text-[9px] text-white/70 font-semibold uppercase mt-0.5">Clock In</p>
                </div>
              </motion.button>

              {/* Clock Out */}
              <motion.button
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/absen-keluar')}
                className="flex items-center gap-3.5 p-3.5 bg-gradient-to-br from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-2xl shadow-lg shadow-rose-500/10 transition-all text-left"
              >
                <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-black tracking-wider uppercase text-white/90">Absen Keluar</p>
                  <p className="text-[9px] text-white/70 font-semibold uppercase mt-0.5">Clock Out</p>
                </div>
              </motion.button>
            </div>
          </div>

          {/* Footer branding */}
          <div className="mt-10 text-center">
            <p className="text-[10px] text-slate-400 font-semibold tracking-wide">
              {settings?.footer || `© 2026 ${settings?.name || 'RS Bunda Halimah'} · All Rights Reserved`}
            </p>
          </div>
        </motion.div>

        {/* ════════════ RIGHT: MARKETING / INFO PANEL (HIDDEN ON MOBILE) ════════════ */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="hidden lg:flex flex-1 bg-gradient-to-tr from-[#0F172A] via-[#1E293B] to-[#334155] flex-col justify-center p-16 xl:p-24 relative overflow-hidden"
        >
          {/* Glowing blur effects */}
          <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-teal-500/15 rounded-full filter blur-[100px] pointer-events-none animate-pulse" />
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full filter blur-[120px] pointer-events-none animate-pulse" />
          
          {/* Hospital medical patterns overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex flex-col justify-between p-12">
            <div className="flex justify-between">
              <Activity className="w-16 h-16 text-white" />
              <Heart className="w-20 h-20 text-white" />
            </div>
            <div className="flex justify-between">
              <Heart className="w-24 h-24 text-white" />
              <Activity className="w-16 h-16 text-white" />
            </div>
          </div>

          <div className="relative z-10 max-w-lg">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4.5 py-1.5 mb-8 backdrop-blur-md">
                <div className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-300">Modern HR Ecosystem</span>
              </div>

              <h2 className="text-4xl xl:text-5xl font-black mb-6 leading-[1.15] tracking-tight text-white">
                Kelola Layanan SDM <br />
                <span className="bg-gradient-to-r from-teal-300 to-indigo-300 bg-clip-text text-transparent">Lebih Efisien</span> <br />
                Secara Terintegrasi.
              </h2>
              <p className="text-slate-300 text-sm xl:text-base mb-12 font-medium leading-relaxed">
                Platform kepegawaian internal khusus Rumah Sakit Bunda Halimah Batam untuk mempermudah absensi, rekap kerja, payroll, dan pengajuan izin dalam satu platform digital terpadu.
              </p>
            </motion.div>

            {/* Premium feature list cards */}
            <div className="space-y-4">
              {features.map(({ icon: Icon, label, desc, color, bg, border }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + i * 0.1, duration: 0.4 }}
                  className={`group flex items-start gap-4 p-5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-2xl transition-all duration-300`}
                >
                  <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center shrink-0 shadow-inner`}>
                    <Icon className={`w-5.5 h-5.5 ${color}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1 group-hover:text-teal-200 transition-colors">{label}</h3>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">{desc}</p>
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
