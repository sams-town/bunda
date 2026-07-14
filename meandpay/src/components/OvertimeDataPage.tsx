import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import {
  Search, Download, Edit2, Trash2, Eye, ChevronLeft, ChevronRight,
  MapPin, Clock, CheckCircle2, XCircle, AlertCircle, AlertTriangle,
  ArrowUpDown, Filter, Loader2, Play, FileText
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn, formatPhotoUrl } from '../lib/utils';
import { useToast } from './Toast';

interface Employee {
  id: string;
  name: string;
  foto_karyawan?: string | null;
  username: string;
}

interface Lokasi {
  id: string;
  nama_lokasi: string;
}

interface OvertimeData {
  id: string;
  user_id: string;
  tanggal: string;
  jam_masuk: string | null;
  lat_masuk: string | null;
  long_masuk: string | null;
  jarak_masuk: string | null;
  foto_jam_masuk: string | null;
  jam_keluar: string | null;
  lat_keluar: string | null;
  long_keluar: string | null;
  jarak_keluar: string | null;
  foto_jam_keluar: string | null;
  total_lembur: string | null;
  status: string;
  notes: string | null;
  approved_by: string | null;
  file_lembur: string | null;
  karyawan: Employee | null;
  lokasi: Lokasi | null;
  approver: { name: string } | null;
}

function getInitials(name: string) {
  if (!name) return '??';
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}



