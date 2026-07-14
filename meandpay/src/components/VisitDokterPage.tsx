import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { MapPin, Camera, Info, QrCode } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { useToast } from './Toast';

export function VisitDokterPage() {
  const [time, setTime] = useState(new Date());
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const { addToast, updateToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleGetLocation = () => {
    setLocating(true);
    if (!navigator.geolocation) {
      addToast({ type: 'error', title: 'Error', message: 'Geolocation tidak didukung di browser Anda.' });
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocating(false);
        addToast({ type: 'success', title: 'Berhasil', message: 'Lokasi Anda berhasil didapatkan.' });
      },
      (error) => {
        setLocating(false);
        addToast({ type: 'error', title: 'Error', message: 'Gagal mendapatkan lokasi. Pastikan izin lokasi aktif.' });
      }
    );
  };

  const handleScan = async (scannedData: string) => {
    if (!location) {
      addToast({ type: 'error', title: 'Validasi', message: 'Harap dapatkan titik lokasi terlebih dahulu sebelum scan.' });
      return;
    }

    setIsScanning(false);
    const toastId = addToast({ type: 'loading', title: 'Memproses Absen...', message: 'Menyimpan data kunjungan...' });

    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) throw new Error('Silahkan login terlebih dahulu');
      const userData = JSON.parse(storedUser);

      const formData = new FormData();
      formData.append('user_id', userData.id);

      const now = new Date();
      formData.append('tanggal', now.toISOString().split('T')[0]);
      formData.append('visit_in', now.toISOString());
      formData.append('lat_in', location.lat.toString());
      formData.append('long_in', location.lng.toString());
      formData.append('status', 'Visit'); // atau status lain sesuai db ("Visit Dokter")
      formData.append('keterangan', `Scanned QR: ${scannedData}`);

      // Catatan: Jika endpoint mewajibkan file foto, bisa jadi akan gagal tanpa foto.
      // Kita asumsikan absen via QR (mungkin tanpa foto, atau perlu dummy foto).
      // formData.append('foto', <file>);

      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/kunjungan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const json = await res.json();
      if (json.success) {
        updateToast(toastId, { type: 'success', title: 'Berhasil', message: 'Kunjungan berhasil dicatat otomatis.' });
      } else {
        updateToast(toastId, { type: 'error', title: 'Gagal', message: json.message || 'Gagal menyimpan kunjungan.' });
      }
    } catch (err: any) {
      console.error(err);
      updateToast(toastId, { type: 'error', title: 'Error', message: err.message || 'Gagal merekam kunjungan.' });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8 pb-10"
    >
      <div className="flex flex-col items-center space-y-6">
        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          Tanggal Shift : {time.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-')}
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
          onClick={handleGetLocation}
          disabled={locating}
          className="px-8 py-3 bg-[#66BB6A] text-white rounded-xl font-bold shadow-lg shadow-green-500/20 hover:bg-[#4CAF50] transition-all active:scale-95 flex items-center gap-2 disabled:opacity-70"
        >
          <MapPin className="w-5 h-5" />
          {locating ? 'Sedang mencari lokasi...' : (location ? 'Lokasi Tersimpan ✓' : 'Lihat Lokasi Saya')}
        </button>

        {location && (
          <div className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            Lat: {location.lat.toFixed(6)}, Long: {location.lng.toFixed(6)}
          </div>
        )}

        <div className="w-full bg-white p-1 rounded-[24px] border border-slate-100 shadow-xl shadow-indigo-500/5 relative">
          <div className="absolute top-6 right-6 text-slate-400 hover:text-indigo-500 cursor-pointer transition-colors z-10">
            <Info className="w-5 h-5" />
          </div>

          <div className="m-4 border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden bg-slate-50">

            {isScanning ? (
              <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-[280px]">
                <Scanner
                  onScan={(result) => {
                    if (result && result.length > 0) {
                      handleScan(result[0].rawValue);
                    }
                  }}
                  onError={(error) => {
                    console.log(error);
                  }}
                  formats={["qr_code", "ean_13", "code_128"]}
                />
                <div className="text-center">
                  <span className="text-xs font-bold text-slate-400 block mb-3">
                    Arahkan kamera ke QR absen dokter
                  </span>
                  <button onClick={() => setIsScanning(false)} className="px-5 py-2 bg-rose-50 text-rose-500 rounded-xl font-bold text-sm hover:bg-rose-100 transition-colors">
                    Batalkan Scan
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-[280px] py-10">
                <div className="w-24 h-24 bg-indigo-50 rounded-full flex flex-col items-center justify-center relative shadow-inner">
                  <QrCode className="w-10 h-10 text-indigo-400" />
                  <Camera className="w-5 h-5 text-indigo-600 absolute bottom-3 right-3 bg-white rounded-full box-content p-1.5 shadow-md" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="font-black text-slate-800 tracking-tight text-lg">Scanner Kunjungan</h3>
                  <p className="text-xs font-medium text-slate-500">Scan QR Code tujuan setelah mendapatkan lokasi Anda.</p>
                </div>
                <button
                  onClick={() => setIsScanning(true)}
                  disabled={!location}
                  className="w-full py-3.5 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-xl shadow-sm hover:border-indigo-500 hover:text-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:text-slate-600"
                >
                  <Camera className="w-4 h-4" /> Buka Kamera Scanner
                </button>
                {!location && (
                  <p className="text-[10px] items-center text-center font-bold text-rose-500">
                    * Dapatkan lokasi terlebih dahulu
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
