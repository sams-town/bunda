import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserMinus,
  Search,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  Check,
  X,
  Upload,
  ChevronDown,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Eye,
  AlertTriangle,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from './Toast';

export interface ResignationData {
  id: string;
  user_id: string;
  tanggal: string;
  jenis: string;
  alasan: string;
  pegawai_keluar_file_path: string | null;
  pegawai_keluar_file_name: string | null;
  approved_by: string | null;
  tanggal_approval: string | null;
  notes: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
    email?: string;
    foto_karyawan: string | null;
    jabatan?: { nama_jabatan: string } | null;
  };
  approved_by_user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Employee {
  id: string;
  name: string;
  foto_karyawan: string | null;
  jabatan: string | null;
  tgl_join: string | null;
}

const JENIS_OPTIONS = [
  'Habis Kontrak (Pekerja dengan Status PKWT/Kontrak)',
  'Mengundurkan Diri (Prosedural)',
  'Mengundurkan Diri (Non Prosedural)',
  'Meninggal Dunia',
  'Usia Pensiun',
  'Cacat Total Tetap',
  'Pemutusan Hubungan Kerja (PHK)'
];

// Avatar: shows photo if available, otherwise colored initials
function EmployeeAvatar({ name, foto, className }: { name: string; foto: string | null; className?: string }) {
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const colorPalette = [
    'bg-indigo-100 text-indigo-600',
    'bg-violet-100 text-violet-600',
    'bg-sky-100 text-sky-600',
    'bg-emerald-100 text-emerald-600',
    'bg-amber-100 text-amber-600',
    'bg-rose-100 text-rose-600',
    'bg-pink-100 text-pink-600',
    'bg-teal-100 text-teal-600',
  ];
  const color = colorPalette[name.charCodeAt(0) % colorPalette.length];

  if (foto) {
    const isAbsoluteUrl = foto.startsWith('http://') || foto.startsWith('https://');
    const imageSrc = isAbsoluteUrl ? foto : `${import.meta.env.VITE_API_MEANDPAY.replace('/api', '')}/storage/${foto}`;

    return (
      <img
        src={imageSrc}
        alt={name}
        className={cn('object-cover shrink-0', className)}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    );
  }
  return (
    <div className={cn('flex items-center justify-center text-xs font-black shrink-0', color, className)}>
      {initials}
    </div>
  );
}