function formatDuration(seconds: string | null) {
  if (!seconds) return '0j 0m';
  const totalSeconds = parseInt(seconds);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}j ${m}m`;
}

export function OvertimeDataPage({ initialFilters }: { initialFilters?: { userId?: string; startDate?: string; endDate?: string }; key?: string } = {}) {
  const [data, setData] = useState<OvertimeData[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [jabatans, setJabatans] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { addToast, updateToast } = useToast();

  // Filters
  const [filterEmployeeId, setFilterEmployeeId] = useState(initialFilters?.userId || '');
  const [filterStartDate, setFilterStartDate] = useState(initialFilters?.startDate || '');
  const [filterEndDate, setFilterEndDate] = useState(initialFilters?.endDate || '');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    if (initialFilters) {
      if (initialFilters.userId !== undefined) setFilterEmployeeId(initialFilters.userId || '');
      if (initialFilters.startDate !== undefined) setFilterStartDate(initialFilters.startDate || '');
      if (initialFilters.endDate !== undefined) setFilterEndDate(initialFilters.endDate || '');
    }
  }, [initialFilters]);

  // Modals
  const [mapParams, setMapParams] = useState<{ isOpen: boolean, lat: string, lng: string, title: string }>({ isOpen: false, lat: '', lng: '', title: '' });
  const [deleteData, setDeleteData] = useState<OvertimeData | null>(null);
  const [approveData, setApproveData] = useState<OvertimeData | null>(null);
  const [editData, setEditData] = useState<OvertimeData | null>(null);
  const [photoModal, setPhotoModal] = useState<{ isOpen: boolean, url: string, title: string }>({ isOpen: false, url: '', title: '' });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
  }, []);

  const fetchDropdowns = async () => {
    try {
      const [uRes, jRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_MEANDPAY}/users`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`${import.meta.env.VITE_API_MEANDPAY}/jabatans`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);
      const uJson = await uRes.json();
      const jJson = await jRes.json();
      if (uJson.success) setEmployees(uJson.data);
      if (jJson.success) setJabatans(jJson.data);
    } catch (err) {
      console.error('Error fetching dropdowns:', err);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/lemburs`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();
      if (json.success) {
        let result = json.data;
        const activeUser = currentUser || JSON.parse(localStorage.getItem('user') || '{}');
        const isMaster = activeUser?.id?.toString() === '1' || Number(activeUser?.id) === 1 || activeUser?.is_admin === 'superadmin' || activeUser?.is_admin === 'admin' || activeUser?.role === 'superadmin' || activeUser?.role === 'admin';

        if (!isMaster) {
          const managedDivisions = jabatans
            .filter((j: any) => j.manager?.toString() === activeUser?.id?.toString())
            .map((j: any) => j.id.toString());
          
          result = result.filter((item: any) => {
            const pemohon = employees.find(e => e.id?.toString() === item.user_id?.toString());
            const empDivId = pemohon?.jabatan_id || pemohon?.jabatan?.id;
            return managedDivisions.includes(empDivId?.toString());
          });
        }
        setData(result);
      }
    } catch (err) {
      console.error('Error fetching overtime data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, employees, jabatans]);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const canApprove = (row: OvertimeData) => {
    if (!currentUser) return false;

    const isCurrentUserAdmin = currentUser.is_admin === 'admin' || currentUser.is_admin === 'superadmin' || currentUser.id?.toString() === '1' || currentUser.role === 'admin' || currentUser.role === 'superadmin';
    const pemohon = employees.find(e => e.id?.toString() === row.user_id?.toString());
    const managerId = pemohon && pemohon.jabatan_id 
      ? jabatans.find(j => j.id?.toString() === pemohon.jabatan_id?.toString())?.manager 
      : null;
    const isCurrentUserManager = managerId?.toString() === currentUser.id?.toString();
    const status = row.status?.toLowerCase();

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

  const handleApprove = async (id: string, notes: string) => {
    const toastId = addToast({ type: 'loading', title: 'Approving', message: 'Sedang memproses approval...' });
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const approverId = user.id ? String(user.id) : '1';
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/lemburs/${id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes, approved_by: approverId })
      });
      const json = await res.json();
      if (json.success) {
        updateToast(toastId, { type: 'success', title: 'Berhasil', message: json.message || 'Lembur berhasil di-approve' });
        fetchData();
      } else {
        updateToast(toastId, { type: 'error', title: 'Gagal', message: json.message || 'Gagal memproses approval' });
      }
    } catch (err: any) {
      updateToast(toastId, { type: 'error', title: 'Error', message: err.message || 'Terjadi kesalahan sistem' });
    }
  };

  const handleUpdate = async (id: string, payload: any) => {
    const toastId = addToast({ type: 'loading', title: 'Memperbarui', message: 'Sedang memperbarui data lembur...' });
    try {
      const finalPayload = { ...payload };
      if (payload.status === 'Approved' || payload.status === 'approved') {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        finalPayload.approved_by = user.id ? String(user.id) : '1';
      }

      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/lemburs/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(finalPayload)
      });
      const json = await res.json();
      if (json.success) {
        updateToast(toastId, { type: 'success', title: 'Berhasil', message: json.message || 'Data lembur berhasil diperbarui' });
        fetchData();
        setEditData(null);
      } else {
        updateToast(toastId, { type: 'error', title: 'Gagal', message: json.message || 'Gagal memperbarui data' });
      }
    } catch (err: any) {
      updateToast(toastId, { type: 'error', title: 'Error', message: err.message || 'Terjadi kesalahan sistem' });
    }
  };

  const handleDelete = async () => {
    if (!deleteData) return;
    const item = deleteData;
    setDeleteData(null);

    const toastId = addToast({ type: 'loading', title: 'Menghapus', message: 'Sedang menghapus data lembur...' });
    try {
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/lemburs/${item.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();
      if (json.success) {
        updateToast(toastId, { type: 'success', title: 'Berhasil', message: json.message || 'Data lembur berhasil dihapus' });
        fetchData();
      } else {
        updateToast(toastId, { type: 'error', title: 'Gagal', message: json.message || 'Gagal menghapus data' });
      }
    } catch (err: any) {
      updateToast(toastId, { type: 'error', title: 'Error', message: err.message || 'Terjadi kesalahan sistem' });
    }
  };

  const filteredData = data.filter(item => {
    let valid = true;
    if (filterEmployeeId && item.user_id !== filterEmployeeId) valid = false;
    if (filterStartDate || filterEndDate) {
      const date = new Date(item.tanggal).getTime();
      if (filterStartDate && date < new Date(filterStartDate).getTime()) valid = false;
      if (filterEndDate && date > new Date(filterEndDate).getTime()) valid = false;
    }
    return valid;
  });

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const currentData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleExportExcel = async () => {
    const toastId = addToast({ type: 'loading', title: 'Export Excel', message: 'Sedang menyiapkan data...' });
    try {
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/lemburs?limit=100000`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      const allData: OvertimeData[] = json.data;
      const exportData = allData.map((item, index) => ({
        'No': index + 1,
        'Nama Pegawai': item.karyawan?.name || 'Unknown',
        'Username': item.karyawan?.username || '-',
        'Lokasi': item.lokasi?.nama_lokasi || '-',
        'Tanggal': item.tanggal,
        'Masuk Lembur': item.jam_masuk?.split(' ')[1] || '-',
        'Keluar Lembur': item.jam_keluar?.split(' ')[1] || '-',
        'Durasi': formatDuration(item.total_lembur),
        'Notes': item.notes || '-',
        'Status': item.status,
        'Approver': item.approver?.name || '-'
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data Lembur');

      ws['!cols'] = [
        { wch: 5 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 15 },
        { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 30 }, { wch: 12 }, { wch: 20 }
      ];

      XLSX.writeFile(wb, `Data_Lembur_${new Date().toISOString().split('T')[0]}.xlsx`);
      updateToast(toastId, { type: 'success', title: 'Berhasil', message: 'Data berhasil di-export ke Excel' });
    } catch (err: any) {
      console.error('Export error:', err);
      updateToast(toastId, { type: 'error', title: 'Gagal', message: err.message || 'Gagal mengekspor data' });
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-[1600px] mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Data Lembur</h1>
          <p className="text-sm font-medium text-slate-400 mt-1">Manajemen pengajuan lembur pegawai</p>
        </div>
        <button
          onClick={handleExportExcel}
          className="flex items-center gap-2 px-6 py-3 bg-[#66BB6A] text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-[#4CAF50] transition-all active:scale-95"
        >
          <Download className="w-4 h-4" /> Export Data
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="p-8 border-b border-slate-50 flex flex-wrap items-center gap-6">
          <div className="w-72 relative">
            <select
              value={filterEmployeeId}
              onChange={(e) => setFilterEmployeeId(e.target.value)}
              className="w-full pl-6 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer appearance-none"
            >
              <option value="">Semua Pegawai</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
            <Filter className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="flex items-center gap-4">
            <div className="w-48">
              <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
            </div>
            <span className="text-slate-300 font-black">/</span>
            <div className="w-48">
              <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
            </div>
          </div>
          <button onClick={fetchData} className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all active:scale-95 border border-indigo-100">
            <Search className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b border-slate-100">No.</th>
                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b border-slate-100">Pegawai</th>
                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b border-slate-100">Tanggal</th>
                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b border-slate-100">Masuk Lembur</th>
                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b border-slate-100">Keluar Lembur</th>
                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b border-slate-100">Durasi</th>
                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b border-slate-100">Notes</th>
                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b border-slate-100">Status</th>
                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b border-slate-100 whitespace-nowrap">Approver</th>
                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right border-b border-slate-100 whitespace-nowrap pr-10">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={11} className="py-32 text-center"><Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto" /></td></tr>
              ) : currentData.length === 0 ? (
                <tr><td colSpan={11} className="py-32 text-center text-slate-400 font-bold">Tidak ada data lembur ditemukan.</td></tr>
              ) : currentData.map((item, idx) => (
                <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="py-5 px-6 text-sm font-bold text-slate-400">{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}.</td>
                  <td className="py-5 px-6">
                    <div className="flex items-center gap-3">
                      {item.karyawan?.foto_karyawan ? (
                        <img src={formatPhotoUrl(item.karyawan.foto_karyawan)} className="w-9 h-9 rounded-full object-cover border border-slate-200" alt="" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-black">
                          {getInitials(item.karyawan?.name || '??')}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-black text-slate-800 leading-none mb-1">{item.karyawan?.name || 'Unknown'}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.lokasi?.nama_lokasi || '-'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-xs font-bold text-slate-600">{new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td className="py-5 px-6">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs font-black text-slate-700">{item.jam_masuk?.split(' ')[1] || '-'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => item.lat_masuk && item.long_masuk && setMapParams({ isOpen: true, lat: item.lat_masuk, lng: item.long_masuk, title: `Lembur Masuk - ${item.karyawan?.name}` })}
                          className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors flex items-center gap-1"
                        >
                          <MapPin className="w-2.5 h-2.5" /> Maps
                        </button>
                        <span className="text-slate-200">•</span>
                        {item.foto_jam_masuk && (
                          <button
                            onClick={() => setPhotoModal({ isOpen: true, url: formatPhotoUrl(item.foto_jam_masuk), title: `Foto Masuk - ${item.karyawan?.name}` })}
                            className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                          >
                            Foto
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-rose-500" />
                        <span className="text-xs font-black text-slate-700">{item.jam_keluar?.split(' ')[1] || '-'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => item.lat_keluar && item.long_keluar && setMapParams({ isOpen: true, lat: item.lat_keluar, lng: item.long_keluar, title: `Lembur Keluar - ${item.karyawan?.name}` })}
                          className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors flex items-center gap-1"
                        >
                          <MapPin className="w-2.5 h-2.5" /> Maps
                        </button>
                        <span className="text-slate-200">•</span>
                        {item.foto_jam_keluar && (
                          <button
                            onClick={() => setPhotoModal({ isOpen: true, url: formatPhotoUrl(item.foto_jam_keluar), title: `Foto Keluar - ${item.karyawan?.name}` })}
                            className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                          >
                            Foto
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                      {formatDuration(item.total_lembur)}
                    </span>
                  </td>
                  <td className="py-5 px-6">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-slate-500 italic max-w-[200px] truncate">{item.notes ? `"${item.notes}"` : '-'}</p>
                      {item.file_lembur && (
                        <a
                          href={formatPhotoUrl(item.file_lembur)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-wider"
                        >
                          <FileText className="w-3 h-3" /> Berkas
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <StatusBadge value={item.status} />
                  </td>
                  <td className="py-5 px-6 text-xs font-bold text-slate-500">
                    {item.approver?.name || '-'}
                  </td>
                  <td className="py-5 px-6 pr-10">
                    <div className="flex items-center justify-end gap-1  transition-all translate-x-2 group-hover:translate-x-0">
                      {canApprove(item) && (
                        <button
                          onClick={() => setApproveData(item)}
                          className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all border border-transparent hover:border-emerald-100"
                          title="Approve"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setEditData(item)}
                        className="p-2 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all border border-transparent hover:border-amber-100"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteData(item)} className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100" title="Hapus">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400">
              Menampilkan <span className="text-indigo-600">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> - <span className="text-indigo-600">{Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)}</span> dari <span className="text-indigo-600">{filteredData.length}</span> pengajuan
            </p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft className="w-4 h-4" /></button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                <button key={pg} onClick={() => setCurrentPage(pg)} className={cn("w-9 h-9 rounded-xl text-xs font-black transition-all", currentPage === pg ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "text-slate-500 hover:bg-slate-100 border border-transparent hover:border-slate-200")}>{pg}</button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {mapParams.isOpen && (
          <MapModal {...mapParams} onClose={() => setMapParams({ ...mapParams, isOpen: false })} />
        )}
        {photoModal.isOpen && (
          <PhotoModal {...photoModal} onClose={() => setPhotoModal({ ...photoModal, isOpen: false })} />
        )}
        {deleteData && (
          <DeleteConfirmModal data={deleteData} onConfirm={handleDelete} onCancel={() => setDeleteData(null)} />
        )}
        {approveData && (
          <ApprovalModal
            data={approveData}
            onConfirm={(notes) => {
              handleApprove(approveData.id, notes);
              setApproveData(null);
            }}
            onCancel={() => setApproveData(null)}
          />
        )}
        {editData && (
          <EditOvertimeModal
            data={editData}
            onConfirm={(payload) => handleUpdate(editData.id, payload)}
            onCancel={() => setEditData(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatusBadge({ value }: { value: string }) {
  const isApproved = value === 'Approved' || value === 'approved';
  const isPending = value === 'Pending' || value === 'pending' || value?.toLowerCase() === 'disetujui manager';
  const isRejected = value === 'Rejected' || value === 'rejected';

  return (
    <span className={cn(
      "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all inline-block whitespace-nowrap",
      isApproved ? "bg-emerald-50/50 border-emerald-200 text-emerald-600" :
        isPending ? "bg-amber-50/50 border-amber-200 text-amber-600" :
          isRejected ? "bg-rose-50/50 border-rose-200 text-rose-600" :
            "bg-slate-50 border-slate-200 text-slate-500"
    )}>
      {value}
    </span>
  );
}

function MapModal({ lat, lng, title, onClose }: { lat: string, lng: string, title: string, onClose: () => void }) {
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  if (isNaN(latNum) || isNaN(lngNum)) return null;

  const icon = L.divIcon({
    className: '',
    html: `<div style="width:36px;height:36px;background:#ef4444;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 10px 15px -3px rgba(239,68,68,0.4)"><div style="width:10px;height:10px;background:white;border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(45deg)"></div></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/20">
        <div className="flex items-center justify-between p-8 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{lat}, {lng}</p>
          </div>
          <button onClick={onClose} className="px-6 py-2.5 bg-rose-500 text-white rounded-xl text-xs font-black tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-200 active:scale-95">Tutup Maps</button>
        </div>
        <div className="p-8">
          <div className="h-[60vh] rounded-[2rem] overflow-hidden border border-slate-100 bg-slate-50 shadow-inner">
            <MapContainer center={[latNum, lngNum]} zoom={16} zoomControl={false} style={{ height: '100%', width: '100%' }}>
              <TileLayer attribution='&copy; CARTO' url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
              <Marker position={[latNum, lngNum]} icon={icon} />
              <Circle center={[latNum, lngNum]} radius={50} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.1, weight: 1, dashArray: '5,5' }} />
            </MapContainer>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function DeleteConfirmModal({ data, onConfirm, onCancel }: { data: OvertimeData, onConfirm: () => void, onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }} className="relative bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] w-full max-w-sm overflow-hidden p-10 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-[2rem] bg-rose-50 flex items-center justify-center mb-8 shadow-inner group">
          <AlertTriangle className="w-10 h-10 text-rose-500 group-hover:scale-110 transition-transform duration-500" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Hapus Lembur?</h3>
        <p className="text-sm text-slate-500 mb-10 font-medium leading-relaxed">Pengajuan lembur untuk <span className="font-bold text-slate-800">{data.karyawan?.name}</span> akan dihapus permanen.</p>
        <div className="flex flex-col gap-3 w-full">
          <button onClick={onConfirm} className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-200 transition-all active:scale-95">Hapus Pengajuan</button>
          <button onClick={onCancel} className="w-full py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95">Batalkan</button>
        </div>
      </motion.div>
    </div>
  );
}

function ApprovalModal({ data, onConfirm, onCancel }: { data: OvertimeData, onConfirm: (notes: string) => void, onCancel: () => void }) {
  const [notes, setNotes] = useState(data.notes || '');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }} className="relative bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] w-full max-w-md overflow-hidden p-10 flex flex-col border border-slate-100">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Approval Lembur</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Konfirmasi Pengajuan</p>
          </div>
        </div>

        <div className="space-y-6 mb-10">
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Karyawan</p>
            <p className="text-sm font-black text-slate-700">{data.karyawan?.name}</p>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-200/60">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tanggal</p>
                <p className="text-xs font-black text-slate-600">{data.tanggal}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Durasi</p>
                <p className="text-xs font-black text-slate-600">{formatDuration(data.total_lembur)}</p>
              </div>
              {data.file_lembur && (
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Berkas</p>
                  <a
                    href={formatPhotoUrl(data.file_lembur)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-black text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-wider"
                  >
                    <FileText className="w-3.5 h-3.5" /> Lihat
                  </a>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 block">Catatan Approval</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tulis catatan (misal: Lanjutkan kerjanya!)..."
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all min-h-[120px] resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95">Batal</button>
          <button onClick={() => onConfirm(notes)} className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200 transition-all active:scale-95">Setujui Lembur</button>
        </div>
      </motion.div>
    </div>
  );
}

function EditOvertimeModal({ data, onConfirm, onCancel }: { data: OvertimeData, onConfirm: (payload: any) => void, onCancel: () => void }) {
  const [formData, setFormData] = useState({
    tanggal: data.tanggal || '',
    notes: data.notes || '',
    status: data.status || 'Pending'
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }} className="relative bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] w-full max-w-md overflow-hidden p-10 flex flex-col border border-slate-100">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center">
            <Edit2 className="w-8 h-8 text-amber-500" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Edit Data Lembur</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Ubah Informasi Pengajuan</p>
          </div>
        </div>

        <div className="space-y-6 mb-10">
          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 block">Tanggal</label>
            <input
              type="date"
              value={formData.tanggal}
              onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all"
            />
          </div>

          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 block">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all appearance-none cursor-pointer"
            >
              <option value="Pending">Pending</option>
              <option value="Disetujui Manager">Disetujui Manager</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 block">Catatan/Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Tulis alasan atau catatan tambahan..."
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all min-h-[100px] resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95">Batal</button>
          <button onClick={() => onConfirm(formData)} className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all active:scale-95">Simpan Perubahan</button>
        </div>
      </motion.div>
    </div>
  );
}

function PhotoModal({ url, title, onClose }: { url: string, title: string, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }} className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col border border-white/20">
        <div className="flex items-center justify-between p-8 border-b border-slate-100 bg-white">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Bukti Foto Lembur</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-rose-500 transition-all active:scale-90">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <div className="p-8 bg-slate-50">
          <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-white shadow-inner border border-slate-100 flex items-center justify-center">
            {url ? (
              <img src={url} className="w-full h-full object-contain" alt="Bukti Lembur" />
            ) : (
              <div className="text-center space-y-2">
                <AlertCircle className="w-10 h-10 text-slate-200 mx-auto" />
                <p className="text-xs font-bold text-slate-400">Foto tidak tersedia</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

