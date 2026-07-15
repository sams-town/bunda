import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  Clock, 
  Calendar, 
  Zap, 
  Loader2,
  FileText,
  Send,
  Timer,
  Download,
  User,
  UploadCloud,
  Trash2,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useToast } from './Toast';

const BASE_URL = import.meta.env.VITE_API_MEANDPAY;

export function MobileOvertimeEntryPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [templateUrl, setTemplateUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    jam_lembur: '',
    lama_lembur: '',
    keterangan: '',
    id_manager: ''
  });
  const [managers, setManagers] = useState<{ id: string; name: string }[]>([]);
  const [fileLembur, setFileLembur] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [locationState, setLocationState] = useState<{ lat: number; lng: number } | null>(null);
  const [officeLocation, setOfficeLocation] = useState<any>(null);

  const getFileUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('blob:')) return path;
    let cleanPath = path.replace(/^\//, '');
    if (cleanPath.startsWith('uploads/')) cleanPath = cleanPath.slice(8);
    const apiData = import.meta.env.VITE_API_MEANDPAY_DATA;
    const apiBase = import.meta.env.VITE_API_MEANDPAY;
    const base = (apiData || apiBase || 'https://rsthb.id/apihris').replace(/\/api$/, '').replace(/\/$/, '');
    return `${base}/uploads/${cleanPath}`;
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    fetchTemplate();
    if (user.id) {
      fetchManagers(user.id);
      fetchOfficeLocation(user);
    }
  }, []);

  const fetchOfficeLocation = async (user: any) => {
    try {
      const lokasiId = user?.lokasi_id || user?.lokasi?.id;
      if (!lokasiId) return;
      const res = await fetch(`${BASE_URL}/lokasi/${lokasiId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();
      if (json.success) setOfficeLocation(json.data);
    } catch (err) {}
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const dPhi = (lat2 - lat1) * Math.PI / 180;
    const dLambda = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dPhi/2) * Math.sin(dPhi/2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda/2) * Math.sin(dLambda/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const getLocation = () => {
    if (!navigator.geolocation) return addToast({ type: 'error', title: 'Error', message: 'Geolocation tidak didukung' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationState({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        addToast({ type: 'success', title: 'Lokasi OK', message: 'Koordinat berhasil dideteksi' });
      },
      () => addToast({ type: 'error', title: 'Gagal', message: 'Tidak dapat mengakses lokasi' })
    );
  };

  const fetchManagers = async (userId: string) => {
    try {
      const resUser = await fetch(`${BASE_URL}/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const jsonUser = await resUser.json();
      const me = jsonUser.data;
      
      if (me?.jabatan_id) {
        const resJab = await fetch(`${BASE_URL}/jabatans`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const jsonJab = await resJab.json();
        const myJab = jsonJab.data?.find((j: any) => j.id.toString() === me.jabatan_id.toString());
        
        if (myJab) {
          const results: any[] = [];
          if (myJab.manager) {
            results.push({ id: String(myJab.manager), name: `${myJab.manager_name} (${myJab.nama_jabatan})` });
          }
          
          setManagers(results);
          if (results.length > 0) {
             setFormData(prev => ({ ...prev, id_manager: results[0].id }));
          }
        }
      }
    } catch (err) { }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileLembur(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setFilePreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const fetchTemplate = async () => {
    try {
      const res = await fetch(`${BASE_URL}/settings/1`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();
      const item = Array.isArray(json.data) ? json.data[0] : json.data;
      if (item?.file_form_lembur) setTemplateUrl(getFileUrl(item.file_form_lembur));
    } catch (err) {
      console.error('Failed to fetch template:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.jam_lembur || !formData.lama_lembur || !formData.id_manager || !locationState) {
      return addToast({ type: 'warning', title: 'Data Kurang', message: 'Jam, durasi, manager, dan lokasi wajib diisi.' });
    }

    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Fetch full user for lokasi_id
      const resUser = await fetch(`${BASE_URL}/users/${user.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const jsonUserDetails = await resUser.json();
      const me = jsonUserDetails.data;
      const lokasi_id = me?.lokasi_id || user?.lokasi_id || '1';

      let distance = 0;
      if (officeLocation && locationState) {
        distance = calculateDistance(
          locationState.lat, locationState.lng, 
          parseFloat(officeLocation.lat_kantor), parseFloat(officeLocation.long_kantor)
        );
      }

      const fd = new FormData();
      fd.append('user_id', String(user.id));
      fd.append('lokasi_id', String(lokasi_id));
      fd.append('tanggal', formData.tanggal);
      fd.append('jam_masuk', `${formData.tanggal} ${formData.jam_lembur}`);
      fd.append('lama_lembur', String(formData.lama_lembur));
      fd.append('keterangan', formData.keterangan);
      fd.append('id_manager', String(formData.id_manager));
      fd.append('lat_masuk', String(locationState.lat));
      fd.append('long_masuk', String(locationState.lng));
      fd.append('jarak_masuk', distance.toFixed(2));
      fd.append('status_lembur', 'Pending');
      fd.append('status', 'Pending');
      
      if (fileLembur) {
        fd.append('file_lembur', fileLembur);
      }

      const res = await fetch(`${BASE_URL}/lemburs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: fd
      });
      
      const json = await res.json();
      if (json.success) {
        addToast({ type: 'success', title: 'Berhasil', message: 'Pengajuan lembur telah dikirim.' });
        navigate('/overtime-data');
      } else {
        addToast({ type: 'error', title: 'Gagal', message: json.message || 'Terjadi kesalahan saat mengirim pengajuan.' });
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Gagal', message: 'Terjadi kesalahan saat menghubungi server.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32">
      {/* Header */}
      <div className="bg-indigo-700 pt-12 pb-24 px-6 rounded-b-[3.5rem] relative shadow-2xl shadow-indigo-500/20">
        <div className="flex items-center gap-4 relative z-10 text-white">
          <button onClick={() => navigate('/beranda')} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-black tracking-tight">Pengajuan Lembur</h1>
        </div>
      </div>

      {/* Form Card */}
      <div className="px-6 -mt-12 relative z-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] shadow-2xl p-8 border border-slate-100"
        >
          {templateUrl && (
            <div className="bg-amber-50 border border-amber-100 p-5 rounded-[2rem] flex flex-col gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-600 shadow-sm border border-amber-50">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest leading-none">Formulir Lembur</p>
                  <p className="text-[9px] font-bold text-amber-500 mt-1 leading-tight">Unduh dan isi formulir ini sebelum mengirim pengajuan.</p>
                </div>
              </div>
              <a 
                href={templateUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full py-4 bg-white border border-amber-200 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black text-amber-600 uppercase tracking-[0.1em] shadow-sm active:scale-95 transition-all"
              >
                <Download className="w-4 h-4" />
                Unduh Template
              </a>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal</label>
               <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500" />
                  <input 
                    type="date" 
                    value={formData.tanggal}
                    onChange={(e) => setFormData({...formData, tanggal: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jam Mulai</label>
                 <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500" />
                    <input 
                      type="time" 
                      value={formData.jam_lembur}
                      onChange={(e) => setFormData({...formData, jam_lembur: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    />
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lokasi Presensi</label>
                 <button
                   type="button"
                   onClick={getLocation}
                   className={cn(
                     "w-full h-full min-h-[58px] rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all",
                     locationState ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-50 text-slate-400 border border-slate-200 hover:bg-slate-100"
                   )}
                 >
                   {locationState ? <CheckCircle2 className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                   {locationState ? 'Lokasi OK' : 'Cek Lokasi'}
                 </button>
              </div>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Durasi (Jam)</label>
               <div className="relative">
                  <Timer className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500" />
                  <input 
                    type="number" 
                    placeholder="Contoh: 2"
                    value={formData.lama_lembur}
                    onChange={(e) => setFormData({...formData, lama_lembur: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
               </div>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Keterangan Pekerjaan</label>
               <div className="relative">
                  <FileText className="absolute left-4 top-5 w-5 h-5 text-indigo-500" />
                  <textarea 
                    placeholder="Apa yang Anda kerjakan saat lembur?"
                    value={formData.keterangan}
                    onChange={(e) => setFormData({...formData, keterangan: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all min-h-[120px] resize-none"
                  />
               </div>
            </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Manager (Divisi)</label>
                 <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500" />
                    <select 
                      value={formData.id_manager}
                      onChange={(e) => setFormData({...formData, id_manager: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none"
                    >
                      <option value="">Pilih Manager</option>
                      {managers.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                 </div>
              </div>

               {/* Upload Bukti Lembur */}
               <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lampiran Bukti Lembur (Opsional)</label>
                 
                 {!fileLembur ? (
                   <div className="relative group">
                     <input 
                       type="file" 
                       onChange={handleFileChange}
                       className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                       accept="image/*,.pdf,.doc,.docx"
                     />
                     <div className="w-full border-2 border-dashed border-slate-200 rounded-[2rem] py-10 flex flex-col items-center justify-center gap-4 bg-slate-50 group-hover:bg-indigo-50 group-hover:border-indigo-200 transition-all">
                       <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-slate-400 group-hover:text-indigo-500 shadow-sm border border-slate-100 group-hover:border-indigo-100 transition-all">
                         <UploadCloud className="w-8 h-8" />
                       </div>
                       <div className="text-center">
                         <p className="text-sm font-black text-slate-600 group-hover:text-indigo-600 transition-all">Pilih atau Seret Dokumen Berkas Lembur</p>
                         <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Image, PDF, DOC (Max 5MB)</p>
                       </div>
                     </div>
                   </div>
                 ) : (
                   <div className="relative bg-slate-50 rounded-[2rem] p-4 border border-slate-100 flex items-center gap-4">
                     {filePreview ? (
                       <img src={filePreview} className="w-16 h-16 rounded-2xl object-cover shadow-sm border border-white" alt="Preview" />
                     ) : (
                       <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm">
                         <FileText className="w-8 h-8" />
                       </div>
                     )}
                     <div className="flex-1 min-w-0">
                       <p className="text-sm font-black text-slate-700 truncate">{fileLembur.name}</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{(fileLembur.size / 1024).toFixed(1)} KB</p>
                     </div>
                     <button 
                       type="button"
                       onClick={() => { setFileLembur(null); setFilePreview(null); }}
                       className="p-3 bg-white text-rose-500 rounded-xl hover:bg-rose-50 transition-all border border-slate-100 shadow-sm"
                     >
                       <Trash2 className="w-5 h-5" />
                     </button>
                   </div>
                 )}
               </div>

               <button 
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 py-6 rounded-3xl text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>
                  <Send className="w-5 h-5" />
                  Kirim Pengajuan
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>

      <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-10">Pastikan data yang diinput sudah benar</p>
    </div>
  );
}
