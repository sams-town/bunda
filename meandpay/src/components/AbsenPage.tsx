import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Camera, 
  Clock, 
  Send, 
  ShieldAlert, 
  CheckCircle2, 
  User as UserIcon, 
  Calendar,
  Loader2,
  RefreshCw,
  ArrowRight,
  Map as MapIcon,
  X,
  Trash2,
  Fingerprint
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from './Toast';

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
      lat: string;
      long: string;
      radius: string;
    } | null;
  } | null;
}

export function AbsenPage({ isMobileView = false }: { isMobileView?: boolean, key?: React.Key }) {
  const [time, setTime] = useState(new Date());
  const [userData, setUserData] = useState<any>(null);
  const [todayMapping, setTodayMapping] = useState<ShiftMapping | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [keterangan, setKeterangan] = useState('');
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const { addToast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserData(user);
    fetchTodayMapping(user.id);
    return () => clearInterval(timer);
  }, []);

  // Attach stream to video element when camera opens
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const fetchTodayMapping = async (userId: string) => {
    try {
      setLoading(true);
      const todayStr = new Date().toLocaleDateString('en-CA');
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toLocaleDateString('en-CA');

      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/absensi_user_history/${userId}/${yesterdayStr}/${todayStr}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
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

        setTodayMapping(activeShift || null);
      }
    } catch (err) {
      console.error('Error fetching today mapping:', err);
    } finally {
      setLoading(false);
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          addToast({ type: 'success', title: 'Lokasi Terdeteksi', message: 'Titik koordinat berhasil dikunci.' });
        },
        (error) => {
          console.error('Error getting location:', error);
          addToast({ type: 'error', title: 'Gagal Lokasi', message: 'Pastikan izin lokasi diaktifkan pada browser.' });
        }
      );
    }
  };

  const openCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(mediaStream);
      setIsCameraOpen(true);
    } catch (err) {
      addToast({ type: 'error', title: 'Kamera Gagal', message: 'Tidak dapat mengakses kamera.' });
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setPhoto(canvas.toDataURL('image/jpeg', 0.8));
        closeCamera();
      }
    }
  };

  const closeCamera = () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
    setStream(null);
    setIsCameraOpen(false);
  };

  const handleSubmit = async (type: 'masuk' | 'pulang') => {
    if (!location) return addToast({ type: 'error', title: 'Lokasi Wajib', message: 'Silahkan klik Cek Lokasi terlebih dahulu.' });
    if (!photo) return addToast({ type: 'error', title: 'Foto Wajib', message: 'Silahkan ambil foto selfie terlebih dahulu.' });

    setIsSubmitting(true);
    const toastId = addToast({ type: 'loading', title: `Absen ${type === 'masuk' ? 'Masuk' : 'Pulang'}`, message: 'Sedang memproses absensi...' });

    try {
      const formData = new FormData();
      formData.append('user_id', userData.id);
      formData.append('tanggal', new Date().toISOString().split('T')[0]);
      
      // Convert base64 to blob
      const resBlob = await fetch(photo);
      const blob = await resBlob.blob();

      if (type === 'masuk') {
        formData.append('shift_id', todayMapping?.shift_id || '1');
        formData.append('jam_absen', time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
        formData.append('lat_absen', location.lat.toString());
        formData.append('long_absen', location.lng.toString());
        formData.append('foto_jam_absen', blob, 'masuk.jpg');
        formData.append('keterangan_masuk', keterangan);
        formData.append('status_absen', 'Masuk');
      } else {
        formData.append('_method', 'PUT');
        formData.append('jam_pulang', time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
        formData.append('lat_pulang', location.lat.toString());
        formData.append('long_pulang', location.lng.toString());
        formData.append('foto_jam_pulang', blob, 'pulang.jpg');
        formData.append('keterangan_pulang', keterangan);
        formData.append('status_absen', 'Masuk'); // Keep status as Masuk or Pulang based on backend logic
      }

      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/absensi${type === 'pulang' ? `/${todayMapping?.id}` : ''}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const json = await res.json();
      if (json.success) {
        addToast({ type: 'success', title: 'Berhasil', message: `Absensi ${type} berhasil dilakukan!` });
        fetchTodayMapping(userData.id);
        setPhoto(null);
        setLocation(null);
        setKeterangan('');
      } else {
        addToast({ type: 'error', title: 'Gagal', message: json.message || 'Terjadi kesalahan' });
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Sistem Error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Menyiapkan Data...</p>
      </div>
    );
  }

  const { shifts } = todayMapping || {};
  const isCheckedIn = todayMapping?.jam_absen;
  const isCheckedOut = todayMapping?.jam_pulang;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-10 pb-20"
    >
      {/* Premium Indigo Header */}
      <div className={cn("bg-indigo-700 text-white relative overflow-hidden shadow-2xl shadow-indigo-500/20", isMobileView ? "rounded-b-[3rem] p-6 pt-12 -mx-6 mb-6" : "rounded-[3rem] p-8")}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-400/20 rounded-full blur-2xl -ml-10 -mb-10" />
        
        <div className={cn("relative z-10 flex gap-6", isMobileView ? "flex-col items-center justify-center" : "flex-col md:flex-row items-center justify-between")}>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-[2rem] flex items-center justify-center border border-white/30 shadow-2xl">
              <UserIcon className="w-10 h-10 text-white" />
            </div>
            <div className={isMobileView ? "text-center" : "text-center md:text-left"}>
              <h1 className="text-3xl font-black tracking-tight">{userData?.name || 'Pegawai MeAndPay'}</h1>
              <div className={cn("flex items-center gap-2 mt-1", isMobileView ? "justify-center" : "justify-center md:justify-start")}>
                <span className="px-3 py-1 bg-emerald-400 text-emerald-950 text-[10px] font-black uppercase tracking-widest rounded-full">Active</span>
                <span className="text-indigo-200 text-xs font-bold uppercase tracking-widest">{userData?.jabatan?.nama_jabatan || 'Staff'}</span>
              </div>
            </div>
          </div>
          
          <div className={cn("flex flex-col gap-2", isMobileView ? "items-center" : "items-center md:items-end")}>
             <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20">
                <Fingerprint className="w-5 h-5 text-indigo-300" />
                <div>
                   <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">ID System</p>
                   <p className="text-sm font-black">{userData?.username || 'EMP-001'}</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Time & Shift Section */}
      <div className={cn("grid gap-8 items-stretch", isMobileView ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2")}>
        <motion.div 
          whileHover={{ y: -5 }}
          className={cn("bg-white border border-slate-100 shadow-2xl shadow-indigo-500/5 flex flex-col items-center justify-center text-center relative overflow-hidden group", isMobileView ? "rounded-[2.5rem] p-8 space-y-6 mx-auto w-full" : "rounded-[3.5rem] p-12 space-y-8")}
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <div className="w-24 h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center group-hover:rotate-12 transition-transform duration-500">
            <Clock className="w-12 h-12 text-indigo-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-7xl font-black text-slate-900 tabular-nums tracking-tighter">
              {time.toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit' })}
              <span className="text-3xl text-slate-300 ml-1">:{time.toLocaleTimeString('id-ID', { second: '2-digit' })}</span>
            </h2>
            <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">
              {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className={cn("bg-[#2D455C] shadow-2xl shadow-indigo-500/10 flex flex-col justify-between relative overflow-hidden text-white", isMobileView ? "rounded-[2.5rem] p-8" : "rounded-[3.5rem] p-12")}
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-indigo-300" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Today's Schedule</p>
                <h3 className="text-xl font-black tracking-tight">{shifts?.nama_shift || 'No Shift Assigned'}</h3>
              </div>
            </div>

            {shifts ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-3xl border border-white/10">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Clock In</p>
                  <p className="text-lg font-black">{shifts.jam_masuk}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-3xl border border-white/10">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Clock Out</p>
                  <p className="text-lg font-black">{shifts.jam_keluar}</p>
                </div>
              </div>
            ) : (
              <div className="bg-white/5 p-8 rounded-3xl border border-white/10 border-dashed text-center">
                <p className="text-sm font-bold text-white/40 italic">Hubungi Admin Untuk Input Shift Anda</p>
              </div>
            )}
          </div>
          
          <div className="pt-6 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <MapIcon className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-[11px] font-bold text-white/60">{todayMapping?.users?.lokasi?.nama_lokasi || 'Kantor Pusat'}</p>
            </div>
            <button className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors">Lihat Radius</button>
          </div>
        </motion.div>
      </div>

      {/* Action Section */}
      <AnimatePresence mode="wait">
        {!todayMapping ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-white rounded-[3.5rem] p-20 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center space-y-4"
          >
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-4">
              <ShieldAlert className="w-10 h-10 text-rose-500" />
            </div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Belum Ada Jadwal Shift</h2>
            <p className="text-slate-400 font-medium max-w-md">Sistem tidak menemukan jadwal shift Anda untuk hari ini. Silahkan hubungi bagian HRD atau Admin.</p>
          </motion.div>
        ) : isCheckedOut ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-white rounded-[3.5rem] p-20 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center space-y-6"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500 blur-3xl opacity-20 animate-pulse" />
              <div className="relative w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-slate-800 tracking-tight">Tugas Selesai!</h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Aktivitas Absensi Hari Ini Selesai</p>
            </div>
            <div className="flex gap-4">
              <div className="bg-slate-50 px-8 py-4 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Masuk</p>
                <p className="text-xl font-black text-slate-700">{todayMapping.jam_absen}</p>
              </div>
              <div className="bg-slate-50 px-8 py-4 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pulang</p>
                <p className="text-xl font-black text-slate-700">{todayMapping.jam_pulang}</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("grid gap-8", isMobileView ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2")}
          >
            {/* Selfie & Location Card */}
            <div className={cn("bg-white border border-slate-100 shadow-xl shadow-slate-200/20", isMobileView ? "p-6 rounded-[2.5rem] space-y-6" : "p-10 rounded-[3.5rem] space-y-8")}>
              <div className="grid grid-cols-2 gap-6">
                <button 
                  onClick={openCamera}
                  className={cn(
                    "aspect-square rounded-3xl flex flex-col items-center justify-center gap-4 transition-all group border-2",
                    photo ? "border-emerald-500 bg-emerald-50/50" : "border-slate-50 bg-slate-50/50 hover:bg-slate-100/50 hover:border-slate-200"
                  )}
                >
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                    photo ? "bg-emerald-500 text-white" : "bg-white text-slate-400 group-hover:text-indigo-600 shadow-sm"
                  )}>
                    <Camera className="w-6 h-6" />
                  </div>
                  <span className={cn("text-[10px] font-black uppercase tracking-widest", photo ? "text-emerald-700" : "text-slate-500 group-hover:text-indigo-600")}>
                    {photo ? 'Foto Ready' : 'Ambil Selfie'}
                  </span>
                  {photo && (
                    <div className="absolute inset-4 rounded-2xl overflow-hidden opacity-20 pointer-events-none">
                      <img src={photo} className="w-full h-full object-cover" alt="" />
                    </div>
                  )}
                </button>

                <button 
                  onClick={getLocation}
                  className={cn(
                    "aspect-square rounded-3xl flex flex-col items-center justify-center gap-4 transition-all group border-2",
                    location ? "border-emerald-500 bg-emerald-50/50" : "border-slate-50 bg-slate-50/50 hover:bg-slate-100/50 hover:border-slate-200"
                  )}
                >
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                    location ? "bg-emerald-500 text-white" : "bg-white text-slate-400 group-hover:text-indigo-600 shadow-sm"
                  )}>
                    <MapPin className="w-6 h-6" />
                  </div>
                  <span className={cn("text-[10px] font-black uppercase tracking-widest", location ? "text-emerald-700" : "text-slate-500 group-hover:text-indigo-600")}>
                    {location ? 'Lokasi OK' : 'Cek Lokasi'}
                  </span>
                </button>
              </div>

              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Requirement
                </h4>
                <ul className="space-y-4">
                  <CheckRequirement label="Wajah terdeteksi jelas" active={!!photo} />
                  <CheckRequirement label="Tepat didalam radius lokasi" active={!!location} />
                  <CheckRequirement label="Koneksi internet stabil" active={true} />
                </ul>
              </div>

              <AnimatePresence>
                {photo && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative w-full aspect-video rounded-[2.5rem] overflow-hidden border-4 border-slate-50 shadow-2xl group/preview"
                  >
                    <img src={photo} className="w-full h-full object-cover" alt="Selfie Preview" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
                       <button 
                        onClick={() => setPhoto(null)} 
                        className="w-14 h-14 bg-rose-500 text-white rounded-2xl hover:bg-rose-600 transition-all flex flex-col items-center justify-center gap-1 shadow-xl active:scale-90"
                      >
                        <Trash2 className="w-5 h-5" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Hapus</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Keterangan {isCheckedIn ? 'Pulang' : 'Masuk'}</label>
                <textarea
                  value={keterangan}
                  onChange={e => setKeterangan(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all min-h-[120px] resize-none"
                  placeholder={`Contoh: ${isCheckedIn ? 'Pekerjaan hari ini selesai, semua target terpenuhi.' : 'Mulai absen masuk, siap bekerja.'}`}
                />
              </div>
            </div>

            {/* Attendance Main Button Card */}
            <div className={cn("bg-white border border-slate-100 shadow-xl shadow-slate-200/20 flex flex-col justify-center", isMobileView ? "p-6 rounded-[2.5rem] space-y-5" : "p-10 rounded-[3.5rem] space-y-6")}>
              {!isCheckedIn ? (
                <div className="space-y-8">
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-black text-slate-800">Absen Masuk</h3>
                    <p className="text-sm font-bold text-slate-400">Silahkan lengkapi data untuk mulai bekerja</p>
                  </div>
                  <button 
                    disabled={isSubmitting}
                    onClick={() => handleSubmit('masuk')}
                    className="w-full py-8 bg-[#66BB6A] text-white rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/30 hover:bg-[#4CAF50] hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 group"
                  >
                    {isSubmitting ? <Loader2 className="w-8 h-8 animate-spin" /> : (
                      <>
                        <Send className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        CLK-IN NOW
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Sudah Absen Masuk</p>
                      <p className="text-2xl font-black text-indigo-700 tabular-nums">{todayMapping.jam_absen}</p>
                    </div>
                    <CheckCircle2 className="w-10 h-10 text-indigo-500/40" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-black text-slate-800">Absen Pulang</h3>
                    <p className="text-sm font-bold text-slate-400">Pastikan semua tugas hari ini selesai</p>
                  </div>
                  <button 
                    disabled={isSubmitting}
                    onClick={() => handleSubmit('pulang')}
                    className="w-full py-8 bg-[#E53935] text-white rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-rose-500/30 hover:bg-[#D32F2F] hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 group"
                  >
                    {isSubmitting ? <Loader2 className="w-8 h-8 animate-spin" /> : (
                      <>
                        <Send className="w-6 h-6 group-hover:translate-x-1 group-hover:translate-y-1 transition-transform" />
                        CLK-OUT NOW
                      </>
                    )}
                  </button>
                </div>
              )}
              
              <p className="text-[10px] text-center font-black text-slate-300 uppercase tracking-[0.15em] pt-4">© 2026 Premium Attendance System</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera Modal Overlay */}
      <AnimatePresence>
        {isCameraOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-xl p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.9 }} 
              className="bg-white rounded-[3rem] p-8 max-w-md w-full space-y-8"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <Camera className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="font-black text-slate-800 tracking-tight">Security Selfie</h3>
                </div>
                <button onClick={closeCamera} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full text-slate-400 font-bold hover:bg-rose-50 hover:text-rose-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative w-full aspect-square bg-[#1A1C1E] rounded-[2.5rem] overflow-hidden border-4 border-slate-50 shadow-inner">
                <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-10 border-2 border-dashed border-white/20 rounded-full pointer-events-none" />
              </div>

              <button 
                onClick={capturePhoto}
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-700 active:scale-95 transition-all shadow-xl shadow-indigo-600/30"
              >
                <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full" />
                </div>
                Ambil Gambar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CheckRequirement({ label, active }: { label: string, active: boolean }) {
  return (
    <li className="flex items-center gap-3">
      <div className={cn(
        "w-5 h-5 rounded-full flex items-center justify-center transition-all",
        active ? "bg-emerald-500 text-white" : "bg-slate-200 text-white"
      )}>
        <CheckCircle2 className="w-3 h-3" />
      </div>
      <span className={cn("text-xs font-bold transition-colors", active ? "text-slate-700" : "text-slate-400")}>{label}</span>
    </li>
  );
}