// ─── USER SELECT DROPDOWN ──────────────────────────────────────────────────────
function UserSelect({ value, onChange, users, loadingUsers }: {
  value: string; onChange: (id: string) => void;
  users: Employee[]; loadingUsers: boolean;
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
    <div ref={ref} className="relative w-full">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Pegawai *</label>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-left"
      >
        {loadingUsers ? (
          <><Loader2 className="w-4 h-4 animate-spin text-slate-400" /><span className="text-slate-400">Memuat pegawai...</span></>
        ) : selected ? (
          <>
            <EmployeeAvatar name={selected.name} foto={selected.foto_karyawan} className="w-8 h-8 rounded-xl object-cover shrink-0 text-[10px]" />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-900 truncate text-sm">{selected.name}</p>
              {selected.jabatan && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">{selected.jabatan}</p>}
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
            className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/60 z-20 overflow-hidden"
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
                    <EmployeeAvatar name={u.name} foto={u.foto_karyawan} className="w-8 h-8 rounded-xl object-cover shrink-0 text-[10px]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate">{u.name}</p>
                      {u.jabatan && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">{u.jabatan}</p>}
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

export function ResignationsPage() {
  const { addToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [resignationsData, setResignationsData] = useState<ResignationData[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 100, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loadingResignations, setLoadingResignations] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<ResignationData | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'approve' | 'delete' | 'restore';
    id: string;
    title: string;
    message: string;
    confirmText: string;
    confirmColor: string;
  } | null>(null);

  const [form, setForm] = useState({
    pegawai_id: '',
    jenis: '',
    alasan: '',
    tanggal: '',
    file: null as File | null,
  });

  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      let allEmployees: Employee[] = [];
      let page = 1;
      let totalPages = 1;
      do {
        const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/users?page=${page}&limit=100`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          allEmployees = [
            ...allEmployees,
            ...data.data.map((u: any) => ({
              id: u.id,
              name: u.name,
              foto_karyawan: u.foto_karyawan,
              jabatan: u.jabatan?.nama_jabatan ?? null,
              tgl_join: u.tgl_join ?? null,
            })),
          ];
          totalPages = data.meta?.totalPages ?? 1;
        } else break;
        page++;
      } while (page <= totalPages);

      allEmployees.sort((a, b) => a.name.localeCompare(b.name));
      setEmployees(allEmployees);
    } catch (err) {
      console.error('Gagal mengambil data pegawai:', err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const fetchResignations = useCallback(async (currentPage: number) => {
    setLoadingResignations(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '100',
        ...(searchQuery ? { search: searchQuery } : {}),
        ...(dateStart ? { start_date: dateStart } : {}),
        ...(dateEnd ? { end_date: dateEnd } : {}),
      });
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/pegawai-keluar?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setResignationsData(data.data);
        if (data.meta) setMeta(data.meta);
      }
    } catch (err) {
      console.error('Gagal mengambil data pegawai keluar:', err);
    } finally {
      setLoadingResignations(false);
    }
  }, [searchQuery, dateStart, dateEnd]);

  useEffect(() => {
    fetchResignations(page);
  }, [page, fetchResignations]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, dateStart, dateEnd]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const openModal = () => {
    setSelectedId(null);
    setForm({ pegawai_id: '', jenis: '', alasan: '', tanggal: '', file: null });
    setShowModal(true);
  };

  const openEditModal = (item: ResignationData) => {
    setSelectedId(item.id);
    setForm({
      pegawai_id: item.user_id.toString(),
      jenis: item.jenis,
      alasan: item.alasan || '',
      tanggal: item.tanggal ? new Date(item.tanggal).toISOString().split('T')[0] : '',
      file: null,
    });
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedId(null);
    setForm({ pegawai_id: '', jenis: '', alasan: '', tanggal: '', file: null });
  };

  const openDetailModal = async (id: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/pegawai-keluar/${id}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setDetailData(data.data);
      } else {
        addToast({ type: 'error', title: 'Gagal', message: data.message || 'Gagal memuat detail.' });
      }
    } catch {
      addToast({ type: 'error', title: 'Error Server', message: 'Terdapat masalah saat menghubungi server.' });
    }
  };

  const closeDetailModal = () => {
    setDetailData(null);
  };

  const handleSubmit = async () => {
    if (!form.pegawai_id || !form.jenis || !form.tanggal) {
      setFormError('Harap isi semua field bertanda bintang (*)');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const formData = new FormData();
    formData.append('user_id', form.pegawai_id);
    formData.append('jenis', form.jenis);
    formData.append('tanggal', form.tanggal);
    if (form.alasan) formData.append('alasan', form.alasan);
    if (form.file) formData.append('file', form.file);

    try {
      const url = selectedId
        ? `${import.meta.env.VITE_API_MEANDPAY}/pegawai-keluar/${selectedId}`
        : `${import.meta.env.VITE_API_MEANDPAY}/pegawai-keluar`;
      const method = selectedId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Refresh the list
        fetchResignations();
        closeModal();
        addToast({
          type: 'success',
          title: 'Berhasil',
          message: selectedId ? 'Data pengajuan berhasil diubah.' : 'Data pengajuan berhasil ditambahkan.'
        });
      } else {
        setFormError(data.message || 'Gagal menyimpan data');
        addToast({
          type: 'error',
          title: 'Gagal',
          message: data.message || 'Gagal menyimpan data pengajuan.'
        });
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setFormError('Terjadi kesalahan pada server');
      addToast({ type: 'error', title: 'Error Server', message: 'Terdapat masalah saat menghubungi server.' });
    } finally {
      setSubmitting(false);
    }
  };

  const openApproveConfirm = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      type: 'approve',
      id,
      title: 'Setujui Pengajuan?',
      message: 'Apakah Anda yakin ingin menyetujui data pegawai keluar ini? Proses ini tidak dapat dibatalkan.',
      confirmText: 'Ya, Setujui',
      confirmColor: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20 text-white'
    });
  };

  const openDeleteConfirm = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      type: 'delete',
      id,
      title: 'Hapus Data?',
      message: 'Apakah Anda yakin ingin menghapus data pengajuan ini? Data yang terhapus tidak dapat dikembalikan.',
      confirmText: 'Ya, Hapus',
      confirmColor: 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20 text-white'
    });
  };

  const openRestoreConfirm = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      type: 'restore',
      id,
      title: 'Pulangkan ke Pegawai Aktif?',
      message: 'Apakah Anda yakin ingin memulangkan pegawai ini kembali ke status pegawai aktif?',
      confirmText: 'Ya, Pulangkan',
      confirmColor: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20 text-white'
    });
  };

  const handleApprove = async (id: string) => {
    try {
      const storedUser = localStorage.getItem('user');
      const currentUser = storedUser ? JSON.parse(storedUser) : null;
      const approvedBy = currentUser?.id ? String(currentUser.id) : '1';

      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/pegawai-keluar/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved_by: approvedBy,
          notes: 'Disetujui dari Dashboard'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchResignations();
        addToast({
          type: 'success',
          title: 'Disetujui',
          message: 'Pengajuan resign berhasil disetujui.'
        });
      } else {
        addToast({
          type: 'error',
          title: 'Gagal',
          message: data.message || 'Gagal menyetujui data pengajuan.'
        });
      }
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', title: 'Error Server', message: 'Terdapat masalah saat menghubungi server.' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/pegawai-keluar/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchResignations();
        addToast({
          type: 'success',
          title: 'Dihapus',
          message: 'Data pengajuan berhasil dihapus.'
        });
      } else {
        addToast({
          type: 'error',
          title: 'Gagal',
          message: data.message || 'Gagal menghapus data pengajuan.'
        });
      }
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', title: 'Error Server', message: 'Terdapat masalah saat menghubungi server.' });
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/pegawai-keluar/${id}/restore`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchResignations(page);
        fetchEmployees();
        addToast({
          type: 'success',
          title: 'Berhasil Dipulangkan',
          message: 'Pegawai berhasil dipulangkan ke status pegawai aktif.'
        });
      } else {
        addToast({
          type: 'error',
          title: 'Gagal',
          message: data.message || 'Gagal memulangkan pegawai.'
        });
      }
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', title: 'Error Server', message: 'Terdapat masalah saat menghubungi server.' });
    }
  };

  const calculateTurnover = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const resignationsInPeriod = resignationsData.filter(r => {
      if (r.status !== 'APPROVED') return false;
      const d = new Date(r.tanggal);
      if (dateStart && d < new Date(dateStart)) return false;
      if (dateEnd && d > new Date(dateEnd)) return false;
      
      // Default to this month if no dates set
      if (!dateStart && !dateEnd) {
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      return true;
    }).length;

    const hiresInPeriod = employees.filter(e => {
      if (!e.tgl_join) return false;
      const d = new Date(e.tgl_join);
      if (dateStart && d < new Date(dateStart)) return false;
      if (dateEnd && d > new Date(dateEnd)) return false;

      if (!dateStart && !dateEnd) {
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      return true;
    }).length;

    const endOfPeriod = employees.length; 
    const startOfPeriod = endOfPeriod + resignationsInPeriod - hiresInPeriod;
    const average = (startOfPeriod + endOfPeriod) / 2;

    const rate = average > 0 ? (resignationsInPeriod / average) * 100 : 0;

    return {
      rate: rate.toFixed(1),
      count: resignationsInPeriod,
      average: Math.round(average),
      hires: hiresInPeriod,
      label: dateStart && dateEnd ? `${new Date(dateStart).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })} - ${new Date(dateEnd).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}` : 'Bulan Ini'
    };
  };

  const turnover = calculateTurnover();

  const filteredResignations = resignationsData.filter(item => {
    const emp = item.user || employees.find(e => e.id.toString() === item.user_id?.toString());
    const empName = emp?.name || `Pegawai #${item.user_id}`;
    if (searchQuery && !empName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    const d = new Date(item.tanggal);
    if (dateStart && d < new Date(dateStart)) return false;
    if (dateEnd && d > new Date(dateEnd)) return false;
    
    return true;
  });

  const executeConfirm = async () => {
    if (!confirmDialog) return;
    setSubmitting(true);
    if (confirmDialog.type === 'approve') {
      await handleApprove(confirmDialog.id);
    } else if (confirmDialog.type === 'restore') {
      await handleRestore(confirmDialog.id);
    } else {
      await handleDelete(confirmDialog.id);
    }
    setSubmitting(false);
    setConfirmDialog(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-8 pb-20"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Pegawai Keluar</h1>
          <p className="text-slate-500 font-medium">Manage employee resignations and offboarding processes.</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black transition-all shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Tambah
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <ResignationStat label="Total Resignations" value={resignationsData.length.toString()} icon={UserMinus} color="text-indigo-600" bg="bg-indigo-50" />
        <ResignationStat label="Pending Approval" value={resignationsData.filter(r => r.status === 'PENDING').length.toString()} icon={Clock} color="text-amber-600" bg="bg-amber-50" />
        <ResignationStat label="Approved" value={resignationsData.filter(r => r.status === 'APPROVED').length.toString()} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" />
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/30 p-8 flex items-center gap-6 group hover:border-violet-300 transition-all">
          <div className="w-16 h-16 rounded-[2rem] bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 border border-violet-100 group-hover:bg-violet-600 group-hover:text-white transition-all">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Turnover Rate</p>
            <p className="text-3xl font-black text-slate-800 leading-tight">{turnover.rate}%</p>
            <p className="text-[10px] text-slate-400 font-bold mt-1">{turnover.label} ({turnover.count} keluar / {turnover.average} rata-rata)</p>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/30 overflow-hidden">
        <div className="p-8 border-b border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Nama Pegawai</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search employee..." className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Tanggal Mulai</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Tanggal Akhir</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">No.</th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">Nama Pegawai</th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">Tanggal</th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">Jenis</th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">Alasan</th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">File</th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">Status</th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right border-b border-slate-100">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loadingResignations ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium text-sm">Sedang memuat data...</td>
                </tr>
              ) : filteredResignations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium text-sm">Tidak ada data pegawai keluar.</td>
                </tr>
              ) : filteredResignations.map((item, index) => {
                const emp = item.user || employees.find(e => e.id.toString() === item.user_id?.toString());
                const empName = emp?.name || `Pegawai #${item.user_id}`;
                const empFoto = emp?.foto_karyawan || null;

                return (
                  <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-6 px-8 text-sm font-black text-slate-300 group-hover:text-slate-900 transition-colors">{( (meta.page - 1) * meta.limit + index + 1).toString().padStart(2, '0')}</td>
                    <td className="py-6 px-8">
                      <div className="flex items-center gap-3">
                        <EmployeeAvatar name={empName} foto={empFoto} className="w-10 h-10 rounded-xl shadow-sm" />
                        <span className="text-sm font-black text-slate-900">{empName}</span>
                      </div>
                    </td>
                    <td className="py-6 px-8 text-sm font-bold text-slate-600">
                      {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </td>
                    <td className="py-6 px-8 text-sm font-bold text-slate-600">{item.jenis}</td>
                    <td className="py-6 px-8 text-sm font-bold text-slate-600 max-w-[200px] truncate">{item.alasan}</td>
                    <td className="py-6 px-8 text-sm font-bold text-slate-600">{item.pegawai_keluar_file_name || '-'}</td>
                    <td className="py-6 px-8">
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                        item.status === 'PENDING' ? "bg-amber-50 text-amber-600" :
                          item.status === 'APPROVED' ? "bg-emerald-50 text-emerald-600" :
                            "bg-rose-50 text-rose-600"
                      )}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-6 px-8">
                      <div className="flex items-center justify-end gap-2  transition-opacity">
                        {item.status === 'PENDING' && (
                          <>
                            <button onClick={() => openEditModal(item)} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-90" title="Edit Data"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => openDeleteConfirm(item.id)} className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all active:scale-90" title="Hapus Data"><Trash2 className="w-4 h-4" /></button>
                            <button onClick={() => openApproveConfirm(item.id)} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all active:scale-90" title="Setujui (Approve)"><Check className="w-4 h-4" /></button>
                          </>
                        )}
                        {item.status === 'APPROVED' && (
                          <>
                            <button onClick={() => openDetailModal(item.id)} className="p-2.5 bg-sky-50 text-sky-600 rounded-xl hover:bg-sky-600 hover:text-white transition-all active:scale-90" title="Lihat Detail"><Eye className="w-4 h-4" /></button>
                            <button onClick={() => openRestoreConfirm(item.id)} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-90" title="Pulangkan Pegawai"><UserCheck className="w-4 h-4" /></button>
                            <button onClick={() => openDeleteConfirm(item.id)} className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all active:scale-90" title="Hapus Data"><Trash2 className="w-4 h-4" /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loadingResignations && meta.totalPages > 1 && (
          <div className="px-8 py-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Halaman <span className="text-slate-900">{meta.page}</span> dari <span className="text-slate-900">{meta.totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={meta.page === 1}
                className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                  let pNum = meta.page <= 3 ? i + 1 : meta.page >= meta.totalPages - 2 ? meta.totalPages - 4 + i : meta.page - 2 + i;
                  if (pNum < 1 || pNum > meta.totalPages) return null;
                  return (
                    <button
                      key={pNum}
                      onClick={() => setPage(pNum)}
                      className={cn(
                        "w-10 h-10 rounded-xl text-xs font-black transition-all active:scale-90",
                        meta.page === pNum 
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                          : "bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-600"
                      )}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                disabled={meta.page === meta.totalPages}
                className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-8 border-b border-slate-100 shrink-0">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedId ? 'Edit Pegawai Keluar' : 'Tambah Pegawai Keluar'}</h2>
                    <p className="text-slate-400 text-sm font-medium mt-1">Isi form berikut untuk {selectedId ? 'merubah' : 'menambahkan'} data</p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="p-3 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-all active:scale-90"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form Error Alert */}
                {formError && (
                  <div className="mx-8 mt-6 p-4 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold flex items-center gap-3">
                    <X className="w-4 h-4 shrink-0" />
                    <p>{formError}</p>
                  </div>
                )}

                {/* Modal Body */}
                <div className="p-8 space-y-6 overflow-y-auto flex-1">

                  {/* Pegawai — Custom Searchable Dropdown */}
                  <UserSelect
                    value={form.pegawai_id}
                    onChange={id => setForm(f => ({ ...f, pegawai_id: id }))}
                    users={employees}
                    loadingUsers={loadingEmployees}
                  />

                  {/* Jenis Keberhentian */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">
                      Jenis Keberhentian <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={form.jenis}
                        onChange={e => setForm(f => ({ ...f, jenis: e.target.value }))}
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none"
                      >
                        <option value="">-- Pilih Jenis Keberhentian --</option>
                        {JENIS_OPTIONS.map(j => (
                          <option key={j} value={j}>{j}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Alasan */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">
                      Alasan
                    </label>
                    <textarea
                      value={form.alasan}
                      onChange={e => setForm(f => ({ ...f, alasan: e.target.value }))}
                      rows={3}
                      placeholder="Masukkan alasan..."
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none"
                    />
                  </div>

                  {/* Tanggal */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">
                      Tanggal
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        type="date"
                        value={form.tanggal}
                        onChange={e => setForm(f => ({ ...f, tanggal: e.target.value }))}
                        className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* File */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">
                      File
                    </label>
                    <label className="flex items-center gap-3 w-full px-5 py-3 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-sm font-medium text-slate-500 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all">
                      <Upload className="w-4 h-4 shrink-0" />
                      <span className="truncate">
                        {form.file ? form.file.name : 'Pilih file (Opsional) atau drop'}
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={e => setForm(f => ({ ...f, file: e.target.files?.[0] ?? null }))}
                      />
                    </label>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center gap-3 px-8 pb-8 shrink-0">
                  <button
                    onClick={closeModal}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-sm font-black hover:bg-slate-200 transition-all active:scale-95"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    {submitting ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {detailData && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDetailModal}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-8 border-b border-slate-100 bg-slate-50/50">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Detail Pengajuan</h2>
                    <p className="text-slate-400 text-sm font-medium mt-1">Status: <span className="text-emerald-500 font-bold ml-1">{detailData.status}</span></p>
                  </div>
                  <button onClick={closeDetailModal} className="p-3 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-all active:scale-90">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-8 space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Pegawai Yang Mengajukan</label>
                    <p className="font-bold text-slate-900">{detailData.user ? detailData.user.name : employees.find(e => e.id.toString() === detailData.user_id?.toString())?.name || `ID ${detailData.user_id}`}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Tanggal Resign</label>
                      <p className="font-bold text-slate-900">{new Date(detailData.tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Jenis Keberhentian</label>
                      <p className="font-bold text-slate-900">{detailData.jenis}</p>
                    </div>
                  </div>
                  {detailData.alasan && (
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Alasan</label>
                      <p className="text-sm font-medium text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100">{detailData.alasan}</p>
                    </div>
                  )}
                  {detailData.approved_by_user && (
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Disetujui Oleh</label>
                      <div className="flex items-center gap-3 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                        <div className="w-10 h-10 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                          {detailData.approved_by_user.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-emerald-900 truncate">{detailData.approved_by_user.name}</p>
                          {detailData.tanggal_approval && (
                            <p className="text-xs font-medium text-emerald-700 mt-0.5">
                              Pada {new Date(detailData.tanggal_approval).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {detailData.notes && (
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Catatan Persetujuan</label>
                      <p className="text-sm font-medium text-emerald-700 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">{detailData.notes}</p>
                    </div>
                  )}
                  {detailData.pegawai_keluar_file_name && (
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Lampiran</label>
                      <a
                        href={detailData.pegawai_keluar_file_path?.startsWith('http') ? detailData.pegawai_keluar_file_path : `${import.meta.env.VITE_API_MEANDPAY.replace('/api', '')}${detailData.pegawai_keluar_file_path}`}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-all"
                      >
                        <FileText className="w-4 h-4" />
                        Lihat Dokumen
                      </a>
                    </div>
                  )}
                </div>

                <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                  <button onClick={closeDetailModal} className="px-8 py-3 bg-slate-900 text-white rounded-xl text-sm font-black hover:bg-slate-800 transition-all active:scale-95">Tutup Detail</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modern Confirm Dialog Modal */}
      <AnimatePresence>
        {confirmDialog && confirmDialog.isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDialog(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-8 items-center text-center">
                <div className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center mb-6",
                  confirmDialog.type === 'approve' ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"
                )}>
                  {confirmDialog.type === 'approve' ? <CheckCircle2 className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
                </div>

                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">{confirmDialog.title}</h2>
                <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">{confirmDialog.message}</p>

                <div className="flex w-full gap-3">
                  <button
                    onClick={() => setConfirmDialog(null)}
                    disabled={submitting}
                    className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={executeConfirm}
                    disabled={submitting}
                    className={cn(
                      "flex-1 py-3.5 rounded-xl text-sm font-bold shadow-xl transition-all flex items-center justify-center gap-2 flex-col-reverse sm:flex-row disabled:opacity-50",
                      confirmDialog.confirmColor
                    )}
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {submitting ? 'Proses...' : confirmDialog.confirmText}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ResignationStat({ label, value, icon: Icon, color, bg }: { label: string; value: string; icon: any; color: string; bg: string }) {
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