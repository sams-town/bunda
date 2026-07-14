import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  LogOut, 
  Loader2,
  Camera,
  ShieldCheck,
  CreditCard,
  Briefcase,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  CalendarDays,
  Coins,
  Receipt,
  Info
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_API_MEANDPAY;

type TabType = 'info' | 'cuti' | 'gaji_plus' | 'gaji_minus';

function formatCurrency(value: string | number | null | undefined): string {
  if (!value || value === '0' || value === 0) return '0';
  const num = typeof value === 'string' ? parseInt(value) : value;
  if (isNaN(num)) return '-';
  return num.toLocaleString('id-ID');
}

export function MobileProfilePage({ onLogout, settings }: { onLogout?: () => void, settings?: any }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('info');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user?.id) return;

      const res = await fetch(`${BASE_URL}/users/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const json = await res.json();
      if (json.success) {
        setProfile(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/absen';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-32 overflow-x-hidden">
      {/* Premium Header Profile */}
      <div className="bg-indigo-700 pt-14 pb-24 px-6 rounded-b-[4rem] relative shadow-2xl shadow-indigo-500/20 overflow-hidden">
        {/* Floating Blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-400/20 rounded-full blur-2xl -ml-10 -mb-10" />

        <div className="flex items-center justify-between relative z-10 text-white mb-8">
           <button onClick={() => navigate('/beranda')} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 active:scale-90 transition-all">
             <ChevronLeft className="w-6 h-6" />
           </button>
           <h1 className="text-lg font-black tracking-tight">Profil Pegawai</h1>
           <button 
             onClick={handleLogout}
             className="w-10 h-10 bg-rose-500/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-rose-500/30 text-rose-100 active:scale-90 transition-all"
           >
             <LogOut className="w-5 h-5" />
           </button>
        </div>

        <div className="flex flex-col items-center relative z-10 text-center">
           <div className="relative">
              <div className="w-28 h-28 rounded-[2.8rem] border-[6px] border-white/20 backdrop-blur-sm shadow-2xl overflow-hidden bg-slate-100/10">
                 {profile?.foto_karyawan ? (
                   <img src={profile.foto_karyawan} alt="Avatar" className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-indigo-100">
                      <User className="w-14 h-14 opacity-20" />
                   </div>
                 )}
              </div>
              <button className="absolute -bottom-1 -right-1 w-10 h-10 bg-white text-indigo-600 rounded-2xl border-4 border-indigo-700 flex items-center justify-center shadow-xl active:scale-95 transition-all">
                 <Camera className="w-5 h-5" />
              </button>
           </div>
           
           <h2 className="text-2xl font-black text-white mt-6 tracking-tight leading-none drop-shadow-md">{profile?.name}</h2>
           <div className="mt-3 flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-white text-[10px] font-black uppercase tracking-[0.15em]">{profile?.jabatan?.nama_jabatan || 'Internal Staff'}</p>
           </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="px-6 -mt-8 relative z-20">
        <div className="bg-white p-2 rounded-[2.2rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex gap-1 overflow-x-auto scrollbar-hide">
          <TabButton 
            active={activeTab === 'info'} 
            onClick={() => setActiveTab('info')} 
            icon={Info} 
            label="Informasi" 
          />
          <TabButton 
            active={activeTab === 'cuti'} 
            onClick={() => setActiveTab('cuti')} 
            icon={CalendarDays} 
            label="Cuti" 
          />
          <TabButton 
            active={activeTab === 'gaji_plus'} 
            onClick={() => setActiveTab('gaji_plus')} 
            icon={TrendingUp} 
            label="+ Gaji" 
          />
          <TabButton 
            active={activeTab === 'gaji_minus'} 
            onClick={() => setActiveTab('gaji_minus')} 
            icon={TrendingDown} 
            label="- Gaji" 
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-6 mt-6 pb-10">
        <AnimatePresence mode="wait">
          {activeTab === 'info' && (
            <motion.div
              key="info"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Personal Info */}
              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-2">
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                   <User className="w-3 h-3" /> Data Personal
                </p>
                <InfoItem icon={Mail} label="Alamat Email" value={profile?.email} />
                <div className="h-px bg-slate-50 w-full" />
                <InfoItem icon={Phone} label="Nomor Telepon" value={profile?.telepon} />
                <div className="h-px bg-slate-50 w-full" />
                <InfoItem icon={MapPin} label="Lokasi Kantor" value={profile?.lokasi?.nama_lokasi} />
              </div>

              {/* ID Cards */}
              <div className="bg-indigo-950 text-white rounded-[2.5rem] p-8 shadow-xl shadow-indigo-900/10 space-y-6">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2">
                   <ShieldCheck className="w-3 h-3" /> Identitas & Dokumen
                </p>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">NIK KTP</p>
                    <p className="text-sm font-black mt-2 tracking-tight">{profile?.ktp || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">Username</p>
                    <p className="text-sm font-black mt-2 tracking-tight">@{profile?.username || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">BPJS Kesehatan</p>
                    <p className="text-sm font-black mt-2 tracking-tight">{profile?.bpjs_kesehatan || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">BPJS TK</p>
                    <p className="text-sm font-black mt-2 tracking-tight">{profile?.bpjs_ketenagakerjaan || '-'}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'cuti' && (
            <motion.div
              key="cuti"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col items-center">
                 <div className="w-20 h-20 bg-indigo-50 rounded-[1.8rem] flex items-center justify-center mb-6">
                   <CalendarDays className="w-10 h-10 text-indigo-600" />
                 </div>
                 <h3 className="text-2xl font-black text-slate-800 tabular-nums">{profile?.izin_cuti || 0} Hari</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Sisa Jatah Cuti Tahunan</p>
              </div>

              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-4">
                 <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-2">Riwayat Kontrak</p>
                 <div className="flex gap-4">
                    <div className="flex-1 p-5 bg-slate-50 rounded-[1.8rem] border border-slate-100">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mulai Kontrak</p>
                       <p className="text-xs font-black text-slate-800 mt-1">{profile?.mulai_kontrak ? new Date(profile.mulai_kontrak).toLocaleDateString('id-ID') : '-'}</p>
                    </div>
                    <div className="flex-1 p-5 bg-slate-50 rounded-[1.8rem] border border-slate-100">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Akhir Kontrak</p>
                       <p className="text-xs font-black text-slate-800 mt-1">{profile?.akhir_kontrak ? new Date(profile.akhir_kontrak).toLocaleDateString('id-ID') : '-'}</p>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'gaji_plus' && (
            <motion.div
              key="gaji_plus"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-emerald-600 text-white rounded-[2.5rem] p-8 shadow-xl shadow-emerald-500/20">
                 <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                       <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                       <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest leading-none">Gaji Pokok</p>
                       <h3 className="text-2xl font-black tabular-nums mt-1">Rp {formatCurrency(profile?.gaji_pokok)}</h3>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-y-6 gap-x-4 pt-6 border-t border-white/10 uppercase tracking-widest font-black">
                    <SalarySubItem label="Makan" value={profile?.tunjangan_makan} unit="/ Hari" />
                    <SalarySubItem label="Transport" value={profile?.tunjangan_transport} unit="/ Hari" />
                    <SalarySubItem label="Lembur" value={profile?.lembur} unit="/ Jam" />
                    <SalarySubItem label="Kehadiran" value={profile?.kehadiran} unit="/ Bln" />
                 </div>
              </div>

              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-6">
                 <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Tunjangan Lain-lain</p>
                 <div className="space-y-4">
                    <AllowanceRow label="THR" value={profile?.thr} />
                    <AllowanceRow label="Bonus Pribadi" value={profile?.bonus_pribadi} />
                    <AllowanceRow label="Bonus Team" value={profile?.bonus_team} />
                    <AllowanceRow label="Bonus Jackpot" value={profile?.bonus_jackpot} />
                 </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'gaji_minus' && (
            <motion.div
              key="gaji_minus"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-rose-600 text-white rounded-[2.5rem] p-8 shadow-xl shadow-rose-500/20">
                 <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                       <TrendingDown className="w-6 h-6 text-white" />
                    </div>
                    <div>
                       <p className="text-rose-100 text-[10px] font-black uppercase tracking-widest leading-none">Potongan & Pengurangan</p>
                       <h3 className="text-lg font-black mt-1">Payroll Adjustment</h3>
                    </div>
                 </div>
              </div>

              <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100">
                  <div className="p-8 pb-0">
                     <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-6">Penalty Rates</p>
                  </div>
                  <div className="divide-y divide-slate-50 px-8 pb-8">
                     <PenaltyRow label="Izin" value={profile?.izin} unit="/ Hari" />
                     <PenaltyRow label="Terlambat" value={profile?.terlambat} unit="/ Menit" />
                     <PenaltyRow label="Mangkir" value={profile?.mangkir} unit="/ Hari" />
                  </div>
              </div>

              <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100">
                  <div className="p-8 pb-0">
                     <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-6">Kewajiban & Kasbon</p>
                  </div>
                  <div className="divide-y divide-slate-50 px-8 pb-8">
                     <PenaltyRow label="Potonga BPJS Kes" value={profile?.potongan_bpjs_kesehatan} unit="/ Bulan" />
                     <PenaltyRow label="Potongan BPJS TK" value={profile?.potongan_bpjs_ketenagakerjaan} unit="/ Bulan" />
                     <PenaltyRow label="Saldo Kasbon" value={profile?.saldo_kasbon} unit="Total" highlight />
                  </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <p className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em] mt-10">
        {settings?.footer || `${settings?.name || 'MeAndPay'} Integrated Profile v3.0`}
      </p>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-2 py-3.5 px-3 rounded-3xl transition-all whitespace-nowrap",
        active ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "bg-transparent text-slate-400 hover:text-slate-600"
      )}
    >
      <Icon className={cn("w-4 h-4", active ? "text-white" : "text-slate-300")} />
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-center gap-4 py-3">
       <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
          <Icon className="w-5 h-5" />
       </div>
       <div className="flex-1 min-w-0 text-left">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
          <p className="text-sm font-black text-slate-800 truncate">{value || '-'}</p>
       </div>
    </div>
  );
}

function SalarySubItem({ label, value, unit }: { label: string, value: any, unit: string }) {
  return (
    <div>
       <p className="text-[9px] text-white/50">{label}</p>
       <p className="text-xs">
          <span className="font-black">Rp {formatCurrency(value)}</span>
          <span className="text-[8px] opacity-60 ml-1">{unit}</span>
       </p>
    </div>
  )
}

function AllowanceRow({ label, value }: { label: string, value: any }) {
  return (
    <div className="flex items-center justify-between">
       <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">{label}</span>
       </div>
       <span className="text-xs font-black text-slate-800 tabular-nums">Rp {formatCurrency(value)}</span>
    </div>
  )
}

function PenaltyRow({ label, value, unit, highlight }: { label: string, value: any, unit: string, highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-5 first:pt-4 last:pb-4">
       <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">{label}</span>
       <div className="text-right">
          <p className={cn("text-xs font-black tabular-nums", highlight ? "text-indigo-600" : "text-rose-600")}>
            Rp {formatCurrency(value)}
          </p>
          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">{unit}</p>
       </div>
    </div>
  )
}
