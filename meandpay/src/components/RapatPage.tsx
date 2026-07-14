import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Plus, ArrowUpDown, Eye, Edit, Trash2, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from './Toast';

export function RapatPage() {
  const [isAdding, setIsAdding] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Data States
  const [rapatData, setRapatData] = useState<any[]>([]);
  const [loadingTable, setLoadingTable] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast, updateToast } = useToast();

  // Form State
  const [formData, setFormData] = useState({
    nama: '',
    tanggal: '',
    mulai: '',
    selesai: '',
    lokasi: '',
    detail: '',
    jenis: '',
    peserta_ids: [] as string[]
  });

  // Modal States
  const [editData, setEditData] = useState<any | null>(null);
  const [deleteData, setDeleteData] = useState<any | null>(null);
  const [viewData, setViewData] = useState<any | null>(null);

  const fetchRapat = async () => {
    setLoadingTable(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/rapats`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();
      if (json.success) setRapatData(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTable(false);
    }
  };

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/users`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();
      if (json.success) setEmployees(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  useEffect(() => {
    fetchRapat();
    fetchEmployees();
  }, []);

  const handleCheckboxChange = (id: string, formType: 'add' | 'edit') => {
    if (formType === 'add') {
      const currentIds = formData.peserta_ids;
      if (currentIds.includes(id)) {
        setFormData({ ...formData, peserta_ids: currentIds.filter(userId => userId !== id) });
      } else {
        setFormData({ ...formData, peserta_ids: [...currentIds, id] });
      }
    } else if (editData) {
      const currentIds = editData.peserta_ids || [];
      if (currentIds.includes(id)) {
        setEditData({ ...editData, peserta_ids: currentIds.filter((userId: string) => userId !== id) });
      } else {
        setEditData({ ...editData, peserta_ids: [...currentIds, id] });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.tanggal || !formData.jenis) {
      return addToast({ type: 'error', title: 'Validasi', message: 'Harap isi kolom wajib (Nama Pertemuan, Tanggal, Jenis).' });
    }

    setIsSubmitting(true);
    const toastId = addToast({ type: 'loading', title: 'Menyimpan', message: 'Menyimpan data rapat...' });

    try {
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/rapats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        updateToast(toastId, { type: 'success', title: 'Berhasil', message: 'Data Rapat berhasil disimpan!' });
        setFormData({ nama: '', tanggal: '', mulai: '', selesai: '', lokasi: '', detail: '', jenis: '', peserta_ids: [] });
        setIsAdding(false);
        fetchRapat();
      } else {
        updateToast(toastId, { type: 'error', title: 'Gagal', message: json.message || 'Gagal menyimpan data.' });
      }
    } catch (err) {
      console.error(err);
      updateToast(toastId, { type: 'error', title: 'Error', message: 'Terjadi kesalahan sistem.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editData) return;

    setIsSubmitting(true);
    const toastId = addToast({ type: 'loading', title: 'Menyimpan', message: 'Menyimpan perubahan...' });

    try {
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/rapats/${editData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editData)
      });
      const json = await res.json();
      if (json.success) {
        updateToast(toastId, { type: 'success', title: 'Berhasil', message: 'Perubahan berhasil disimpan!' });
        setEditData(null);
        fetchRapat();
      } else {
        updateToast(toastId, { type: 'error', title: 'Gagal', message: json.message || 'Gagal menyimpan perubahan.' });
      }
    } catch (err) {
      console.error(err);
      updateToast(toastId, { type: 'error', title: 'Error', message: 'Terjadi kesalahan sistem.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteData) return;
    const id = deleteData.id;
    setDeleteData(null);

    const toastId = addToast({ type: 'loading', title: 'Menghapus', message: 'Menghapus data rapat...' });
    try {
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/rapats/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();
      if (json.success) {
        updateToast(toastId, { type: 'success', title: 'Berhasil', message: 'Data berhasil dihapus!' });
        fetchRapat();
      } else {
        updateToast(toastId, { type: 'error', title: 'Gagal', message: json.message || 'Gagal menghapus data' });
      }
    } catch (err) {
      console.error(err);
      updateToast(toastId, { type: 'error', title: 'Error', message: 'Terjadi kesalahan sistem.' });
    }
  };

  if (isAdding) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-6 pb-20">
        <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-6 flex items-center justify-between">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Tambah Rapat</h1>
          <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2.5 bg-rose-500 text-white rounded-xl font-bold shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95 text-sm">
            Kembali
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-8 space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700">Nama Pertemuan</label>
            <input type="text" value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700">Tanggal</label>
              <input type="date" value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700">Jam Mulai</label>
              <input type="time" value={formData.mulai} onChange={e => setFormData({ ...formData, mulai: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700">Jam Selesai</label>
              <input type="time" value={formData.selesai} onChange={e => setFormData({ ...formData, selesai: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700">Lokasi Pertemuan</label>
              <input type="text" value={formData.lokasi} onChange={e => setFormData({ ...formData, lokasi: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700">Jenis Pertemuan</label>
              <div className="relative">
                <select value={formData.jenis} onChange={e => setFormData({ ...formData, jenis: e.target.value })} className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer">
                  <option value="">Pilih Jenis Pertemuan</option>
                  <option value="Online">Pertemuan Online</option>
                  <option value="Offline">Pertemuan Offline</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700">Peserta</label>
            <div className="w-full max-h-48 overflow-y-auto bg-slate-50 border border-slate-200 rounded-xl p-4 gap-2 grid grid-cols-2">
              {loadingEmployees ? <span className="text-sm text-slate-400">Loading...</span> : employees.map(emp => (
                <label key={emp.id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-lg transition-colors">
                  <input type="checkbox" checked={formData.peserta_ids.includes(emp.id)} onChange={() => handleCheckboxChange(emp.id, 'add')} className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                  <span className="text-sm font-semibold text-slate-700">{emp.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700">Detail Pertemuan</label>
            <textarea value={formData.detail} onChange={e => setFormData({ ...formData, detail: e.target.value })} className="w-full min-h-[120px] resize-y bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
          </div>

          <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-[#1e3a5f] text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-500/20 hover:bg-[#152a45] active:scale-95 disabled:opacity-70 transition-all">
            {isSubmitting ? 'Menyimpan...' : 'Submit'}
          </button>
        </form>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Rapat</h1>
        <button onClick={() => setIsAdding(true)} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          Tambah
        </button>
      </div>

      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-8 space-y-8">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <input type="text" placeholder="Tanggal Mulai" onFocus={(e) => e.target.type = 'date'} onBlur={(e) => e.target.type = 'text'} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 outline-none focus:ring-4 focus:ring-indigo-500/10 w-48" />
            <input type="text" placeholder="Tanggal Akhir" onFocus={(e) => e.target.type = 'date'} onBlur={(e) => e.target.type = 'text'} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 outline-none focus:ring-4 focus:ring-indigo-500/10 w-48" />
          </div>
          <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 shadow-sm transition-all">
            <Search className="w-5 h-5" />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto -mx-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-y border-slate-100">
                {['No.', 'Nama Pertemuan', 'Tanggal', 'Jam Mulai', 'Jam Selesai', 'Lokasi', 'Detail Pertemuan', 'Jenis Pertemuan', 'Peserta', 'Notulen', 'Actions'].map((header) => (
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
                <tr><td colSpan={11} className="py-20 text-center"><div className="w-8 h-8 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 animate-spin mx-auto"></div></td></tr>
              ) : rapatData.length === 0 ? (
                <tr><td colSpan={11} className="py-20 text-center font-bold text-slate-400">Tidak ada data rapat.</td></tr>
              ) : rapatData.map((row, index) => (
                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-8 text-xs font-bold text-slate-600">{index + 1}</td>
                  <td className="py-4 px-8 text-xs font-bold text-slate-900 truncate max-w-[150px]" title={row.nama}>{row.nama}</td>
                  <td className="py-4 px-8 text-xs font-bold text-slate-600 whitespace-nowrap">{row.tanggal ? new Date(row.tanggal).toLocaleDateString('id-ID') : '-'}</td>
                  <td className="py-4 px-8 text-xs font-bold text-slate-600">{row.jam_mulai}</td>
                  <td className="py-4 px-8 text-xs font-bold text-slate-600">{row.jam_selesai}</td>
                  <td className="py-4 px-8 text-xs font-medium text-slate-500 truncate max-w-[150px]" title={row.lokasi}>{row.lokasi}</td>
                  <td className="py-4 px-8 text-xs font-medium text-slate-500 italic max-w-[150px] truncate" title={row.detail}>"{row.detail}"</td>
                  <td className="py-4 px-8">
                    <span className={cn("px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap", row.jenis === 'Internal' ? "bg-indigo-50 text-indigo-600" : "bg-amber-50 text-amber-600")}>
                      {row.jenis}
                    </span>
                  </td>
                  <td className="py-4 px-8 text-xs font-bold text-slate-600 max-w-[150px] truncate" title={row.peserta}>{row.peserta}</td>
                  <td className="py-4 px-8 text-xs font-medium text-slate-500 italic max-w-[150px] truncate" title={row.notulen}>"{row.notulen || '-'}"</td>
                  <td className="py-4 px-8">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewData(row)} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => {
                        setEditData({
                          ...row,
                          tanggal: row.tanggal ? row.tanggal.split('T')[0] : '',
                          mulai: row.jam_mulai,
                          selesai: row.jam_selesai,
                          peserta_ids: row.peserta_ids || (row.users ? row.users.map((u: any) => u.id) : employees.filter(emp => (row.peserta || '').split(',').map((n: string) => n.trim()).includes(emp.name)).map(emp => emp.id))
                        });
                      }} className="p-1.5 text-slate-400 hover:text-amber-600 transition-colors"><Edit className="w-4 h-4" /></button>
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
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-2xl bg-white rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Detail Rapat</h3>
              <button onClick={() => setViewData(null)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all">✕</button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nama Pertemuan</label>
                  <p className="text-sm font-semibold text-slate-800 mt-1">{viewData.nama}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tanggal & Waktu</label>
                  <p className="text-sm font-semibold text-slate-800 mt-1">{viewData.tanggal ? new Date(viewData.tanggal).toLocaleDateString('id-ID') : '-'} / {viewData.jam_mulai} - {viewData.jam_selesai}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Lokasi</label>
                  <p className="text-sm font-semibold text-slate-800 mt-1">{viewData.lokasi}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Jenis Pertemuan</label>
                  <p className="text-sm font-semibold text-slate-800 mt-1">{viewData.jenis}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Rincian Pertemuan</label>
                  <p className="text-sm font-medium text-slate-600 mt-1 whitespace-pre-wrap leading-relaxed">{viewData.detail}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Peserta</label>
                  <p className="text-sm font-medium text-slate-600 mt-1 leading-relaxed">{viewData.peserta}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Notulen Terbaru</label>
                  <div className="mt-2 p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap font-medium">
                    {viewData.notulen !== "-" ? viewData.notulen : "Belum ada notulen untuk rapat ini."}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Data Modal */}
      {editData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto py-10">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-2xl bg-white rounded-[24px] shadow-2xl overflow-hidden flex flex-col my-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Edit Rapat</h3>
              <button type="button" onClick={() => setEditData(null)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all">✕</button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 block">Nama Pertemuan</label>
                  <input type="text" value={editData.nama || ''} onChange={e => setEditData({ ...editData, nama: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 block">Tanggal</label>
                  <input type="date" value={editData.tanggal || ''} onChange={e => setEditData({ ...editData, tanggal: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 block">Jam Mulai</label>
                  <input type="time" value={editData.mulai || ''} onChange={e => setEditData({ ...editData, mulai: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 block">Jam Selesai</label>
                  <input type="time" value={editData.selesai || ''} onChange={e => setEditData({ ...editData, selesai: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 block">Lokasi</label>
                  <input type="text" value={editData.lokasi || ''} onChange={e => setEditData({ ...editData, lokasi: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 block">Jenis Pertemuan</label>
                  <select value={editData.jenis || ''} onChange={e => setEditData({ ...editData, jenis: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <option value="Internal">Internal</option>
                    <option value="External">External</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 block">Update Peserta (Opsional)</label>
                <div className="w-full max-h-40 overflow-y-auto bg-slate-50 border border-slate-200 rounded-xl p-4 gap-2 grid grid-cols-2">
                  {loadingEmployees ? <span className="text-sm text-slate-400">Loading...</span> : employees.map(emp => (
                    <label key={emp.id} className="flex items-center gap-3 cursor-pointer p-1 hover:bg-white rounded transition-colors">
                      <input type="checkbox" checked={editData.peserta_ids?.includes(emp.id)} onChange={() => handleCheckboxChange(emp.id, 'edit')} className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                      <span className="text-sm font-medium text-slate-700">{emp.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 block">Detail Pertemuan</label>
                <textarea value={editData.detail || ''} onChange={e => setEditData({ ...editData, detail: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[100px]" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 block">Isi Notulensi Rapat</label>
                <textarea value={editData.notulen === '-' ? '' : (editData.notulen || '')} onChange={e => setEditData({ ...editData, notulen: e.target.value })} placeholder="Masukkan notulensi disini..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[100px]" />
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
            <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">Hapus Rapat?</h3>
            <p className="text-sm font-medium text-slate-500 mb-8">Data meeting "<span className="font-bold text-slate-700">{deleteData.nama}</span>" akan dihapus permanen.</p>
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
