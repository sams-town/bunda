import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  Camera,
  Clock,
  Fingerprint,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  Loader2,
  User as UserIcon,
  ChevronLeft,
  X,
  Trash2,
  RefreshCw,
  Map as MapIcon,
} from 'lucide-react';
import { cn, formatPhotoUrl } from '../lib/utils';
import { useToast } from './Toast';
import { useNavigate } from 'react-router-dom';

interface ShiftMapping {
  id: string;
  user_id: string;
  shift_id: string;
  tanggal: string;
  jam_absen: string | null;
  jam_pulang: string | null;
  status_absen: string;
  shifts?: {
    nama_shift: string;
    jam_masuk: string;
    jam_keluar: string;
  } | null;
  users?: {
    name: string;
    lokasi?: {
      nama_lokasi: string;
      lat_kantor: string;
      long_kantor: string;
      radius: string;
    } | null;
  } | null;
}



export function MobileAbsenPage() {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [userData, setUserData] = useState<any>(null);
  const [todayMapping, setTodayMapping] = useState<ShiftMapping | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [keterangan, setKeterangan] = useState('');
  const [locationState, setLocationState] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAbsenType, setPendingAbsenType] = useState<'masuk' | 'pulang' | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const { addToast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        console.warn("No user found in localStorage, redirecting to login...");
        navigate('/login');
        setLoading(false);
        return;
      }

      const user = JSON.parse(userStr);
      setUserData(user);
      
      if (user.id) {
        fetchTodayMapping(user.id);
      } else {
        console.error("User object found but has no ID:", user);
        setLoading(false);
      }
    } catch (err) {
      console.error("Error initializing MobileAbsenPage:", err);
      setLoading(false);
    }

    return () => clearInterval(timer);
  }, [navigate]);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const fetchTodayMapping = async (userId: string, silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      
      const now = new Date();
      const todayStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toLocaleDateString('en-CA');
      
      const res = await fetch(
        `${import.meta.env.VITE_API_MEANDPAY}/absensi_user_history/${userId}/${yesterdayStr}/${todayStr}`, 
        { 
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          signal: AbortSignal.timeout(7000),
          cache: 'no-store'
        }
      );
      
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const json = await res.json();
      
      if (json.success && json.data) {
        const openNightShift = json.data.find((s: any) => {
          if (s.jam_absen && !s.jam_pulang && s.shifts) {
            const { jam_masuk, jam_keluar } = s.shifts;
            const isNightShift = jam_keluar < jam_masuk;
            if (isNightShift) {
              const [h, m] = s.jam_absen.split(':').map(Number);
              const datePart = s.tanggal.split('T')[0];
              const [year, month, day] = datePart.split('-').map(Number);
              const checkInTime = new Date(year, month - 1, day, h, m);
              const elapsedHours = (new Date().getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
              return elapsedHours > 0 && elapsedHours < 18;
            }
          }
          return false;
        });

        let activeShift = openNightShift;
        if (!activeShift) {
          activeShift = json.data.find((s: any) => {
            if (!s.tanggal) return false;
            const shiftDate = s.tanggal.split('T')[0];
            return shiftDate === todayStr;
          }) || json.data[0];
        }

        if (activeShift) {
          setTodayMapping(activeShift);
          setError(null);
        } else {
          console.warn("Shift match failed for today:", todayStr);
          setTodayMapping(null);
        }
      } else {
        setError(json.message || "Gagal memuat data shift.");
        setTodayMapping(null);
      }
    } catch (err: any) {
      console.error("Error fetching today mapping:", err);
      setError("Gagal terhubung ke server. Pastikan koneksi internet aktif.");
      setTodayMapping(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    if (!userData?.id) return;
    setRefreshing(true);
    fetchTodayMapping(userData.id, true);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
  };

  const [currentDistance, setCurrentDistance] = useState<number | null>(null);

  const getLocation = () => {
    if (!navigator.geolocation)
      return addToast({ type: 'error', title: 'Tidak Didukung', message: 'Geolocation tidak tersedia di browser ini.' });
    
    addToast({ type: 'loading', title: 'Mencari GPS...', message: 'Sedang mengambil koordinat Anda' });
    
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocationState({ lat, lng });
        
        // Calculate distance if office location is available
        if (todayMapping?.users?.lokasi?.lat_kantor && todayMapping?.users?.lokasi?.long_kantor) {
            const dist = calculateDistance(
                lat, lng, 
                parseFloat(todayMapping.users.lokasi.lat_kantor), 
                parseFloat(todayMapping.users.lokasi.long_kantor)
            );
            setCurrentDistance(Math.round(dist));
        }

        addToast({ type: 'success', title: 'Lokasi Terkunci', message: 'Koordinat berhasil dideteksi.' });
        // Reverse geocode
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=id`,
            { headers: { 'Accept-Language': 'id' } }
          );
          const json = await res.json();
          const addr = json.display_name || null;
          setAddress(addr);
        } catch {
          setAddress(null);
        }
      },
      (error) => {
        let msg = "Gagal mengambil lokasi.";
        if (error.code === 1) msg = "Izin lokasi ditolak. Silakan aktifkan GPS/Izin lokasi di browser.";
        else if (error.code === 2) msg = "Lokasi tidak tersedia.";
        else if (error.code === 3) msg = "Waktu permintaan lokasi habis.";
        
        addToast({ type: 'error', title: 'GPS Gagal', message: msg });
        console.error("Geolocation error:", error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const openCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(mediaStream);
      setIsCameraOpen(true);
    } catch {
      addToast({ type: 'error', title: 'Kamera Gagal', message: 'Tidak dapat mengakses kamera.' });
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      setPhoto(canvas.toDataURL('image/jpeg', 0.85));
      closeCamera();
    }
  };

  const closeCamera = () => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setIsCameraOpen(false);
  };

  const handleSubmit = (type: 'masuk' | 'pulang') => {
    if (!locationState) return addToast({ type: 'info', title: 'Lokasi Diperlukan', message: 'Klik tombol Lokasi terlebih dahulu.' });
    if (!photo) return addToast({ type: 'info', title: 'Foto Diperlukan', message: 'Ambil selfie terlebih dahulu.' });
    
    setPendingAbsenType(type);
    setShowConfirmModal(true);
  };

  const executeSubmit = async (type: 'masuk' | 'pulang') => {
    if (!locationState) return addToast({ type: 'info', title: 'Lokasi Diperlukan', message: 'Klik tombol Lokasi terlebih dahulu.' });
    if (!photo) return addToast({ type: 'info', title: 'Foto Diperlukan', message: 'Ambil selfie terlebih dahulu.' });

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('user_id', userData.id);
      formData.append('tanggal', new Date().toLocaleDateString('en-CA'));

      const blob = await (await fetch(photo)).blob();

      formData.append('tipe_absen', type);
      formData.append('lat', locationState.lat.toString());
      formData.append('long', locationState.lng.toString());
      formData.append('foto_wajah', blob, 'selfie.jpg');
      formData.append('keterangan', keterangan);

      const res = await fetch(
        `${import.meta.env.VITE_API_MEANDPAY}/absensi_wajah`,
        { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, body: formData }
      );

      const json = await res.json();
      if (json.success) {
        addToast({ type: 'success', title: 'Berhasil!', message: `Absen ${type} dicatat.` });
        fetchTodayMapping(userData.id, true);
        setPhoto(null);
        setLocationState(null);
        setKeterangan('');
      } else {
        addToast({ type: 'error', title: 'Gagal', message: json.message || 'Terjadi kesalahan.' });
      }
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Terjadi kesalahan sistem.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const timeStr = time.toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit' });
  const secStr = time.toLocaleTimeString('id-ID', { second: '2-digit' });
  const dateStr = time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const isCheckedIn = todayMapping?.jam_absen;
  const isCheckedOut = todayMapping?.jam_pulang;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30">
            <Fingerprint className="w-8 h-8 text-white animate-pulse" />
          </div>
          <p className="text-white/70 text-xs font-black uppercase tracking-widest">Memuat Sistem Absensi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans bg-[#F0F4FF] pb-28">
      {/* ─── HERO HEADER ─── */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 pt-16 pb-36 px-6 overflow-hidden">
        {/* Animated background elements */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" 
        />
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-fuchsia-400/20 rounded-full blur-3xl" />

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between mb-10">
          <button
            onClick={() => navigate('/beranda')}
            className="w-12 h-12 bg-white/15 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 active:scale-90 transition-all shadow-lg"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>

          <div className="bg-white/15 backdrop-blur-xl px-6 py-2.5 rounded-2xl border border-white/20">
            <h1 className="text-white text-sm font-black uppercase tracking-[0.2em]">Sistem Absensi</h1>
          </div>

          <button
            onClick={handleRefresh}
            className="w-12 h-12 bg-white/15 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 active:scale-90 transition-all shadow-lg"
          >
            <RefreshCw className={cn('w-5 h-5 text-white', refreshing && 'animate-spin')} />
          </button>
        </div>

        {/* User identity */}
        <div className="relative z-10 flex items-center gap-5 mb-12">
          <div className="relative">
            <div className="w-16 h-16 rounded-[1.5rem] bg-white/20 backdrop-blur-md flex items-center justify-center border-2 border-white/40 overflow-hidden shrink-0 shadow-2xl">
              {userData?.foto_karyawan ? (
                <img src={formatPhotoUrl(userData.foto_karyawan)} className="w-full h-full object-cover" alt="" />
              ) : (
                <UserIcon className="text-white w-8 h-8" />
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 border-2 border-indigo-600 rounded-full shadow-lg" />
          </div>
          <div>
            <p className="text-white/60 text-[11px] font-black uppercase tracking-[0.2em] mb-0.5">Pegawai Aktif</p>
            <h2 className="text-white text-xl font-black tracking-tight leading-none mb-1.5">{userData?.name || 'Pengguna'}</h2>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white/10 backdrop-blur-md rounded-lg border border-white/10">
              <p className="text-indigo-100 text-[9px] font-black uppercase tracking-widest">{userData?.jabatan?.nama_jabatan || 'Staff'}</p>
            </div>
          </div>
        </div>

        {/* Live Clock */}
        <div className="relative z-10 text-center">
          <div className="inline-block relative">
            <p className="text-white text-7xl font-black tracking-tighter tabular-nums drop-shadow-[0_10px_25px_rgba(0,0,0,0.2)] flex items-baseline justify-center">
              {timeStr}
              <span className="text-2xl text-white/30 ml-2 font-bold select-none tracking-normal">:{secStr}</span>
            </p>
          </div>
          <p className="text-white/60 text-xs font-black mt-4 uppercase tracking-[0.3em] flex items-center justify-center gap-3">
            <span className="w-8 h-px bg-white/20" />
            {dateStr}
            <span className="w-8 h-px bg-white/20" />
          </p>
        </div>
      </div>

      {/* ─── SHIFT CARD (floating) ─── */}
      <div className="px-5 -mt-16 relative z-20 space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] p-6 shadow-2xl shadow-indigo-500/10 border border-white"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
                <Calendar className="w-4 h-4 text-indigo-500" />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Jadwal Hari Ini</p>
                <p className="text-sm font-black text-slate-800 tracking-tight">
                  {todayMapping?.shifts?.nama_shift || 'Tidak Ada Shift'}
                </p>
              </div>
            </div>
            <span
              className={cn(
                'px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider',
                todayMapping ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-500 border border-rose-100'
              )}
            >
              {todayMapping ? 'Aktif' : 'Off'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative overflow-hidden bg-slate-50/50 rounded-3xl p-5 border border-slate-100 text-center group">
              <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/5 rounded-full -mr-6 -mt-6 transition-transform group-hover:scale-150" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Clock In</p>
              <p className="text-2xl font-black text-slate-900 tabular-nums tracking-tight">{todayMapping?.shifts?.jam_masuk || '--:--'}</p>
              {todayMapping?.jam_absen ? (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500 text-white rounded-full">
                   <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                   <span className="text-[9px] font-black uppercase tracking-widest">{todayMapping.jam_absen}</span>
                </div>
              ) : (
                <p className="text-[9px] font-black text-slate-300 mt-3 uppercase tracking-widest">Belum Absen</p>
              )}
            </div>
            <div className="relative overflow-hidden bg-slate-50/50 rounded-3xl p-5 border border-slate-100 text-center group">
              <div className="absolute top-0 right-0 w-12 h-12 bg-rose-500/5 rounded-full -mr-6 -mt-6 transition-transform group-hover:scale-150" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Clock Out</p>
              <p className="text-2xl font-black text-slate-900 tabular-nums tracking-tight">{todayMapping?.shifts?.jam_keluar || '--:--'}</p>
              {todayMapping?.jam_pulang ? (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500 text-white rounded-full">
                   <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                   <span className="text-[9px] font-black uppercase tracking-widest">{todayMapping.jam_pulang}</span>
                </div>
              ) : (
                <p className="text-[9px] font-black text-slate-300 mt-3 uppercase tracking-widest">Belum Pulang</p>
              )}
            </div>
          </div>

          {todayMapping?.users?.lokasi && (
            <div className={cn(
              "mt-4 flex flex-col gap-2 px-5 py-4 rounded-3xl border transition-all",
              currentDistance !== null && todayMapping.users.lokasi.radius && currentDistance > parseFloat(todayMapping.users.lokasi.radius)
                ? "bg-rose-50 border-rose-100" 
                : "bg-blue-50 border-blue-100"
            )}>
              <div className="flex items-center gap-2">
                <MapIcon className={cn("w-4 h-4 shrink-0", currentDistance !== null && todayMapping.users.lokasi.radius && currentDistance > parseFloat(todayMapping.users.lokasi.radius) ? "text-rose-500" : "text-blue-500")} />
                <p className={cn("text-xs font-black truncate", currentDistance !== null && todayMapping.users.lokasi.radius && currentDistance > parseFloat(todayMapping.users.lokasi.radius) ? "text-rose-700" : "text-blue-700")}>
                    {todayMapping.users.lokasi.nama_lokasi}
                </p>
                <span className="ml-auto text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                    Radius: {todayMapping.users.lokasi.radius}m
                </span>
              </div>
              
              {currentDistance !== null && (
                <div className="flex items-center justify-between pt-1 border-t border-black/5 mt-1">
                   <p className="text-[10px] font-bold text-slate-500">Jarak Anda Saat Ini:</p>
                   <p className={cn(
                     "text-sm font-black tabular-nums",
                     todayMapping.users.lokasi.radius && currentDistance > parseFloat(todayMapping.users.lokasi.radius) ? "text-rose-600" : "text-emerald-600"
                   )}>
                     {currentDistance} meter
                   </p>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* ─── ACTION PANEL ─── */}
        <AnimatePresence mode="wait">
          {error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-50 p-8 rounded-[3rem] text-center border border-amber-100 space-y-4"
            >
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-amber-100">
                <RefreshCw className="w-8 h-8 text-amber-500" />
              </div>
              <div>
                <p className="font-black text-amber-900 text-lg">Masalah Koneksi</p>
                <p className="text-xs text-amber-600/70 font-bold leading-relaxed mt-1">
                  {error}
                </p>
              </div>
              <button 
                onClick={handleRefresh}
                className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-500/20"
              >
                Coba Lagi
              </button>
            </motion.div>
          ) : !todayMapping ? (
            <motion.div
              key="no-shift"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden bg-white/40 backdrop-blur-xl p-8 rounded-[3rem] text-center border border-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] space-y-6"
            >
              {/* Decorative circle */}
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl" />
              
              <div className="relative">
                <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner border border-rose-100 group">
                  <ShieldAlert className="w-10 h-10 text-rose-500 group-hover:scale-110 transition-transform duration-500" />
                </div>
                {/* Ping animation */}
                <div className="absolute top-0 right-1/2 translate-x-10 w-4 h-4 bg-rose-500 rounded-full border-4 border-white animate-ping" />
              </div>

              <div className="space-y-2">
                <h3 className="font-black text-slate-900 text-xl tracking-tight">Shift Tidak Ditemukan</h3>
                <p className="text-[13px] text-slate-500 font-bold leading-relaxed px-4">
                  Sistem tidak menemukan jadwal kerja aktif untuk akun Anda pada hari ini.
                </p>
              </div>

              <div className="pt-2">
                <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100/50 mb-6">
                  <p className="text-[11px] font-black text-rose-700 leading-relaxed">
                    "Silakan hubungi administrator HRD untuk mendaftarkan jadwal shift Anda."
                  </p>
                </div>

                <button 
                  onClick={() => window.open('https://wa.me/628123456789', '_blank')}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <RefreshCw className="w-4 h-4" /> Hubungi Admin
                </button>
              </div>
            </motion.div>
          ) : isCheckedOut ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] p-10 text-center border border-slate-100 shadow-xl shadow-slate-200/10 space-y-6"
            >
              <div className="relative mx-auto w-20 h-20">
                <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-25 animate-pulse rounded-full" />
                <div className="relative w-20 h-20 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center border border-emerald-100">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Terima Kasih!</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  Aktivitas Absensi Hari Ini Selesai
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-center">
                  <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Clock In</p>
                  <p className="text-lg font-black text-indigo-700 tabular-nums">{todayMapping.jam_absen}</p>
                </div>
                <div className="flex-1 p-4 bg-rose-50 rounded-2xl border border-rose-100 text-center">
                  <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest">Clock Out</p>
                  <p className="text-lg font-black text-rose-700 tabular-nums">{todayMapping.jam_pulang}</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="action" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              {/* Status badge if checked in */}
              {isCheckedIn && (
                <div className="bg-indigo-50 px-6 py-4 rounded-2xl border border-indigo-100 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Sudah Absen Masuk</p>
                    <p className="text-xl font-black text-indigo-700 tabular-nums">{todayMapping.jam_absen}</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-indigo-300" />
                </div>
              )}

              {/* Camera & Location buttons */}
              <div className="grid grid-cols-2 gap-4">
                <ActionButton
                  icon={Camera}
                  label={photo ? 'Foto Siap' : 'Ambil Selfie'}
                  active={!!photo}
                  onClick={openCamera}
                />
                <ActionButton
                  icon={MapPin}
                  label={locationState ? 'Lokasi OK' : 'Cek Lokasi'}
                  active={!!locationState}
                  onClick={getLocation}
                />
              </div>

              {/* Checklist */}
              <div className="bg-white rounded-2xl border border-slate-100 px-5 py-4 shadow-sm space-y-3">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  Live Requirement
                </p>
                <CheckItem label="Foto selfie diambil" done={!!photo} />
                <CheckItem label="Lokasi terkunci" done={!!locationState} />
                <CheckItem label="Koneksi internet stabil" done={true} />
              </div>

              {/* Address Display */}
              <AnimatePresence>
                {address && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="bg-indigo-50/50 px-5 py-4 rounded-2xl border border-indigo-100/50"
                  >
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                       <MapIcon className="w-3 h-3" /> Alamat Terdeteksi
                    </p>
                    <p className="text-[11px] font-bold text-indigo-950 leading-relaxed italic">
                      "{address}"
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Photo preview */}
              <AnimatePresence>
                {photo && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full aspect-video rounded-[2rem] overflow-hidden border-2 border-slate-100 shadow-xl group"
                  >
                    <img src={photo} className="w-full h-full object-cover" alt="Selfie" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => setPhoto(null)}
                        className="w-12 h-12 bg-rose-500 text-white rounded-xl flex items-center justify-center shadow-xl active:scale-90 transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <span className="absolute top-3 left-3 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow">
                      Selfie Ready
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Keterangan */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Keterangan {isCheckedIn ? 'Pulang' : 'Masuk'}
                </label>
                <textarea
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder={isCheckedIn ? 'Tugas selesai, semua target terpenuhi.' : 'Mulai bekerja, kondisi sehat.'}
                  className="w-full px-5 py-4 bg-white border border-slate-100 rounded-[1.5rem] text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all min-h-[90px] resize-none shadow-sm"
                />
              </div>

              {/* ─── WARNING BANNER ─── */}
              <AnimatePresence>
                {(!photo || !locationState) && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3"
                  >
                    <div className="w-7 h-7 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldAlert className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-amber-700 uppercase tracking-wider mb-1">
                        Belum Lengkap
                      </p>
                      <div className="space-y-1">
                        {!photo && (
                          <p className="text-[11px] font-bold text-amber-600 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                            Selfie belum diambil
                          </p>
                        )}
                        {!locationState && (
                          <p className="text-[11px] font-bold text-amber-600 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                            Lokasi belum dikunci
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main submit button */}
              <motion.button
                whileTap={{ scale: 0.96 }}
                disabled={isSubmitting}
                onClick={() => handleSubmit(isCheckedIn ? 'pulang' : 'masuk')}
                className={cn(
                  'w-full py-7 rounded-[2rem] font-black text-white text-lg tracking-[0.15em] uppercase shadow-2xl transition-all flex items-center justify-center gap-4 border-b-4 active:border-b-0 disabled:opacity-60',
                  isCheckedIn
                    ? 'bg-gradient-to-r from-rose-500 to-rose-600 border-rose-700 shadow-rose-500/25'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-600 border-emerald-700 shadow-emerald-500/25'
                )}
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin w-7 h-7" />
                ) : (
                  <>
                    <Fingerprint className="w-7 h-7" />
                    {isCheckedIn ? 'Absen Pulang' : 'Absen Masuk'}
                  </>
                )}
              </motion.button>

              <p className="text-center text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em]">
                © 2026 Premium Mobile Attendance v3.0
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── CAMERA FULLSCREEN ─── */}
      <AnimatePresence>
        {isCameraOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black flex flex-col"
          >
            <div className="flex items-center justify-between px-6 pt-14 pb-6">
              <span className="text-white text-xs font-black uppercase tracking-widest bg-white/10 px-4 py-2 rounded-full border border-white/20">
                Verifikasi Wajah
              </span>
              <button
                onClick={closeCamera}
                className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center border border-white/20"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center px-6">
              <div className="relative w-full max-w-sm aspect-square rounded-[3rem] overflow-hidden border-4 border-white/20 shadow-[0_0_60px_rgba(99,102,241,0.3)]">
                <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-6 border-2 border-dashed border-white/30 rounded-[2.5rem] pointer-events-none" />
                <div className="absolute inset-0 border-[3rem] border-black/30 pointer-events-none" />
              </div>
            </div>

            <div className="pb-16 px-6">
              <button
                onClick={capturePhoto}
                className="w-full h-20 bg-white text-indigo-700 rounded-full flex items-center justify-center gap-4 shadow-2xl active:scale-95 transition-all"
              >
                <div className="w-14 h-14 rounded-full border-4 border-indigo-200 flex items-center justify-center">
                  <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </div>
                <span className="font-black text-indigo-700 tracking-tight">Ambil Foto</span>
              </button>
              <p className="text-center text-white/30 text-[10px] font-bold uppercase tracking-widest mt-4">
                Pastikan cahaya cukup & wajah terlihat jelas
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── CONFIRMATION MODAL ─── */}
      <AnimatePresence>
        {showConfirmModal && pendingAbsenType && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-6"
            >
              <div className="mx-auto w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100 animate-bounce">
                <ShieldAlert className="w-8 h-8 text-amber-500" />
              </div>
              <div className="space-y-2">
                <h3 className="font-black text-slate-900 text-xl tracking-tight">Konfirmasi Absensi</h3>
                <p className="text-xs text-slate-500 font-bold leading-relaxed px-2">
                  Apakah Anda yakin ingin melakukan <span className={cn("font-extrabold uppercase", pendingAbsenType === 'masuk' ? "text-emerald-600" : "text-rose-600")}>Absen {pendingAbsenType}</span> sekarang?
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setPendingAbsenType(null);
                  }}
                  className="py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={async () => {
                    setShowConfirmModal(false);
                    if (pendingAbsenType) {
                      await executeSubmit(pendingAbsenType);
                    }
                  }}
                  className={cn(
                    "py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg",
                    pendingAbsenType === 'masuk' 
                      ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20" 
                      : "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20"
                  )}
                >
                  Ya, Absen
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center py-7 rounded-[2rem] transition-all relative overflow-hidden active:scale-95 border-2',
        active
          ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-600/20'
          : 'bg-white border-slate-100 text-slate-400 shadow-sm'
      )}
    >
      <div
        className={cn(
          'w-12 h-12 rounded-[1rem] flex items-center justify-center mb-3 transition-all',
          active ? 'bg-white/20' : 'bg-slate-50'
        )}
      >
        <Icon className={cn('w-6 h-6', active ? 'text-white' : 'text-slate-400')} />
      </div>
      <span className="font-black uppercase tracking-widest text-[10px]">{label}</span>
      {active && (
        <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-indigo-500 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
      )}
    </button>
  );
}

function CheckItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'w-5 h-5 rounded-full flex items-center justify-center transition-all shrink-0',
          done ? 'bg-emerald-500 text-white' : 'bg-slate-200'
        )}
      >
        <CheckCircle2 className="w-3 h-3" />
      </div>
      <span className={cn('text-xs font-bold', done ? 'text-slate-700' : 'text-slate-400')}>{label}</span>
    </div>
  );
}
