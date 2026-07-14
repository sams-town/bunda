import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  MapPin,
  Search,
  Plus,
  Edit2,
  Trash2,
  QrCode,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Check,
  CheckCircle,
  Download
} from 'lucide-react';
import { cn } from '../lib/utils';
import { AddLocation } from './AddLocation';
import { PendingLocations } from './PendingLocations';
import { EditLocation } from './EditLocation';
import { useToast } from './Toast';
import { AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';

interface Location {
  id: string;
  nama_lokasi: string;
  lat_kantor: string;
  long_kantor: string;
  radius: string;
  keterangan: string;
  status: string;
  created_by: string;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  users_lokasis_created_byTousers: { id: string; name: string } | null;
  users_lokasis_approved_byTousers: { id: string; name: string } | null;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: Location[];
}

export function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [selectedQr, setSelectedQr] = useState<Location | null>(null);
  const { addToast, updateToast } = useToast();

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/lokasi`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const json: ApiResponse = await res.json();
      if (json.success) {
        setLocations(json.data);
      } else {
        setError(json.message || 'Gagal mengambil data lokasi');
      }
    } catch (err) {
      setError('Tidak dapat terhubung ke server');
    } finally {
      setLoading(false);
    }
  };

  const executeDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    const tid = addToast({ type: 'loading', title: 'Menghapus...', message: '' });
    try {
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/lokasi/${deletingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();
      if (json.success) {
        updateToast(tid, { type: 'success', title: 'Berhasil', message: 'Lokasi berhasil dihapus' });
        setLocations(locations.filter(l => l.id !== deletingId));
        setDeletingId(null);
      } else {
        updateToast(tid, { type: 'error', title: 'Gagal', message: json.message || 'Gagal menghapus lokasi' });
      }
    } catch {
      updateToast(tid, { type: 'error', title: 'Error Server', message: 'Terdapat masalah saat menghubungi server.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const executeApprove = async () => {
    if (!approvingId) return;
    setIsApproving(true);
    const tid = addToast({ type: 'loading', title: 'Menyetujui...', message: '' });
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/lokasi/${approvingId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ approved_by: user.id || '' })
      });
      const json = await res.json();
      if (json.success) {
        updateToast(tid, { type: 'success', title: 'Berhasil', message: 'Lokasi berhasil disetujui' });
        setLocations(locations.map(l => l.id === approvingId ? { ...l, status: 'approved', approved_by: user.id, users_lokasis_approved_byTousers: { id: user.id, name: user.name } } : l));
        setApprovingId(null);
      } else {
        updateToast(tid, { type: 'error', title: 'Gagal', message: json.message || 'Gagal menyetujui lokasi' });
      }
    } catch {
      updateToast(tid, { type: 'error', title: 'Error Server', message: 'Terdapat masalah saat menghubungi server.' });
    } finally {
      setIsApproving(false);
    }
  };

  const handleDownloadQr = () => {
    if (!selectedQr) return;
    const svg = document.getElementById(`qr-${selectedQr.id}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `QR_Lokasi_${selectedQr.nama_lokasi.replace(/\s+/g, '_')}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isAdding) {
    return <AddLocation onBack={() => { setIsAdding(false); fetchLocations(); }} />;
  }

  if (isPending) {
    return <PendingLocations onBack={() => { setIsPending(false); fetchLocations(); }} />;
  }

  if (editingId) {
    return <EditLocation locationId={editingId} onBack={() => { setEditingId(null); fetchLocations(); }} />;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-8 pb-20"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Lokasi Kantor</h1>
            <p className="text-slate-500 font-medium">Manage office locations, geofencing radius, and attendance QR codes.</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsPending(true)}
              className="flex items-center gap-2 px-6 py-4 bg-amber-500 text-white rounded-2xl text-sm font-black transition-all shadow-xl shadow-amber-500/20 hover:bg-amber-600 active:scale-95"
            >
              <Clock className="w-5 h-5" />
              Pending Location
            </button>
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black transition-all shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95"
            >
              <Plus className="w-5 h-5" />
              Tambah
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/30 overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search location..." className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {loading ? 'Loading...' : `Showing ${locations.length} Locations`}
            </p>
          </div>

          <div className="overflow-x-auto scrollbar-hide">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <p className="text-sm font-bold text-slate-400">Memuat data lokasi...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center">
                  <AlertCircle className="w-7 h-7 text-rose-500" />
                </div>
                <p className="text-sm font-bold text-slate-600">{error}</p>
                <button
                  onClick={fetchLocations}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all active:scale-95"
                >
                  Coba Lagi
                </button>
              </div>
            ) : (
              <table className="w-full border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">No.</th>
                    <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">Nama Lokasi</th>
                    <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">Latitude</th>
                    <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">Longitude</th>
                    <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">Radius (Meter)</th>
                    <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">Keterangan</th>
                    <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">Status</th>
                    <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center border-b border-slate-100">QR</th>
                    <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">Created By</th>
                    <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right border-b border-l border-slate-100 sticky right-0 bg-slate-50 z-10">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {locations.map((item, index) => (
                    <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-6 px-8 text-sm font-black text-slate-300 group-hover:text-slate-900 transition-colors">{(index + 1).toString().padStart(2, '0')}</td>
                      <td className="py-6 px-8">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-black text-slate-900">{item.nama_lokasi}</span>
                        </div>
                      </td>
                      <td className="py-6 px-8 text-sm font-bold text-slate-600">{item.lat_kantor}</td>
                      <td className="py-6 px-8 text-sm font-bold text-slate-600">{item.long_kantor}</td>
                      <td className="py-6 px-8 text-sm font-bold text-slate-600">{item.radius}</td>
                      <td className="py-6 px-8 text-sm font-bold text-slate-600">{item.keterangan}</td>
                      <td className="py-6 px-8">
                        <span className={cn(
                          "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                          item.status?.toLowerCase() === 'approved'
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : "bg-amber-50 text-amber-600 border border-amber-100"
                        )}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-6 px-8 text-center">
                        <button
                          onClick={() => setSelectedQr(item)}
                          className="px-4 py-2 bg-slate-200/60 hover:bg-slate-300/70 text-slate-800 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 mx-auto active:scale-95"
                        >
                          <QrCode className="w-4 h-4" />
                          Qrcode
                        </button>
                      </td>
                      <td className="py-6 px-8 text-sm font-bold text-slate-600">
                        {item.users_lokasis_created_byTousers?.name || '-'}
                      </td>
                      <td className="py-6 px-8 sticky right-0 bg-white group-hover:bg-slate-50 transition-colors z-10 border-l border-slate-50 group-hover:border-slate-100">
                        <div className="flex items-center justify-end gap-2  transition-opacity">
                          {item.status?.toLowerCase() !== 'approved' && (
                            <button onClick={() => setApprovingId(item.id)} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all active:scale-90" title="Approve">
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => setEditingId(item.id)} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-90" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeletingId(item.id)} className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all active:scale-90" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </motion.div>
      <AnimatePresence>
        {deletingId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-8 h-8 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Hapus Lokasi?</h3>
                  <p className="text-sm text-slate-500 mt-1">Data lokasi yang dihapus tidak dapat dikembalikan lagi.</p>
                </div>
                <div className="flex gap-3 w-full mt-2">
                  <button
                    onClick={() => setDeletingId(null)}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={executeDelete}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ya, Hapus'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {approvingId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Setujui Lokasi?</h3>
                  <p className="text-sm text-slate-500 mt-1">Status lokasi ini akan menjadi APPROVED dan dapat digunakan.</p>
                </div>
                <div className="flex gap-3 w-full mt-2">
                  <button
                    onClick={() => setApprovingId(null)}
                    disabled={isApproving}
                    className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={executeApprove}
                    disabled={isApproving}
                    className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ya, Setujui'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {selectedQr && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setSelectedQr(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={e => e.stopPropagation()}
              className="flex flex-col items-center gap-6"
            >
              <div className="bg-[#e8e8e8] rounded-[2rem] p-8 shadow-2xl flex flex-col items-center border border-white/50">
                <div className="bg-black text-white p-4 rounded-3xl w-full flex items-center justify-center mb-6 shadow-xl relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                  <div className="relative bg-white p-2 rounded-xl">
                    <QRCodeSVG
                      id={`qr-${selectedQr.id}`}
                      value={`https://maps.google.com/?q=${selectedQr.lat_kantor},${selectedQr.long_kantor}`}
                      size={200}
                      level="H"
                      bgColor="#ffffff"
                      fgColor="#000000"
                      includeMargin={false}
                    />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{selectedQr.nama_lokasi}</h3>
              </div>

              <button
                onClick={handleDownloadQr}
                className="px-8 py-3.5 bg-[#254f73] hover:bg-[#1f4260] text-white rounded-xl text-sm font-bold transition-all shadow-xl shadow-[#254f73]/30 active:scale-95 flex items-center gap-2.5"
              >
                <Download className="w-5 h-5" />
                Download
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
