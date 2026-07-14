import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import * as XLSX from 'xlsx';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Download, Edit2, Trash2, Eye, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { cn, formatPhotoUrl } from '../lib/utils';
import { useToast } from './Toast';
import { FormSearchSelect } from './common/FormUI';
import Swal from 'sweetalert2';

interface AbsensiData {
  id: string;
  user_id: string;
  shift_id: string;
  tanggal: string;
  jam_absen: string | null;
  telat: string;
  jarak_masuk: string | null;
  foto_jam_absen: string | null;
  keterangan_masuk: string | null;
  jam_pulang: string | null;
  pulang_cepat: string;
  jarak_pulang: string | null;
  foto_jam_pulang: string | null;
  keterangan_pulang: string | null;
  status_absen: string;
  users: {
    name?: string | null;
    foto_karyawan?: string | null;
    foto_face_recognition?: string | null;
  } | null;
  shifts?: {
    nama_shift: string;
    jam_masuk: string;
    jam_keluar: string;
  } | null;
  lat_absen: string | null;
  long_absen: string | null;
  lat_pulang: string | null;
  long_pulang: string | null;
}

interface Employee {
  id: string;
  name: string;
}

function getInitials(name: string) {
  if (!name) return '??';
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}



export function DataAbsenPage({ initialFilters }: { initialFilters?: { userId?: string; startDate?: string; endDate?: string }; key?: string } = {}) {
  const [dataAbsensi, setDataAbsensi] = React.useState<AbsensiData[]>([]);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Filters
  const [filterEmployeeId, setFilterEmployeeId] = React.useState(initialFilters?.userId || '');
  const [filterStartDate, setFilterStartDate] = React.useState(initialFilters?.startDate || '');
  const [filterEndDate, setFilterEndDate] = React.useState(initialFilters?.endDate || '');

  React.useEffect(() => {
    if (initialFilters) {
      if (initialFilters.userId !== undefined) setFilterEmployeeId(initialFilters.userId || '');
      if (initialFilters.startDate !== undefined) setFilterStartDate(initialFilters.startDate || '');
      if (initialFilters.endDate !== undefined) setFilterEndDate(initialFilters.endDate || '');
    }
  }, [initialFilters]);

  // Map Modal
  const [mapParams, setMapParams] = React.useState<{ isOpen: boolean, lat: string, lng: string, title: string }>({ isOpen: false, lat: '', lng: '', title: '' });

  // Edit Modal
  const [editModal, setEditModal] = React.useState<{ isOpen: boolean, data: AbsensiData | null, type: 'masuk' | 'pulang' }>({ isOpen: false, data: null, type: 'masuk' });

  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const ITEMS_PER_PAGE = 10;
  const { addToast, updateToast } = useToast();



  const selectedEmployeeName = employees.find(e => e.id === filterEmployeeId)?.name || 'Semua Pegawai';

  React.useEffect(() => {
    fetchEmployees();
  }, []);

  React.useEffect(() => {
    fetchDataAbsensi();
    setCurrentPage(1);
  }, [filterEmployeeId, filterStartDate, filterEndDate]);

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/users?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const json = await res.json();
      if (json.success) {
        setEmployees(Array.isArray(json.data) ? json.data : []);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const fetchDataAbsensi = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filterEmployeeId) queryParams.append('user_id', filterEmployeeId);
      if (filterStartDate) queryParams.append('start_date', filterStartDate);
      if (filterEndDate) queryParams.append('end_date', filterEndDate);
      queryParams.append('limit', '1000');
      
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/absensi?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const json = await res.json();
      if (json.success) {
        setDataAbsensi(Array.isArray(json.data) ? json.data : []);
      }
    } catch (err) {
      console.error('Error fetching data absensi:', err);
      addToast({ type: 'error', title: 'Error', message: 'Gagal mengambil data dari server' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilterEmployeeId('');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const handleDelete = async (id: string) => {
    try {
      const result = await Swal.fire({
        title: 'Apakah Anda yakin?',
        text: "Data absen ini akan dihapus permanen!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#4F46E5',
        cancelButtonColor: '#EF4444',
        confirmButtonText: 'Ya, hapus!',
        cancelButtonText: 'Batal'
      });

      if (result.isConfirmed) {
        const toastId = addToast({ type: 'loading', title: 'Menghapus', message: 'Sedang menghapus data absen...' });
        const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/absensi/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const json = await res.json();
        if (res.ok && json.success) {
          updateToast(toastId, { type: 'success', title: 'Berhasil', message: 'Data absen berhasil dihapus' });
          fetchDataAbsensi();
        } else {
          updateToast(toastId, { type: 'error', title: 'Gagal', message: json.message || 'Gagal menghapus data absen' });
        }
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      addToast({ type: 'error', title: 'Error', message: err.message || 'Gagal menghapus data absen' });
    }
  };

  const filteredData = Array.isArray(dataAbsensi) ? dataAbsensi.filter(item => {
    let isValid = true;
    if (filterEmployeeId && item.user_id !== filterEmployeeId) isValid = false;

    // Simplistic date filtering
    if (filterStartDate || filterEndDate) {
      const itemDate = new Date(item.tanggal).getTime();
      if (filterStartDate && itemDate < new Date(filterStartDate).getTime()) isValid = false;
      if (filterEndDate && itemDate > new Date(filterEndDate).getTime()) isValid = false;
    }
    return isValid;
  }) : [];

  const handleExportExcel = async () => {
    const toastId = addToast({ type: 'loading', title: 'Export Excel', message: 'Sedang menyiapkan data...' });
    try {
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/absensi?limit=100000`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      const allData: AbsensiData[] = json.data;
      const exportData = allData.map((item, index) => ({
        'No': index + 1,
        'Nama Pegawai': item.users?.name || `User ID ${item.user_id}`,
        'Shift': item.shifts ? `${item.shifts.nama_shift} (${item.shifts.jam_masuk} - ${item.shifts.jam_keluar})` : '-',
        'Tanggal': item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : '-',
        'Jam Masuk': item.jam_absen || '-',
        'Telat (Menit)': item.telat || '0',
        'Jam Pulang': item.jam_pulang || '-',
        'Pulang Cepat (Detik)': item.pulang_cepat || '0',
        'Status Absen': item.status_absen || '-'
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data Absen');

      ws['!cols'] = [
        { wch: 5 },  // No
        { wch: 25 }, // Nama
        { wch: 25 }, // Shift
        { wch: 15 }, // Tanggal
        { wch: 12 }, // Jam Masuk
        { wch: 15 }, // Telat
        { wch: 12 }, // Jam Pulang
        { wch: 20 }, // Pulang Cepat
        { wch: 20 }, // Status
      ];

      XLSX.writeFile(wb, `Data_Absen_${new Date().toISOString().split('T')[0]}.xlsx`);
      updateToast(toastId, { type: 'success', title: 'Berhasil', message: 'Data berhasil di-export ke Excel' });
    } catch (err: any) {
      console.error('Export error:', err);
      updateToast(toastId, { type: 'error', title: 'Gagal', message: err.message || 'Gagal mengekspor data' });
    }
  };

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const currentData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1600px] mx-auto space-y-8 pb-20"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Data Absen</h1>
        <button
          onClick={handleExportExcel}
          className="flex items-center gap-2 px-6 py-3 bg-[#66BB6A] text-white rounded-xl font-bold shadow-lg hover:bg-[#4CAF50] transition-all active:scale-95"
        >
          Export
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 flex flex-wrap items-end gap-6 bg-slate-50/50">
          <div className="w-80">
            <FormSearchSelect
              label="Filter Pegawai"
              placeholder="Semua Pegawai"
              options={(employees || []).map(emp => ({ label: emp.name, value: emp.id }))}
              value={filterEmployeeId}
              onChange={(_: any, val: string) => setFilterEmployeeId(val)}
              icon={Search}
            />
          </div>
          <div className="w-64">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Mulai Dari</label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-full px-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm shadow-indigo-500/5"
              placeholder="Tanggal Mulai" />
          </div>
          <div className="w-64">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Sampai Dengan</label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-full px-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm shadow-indigo-500/5"
              placeholder="Tanggal Akhir" />
          </div>
          <div className="flex-1 min-w-fit">
            <button
              onClick={handleResetFilters}
              className="px-8 py-3.5 bg-indigo-50 text-indigo-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all active:scale-95 border border-indigo-100/50 shadow-sm shadow-indigo-500/5"
            >
              Tampilkan Semua
            </button>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="py-3.5 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-10 text-left">#</th>
                <th className="py-3.5 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-left">Pegawai</th>
                <th className="py-3.5 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-left">Shift</th>
                <th className="py-3.5 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-left">Tanggal</th>
                <th className="py-3.5 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-left text-emerald-600">Jam Masuk</th>
                <th className="py-3.5 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-left text-emerald-600">Foto Masuk</th>
                <th className="py-3.5 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-left">Telat</th>
                <th className="py-3.5 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-left text-rose-600">Jam Pulang</th>
                <th className="py-3.5 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-left text-rose-600">Foto Pulang</th>
                <th className="py-3.5 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-left">Pulang Cepat</th>
                <th className="py-3.5 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-left">Status</th>
                <th className="py-3.5 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={12} className="py-20 text-center">
                    <div className="flex justify-center items-center">
                      <div className="w-8 h-8 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-20 text-center font-bold text-slate-400">
                    Tidak ada data absen.
                  </td>
                </tr>
              ) : currentData.map((item, idx) => {
                const index = (currentPage - 1) * ITEMS_PER_PAGE + idx;
                return (
                  <tr key={item.id} className="group hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 text-xs font-semibold text-slate-300 group-hover:text-slate-500 transition-colors">
                      {String(index + 1).padStart(2, '0')}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3 min-w-[180px]">
                        <div className="size-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center overflow-hidden shadow-sm">
                          {item.users?.foto_karyawan || item.users?.foto_face_recognition ? (
                            <img src={formatPhotoUrl(item.users.foto_karyawan || item.users.foto_face_recognition)} className="size-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-bold text-indigo-400">{getInitials(item.users?.name || '')}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 leading-tight">{item.users?.name || '-'}</p>
                          <p className="text-[11px] text-slate-400">ID: {item.user_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-xs font-semibold text-slate-600 truncate max-w-[120px]">{item.shifts?.nama_shift || '-'}</div>
                      <div className="text-[10px] text-slate-400 tracking-tighter">{item.shifts ? `${item.shifts.jam_masuk} - ${item.shifts.jam_keluar}` : ''}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-xs font-semibold text-slate-600">{item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">{item.tanggal ? new Date(item.tanggal).getFullYear() : ''}</div>
                    </td>
                    <td className="py-4 px-6 text-sm font-black text-emerald-600">{item.jam_absen || '-'}</td>
                    <td className="py-4 px-6">
                      {item.foto_jam_absen ? (
                        <div className="relative group/photo size-10 rounded-xl overflow-hidden border border-slate-100 shadow-sm cursor-pointer active:scale-95 transition-all">
                          <img 
                            src={formatPhotoUrl(item.foto_jam_absen)} 
                            className="size-full object-cover group-hover/photo:scale-110 transition-transform duration-300"
                            onClick={() => Swal.fire({
                              imageUrl: formatPhotoUrl(item.foto_jam_absen),
                              imageAlt: 'Foto Jam Masuk',
                              showConfirmButton: false,
                              background: '#ffffff',
                              customClass: {
                                popup: 'rounded-3xl border border-slate-100 shadow-2xl overflow-hidden p-0',
                                image: 'm-0 object-cover max-h-[80vh] w-full'
                              }
                            })} 
                          />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <Eye className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded", Number(item.telat) > 0 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600")}>
                        {item.telat || '0'}m
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm font-black text-rose-600">{item.jam_pulang || '-'}</td>
                    <td className="py-4 px-6">
                      {item.foto_jam_pulang ? (
                        <div className="relative group/photo size-10 rounded-xl overflow-hidden border border-slate-100 shadow-sm cursor-pointer active:scale-95 transition-all">
                          <img 
                            src={formatPhotoUrl(item.foto_jam_pulang)} 
                            className="size-full object-cover group-hover/photo:scale-110 transition-transform duration-300"
                            onClick={() => Swal.fire({
                              imageUrl: formatPhotoUrl(item.foto_jam_pulang),
                              imageAlt: 'Foto Jam Pulang',
                              showConfirmButton: false,
                              background: '#ffffff',
                              customClass: {
                                popup: 'rounded-3xl border border-slate-100 shadow-2xl overflow-hidden p-0',
                                image: 'm-0 object-cover max-h-[80vh] w-full'
                              }
                            })} 
                          />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <Eye className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded", Number(item.pulang_cepat) > 0 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600")}>
                        {Math.floor(Number(item.pulang_cepat) / 60)}m
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={cn("inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border", 
                        item.status_absen === 'Hadir' ? "bg-emerald-50 border-emerald-100 text-emerald-600" : 
                        (item.status_absen === 'Mangkir' ? "bg-rose-50 border-rose-100 text-rose-600" : "bg-amber-50 border-amber-100 text-amber-600")
                      )}>
                        {item.status_absen || '-'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setEditModal({ isOpen: true, data: item, type: 'masuk' })} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"><Edit2 size={14}/></button>
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-8 py-4 border-t border-slate-100 bg-slate-50/50">
            <p className="text-sm font-bold text-slate-500">
              Menampilkan <span className="text-indigo-600">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> hingga <span className="text-indigo-600">{Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)}</span> dari <span className="text-indigo-600">{filteredData.length}</span> data
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Basic pagination display logic
                  if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          "w-10 h-10 rounded-xl text-sm font-bold transition-all",
                          currentPage === page
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                            : "text-slate-500 hover:bg-slate-200"
                        )}
                      >
                        {page}
                      </button>
                    );
                  }
                  if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="text-slate-400">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {mapParams.isOpen && (
          <MapModal
            lat={mapParams.lat}
            lng={mapParams.lng}
            title={mapParams.title}
            onClose={() => setMapParams({ ...mapParams, isOpen: false })}
          />
        )}
        {editModal.isOpen && editModal.data && (
          <EditAbsenModal
            isOpen={editModal.isOpen}
            data={editModal.data}
            type={editModal.type}
            onClose={() => setEditModal({ ...editModal, isOpen: false })}
            onRefresh={fetchDataAbsensi}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MapModal({ lat, lng, title, onClose }: { lat: string, lng: string, title: string, onClose: () => void }) {
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);

  if (isNaN(latNum) || isNaN(lngNum)) return null;

  const icon = L.divIcon({
    className: '',
    html: `<div style="width:36px;height:36px;background:#ef4444;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 4px 14px rgba(239,68,68,0.4)"><div style="width:10px;height:10px;background:white;border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(45deg)"></div></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-5 px-8 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Maps</h3>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#f43f5e] text-white rounded-xl text-xs font-black tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 active:scale-95"
          >
            Back
          </button>
        </div>

        <div className="p-8 pb-4">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight mb-6">
            {lat}, {lng}
          </h2>
          <div className="relative w-full h-[60vh] rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 shadow-inner">
            <MapContainer
              center={[latNum, lngNum]}
              zoom={16}
              zoomControl={false}
              style={{ height: '100%', width: '100%', zIndex: 0 }}
            >
              <TileLayer
                attribution='&copy; CARTO'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                maxZoom={19}
              />
              <Marker position={[latNum, lngNum]} icon={icon}>
                <Popup><b>{title}</b></Popup>
              </Marker>
              <Circle
                center={[latNum, lngNum]}
                radius={30}
                pathOptions={{
                  color: '#ef4444',
                  fillColor: '#ef4444',
                  fillOpacity: 0.2,
                  weight: 2,
                  dashArray: '5,5'
                }}
              />
            </MapContainer>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  const isRed = value === 'Belum Absen' || value === 'Belum Pulang' || value === 'Belum Masuk' || value === 'Sakit' || value === 'Tidak Masuk';
  const isGreen = value === 'Tepat Waktu' || value === 'Tidak Pulang Cepat' || value === 'Masuk';
  const isBlue = value === 'Libur';
  const isYellow = value === 'Izin' || value === 'Cuti';

  return (
    <span className={cn(
      "px-3 py-1 rounded-[8px] text-[10px] font-bold uppercase tracking-widest border transition-all inline-block whitespace-nowrap",
      isRed ? "bg-rose-50/50 border-rose-200 text-rose-600" :
        isGreen ? "bg-emerald-50/50 border-emerald-200 text-emerald-600" :
          isBlue ? "bg-indigo-50/50 border-indigo-200 text-indigo-600" :
            isYellow ? "bg-amber-50/50 border-amber-200 text-amber-600" :
              "bg-slate-50 border-slate-200 text-slate-500"
    )}>
      {value}
    </span>
  );
}

function EditAbsenModal({
  isOpen, data, type, onClose, onRefresh
}: {
  isOpen: boolean, data: AbsensiData, type: 'masuk' | 'pulang', onClose: () => void, onRefresh: () => void
}) {
  const [jam, setJam] = React.useState('');
  const [file, setFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (data) {
      if (type === 'masuk') {
        const timeVal = data.jam_absen && data.jam_absen.length === 5 ? data.jam_absen :
          (data.jam_absen ? data.jam_absen.substring(0, 5) : '');
        setJam(timeVal);
      } else {
        const timeVal = data.jam_pulang && data.jam_pulang.length === 5 ? data.jam_pulang :
          (data.jam_pulang ? data.jam_pulang.substring(0, 5) : '');
        setJam(timeVal);
      }
      setFile(null);
    }
  }, [data, type]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('_method', 'PUT');

    if (type === 'masuk') {
      if (jam) formData.append('jam_absen', jam);
      if (file) formData.append('foto_jam_absen', file);
    } else {
      if (jam) formData.append('jam_pulang', jam);
      if (file) formData.append('foto_jam_pulang', file);
    }

    // Console log the form data entries for debugging
    console.log(`[Frontend] Preparing to send ${type} data for ID: ${data.id}`);
    for (const [key, value] of formData.entries()) {
      console.log(`  - ${key}:`, value);
    }

    try {
      // First try the standard PUT to `/api/absensi/{id}`
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/absensi/${data.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      // Check if it's HTML response (404 Not Found error page)
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const json = await res.json();
        console.log(`[Frontend] Server response:`, json);
        if (json.success) {
          onRefresh();
          onClose();
        } else {
          Swal.fire({ icon: 'error', title: 'Gagal', text: json.message || `Gagal menyimpan data ${type}` });
        }
      } else {
        // Backend didn't return JSON, likely 404 HTML
        const text = await res.text();
        console.error("[Frontend] Server HTML Response instead of JSON:", res.status, text.substring(0, 100));
        Swal.fire({ icon: 'error', title: '404 - Not Found', text: `Route API ini sepertinya tidak ada. Silakan periksa apakah rute [PUT|POST] /api/absensi/${data.id} sudah dideklarasikan di backend Anda.` });
      }
    } catch (err) {
      console.error("[Frontend] Request failed:", err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Terjadi kesalahan koneksi atau sistem' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-6 px-8 border-b border-slate-100">
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Edit {type === 'masuk' ? 'Absen Masuk' : 'Absen Pulang'}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all cursor-pointer"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pb-4 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Jam {type === 'masuk' ? 'Masuk' : 'Pulang'}</label>
            <input
              type="time"
              value={jam}
              onChange={(e) => setJam(e.target.value)}
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
              Update Foto (Opsional)
              {type === 'masuk' && data.foto_jam_absen && <span className="text-indigo-500 lowercase normal-case tracking-normal">ada foto ✅</span>}
              {type === 'pulang' && data.foto_jam_pulang && <span className="text-indigo-500 lowercase normal-case tracking-normal">ada foto ✅</span>}
            </label>
            <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-indigo-300 transition-all group">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="px-5 py-8 flex flex-col items-center justify-center gap-2 pointer-events-none">
                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-indigo-500 group-hover:scale-110 transition-all">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-xs font-bold text-slate-500 text-center">
                  {file ? <span className="text-indigo-600">{file.name}</span> : 'Pilih Foto Baru'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 pb-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-black tracking-widest uppercase transition-all shadow-lg shadow-indigo-500/30 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
              ) : (
                'Simpan Perubahan'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
