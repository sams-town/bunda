import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { formatPhotoUrl } from '../lib/utils';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
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
        console.log('Login User Data:', user);

        const isAdmin = user.is_admin === 'admin';
        const isUser = user.is_admin === 'user' || !user.is_admin;

        if (isAdmin || isUser) {
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
      color: 'text-[#34959E]',
      bg: 'bg-[#34959E]/10',
    },
    { 
      icon: CreditCard, 
      label: 'Payroll Otomatis & Transparan', 
      desc: 'Kalkulasi gaji, tunjangan, dan potongan BPJS secara real-time dan akurat.',
      color: 'text-[#990000]',
      bg: 'bg-[#990000]/10',
    },
    { 
      icon: Calendar, 
      label: 'Manajemen Cuti & Izin Efisien', 
      desc: 'Pengajuan cuti, sakit, dan izin lembur langsung diproses dengan alur persetujuan cepat.',
      color: 'text-[#FB9917]',
      bg: 'bg-[#FB9917]/10',
    },
  ];

  return (
    <div className="min-h-screen w-full flex bg-[#F8FAFC] relative overflow-hidden font-sans">
      
      {/* Background soft ambient glow (decorative) */}
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-[#34959E]/5 rounded-full filter blur-[120px] pointer-events-none -translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#FB9917]/5 rounded-full filter blur-[100px] pointer-events-none translate-x-1/3 translate-y-1/3" />

      <div className="relative z-10 w-full flex flex-col lg:flex-row">
        
        {/* ════════════ LEFT: LOGIN FORM PANEL ════════════ */}
        <div className="flex-1 lg:w-1/2 flex flex-col justify-center items-center px-6 py-10 lg:p-12 relative z-20">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-full max-w-[460px] bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_20px_60px_rgba(15,23,42,0.08)] rounded-[24px] p-8 sm:p-10 relative overflow-hidden flex flex-col"
          >
            {/* Subtle white gradient inside card */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
            
            <div className="relative z-10">
              {/* Brand Header */}
              <div className="flex items-center gap-3.5 mb-10">
                <div className="w-12 h-12 rounded-[16px] bg-gradient-to-b from-[#34959E] to-[#287B83] p-0.5 shadow-lg shadow-[#34959E]/20 flex items-center justify-center shrink-0">
                  <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center overflow-hidden">
                    {settings?.logo ? (
                      <img 
                        src={formatPhotoUrl(settings.logo)} 
                        alt="Logo" 
                        className="w-8 h-8 object-contain" 
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                          const fallback = document.getElementById('logo-fallback');
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      id="logo-fallback" 
                      style={{ display: settings?.logo ? 'none' : 'flex' }}
                      className="w-full h-full flex items-center justify-center bg-[#F8FAFC] text-[#34959E]"
                    >
                      <Activity className="w-5 h-5 animate-pulse" />
                    </div>
                  </div>
                </div>
                <div>
                  <span className="text-xl font-extrabold tracking-tight text-[#0F172A] block leading-tight">
                    {settings?.name || 'RS Bunda Halimah'}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#34959E]">
                    HRIS PLATFORM
                  </span>
                </div>
              </div>

              {/* Greetings */}
              <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-[#0F172A] mb-2.5 tracking-tight leading-tight flex items-center gap-2">
                  Selamat Datang <span className="animate-bounce">👋</span>
                </h1>
                <p className="text-[#64748B] font-medium text-sm leading-relaxed">
                  Silakan masukkan kredensial Anda untuk masuk ke sistem kepegawaian RS Bunda Halimah Batam.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
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

                {/* Username */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] ml-1">
                    Username
                  </label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#34959E] transition-colors pointer-events-none" />
                    <input
                      type="text"
                      required
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Masukkan username Anda"
                      className="w-full pl-12 pr-5 py-4.5 bg-white/50 hover:bg-white/80 border border-slate-200/80 focus:border-[#34959E] focus:bg-white rounded-[16px] outline-none focus:ring-4 focus:ring-[#34959E]/10 transition-all text-[#0F172A] font-medium text-[15px] placeholder:text-slate-400 shadow-inner"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] ml-1">
                    Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#34959E] transition-colors pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-12 py-4.5 bg-white/50 hover:bg-white/80 border border-slate-200/80 focus:border-[#34959E] focus:bg-white rounded-[16px] outline-none focus:ring-4 focus:ring-[#34959E]/10 transition-all text-[#0F172A] font-medium text-[15px] placeholder:text-slate-400 shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0F172A] transition-colors p-1.5"
                    >
                      {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.985 }}
                  className="w-full py-4.5 bg-gradient-to-b from-[#34959E] to-[#287B83] text-white rounded-[18px] font-bold text-[15px] tracking-wide flex items-center justify-center gap-2.5 transition-all disabled:opacity-60 shadow-[0_8px_20px_rgba(52,149,158,0.25)] hover:shadow-[0_12px_25px_rgba(52,149,158,0.35)] mt-6"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Quick Access Area */}
              <div className="mt-10">
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200/60" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                      Akses Cepat Kepegawaian
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/absen-masuk')}
                    className="flex items-center justify-center gap-3 p-4 bg-[#34959E] hover:bg-[#287B83] text-white rounded-[18px] shadow-[0_8px_20px_rgba(52,149,158,0.15)] transition-all"
                  >
                    <LogIn className="w-5 h-5" />
                    <div className="text-left">
                      <p className="text-[11px] font-bold tracking-wider uppercase text-white leading-tight">Absen Masuk</p>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/absen-keluar')}
                    className="flex items-center justify-center gap-3 p-4 bg-[#990000] hover:bg-[#7A0000] text-white rounded-[18px] shadow-[0_8px_20px_rgba(153,0,0,0.15)] transition-all"
                  >
                    <LogOut className="w-5 h-5" />
                    <div className="text-left">
                      <p className="text-[11px] font-bold tracking-wider uppercase text-white leading-tight">Absen Keluar</p>
                    </div>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="mt-10 text-center relative z-10">
            <p className="text-[11px] text-[#64748B] font-medium tracking-wide">
              {settings?.footer || `© 2026 ${settings?.name || 'RS Bunda Halimah'} · All Rights Reserved`}
            </p>
          </div>
        </div>

        {/* ════════════ RIGHT: HERO PANEL ════════════ */}
        <div className="hidden lg:flex flex-1 flex-col justify-center p-16 xl:p-24 relative overflow-hidden bg-gradient-to-br from-[#F8FAFC] to-[#EEF6F7]">
          
          {/* Medical Line Art Background Overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex flex-col justify-between p-24 overflow-hidden">
            <Activity className="absolute top-32 right-20 w-64 h-64 text-[#34959E] animate-pulse" />
            <Heart className="absolute bottom-20 left-20 w-96 h-96 text-[#990000]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border-[40px] border-[#34959E] rounded-full blur-[4px]" />
          </div>

          <div className="relative z-10 max-w-xl mx-auto w-full">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
            >
              <div className="inline-flex items-center gap-2.5 bg-white/60 border border-slate-200/60 shadow-sm rounded-full px-5 py-2 mb-10 backdrop-blur-md">
                <div className="w-2 h-2 rounded-full bg-[#FB9917] animate-ping" />
                <span className="text-[11px] font-black uppercase tracking-widest text-[#34959E]">Modern HR Ecosystem</span>
              </div>

              <h2 className="text-5xl xl:text-[56px] font-extrabold mb-7 leading-[1.12] tracking-tight text-[#0F172A]">
                Kelola Layanan SDM <br />
                <span className="text-[#34959E]">Lebih Efisien</span> <br />
                Secara Terintegrasi.
              </h2>
              <p className="text-[#334155] text-base xl:text-lg mb-14 font-medium leading-relaxed max-w-[480px]">
                Platform kepegawaian internal khusus Rumah Sakit Bunda Halimah Batam untuk mempermudah absensi, rekap kerja, payroll, dan pengajuan izin dalam satu platform digital terpadu.
              </p>
            </motion.div>

            {/* Premium Feature Cards */}
            <div className="space-y-4">
              {features.map((f, i) => (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1, duration: 0.5, ease: 'easeOut' }}
                  whileHover={{ y: -4 }}
                  className="group flex items-start gap-5 p-6 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)] hover:shadow-[0_20px_60px_rgba(15,23,42,0.08)] border border-slate-100/80 hover:border-[#34959E]/20 rounded-[24px] transition-all duration-300"
                >
                  <div className={`w-14 h-14 ${f.bg} rounded-[16px] flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110`}>
                    <f.icon className={`w-6 h-6 ${f.color}`} />
                  </div>
                  <div className="pt-1">
                    <h3 className="text-[16px] font-bold text-[#0F172A] mb-1.5 transition-colors">{f.label}</h3>
                    <p className="text-[14px] text-[#64748B] font-medium leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
