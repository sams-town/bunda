import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import {
  FileText, Search, Plus, Download, Calendar, User, Clock,
  AlertCircle, ChevronLeft, ChevronRight, Filter, Edit2,
  Trash2, Eye, CheckCircle2, X, Loader2, Save, AlertTriangle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from './Toast';

// ─── CONFIG ────────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_MEANDPAY;
const USERS_API_BASE = import.meta.env.VITE_API_MEANDPAY;

// ─── TYPES ─────────────────────────────────────────────────────────────────────
interface UserOption {
  id: string;
  name: string;
  foto_karyawan: string | null;
  jabatan?: { nama_jabatan: string } | null;
}

interface Kontrak {
  id: string;
  user_id: string;
  tanggal: string | null;
  jenis_kontrak: string | null;
  tanggal_mulai: string | null;
  tanggal_selesai: string | null;
  masa_berlaku_sebelumnya: string | null;
  keterangan: string | null;
  kontrak_file_path: string | null;
  kontrak_file_name: string | null;
  created_at: string | null;
  updated_at: string | null;
  // joined from users (if available)
  user?: { name: string; avatar?: string };
}

type Status = 'active' | 'expiring' | 'expired' | 'permanent';

interface KontrakForm {
  user_id: string;
  tanggal: string;
  jenis_kontrak: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  keterangan: string;
  file?: File | null;
}

const EMPTY_FORM: KontrakForm = {
  user_id: '',
  tanggal: new Date().toISOString().split('T')[0],
  jenis_kontrak: '',
  tanggal_mulai: '',
  tanggal_selesai: '',
  keterangan: '',
  file: null,
};

// ─── HELPERS ───────────────────────────────────────────────────────────────────
function getStatus(kontrak: Kontrak): Status {
  if (!kontrak.tanggal_selesai) return 'permanent';
  const end = new Date(kontrak.tanggal_selesai);
  const now = new Date();
  const diff = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return 'expired';
  if (diff <= 30) return 'expiring';
  return 'active';
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function avatarFallback(name: string) {
  return name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? '??';
}

// ─── API CALLS ─────────────────────────────────────────────────────────────────
async function apiFetch(path: string, options?: RequestInit) {
  const isFormData = typeof globalThis.FormData !== 'undefined' && options?.body instanceof globalThis.FormData;
  const token = localStorage.getItem('token');
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options?.headers || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchAllUsers(): Promise<UserOption[]> {
  try {
    const json = await apiFetch('/users/all');
    return json.data ?? [];
  } catch (err) {
    console.error('Failed to fetch users:', err);
    return [];
  }
}

function userPhotoUrl(foto: string | null) {
  if (!foto) return null;
  if (foto.startsWith('http')) return foto;
  // handle paths like "foto_karyawan/xxx.jpg" or bare filenames
  return `${USERS_API_BASE}/storage/${foto}`;
}

// ─── USER AVATAR ───────────────────────────────────────────────────────────────
function UserAvatar({ user, size = 'md' }: { user: UserOption; size?: 'sm' | 'md' }) {
  const [imgError, setImgError] = React.useState(false);
  const src = userPhotoUrl(user.foto_karyawan);
  const cls = size === 'sm' ? 'w-8 h-8 text-[10px]' : 'w-10 h-10 text-xs';
  if (src && !imgError) {
    return <img src={src} alt={user.name} onError={() => setImgError(true)}
      className={cn("rounded-xl object-cover shrink-0", cls)} />;
  }
  return (
    <div className={cn("rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black shrink-0", cls)}>
      {avatarFallback(user.name)}
    </div>
  );
}

// ─── USER SELECT DROPDOWN ──────────────────────────────────────────────────────
function UserSelect({ value, onChange, users, loadingUsers }: {
  value: string; onChange: (id: string) => void;
  users: UserOption[]; loadingUsers: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const ref = React.useRef<HTMLDivElement>(null);

  const selected = users.find(u => u.id === value);
  const filtered = users.filter(u => u.name.toLowerCase().includes(query.toLowerCase()));

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative sm:col-span-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Pegawai *</label>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-left"
      >
        {loadingUsers ? (
          <><Loader2 className="w-4 h-4 animate-spin text-slate-400" /><span className="text-slate-400">Memuat pegawai...</span></>
        ) : selected ? (
          <>
            <UserAvatar user={selected} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-900 truncate text-sm">{selected.name}</p>
              {selected.jabatan && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">{selected.jabatan.nama_jabatan}</p>}
            </div>
          </>
        ) : (
          <span className="text-slate-400 text-sm">Pilih pegawai...</span>
        )}
        <ChevronRight className={cn("w-4 h-4 text-slate-300 shrink-0 ml-auto transition-transform", open && "rotate-90")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/50 overflow-hidden"
          >
            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input autoFocus type="text" placeholder="Cari nama pegawai..."
                  value={query} onChange={e => setQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
              {filtered.length === 0
                ? <p className="text-center text-sm text-slate-400 py-6 font-bold">Tidak ditemukan</p>
                : filtered.map(u => (
                  <button key={u.id} type="button"
                    onClick={() => { onChange(u.id); setOpen(false); setQuery(''); }}
                    className={cn("w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50/60 transition-colors text-left",
                      value === u.id && "bg-indigo-50")}
                  >
                    <UserAvatar user={u} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate">{u.name}</p>
                      {u.jabatan && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">{u.jabatan.nama_jabatan}</p>}
                    </div>
                    {value === u.id && <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />}
                  </button>
                ))
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── MODAL ─────────────────────────────────────────────────────────────────────
function Modal({
  open, onClose, title, children
}: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-900">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all active:scale-90"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-8">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── KONTRAK FORM ──────────────────────────────────────────────────────────────
function KontrakFormFields({
  form, onChange, users, loadingUsers
}: {
  form: KontrakForm;
  onChange: (k: keyof KontrakForm, v: any) => void;
  users: UserOption[];
  loadingUsers: boolean;
}) {
  const field = (label: string, key: keyof KontrakForm, type = 'text', placeholder = '') => (
    <div>
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">{label}</label>
      <input
        type={type}
        value={(form[key] as string) || ''}
        onChange={e => onChange(key, e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
      />
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <UserSelect value={form.user_id} onChange={id => onChange('user_id', id)} users={users} loadingUsers={loadingUsers} />
      {field('Tanggal Kontrak', 'tanggal', 'date')}
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Jenis Kontrak</label>
        <select
          value={form.jenis_kontrak}
          onChange={e => onChange('jenis_kontrak', e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
        >
          <option value="">-- Pilih Jenis Kontrak --</option>
          <option value="Perjanjian Kerja Waktu Tertentu (PKWT)">Perjanjian Kerja Waktu Tertentu (PKWT)</option>
          <option value="Perjanjian Kerja Waktu Tidak Tertentu (PKWTT)">Perjanjian Kerja Waktu Tidak Tertentu (PKWTT)</option>
          <option value="Tenaga Harian Lepas (THL)">Tenaga Harian Lepas (THL)</option>
        </select>
      </div>
      {field('Tanggal Mulai', 'tanggal_mulai', 'date')}
      {field('Tanggal Selesai', 'tanggal_selesai', 'date')}
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">File Kontrak</label>
        <input
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          onChange={e => onChange('file', e.target.files?.[0] || null)}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Keterangan</label>
        <textarea
          value={form.keterangan || ''}
          onChange={e => onChange('keterangan', e.target.value)}
          rows={3}
          placeholder="Keterangan kontrak..."
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none"
        />
      </div>
    </div>
  );
}

// ─── DELETE CONFIRM DIALOG ─────────────────────────────────────────────────────
function DeleteDialog({
  open, onClose, onConfirm, loading
}: { open: boolean; onClose: () => void; onConfirm: () => void; loading: boolean }) {
  return (
    <Modal open={open} onClose={onClose} title="Konfirmasi Hapus">
      <div className="flex flex-col items-center text-center gap-6">
        <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-rose-500" />
        </div>
        <div>
          <p className="text-lg font-black text-slate-900 mb-2">Hapus Kontrak Ini?</p>
          <p className="text-sm text-slate-500">Tindakan ini tidak dapat dibatalkan. Data kontrak akan dihapus permanen.</p>
        </div>
        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 bg-rose-600 text-white rounded-2xl text-sm font-bold hover:bg-rose-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Hapus
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── DETAIL VIEW ───────────────────────────────────────────────────────────────
function DetailModal({ open, onClose, kontrak }: { open: boolean; onClose: () => void; kontrak: Kontrak | null }) {
  if (!kontrak) return null;
  const status = getStatus(kontrak);
  const fileUrl = kontrak.kontrak_file_path
    ? kontrak.kontrak_file_path.startsWith('http')
      ? kontrak.kontrak_file_path
      : `${USERS_API_BASE.replace('/api', '')}${kontrak.kontrak_file_path.startsWith('/') ? '' : '/'}${kontrak.kontrak_file_path}`
    : null;

  const fileNode = fileUrl ? (
    <a href={fileUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1.5 break-all">
      <FileText className="w-4 h-4 shrink-0" />
      <span>{kontrak.kontrak_file_name || 'Buka File'}</span>
    </a>
  ) : '—';

  const rows: [string, React.ReactNode][] = [
    ['ID', kontrak.id],
    ['User ID', kontrak.user_id],
    ['Jenis Kontrak', kontrak.jenis_kontrak ?? '—'],
    ['Tanggal', fmtDate(kontrak.tanggal)],
    ['Tanggal Mulai', fmtDate(kontrak.tanggal_mulai)],
    ['Tanggal Selesai', kontrak.tanggal_selesai ? fmtDate(kontrak.tanggal_selesai) : 'Tidak terbatas'],
    ['Keterangan', kontrak.keterangan ?? '—'],
    ['File', fileNode],
  ];

  return (
    <Modal open={open} onClose={onClose} title="Detail Kontrak">
      <div className="space-y-5">
        <div className={cn(
          "inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest",
          status === 'active' ? 'bg-emerald-50 text-emerald-600' :
            status === 'expiring' ? 'bg-amber-50 text-amber-600' :
              status === 'permanent' ? 'bg-indigo-50 text-indigo-600' :
                'bg-rose-50 text-rose-600'
        )}>
          <div className={cn("w-1.5 h-1.5 rounded-full", status === 'active' ? 'bg-emerald-500' : status === 'expiring' ? 'bg-amber-500' : status === 'permanent' ? 'bg-indigo-500' : 'bg-rose-500')} />
          {status}
        </div>
        <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 overflow-hidden">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-start gap-4 px-5 py-3.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 w-44 shrink-0 pt-0.5">{label}</span>
              <div className="text-sm font-bold text-slate-700 break-all">{value}</div>
            </div>
          ))}
        </div>

        {/* File Preview */}
        {fileUrl && (
          <div className="mt-4 flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Preview Dokumen</span>
            <div className="rounded-2xl border border-slate-100 overflow-hidden bg-slate-50 flex items-center justify-center">
              {kontrak.kontrak_file_name?.match(/\.(jpg|jpeg|png)$/i) ? (
                <img src={fileUrl} alt="Kontrak Preview" className="w-full h-auto object-contain max-h-[600px]" />
              ) : (
                <iframe src={fileUrl} className="w-full h-[600px] border-none" title="Preview Dokumen" />
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── STATUS BADGE ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, { bg: string; dot: string; label: string }> = {
    active: { bg: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500', label: 'Aktif' },
    expiring: { bg: 'bg-amber-50 text-amber-600', dot: 'bg-amber-500', label: 'Akan Berakhir' },
    expired: { bg: 'bg-rose-50 text-rose-600', dot: 'bg-rose-500', label: 'Habis' },
    permanent: { bg: 'bg-indigo-50 text-indigo-600', dot: 'bg-indigo-500', label: 'Permanen' },
  };
  const { bg, dot, label } = map[status];
  return (
    <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", bg)}>
      <div className={cn("w-1.5 h-1.5 rounded-full", dot)} />
      {label}
    </div>
  );
}

// ─── STAT CARD ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, bg }: { label: string; value: number; icon: any; color: string; bg: string }) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/30 flex items-center gap-6 group hover:scale-[1.02] transition-all">
      <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform shadow-inner", bg, color)}>
        <Icon className="w-8 h-8" />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
        <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 10;

export function ContractsPage() {
  // ── state ──
  const [contracts, setContracts] = useState<Kontrak[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  // users for dropdown
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // modal states
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState<Kontrak | null>(null);
  const [form, setForm] = useState<KontrakForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { addToast, updateToast } = useToast();

  // ── fetch ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await apiFetch(`/kontraks?${params}`);
      setContracts(res.data ?? []);
    } catch (e: any) {
      setError('Gagal memuat data. Periksa koneksi ke server.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // fetch users for dropdown once
  useEffect(() => {
    setLoadingUsers(true);
    fetchAllUsers()
      .then(setUsers)
      .finally(() => setLoadingUsers(false));
  }, []);

  const userMap = React.useMemo(() =>
    Object.fromEntries(users.map(u => [u.id, u])), [users]);

  // ── derived ──
  const filtered = contracts.filter(c => {
    if (dateFrom && c.tanggal_mulai && c.tanggal_mulai < dateFrom) return false;
    if (dateTo && c.tanggal_mulai && c.tanggal_mulai > dateTo) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = {
    total: contracts.length,
    active: contracts.filter(c => getStatus(c) === 'active').length,
    expiring: contracts.filter(c => getStatus(c) === 'expiring').length,
    expired: contracts.filter(c => getStatus(c) === 'expired').length,
  };

  // ── handlers ──
  const handleFormChange = (k: keyof KontrakForm, v: any) =>
    setForm(f => ({ ...f, [k]: v }));

  const openAdd = () => { setForm({ ...EMPTY_FORM, tanggal: new Date().toISOString().split('T')[0] }); setFormError(null); setShowAdd(true); };

  const openEdit = (c: Kontrak) => {
    setSelected(c);
    setForm({
      user_id: c.user_id ?? '',
      tanggal: c.tanggal?.slice(0, 10) ?? new Date().toISOString().split('T')[0],
      jenis_kontrak: c.jenis_kontrak ?? '',
      tanggal_mulai: c.tanggal_mulai?.slice(0, 10) ?? '',
      tanggal_selesai: c.tanggal_selesai?.slice(0, 10) ?? '',
      keterangan: c.keterangan ?? '',
      file: null,
    });
    setFormError(null);
    setShowEdit(true);
  };

  const openDelete = (c: Kontrak) => { setSelected(c); setShowDelete(true); };
  const openDetail = (c: Kontrak) => { setSelected(c); setShowDetail(true); };

  const buildPayload = () => {
    if (form.file) {
      const fd = new globalThis.FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== null && v !== undefined && v !== '') {
          fd.append(k, v instanceof Blob ? v : String(v));
        }
      });
      return fd;
    }
    const { file, ...json } = form; // eslint-disable-line
    return JSON.stringify(json);
  };

  const handleAdd = async () => {
    if (!form.user_id.trim()) { setFormError('User ID wajib diisi.'); return; }
    setSubmitting(true); setFormError(null);
    console.log(buildPayload());
    try {
      await apiFetch('/kontraks', { method: 'POST', body: buildPayload() });
      setShowAdd(false);
      fetchData();
    } catch {
      setFormError('Gagal menyimpan kontrak. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selected) return;
    setSubmitting(true); setFormError(null);
    try {
      await apiFetch(`/kontraks/${selected.id}`, { method: 'PUT', body: buildPayload() });
      setShowEdit(false);
      fetchData();
    } catch {
      setFormError('Gagal mengupdate kontrak. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await apiFetch(`/kontraks/${selected.id}`, { method: 'DELETE' });
      setShowDelete(false);
      fetchData();
    } catch {
      // ignore – could add toast
    } finally {
      setSubmitting(false);
    }
  };

  const clearFilters = () => { setSearch(''); setDateFrom(''); setDateTo(''); setPage(1); };

  const handleExportExcel = async () => {
    const toastId = addToast({ type: 'loading', title: 'Export Excel', message: 'Sedang menyiapkan data...' });
    try {
      // Fetch all contracts for export (using a high limit if the API supports it)
      const res = await apiFetch('/kontraks?limit=100000');
      const allContracts: Kontrak[] = res.data ?? [];

      const exportData = allContracts.map((c, index) => {
        const userInfo = userMap[c.user_id];
        return {
          'No': index + 1,
          'Nama Pegawai': userInfo?.name ?? `User #${c.user_id}`,
          'Jabatan': userInfo?.jabatan?.nama_jabatan ?? '—',
          'Jenis Kontrak': c.jenis_kontrak ?? '—',
          'Tanggal Kontrak': fmtDate(c.tanggal),
          'Tanggal Mulai': fmtDate(c.tanggal_mulai),
          'Tanggal Selesai': c.tanggal_selesai ? fmtDate(c.tanggal_selesai) : 'Permanen',
          'Status': getStatus(c).toUpperCase(),
          'Keterangan': c.keterangan ?? '—'
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Kontrak Kerja');

      // Adjust column widths
      ws['!cols'] = [
        { wch: 5 },  // No
        { wch: 25 }, // Nama Pegawai
        { wch: 20 }, // Jabatan
        { wch: 30 }, // Jenis Kontrak
        { wch: 15 }, // Tanggal Kontrak
        { wch: 15 }, // Tanggal Mulai
        { wch: 15 }, // Tanggal Selesai
        { wch: 12 }, // Status
        { wch: 40 }, // Keterangan
      ];

      XLSX.writeFile(wb, `Data_Kontrak_${new Date().toISOString().split('T')[0]}.xlsx`);
      updateToast(toastId, { type: 'success', title: 'Berhasil', message: 'Data berhasil di-export ke Excel' });
    } catch (err: any) {
      console.error('Export error:', err);
      updateToast(toastId, { type: 'error', title: 'Gagal', message: err.message || 'Gagal mengekspor data' });
    }
  };

  // ── render ──
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-8 pb-20"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Kontrak Kerja</h1>
          <p className="text-slate-500 font-medium">Manage and track employee employment contracts.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Export Excel
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            Tambah Kontrak
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Kontrak" value={stats.total} icon={FileText} color="text-indigo-600" bg="bg-indigo-50" />
        <StatCard label="Aktif" value={stats.active} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard label="Akan Berakhir" value={stats.expiring} icon={Clock} color="text-amber-600" bg="bg-amber-50" />
        <StatCard label="Habis Kontrak" value={stats.expired} icon={AlertCircle} color="text-rose-600" bg="bg-rose-50" />
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/30 overflow-hidden">
        {/* Filters */}
        <div className="p-8 border-b border-slate-100 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Cari Kontrak</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Jenis kontrak, keterangan..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Tanggal Mulai</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                  className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Tanggal Akhir</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
                  className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <button onClick={clearFilters} className="text-sm font-bold text-indigo-600 hover:underline">Clear All</button>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Showing {paginated.length} of {filtered.length} records
            </p>
          </div>
        </div>

        {/* Table */}
        {error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-8">
            <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-rose-400" />
            </div>
            <p className="text-sm font-bold text-slate-500">{error}</p>
            <button onClick={fetchData} className="px-6 py-2 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700">
              Coba Lagi
            </button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <FileText className="w-12 h-12 text-slate-200" />
            <p className="text-sm font-bold text-slate-400">Tidak ada data kontrak</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  {['No.', 'Nama Pegawai / ID', 'Jenis Kontrak', 'Tanggal Mulai', 'Tanggal Selesai', 'Status', 'Actions'].map(h => (
                    <th key={h} className={cn(
                      "py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100",
                      h === 'Actions' ? 'text-right' : 'text-left'
                    )}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginated.map((c, i) => {
                  const status = getStatus(c);
                  const userInfo = userMap[c.user_id];
                  const displayName = userInfo?.name ?? `User #${c.user_id}`;
                  return (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="group hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-6 px-8">
                        <span className="text-sm font-black text-slate-300 group-hover:text-slate-900 transition-colors">
                          {((page - 1) * PAGE_SIZE + i + 1).toString().padStart(2, '0')}
                        </span>
                      </td>
                      <td className="py-6 px-8">
                        <div className="flex items-center gap-4">
                          {userInfo
                            ? <UserAvatar user={userInfo} size="md" />
                            : <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black shrink-0">{avatarFallback(displayName)}</div>
                          }
                          <div>
                            <p className="text-sm font-black text-slate-900 leading-tight">{displayName}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{userInfo?.jabatan?.nama_jabatan ?? c.keterangan?.slice(0, 30) ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-8">
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                          {c.jenis_kontrak ?? '—'}
                        </span>
                      </td>
                      <td className="py-6 px-8">
                        <span className="text-sm font-bold text-slate-600">{fmtDate(c.tanggal_mulai)}</span>
                      </td>
                      <td className="py-6 px-8">
                        <span className="text-sm font-bold text-slate-600">
                          {c.tanggal_selesai ? fmtDate(c.tanggal_selesai) : '∞ Permanen'}
                        </span>
                      </td>
                      <td className="py-6 px-8">
                        <StatusBadge status={status} />
                      </td>
                      <td className="py-6 px-8">
                        <div className="flex items-center justify-end gap-2  transition-opacity">
                          <button onClick={() => openDetail(c)} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-90">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => openEdit(c)} className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all active:scale-90">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => openDelete(c)} className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all active:scale-90">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="p-8 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 transition-all disabled:opacity-40"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const n = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                return (
                  <button key={n} onClick={() => setPage(n)}
                    className={cn("w-10 h-10 rounded-xl text-xs font-black transition-all",
                      n === page
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                        : 'bg-white border border-slate-200 text-slate-500 hover:border-indigo-100 hover:text-indigo-600'
                    )}>{n}</button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 transition-all disabled:opacity-40"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}

      {/* Add */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Tambah Kontrak">
        <div className="space-y-6">
          <KontrakFormFields form={form} onChange={handleFormChange} users={users} loadingUsers={loadingUsers} />
          {formError && (
            <p className="text-sm font-bold text-rose-500 bg-rose-50 px-4 py-3 rounded-2xl">{formError}</p>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-3 border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
              Batal
            </button>
            <button onClick={handleAdd} disabled={submitting}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Kontrak">
        <div className="space-y-6">
          <KontrakFormFields form={form} onChange={handleFormChange} users={users} loadingUsers={loadingUsers} />
          {formError && (
            <p className="text-sm font-bold text-rose-500 bg-rose-50 px-4 py-3 rounded-2xl">{formError}</p>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowEdit(false)} className="flex-1 py-3 border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
              Batal
            </button>
            <button onClick={handleEdit} disabled={submitting}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Update
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete */}
      <DeleteDialog open={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete} loading={submitting} />

      {/* Detail */}
      <DetailModal open={showDetail} onClose={() => setShowDetail(false)} kontrak={selected} />
    </motion.div>
  );
}