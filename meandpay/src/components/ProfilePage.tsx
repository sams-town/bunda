import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  CreditCard,
  Camera,
  Save,
  ChevronRight,
  Loader2,
  AlertCircle,
  Clock,
  LogOut,
  ShieldCheck,
  Calendar as CalendarIcon
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from './Toast';

interface ProfilePageProps {
  onBack?: () => void;
  onLogout?: () => void;
}

function formatCurrency(value: string | null | undefined): string {
  if (!value || value === '0') return '0';
  const num = parseInt(value);
  if (isNaN(num)) return value || '-';
  return num.toLocaleString('id-ID');
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateInput(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.split('T')[0];
}

function calculateMasaKerja(tglJoin: string | null | undefined): string {
  if (!tglJoin) return '-';
  const join = new Date(tglJoin);
  const now = new Date();
  let years = now.getFullYear() - join.getFullYear();
  let months = now.getMonth() - join.getMonth();
  let days = now.getDate() - join.getDate();
  if (days < 0) {
    months--;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  return `${years} Tahun, ${months} Bulan, ${days} Hari`;
}

export function ProfilePage({ onBack, onLogout }: ProfilePageProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusPajakOptions, setStatusPajakOptions] = useState<any[]>([]);
  const { addToast, updateToast } = useToast();

  // Editable form state
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    fetchProfile();
    fetchStatusPajak();
  }, []);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        email: profile.email || '',
        telepon: profile.telepon || '',
        username: profile.username || '',
        alamat: profile.alamat || '',
        gender: profile.gender || '',
        ktp: profile.ktp || '',
        kartu_keluarga: profile.kartu_keluarga || '',
        bpjs_kesehatan: profile.bpjs_kesehatan || '',
        bpjs_ketenagakerjaan: profile.bpjs_ketenagakerjaan || '',
        npwp: profile.npwp || '',
        sim: profile.sim || '',
        no_pkwt: profile.no_pkwt || '',
        no_kontrak: profile.no_kontrak || '',
        rekening: profile.rekening || '',
        nama_rekening: profile.nama_rekening || '',
        gaji_pokok: profile.gaji_pokok || '',
        tunjangan_makan: profile.tunjangan_makan || '',
        tunjangan_transport: profile.tunjangan_transport || '',
        tunjangan_bpjs_kesehatan: profile.tunjangan_bpjs_kesehatan || '',
        tunjangan_bpjs_ketenagakerjaan: profile.tunjangan_bpjs_ketenagakerjaan || '',
        lembur: profile.lembur || '',
        kehadiran: profile.kehadiran || '',
        thr: profile.thr || '',
        bonus_pribadi: profile.bonus_pribadi || '',
        bonus_team: profile.bonus_team || '',
        bonus_jackpot: profile.bonus_jackpot || '',
        izin: profile.izin || '',
        terlambat: profile.terlambat || '',
        mangkir: profile.mangkir || '',
        saldo_kasbon: profile.saldo_kasbon || '',
        potongan_bpjs_kesehatan: profile.potongan_bpjs_kesehatan || '',
        potongan_bpjs_ketenagakerjaan: profile.potongan_bpjs_ketenagakerjaan || '',
        status_pajak_id: profile.status_pajak_id || '',
      });
    }
  }, [profile]);

  const updateForm = (key: string, value: string) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const userId = user?.id || '1';

      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (json.success) {
        setProfile(json.data);
      } else {
        setError(json.message || 'Gagal mengambil data profil');
      }
    } catch (err) {
      setError('Tidak dapat terhubung ke server');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatusPajak = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/status-pajak`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const json = await res.json();
      if (json.success) {
        setStatusPajakOptions(json.data);
      }
    } catch (err) {
      console.error('Error fetching status pajak:', err);
    }
  };

  const handleSubmit = async () => {
    const toastId = addToast({
      type: 'loading',
      title: 'Menyimpan perubahan...',
      message: 'Sedang mengupdate data profil Anda'
    });

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const userId = user?.id || '1';

      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setProfile(json.data);
        updateToast(toastId, {
          type: 'success',
          title: 'Berhasil disimpan!',
          message: 'Data profil Anda telah berhasil diperbarui'
        });
      } else {
        updateToast(toastId, {
          type: 'error',
          title: 'Gagal menyimpan',
          message: json.message || 'Terjadi kesalahan saat menyimpan data'
        });
      }
    } catch (err) {
      updateToast(toastId, {
        type: 'error',
        title: 'Koneksi gagal',
        message: 'Tidak dapat terhubung ke server'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto flex flex-col items-center justify-center py-40 gap-4"
      >
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-sm font-bold text-slate-400">Memuat data profil...</p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto flex flex-col items-center justify-center py-40 gap-4"
      >
        <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-rose-500" />
        </div>
        <p className="text-sm font-bold text-slate-600">{error}</p>
        <button
          onClick={fetchProfile}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all active:scale-95"
        >
          Coba Lagi
        </button>
      </motion.div>
    );
  }

  const p = profile;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-10 pb-32"
    >
      {/* Premium Header Section */}
      <div className="bg-[#1A1C1E] rounded-[3.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20 border border-white/5">
        {/* Animated Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] -mr-32 -mt-32 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-[80px] -ml-20 -mb-20" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative group">
              <div className="w-32 h-32 rounded-[2.5rem] border-4 border-white/10 bg-white/5 overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-105">
                {p?.foto_karyawan ? (
                  <img
                    src={p.foto_karyawan}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-indigo-500/10">
                    <User className="w-16 h-16 text-indigo-400" />
                  </div>
                )}
              </div>
              <button className="absolute -bottom-2 -right-2 p-3 bg-indigo-600 text-white rounded-2xl shadow-xl hover:bg-indigo-500 transition-all hover:scale-110 border-4 border-[#1A1C1E]">
                <Camera className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center md:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <h1 className="text-4xl font-black tracking-tight leading-none">{p?.name || 'User Profile'}</h1>
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-indigo-500/30 backdrop-blur-md">
                   {p?.is_admin === 'admin' ? 'Admin Access' : 'Employee Account'}
                </span>
              </div>
              <p className="text-lg font-bold text-white/50">{p?.jabatan?.nama_jabatan || 'Position Not Set'}</p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4">
                <div className="flex items-center gap-2 text-white/40 text-xs font-bold">
                  <Mail className="w-4 h-4" />
                  {p?.email || '-'}
                </div>
                <div className="w-1 h-1 bg-white/10 rounded-full hidden md:block" />
                <div className="flex items-center gap-2 text-white/40 text-xs font-bold">
                  <MapPin className="w-4 h-4" />
                  {p?.lokasi?.nama_lokasi || '-'}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 lg:mt-0">
            {onLogout && (
              <button
                onClick={onLogout}
                className="px-6 py-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border border-rose-500/30 backdrop-blur-md flex items-center gap-2 group active:scale-95"
              >
                <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Sign Out
              </button>
            )}
            {onBack && (
              <button
                onClick={onBack}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all border border-white/10 backdrop-blur-md flex items-center gap-2 group active:scale-95"
              >
                <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                Back
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Dashboard Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatSummaryCard 
          label="Masa Kerja" 
          value={calculateMasaKerja(p?.tgl_join).split(',')[0]} 
          subValue={calculateMasaKerja(p?.tgl_join).split(',').slice(1).join(',')}
          icon={Clock} 
          color="indigo" 
        />
        <StatSummaryCard 
          label="Sisa Cuti" 
          value={`${p?.izin_cuti || '0'} Hari`} 
          subValue="Available balance"
          icon={CalendarIcon} 
          color="emerald" 
        />
        <StatSummaryCard 
          label="Gaji Pokok" 
          value={`Rp ${formatCurrency(p?.gaji_pokok)}`} 
          subValue="Monthly basic"
          icon={CreditCard} 
          color="blue" 
        />
        <StatSummaryCard 
          label="Join Date" 
          value={formatDate(p?.tgl_join)} 
          subValue="Member since"
          icon={Briefcase} 
          color="purple" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Side Stats */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/20">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
               <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
               Attendance Summary
            </h3>
            <div className="space-y-4">
              <PremiumCompactStat label="Cuti Terpakai" value={p?.izin_cuti || '0'} unit="Days" icon={CalendarIcon} color="emerald" />
              <PremiumCompactStat label="Izin Lainnya" value={p?.izin_lainnya || '0'} unit="Times" icon={Mail} color="slate" />
              <PremiumCompactStat label="Izin Terlambat" value={p?.izin_telat || '0'} unit="Times" icon={Clock} color="amber" />
              <PremiumCompactStat label="Pulang Cepat" value={p?.izin_pulang_cepat || '0'} unit="Times" icon={LogOut} color="rose" />
              <PremiumCompactStat label="Cuti Melahirkan" value={p?.cuti_melahirkan || '0'} unit="Days" icon={CalendarIcon} color="emerald" />
              <PremiumCompactStat label="Cuti Kematian" value={p?.cuti_kematian || '0'} unit="Days" icon={CalendarIcon} color="rose" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-10 rounded-[3rem] text-white shadow-2xl shadow-indigo-600/30">
             <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20">
                   <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black tracking-tight">Security ID</h3>
             </div>
             <div className="space-y-6">
                <div>
                   <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">Employee Username</p>
                   <p className="text-lg font-black">{p?.username || '-'}</p>
                </div>
                <div className="pt-6 border-t border-white/10">
                   <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">Office Location</p>
                   <p className="text-lg font-black">{p?.lokasi?.nama_lokasi || 'Unassigned'}</p>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: Detailed Forms */}
        <div className="lg:col-span-8 space-y-10">
          {/* Personal Info Section */}
          <Section title="Personal Information" icon={User}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CompactField label="Nama Pegawai" value={form.name} onChange={(v) => updateForm('name', v)} />
              <CompactField label="Foto Pegawai" value={p?.foto_karyawan ? 'File uploaded' : 'No file chosen'} isFile />
              <CompactField label="Email" value={form.email} onChange={(v) => updateForm('email', v)} />
              <CompactField label="Nomor Handphone" value={form.telepon} onChange={(v) => updateForm('telepon', v)} />
              <CompactField label="Username" value={form.username} onChange={(v) => updateForm('username', v)} />
              <CompactField label="Lokasi Kantor" value={p?.lokasi?.nama_lokasi || '-'} disabled />
              <CompactField label="Tanggal Lahir" value={formatDateInput(p?.tgl_lahir)} isDate disabled />
              <CompactField label="Alamat" value={form.alamat} isTextArea onChange={(v) => updateForm('alamat', v)} />
              <CompactField label="Tanggal Masuk Perusahaan" value={formatDateInput(p?.tgl_join)} isDate disabled />
              <CompactField label="Masa Kerja" value={calculateMasaKerja(p?.tgl_join)} disabled />
              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block">Role <span className="text-slate-300 normal-case tracking-normal font-bold">(read only)</span></label>
                <div className="flex flex-wrap gap-2">
                  {(p?.roles || []).map((role: string) => (
                    <span key={role} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-wider border border-indigo-100">
                      {role}
                    </span>
                  ))}
                </div>
              </div>
              <CompactField label="Gender" value={p?.gender || ''} isSelect disabled />
              <CompactField label="Dashboard" value={p?.is_admin || ''} disabled />
              <CompactField
                label="Status Pajak"
                value={form.status_pajak_id}
                isSelect
                options={statusPajakOptions.map(o => ({ value: o.id, label: o.name }))}
                onChange={(v) => updateForm('status_pajak_id', v)}
              />
              <CompactField label="Divisi" value={p?.jabatan?.nama_jabatan || '-'} disabled />
              <CompactField label="Masa Berlaku" value={p?.masa_berlaku || '-'} disabled />
            </div>
          </Section>

          {/* Documents Section */}
          <Section title="Identification & Documents" icon={CreditCard}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CompactField label="Nomor KTP" value={form.ktp} onChange={(v) => updateForm('ktp', v)} />
              <CompactField label="Nomor Kartu Keluarga" value={form.kartu_keluarga} onChange={(v) => updateForm('kartu_keluarga', v)} />
              <CompactField label="Nomor BPJS Kesehatan" value={form.bpjs_kesehatan} onChange={(v) => updateForm('bpjs_kesehatan', v)} />
              <CompactField label="Nomor BPJS Ketenagakerjaan" value={form.bpjs_ketenagakerjaan} onChange={(v) => updateForm('bpjs_ketenagakerjaan', v)} />
              <CompactField label="Nomor NPWP" value={form.npwp} onChange={(v) => updateForm('npwp', v)} />
              <CompactField label="Nomor SIM" value={form.sim} onChange={(v) => updateForm('sim', v)} />
              <CompactField label="NIP" value={form.no_pkwt} onChange={(v) => updateForm('no_pkwt', v)} />
              <CompactField label="Nomor Kontrak" value={form.no_kontrak} onChange={(v) => updateForm('no_kontrak', v)} />
              <CompactField label="Tanggal Mulai Kontrak" value={formatDateInput(p?.tanggal_mulai_pkwt)} isDate disabled />
              <CompactField label="Tanggal Berakhir Kontrak" value={formatDateInput(p?.tanggal_berakhir_pkwt)} isDate disabled />
              <CompactField label="Nomor Rekening" value={form.rekening} onChange={(v) => updateForm('rekening', v)} />
              <CompactField label="Nama Pemilik Rekening" value={form.nama_rekening} onChange={(v) => updateForm('nama_rekening', v)} />
            </div>
          </Section>

          {/* Salary Section */}
          <Section title="Salary Details" icon={Briefcase}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              <div className="space-y-6">
                <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest">Penjumlahan Gaji</h4>
                <SalaryField label="Gaji Pokok" value={formatCurrency(p?.gaji_pokok)} />
                <SalaryField label="Tunjangan Makan" value={formatCurrency(p?.tunjangan_makan)} unit="/ Hari" />
                <SalaryField label="Tunjangan Transport" value={formatCurrency(p?.tunjangan_transport)} unit="/ Hari" />
                <SalaryField label="Tunjangan BPJS Kesehatan" value={formatCurrency(p?.tunjangan_bpjs_kesehatan)} />
                <SalaryField label="Tunjangan BPJS Ketenagakerjaan" value={formatCurrency(p?.tunjangan_bpjs_ketenagakerjaan)} />
                <SalaryField label="Lembur" value={formatCurrency(p?.lembur)} unit="/ Jam" />
                <SalaryField label="Kehadiran" value={formatCurrency(p?.kehadiran)} />
                <SalaryField label="THR" value={formatCurrency(p?.thr)} />
                <SalaryField label="Bonus Pribadi" value={formatCurrency(p?.bonus_pribadi)} />
                <SalaryField label="Bonus Team" value={formatCurrency(p?.bonus_team)} />
                <SalaryField label="Bonus Jackpot" value={formatCurrency(p?.bonus_jackpot)} />
              </div>
              <div className="space-y-6">
                <h4 className="text-xs font-black text-rose-600 uppercase tracking-widest">Pengurangan Gaji</h4>
                <SalaryField label="Izin" value={formatCurrency(p?.izin)} unit="/ Hari" isDeduction />
                <SalaryField label="Terlambat" value={formatCurrency(p?.terlambat)} unit="/ Hari" isDeduction />
                <SalaryField label="Mangkir" value={formatCurrency(p?.mangkir)} unit="/ Hari" isDeduction />
                <SalaryField label="Saldo Kasbon" value={formatCurrency(p?.saldo_kasbon)} isDeduction />
                <SalaryField label="Potongan BPJS Kesehatan" value={formatCurrency(p?.potongan_bpjs_kesehatan)} isDeduction />
                <SalaryField label="Potongan BPJS Ketenagakerjaan" value={formatCurrency(p?.potongan_bpjs_ketenagakerjaan)} isDeduction />
              </div>
            </div>
          </Section>

          {/* Action Button */}
          <div className="flex justify-start">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-12 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black transition-all shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 disabled:opacity-70 flex items-center gap-3"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Section({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) {
  return (
    <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/30">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
          <Icon className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function CompactField({
  label,
  value,
  isFile,
  isSelect,
  options,
  isDate,
  isTextArea,
  disabled,
  onChange
}: {
  label: string,
  value: string,
  isFile?: boolean,
  isSelect?: boolean,
  options?: { value: string, label: string }[],
  isDate?: boolean,
  isTextArea?: boolean,
  disabled?: boolean,
  onChange?: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
        {label}
        {disabled && <span className="text-slate-300 normal-case tracking-normal font-bold ml-1">(read only)</span>}
      </label>
      <div className={cn(
        "relative flex items-center bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 transition-all",
        disabled ? "opacity-60 cursor-not-allowed bg-slate-100" : "focus-within:border-indigo-300 focus-within:bg-white focus-within:shadow-lg focus-within:shadow-indigo-500/5"
      )}>
        {isTextArea ? (
          <textarea
            className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none resize-none h-20"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            readOnly={disabled}
          />
        ) : isFile ? (
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-bold text-slate-400 italic">Choose File</span>
            <span className="text-xs font-bold text-slate-300">{value}</span>
          </div>
        ) : isSelect && options ? (
          <select
            className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={disabled}
          >
            <option value="">Pilih status</option>
            {options.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ) : (
          <input
            type={isDate ? "date" : "text"}
            className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            readOnly={disabled}
          />
        )}
        {isSelect && <ChevronRight className="w-4 h-4 text-slate-300 rotate-90" />}
      </div>
    </div>
  );
}

function CompactStat({ label, value, color, readOnly }: { label: string, value: string, color: string, readOnly?: boolean }) {
  return (
    <div className={cn(
      "flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100",
      readOnly && "opacity-60"
    )}>
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <span className={cn("text-sm font-black", color)}>{value}</span>
    </div>
  );
}

function SalaryField({ label, value, unit = "/ Bulan", isDeduction = false }: { label: string, value: string, unit?: string, isDeduction?: boolean }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">{label}</label>
      <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl overflow-hidden">
        <div className="flex-1 px-4 py-3 text-sm font-bold text-slate-700">
          {value}
        </div>
        <div className={cn(
          "px-4 py-3 text-[10px] font-black uppercase tracking-widest border-l border-slate-100",
          isDeduction ? "bg-rose-50 text-rose-500" : "bg-indigo-50 text-indigo-600"
        )}>
          {unit}
        </div>
      </div>
    </div>
  );
}

function StatSummaryCard({ label, value, subValue, icon: Icon, color }: { label: string, value: string, subValue: string, icon: any, color: 'indigo' | 'emerald' | 'blue' | 'purple' }) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100"
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/10"
    >
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border", colors[color])}>
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h4 className="text-xl font-black text-slate-900 tracking-tight">{value}</h4>
      <p className="text-[10px] font-bold text-slate-300 mt-1 uppercase tracking-tighter">{subValue}</p>
    </motion.div>
  );
}

function PremiumCompactStat({ label, value, unit, icon: Icon, color }: { label: string, value: string, unit: string, icon: any, color: 'emerald' | 'slate' | 'amber' | 'rose' }) {
  const colors = {
    emerald: "text-emerald-500 bg-emerald-50",
    slate: "text-slate-500 bg-slate-50",
    amber: "text-amber-500 bg-amber-50",
    rose: "text-rose-500 bg-rose-50"
  };

  return (
    <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-white transition-all hover:shadow-lg hover:shadow-slate-100 group">
      <div className="flex items-center gap-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-6", colors[color])}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">{label}</span>
      </div>
      <div className="text-right">
        <span className={cn("text-lg font-black block leading-none", colors[color].split(' ')[0])}>{value}</span>
        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{unit}</span>
      </div>
    </div>
  );
}
