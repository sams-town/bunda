import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Calendar,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Filter,
  Loader2,
  CheckCircle,
  Check
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from './Toast';
import { AnimatePresence } from 'motion/react';
import { AddLeave } from './AddLeave';
import { EditLeave } from './EditLeave';

interface Leave {
  id: string;
  lokasi_id: string;
  user_id: string;
  nama_cuti: string;
  tanggal: string;
  alasan_cuti: string;
  foto_cuti: string | null;
  status_cuti: string;
  catatan: string | null;
  user_approval: string;
  created_at: string;
  updated_at: string;
  users: {
    id: string;
    name: string;
  } | null;
  pemohon: {
    id: string;
    name: string;
  } | null;
}

interface LeavePageProps {
  initialFilters?: {
    userId?: string;
    startDate?: string;
    endDate?: string;
  };
}

export function LeavePage({ initialFilters }: LeavePageProps = {}) {
  const { addToast } = useToast();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<Leave | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [jabatans, setJabatans] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [filterEmployeeId, setFilterEmployeeId] = useState(initialFilters?.userId || '');
  const [filterStartDate, setFilterStartDate] = useState(initialFilters?.startDate || '');
  const [filterEndDate, setFilterEndDate] = useState(initialFilters?.endDate || '');
  const [displayedLeaves, setDisplayedLeaves] = useState<Leave[]>([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    fetchData(user);
  }, []);

  const fetchData = async (userParam?: any) => {
    try {
      setLoading(true);
      setError(null);

      const activeUser = userParam || currentUser || JSON.parse(localStorage.getItem('user') || '{}');
      const isMaster = activeUser?.id?.toString() === '1' || Number(activeUser?.id) === 1 || activeUser?.is_admin === 'superadmin' || activeUser?.is_admin === 'admin' || activeUser?.role === 'superadmin' || activeUser?.role === 'admin';

      const [empRes, cutisRes, jabRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_MEANDPAY}/users`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`${import.meta.env.VITE_API_MEANDPAY}/cutis`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`${import.meta.env.VITE_API_MEANDPAY}/jabatans`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const empJson = await empRes.json();
      const cutisJson = await cutisRes.json();
      const jabJson = await jabRes.json();

      let managedDivisions: string[] = [];
      if (jabJson.success) {
        setJabatans(jabJson.data);
        managedDivisions = jabJson.data
          .filter((j: any) => j.manager?.toString() === activeUser?.id?.toString())
          .map((j: any) => j.id.toString());
      }

      let validEmployees: any[] = [];
      if (empJson.success) {
        let emps = empJson.data;
        // Filter based on divisions managed by this user, unless master
        if (!isMaster) {
          emps = emps.filter((e: any) => managedDivisions.includes(e.jabatan_id?.toString()) || managedDivisions.includes(e.jabatan?.id?.toString()));
        }
        setEmployees(emps);
        validEmployees = emps;
      }

      if (cutisJson.success) {
        let result = cutisJson.data;

        if (!isMaster) {
          result = result.filter((item: any) => {
            return validEmployees.some((emp: any) => emp.id?.toString() === item.user_id?.toString());
          });
        }

        setLeaves(result);

        let filteredDisplay = [...result];
        if (filterEmployeeId) filteredDisplay = filteredDisplay.filter((item: any) => item.user_id?.toString() === filterEmployeeId);
        if (filterStartDate) {
          filteredDisplay = filteredDisplay.filter((item: any) => {
            const startStr = item.tanggal?.split(' - ')[0];
            return startStr ? new Date(startStr) >= new Date(filterStartDate) : false;
          });
        }
        if (filterEndDate) {
          filteredDisplay = filteredDisplay.filter((item: any) => {
            const parts = item.tanggal?.split(' - ') || [];
            const endStr = parts[parts.length - 1];
            return endStr ? new Date(endStr) <= new Date(filterEndDate) : false;
          });
        }

        setDisplayedLeaves(filteredDisplay);
      } else {
        setError(cutisJson.message || 'Gagal mengambil data cuti');
      }
    } catch (err) {
      setError('Terdapat masalah saat menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  const getManagerForUser = (userId: string) => {
    const employee = employees.find(e => e.id?.toString() === userId?.toString());
    if (!employee || !employee.jabatan_id) return null;
    const jabatan = jabatans.find(j => j.id?.toString() === employee.jabatan_id?.toString());
    return jabatan?.manager;
  };

  const canApprove = (leave: Leave) => {
    if (!currentUser) return false;
    
    const isCurrentUserAdmin = currentUser.is_admin === 'admin' || currentUser.is_admin === 'superadmin' || currentUser.id?.toString() === '1' || currentUser.role === 'admin' || currentUser.role === 'superadmin';
    const managerId = getManagerForUser(leave.user_id);
    const isCurrentUserManager = managerId?.toString() === currentUser.id?.toString();
    const status = leave.status_cuti?.toLowerCase();

    if (isCurrentUserManager) {
      // Manager can approve only if it is Pending / Menunggu
      return status === 'pending' || status === 'menunggu';
    }

    if (isCurrentUserAdmin) {
      // Admin can approve if it is Pending / Menunggu or Disetujui Manager
      return status === 'pending' || status === 'menunggu' || status === 'disetujui manager';
    }

    return false;
  };

  const executeApprove = async () => {
    if (!approvingId) return;
    try {
      setIsApproving(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const approverId = user.id ? String(user.id) : '1';

      const fd = new FormData();
      fd.append('user_approval', String(approverId));

      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/cutis/${approvingId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: fd
      });
      const json = await res.json();
      if (json.success) {
        addToast({ type: 'success', message: 'Cuti berhasil disetujui!' });
        setApprovingId(null);
        fetchData();
      } else {
        addToast({ type: 'error', message: json.message || 'Gagal menyetujui cuti' });
      }
    } catch (err) {
      addToast({ type: 'error', message: 'Terdapat masalah pada server' });
    } finally {
      setIsApproving(false);
    }
  };

  const executeDelete = async () => {
    if (!deletingId) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/cutis/${deletingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();
      if (json.success) {
        addToast({ type: 'success', message: 'Data cuti berhasil dihapus' });
        setDeletingId(null);
        fetchData();
      } else {
        addToast({ type: 'error', message: json.message || 'Gagal menghapus data cuti' });
      }
    } catch (err) {
      addToast({ type: 'error', message: 'Terdapat masalah pada server' });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isAdding) {
    return <AddLeave onBack={() => { setIsAdding(false); fetchData(); }} />;
  }

  if (isEditing) {
    return <EditLeave leave={isEditing} onBack={() => { setIsEditing(null); fetchData(); }} />;
  }

  const handleSearch = () => {
    let result = [...leaves];
    if (filterEmployeeId) {
      result = result.filter(item => item.user_id === filterEmployeeId);
    }
    if (filterStartDate) {
      result = result.filter(item => {
        const startStr = item.tanggal?.split(' - ')[0];
        return startStr ? new Date(startStr) >= new Date(filterStartDate) : false;
      });
    }
    if (filterEndDate) {
      result = result.filter(item => {
        const parts = item.tanggal?.split(' - ') || [];
        const endStr = parts[parts.length - 1];
        return endStr ? new Date(endStr) <= new Date(filterEndDate) : false;
      });
    }
    setDisplayedLeaves(result);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-8 pb-20"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Data Cuti Karyawan</h1>
          <p className="text-slate-500 font-medium">Review and manage employee leave requests and medical certificates.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black transition-all shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Tambah
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/30 overflow-hidden">
        <div className="p-8 border-b border-slate-100 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Pilih Pegawai</label>
              <select
                value={filterEmployeeId}
                onChange={(e) => setFilterEmployeeId(e.target.value)}
                className="w-full px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer appearance-none">
                <option value="">Semua Pegawai</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Tanggal Mulai</label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="w-full px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
            </div>
            <div className="md:col-span-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Tanggal Akhir</label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="w-full px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-2xl text-sm font-black transition-all hover:bg-slate-800 active:scale-95">
                <Search className="w-4 h-4" />
                Cari Data
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-sm font-bold text-slate-400">Memuat data cuti...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-rose-500" />
              </div>
              <p className="text-sm font-bold text-slate-600">{error}</p>
              <button
                onClick={fetchData}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all active:scale-95"
              >
                Coba Lagi
              </button>
            </div>
          ) : displayedLeaves.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center shadow-inner">
                <Calendar className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-sm font-bold text-slate-400">Belum ada data cuti.</p>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">No.</th>
                  <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">Nama Pegawai</th>
                  <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">Lokasi ID</th>
                  <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">Jenis</th>
                  <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">Tanggal</th>
                  <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">Alasan</th>
                  <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center border-b border-slate-100">Foto</th>
                  <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">Status</th>
                  <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right border-b border-slate-100">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {displayedLeaves.map((item, index) => (
                  <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-6 px-8 text-sm font-black text-slate-300 group-hover:text-slate-900 transition-colors">{(index + 1).toString().padStart(2, '0')}</td>
                    <td className="py-6 px-8 text-sm font-black text-slate-900">{item.pemohon?.name || '-'}</td>
                    <td className="py-6 px-8 text-sm font-bold text-slate-600">{item.lokasi_id}</td>
                    <td className="py-6 px-8 text-sm font-bold text-slate-600">{item.nama_cuti}</td>
                    <td className="py-6 px-8 text-sm font-bold text-slate-600">
                      {item.tanggal?.includes('-') ? item.tanggal : new Date(item.tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </td>
                    <td className="py-6 px-8 text-sm font-bold text-slate-600 max-w-[150px] truncate" title={item.alasan_cuti}>{item.alasan_cuti}</td>
                    <td className="py-6 px-8">
                      {item.foto_cuti ? (
                        <div className="w-12 h-16 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 shadow-sm group/img relative mx-auto">
                          <img src={item.foto_cuti} alt="Cuti" className="w-full h-full object-cover transition-transform group-hover/img:scale-110" referrerPolicy="no-referrer" />
                          <a href={item.foto_cuti} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                            <ImageIcon className="w-4 h-4 text-white" />
                          </a>
                        </div>
                      ) : (
                        <div className="text-center text-sm font-bold text-slate-300">-</div>
                      )}
                    </td>
                    <td className="py-6 px-8">
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                        item.status_cuti?.toLowerCase() === 'diterima' || item.status_cuti?.toLowerCase() === 'approved' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                      )}>
                        {item.status_cuti}
                      </span>
                    </td>
                    <td className="py-6 px-8">
                      <div className="flex items-center justify-end gap-2  transition-opacity">
                        {item.status_cuti?.toLowerCase() === 'diterima' || item.status_cuti?.toLowerCase() === 'approved' ? (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100/50">
                            <Check className="w-3.5 h-3.5" />
                            Approved
                          </span>
                        ) : (
                          <>
                            {canApprove(item) && (
                              <button
                                onClick={() => setApprovingId(item.id)}
                                className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all border border-slate-200"
                              >
                                Approve
                              </button>
                            )}
                            <button
                              onClick={() => setIsEditing(item)}
                              className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all border border-slate-200">
                              Edit
                            </button>
                            <button
                              onClick={() => setDeletingId(item.id)}
                              className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all border border-slate-200"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

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
                  <h3 className="text-lg font-bold text-slate-900">Hapus Data Cuti?</h3>
                  <p className="text-sm text-slate-500 mt-1">Data cuti yang dihapus tidak dapat dikembalikan lagi.</p>
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
                  <h3 className="text-lg font-bold text-slate-900">Setujui Cuti?</h3>
                  <p className="text-sm text-slate-500 mt-1">Sisa cuti pegawai akan dikurangi sesuai ketentuan setelah disetujui.</p>
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
      </AnimatePresence>
    </motion.div>
  );
}
