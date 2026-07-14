import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Fingerprint,
  ShieldCheck,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';

interface MobileLoginPageProps {
  onLogin: () => void;
  settings?: any;
}

export function MobileLoginPage({ onLogin, settings }: MobileLoginPageProps) {
  const getFileUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('blob:')) return path;
    let cleanPath = path.replace(/^\//, '');
    if (cleanPath.startsWith('uploads/')) cleanPath = cleanPath.slice(8);
    return `https://rsthb.id/apihris/uploads/${cleanPath}`;
  };
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
      console.log('cekres',responseData);

      if (response.ok && responseData.success) {
        const user = responseData.data;
        console.log('Mobile Login User Data:', user); // Debug log

        const isAdmin = user.is_admin === 'admin';
        const isUser = user.is_admin === 'user' || !user.is_admin;

        if (isAdmin || isUser) {
          // Standardize is_admin if missing
          if (!user.is_admin) user.is_admin = 'user';

          localStorage.setItem('token', responseData.token);
          localStorage.setItem('user', JSON.stringify(user));
          onLogin();
        } else {
          setError('Akses ditolak. Periksa kembali akun Anda.');
          setIsLoading(false);
          return;
        }

        // For mobile attendance, we allow any valid user (not just admin)
        localStorage.setItem('token', responseData.token);
        localStorage.setItem('user', JSON.stringify(responseData.data));
        onLogin();
      } else {
        setError(responseData.message || 'Login gagal. Cek kembali akun Anda.');
      }
    } catch (err) {
      setError('Koneksi bermasalah. Coba lagi nanti.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans overflow-hidden">
      {/* Visual Header */}
      <div className="h-[40vh] bg-indigo-700 relative overflow-hidden flex items-center justify-center p-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-900/40" />
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center relative z-10 space-y-6"
        >
          <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center mx-auto border border-white/30 shadow-2xl">
            {settings?.logo ? (
              <img src={getFileUrl(settings.logo)} alt="Logo" className="w-14 h-14 object-contain" />
            ) : (
              <Fingerprint className="w-12 h-12 text-white" />
            )}
          </div>
          <div>
             <h1 className="text-4xl font-black text-white tracking-tighter">{settings?.name || 'Portal Absensi'}</h1>
             <p className="text-white/60 font-black uppercase tracking-[0.3em] text-[10px] mt-2">Mobile Integrated System</p>
          </div>
        </motion.div>
      </div>

      {/* Form Content */}
      <div className="flex-1 -mt-10 bg-white rounded-t-[3.5rem] p-10 relative z-20 shadow-[0_-20px_40px_rgba(0,0,0,0.05)]">
        <form onSubmit={handleSubmit} className="space-y-8 max-w-sm mx-auto">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Selamat Datang</h2>
            <p className="text-slate-400 text-sm font-medium">Gunakan akun kepegawaian Anda untuk absen.</p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-600 rounded-xl text-xs font-bold"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Username / ID</label>
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ID Pegawai"
                  className="w-full pl-18 pr-6 py-5 bg-slate-50 border border-transparent rounded-[1.5rem] outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-500 transition-all text-slate-900 font-bold text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Pin Keamanan</label>
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                  <Lock className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-18 pr-14 py-5 bg-slate-50 border border-transparent rounded-[1.5rem] outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-500 transition-all text-slate-900 font-bold text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 p-2"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          <button
            disabled={isLoading}
            className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-3 active:scale-95 transition-all text-sm"
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                Masuk Sistem
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] pt-4">
            {settings?.footer || `Powered by ${settings?.name || 'MeAndPay'} Premium v2.0`}
          </p>
        </form>
      </div>

      <style>{`
        .pl-18 { padding-left: 4.5rem; }
      `}</style>
    </div>
  );
}
