import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera, MapPin, ArrowLeft, Loader2, CheckCircle2,
  AlertCircle, Fingerprint, ShieldCheck, X,
  Clock, RefreshCw, User,
} from 'lucide-react';
import { cn } from '../lib/utils';

const API = import.meta.env.VITE_API_MEANDPAY as string;

type Mode = 'masuk' | 'keluar';
type Step = 'scan' | 'result';

interface PublicAbsenPageProps {
  mode: Mode;
  settings?: any;
}

export function PublicAbsenPage({ mode, settings }: PublicAbsenPageProps) {
  const getFileUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('blob:')) return path;
    let cleanPath = path.replace(/^\//, '');
    if (cleanPath.startsWith('uploads/')) cleanPath = cleanPath.slice(8);
    return `https://rsthb.id/apihris/uploads/${cleanPath}`;
  };
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('scan');

  /* ─ camera ─ */
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camReady, setCamReady] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);

  /* ─ location ─ */
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  /* ─ submit ─ */
  const [submitting, setSubmitting] = useState(false);
  const [resultData, setResultData] = useState<any>(null); // To store returned user data
  const [resultOk, setResultOk] = useState(false);
  const [resultMsg, setResultMsg] = useState('');
  const [resultTime, setResultTime] = useState('');

  /* ─ clock ─ */
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* ══════════ INIT ══════════ */
  useEffect(() => {
    startCamera();
    getLocation();
    return () => stopCamera();
  }, []);

  /* ══════════ CAMERA ══════════ */
  const startCamera = async () => {
    setCamError(null);
    setCamReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCamReady(true);
        };
      }
    } catch (err: any) {
      setCamError(err.message || 'Tidak dapat mengakses kamera');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamReady(false);
  };

  const captureSnap = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Mirror to match what user sees
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    setCaptured(canvas.toDataURL('image/jpeg', 0.92));
  };

  const retake = () => {
    setCaptured(null);
    if (!camReady) startCamera();
  };

  /* ══════════ LOCATION ══════════ */
  const getLocation = () => {
    setLocationLoading(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationLoading(false);
      },
      (err) => {
        let msg = 'Izin lokasi ditolak. Harap aktifkan "Location Access" di browser Anda.';
        if (err.code === err.POSITION_UNAVAILABLE) msg = 'Informasi lokasi tidak tersedia.';
        else if (err.code === err.TIMEOUT) msg = 'Waktu permintaan lokasi habis.';

        setLocationError(msg);
        setLocationLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    // Initial check for geolocation permission status
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then(status => {
        if (status.state === 'denied') {
          setLocationError('Izin lokasi diblokir oleh browser. Harap aktifkan akses lokasi di pengaturan browser laptop Anda.');
        }
      });
    }
  }, []);

  /* ══════════ SUBMIT ══════════ */
  const handleSubmit = async () => {
    if (!captured) return;
    if (!location) return;

    // Ambil waktu realtime tepat saat tombol submit ditekan
    const submitTime = new Date();

    setSubmitting(true);
    try {
      // Convert captured dataURL → Blob
      const resBlob = await fetch(captured);
      const blob = await resBlob.blob();
      const photoFile = new File([blob], 'absen_wajah.jpg', { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('foto_wajah', photoFile);
      formData.append('lat', location.lat.toString());
      formData.append('long', location.lng.toString());
      formData.append('tipe_absen', mode); // 'masuk' or 'keluar'
      if (mode === 'keluar') {
        formData.append('jam_pulang', submitTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
      } else {
        formData.append('jam_absen', submitTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
      }
      formData.append('tanggal', submitTime.toISOString().split('T')[0]);

      // Catatan: Pastikan endpoint backend "/absensi_wajah" sudah siap
      // Menerima POST formData dan melakukan pencocokan wajah dengan Python/Face-Recognition
      const absenRes = await fetch(`${API}/absensi_wajah`, {
        method: 'POST',
        body: formData,
      });

      const ct = absenRes.headers.get('content-type') ?? '';
      if (!ct.includes('application/json')) {
        throw new Error(`Server error ${absenRes.status}`);
      }
      const json = await absenRes.json();
      if (!json.success) throw new Error(json.message || 'Gagal mengenali wajah / absen');

      setResultOk(true);
      setResultMsg(json.message || `Absen ${mode === 'masuk' ? 'Masuk' : 'Keluar'} berhasil!`);
      setResultTime(submitTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
      setResultData(json.user); // data pegawai yang terdeteksi
      stopCamera();
      setStep('result');
    } catch (err: any) {
      setResultOk(false);
      setResultMsg(err.message || 'Terjadi kesalahan sistem');
      setStep('result');
    } finally {
      setSubmitting(false);
    }
  };

  /* ══════════ RENDER ══════════ */
  const isKeluar = mode === 'keluar';
  const accentFrom = isKeluar ? 'from-rose-600' : 'from-emerald-600';
  const accentTo = isKeluar ? 'to-rose-700' : 'to-emerald-700';
  const accentShadow = isKeluar ? 'shadow-rose-500/30' : 'shadow-emerald-500/30';
  const accentBg = isKeluar ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700';
  const accentText = isKeluar ? 'text-rose-600' : 'text-emerald-600';
  const accentBgLight = isKeluar ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100';

  return (
    <div className="min-h-screen bg-[#F0F4FF] flex flex-col">

      {/* ── Header ── */}
      <div className={cn('relative overflow-hidden pt-safe', `bg-gradient-to-br ${accentFrom} ${accentTo}`)}>
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex items-center justify-between px-5 pt-12 pb-6">
          <button
            onClick={() => { stopCamera(); navigate('/'); }}
            className="w-10 h-10 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center border border-white/30 active:scale-90 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          <div className="text-center">
            {settings?.logo && (
              <img src={getFileUrl(settings.logo)} className="w-8 h-8 object-contain mx-auto mb-1" alt="Logo" />
            )}
            <h1 className="text-white font-black text-base tracking-tight">
              {isKeluar ? 'Absen Keluar' : 'Absen Masuk'}
            </h1>
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 mt-1">
              <Fingerprint className="w-3 h-3" /> Face Scan AI
            </p>
          </div>

          <div className="text-right">
            <p className="text-white font-black text-base tabular-nums">
              {now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })}
            </p>
            <p className="text-white/50 text-[9px] font-bold">
              {now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
            </p>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 px-5 py-6 max-w-lg mx-auto w-full space-y-5">
        <AnimatePresence mode="wait">

          {/* ═══ STEP: Scan ═══ */}
          {step === 'scan' && (
            <motion.div
              key="scan"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center px-4">
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Pindai Wajah</h2>
                <p className="text-sm font-medium text-slate-400 mt-1">Posisikan wajah Anda di dalam area pindai. Sistem akan mengenali identitas Anda otomatis.</p>
              </div>

              {/* Camera viewfinder */}
              <div className="relative bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-indigo-500/10 border-4 border-white" style={{ aspectRatio: '3/4' }}>
                {/* Loading */}
                {!camReady && !camError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Akses Kamera...</p>
                  </div>
                )}

                {/* Camera error */}
                {camError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center bg-rose-50/10">
                    <AlertCircle className="w-10 h-10 text-rose-400" />
                    <p className="text-sm font-semibold text-slate-200">{camError}</p>
                    <button onClick={startCamera} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-xs font-bold transition-all">
                      <RefreshCw className="w-3 h-3" /> Coba Lagi
                    </button>
                  </div>
                )}

                {/* Live video */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{
                    transform: 'scaleX(-1)',
                    display: captured ? 'none' : 'block',
                    opacity: camReady ? 1 : 0,
                    transition: 'opacity 0.3s',
                  }}
                />

                {/* Snapshot */}
                {captured && (
                  <img src={captured} alt="Captured" className="w-full h-full object-cover" />
                )}

                {/* Overlay guides */}
                {camReady && !captured && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Face oval guide */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-64 border-2 border-dashed border-white/40 rounded-[100%] absolute shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
                    </div>
                    {/* LIVE badge */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-rose-500/80 backdrop-blur-md rounded-full px-3 py-1 shadow-lg">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      <span className="text-[10px] font-black text-white tracking-widest uppercase">Live Scan</span>
                    </div>
                  </div>
                )}

                {/* Retake button on captured */}
                {captured && (
                  <button
                    onClick={retake}
                    className="absolute top-4 right-4 w-10 h-10 bg-black/60 hover:bg-black/80 backdrop-blur rounded-xl flex items-center justify-center text-white transition-all shadow-lg border border-white/20"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}

                {/* Processing Overlay inside Camera */}
                <AnimatePresence>
                  {submitting && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-indigo-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 text-white"
                    >
                      <ShieldCheck className="w-10 h-10 text-indigo-300 animate-pulse mb-4" />
                      <div className="w-10 h-10 border-4 border-indigo-200 border-t-white rounded-full animate-spin shadow-lg" />
                      <p className="mt-4 text-xs font-black uppercase tracking-widest text-indigo-100 drop-shadow">Menganalisis Wajah...</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Location status */}
              <div className={cn('flex items-center gap-3 px-4 py-3 rounded-2xl border', location ? 'bg-emerald-50 border-emerald-100' : locationError ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100')}>
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center',
                  location ? 'bg-emerald-500' : locationError ? 'bg-rose-400' : 'bg-slate-200'
                )}>
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  {locationLoading && <p className="text-xs font-semibold text-slate-500">Mendeteksi lokasi GPS...</p>}
                  {location && !locationLoading && (
                    <p className="text-xs font-bold text-emerald-700">
                      Lokasi Terdeteksi · {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                    </p>
                  )}
                  {locationError && !locationLoading && (
                    <p className="text-xs font-bold text-rose-600">{locationError}</p>
                  )}
                  {!location && !locationLoading && !locationError && (
                    <p className="text-xs font-semibold text-slate-400">Menunggu koordinat lokasi</p>
                  )}
                </div>
                {!locationLoading && !location && !locationError && (
                  <button onClick={getLocation} className="p-2 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors">
                    <RefreshCw className="w-3 h-3 text-slate-600" />
                  </button>
                )}
              </div>

              {/* Action buttons */}
              {!captured ? (
                <button
                  onClick={captureSnap}
                  disabled={!camReady}
                  className={cn(
                    'w-full py-5 rounded-[1.5rem] font-black text-white text-base uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.97] disabled:opacity-40 shadow-xl',
                    accentBg, accentShadow
                  )}
                >
                  <Camera className="w-6 h-6" />
                  Verifikasi Wajah
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !location}
                  className={cn(
                    'w-full py-5 rounded-[1.5rem] font-black text-white text-base flex items-center justify-center gap-3 transition-all active:scale-[0.97] disabled:opacity-50 shadow-xl',
                    accentBg, accentShadow
                  )}
                >
                  <Fingerprint className="w-6 h-6" />
                  Kirim Data Identitas
                </button>
              )}

              {/* Warning if missed Location */}
              {!location && !locationLoading && (
                <div className="flex items-center justify-center gap-2 p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
                  <AlertCircle className="w-4 h-4" />
                  <p className="text-[11px] font-bold">Harap izinkan akses Lokasi GPS di browser Anda.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ═══ STEP: Result ═══ */}
          {step === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center min-h-[65vh] text-center space-y-6 px-4"
            >
              <div className="relative">
                <div className={cn('absolute inset-0 blur-3xl opacity-30 animate-pulse rounded-full', resultOk ? 'bg-emerald-400' : 'bg-rose-400')} />
                <div className={cn('relative w-28 h-28 rounded-[2rem] flex items-center justify-center border-4 shadow-xl',
                  resultOk ? 'bg-emerald-50 border-emerald-200 shadow-emerald-500/20' : 'bg-rose-50 border-rose-200 shadow-rose-500/20'
                )}>
                  {resultOk
                    ? <CheckCircle2 className="w-14 h-14 text-emerald-500" />
                    : <AlertCircle className="w-14 h-14 text-rose-500" />}
                </div>
              </div>

              <div>
                <h2 className={cn('text-3xl font-black tracking-tight', resultOk ? 'text-emerald-700' : 'text-rose-700')}>
                  {resultOk ? 'Terverifikasi!' : 'Gagal Dikenali'}
                </h2>
                <p className="text-slate-500 font-bold mt-2 max-w-sm text-sm leading-relaxed">{resultMsg}</p>
                {resultOk && resultTime && (
                  <div className={cn('inline-flex items-center gap-2 mt-5 px-6 py-3 rounded-[1rem] border font-black text-sm shadow-sm', accentBgLight, accentText)}>
                    <Clock className="w-5 h-5" />
                    {resultTime} WIB · {isKeluar ? 'Absen Keluar' : 'Absen Masuk'}
                  </div>
                )}
              </div>

              {/* Jika Sukses, tampilkan profil karyawan */}
              {resultOk && resultData && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-sm bg-white p-5 rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 flex items-center gap-4 mt-2"
                >
                  <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl overflow-hidden shrink-0">
                    {resultData?.foto_karyawan ? (
                      <img src={resultData.foto_karyawan.startsWith('http') ? resultData.foto_karyawan : `${API.replace('/api', '')}/uploads/${resultData.foto_karyawan}`} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 m-auto mt-4 text-indigo-300" />
                    )}
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-black text-slate-800 text-base truncate">{resultData.name || 'Nama Pegawai'}</p>
                    <p className="text-xs text-slate-400 font-semibold truncate">{resultData.jabatan?.nama_jabatan || 'Pegawai / Staff'}</p>
                  </div>
                </motion.div>
              )}

              <div className="flex flex-col gap-3 w-full max-w-sm mt-4">
                {resultOk ? (
                  <button
                    onClick={() => navigate('/')}
                    className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm tracking-wider uppercase active:scale-[0.97] transition-all shadow-xl shadow-slate-900/20"
                  >
                    Selesai & Kembali
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => { setCaptured(null); setStep('scan'); startCamera(); }}
                      className={cn('w-full py-5 rounded-2xl font-black text-white text-sm uppercase tracking-wider active:scale-[0.97] transition-all shadow-xl', accentBg, accentShadow)}
                    >
                      Scan Ulang Wajah
                    </button>
                    <button
                      onClick={() => navigate('/')}
                      className="w-full py-5 border-2 border-slate-200 bg-white text-slate-600 rounded-2xl font-bold text-sm tracking-wide active:scale-[0.97] transition-all hover:bg-slate-50"
                    >
                      Batal Absen
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
