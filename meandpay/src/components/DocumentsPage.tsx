import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, FileText, Download, Trash2, Clock, X, Loader2, FileUp, Calendar, User, Info, Pencil, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from './Toast';

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  category: string;
  uploadedAt: string;
  owner: string;
  ownerId: string;
  url?: string;
}

interface Employee {
  id: string;
  name: string;
}

export function DocumentsPage() {
  const [data, setData] = useState<Document[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { addToast, updateToast } = useToast();

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editData, setEditData] = useState<Document | null>(null);
  const [deleteData, setDeleteData] = useState<Document | null>(null);

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/users`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();
      if (json.success) setEmployees(json.data);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/documents?search=${search}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();
      if (json.success) {
        const mappedData: Document[] = json.data.map((item: any) => {
          const fileUploadStr = item.fileUpload || '';
          const extension = fileUploadStr.split('.').pop()?.toUpperCase() || 'FILE';

          // Handle both full URL and relative path
          let fileUrl: string | undefined;
          const backendBaseUrl = import.meta.env.VITE_API_MEANDPAY_DATA || import.meta.env.VITE_API_MEANDPAY.replace('/api', '');
          
          if (fileUploadStr.startsWith('http')) {
            // Fix: Backend production might return localhost:4000 if BASE_URL is not set in .env
            if (fileUploadStr.includes('localhost:4000')) {
              fileUrl = fileUploadStr.replace('http://localhost:4000', backendBaseUrl);
            } else {
              fileUrl = fileUploadStr;
            }
          } else if (fileUploadStr) {
            fileUrl = `${backendBaseUrl}/uploads/${fileUploadStr}`;
          }

          const sizeKb = item.size ? parseInt(item.size) : 0;
          let sizeLabel = '-';
          if (sizeKb > 0) {
            sizeLabel = sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;
          }

          return {
            id: item.id,
            name: item.jenis_file || 'Tanpa Nama',
            type: extension,
            size: sizeLabel,
            category: 'Dokumen Pegawai',
            uploadedAt: item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-',
            owner: item.users?.name || 'Unknown',
            ownerId: item.user_id || '',
            url: fileUrl
          };
        });
        setData(mappedData);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchEmployees();
    fetchData();
  }, [fetchData]);

  const handleUpload = async (formData: FormData) => {
    const toastId = addToast({ type: 'loading', title: 'Uploading', message: 'Sedang mengupload dokumen...' });
    try {
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/documents`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      const json = await res.json();

      if (json.success) {
        updateToast(toastId, { type: 'success', title: 'Berhasil', message: 'Dokumen berhasil diunggah' });
        setIsAddModalOpen(false);
        fetchData();
      } else {
        updateToast(toastId, { type: 'error', title: 'Gagal', message: json.message || 'Gagal mengunggah dokumen' });
      }
    } catch (err: any) {
      updateToast(toastId, { type: 'error', title: 'Error', message: err.message || 'Terjadi kesalahan sistem' });
    }
  };

  const handleEdit = async (formData: FormData) => {
    if (!editData) return;
    const toastId = addToast({ type: 'loading', title: 'Menyimpan', message: 'Sedang memperbarui dokumen...' });
    try {
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/documents/${editData.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      const json = await res.json();
      if (json.success) {
        updateToast(toastId, { type: 'success', title: 'Berhasil', message: 'Dokumen berhasil diperbarui' });
        setEditData(null);
        fetchData();
      } else {
        updateToast(toastId, { type: 'error', title: 'Gagal', message: json.message || 'Gagal memperbarui dokumen' });
      }
    } catch (err: any) {
      updateToast(toastId, { type: 'error', title: 'Error', message: err.message || 'Terjadi kesalahan sistem' });
    }
  };

  const handleDelete = async () => {
    if (!deleteData) return;
    const toastId = addToast({ type: 'loading', title: 'Menghapus', message: 'Sedang menghapus dokumen...' });
    try {
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/documents/${deleteData.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();
      if (json.success) {
        updateToast(toastId, { type: 'success', title: 'Berhasil', message: 'Dokumen berhasil dihapus' });
        fetchData();
        setDeleteData(null);
      } else {
        updateToast(toastId, { type: 'error', title: 'Gagal', message: json.message || 'Gagal menghapus dokumen' });
      }
    } catch (err: any) {
      updateToast(toastId, { type: 'error', title: 'Error', message: err.message || 'Terjadi kesalahan sistem' });
    }
  };

  const handlePreview = (item: Document) => {
    if (item.url) {
      window.open(item.url, '_blank');
    } else {
      addToast({ type: 'error', title: 'Error', message: 'File tidak tersedia untuk preview' });
    }
  };

  const handleDownload = async (item: Document) => {
    if (!item.url) {
      addToast({ type: 'error', title: 'Error', message: 'File tidak tersedia untuk diunduh' });
      return;
    }
    try {
      const response = await fetch(item.url);
      if (!response.ok) {
        throw new Error('File tidak ditemukan di server (404) atau terjadi kesalahan jaringan.');
      }
      
      // Mencegah download jika yang dikembalikan server adalah halaman HTML (misal error dari server/hosting)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error('File rusak atau tidak ditemukan di server (mendapat respons HTML).');
      }

      // Gunakan arrayBuffer untuk memastikan file binary tidak rusak saat didownload
      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: contentType || 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Extract filename from URL
      const fileName = item.url.split('/').pop() || `${item.name}.${item.type.toLowerCase()}`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      addToast({ type: 'success', title: 'Berhasil', message: 'File berhasil diunduh' });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message || 'Gagal mengunduh file' });
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-[1600px] mx-auto space-y-8 pb-20 px-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Dokumen Pegawai</h1>
          <p className="text-slate-500 font-medium italic mt-1">Penyimpanan dokumen digital terpusat</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-8 py-4 bg-[#10B981] text-white rounded-[20px] font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Upload Dokumen
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
              placeholder="Cari nama dokumen atau pemilik..."
              className="w-full pl-14 pr-8 py-4.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button className="p-4.5 bg-slate-50 text-slate-400 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-all">
              <Clock className="w-5 h-5" />
            </button>
            <button className="px-8 py-4.5 bg-slate-50 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-100 hover:bg-slate-100 transition-all">Semua File</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b border-slate-100">Nama File</th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b border-slate-100">Kategori</th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b border-slate-100">Ukuran</th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b border-slate-100">Pemilik</th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b border-slate-100">Tanggal Upload</th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right border-b border-slate-100 pr-12">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={6} className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-indigo-500" /></td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={6} className="py-20 text-center text-slate-400 font-bold">Tidak ada dokumen ditemukan.</td></tr>
              ) : (
                Object.entries(
                  data.reduce((acc: { [key: string]: Document[] }, curr) => {
                    const ownerName = curr.owner || 'Unknown';
                    if (!acc[ownerName]) acc[ownerName] = [];
                    acc[ownerName].push(curr);
                    return acc;
                  }, {})
                ).map(([employeeName, docs]) => {
                  const typedDocs = docs as Document[];
                  return (
                    <React.Fragment key={employeeName}>
                      <tr className="bg-indigo-50/20">
                        <td colSpan={6} className="py-4 px-8 font-black text-xs text-indigo-600 uppercase tracking-widest border-y border-indigo-50/40">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{employeeName} ({typedDocs.length} Dokumen)</span>
                          </div>
                        </td>
                      </tr>
                      {typedDocs.map((item) => (
                        <tr key={item.id} className="group hover:bg-slate-50/30 transition-all">
                          <td className="py-6 px-8 pl-12">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-10 h-10 rounded-[14px] flex items-center justify-center text-white font-black text-[10px] shadow-sm shrink-0",
                                item.type === 'PDF' ? "bg-[#EF4444]" :
                                  item.type === 'DOCX' || item.type === 'DOC' ? "bg-[#3B82F6]" :
                                    item.type === 'XLS' || item.type === 'XLSX' ? "bg-[#10B981]" : "bg-indigo-500"
                              )}>
                                {item.type}
                              </div>
                              <div className="font-bold text-slate-700 text-sm group-hover:text-indigo-600 transition-colors">{item.name}</div>
                            </div>
                          </td>
                          <td className="py-6 px-8">
                            <span className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200/50">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-6 px-8 text-xs font-bold text-slate-400">{item.size}</td>
                          <td className="py-6 px-8">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase border border-slate-200">
                                {item.owner.charAt(0)}
                              </div>
                              <span className="text-xs font-bold text-slate-700">{item.owner}</span>
                            </div>
                          </td>
                          <td className="py-6 px-8 text-xs font-bold text-slate-400">{item.uploadedAt}</td>
                          <td className="py-6 px-8 pr-12">
                            <div className="flex items-center justify-end gap-2 transition-all translate-x-4 group-hover:translate-x-0">
                              <button
                                onClick={() => handleDownload(item)}
                                title="Download"
                                className="p-2.5 bg-white text-slate-400 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-slate-100"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditData(item)}
                                title="Edit"
                                className="p-2.5 bg-white text-slate-400 rounded-xl hover:bg-amber-500 hover:text-white transition-all shadow-sm border border-slate-100"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteData(item)}
                                title="Hapus"
                                className="p-2.5 bg-white text-slate-400 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm border border-slate-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isAddModalOpen && (
          <UploadDocumentModal
            employees={employees}
            onConfirm={handleUpload}
            onCancel={() => setIsAddModalOpen(false)}
          />
        )}
        {editData && (
          <EditDocumentModal
            employees={employees}
            document={editData}
            onConfirm={handleEdit}
            onCancel={() => setEditData(null)}
          />
        )}
        {deleteData && (
          <DeleteConfirmModal
            document={deleteData}
            onConfirm={handleDelete}
            onCancel={() => setDeleteData(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function UploadDocumentModal({ employees, onConfirm, onCancel }: { employees: Employee[], onConfirm: (f: FormData) => void, onCancel: () => void }) {
  const [formData, setFormData] = useState({
    user_id: '',
    nama_dokumen: '',
    tanggal_upload: new Date().toISOString().split('T')[0],
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    const fd = new FormData();
    fd.append('user_id', formData.user_id);
    fd.append('nama_dokumen', formData.nama_dokumen);
    fd.append('tanggal_upload', formData.tanggal_upload);
    fd.append('file', selectedFile);

    onConfirm(fd);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }} className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col border border-slate-100">
        <div className="flex items-center justify-between p-10 border-b border-slate-50">
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Tambah Data Dokumen</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Sistem Pengarsipan Digital</p>
          </div>
          <button onClick={onCancel} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-rose-500 transition-all"><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Nama Pegawai</label>
              <div className="relative">
                <select
                  required
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  className="w-full pl-14 pr-6 py-4.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-200 transition-all appearance-none cursor-pointer"
                >
                  <option value="">-- Pilih Pegawai --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
                <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Nama Dokumen</label>
              <div className="relative">
                <input
                  required
                  type="text"
                  value={formData.nama_dokumen}
                  onChange={(e) => setFormData({ ...formData, nama_dokumen: e.target.value })}
                  placeholder="Contoh: Ijazah S1, Sertifikat Pelatihan"
                  className="w-full pl-14 pr-6 py-4.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-200 transition-all"
                />
                <FileText className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Tanggal Upload</label>
              <div className="relative">
                <input
                  required
                  type="date"
                  value={formData.tanggal_upload}
                  onChange={(e) => setFormData({ ...formData, tanggal_upload: e.target.value })}
                  className="w-full pl-14 pr-6 py-4.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-200 transition-all"
                />
                <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Dokumen</label>
              <div className="relative group">
                <input
                  required
                  type="file"
                  accept=".doc,.docx,.pdf,.xls,.xlsx,.ppt,.pptx"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="document-upload"
                />
                <label
                  htmlFor="document-upload"
                  className="flex flex-col items-center justify-center w-full min-h-[140px] px-6 py-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] hover:bg-emerald-50 hover:border-emerald-200 transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <FileUp className="w-6 h-6 text-emerald-500" />
                  </div>
                  <span className="text-sm font-bold text-slate-700 mb-1">{selectedFile ? selectedFile.name : 'Pilih File atau Drag & Drop'}</span>
                  <p className="text-[10px] font-bold text-slate-400">{selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Tidak ada file yang dipilih'}</p>
                </label>
              </div>
              <div className="mt-4 flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[9px] font-bold text-amber-700 leading-normal uppercase tracking-wider">
                  File yang diperbolehkan: doc, docx, pdf, xls, xlsx, ppt, pptx dan Max Size 10 MB
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onCancel} className="flex-1 py-4.5 bg-slate-50 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 transition-all">Batal</button>
            <button
              type="submit"
              className="flex-[2] py-4.5 bg-[#10B981] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50"
              disabled={!selectedFile}
            >
              Simpan Dokumen
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function EditDocumentModal({ employees, document, onConfirm, onCancel }: { employees: Employee[], document: Document, onConfirm: (f: FormData) => void, onCancel: () => void }) {
  const [formData, setFormData] = useState({
    user_id: document.ownerId,
    nama_dokumen: document.name,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const fd = new FormData();
    fd.append('user_id', formData.user_id);
    fd.append('nama_dokumen', formData.nama_dokumen);
    if (selectedFile) {
      fd.append('file', selectedFile);
    }

    onConfirm(fd);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }} className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col border border-slate-100">
        <div className="flex items-center justify-between p-10 border-b border-slate-50">
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Edit Dokumen</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Perbarui Data Dokumen</p>
          </div>
          <button onClick={onCancel} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-rose-500 transition-all"><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Nama Pegawai</label>
              <div className="relative">
                <select
                  required
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  className="w-full pl-14 pr-6 py-4.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/5 focus:border-amber-200 transition-all appearance-none cursor-pointer"
                >
                  <option value="">-- Pilih Pegawai --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
                <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Nama Dokumen</label>
              <div className="relative">
                <input
                  required
                  type="text"
                  value={formData.nama_dokumen}
                  onChange={(e) => setFormData({ ...formData, nama_dokumen: e.target.value })}
                  placeholder="Contoh: Ijazah S1, Sertifikat Pelatihan"
                  className="w-full pl-14 pr-6 py-4.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/5 focus:border-amber-200 transition-all"
                />
                <FileText className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Ganti File (Opsional)</label>
              <div className="relative group">
                <input
                  type="file"
                  accept=".doc,.docx,.pdf,.xls,.xlsx,.ppt,.pptx"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="document-edit-upload"
                />
                <label
                  htmlFor="document-edit-upload"
                  className="flex flex-col items-center justify-center w-full min-h-[120px] px-6 py-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] hover:bg-amber-50 hover:border-amber-200 transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <FileUp className="w-6 h-6 text-amber-500" />
                  </div>
                  {selectedFile ? (
                    <>
                      <span className="text-sm font-bold text-slate-700 mb-1">{selectedFile.name}</span>
                      <p className="text-[10px] font-bold text-slate-400">{`${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`}</p>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-bold text-slate-500 mb-1">Pilih file baru untuk mengganti</span>
                      <p className="text-[10px] font-bold text-slate-400">File saat ini: {document.type} - {document.size}</p>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onCancel} className="flex-1 py-4.5 bg-slate-50 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 transition-all">Batal</button>
            <button
              type="submit"
              className="flex-[2] py-4.5 bg-amber-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-amber-500/20 hover:bg-amber-600 transition-all active:scale-95"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function DeleteConfirmModal({ document, onConfirm, onCancel }: { document: Document, onConfirm: () => void, onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }} className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
        <div className="p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-rose-500" />
          </div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">Hapus Dokumen?</h3>
          <p className="text-sm text-slate-500 font-medium mb-2">
            Anda yakin ingin menghapus dokumen:
          </p>
          <p className="text-base font-black text-slate-700 mb-1">"{document.name}"</p>
          <p className="text-xs text-slate-400 font-bold">Pemilik: {document.owner}</p>
          <p className="text-xs text-rose-400 font-bold mt-4">Tindakan ini tidak dapat dibatalkan.</p>
        </div>
        <div className="flex gap-4 p-10 pt-0">
          <button onClick={onCancel} className="flex-1 py-4.5 bg-slate-50 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 transition-all">Batal</button>
          <button
            onClick={onConfirm}
            className="flex-[2] py-4.5 bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95"
          >
            Ya, Hapus
          </button>
        </div>
      </motion.div>
    </div>
  );
}



