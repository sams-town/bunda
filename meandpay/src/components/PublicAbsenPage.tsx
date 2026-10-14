import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera, MapPin, ArrowLeft, Loader2, CheckCircle2,
  AlertCircle, Fingerprint, ShieldCheck, X,
  Clock, RefreshCw, User, Search, Check, ChevronRight,
  UserCheck, Sparkles, AlertTriangle, History, ArrowRight,
  LogIn, LogOut
} from 'lucide-react';
import { cn, compressImage, formatPhotoUrl } from '../lib/utils';

const API = import.meta.env.VITE_API_MEANDPAY as string;

type Mode = 'masuk' | 'keluar';
type Step = 'scan' | 'result';

interface EmployeeQuick {
  id: string;
  name: string;
  nik?: string;
  username?: string;
  foto_karyawan?: string | null;
  has_face_recognition?: boolean;
  jabatan?: {
    id: string;
    nama_jabatan: string;
  } | null;
}

interface PublicAbsenPageProps {
  mode: Mode;
  settings?: any;
}

const RECENT_KEY = 'bunda_quick_recent_employees_v1';

export function PublicAbsenPage({ mode: initialMode, settings }: PublicAbsenPageProps) {
  const navigate = useNavigate();

  const [currentMode, setCurrentMode] = useState<Mode>(initialMode || 'masuk');
  const [employeeAttendanceStatus, setEmployeeAttendanceStatus] = useState<{
    hasCheckedIn: boolean;
    jamMasuk?: string | null;
    hasCheckedOut: boolean;
    jamPulang?: string | null;
  } | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    if (initialMode) setCurrentMode(initialMode);
  }, [initialMode]);

  const [step, setStep] = useState<Step>('scan');

  /* ─ search & employee selection ─ */
  const [employees, setEmployees] = useState<EmployeeQuick[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeQuick | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [recentEmployees, setRecentEmployees] = useState<EmployeeQuick[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  /* ─ submit & results ─ */
  const [submitting, setSubmitting] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [resultOk, setResultOk] = useState(false);
  const [resultMsg, setResultMsg] = useState('');
  const [resultTime, setResultTime] = useState('');
  const [countdown, setCountdown] = useState(10);

  /* ─ clock ─ */
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* ══════════ LOAD EMPLOYEES & RECENT LIST ══════════ */
  useEffect(() => {
    fetchEmployees();
    loadRecentEmployees();
  }, []);

  const fetchEmployees = async (query = '') => {
    setLoadingEmployees(true);
    try {
      const res = await fetch(`${API}/users/quick-access?search=${encodeURIComponent(query)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setEmployees(json.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch quick access employees:', err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const loadRecentEmployees = () => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setRecentEmployees(parsed.slice(0, 5));
        }
      }
    } catch (e) {
      console.error('Error reading recent employees:', e);
    }
  };

  const saveRecentEmployee = (emp: EmployeeQuick) => {
    try {
      const current = recentEmployees.filter(e => String(e.id) !== String(emp.id));
      const updated = [emp, ...current].slice(0, 5);
      setRecentEmployees(updated);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving recent employee:', e);
    }
  };

  /* ══════════ INIT HARDWARE ══════════ */
  useEffect(() => {
    startCamera();
    getLocation();
    return () => stopCamera();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current && !searchInputRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
      setCamError(err.message || 'Tidak dapat mengakses kamera. Pastikan izin kamera aktif.');
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
    
    // Draw directly matching orientation
    ctx.drawImage(video, 0, 0);
    const rawDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    compressImage(rawDataUrl, 800, 0.75)
      .then(compressedUrl => setCaptured(compressedUrl))
      .catch(err => {
        console.error('Compression failed:', err);
        setCaptured(rawDataUrl);
      });
  };

  const retake = () => {
    setCaptured(null);
    if (!camReady) startCamera();
  };

  /* ══════════ LOCATION ══════════ */
  const getLocation = () => {
    setLocationLoading(true);
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError('Browser Anda tidak mendukung geolokasi GPS.');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationLoading(false);
      },
      (err) => {
        let msg = 'Izin lokasi ditolak. Harap aktifkan "Location Access" di browser.';
        if (err.code === err.POSITION_UNAVAILABLE) msg = 'Informasi lokasi tidak tersedia.';
        else if (err.code === err.TIMEOUT) msg = 'Waktu permintaan lokasi habis.';
        setLocationError(msg);
        setLocationLoading(false);
      },
      { timeout: 12000, enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  /* ══════════ FILTERED SEARCH RESULTS ══════════ */
  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees.slice(0, 15);
    const q = searchQuery.toLowerCase().trim();
    return employees.filter(e => 
      e.name.toLowerCase().includes(q) ||
      (e.nik && e.nik.toLowerCase().includes(q)) ||
      (e.username && e.username.toLowerCase().includes(q)) ||
      (e.jabatan?.nama_jabatan && e.jabatan.nama_jabatan.toLowerCase().includes(q))
    ).slice(0, 20);
  }, [employees, searchQuery]);

  const checkEmployeeStatus = async (empId: string) => {
    setCheckingStatus(true);
    try {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const todayStr = `${y}-${m}-${d}`;

      // Juga cek kemarin — konsisten dengan logika backend (shift malam yang belum pulang)
      const yesterday = new Date(now.getTime() - 24 * 3600 * 1000);
      const yy = yesterday.getFullYear();
      const ym = String(yesterday.getMonth() + 1).padStart(2, '0');
      const yd = String(yesterday.getDate()).padStart(2, '0');
      const yesterdayStr = `${yy}-${ym}-${yd}`;

      const NIGHT_SHIFT_TOLERANCE_HOURS = 18;
      
      const res = await fetch(`${API}/absensi_user_history/${empId}/${yesterdayStr}/${todayStr}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const records: any[] = json.data;

          // ── PRIORITAS 1: Shift yang sudah masuk tapi belum pulang (hari ini ATAU shift malam kemarin)
          const openShift = records.find((s: any) => {
            if (!s.jam_absen || s.jam_pulang) return false;
            const shiftDate = s.tanggal?.split('T')[0];
            // Shift hari ini yang sudah masuk belum pulang — selalu prioritas
            if (shiftDate === todayStr) return true;
            // Shift kemarin (shift malam) — cek toleransi 18 jam
            if (shiftDate === yesterdayStr) {
              const [h, mi] = s.jam_absen.split(':').map(Number);
              const [yr, mo, dy] = shiftDate.split('-').map(Number);
              const checkInTime = new Date(yr, mo - 1, dy, h, mi);
              const elapsedHours = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
              return elapsedHours >= -0.5 && elapsedHours < NIGHT_SHIFT_TOLERANCE_HOURS;
            }
            return false;
          });

          if (openShift) {
            const statusInfo = {
              hasCheckedIn: true,
              jamMasuk: openShift.jam_absen,
              hasCheckedOut: false,
              jamPulang: null,
            };
            setEmployeeAttendanceStatus(statusInfo);
            // Otomatis alihkan ke Absen Pulang
            setCurrentMode('keluar');
            return;
          }

          // ── PRIORITAS 2: Cek shift hari ini (belum masuk atau sudah selesai)
          const todayRecord = records.find((s: any) => {
            const shiftDate = s.tanggal?.split('T')[0];
            return shiftDate === todayStr;
          }) || records[0];

          if (todayRecord) {
            const statusInfo = {
              hasCheckedIn: !!todayRecord.jam_absen,
              jamMasuk: todayRecord.jam_absen,
              hasCheckedOut: !!todayRecord.jam_pulang,
              jamPulang: todayRecord.jam_pulang,
            };
            setEmployeeAttendanceStatus(statusInfo);

            // AUTO-SWITCH MODE
            if (statusInfo.hasCheckedIn && !statusInfo.hasCheckedOut) {
              setCurrentMode('keluar');
            } else if (!statusInfo.hasCheckedIn) {
              setCurrentMode('masuk');
            }
            return;
          }
        }
      }
      setEmployeeAttendanceStatus(null);
    } catch (e) {
      console.warn('Gagal cek status kehadiran pegawai:', e);
      setEmployeeAttendanceStatus(null);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleSelectEmployee = (emp: EmployeeQuick) => {
    setSelectedEmployee(emp);
    setSearchQuery('');
    setIsDropdownOpen(false);
    checkEmployeeStatus(emp.id);
  };

  const handleClearSelected = () => {
    setSelectedEmployee(null);
    setCaptured(null);
    setEmployeeAttendanceStatus(null);
    if (!camReady) startCamera();
  };

  /* ══════════ AUTO COUNTDOWN FOR NEXT ATTENDANCE ══════════ */
  useEffect(() => {
    let timer: any;
    if (step === 'result' && resultOk) {
      setCountdown(8);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleNextEmployee();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resultOk]);

  /* ══════════ SUBMIT ATTENDANCE ══════════ */
  const handleSubmit = async () => {
    if (!captured) return;
    if (!location) {
      getLocation();
      return;
    }

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
      formData.append('tipe_absen', currentMode);
      
      if (currentMode === 'keluar') {
        formData.append('jam_pulang', submitTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
      } else {
        formData.append('jam_absen', submitTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
      }
      
      // Gunakan waktu lokal Indonesia (YYYY-MM-DD), bukan toISOString() untuk cegah pergeseran tanggal sebelum 07:00 WIB
      const y = submitTime.getFullYear();
      const m = String(submitTime.getMonth() + 1).padStart(2, '0');
      const d = String(submitTime.getDate()).padStart(2, '0');
      formData.append('tanggal', `${y}-${m}-${d}`);

      // Kirim user_id untuk verifikasi 1:1 (Aman & Anti-Salah Orang)
      if (selectedEmployee) {
        formData.append('user_id', selectedEmployee.id);
      }

      // Tambahkan idempotency key untuk log/tracking retry di backend
      const idempotencyKey = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
      formData.append('idempotency_key', idempotencyKey);

      let absenRes;
      try {
        absenRes = await fetch(`${API}/absensi_wajah`, {
          method: 'POST',
          body: formData,
        });
      } catch (networkError: any) {
        throw new Error(`Koneksi terputus. Absensi Anda mungkin sudah tercatat jika ini adalah percobaan kedua. Jangan ulangi — periksa riwayat Anda atau hubungi admin.`);
      }

      const ct = absenRes.headers.get('content-type') ?? '';
      if (!ct.includes('application/json')) {
        if (absenRes.status === 504 || absenRes.status === 503 || absenRes.status === 502) {
            throw new Error(`Server sedang sibuk (Error ${absenRes.status}). Absensi Anda mungkin sudah tercatat. Jangan ulangi — tunggu konfirmasi di riwayat atau hubungi admin.`);
        }
        throw new Error(`Server error ${absenRes.status}`);
      }
      
      const json = await absenRes.json();
      if (!json.success) {
        throw new Error(json.message || 'Gagal mengenali wajah / absen');
      }

      setResultOk(true);
      setResultMsg(json.message || `Absen ${currentMode === 'masuk' ? 'Masuk' : 'Pulang'} berhasil dicatat!`);
      setResultTime(submitTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
      setResultData(json.user || selectedEmployee);
      
      if (selectedEmployee) {
        saveRecentEmployee(selectedEmployee);
      } else if (json.user) {
        saveRecentEmployee(json.user);
      }

      stopCamera();
      setStep('result');
    } catch (err: any) {
      setResultOk(false);
      setResultMsg(err.message || 'Terjadi kesalahan saat memproses absensi');
      setStep('result');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextEmployee = () => {
    setSelectedEmployee(null);
    setCaptured(null);
    setResultData(null);
    setResultOk(false);
    setResultMsg('');
    setStep('scan');
    startCamera();
    getLocation();
  };

  /* ══════════ THEME COLORS ══════════ */
  const isKeluar = currentMode === 'keluar';
  const brandGradient = isKeluar 
    ? 'from-[#990000] via-[#800000] to-[#660000]' 
    : 'from-[#34959E] via-[#287B83] to-[#1F6268]';
  const brandShadow = isKeluar ? 'shadow-[0_10px_30px_rgba(153,0,0,0.25)]' : 'shadow-[0_10px_30px_rgba(52,149,158,0.25)]';
  const brandBg = isKeluar ? 'bg-[#990000] hover:bg-[#800000]' : 'bg-[#34959E] hover:bg-[#287B83]';
  const brandBorder = isKeluar ? 'border-rose-200 focus:border-[#990000]' : 'border-teal-200 focus:border-[#34959E]';

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col font-sans antialiased text-slate-800">

      {/* ── HEADER ── */}
      <header className={cn('relative overflow-hidden pt-safe text-white shadow-lg', `bg-gradient-to-r ${brandGradient}`)}>
        {/* Glow circles */}
        <div className="absolute -top-16 -right-16 w-60 h-60 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-44 h-44 bg-black/15 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 pb-6 relative z-10">
          <div className="flex items-center justify-between gap-3">
            {/* Back Button */}
            <button
              onClick={() => { stopCamera(); navigate('/'); }}
              className="group flex items-center gap-2 px-3 py-2 bg-white/15 hover:bg-white/25 active:scale-95 backdrop-blur-md rounded-2xl border border-white/20 transition-all text-xs font-bold shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-white group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">Kembali</span>
            </button>

            {/* Hospital Logo & Title & Mode Selector */}
            <div className="text-center flex flex-col items-center gap-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {settings?.logo ? (
                  <img src={formatPhotoUrl(settings.logo)} className="w-6 h-6 object-contain rounded-md drop-shadow-sm" alt="Logo" />
                ) : (
                  <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center font-black text-xs">
                    BH
                  </div>
                )}
                <span className="font-extrabold text-xs sm:text-sm tracking-wider uppercase opacity-95 truncate">
                  {settings?.name || 'RS Bunda Halimah'}
                </span>
              </div>
              
              <h1 className="text-lg sm:text-2xl font-black tracking-tight drop-shadow-sm truncate">
                {isKeluar ? 'Akses Cepat · Absen Pulang' : 'Akses Cepat · Absen Masuk'}
              </h1>

              {/* Mode Switcher Tabs */}
              <div className="inline-flex items-center p-1 bg-black/25 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner mt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentMode('masuk');
                    setCaptured(null);
                  }}
                  className={cn(
                    'flex items-center gap-1.5 py-1.5 px-3 sm:px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all',
                    !isKeluar 
                      ? 'bg-white text-emerald-800 shadow-md scale-100' 
                      : 'text-white/75 hover:text-white hover:bg-white/10'
                  )}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Absen Masuk
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentMode('keluar');
                    setCaptured(null);
                  }}
                  className={cn(
                    'flex items-center gap-1.5 py-1.5 px-3 sm:px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all',
                    isKeluar 
                      ? 'bg-white text-rose-800 shadow-md scale-100' 
                      : 'text-white/75 hover:text-white hover:bg-white/10'
                  )}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Absen Pulang
                </button>
              </div>
            </div>

            {/* Realtime Digital Clock */}
            <div className="text-right bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/15 shrink-0">
              <p className="font-black text-xs sm:text-base tabular-nums tracking-wide text-white flex items-center gap-1.5 justify-end">
                <Clock className="w-3.5 h-3.5 opacity-80" />
                {now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })} <span className="text-[9px] font-bold opacity-75">WIB</span>
              </p>
              <p className="text-white/70 text-[9px] sm:text-[10px] font-semibold">
                {now.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
        <AnimatePresence mode="wait">

          {/* ════════════ STEP 1: SCAN & SELECT ════════════ */}
          {step === 'scan' && (
            <motion.div
              key="step-scan"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
            >
              
              {/* ── LEFT COLUMN: IDENTIFICATION & SEARCH (5 Cols on LG) ── */}
              <div className="lg:col-span-5 space-y-5">

                {/* Card Pegawai Terpilih / Form Pencarian */}
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-200/80 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-7 h-7 rounded-xl flex items-center justify-center', isKeluar ? 'bg-rose-100 text-rose-700' : 'bg-teal-100 text-[#287B83]')}>
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <h2 className="font-bold text-sm text-slate-800">Identitas Pegawai</h2>
                    </div>
                    {selectedEmployee && (
                      <button
                        onClick={handleClearSelected}
                        className="text-[11px] font-bold text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Ganti
                      </button>
                    )}
                  </div>

                  {/* JIKA PEGAWAI TERPILIH */}
                  {selectedEmployee ? (
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/80 border border-slate-200/90 space-y-3"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white border border-slate-200 shrink-0 shadow-sm">
                          {selectedEmployee.foto_karyawan ? (
                            <img
                              src={formatPhotoUrl(selectedEmployee.foto_karyawan)}
                              alt={selectedEmployee.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <User className="w-7 h-7" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-extrabold text-base text-slate-800 truncate">{selectedEmployee.name}</p>
                          <p className="text-xs text-slate-500 font-medium truncate">
                            {selectedEmployee.jabatan?.nama_jabatan || 'Pegawai RS Bunda Halimah'}
                          </p>
                          {selectedEmployee.nik && (
                            <p className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-wider">
                              NIP: {selectedEmployee.nik}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px]">
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                          <ShieldCheck className="w-3.5 h-3.5" /> Verifikasi 1:1 Aktif
                        </span>
                        <span className="text-slate-400 font-semibold">100% Anti-Salah</span>
                      </div>

                      {/* Status Kehadiran Hari Ini */}
                      {checkingStatus ? (
                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100/80 text-xs text-slate-500 font-medium animate-pulse">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#34959E]" />
                          Memeriksa status absen hari ini...
                        </div>
                      ) : employeeAttendanceStatus ? (
                        <div className={cn(
                          "p-3 rounded-xl border text-xs flex items-center justify-between gap-3",
                          employeeAttendanceStatus.hasCheckedIn && !employeeAttendanceStatus.hasCheckedOut
                            ? "bg-rose-50 border-rose-200 text-rose-800"
                            : employeeAttendanceStatus.hasCheckedOut
                            ? "bg-slate-100 border-slate-200 text-slate-700"
                            : "bg-emerald-50 border-emerald-200 text-emerald-800"
                        )}>
                          <div className="flex items-center gap-2 min-w-0">
                            <Clock className="w-4 h-4 shrink-0" />
                            <div className="truncate">
                              <p className="font-extrabold text-[11px] leading-tight truncate">
                                {employeeAttendanceStatus.hasCheckedIn && !employeeAttendanceStatus.hasCheckedOut
                                  ? `Sudah Masuk: pk. ${employeeAttendanceStatus.jamMasuk}`
                                  : employeeAttendanceStatus.hasCheckedOut
                                  ? `Shift Selesai (Masuk ${employeeAttendanceStatus.jamMasuk} · Pulang ${employeeAttendanceStatus.jamPulang})`
                                  : "Belum Absen Masuk Hari Ini"}
                              </p>
                              <p className="text-[10px] opacity-80 mt-0.5 truncate">
                                {employeeAttendanceStatus.hasCheckedIn && !employeeAttendanceStatus.hasCheckedOut
                                  ? "Mode otomatis dialihkan ke: Absen Pulang"
                                  : employeeAttendanceStatus.hasCheckedOut
                                  ? "Anda sudah absen pulang hari ini"
                                  : "Siap untuk Absen Masuk"}
                              </p>
                            </div>
                          </div>
                          <span className={cn(
                            "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0",
                            employeeAttendanceStatus.hasCheckedIn && !employeeAttendanceStatus.hasCheckedOut
                              ? "bg-rose-600 text-white"
                              : employeeAttendanceStatus.hasCheckedOut
                              ? "bg-slate-300 text-slate-800"
                              : "bg-emerald-600 text-white"
                          )}>
                            {employeeAttendanceStatus.hasCheckedIn && !employeeAttendanceStatus.hasCheckedOut
                              ? "Absen Pulang"
                              : employeeAttendanceStatus.hasCheckedOut
                              ? "Selesai"
                              : "Absen Masuk"}
                          </span>
                        </div>
                      ) : null}
                    </motion.div>
                  ) : (
                    /* JIKA BELUM MEMILIH PEGAWAI: SEARCH BOX */
                    <div className="space-y-3">
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        Cari nama atau NIP Anda untuk memastikan absensi tercatat dengan akurat:
                      </p>

                      <div className="relative" ref={dropdownRef}>
                        <div className="relative">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              setIsDropdownOpen(true);
                            }}
                            onFocus={() => setIsDropdownOpen(true)}
                            placeholder="Ketik Nama atau NIP Anda..."
                            className={cn(
                              'w-full pl-10 pr-10 py-3 rounded-xl text-sm font-semibold bg-slate-50 border outline-none transition-all',
                              brandBorder
                            )}
                          />
                          {searchQuery && (
                            <button
                              onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}
                              className="w-6 h-6 absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Search Dropdown / Suggestion List */}
                        <AnimatePresence>
                          {isDropdownOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              className="absolute top-full left-0 right-0 mt-1.5 max-h-64 overflow-y-auto bg-white rounded-2xl shadow-xl border border-slate-200 z-50 divide-y divide-slate-100"
                            >
                              {loadingEmployees ? (
                                <div className="p-4 text-center text-xs text-slate-400 font-bold flex items-center justify-center gap-2">
                                  <Loader2 className="w-4 h-4 animate-spin text-[#34959E]" />
                                  Memuat daftar pegawai...
                                </div>
                              ) : filteredEmployees.length > 0 ? (
                                filteredEmployees.map((emp) => (
                                  <button
                                    key={emp.id}
                                    type="button"
                                    onClick={() => handleSelectEmployee(emp)}
                                    className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 flex items-center gap-3 transition-colors group"
                                  >
                                    <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                                      {emp.foto_karyawan ? (
                                        <img src={formatPhotoUrl(emp.foto_karyawan)} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                        <User className="w-5 h-5 m-auto mt-2 text-slate-400" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-extrabold text-slate-800 truncate group-hover:text-[#34959E]">
                                        {emp.name}
                                      </p>
                                      <p className="text-[10px] text-slate-400 font-medium truncate">
                                        {emp.jabatan?.nama_jabatan || 'Pegawai'} {emp.nik ? `· ${emp.nik}` : ''}
                                      </p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#34959E] transition-colors" />
                                  </button>
                                ))
                              ) : (
                                <div className="p-4 text-center text-xs text-slate-400 font-medium">
                                  Tidak ditemukan pegawai dengan kata kunci &quot;{searchQuery}&quot;.
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* QUICK CHIPS: KARYAWAN TERAKHIR */}
                      {recentEmployees.length > 0 && !isDropdownOpen && (
                        <div className="pt-2 space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                            <History className="w-3 h-3" /> Karyawan Terakhir di Perangkat Ini:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {recentEmployees.map((emp) => (
                              <button
                                key={emp.id}
                                type="button"
                                onClick={() => handleSelectEmployee(emp)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/90 active:scale-95 text-slate-700 text-xs font-bold border border-slate-200 transition-all"
                              >
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                <span className="truncate max-w-[130px]">{emp.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* GPS Status Card */}
                <div className={cn(
                  'p-4 rounded-[20px] border flex items-center gap-3 transition-all',
                  location ? 'bg-emerald-50/80 border-emerald-200' : locationError ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'
                )}>
                  <div className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                    location ? 'bg-emerald-500 text-white' : locationError ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-400'
                  )}>
                    {locationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-slate-800">
                      {location ? 'Lokasi GPS Terdeteksi' : locationLoading ? 'Mencari Koordinat GPS...' : locationError ? 'Kendala Lokasi GPS' : 'Menunggu Lokasi GPS'}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate font-medium mt-0.5">
                      {location 
                        ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` 
                        : locationError || 'Harap izinkan akses lokasi browser.'}
                    </p>
                  </div>
                  {!location && !locationLoading && (
                    <button
                      onClick={getLocation}
                      title="Deteksi ulang GPS"
                      className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 text-xs font-bold transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Tips Box */}
                <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200/80 text-[11px] text-amber-800 font-medium space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-amber-900">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Tips Absen Lancar:
                  </p>
                  <p className="text-amber-700/90 leading-snug">
                    Posisikan wajah menghadap langsung ke kamera dengan pencahayaan yang cukup dan tanpa masker.
                  </p>
                </div>

              </div>

              {/* ── RIGHT COLUMN: CAMERA & SCANNER (7 Cols on LG) ── */}
              <div className="lg:col-span-7 space-y-5">
                <div className="bg-white rounded-[28px] p-5 sm:p-6 shadow-sm border border-slate-200/80 space-y-5">
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-800">Kamera Pindai Wajah</h3>
                      <p className="text-xs text-slate-400 font-medium">Arahkan pandangan wajah ke dalam area oval</p>
                    </div>
                    {camReady && !captured && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-black tracking-widest uppercase shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Live
                      </span>
                    )}
                  </div>

                  {/* Camera Viewfinder */}
                  <div 
                    className="relative bg-slate-950 rounded-[2rem] overflow-hidden shadow-xl border-4 border-slate-100 flex items-center justify-center"
                    style={{ aspectRatio: '4/3' }}
                  >
                    {/* Live Video */}
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
                        transition: 'opacity 0.2s',
                      }}
                    />

                    {/* Captured Snapshot */}
                    {captured && (
                      <img src={captured} alt="Captured" className="w-full h-full object-cover" />
                    )}

                    {/* Oval Face Guide Overlay */}
                    {camReady && !captured && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div 
                          className={cn(
                            'w-48 h-60 sm:w-56 sm:h-72 rounded-[50%] border-2 border-dashed transition-all duration-300 shadow-[0_0_0_9999px_rgba(15,23,42,0.55)]',
                            selectedEmployee ? 'border-teal-400 shadow-[0_0_25px_rgba(52,149,158,0.4)]' : 'border-white/50'
                          )}
                        />
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20">
                          <p className="text-[11px] font-bold text-white tracking-wide">
                            {selectedEmployee ? `Pindai Wajah: ${selectedEmployee.name}` : 'Arahkan wajah Anda ke tengah'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Loading State */}
                    {!camReady && !camError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900 text-white">
                        <Loader2 className="w-8 h-8 text-[#34959E] animate-spin" />
                        <p className="text-xs font-bold text-slate-300">Menghubungkan Kamera...</p>
                      </div>
                    )}

                    {/* Camera Error */}
                    {camError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center bg-slate-900 text-white">
                        <AlertCircle className="w-10 h-10 text-rose-400" />
                        <p className="text-xs font-semibold text-slate-200">{camError}</p>
                        <button
                          onClick={startCamera}
                          className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition-all"
                        >
                          Coba Lagi
                        </button>
                      </div>
                    )}

                    {/* Retake Button on Captured */}
                    {captured && !submitting && (
                      <button
                        onClick={retake}
                        className="absolute top-4 right-4 px-3 py-2 bg-black/70 hover:bg-black/90 backdrop-blur-md text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-white/20 shadow-lg transition-all"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Foto Ulang
                      </button>
                    )}

                    {/* Submitting Overlay */}
                    <AnimatePresence>
                      {submitting && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center z-50 text-white p-6 text-center"
                        >
                          <ShieldCheck className="w-12 h-12 text-teal-400 animate-pulse mb-3" />
                          <Loader2 className="w-8 h-8 text-white animate-spin mb-3" />
                          <p className="text-sm font-black uppercase tracking-wider text-teal-200">
                            Memverifikasi Biometrik Wajah...
                          </p>
                          <p className="text-xs text-slate-400 mt-1 max-w-xs font-medium">
                            {selectedEmployee ? `Mencocokkan dengan data referensi ${selectedEmployee.name}` : 'Menganalisis identitas wajah'}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <canvas ref={canvasRef} className="hidden" />
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="space-y-3">
                    {!captured ? (
                      <button
                        onClick={captureSnap}
                        disabled={!camReady || submitting}
                        className={cn(
                          'w-full py-4 sm:py-5 rounded-2xl font-black text-white text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50',
                          brandBg, brandShadow
                        )}
                      >
                        <Camera className="w-5 h-5" />
                        {selectedEmployee 
                          ? `Ambil Foto & Absen ${isKeluar ? 'Pulang' : 'Masuk'} (${selectedEmployee.name.split(' ')[0]})` 
                          : `Ambil Foto Selfie (${isKeluar ? 'Absen Pulang' : 'Absen Masuk'})`}
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmit}
                        disabled={submitting || !location}
                        className={cn(
                          'w-full py-4 sm:py-5 rounded-2xl font-black text-white text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50',
                          brandBg, brandShadow
                        )}
                      >
                        <Camera className="w-5 h-5" />
                        {isKeluar ? 'Kirim & Verifikasi Absen Pulang' : 'Kirim & Verifikasi Absen Masuk'}
                      </button>
                    )}

                    {!selectedEmployee && (
                      <p className="text-[11px] text-center text-slate-400 font-semibold">
                        💡 Rekomendasi: Cari dan pilih nama Anda di kolom kiri untuk verifikasi 100% akurat.
                      </p>
                    )}
                  </div>

                </div>
              </div>

            </motion.div>
          )}

          {/* ════════════ STEP 2: RESULT SCREEN ════════════ */}
          {step === 'result' && (
            <motion.div
              key="step-result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-xl mx-auto w-full bg-white rounded-[32px] p-6 sm:p-8 shadow-xl border border-slate-200/80 text-center space-y-6"
            >
              {/* Status Animated Icon */}
              <div className="relative flex justify-center">
                <div className={cn(
                  'w-24 h-24 sm:w-28 sm:h-28 rounded-3xl flex items-center justify-center border-4 shadow-xl',
                  resultOk ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-emerald-500/20' : 'bg-rose-50 border-rose-200 text-rose-600 shadow-rose-500/20'
                )}>
                  {resultOk ? (
                    <CheckCircle2 className="w-14 h-14 animate-bounce" />
                  ) : (
                    <AlertCircle className="w-14 h-14 animate-pulse" />
                  )}
                </div>
              </div>

              {/* Title & Message */}
              <div className="space-y-2">
                <h2 className={cn('text-2xl sm:text-3xl font-black tracking-tight', resultOk ? 'text-emerald-700' : 'text-rose-700')}>
                  {resultOk ? (isKeluar ? 'Absen Pulang Berhasil!' : 'Absen Masuk Berhasil!') : 'Verifikasi Absensi Gagal'}
                </h2>
                <p className="text-sm font-semibold text-slate-600 max-w-md mx-auto leading-relaxed">
                  {resultMsg}
                </p>
                {resultOk && resultTime && (
                  <div className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-800 font-extrabold text-sm border border-slate-200">
                    <Clock className="w-4 h-4 text-[#34959E]" />
                    {resultTime} WIB · {isKeluar ? 'Absen Pulang' : 'Absen Masuk'}
                  </div>
                )}
              </div>

              {/* Verified Employee Card (on Success) */}
              {resultOk && (resultData || selectedEmployee) && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-4 text-left max-w-md mx-auto shadow-sm">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white border border-slate-200 shrink-0">
                    {(resultData?.foto_karyawan || selectedEmployee?.foto_karyawan) ? (
                      <img
                        src={formatPhotoUrl(resultData?.foto_karyawan || selectedEmployee?.foto_karyawan)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-7 h-7 m-auto mt-3 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-slate-800 text-base truncate">
                      {resultData?.name || selectedEmployee?.name}
                    </p>
                    <p className="text-xs text-slate-500 font-medium truncate">
                      {resultData?.jabatan?.nama_jabatan || selectedEmployee?.jabatan?.nama_jabatan || 'Pegawai RS Bunda Halimah'}
                    </p>
                    <p className="text-[10px] font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Identitas Terverifikasi 1:1
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons & Quick Queue */}
              <div className="space-y-3 pt-2 max-w-md mx-auto">
                {resultOk ? (
                  <>
                    <button
                      onClick={handleNextEmployee}
                      className={cn(
                        'w-full py-4 rounded-2xl font-black text-white text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg',
                        brandBg, brandShadow
                      )}
                    >
                      <UserCheck className="w-4 h-4" />
                      Absen Karyawan Berikutnya ({countdown}s)
                    </button>
                    <button
                      onClick={() => navigate('/')}
                      className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all"
                    >
                      Selesai & Kembali ke Beranda
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setCaptured(null);
                        setStep('scan');
                        startCamera();
                      }}
                      className={cn(
                        'w-full py-4 rounded-2xl font-black text-white text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg',
                        brandBg, brandShadow
                      )}
                    >
                      <RefreshCw className="w-4 h-4" /> Coba Pindai Ulang
                    </button>
                    <button
                      onClick={() => {
                        handleNextEmployee();
                      }}
                      className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all"
                    >
                      Pilih Nama Pegawai Lain
                    </button>
                  </>
                )}
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ── FOOTER ── */}
      <footer className="py-4 text-center text-[11px] text-slate-400 font-medium">
        {settings?.footer || `© 2026 ${settings?.name || 'RS Bunda Halimah'} · HRIS Smart Attendance Platform`}
      </footer>

    </div>
  );
}
