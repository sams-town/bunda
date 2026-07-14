import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import * as XLSX from 'xlsx';
import { Search, ChevronDown, ArrowUpDown, Eye, Edit, Trash2, Download, Plus, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '../lib/utils';
import { useToast } from './Toast';

export function KunjunganPage() {
  const [isAdding, setIsAdding] = useState(false);
  const [employees, setEmployees] = useState<{ id: string, name: string }[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Add Form State
  const [selectedUser, setSelectedUser] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [keterangan, setKeterangan] = useState('');
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast, updateToast } = useToast();

  // Modal States
  const [viewData, setViewData] = useState<any | null>(null);
  const [editData, setEditData] = useState<any | null>(null);
  const [deleteData, setDeleteData] = useState<any | null>(null);

  // Table State
  const [kunjunganData, setKunjunganData] = useState<any[]>([]);
  const [loadingTable, setLoadingTable] = useState(false);


  const fetchKunjungan = async () => {
    setLoadingTable(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/kunjungan`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();
      if (json.success) {
        setKunjunganData(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTable(false);
    }
  };

  useEffect(() => {
    if (!isAdding) {
      fetchKunjungan();
    }
  }, [isAdding]);

  useEffect(() => {
    if (employees.length === 0) {
      setLoadingEmployees(true);
      fetch(`${import.meta.env.VITE_API_MEANDPAY}/users`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
        .then(res => res.json())
        .then(json => {
          if (json.success) setEmployees(json.data);
        })
        .catch(err => console.error('Error fetching employees:', err))
        .finally(() => setLoadingEmployees(false));
    }
  }, [employees.length]);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setShowMap(true);
          addToast({ type: 'success', title: 'Lokasi Ditemukan', message: 'Berhasil mendapatkan koordinat lokasi saat ini.' });
        },
        (err) => {
          console.error(err);
          addToast({ type: 'error', title: 'Gagal', message: 'Gagal mendapatkan lokasi. Pastikan izin lokasi diberikan.' });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      addToast({ type: 'error', title: 'Tidak Didukung', message: 'Geolocation tidak didukung oleh browser ini.' });
    }
  };

  const handleSubmit = async () => {
    if (!selectedUser) return addToast({ type: 'error', title: 'Validasi', message: 'Silakan pilih pegawai terlebih dahulu.' });
    if (!location) return addToast({ type: 'error', title: 'Validasi', message: 'Silakan ambil lokasi terlebih dahulu.' });
    if (!foto) return addToast({ type: 'error', title: 'Validasi', message: 'Silakan upload foto.' });

    setIsSubmitting(true);
    const toastId = addToast({ type: 'loading', title: 'Menyimpan', message: 'Sedang menyimpan data kunjungan...' });

    try {
      const formData = new FormData();
      formData.append('user_id', selectedUser);
      formData.append('foto', foto);
      formData.append('keterangan', keterangan);
      formData.append('lat_in', location.lat.toString());
      formData.append('long_in', location.lng.toString());

      // Format waktu saat ini untuk visit_in dan tanggal
      const now = new Date();
      const tanggal = now.toISOString().split('T')[0];
      const visitIn = now.toISOString(); // Use Full ISO string instead of just time
      formData.append('tanggal', tanggal);
      formData.append('visit_in', visitIn);

      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/kunjungan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const json = await res.json();
      if (json.success) {
        updateToast(toastId, { type: 'success', title: 'Berhasil', message: 'Data kunjungan berhasil disimpan!' });

        // Reset form state
        setSelectedUser('');
        setFoto(null);
        setKeterangan('');
        setLocation(null);
        setShowMap(false);
        setIsAdding(false);
      } else {
        updateToast(toastId, { type: 'error', title: 'Gagal', message: json.message || 'Gagal menyimpan kunjungan' });
      }
    } catch (err: any) {
      console.error(err);
      updateToast(toastId, { type: 'error', title: 'Error Sistem', message: 'Terjadi kesalahan saat menyimpan.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteData) return;
    const id = deleteData.id;
    setDeleteData(null);

    const toastId = addToast({ type: 'loading', title: 'Menghapus', message: 'Sedang menghapus data kunjungan...' });
    try {
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/kunjungan/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const json = await res.json();

      if (json.success) {
        updateToast(toastId, { type: 'success', title: 'Berhasil', message: 'Data kunjungan berhasil dihapus!' });
        fetchKunjungan(); // Refresh Table
      } else {
        updateToast(toastId, { type: 'error', title: 'Gagal', message: json.message || 'Gagal menghapus kunjungan' });
      }
    } catch (err: any) {
      console.error(err);
      updateToast(toastId, { type: 'error', title: 'Error Sistem', message: 'Terjadi kesalahan saat menghapus data.' });
    }
  };

  const handleExportExcel = async () => {
    const toastId = addToast({ type: 'loading', title: 'Export Excel', message: 'Sedang menyiapkan data...' });
    try {
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/kunjungan?limit=100000`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      const allData: any[] = json.data;
      const exportData = allData.map((item, index) => ({
        'No': index + 1,
        'Nama Pegawai': item.users?.name || 'Unknown',
        'Tanggal': item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : '-',
        'Visit In': item.visit_in || '-',
        'Visit Out': item.visit_out || '-',
        'Status': item.status || 'Berlangsung',
        'Keterangan': item.keterangan || '-'
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data Kunjungan');

      ws['!cols'] = [
        { wch: 5 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 40 }
      ];

      XLSX.writeFile(wb, `Data_Kunjungan_${new Date().toISOString().split('T')[0]}.xlsx`);
      updateToast(toastId, { type: 'success', title: 'Berhasil', message: 'Data berhasil di-export ke Excel' });
    } catch (err: any) {
      console.error('Export error:', err);
      updateToast(toastId, { type: 'error', title: 'Gagal', message: err.message || 'Gagal mengekspor data' });
    }
  };


  const mapIcon = L.divIcon({
    className: '',
    html: `<div style="width:36px;height:36px;background:#ef4444;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 4px 14px rgba(239,68,68,0.4)"><div style="width:10px;height:10px;background:white;border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(45deg)"></div></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editData) return;

    setIsSubmitting(true);
    const toastId = addToast({ type: 'loading', title: 'Menyimpan', message: 'Sedang menyimpan perubahan...' });

    try {
      const formData = new FormData();
      formData.append('user_id', editData.user_id);
      if (editData.newFoto) formData.append('foto', editData.newFoto);
      formData.append('keterangan', editData.keterangan || '');

      if (editData.lat_in) formData.append('lat_in', editData.lat_in);
      if (editData.long_in) formData.append('long_in', editData.long_in);
      if (editData.lat_out) formData.append('lat_out', editData.lat_out);
      if (editData.long_out) formData.append('long_out', editData.long_out);

      if (editData.visit_out) formData.append('visit_out', editData.visit_out);
      if (editData.tanggal) formData.append('tanggal', editData.tanggal);
      if (editData.visit_in) formData.append('visit_in', editData.visit_in);

      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/kunjungan/${editData.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });

      const json = await res.json();
      if (json.success) {
        updateToast(toastId, { type: 'success', title: 'Berhasil', message: 'Perubahan berhasil disimpan!' });
        setEditData(null);
        fetchKunjungan();
      } else {
        updateToast(toastId, { type: 'error', title: 'Gagal', message: json.message || 'Gagal menyimpan perubahan.' });
      }
    } catch (err: any) {
      console.error(err);
      updateToast(toastId, { type: 'error', title: 'Error Sistem', message: 'Terjadi kesalahan sistem.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAdding) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-6 pb-20"
      >
        <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-6 flex items-center justify-between">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Visit In</h1>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleGetLocation}
              className="px-6 py-2.5 bg-[#66BB6A] text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-[#4CAF50] transition-all active:scale-95 text-sm whitespace-nowrap"
            >
              Lihat Lokasi Saya
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-6 py-2.5 bg-rose-500 text-white rounded-xl font-bold shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95 text-sm"
            >
              Back
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-8 space-y-8">
          {showMap && location && (
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700">Lokasi Anda</label>
              <div className="relative w-full h-[300px] rounded-2xl overflow-hidden border border-slate-200 z-0">
                <MapContainer center={[location.lat, location.lng]} zoom={16} zoomControl={false} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                  <Marker position={[location.lat, location.lng]} icon={mapIcon}>
                    <Popup>Lokasi Anda Saat Ini</Popup>
                  </Marker>
                  <Circle center={[location.lat, location.lng]} radius={30} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.2 }} />
                </MapContainer>
              </div>
              <p className="text-xs font-bold text-slate-500">
                Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700">Nama</label>
            <div className="relative">
              <select
                value={selectedUser}
                onChange={e => setSelectedUser(e.target.value)}
                className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer"
              >
                <option value="">-- Pilih --</option>
                {loadingEmployees ? (
                  <option value="" disabled>Loading...</option>
                ) : (
                  employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))
                )}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700">Foto</label>
            <div className="flex w-full items-center">
              <input
                type="file"
                id="foto-kunjungan"
                className="hidden"
                onChange={e => setFoto(e.target.files ? e.target.files[0] : null)}
              />
              <label
                htmlFor="foto-kunjungan"
                className="px-4 py-3 bg-slate-100 text-slate-700 text-sm font-semibold rounded-l-xl cursor-pointer hover:bg-slate-200 transition-colors border border-slate-200 border-r-0"
              >
                Pilih File
              </label>
              <div className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-r-xl text-sm text-slate-500 truncate">
                {foto ? foto.name : 'Tidak ada file yang dipilih'}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700">Keterangan</label>
            <textarea
              value={keterangan}
              onChange={e => setKeterangan(e.target.value)}
              className="w-full min-h-[160px] resize-y bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-8 py-3 bg-[#1e3a5f] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-slate-500/20 hover:bg-[#152a45] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Menyimpan...' : 'Submit'}
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Kunjungan</h1>
        <div className="flex gap-3">
          <button
            onClick={handleExportExcel}
            className="px-6 py-2.5 bg-[#66BB6A] text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-[#4CAF50] transition-all active:scale-95 flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Tambah
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-8 space-y-8">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative min-w-[240px]">
            <select className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm font-bold text-slate-600 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer">
              <option value="">Pilih Pegawai</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Tanggal Mulai"
              onFocus={(e) => e.target.type = 'date'}
              onBlur={(e) => e.target.type = 'text'}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all w-48"
            />
            <input
              type="text"
              placeholder="Tanggal Akhir"
              onFocus={(e) => e.target.type = 'date'}
              onBlur={(e) => e.target.type = 'text'}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all w-48"
            />
          </div>

          <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Search className="w-5 h-5" />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto -mx-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-y border-slate-100">
                {['No.', 'Nama', 'Tanggal', 'Visit In', 'Visit Out', 'Status', 'Actions'].map((header) => (
                  <th key={header} className="py-4 px-8 text-[11px] font-black text-slate-500 uppercase tracking-widest text-left whitespace-nowrap">
                    <div className="flex items-center gap-2 group cursor-pointer">
                      {header}
                      <ArrowUpDown className="w-3 h-3  transition-opacity" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loadingTable ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex justify-center items-center">
                      <div className="w-8 h-8 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : kunjunganData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center font-bold text-slate-400">
                    Tidak ada data kunjungan.
                  </td>
                </tr>
              ) : kunjunganData.map((row, index) => (
                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-8 text-xs font-bold text-slate-600">{index + 1}</td>
                  <td className="py-4 px-8 text-xs font-bold text-slate-900">{row.users?.name || 'Unknown'}</td>
                  <td className="py-4 px-8 text-xs font-bold text-slate-600">{row.tanggal ? new Date(row.tanggal).toLocaleDateString('id-ID') : '-'}</td>
                  <td className="py-4 px-8 text-xs font-bold text-slate-600">{row.visit_in || '-'}</td>
                  <td className="py-4 px-8 text-xs font-bold text-slate-600">{row.visit_out || '-'}</td>
                  <td className="py-4 px-8">
                    <span className={cn(
                      "px-2 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg",
                      row.status === 'Selesai' ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"
                    )}>
                      {row.status || 'Berlangsung'}
                    </span>
                  </td>
                  <td className="py-4 px-8">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewData(row)} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => setEditData(row)} className="p-1.5 text-slate-400 hover:text-amber-600 transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteData(row)} className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Data Modal */}
      {viewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-3xl bg-white rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Detail Kunjungan</h3>
              <button onClick={() => setViewData(null)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all">✕</button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nama Pegawai</label>
                  <p className="text-sm font-semibold text-slate-800 mt-1">{viewData.users?.name || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tanggal</label>
                  <p className="text-sm font-semibold text-slate-800 mt-1">{viewData.tanggal ? new Date(viewData.tanggal).toLocaleDateString('id-ID') : '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Keterangan</label>
                  <p className="text-sm font-semibold text-slate-800 mt-1">{viewData.keterangan || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status</label>
                  <p className="mt-1"><span className={cn("px-2 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg", viewData.status === 'Selesai' ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600")}>{viewData.status || 'Berlangsung'}</span></p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-700">Check In</h4>
                  <div className="space-y-2">
                    <p className="text-sm"><span className="text-slate-500 font-semibold">Jam:</span> <span className="font-bold">{viewData.visit_in || '-'}</span></p>
                    {viewData.foto_in && (
                      viewData.foto_in.toLowerCase().endsWith('.pdf') ? (
                        <a href={viewData.foto_in} target="_blank" rel="noreferrer" className="flex flex-col gap-2 items-center justify-center w-full h-40 bg-indigo-50 text-indigo-600 font-bold rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors text-sm">
                          <Download className="w-6 h-6" />
                          <span>Buka PDF / Dokumen</span>
                        </a>
                      ) : (
                        <img src={viewData.foto_in.startsWith('http') ? viewData.foto_in : `${import.meta.env.VITE_API_MEANDPAY.replace('/api', '')}/${viewData.foto_in}`} alt="Foto In" className="w-full h-40 object-cover rounded-xl border border-slate-200" />
                      )
                    )}
                    {(() => {
                      const lat = parseFloat(viewData.lat_in);
                      const lng = parseFloat(viewData.long_in);
                      if (isNaN(lat) || isNaN(lng)) return null;
                      return (
                        <div className="h-40 relative rounded-xl overflow-hidden border border-slate-200 z-0">
                          <MapContainer center={[lat, lng]} zoom={15} zoomControl={false} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                            <Marker position={[lat, lng]} icon={mapIcon} />
                          </MapContainer>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-700">Check Out</h4>
                  <div className="space-y-2">
                    <p className="text-sm"><span className="text-slate-500 font-semibold">Jam:</span> <span className="font-bold">{viewData.visit_out || '-'}</span></p>
                    {viewData.foto_out && (
                      viewData.foto_out.toLowerCase().endsWith('.pdf') ? (
                        <a href={viewData.foto_out} target="_blank" rel="noreferrer" className="flex flex-col gap-2 items-center justify-center w-full h-40 bg-indigo-50 text-indigo-600 font-bold rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors text-sm">
                          <Download className="w-6 h-6" />
                          <span>Buka PDF / Dokumen</span>
                        </a>
                      ) : (
                        <img src={viewData.foto_out.startsWith('http') ? viewData.foto_out : `${import.meta.env.VITE_API_MEANDPAY.replace('/api', '')}/${viewData.foto_out}`} alt="Foto Out" className="w-full h-40 object-cover rounded-xl border border-slate-200" />
                      )
                    )}
                    {(() => {
                      const lat = parseFloat(viewData.lat_out);
                      const lng = parseFloat(viewData.long_out);
                      if (isNaN(lat) || isNaN(lng)) return null;
                      return (
                        <div className="h-40 relative rounded-xl overflow-hidden border border-slate-200 z-0">
                          <MapContainer center={[lat, lng]} zoom={15} zoomControl={false} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                            <Marker position={[lat, lng]} icon={mapIcon} />
                          </MapContainer>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end">
              <button onClick={() => setViewData(null)} className="px-6 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-sm">Tutup</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Data Modal */}
      {editData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto py-10">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-2xl bg-white rounded-[24px] shadow-2xl overflow-hidden flex flex-col my-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Edit Kunjungan</h3>
              <button type="button" onClick={() => setEditData(null)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all">✕</button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-2 block">Keterangan</label>
                  <textarea
                    value={editData.keterangan || ''}
                    onChange={e => setEditData({ ...editData, keterangan: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-2 block">Visit In</label>
                    <input
                      type="text"
                      value={editData.visit_in || ''}
                      onChange={e => setEditData({ ...editData, visit_in: e.target.value })}
                      placeholder="HH:MM:SS"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-2 block">Visit Out</label>
                    <input
                      type="text"
                      value={editData.visit_out || ''}
                      onChange={e => setEditData({ ...editData, visit_out: e.target.value })}
                      placeholder="HH:MM:SS"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-2 block">Update Foto In</label>
                    <input type="file" onChange={e => setEditData({ ...editData, newFoto: e.target.files ? e.target.files[0] : null })} className="w-full text-sm" />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setEditData(null)} className="px-6 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-sm">Batal</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all text-sm disabled:opacity-70">
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden text-center p-8">
            <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8 text-rose-500" />
            </div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">Hapus Kunjungan?</h3>
            <p className="text-sm font-medium text-slate-500 mb-8">Data kunjungan dari <span className="font-bold text-slate-700">{deleteData.users?.name || 'pegawai ini'}</span> akan dihapus permanen.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteData(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-sm">Batal</button>
              <button onClick={handleDelete} disabled={isSubmitting} className="flex-1 py-3 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-all text-sm shadow-lg shadow-rose-500/20 disabled:opacity-70">
                Hapus
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
