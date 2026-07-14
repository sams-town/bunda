import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  MapPin,
  Camera,
  Clock,
  Loader2,
  Navigation,
  CheckCircle2,
  ShieldAlert,
  X,
  Trash2,
  RefreshCw,
  Map as MapIcon,
  FileText,
  Send,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useToast } from './Toast';

const BASE_URL = import.meta.env.VITE_API_MEANDPAY;

interface DinasRecord {
  id: string;
  user_id: string;
  tanggal: string;
  jam: string;
  tujuan: string;
  keterangan: string | null;
  lat: string | null;
  long: string | null;
  foto: string | null;
}

export function MobileAbsenDinasPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [time, setTime] = useState(new Date());
  const [userData, setUserData] = useState<any>(null);
  const [todayDinas, setTodayDinas] = useState<DinasRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [photo, setPhoto] = useState<string | null>(null);
  const [locationState, setLocationState] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const [tujuan, setTujuan] = useState('');
  const [keterangan, setKeterangan] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserData(user);
    if (user.id) fetchTodayDinas(user.id);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const fetchTodayDinas = async (userId: string, silent = false) => {
    try {
      if (!silent) setLoading(true);
      const today = new Date().toLocaleDateString('en-CA');
      const res = await fetch(`${BASE_URL}/dinas-luar/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const json = await res.json();
      if (json.success) {
        const raw = json.data;
        // handle single object or array
        const record: DinasRecord | null = Array.isArray(raw)
          ? raw.find((r: DinasRecord) => {
              if (!r.tanggal) return false;
              return new Date(r.tanggal).toLocaleDateString('en-CA') === today;
            }) ?? null
          : raw?.tanggal && new Date(raw.tanggal).toLocaleDateString('en-CA') === today ? raw : null;
        setTodayDinas(record);
      } else {
        setTodayDinas(null);
      }
    } catch {
      setTodayDinas(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    if (!userData?.id) return;
    setRefreshing(true);
    fetchTodayDinas(userData.id, true);
  };

  const getLocation = () => {
    if (!navigator.geolocation)
      return addToast({ type: 'error', title: 'Tidak Didukung', message: 'Geolocation tidak tersedia.' });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocationState({ lat, lng });
        addToast({ type: 'success', title: 'Lokasi Terkunci', message: 'Koordinat berhasil dideteksi.' });
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=id`,
            { headers: { 'Accept-Language': 'id' } }
          );
          const json = await res.json();
          setAddress(json.display_name || null);
        } catch {
          setAddress(null);
        }
      },
      () => addToast({ type: 'error', title: 'Gagal', message: 'Izin lokasi diperlukan.' })
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

  const handleSubmit = async () => {
    if (!tujuan.trim())
      return addToast({ type: 'warning', title: 'Data Kurang', message: 'Tujuan / keperluan wajib diisi.' });
    if (!locationState)
      return addToast({ type: 'info', title: 'Lokasi Diperlukan', message: 'Klik tombol Lokasi terlebih dahulu.' });
    if (!photo)
      return addToast({ type: 'info', title: 'Foto Diperlukan', message: 'Ambil foto bukti terlebih dahulu.' });

    setIsSubmitting(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const formData = new FormData();
      formData.append('user_id', user.id);
      formData.append('tanggal', new Date().toISOString().split('T')[0]);
      formData.append('jam', time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
      formData.append('tujuan', tujuan);
      formData.append('keterangan', keterangan);
      formData.append('lat', locationState.lat.toString());
      formData.append('long', locationState.lng.toString());
      console.log('user.id',user.id)

      const blob = await (await fetch(photo)).blob();
      formData.append('foto', blob, 'dinas.jpg');

      const res = await fetch(`${BASE_URL}/dinas-luar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        addToast({ type: 'success', title: 'Berhasil!', message: 'Presensi dinas luar tercatat.' });
        fetchTodayDinas(user.id, true);
        setPhoto(null);
        setLocationState(null);
        setAddress(null);
        setTujuan('');
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-amber-500 via-amber-400 to-orange-500">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30">
            <Navigation className="w-8 h-8 text-white animate-pulse" />
          </div>
          <p className="text-white/70 text-xs font-black uppercase tracking-widest">Memuat Data Dinas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans bg-[#FFF9F0] pb-28">
      {/* ─── HERO HEADER ─── */}
      <div className="relative bg-gradient-to-br from-amber-500 via-amber-400 to-orange-500 pt-14 pb-32 px-6 overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-400/20 rounded-full blur-3xl" />

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/beranda')}
            className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 active:scale-90 transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          <h1 className="text-white text-lg font-black tracking-tight">Dinas Luar</h1>

          <button
            onClick={handleRefresh}
            className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 active:scale-90 transition-all"
          >
            <RefreshCw className={cn('w-4 h-4 text-white', refreshing && 'animate-spin')} />
          </button>
        </div>

        {/* User identity */}
        <div className="relative z-10 flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 overflow-hidden shrink-0">
            {userData?.foto_karyawan ? (
              <img src={userData.foto_karyawan} className="w-full h-full object-cover" alt="" />
            ) : (
              <Navigation className="text-white w-7 h-7" />
            )}
          </div>
          <div>
            <p className="text-white/50 text-[10px] font-black uppercase tracking-widest">Penugasan Luar</p>
            <h2 className="text-white text-lg font-black tracking-tight leading-tight">{userData?.name || 'Pengguna'}</h2>
            <p className="text-amber-100 text-[10px] font-bold uppercase tracking-widest">{userData?.jabatan?.nama_jabatan || 'Staff'}</p>
          </div>
        </div>

        {/* Live Clock */}
        <div className="relative z-10 text-center">
          <p className="text-white text-6xl font-black tracking-tighter tabular-nums drop-shadow-lg">
            {timeStr}
            <span className="text-2xl text-white/40 ml-1">:{secStr}</span>
          </p>
          <p className="text-white/50 text-[11px] font-bold mt-2 uppercase tracking-widest">{dateStr}</p>
        </div>
      </div>

      {/* ─── CONTENT ─── */}
      <div className="px-5 -mt-16 relative z-20 space-y-5">

        {/* Status Card hari ini */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] p-6 shadow-2xl shadow-amber-500/10 border border-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
                <Navigation className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status Hari Ini</p>
                <p className="text-sm font-black text-slate-800 tracking-tight">
                  {todayDinas ? 'Sudah Presensi' : 'Belum Presensi'}
                </p>
              </div>
            </div>
            <span className={cn(
              'px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider',
              todayDinas
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                : 'bg-amber-50 text-amber-600 border border-amber-100'
            )}>
              {todayDinas ? 'Tercatat' : 'Pending'}
            </span>
          </div>

          {todayDinas && (
            <div className="space-y-2 mt-2">
              <div className="bg-amber-50 rounded-2xl px-4 py-3 border border-amber-100 flex items-center gap-3">
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Jam Presensi</p>
                  <p className="text-sm font-black text-amber-700 tabular-nums">{todayDinas.jam}</p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100 flex items-center gap-3">
                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tujuan</p>
                  <p className="text-xs font-black text-slate-700">{todayDinas.tujuan}</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* ─── ACTION PANEL ─── */}
        <AnimatePresence mode="wait">
          {todayDinas ? (
            // Sudah presensi hari ini
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
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Selamat Bertugas!</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  Presensi Dinas Luar Hari Ini Tercatat
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-center">
                  <p className="text-[8px] font-black text-amber-400 uppercase tracking-widest">Jam Masuk</p>
                  <p className="text-lg font-black text-amber-700 tabular-nums">{todayDinas.jam}</p>
                </div>
                <div className="flex-1 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tujuan</p>
                  <p className="text-xs font-black text-slate-700 truncate">{todayDinas.tujuan}</p>
                </div>
              </div>
            </motion.div>
          ) : (
            // Belum presensi — tampilkan form
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

              {/* Input Tujuan */}
              <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-slate-100 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Tujuan / Keperluan <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Meeting Client, Survey Lapangan..."
                    value={tujuan}
                    onChange={(e) => setTujuan(e.target.value)}
                    className="w-full mt-1 bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Keterangan Tambahan
                  </label>
                  <textarea
                    placeholder="Opsional: detail tugas, lokasi tujuan, dsb."
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    className="w-full mt-1 bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all min-h-[90px] resize-none text-sm"
                  />
                </div>
              </div>

              {/* Camera & Location buttons */}
              <div className="grid grid-cols-2 gap-4">
                <ActionButton
                  icon={Camera}
                  label={photo ? 'Foto Siap' : 'Foto Bukti'}
                  active={!!photo}
                  color="amber"
                  onClick={openCamera}
                />
                <ActionButton
                  icon={MapPin}
                  label={locationState ? 'Lokasi OK' : 'Cek Lokasi'}
                  active={!!locationState}
                  color="amber"
                  onClick={getLocation}
                />
              </div>

              {/* Checklist */}
              <div className="bg-white rounded-2xl border border-slate-100 px-5 py-4 shadow-sm space-y-3">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block" />
                  Persyaratan Presensi
                </p>
                <CheckItem label="Tujuan / keperluan diisi" done={!!tujuan.trim()} />
                <CheckItem label="Foto bukti diambil" done={!!photo} />
                <CheckItem label="Lokasi terkunci" done={!!locationState} />
              </div>

              {/* Address Display */}
              <AnimatePresence>
                {address && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="bg-amber-50/50 px-5 py-4 rounded-2xl border border-amber-100/50"
                  >
                    <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <MapIcon className="w-3 h-3" /> Alamat Terdeteksi
                    </p>
                    <p className="text-[11px] font-bold text-amber-950 leading-relaxed italic">
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
                    <img src={photo} className="w-full h-full object-cover" alt="Foto Bukti" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => setPhoto(null)}
                        className="w-12 h-12 bg-rose-500 text-white rounded-xl flex items-center justify-center shadow-xl active:scale-90 transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <span className="absolute top-3 left-3 bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow">
                      Foto Ready
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Warning banner */}
              <AnimatePresence>
                {(!tujuan.trim() || !photo || !locationState) && (
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
                        {!tujuan.trim() && (
                          <p className="text-[11px] font-bold text-amber-600 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                            Tujuan belum diisi
                          </p>
                        )}
                        {!photo && (
                          <p className="text-[11px] font-bold text-amber-600 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                            Foto bukti belum diambil
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

              {/* Submit button */}
              <motion.button
                whileTap={{ scale: 0.96 }}
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="w-full py-7 rounded-[2rem] font-black text-white text-lg tracking-[0.15em] uppercase shadow-2xl transition-all flex items-center justify-center gap-4 border-b-4 active:border-b-0 disabled:opacity-60 bg-gradient-to-r from-amber-500 to-orange-500 border-orange-700 shadow-amber-500/25"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin w-7 h-7" />
                ) : (
                  <>
                    <Send className="w-6 h-6" />
                    Kirim Presensi Dinas
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
                Foto Bukti Dinas
              </span>
              <button
                onClick={closeCamera}
                className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center border border-white/20"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center px-6">
              <div className="relative w-full max-w-sm aspect-square rounded-[3rem] overflow-hidden border-4 border-white/20 shadow-[0_0_60px_rgba(245,158,11,0.3)]">
                <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-6 border-2 border-dashed border-white/30 rounded-[2.5rem] pointer-events-none" />
                <div className="absolute inset-0 border-[3rem] border-black/30 pointer-events-none" />
              </div>
            </div>

            <div className="pb-16 px-6">
              <button
                onClick={capturePhoto}
                className="w-full h-20 bg-white text-amber-600 rounded-full flex items-center justify-center gap-4 shadow-2xl active:scale-95 transition-all"
              >
                <div className="w-14 h-14 rounded-full border-4 border-amber-200 flex items-center justify-center">
                  <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </div>
                <span className="font-black text-amber-700 tracking-tight">Ambil Foto</span>
              </button>
              <p className="text-center text-white/30 text-[10px] font-bold uppercase tracking-widest mt-4">
                Pastikan cahaya cukup & wajah/lokasi terlihat jelas
              </p>
            </div>
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
  color = 'amber',
  onClick,
}: {
  icon: any;
  label: string;
  active: boolean;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center py-7 rounded-[2rem] transition-all relative overflow-hidden active:scale-95 border-2',
        active
          ? 'bg-amber-500 border-amber-400 text-white shadow-xl shadow-amber-500/20'
          : 'bg-white border-slate-100 text-slate-400 shadow-sm'
      )}
    >
      <div className={cn(
        'w-12 h-12 rounded-[1rem] flex items-center justify-center mb-3 transition-all',
        active ? 'bg-white/20' : 'bg-slate-50'
      )}>
        <Icon className={cn('w-6 h-6', active ? 'text-white' : 'text-slate-400')} />
      </div>
      <span className="font-black uppercase tracking-widest text-[10px]">{label}</span>
      {active && (
        <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-amber-500 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
      )}
    </button>
  );
}

function CheckItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn(
        'w-5 h-5 rounded-full flex items-center justify-center transition-all shrink-0',
        done ? 'bg-emerald-500 text-white' : 'bg-slate-200'
      )}>
        <CheckCircle2 className="w-3 h-3" />
      </div>
      <span className={cn('text-xs font-bold', done ? 'text-slate-700' : 'text-slate-400')}>{label}</span>
    </div>
  );
}
