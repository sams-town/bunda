import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Camera,
  Clock,
  Send,
  CheckCircle2,
  Loader2,
  X,
  Trash2,
  Fingerprint,
  LogOut,
  ShieldCheck,
  User,
  Calendar,
  ChevronDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from './Toast';

const BASE_URL = import.meta.env.VITE_API_MEANDPAY;

export function AdminAbsenPage() {
  const { addToast } = useToast();
  const [time, setTime] = useState(new Date());
  const [userData, setUserData] = useState<any>(null);
  const [todayMapping, setTodayMapping] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [keterangan, setKeterangan] = useState('');
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [activeTab, setActiveTab] = useState<'masuk' | 'pulang'>('masuk');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserData(user);
    fetchTodayMapping(user.id);
    return () => clearInterval(timer);
  }, []);

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

      const res = await fetch(`${BASE_URL}/absensi_user_history/${userId}/${yesterdayStr}/${todayStr}`, {
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
        if (activeShift?.jam_absen && !activeShift?.jam_pulang) setActiveTab('pulang');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) return addToast({ type: 'error', title: 'Tidak Didukung', message: 'Browser tidak mendukung geolocation.' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        addToast({ type: 'success', title: 'Lokasi Terkunci', message: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}` });
      },
      () => addToast({ type: 'error', title: 'Gagal', message: 'Aktifkan izin lokasi di browser.' })
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
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      setPhoto(canvas.toDataURL('image/jpeg', 0.8));
      closeCamera();
    }
  };

  const closeCamera = () => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    setIsCameraOpen(false);
  };

  const handleSubmit = async () => {
    if (!location) return addToast({ type: 'error', title: 'Lokasi Diperlukan', message: 'Klik "Cek Lokasi" terlebih dahulu.' });
    if (!photo) return addToast({ type: 'error', title: 'Foto Diperlukan', message: 'Ambil selfie terlebih dahulu.' });

    setIsSubmitting(true);
    const type = activeTab;

    try {
      const formData = new FormData();
      formData.append('user_id', userData.id);
      formData.append('tanggal', new Date().toISOString().split('T')[0]);

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
        formData.append('status_absen', 'Masuk');
      }

      const url = `${BASE_URL}/absensi${type === 'pulang' ? `/${todayMapping?.id}` : ''}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });

      const json = await res.json();
      if (json.success) {
        addToast({ type: 'success', title: `Absen ${type === 'masuk' ? 'Masuk' : 'Pulang'} Berhasil!`, message: `Tercatat pukul ${time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` });
        fetchTodayMapping(userData.id);
        setPhoto(null);
        setLocation(null);
        setKeterangan('');
      } else {
        addToast({ type: 'error', title: 'Gagal', message: json.message || 'Terjadi kesalahan.' });
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const hours = String(time.getHours()).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const seconds = String(time.getSeconds()).padStart(2, '0');
  const dateStr = time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const isCheckedIn = !!todayMapping?.jam_absen;
  const isCheckedOut = !!todayMapping?.jam_pulang;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 font-sans flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 overflow-hidden rounded-xl border border-white/10 bg-white/10 flex items-center justify-center shrink-0">
              {userData?.foto_karyawan 
                ? <img src={userData.foto_karyawan} className="w-full h-full object-cover" alt="avatar" referrerPolicy="no-referrer" />
                : <User className="w-5 h-5 text-white/60" />
              }
            </div>
            <div>
              <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">Logged in as</p>
              <p className="text-white text-sm font-black tracking-tight">{userData?.name || 'Admin'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-8 space-y-8 shadow-2xl"
        >
          {/* Live Clock */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-3">
              {[hours, minutes, seconds].map((unit, i) => (
                <React.Fragment key={i}>
                  <motion.div
                    key={unit + i}
                    initial={{ y: -5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="w-16 h-16 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl flex items-center justify-center"
                  >
                    <span className="text-2xl font-black text-white tabular-nums">{unit}</span>
                  </motion.div>
                  {i < 2 && <span className="text-white/30 text-2xl font-black">:</span>}
                </React.Fragment>
              ))}
            </div>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{dateStr}</p>
          </div>

          {/* Status Bar */}
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            </div>
          ) : isCheckedOut ? (
            <div className="bg-emerald-500/10 border border-emerald-400/20 rounded-2xl p-5 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-emerald-300 font-black text-sm uppercase tracking-widest">Selesai Hari Ini</p>
              <div className="flex justify-center gap-4 mt-2">
                <div className="text-center">
                  <p className="text-[9px] font-black text-white/30 uppercase">Masuk</p>
                  <p className="text-white font-black">{todayMapping?.jam_absen}</p>
                </div>
                <div className="w-px bg-white/10" />
                <div className="text-center">
                  <p className="text-[9px] font-black text-white/30 uppercase">Pulang</p>
                  <p className="text-white font-black">{todayMapping?.jam_pulang}</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Tab Switcher */}
              <div className="grid grid-cols-2 gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                <button
                  onClick={() => setActiveTab('masuk')}
                  disabled={isCheckedIn}
                  className={cn(
                    "py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                    activeTab === 'masuk' && !isCheckedIn ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                    : isCheckedIn ? "text-white/20 cursor-not-allowed" 
                    : "text-white/40 hover:text-white/60"
                  )}
                >
                  ✓ Absen Masuk
                </button>
                <button
                  onClick={() => setActiveTab('pulang')}
                  disabled={!isCheckedIn}
                  className={cn(
                    "py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                    activeTab === 'pulang' && isCheckedIn ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                    : !isCheckedIn ? "text-white/20 cursor-not-allowed"
                    : "text-white/40 hover:text-white/60"
                  )}
                >
                  ← Absen Pulang
                </button>
              </div>

              {isCheckedIn && (
                <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-400/20 rounded-xl px-4 py-3">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <p className="text-indigo-300 text-[11px] font-black">Sudah absen masuk pukul <span className="text-white">{todayMapping?.jam_absen}</span></p>
                </div>
              )}

              {/* Location & Photo Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={getLocation}
                  className={cn(
                    "flex flex-col items-center gap-3 py-6 rounded-2xl border-2 transition-all active:scale-95",
                    location
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                      : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white/70"
                  )}
                >
                  <MapPin className="w-7 h-7" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{location ? 'Terkunci ✓' : 'Cek Lokasi'}</span>
                </button>
                <button
                  onClick={openCamera}
                  className={cn(
                    "flex flex-col items-center gap-3 py-6 rounded-2xl border-2 transition-all active:scale-95",
                    photo
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                      : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white/70"
                  )}
                >
                  <Camera className="w-7 h-7" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{photo ? 'Foto OK ✓' : 'Ambil Foto'}</span>
                </button>
              </div>

              {/* Photo Preview */}
              <AnimatePresence>
                {photo && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 group"
                  >
                    <img src={photo} className="w-full h-full object-cover scale-x-[-1]" alt="selfie" />
                    <button
                      onClick={() => setPhoto(null)}
                      className="absolute top-2 right-2 w-8 h-8 bg-rose-500 text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Keterangan */}
              <textarea
                value={keterangan}
                onChange={e => setKeterangan(e.target.value)}
                placeholder={`Keterangan ${activeTab === 'masuk' ? 'masuk kerja' : 'pulang kerja'}... (opsional)`}
                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-medium text-white/70 placeholder:text-white/20 outline-none focus:border-indigo-400/50 focus:bg-white/10 transition-all resize-none h-20"
              />

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !location || !photo}
                className={cn(
                  "w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-white flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shadow-xl",
                  activeTab === 'masuk'
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/20"
                    : "bg-gradient-to-r from-rose-500 to-rose-600 shadow-rose-500/20"
                )}
              >
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <>
                    <Send className="w-5 h-5" />
                    {activeTab === 'masuk' ? 'Absen Masuk' : 'Absen Pulang'}
                  </>
                )}
              </button>
            </>
          )}
        </motion.div>

        <p className="text-center text-white/20 text-[10px] font-bold uppercase tracking-widest mt-6">
          MeAndPay Admin Attendance System
        </p>
      </div>

      {/* Camera Modal */}
      <AnimatePresence>
        {isCameraOpen && (
          <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 w-full max-w-sm space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                    <Camera className="w-4 h-4 text-indigo-400" />
                  </div>
                  <span className="text-white font-black tracking-tight">Ambil Selfie</span>
                </div>
                <button onClick={closeCamera} className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center text-white/40 hover:text-white transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative aspect-square bg-black rounded-2xl overflow-hidden border border-white/10">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 border-[3px] border-indigo-400/20 rounded-full m-8 pointer-events-none" />
              </div>

              <button
                onClick={capturePhoto}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-500 transition-all active:scale-95"
              >
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full" />
                </div>
                Capture
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
