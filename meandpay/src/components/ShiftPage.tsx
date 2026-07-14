import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock, Search, Plus, Edit2, Trash2,
  X, Save, Loader2, AlertCircle, RefreshCw, CheckCircle
} from 'lucide-react';
import { cn } from '../lib/utils';

const BASE_URL = import.meta.env.VITE_API_MEANDPAY;

/* ─── Types ──────────────────────────────────────────────── */
interface Shift {
  id: string;
  nama_shift: string;
  jam_masuk: string;
  jam_keluar: string;
  jam_mulai_istirahat: string | null;
  jam_selesai_istirahat: string | null;
}

interface ShiftForm {
  nama_shift: string;
  jam_masuk: string;
  jam_keluar: string;
  jam_mulai_istirahat: string;
  jam_selesai_istirahat: string;
}

const emptyForm: ShiftForm = {
  nama_shift: '',
  jam_masuk: '',
  jam_keluar: '',
  jam_mulai_istirahat: '',
  jam_selesai_istirahat: '',
};

/* ─── Toast ───────────────────────────────────────────────── */
function Toast({ type, message, onClose }: { type: 'success' | 'error'; message: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.95 }}
      className={cn('fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border text-sm font-semibold',
        type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800')}
    >
      {type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-rose-500" />}
      {message}
      <button onClick={onClose} className="ml-1 opacity-50 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
    </motion.div>
  );
}

/* ─── Shift Modal (Add / Edit) ───────────────────────────── */
function ShiftModal({
  shift, onClose, onSaved,
}: {
  shift: Shift | null; // null = tambah baru
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!shift;
  const [form, setForm] = useState<ShiftForm>(
    shift
      ? {
        nama_shift: shift.nama_shift,
        jam_masuk: shift.jam_masuk,
        jam_keluar: shift.jam_keluar,
        jam_mulai_istirahat: shift.jam_mulai_istirahat ?? '',
        jam_selesai_istirahat: shift.jam_selesai_istirahat ?? '',
      }
      : emptyForm
  );
  const [errors, setErrors] = useState<Partial<ShiftForm>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const set = (k: keyof ShiftForm, v: string) => {
    setForm(prev => ({ ...prev, [k]: v }));
    setErrors(prev => { const e = { ...prev }; delete e[k]; return e; });
    setApiError('');
  };

  const validate = () => {
    const e: Partial<ShiftForm> = {};
    if (!form.nama_shift.trim()) e.nama_shift = 'Wajib diisi';
    if (!form.jam_masuk) e.jam_masuk = 'Wajib diisi';
    if (!form.jam_keluar) e.jam_keluar = 'Wajib diisi';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        nama_shift: form.nama_shift,
        jam_masuk: form.jam_masuk,
        jam_keluar: form.jam_keluar,
        jam_mulai_istirahat: form.jam_mulai_istirahat || null,
        jam_selesai_istirahat: form.jam_selesai_istirahat || null,
      };
      const res = await fetch(
        isEdit ? `${BASE_URL}/shifts/${shift!.id}` : `${BASE_URL}/shifts`,
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Gagal menyimpan');
      onSaved();
      onClose();
    } catch (err: any) {
      setApiError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const TimeField = ({ label, field }: { label: string; field: keyof ShiftForm }) => (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="time"
          value={form[field]}
          onChange={e => set(field, e.target.value)}
          className={cn(
            'w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-4 transition-all',
            errors[field] ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-50' : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-50'
          )}
        />
      </div>
      {errors[field] && <p className="text-[11px] text-rose-500 font-medium">{errors[field]}</p>}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 12 }}
        transition={{ type: 'spring', damping: 22, stiffness: 320 }}
        onClick={e => e.stopPropagation()}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{isEdit ? 'Edit Shift' : 'Tambah Shift'}</p>
              <p className="text-[11px] text-slate-400">{isEdit ? shift!.nama_shift : 'Shift baru'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Nama Shift */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Nama Shift</label>
            <input
              type="text"
              value={form.nama_shift}
              onChange={e => set('nama_shift', e.target.value)}
              placeholder="contoh: Pagi, Siang, Malam..."
              className={cn(
                'w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-4 transition-all',
                errors.nama_shift ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-50' : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-50'
              )}
            />
            {errors.nama_shift && <p className="text-[11px] text-rose-500 font-medium">{errors.nama_shift}</p>}
          </div>

          {/* Jam Kerja */}
          <div className="grid grid-cols-2 gap-3">
            <TimeField label="Jam Masuk *" field="jam_masuk" />
            <TimeField label="Jam Keluar *" field="jam_keluar" />
          </div>

          {/* Istirahat */}
          <div className="pt-1">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Istirahat <span className="normal-case font-normal">(opsional)</span></p>
            <div className="grid grid-cols-2 gap-3">
              <TimeField label="Mulai Istirahat" field="jam_mulai_istirahat" />
              <TimeField label="Selesai Istirahat" field="jam_selesai_istirahat" />
            </div>
          </div>

          {apiError && (
            <p className="text-[11px] text-rose-500 font-medium bg-rose-50 px-3 py-2 rounded-lg">{apiError}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
            Batal
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-md shadow-indigo-200">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Shift'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Delete Confirm Modal ────────────────────────────────── */
function DeleteModal({
  shift, onClose, onDeleted,
}: {
  shift: Shift;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/shifts/${shift.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Gagal menghapus');
      onDeleted();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 12 }}
        transition={{ type: 'spring', damping: 22, stiffness: 320 }}
        onClick={e => e.stopPropagation()}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
      >
        <div className="px-6 pt-6 pb-5 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-base font-bold text-slate-900 mb-1">Hapus Shift?</p>
          <p className="text-sm text-slate-400">
            Shift <span className="font-semibold text-slate-700">"{shift.nama_shift}"</span> akan dihapus permanen.
          </p>
          {error && <p className="text-[11px] text-rose-500 font-medium mt-3 bg-rose-50 px-3 py-2 rounded-lg">{error}</p>}
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
            Batal
          </button>
          <button onClick={handleDelete} disabled={loading}
            className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-md shadow-rose-200">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {loading ? 'Menghapus...' : 'Ya, Hapus'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Main Page ───────────────────────────────────────────── */
export function ShiftPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [addOpen, setAddOpen] = useState(false);
  const [editShift, setEditShift] = useState<Shift | null>(null);
  const [deleteShift, setDeleteShift] = useState<Shift | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchShifts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/shifts`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setShifts(json.data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data shift');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchShifts(); }, [fetchShifts]);

  const filtered = shifts.filter(s =>
    s.nama_shift.toLowerCase().includes(search.toLowerCase())
  );

  const showTime = (t: string | null) => t ?? '-';

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="max-w-7xl mx-auto space-y-7 pb-20"
      >
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Shift</h1>
            <p className="text-sm text-slate-400 mt-0.5">Kelola shift kerja dan jam istirahat pegawai</p>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> Tambah Shift
          </button>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
            <div className="relative w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Cari nama shift..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={fetchShifts} className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all">
                <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
              </button>
              <span className="text-xs text-slate-400 font-medium">
                {filtered.length} shift{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {error ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <AlertCircle className="w-8 h-8 text-rose-400" />
                <p className="text-sm font-semibold text-slate-600">{error}</p>
                <button onClick={fetchShifts} className="text-indigo-600 text-sm font-semibold hover:underline">Coba lagi</button>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Memuat data...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2 text-slate-400">
                <Clock className="w-8 h-8" />
                <p className="text-sm font-semibold">Tidak ada shift ditemukan</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    {['#', 'Nama Shift', 'Jam Masuk', 'Jam Keluar', 'Mulai Istirahat', 'Selesai Istirahat', ''].map((h, i) => (
                      <th key={i} className={cn(
                        'py-3.5 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap',
                        i === 0 ? 'w-12 text-left' : i === 6 ? 'text-right w-24' : 'text-left'
                      )}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((shift, i) => (
                    <motion.tr
                      key={shift.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="group border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="py-4 px-5">
                        <span className="text-xs font-semibold text-slate-300 group-hover:text-slate-500 transition-colors">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                            <Clock className="w-3.5 h-3.5 text-indigo-500" />
                          </div>
                          <span className="text-sm font-semibold text-slate-800 capitalize">{shift.nama_shift}</span>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold">
                          {showTime(shift.jam_masuk)}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold">
                          {showTime(shift.jam_keluar)}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <span className="text-sm text-slate-500">
                          {showTime(shift.jam_mulai_istirahat)}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <span className="text-sm text-slate-500">
                          {showTime(shift.jam_selesai_istirahat)}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <div className="flex items-center justify-end gap-1  transition-opacity">
                          <button
                            onClick={() => setEditShift(shift)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteShift(shift)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {addOpen && (
          <ShiftModal
            shift={null}
            onClose={() => setAddOpen(false)}
            onSaved={() => { fetchShifts(); setToast({ type: 'success', message: 'Shift berhasil ditambahkan!' }); }}
          />
        )}
        {editShift && (
          <ShiftModal
            shift={editShift}
            onClose={() => setEditShift(null)}
            onSaved={() => { fetchShifts(); setToast({ type: 'success', message: 'Shift berhasil diperbarui!' }); }}
          />
        )}
        {deleteShift && (
          <DeleteModal
            shift={deleteShift}
            onClose={() => setDeleteShift(null)}
            onDeleted={() => { fetchShifts(); setToast({ type: 'success', message: 'Shift berhasil dihapus!' }); }}
          />
        )}
        {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </>
  );
}