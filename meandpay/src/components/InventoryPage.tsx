import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { Search, Plus, Package, Edit2, Trash2, Tag, MapPin, Briefcase, Info, X, Loader2, AlertTriangle, Download, Barcode as BarcodeIcon, Printer, Camera } from 'lucide-react';
import Barcode from 'react-barcode';
import { cn } from '../lib/utils';
import { useToast } from './Toast';

interface InventoryItem {
  id: string;
  kode_barang: string;
  nama_barang: string;
  stok: string | number;
  uom: string;
  description: string;
  lokasi_id: string;
  jabatan_id: string;
  lokasi?: { id: string, nama_lokasi: string } | null;
  jabatan?: { id: string, nama_jabatan: string } | null;
  foto?: string | null;
}

interface Lokasi {
  id: string;
  nama_lokasi: string;
}

interface Jabatan {
  id: string;
  nama_jabatan: string;
}

export function InventoryPage() {
  const [data, setData] = useState<InventoryItem[]>([]);
  const [lokasis, setLokasis] = useState<Lokasi[]>([]);
  const [jabatans, setJabatans] = useState<Jabatan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { addToast, updateToast } = useToast();

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteData, setDeleteData] = useState<InventoryItem | null>(null);
  const [editData, setEditData] = useState<InventoryItem | null>(null);
  const [barcodeData, setBarcodeData] = useState<InventoryItem | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/inventories?search=${search}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  const fetchDependencies = async () => {
    try {
      const [resLok, resJab] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_MEANDPAY}/lokasi`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
        fetch(`${import.meta.env.VITE_API_MEANDPAY}/jabatans`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      ]);
      const jsonLok = await resLok.json();
      const jsonJab = await resJab.json();
      if (jsonLok.success) setLokasis(jsonLok.data);
      if (jsonJab.success) setJabatans(jsonJab.data);
    } catch (err) {
      console.error('Error fetching dependencies:', err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchDependencies();
  }, [fetchData]);

  const handleAdd = async (payload: any) => {
    const toastId = addToast({ type: 'loading', title: 'Menyimpan', message: 'Sedang menyimpan barang baru...' });
    try {
      const formData = new FormData();
      Object.keys(payload).forEach(key => {
        if (key === 'foto' && payload[key]) {
          formData.append('foto', payload[key]);
        } else {
          formData.append(key, payload[key]);
        }
      });

      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/inventories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
          // Content-Type is handled automatically for FormData
        },
        body: formData
      });
      const json = await res.json();
      if (json.success) {
        updateToast(toastId, { type: 'success', title: 'Berhasil', message: 'Barang berhasil ditambahkan' });
        fetchData();
        setIsAddModalOpen(false);
      } else {
        updateToast(toastId, { type: 'error', title: 'Gagal', message: json.message || 'Gagal menyimpan barang' });
      }
    } catch (err: any) {
      updateToast(toastId, { type: 'error', title: 'Error', message: err.message || 'Terjadi kesalahan sistem' });
    }
  };

  const handleUpdate = async (id: string, payload: any) => {
    const toastId = addToast({ type: 'loading', title: 'Memperbarui', message: 'Sedang memperbarui data barang...' });
    try {
      const formData = new FormData();
      Object.keys(payload).forEach(key => {
        if (key === 'foto' && payload[key] instanceof File) {
          formData.append('foto', payload[key]);
        } else if (key !== 'foto') {
          formData.append(key, payload[key]);
        }
      });
      formData.append('_method', 'PUT');

      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/inventories/${id}`, {
        method: 'POST', // Always use POST with _method spoofing for FormData updates
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      const json = await res.json();
      if (json.success) {
        updateToast(toastId, { type: 'success', title: 'Berhasil', message: 'Data barang berhasil diperbarui' });
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
    const toastId = addToast({ type: 'loading', title: 'Menghapus', message: 'Sedang menghapus barang...' });
    try {
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/inventories/${deleteData.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();
      if (json.success) {
        updateToast(toastId, { type: 'success', title: 'Berhasil', message: 'Barang berhasil dihapus' });
        fetchData();
        setDeleteData(null);
      } else {
        updateToast(toastId, { type: 'error', title: 'Gagal', message: json.message || 'Gagal menghapus barang' });
      }
    } catch (err: any) {
      updateToast(toastId, { type: 'error', title: 'Error', message: err.message || 'Terjadi kesalahan sistem' });
    }
  };

  const handleExportExcel = async () => {
    const toastId = addToast({ type: 'loading', title: 'Export Excel', message: 'Sedang menyiapkan data...' });
    try {
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/inventories?limit=100000`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      const allData: InventoryItem[] = json.data;
      const exportData = allData.map((item, index) => ({
        'No': index + 1,
        'Kode Barang': item.kode_barang,
        'Nama Barang': item.nama_barang,
        'Stok': item.stok,
        'UoM': item.uom,
        'Lokasi': item.lokasi?.nama_lokasi || '-',
        'Divisi / Jabatan': item.jabatan?.nama_jabatan || '-',
        'Description': item.description || '-'
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory');

      ws['!cols'] = [
        { wch: 5 }, { wch: 15 }, { wch: 25 }, { wch: 10 }, { wch: 10 },
        { wch: 20 }, { wch: 20 }, { wch: 40 }
      ];

      XLSX.writeFile(wb, `Data_Inventory_${new Date().toISOString().split('T')[0]}.xlsx`);
      updateToast(toastId, { type: 'success', title: 'Berhasil', message: 'Data berhasil di-export ke Excel' });
    } catch (err: any) {
      console.error('Export error:', err);
      updateToast(toastId, { type: 'error', title: 'Gagal', message: err.message || 'Gagal mengekspor data' });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1600px] mx-auto space-y-8 pb-20 px-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Inventory System</h1>
          <p className="text-slate-500 font-medium italic mt-1">Managemen stok dan alat kerja MeAndPay</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-8 py-4 bg-[#1E40AF] text-white rounded-[20px] font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/20 hover:bg-blue-800 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Tambah Barang
        </button>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-indigo-500/5 overflow-hidden">
        <div className="p-10 border-b border-slate-50 flex flex-wrap items-center justify-between gap-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode atau nama barang..."
              className="w-full pl-14 pr-8 py-4.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportExcel}
              className="px-8 py-4 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 hover:bg-emerald-100 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Export Data
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b border-slate-100">No.</th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b border-slate-100">Kode Barang</th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b border-slate-100">Nama Barang</th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-100">Stok</th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b border-slate-100">UoM</th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b border-slate-100">Description</th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b border-slate-100 whitespace-nowrap">Lokasi</th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b border-slate-100">Divisi / Jabatan</th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right border-b border-slate-100 whitespace-nowrap pr-12">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={9} className="py-20 text-center text-slate-400 font-bold"><Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-indigo-500" /> Sedang menarik data...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={9} className="py-20 text-center text-slate-400 font-bold">Tidak ada data inventory.</td></tr>
              ) : data.map((item, idx) => (
                <tr key={item.id} className="group hover:bg-slate-50/30 transition-all">
                  <td className="py-6 px-8 text-xs font-black text-slate-300 italic">{idx + 1}.</td>
                  <td className="py-6 px-8">
                    <span className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-wider border border-indigo-100">
                      {item.kode_barang}
                    </span>
                  </td>
                  <td className="py-6 px-8">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-[14px] flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 overflow-hidden border border-slate-200">
                        {item.foto ? (
                          <img src={item.foto.startsWith('http') ? item.foto : `${import.meta.env.VITE_API_MEANDPAY}/storage/${item.foto}`} alt={item.nama_barang} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5" />
                        )}
                      </div>
                      <div className="font-bold text-slate-800 text-sm">{item.nama_barang}</div>
                    </div>
                  </td>
                  <td className="py-6 px-8 text-center">
                    <div className={cn(
                      "inline-flex items-center justify-center w-10 h-10 rounded-full font-black text-sm border",
                      Number(item.stok) > 10 ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                        Number(item.stok) > 0 ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-rose-50 text-rose-600 border-rose-100"
                    )}>
                      {item.stok}
                    </div>
                  </td>
                  <td className="py-6 px-8">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{item.uom}</span>
                  </td>
                  <td className="py-6 px-8">
                    <p className="text-xs font-medium text-slate-500 max-w-[200px] truncate group-hover:whitespace-normal group-hover:text-slate-700 transition-all">
                      {item.description}
                    </p>
                  </td>
                  <td className="py-6 px-8">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-slate-100 rounded-lg text-slate-400">
                        <MapPin className="w-3 h-3" />
                      </div>
                      <span className="text-xs font-black text-slate-600">{item.lokasi?.nama_lokasi || '-'}</span>
                    </div>
                  </td>
                  <td className="py-6 px-8">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-slate-100 rounded-lg text-slate-400">
                        <Briefcase className="w-3 h-3" />
                      </div>
                      <span className="text-xs font-bold text-slate-600">{item.jabatan?.nama_jabatan || '-'}</span>
                    </div>
                  </td>
                  <td className="py-6 px-8 pr-12">
                    <div className="flex items-center justify-end gap-2 transition-all translate-x-4 group-hover:translate-x-0">
                      <button
                        onClick={() => setBarcodeData(item)}
                        title="Generate Barcode"
                        className="p-2.5 bg-white text-emerald-500 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-slate-100 hover:border-emerald-600"
                      >
                        <BarcodeIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditData(item)}
                        className="p-2.5 bg-white text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-slate-100 hover:border-indigo-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteData(item)}
                        className="p-2.5 bg-white text-slate-400 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm border border-slate-100 hover:border-rose-600"
                      >
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

      <AnimatePresence>
        {isAddModalOpen && (
          <InventoryModal
            lokasis={lokasis}
            jabatans={jabatans}
            onConfirm={handleAdd}
            onCancel={() => setIsAddModalOpen(false)}
          />
        )}
        {editData && (
          <InventoryModal
            data={editData}
            lokasis={lokasis}
            jabatans={jabatans}
            onConfirm={(payload) => handleUpdate(editData.id, payload)}
            onCancel={() => setEditData(null)}
          />
        )}
        {deleteData && (
          <DeleteConfirmModal
            data={deleteData}
            onConfirm={handleDelete}
            onCancel={() => setDeleteData(null)}
          />
        )}
        {barcodeData && (
          <BarcodeModal
            data={barcodeData}
            onCancel={() => setBarcodeData(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function InventoryModal({ data, lokasis, jabatans, onConfirm, onCancel }: { data?: InventoryItem, lokasis: Lokasi[], jabatans: Jabatan[], onConfirm: (p: any) => void, onCancel: () => void }) {
  const [formData, setFormData] = useState({
    kode_barang: data?.kode_barang || '',
    nama_barang: data?.nama_barang || '',
    stok: data?.stok || '',
    uom: data?.uom || '',
    description: data?.description || '',
    lokasi_id: data?.lokasi_id || '',
    jabatan_id: data?.jabatan_id || '',
    foto: null as File | null
  });

  const [preview, setPreview] = useState<string | null>(data?.foto ? (data.foto.startsWith('http') ? data.foto : `${import.meta.env.VITE_API_MEANDPAY}/storage/${data.foto}`) : null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, foto: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }} className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-slate-100">
        <div className="flex items-center justify-between p-10 border-b border-slate-50">
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{data ? 'Edit Barang' : 'Tambah Barang Baru'}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Input Data Inventory</p>
          </div>
          <button onClick={onCancel} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-rose-500 transition-all"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-10 grid grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto scrollbar-hide font-jakarta">
          <div className="col-span-2 flex flex-col items-center mb-4">
            <div className="w-32 h-32 rounded-[32px] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group cursor-pointer hover:border-indigo-300 transition-all">
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-slate-400">
                  <Camera className="w-8 h-8 mb-2" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Pilih Foto</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              {preview && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest">
                  Ganti Foto
                </div>
              )}
            </div>
          </div>
          <div className="col-span-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Kode Barang</label>
            <input
              type="text"
              value={formData.kode_barang}
              onChange={(e) => setFormData({ ...formData, kode_barang: e.target.value })}
              placeholder="Contoh: KB-001"
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all"
            />
          </div>
          <div className="col-span-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Stok</label>
            <input
              type="number"
              value={formData.stok}
              onChange={(e) => setFormData({ ...formData, stok: e.target.value })}
              placeholder="Jumlah item"
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all"
            />
          </div>
          <div className="col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Nama Barang</label>
            <input
              type="text"
              value={formData.nama_barang}
              onChange={(e) => setFormData({ ...formData, nama_barang: e.target.value })}
              placeholder="Masukkan nama barang lengkap"
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all"
            />
          </div>
          <div className="col-span-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">UoM (Satuan)</label>
            <input
              type="text"
              value={formData.uom}
              onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
              placeholder="Contoh: Unit, Box, Pcs"
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all"
            />
          </div>
          <div className="col-span-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Lokasi</label>
            <select
              value={formData.lokasi_id}
              onChange={(e) => setFormData({ ...formData, lokasi_id: e.target.value })}
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all appearance-none cursor-pointer"
            >
              <option value="">-- Pilih Lokasi --</option>
              {lokasis.map(l => <option key={l.id} value={l.id}>{l.nama_lokasi}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Divisi / Jabatan</label>
            <select
              value={formData.jabatan_id}
              onChange={(e) => setFormData({ ...formData, jabatan_id: e.target.value })}
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all appearance-none cursor-pointer"
            >
              <option value="">-- Pilih Divisi --</option>
              {jabatans.map(j => <option key={j.id} value={j.id}>{j.nama_jabatan}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tambahkan catatan atau deskripsi barang..."
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all min-h-[100px] resize-none"
            />
          </div>
        </div>

        <div className="p-10 bg-slate-50/50 flex gap-4">
          <button onClick={onCancel} className="flex-1 py-4.5 bg-white border border-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 transition-all">Batal</button>
          <button
            onClick={() => onConfirm(formData)}
            className="flex-[2] py-4.5 bg-[#1E40AF] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-500/20 hover:bg-blue-800 transition-all active:scale-95"
          >
            {data ? 'Update Barang' : 'Simpan Barang'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function DeleteConfirmModal({ data, onConfirm, onCancel }: { data: InventoryItem, onConfirm: () => void, onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }} className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-sm overflow-hidden p-10 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-[24px] bg-rose-50 flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10 text-rose-500" />
        </div>
        <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight">Hapus Barang?</h3>
        <p className="text-xs font-medium text-slate-400 leading-relaxed mb-8">Barang <span className="text-slate-800 font-bold">{data.nama_barang}</span> akan dihapus permanen dari sistem.</p>
        <div className="flex flex-col gap-3 w-full">
          <button onClick={onConfirm} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all">Hapus Sekarang</button>
          <button onClick={onCancel} className="w-full py-4 bg-slate-50 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all">Batalkan</button>
        </div>
      </motion.div>
    </div>
  );
}

function BarcodeModal({ data, onCancel }: { data: InventoryItem, onCancel: () => void }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm no-print" />
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }} className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-100 print:shadow-none print:border-none print:rounded-none">
        <div className="flex items-center justify-between p-8 border-b border-slate-50 no-print">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Barcode Barang</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cetak Barcode Inventory</p>
          </div>
          <button onClick={onCancel} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-rose-500 transition-all"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-10 flex flex-col items-center justify-center bg-white print:p-0">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 mb-6 print:mb-0 print:border-none print:p-0 flex flex-col items-center">
            <h4 className="text-sm font-black text-slate-800 mb-4 print:text-lg">{data.nama_barang}</h4>
            <div className="bg-white p-2">
              <Barcode 
                value={data.kode_barang} 
                width={2} 
                height={80} 
                fontSize={14}
                background="#ffffff"
              />
            </div>
            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-[0.2em]">{data.kode_barang}</p>
          </div>

          <div className="flex flex-col gap-3 w-full no-print">
            <button
              onClick={handlePrint}
              className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" /> Cetak Barcode
            </button>
            <button onClick={onCancel} className="w-full py-4 bg-slate-50 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all">Tutup</button>
          </div>
        </div>
        
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print\\:block, .print\\:block * {
              visibility: visible;
            }
            .no-print {
              display: none !important;
            }
            .relative.bg-white {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              visibility: visible;
            }
            .relative.bg-white * {
              visibility: visible;
            }
          }
        `}</style>
      </motion.div>
    </div>
  );
}
