import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Camera, 
  Clock, 
  Send, 
  ShieldAlert, 
  CheckCircle2, 
  Calendar,
  Loader2,
  LogOut,
  User as UserIcon,
  Briefcase
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from './Toast';

export function AbsenDinasPage() {
  const [time, setTime] = useState(new Date());
  const [userData, setUserData] = useState<any>(null);
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
    setLoading(false);
    return () => clearInterval(timer);
  }, []);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
          addToast({ type: 'success', title: 'Lokasi Terdeteksi', message: 'Titik koordinat dinas berhasil dikunci.' });
        },
        () => addToast({ type: 'error', title: 'Gagal Lokasi', message: 'Pastikan izin lokasi diaktifkan.' })
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
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      setPhoto(canvas.toDataURL('image/jpeg', 0.8));
      closeCamera();
    }
  };

  const closeCamera = () => {
    stream?.getTracks().forEach(track => track.stop());
    setStream(null);
    setIsCameraOpen(false);
  };

  const handleSubmit = async () => {
    if (!location || !photo || !keterangan) {
      return addToast({ 
        type: 'warning', 
        title: 'Data Belum Lengkap', 
        message: 'Keterangan, Foto, dan Lokasi wajib diisi.' 
      });
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('user_id', userData.id);
      formData.append('shift_id', '1'); // Default or derived shift
      formData.append('tanggal', new Date().toISOString().split('T')[0]);
      formData.append('jam_absen', time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
      formData.append('lat_absen', location.lat.toString());
      formData.append('long_absen', location.lng.toString());
      formData.append('status_absen', 'Masuk Dinas');
      formData.append('keterangan', keterangan);
      
      const resBlob = await fetch(photo);
      const blob = await resBlob.blob();
      formData.append('foto_jam_absen', blob, 'dinas.jpg');

      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/dinas-luar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });

      const json = await res.json();
      if (json.success) {
        addToast({ type: 'success', title: 'Berhasil', message: 'Absen Dinas sukses dikirim!' });
        setPhoto(null); 
        setLocation(null); 
        setKeterangan('');
      } else {
        addToast({ type: 'error', title: 'Gagal', message: json.message || 'Gagal mengirim data.' });
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: 'Terjadi kesalahan sistem.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="animate-spin text-amber-600 w-12 h-12 mb-4" />
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Menyiapkan Absen Dinas...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      {/* Header Container */}
      <div className="bg-gradient-to-br from-amber-500 to-orange-600 px-6 pt-14 pb-20 rounded-b-[3rem] shadow-2xl relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-400/20 rounded-full -ml-10 -mb-10 blur-2xl" />
        
        <div className="flex justify-between items-center relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
              <UserIcon className="text-white w-7 h-7" />
            </div>
            <div className="text-white">
              <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-0.5">Pegawai Dinas</p>
              <h2 className="text-xl font-black truncate max-w-[180px] tracking-tight">{userData?.name}</h2>
            </div>
          </div>
          <button onClick={handleLogout} className="p-4 bg-white/10 rounded-2xl border border-white/20 active:scale-90 transition-all">
            <LogOut className="text-white w-5 h-5" />
          </button>
        </div>

        <div className="mt-10 text-center text-white relative z-10">
          <h1 className="text-6xl font-black tabular-nums tracking-tighter shadow-none">
            {time.toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit' })}
            <span className="text-2xl opacity-40 ml-1">:{time.toLocaleTimeString('id-ID', { second: '2-digit' })}</span>
          </h1>
          <p className="text-[11px] font-black opacity-60 mt-3 uppercase tracking-[0.3em]">{time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Main Content (Scrollable Area) */}
      <div className="flex-1 -mt-10 px-6 space-y-6 pb-12 relative z-20 overflow-y-auto scrollbar-hide">
        {/* Info Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100/50 space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-amber-500" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Tugas</span>
            </div>
            <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600">
              Active Assignment
            </span>
          </div>

          <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 space-y-4">
            <p className="text-xs font-bold text-slate-600 leading-relaxed italic">
              "Gunakan fitur ini hanya saat melakukan koordinasi atau tugas dinas di luar lokasi kantor utama."
            </p>
          </div>
        </motion.div>

        {/* Action Panel */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <MobileActionIcon 
              icon={Camera} 
              label="Foto Tugas" 
              active={!!photo} 
              onClick={openCamera} 
            />
            <MobileActionIcon 
              icon={MapPin} 
              label="Titik Lokasi" 
              active={!!location} 
              onClick={getLocation} 
            />
          </div>

          <AnimatePresence>
            {photo && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative group w-full aspect-video rounded-[2.5rem] overflow-hidden border-2 border-white shadow-xl"
              >
                <img src={photo} className="w-full h-full object-cover" alt="Preview" />
                <div className="absolute inset-0 bg-black/20" />
                <button 
                  onClick={() => setPhoto(null)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 active:scale-90"
                >
                  ×
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Keterangan Dinas
            </label>
            <textarea
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Contoh: Kunjungan klien di Bandung, meeting koordinasi vendor."
              className="w-full px-6 py-4 bg-white border border-slate-100 rounded-[2rem] text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all min-h-[120px] shadow-sm resize-none"
            />
          </div>

          <motion.button 
            whileTap={{ scale: 0.95 }}
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="w-full py-8 bg-amber-500 border-b-8 border-amber-700 rounded-[2.5rem] font-black text-white text-xl tracking-[0.2em] shadow-2xl shadow-amber-500/30 transition-all flex items-center justify-center gap-4 active:border-b-0"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin w-8 h-8" />
            ) : (
              <>
                <Send className="w-7 h-7" /> 
                KIRIM ABSEN DINAS
              </>
            )}
          </motion.button>
          <p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] py-2">© 2026 Premium Mobile Attendance v2.0</p>
        </div>
      </div>

      {/* Standalone Camera Overlay */}
      <AnimatePresence>
        {isCameraOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center p-6"
          >
            <div className="w-full flex justify-between items-center mb-8">
              <span className="text-white text-xs font-black uppercase tracking-widest bg-white/10 px-4 py-2 rounded-full border border-white/20">Foto Bukti Dinas</span>
              <button onClick={closeCamera} className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-full text-white font-bold text-2xl border border-white/20">×</button>
            </div>

            <div className="relative w-full aspect-square max-w-sm rounded-[3rem] overflow-hidden border-4 border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.1)]">
              <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-x-0 bottom-0 top-0 border-[3rem] border-black/40 pointer-events-none" />
              <div className="absolute inset-4 border-2 border-dashed border-white/30 rounded-[2.5rem] pointer-events-none" />
            </div>

            <div className="mt-auto w-full max-w-sm pb-10">
              <button 
                onClick={capturePhoto} 
                className="w-full h-24 bg-white text-amber-700 rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all"
              >
                <div className="w-16 h-16 rounded-full border-4 border-amber-700/20 flex items-center justify-center">
                  <div className="w-12 h-12 bg-amber-700 rounded-full flex items-center justify-center">
                     <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
              </button>
              <p className="text-center text-white/40 text-[10px] font-bold uppercase tracking-widest mt-6">Pastikan lokasi dinas terlihat di latar belakang</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileActionIcon({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center p-8 rounded-[2.5rem] transition-all border-2 relative overflow-hidden active:scale-95 h-full",
        active 
          ? "bg-amber-600 border-amber-500 text-white shadow-xl shadow-amber-600/20" 
          : "bg-white border-slate-100 text-slate-400 shadow-sm"
      )}
    >
      <div className={cn(
        "w-14 h-14 rounded-[1.25rem] flex items-center justify-center mb-4 shadow-inner",
        active ? "bg-white/20" : "bg-slate-50"
      )}>
        <Icon className={cn("w-7 h-7", active ? "text-white" : "text-slate-400")} />
      </div>
      <span className="font-black uppercase tracking-widest text-[10px]">{label}</span>
      {active && (
        <div className="absolute top-4 right-4 w-3 h-3 bg-emerald-400 rounded-full border-2 border-amber-600 shadow-[0_0_10px_rgba(52,211,153,0.5)] animate-pulse" />
      )}
    </button>
  );
}
