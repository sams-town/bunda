import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Edit, Trash2, ChevronDown, Save, X, Activity } from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from './Toast';

export function PenugasanKerjaPage() {
  const [data, setData] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [isAdding, setIsAdding] = useState(false);
  const [editData, setEditData] = useState<any | null>(null);
  const [deleteData, setDeleteData] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    user_id: '',
    nomor_penugasan: '',
    tanggal: '',
    judul: '',
    rincian: '',
    progress: '0',
    status: 'In Progress'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addToast, updateToast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/penugasans`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/users`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();
      if (json.success) setEmployees(json.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchEmployees();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setEditData((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.user_id || !formData.judul || !formData.rincian) {
      return addToast({ type: 'error', title: 'Validasi', message: 'Ada kolom wajib yang belum diisi.' });
    }

    setIsSubmitting(true);
    const toastId = addToast({ type: 'loading', title: 'Menyimpan', message: 'Sedang menyimpan penugasan...' });

    try {
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/penugasans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      const json = await res.json();

      if (json.success) {
        updateToast(toastId, { type: 'success', title: 'Berhasil', message: 'Penugasan berhasil ditambahkan!' });
        fetchData();
        setIsAdding(false);
        setFormData({ user_id: '', nomor_penugasan: '', tanggal: '', judul: '', rincian: '', progress: '0', status: 'In Progress' });
      } else {
        updateToast(toastId, { type: 'error', title: 'Gagal', message: json.message || 'Gagal menyimpan data.' });
      }
    } catch (err) {
      updateToast(toastId, { type: 'error', title: 'Sistem Error', message: 'Koneksi ke server bermasalah.' });
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
      const payload = { ...editData };
      if (payload.progress && !payload.progress.toString().endsWith('%')) {
        payload.progress = `${payload.progress}%`;
      }

      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/penugasans/${editData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });
      const json = await res.json();

      if (json.success) {
        updateToast(toastId, { type: 'success', title: 'Berhasil', message: 'Perubahan berhasil disimpan!' });
        fetchData();
        setEditData(null);
      } else {
        updateToast(toastId, { type: 'error', title: 'Gagal', message: json.message || 'Gagal menyimpan perubahan.' });
      }
    } catch (err) {
      updateToast(toastId, { type: 'error', title: 'Sistem Error', message: 'Koneksi bermasalah.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteData) return;
    setIsSubmitting(true);
    const toastId = addToast({ type: 'loading', title: 'Menghapus', message: 'Sedang menghapus...' });

    try {
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/penugasans/${deleteData.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();

      if (json.success) {
        updateToast(toastId, { type: 'success', title: 'Berhasil', message: json.message || 'Berhasil dihapus!' });
        fetchData();
      } else {
        updateToast(toastId, { type: 'error', title: 'Gagal', message: json.message || 'Gagal menghapus.' });
      }
    } catch (err) {
      updateToast(toastId, { type: 'error', title: 'Error', message: 'Kesalahan sistem.' });
    } finally {
      setIsSubmitting(false);
      setDeleteData(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Penugasan Kerja</h1>
        <button
          onClick={() => setIsAdding(true)}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          Tambah Penugasan
        </button>
      </div>

      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-8 space-y-8">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Tanggal Mulai"
              onFocus={(e) => e.target.type = 'date'}
              onBlur={(e) => e.target.type = 'text'}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all w-64"
            />
            <input
              type="text"
              placeholder="Tanggal Akhir"
              onFocus={(e) => e.target.type = 'date'}
              onBlur={(e) => e.target.type = 'text'}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all w-64"
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
                {['No.', 'Nomor Penugasan', 'Tanggal', 'Nama Pegawai', 'Judul', 'Rincian', 'Progress', 'Status', 'Action'].map((header) => (
                  <th key={header} className="py-4 px-8 text-[11px] font-black text-slate-500 uppercase tracking-widest text-left whitespace-nowrap">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center">
                    <div className="flex justify-center items-center">
                      <div className="w-8 h-8 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center font-bold text-slate-400">
                    Belum ada penugasan kerja.
                  </td>
                </tr>
              ) : data.map((row, idx) => (
                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-8 text-xs font-bold text-slate-600">{idx + 1}</td>
                  <td className="py-4 px-8 text-xs font-black text-indigo-600">{row.nomor_penugasan || '-'}</td>
                  <td className="py-4 px-8 text-xs font-bold text-slate-600">{row.tanggal ? new Date(row.tanggal).toLocaleDateString('id-ID') : '-'}</td>
                  <td className="py-4 px-8 text-xs font-bold text-slate-900">{row.users?.name || 'Unknown'}</td>
                  <td className="py-4 px-8 text-xs font-bold text-slate-700">{row.judul}</td>
                  <td className="py-4 px-8 text-xs font-medium text-slate-500 italic max-w-[200px] truncate">"{row.rincian}"</td>
                  <td className="py-4 px-8">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden w-24">
                        <div className={cn("h-full transition-all duration-500", parseInt(row.progress) === 100 ? 'bg-emerald-500' : 'bg-indigo-500')} style={{ width: `${row.progress || 0}%` }}></div>
                      </div>
                      <span className="text-[10px] font-black text-slate-600">{row.progress || '0'}%</span>
                    </div>
                  </td>
                  <td className="py-4 px-8">
                    <span className={cn(
                      "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap",
                      row.status === 'Completed' || parseInt(row.progress) === 100 ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"
                    )}>
                      {parseInt(row.progress) === 100 ? 'Completed' : (row.status || 'In Progress')}
                    </span>
                  </td>
                  <td className="py-4 px-8">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditData({ ...row, progress: row.progress ? row.progress.toString().replace('%', '') : '0' })} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteData(row)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-2xl bg-white rounded-[24px] shadow-2xl overflow-hidden my-auto">
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <Activity className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Tambah Penugasan Baru</h3>
                </div>
                <button type="button" onClick={() => setIsAdding(false)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Karyawan</label>
                    <div className="relative">
                      <select name="user_id" value={formData.user_id} onChange={handleInputChange} required className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer">
                        <option value="" disabled>-- Pilih Karyawan --</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nomor Penugasan</label>
                    <input type="text" name="nomor_penugasan" value={formData.nomor_penugasan} onChange={handleInputChange} placeholder="Contoh: PK-2026-003" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tanggal</label>
                    <input type="date" name="tanggal" value={formData.tanggal} onChange={handleInputChange} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-700" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Judul Tugas</label>
                    <input type="text" name="judul" value={formData.judul} onChange={handleInputChange} required className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500" />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Rincian / Deskripsi</label>
                    <textarea name="rincian" value={formData.rincian} onChange={handleInputChange} required rows={4} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 resize-none" />
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-sm">Batal</button>
                  <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all text-sm disabled:opacity-70 flex items-center gap-2 shadow-lg shadow-indigo-600/20">
                    <Save className="w-4 h-4" />
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-2xl bg-white rounded-[24px] shadow-2xl overflow-hidden my-auto">
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Update Penugasan</h3>
                <button type="button" onClick={() => setEditData(null)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Karyawan</label>
                    <div className="relative">
                      <select name="user_id" value={editData.user_id || ''} onChange={handleEditChange} required className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer">
                        <option value="" disabled>-- Pilih Karyawan --</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nomor Penugasan</label>
                    <input type="text" name="nomor_penugasan" value={editData.nomor_penugasan || ''} onChange={handleEditChange} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Progress (%)</label>
                    <div className="relative">
                      <input type="number" min="0" max="100" name="progress" value={editData.progress || '0'} onChange={handleEditChange} className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm font-black text-indigo-600 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Status Tugas</label>
                    <div className="relative">
                      <select name="status" value={editData.status || 'In Progress'} onChange={handleEditChange} className="w-full appearance-none border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer">
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Pending">Pending</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Judul Tugas</label>
                    <input type="text" name="judul" value={editData.judul || ''} onChange={handleEditChange} required className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500" />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Rincian / Deskripsi</label>
                    <textarea name="rincian" value={editData.rincian || ''} onChange={handleEditChange} required rows={3} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 resize-none" />
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button type="button" onClick={() => setEditData(null)} className="px-6 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-sm">Batal</button>
                  <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-all text-sm disabled:opacity-70 shadow-lg shadow-amber-500/20 flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden text-center p-8">
              <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">Hapus Penugasan?</h3>
              <p className="text-sm font-medium text-slate-500 mb-8">Penugasan <span className="font-bold text-slate-700">"{deleteData.judul}"</span> akan dihapus permanen.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteData(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-sm">Batal</button>
                <button onClick={handleDelete} disabled={isSubmitting} className="flex-1 py-3 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-all text-sm shadow-lg shadow-rose-500/20 disabled:opacity-70">
                  Hapus Permanen
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
