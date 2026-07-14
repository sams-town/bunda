import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Camera, Clock, X, Loader2, ScanFace, CheckCircle2 } from 'lucide-react';
import { useToast } from './Toast';

export function OvertimeEntryPage() {
  const [time, setTime] = useState(new Date());
  const [lat, setLat] = useState<number | null>(null);
  const [long, setLong] = useState<number | null>(null);
  const [foto, setFoto] = useState<string | null>(null);
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast, updateToast } = useToast();

  const [officeLocation, setOfficeLocation] = useState<any>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    fetchOfficeLocation();
    return () => clearInterval(timer);
  }, []);

  const fetchOfficeLocation = async () => {
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const lokasiId = user?.lokasi_id || user?.lokasi?.id;
      if (!lokasiId) return;

      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/lokasi/${lokasiId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();
      if (json.success) {
        setOfficeLocation(json.data);
      }
    } catch (err) {
      console.error("Fetch office error:", err);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      addToast({ type: 'error', title: 'Error', message: 'Geolocation tidak didukung oleh browser ini' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const uLat = pos.coords.latitude;
        const uLong = pos.coords.longitude;
        setLat(uLat);
        setLong(uLong);

        if (officeLocation) {
          const dist = calculateDistance(
            uLat, uLong,
            parseFloat(officeLocation.lat_kantor),
            parseFloat(officeLocation.long_kantor)
          );
          addToast({ type: 'success', title: 'Lokasi Ditemukan', message: `Jarak ke kantor: ${dist.toFixed(2)} meter` });
        } else {
          addToast({ type: 'success', title: 'Lokasi Ditemukan', message: `${uLat.toFixed(4)}, ${uLong.toFixed(4)}` });
        }
      },
      (err) => {
        addToast({ type: 'error', title: 'Gagal', message: 'Tidak dapat mengambil lokasi Anda' });
      }
    );
  };

  const handleSubmit = async () => {
    if (!lat || !long) {
      addToast({ type: 'error', title: 'Lokasi Wajib', message: 'Silahkan ambil lokasi terlebih dahulu' });
      return;
    }
    if (!foto) {
      addToast({ type: 'error', title: 'Foto Wajib', message: 'Silahkan ambil foto bukti terlebih dahulu' });
      return;
    }

    const toastId = addToast({ type: 'loading', title: 'Mengirim', message: 'Sedang memproses absensi lembur...' });
    setIsSubmitting(true);

    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const userId = user?.id;
      const token = localStorage.getItem('token');

      let distance = 0;
      if (officeLocation) {
        distance = calculateDistance(lat, long, parseFloat(officeLocation.lat_kantor), parseFloat(officeLocation.long_kantor));
      }

      const payload = {
        user_id: String(userId || '0'),
        lokasi_id: String(user?.lokasi_id || user?.lokasi?.id || '0'),
        tanggal: time.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-'),
        jam_masuk: `${time.getFullYear()}-${String(time.getMonth() + 1).padStart(2, '0')}-${String(time.getDate()).padStart(2, '0')} ${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`,
        lat_masuk: String(lat || '0'),
        long_masuk: String(long || '0'),
        jarak_masuk: distance.toFixed(2),
        foto_jam_masuk: foto || '',
      };

      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/lemburs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.success) {
        updateToast(toastId, { type: 'success', title: 'Berhasil', message: 'Absensi lembur masuk berhasil dicatat' });
        // Reset form and close camera if it was somehow open
        setFoto(null);
        setLat(null);
        setLong(null);
        setIsWebcamOpen(false);
      } else {
        updateToast(toastId, { type: 'error', title: 'Gagal', message: json.message || 'Gagal mencatat absensi' });
      }
    } catch (err: any) {
      updateToast(toastId, { type: 'error', title: 'Error', message: err.message || 'Terjadi kesalahan sistem' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8 pb-20"
    >
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black text-slate-800 tracking-tight">Masuk Lembur:</h1>
        <p className="text-slate-500 font-medium italic">Silahkan melakukan absensi lembur.</p>
      </div>

      <div className="flex flex-col items-center space-y-8">
        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          Tanggal : {time.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-')}
        </div>

        {/* Time Display */}
        <div className="flex gap-2">
          {time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }).split(':').map((unit, i) => (
            <div key={i} className="w-12 h-10 bg-indigo-500 text-white rounded-lg flex items-center justify-center font-black text-lg shadow-lg shadow-indigo-500/20">
              {unit}
            </div>
          ))}
        </div>

        <button
          onClick={getCurrentLocation}
          className="px-8 py-3 bg-[#66BB6A] text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-[#4CAF50] transition-all active:scale-95 flex items-center gap-2"
        >
          {lat ? <CheckCircle2 className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
          {lat ? 'Lokasi Tersimpan' : 'Lihat Lokasi Saya'}
        </button>

        <div className="w-full max-w-md bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-indigo-500/5 flex flex-col items-center space-y-6">
          <div
            onClick={() => setIsWebcamOpen(true)}
            className="w-full aspect-video bg-slate-50 rounded-3xl flex items-center justify-center border-2 border-dashed border-slate-200 group cursor-pointer hover:border-indigo-300 transition-colors overflow-hidden"
          >
            {foto ? (
              <img src={foto} className="w-full h-full object-cover" alt="Bukti" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-indigo-500 transition-colors">
                <Camera className="w-10 h-10" />
                <span className="text-[10px] font-black uppercase tracking-widest">Ambil Foto Bukti</span>
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Masuk'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isWebcamOpen && (
          <WebcamModal
            onClose={() => setIsWebcamOpen(false)}
            onCapture={(base64) => {
              setFoto(base64);
              setIsWebcamOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function WebcamModal({ onClose, onCapture }: { onClose: () => void, onCapture: (base64: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let currentStream: MediaStream | null = null;
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        currentStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsReady(true);
        }
      } catch (err) {
        console.error("Camera error:", err);
      }
    }
    startCamera();
    return () => {
      if (currentStream) currentStream.getTracks().forEach(t => t.stop());
    };
  }, []);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    onCapture(canvas.toDataURL('image/jpeg'));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden p-8 flex flex-col items-center">
        <div className="flex items-center justify-between w-full mb-6">
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Ambil Foto</h3>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 transition-all active:scale-90"><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        <div className="relative aspect-[4/3] w-full rounded-[2.5rem] overflow-hidden bg-slate-900 shadow-2xl border-4 border-slate-50 mb-8">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
          <canvas ref={canvasRef} className="hidden" />
          {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center text-white gap-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-sm font-bold">Mengaktifkan kamera...</span>
            </div>
          )}
        </div>

        <button
          onClick={handleCapture}
          className="w-full py-4.5 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-2xl text-sm font-black tracking-widest uppercase transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-3"
        >
          <ScanFace className="w-5 h-5" /> Capture Image
        </button>
      </motion.div>
    </div>
  );
}
