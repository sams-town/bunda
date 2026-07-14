import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Plus, Edit, Trash2, ArrowUpDown } from 'lucide-react';
import { useToast } from './Toast';
import { cn } from '../lib/utils';

export function JenisKinerjaPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Form/Modal states
  const [isAdding, setIsAdding] = useState(false);
  const [editData, setEditData] = useState<any | null>(null);
  const [deleteData, setDeleteData] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast, updateToast } = useToast();

  const [formData, setFormData] = useState({
    nama: '',
    bobot: '',
    detail: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = new URL(`${import.meta.env.VITE_API_MEANDPAY}/jenis-kinerjas`);
      if (search) url.searchParams.append('search', search);

      const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  // Handle Form Input Changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (editData) {
      setEditData({ ...editData, [name]: value });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Submit Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.bobot) {
      return addToast({ type: 'error', title: 'Validasi Failed', message: 'Semua field wajib diisi' });
    }

    setIsSubmitting(true);
    const toastId = addToast({ type: 'loading', title: 'Menyimpan', message: 'Menyimpan data...' });

    try {
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/jenis-kinerjas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const json = await res.json();
      if (json.success) {
        updateToast(toastId, { type: 'success', title: 'Berhasil', message: 'Data Jenis Kinerja berhasil ditambahkan!' });
        setFormData({ nama: '', bobot: '', detail: '' });
        setIsAdding(false);
        fetchData();
      } else {
        updateToast(toastId, { type: 'error', title: 'Gagal', message: json.message || 'Gagal menyimpan data.' });
      }
    } catch (err) {
      console.error(err);
      updateToast(toastId, { type: 'error', title: 'Error', message: 'Terjadi kesalahan jaringan.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editData) return;

    setIsSubmitting(true);
    const toastId = addToast({ type: 'loading', title: 'Memperbarui', message: 'Menyimpan perubahan...' });

    try {
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/jenis-kinerjas/${editData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          nama: editData.nama,
          bobot: editData.bobot,
          detail: editData.detail
        })
      });

      const json = await res.json();
      if (json.success) {
        updateToast(toastId, { type: 'success', title: 'Berhasil', message: 'Data berhasil diperbarui!' });
        setEditData(null);
        fetchData();
      } else {
        updateToast(toastId, { type: 'error', title: 'Gagal', message: json.message || 'Gagal menyimpan perubahan.' });
      }
    } catch (err) {
      console.error(err);
      updateToast(toastId, { type: 'error', title: 'Error', message: 'Terjadi kesalahan jaringan.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Delete
  const handleDeleteSubmit = async () => {
    if (!deleteData) return;

    setIsSubmitting(true);
    const toastId = addToast({ type: 'loading', title: 'Menghapus', message: 'Menghapus data...' });

    try {
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/jenis-kinerjas/${deleteData.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();
      if (json.success) {
        updateToast(toastId, { type: 'success', title: 'Berhasil', message: 'Data berhasil dihapus!' });
        setDeleteData(null);
        fetchData();
      } else {
        updateToast(toastId, { type: 'error', title: 'Gagal', message: json.message || 'Gagal menghapus data' });
      }
    } catch (err) {
      console.error(err);
      updateToast(toastId, { type: 'error', title: 'Error', message: 'Terjadi kesalahan sistem.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Jenis Kinerja</h1>
        <button onClick={() => setIsAdding(true)} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          Tambah
        </button>
      </div>

      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-8 space-y-8">
        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-bold text-slate-600 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
            />
          </div>
          <button onClick={fetchData} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Search className="w-5 h-5" />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto -mx-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-y border-slate-100">
                <th className="py-4 px-8 text-[11px] font-black text-slate-500 uppercase tracking-widest text-left whitespace-nowrap">No.</th>
                <th className="py-4 px-8 text-[11px] font-black text-slate-500 uppercase tracking-widest text-left whitespace-nowrap">
                  <div className="flex items-center gap-2 group cursor-pointer">
                    Nama Kinerja
                    <ArrowUpDown className="w-3 h-3  transition-opacity" />
                  </div>
                </th>
                <th className="py-4 px-8 text-[11px] font-black text-slate-500 uppercase tracking-widest text-left whitespace-nowrap">
                  <div className="flex items-center gap-2 group cursor-pointer">
                    Bobot Penilaian
                    <ArrowUpDown className="w-3 h-3  transition-opacity" />
                  </div>
                </th>
                <th className="py-4 px-8 text-[11px] font-black text-slate-500 uppercase tracking-widest text-left whitespace-nowrap">Detail</th>
                <th className="py-4 px-8 text-[11px] font-black text-slate-500 uppercase tracking-widest text-left whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="py-20 text-center"><div className="w-8 h-8 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 animate-spin mx-auto"></div></td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-sm font-medium text-slate-400">Belum ada data Jenis Kinerja.</td></tr>
              ) : data.map((item, index) => (
                <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                  <td className="py-4 px-8 text-sm font-bold text-slate-600">{index + 1}.</td>
                  <td className="py-4 px-8 text-sm font-bold text-slate-900">{item.nama}</td>
                  <td className="py-4 px-8 text-sm font-bold text-slate-600">
                    <span className={cn("px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest", Number(item.bobot) < 0 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600")}>
                      {Number(item.bobot) > 0 ? `+${item.bobot}` : item.bobot}
                    </span>
                  </td>
                  <td className="py-4 px-8 text-sm font-medium text-slate-500 max-w-sm truncate" title={item.detail}>{item.detail}</td>
                  <td className="py-4 px-8 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setEditData(item)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteData(item)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg bg-white rounded-[24px] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Tambah Jenis Kinerja</h3>
              <button onClick={() => setIsAdding(false)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all">✕</button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nama Kinerja</label>
                <input type="text" name="nama" value={formData.nama} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500" placeholder="Contoh: Telat Presensi" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Bobot Penilaian</label>
                <input type="number" name="bobot" value={formData.bobot} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500" placeholder="Contoh: -10 atau 10" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Detail Informasi</label>
                <textarea name="detail" value={formData.detail} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 min-h-[100px]" placeholder="Keterangan mengenai kinerja..." />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-sm">Batal</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all text-sm disabled:opacity-70">
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Modal */}
      {editData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg bg-white rounded-[24px] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Edit Jenis Kinerja</h3>
              <button onClick={() => setEditData(null)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all">✕</button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nama Kinerja</label>
                <input type="text" name="nama" value={editData.nama} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Bobot Penilaian</label>
                <input type="number" name="bobot" value={editData.bobot} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Detail Informasi</label>
                <textarea name="detail" value={editData.detail || ''} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 min-h-[100px]" />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setEditData(null)} className="px-6 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-sm">Batal</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all text-sm disabled:opacity-70">
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
            <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">Hapus Data?</h3>
            <p className="text-sm font-medium text-slate-500 mb-8">Data master "<span className="font-bold text-slate-700">{deleteData.nama}</span>" akan dihapus secara permanen.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteData(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-sm">Batal</button>
              <button onClick={handleDeleteSubmit} disabled={isSubmitting} className="flex-1 py-3 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-all text-sm shadow-lg shadow-rose-500/20 disabled:opacity-70">
                {isSubmitting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
