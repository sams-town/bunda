import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Briefcase, Search, Plus, Edit2, Trash2,
  X, Save, Loader2, AlertCircle, RefreshCw, CheckCircle, User, Users, UserPlus, Check
} from 'lucide-react';
import { cn } from '../lib/utils';

const BASE_URL = import.meta.env.VITE_API_MEANDPAY;

/* ─── Types ──────────────────────────────────────────────── */
interface UserMember {
  id: string;
  name: string;
  email: string;
}

interface Jabatan {
  id: string;
  nama_jabatan: string;
  manager: string | null;
  manager_name: string | null;
  manager_email: string | null;
  users: UserMember[];
}

interface JabatanForm {
  nama_jabatan: string;
  manager: string;
}

const emptyForm: JabatanForm = { nama_jabatan: '', manager: '' };

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

/* ─── Jabatan Modal (Add / Edit) ─────────────────────────── */
function JabatanModal({
  jabatan, managerOptions, onClose, onSaved,
}: {
  jabatan: Jabatan | null;
  managerOptions: { value: string; label: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!jabatan;
  const [form, setForm] = useState<JabatanForm>(
    jabatan
      ? { nama_jabatan: jabatan.nama_jabatan, manager: jabatan.manager ?? '' }
      : emptyForm
  );
  const [errors, setErrors] = useState<Partial<JabatanForm>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const set = (k: keyof JabatanForm, v: string) => {
    setForm(prev => ({ ...prev, [k]: v }));
    setErrors(prev => { const e = { ...prev }; delete e[k]; return e; });
    setApiError('');
  };

  const validate = () => {
    const e: Partial<JabatanForm> = {};
    if (!form.nama_jabatan.trim()) e.nama_jabatan = 'Nama jabatan wajib diisi';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        nama_jabatan: form.nama_jabatan,
        manager: form.manager || null,
      };
      const res = await fetch(
        isEdit ? `${BASE_URL}/jabatans/${jabatan!.id}` : `${BASE_URL}/jabatans`,
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
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
        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{isEdit ? 'Edit Jabatan' : 'Tambah Jabatan'}</p>
              <p className="text-[11px] text-slate-400">{isEdit ? jabatan!.nama_jabatan : 'Jabatan baru'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Nama Jabatan */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Nama Jabatan *</label>
            <input
              type="text" value={form.nama_jabatan}
              onChange={e => set('nama_jabatan', e.target.value)}
              placeholder="contoh: Teknologi Informasi, Dokter..."
              className={cn(
                'w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-4 transition-all',
                errors.nama_jabatan ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-50' : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-50'
              )}
            />
            {errors.nama_jabatan && <p className="text-[11px] text-rose-500 font-medium">{errors.nama_jabatan}</p>}
          </div>

          {/* Manager */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Manager <span className="normal-case font-normal">(opsional)</span></label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
              <select
                value={form.manager}
                onChange={e => set('manager', e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 appearance-none focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all cursor-pointer"
              >
                <option value="">Tidak ada manager</option>
                {managerOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          {apiError && <p className="text-[11px] text-rose-500 font-medium bg-rose-50 px-3 py-2 rounded-lg">{apiError}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
            Batal
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-md shadow-indigo-200">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Jabatan'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Members Modal ──────────────────────────────────────── */
function MembersModal({ jabatan, onClose, onSaved }: { jabatan: Jabatan; onClose: () => void; onSaved: () => void }) {
  const [allUsers, setAllUsers] = useState<UserMember[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set(jabatan.users.map(u => u.id)));
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(`${BASE_URL}/users?limit=9999`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const json = await res.json();
        if (json.success) setAllUsers(json.data);
      } catch { } finally { setLoadingUsers(false); }
    };
    fetch_();
  }, []);

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setApiError('');
    try {
      // Cari user yang berubah
      const originalIds = new Set(jabatan.users.map(u => u.id));
      const toAdd = [...selected].filter(id => !originalIds.has(id));
      const toRemove = [...originalIds].filter(id => !selected.has(id));

      const promises = [
        ...toAdd.map(id => fetch(`${BASE_URL}/users/${id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ jabatan_id: jabatan.id }),
        })),
        // Remove = set jabatan_id ke null
        ...toRemove.map(id => fetch(`${BASE_URL}/users/${id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ jabatan_id: null }),
        })),
      ];

      await Promise.all(promises);
      onSaved();
      onClose();
    } catch (err: any) {
      setApiError('Sebagian perubahan gagal disimpan');
    } finally {
      setSaving(false);
    }
  };

  const filtered = allUsers.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    (u as any).username?.toLowerCase().includes(search.toLowerCase())
  );

  const avatarColors = ['bg-violet-500', 'bg-indigo-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-pink-500', 'bg-teal-500'];
  const avatarColor = (id: string) => avatarColors[parseInt(id) % avatarColors.length];
  const initials = (name: string) => name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

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
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Kelola Anggota</p>
              <p className="text-[11px] text-slate-400">{jabatan.nama_jabatan} · {selected.size} dipilih</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-slate-50 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari pegawai..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* User List */}
        <div className="overflow-y-auto flex-1 px-3 py-2">
          {loadingUsers ? (
            <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Memuat pegawai...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-slate-400">
              <span className="text-sm">Tidak ada pegawai ditemukan</span>
            </div>
          ) : (
            <div className="space-y-0.5">
              {filtered.map(user => {
                const isChecked = selected.has(user.id);
                return (
                  <button
                    key={user.id}
                    onClick={() => toggle(user.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left',
                      isChecked ? 'bg-indigo-50' : 'hover:bg-slate-50'
                    )}
                  >
                    {/* Avatar */}
                    <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center text-white text-[10px] font-bold shrink-0', avatarColor(user.id))}>
                      {initials(user.name)}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-xs font-semibold leading-tight truncate', isChecked ? 'text-indigo-700' : 'text-slate-700')}>{user.name}</p>
                      <p className="text-[11px] text-slate-400 leading-tight truncate">{user.email}</p>
                    </div>
                    {/* Checkbox */}
                    <div className={cn(
                      'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all',
                      isChecked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'
                    )}>
                      {isChecked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 shrink-0">
          {apiError && <p className="text-[11px] text-rose-500 font-medium mb-3 bg-rose-50 px-3 py-2 rounded-lg">{apiError}</p>}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
              Batal
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-md shadow-indigo-200">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Menyimpan...' : `Simpan (${selected.size})`}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Delete Confirm Modal ────────────────────────────────── */
function DeleteModal({ jabatan, onClose, onDeleted }: { jabatan: Jabatan; onClose: () => void; onDeleted: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/jabatans/${jabatan.id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
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
          <p className="text-base font-bold text-slate-900 mb-1">Hapus Jabatan?</p>
          <p className="text-sm text-slate-400">
            Jabatan <span className="font-semibold text-slate-700">"{jabatan.nama_jabatan}"</span> akan dihapus permanen.
          </p>
          {error && <p className="text-[11px] text-rose-500 font-medium mt-3 bg-rose-50 px-3 py-2 rounded-lg">{error}</p>}
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">Batal</button>
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
export function DivisionsPage() {
  const [jabatans, setJabatans] = useState<Jabatan[]>([]);
  const [allUsers, setAllUsers] = useState<UserMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [addOpen, setAddOpen] = useState(false);
  const [editJabatan, setEditJabatan] = useState<Jabatan | null>(null);
  const [deleteJabatan, setDeleteJabatan] = useState<Jabatan | null>(null);
  const [membersJabatan, setMembersJabatan] = useState<Jabatan | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [jRes, uRes] = await Promise.all([
        fetch(`${BASE_URL}/jabatans`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`${BASE_URL}/users?limit=9999`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);
      
      const jJson = await jRes.json();
      const uJson = await uRes.json();

      if (!jJson.success) throw new Error(jJson.message);
      if (!uJson.success) throw new Error(uJson.message);

      setJabatans(jJson.data);
      setAllUsers(uJson.data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = jabatans.filter(j => {
    const matchesSearch = j.nama_jabatan.toLowerCase().includes(search.toLowerCase());
    const activeUser = currentUser || JSON.parse(localStorage.getItem('user') || '{}');
    const isMaster = activeUser?.id?.toString() === '1' || Number(activeUser?.id) === 1 || activeUser?.is_admin === 'superadmin' || activeUser?.is_admin === 'admin' || activeUser?.role === 'superadmin' || activeUser?.role === 'admin';

    if (!isMaster) {
      return matchesSearch && j.manager?.toString() === activeUser?.id?.toString();
    }
    return matchesSearch;
  });

  // Gunakan semua data pegawai untuk pilihan manager
  const managerOptions = allUsers.map(u => ({ value: u.id, label: u.name }));

  const initials = (name: string) =>
    name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  const avatarColors = [
    'bg-violet-500', 'bg-indigo-500', 'bg-sky-500', 'bg-emerald-500',
    'bg-amber-500', 'bg-rose-500', 'bg-pink-500', 'bg-teal-500',
  ];
  const avatarColor = (id: string) => avatarColors[parseInt(id) % avatarColors.length];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="max-w-7xl mx-auto space-y-7 pb-20"
      >
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Jabatan</h1>
            <p className="text-sm text-slate-400 mt-0.5">Kelola jabatan dan struktur organisasi</p>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> Tambah Jabatan
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
                placeholder="Cari nama jabatan..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={fetchData} className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all">
                <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
              </button>
              <span className="text-xs text-slate-400 font-medium">{filtered.length} jabatan</span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {error ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <AlertCircle className="w-8 h-8 text-rose-400" />
                <p className="text-sm font-semibold text-slate-600">{error}</p>
                <button onClick={fetchData} className="text-indigo-600 text-sm font-semibold hover:underline">Coba lagi</button>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Memuat data...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2 text-slate-400">
                <Briefcase className="w-8 h-8" />
                <p className="text-sm font-semibold">Tidak ada jabatan ditemukan</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    {['#', 'Nama Jabatan', 'Manager', 'Anggota', ''].map((h, i) => (
                      <th key={i} className={cn(
                        'py-3.5 px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap',
                        i === 0 ? 'w-12 text-left' : i === 4 ? 'text-right w-24' : 'text-left'
                      )}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((jabatan, i) => (
                    <motion.tr
                      key={jabatan.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="group border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="py-4 px-5">
                        <span className="text-xs font-semibold text-slate-300 group-hover:text-slate-500 transition-colors">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                            <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                          </div>
                          <span className="text-sm font-semibold text-slate-800">{jabatan.nama_jabatan}</span>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        {jabatan.manager_name ? (
                          <div className="flex items-center gap-2.5">
                            <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0', avatarColor(jabatan.manager ?? '0'))}>
                              {initials(jabatan.manager_name)}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-700 leading-tight">{jabatan.manager_name}</p>
                              <p className="text-[11px] text-slate-400 leading-tight">{jabatan.manager_email}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>

                      <td className="py-4 px-5 max-w-xs">
                        {jabatan.users.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {jabatan.users.slice(0, 3).map(u => (
                              <span key={u.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-medium whitespace-nowrap">
                                {u.name.split(' ')[0]}
                              </span>
                            ))}
                            {jabatan.users.length > 3 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-600 text-[11px] font-semibold">
                                +{jabatan.users.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>

                      <td className="py-4 px-5">
                        <div className="flex items-center justify-end gap-1  transition-opacity">
                          <button
                            onClick={() => setMembersJabatan(jabatan)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                            title="Kelola Anggota"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditJabatan(jabatan)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteJabatan(jabatan)}
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
          <JabatanModal
            jabatan={null} managerOptions={managerOptions}
            onClose={() => setAddOpen(false)}
            onSaved={() => { fetchData(); setToast({ type: 'success', message: 'Jabatan berhasil ditambahkan!' }); }}
          />
        )}
        {editJabatan && (
          <JabatanModal
            jabatan={editJabatan} managerOptions={managerOptions}
            onClose={() => setEditJabatan(null)}
            onSaved={() => { fetchData(); setToast({ type: 'success', message: 'Jabatan berhasil diperbarui!' }); }}
          />
        )}
        {deleteJabatan && (
          <DeleteModal
            jabatan={deleteJabatan}
            onClose={() => setDeleteJabatan(null)}
            onDeleted={() => { fetchData(); setToast({ type: 'success', message: 'Jabatan berhasil dihapus!' }); }}
          />
        )}
        {membersJabatan && (
          <MembersModal
            jabatan={membersJabatan}
            onClose={() => setMembersJabatan(null)}
            onSaved={() => { fetchData(); setToast({ type: 'success', message: 'Anggota berhasil diperbarui!' }); }}
          />
        )}
        {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </>
  );
}