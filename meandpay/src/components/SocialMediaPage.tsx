import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, Plus, MessageCircle, Heart, Repeat, Eye, Trash2, Edit2, Loader2, X, Link as LinkIcon, Instagram, Facebook, Twitter, Linkedin } from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from './Toast';

interface Berita {
  id: string;
  tipe: string;
  judul: string;
  isi: string | null;
  link: string;
  berita_file_path: string;
  berita_file_name: string;
  created_at: string;
  updated_at: string;
}

export function SocialMediaPage() {
  const { addToast } = useToast();
  const [data, setData] = useState<Berita[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    tipe: '',
    judul: '',
    link: ''
  });
  const [gambarFile, setGambarFile] = useState<File | null>(null);
  const [gambarPreview, setGambarPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/beritas`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();
      if (json.success) {
        // Asumsi tipe "Sosial Media" atau tampilkan semua jika API hanya untuk sosial media
        const filteredData = (json.data || []).filter((item: Berita) => item.tipe === 'Sosial Media');
        setData(filteredData);
      }
    } catch (err) {
      console.error('Failed to fetch beritas', err);
      addToast({ type: 'error', message: 'Gagal memuat data sosial media' });
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setSelectedId(null);
    setFormData({ tipe: '', judul: '', link: '' });
    setGambarFile(null);
    setGambarPreview(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: Berita) => {
    setSelectedId(item.id);
    setFormData({
      tipe: item.tipe || '',
      judul: item.judul || '',
      link: item.link || ''
    });
    setGambarFile(null);
    setGambarPreview(item.berita_file_path || null);
    setIsModalOpen(true);
  };

  const handleGambarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setGambarFile(file);
      setGambarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const fd = new FormData();
      fd.append('tipe', formData.tipe);
      fd.append('judul', formData.judul);
      fd.append('link', formData.link);

      if (gambarFile) {
        fd.append('gambar', gambarFile);
      }

      const url = selectedId
        ? `${import.meta.env.VITE_API_MEANDPAY}/beritas/${selectedId}`
        : `${import.meta.env.VITE_API_MEANDPAY}/beritas`;
      const method = selectedId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: fd
      });

      const json = await res.json();
      if (json.success) {
        addToast({ type: 'success', message: `Data berhasil ${selectedId ? 'diperbarui' : 'ditambahkan'}` });
        setIsModalOpen(false);
        fetchData();
      } else {
        addToast({ type: 'error', message: json.message || 'Gagal menyimpan data' });
      }
    } catch (err) {
      addToast({ type: 'error', message: 'Terjadi kesalahan sistem' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/beritas/${itemToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();
      if (json.success) {
        addToast({ type: 'success', message: 'Data berhasil dihapus' });
        setIsDeleteModalOpen(false);
        fetchData();
      } else {
        addToast({ type: 'error', message: json.message || 'Gagal menghapus data' });
      }
    } catch (err) {
      addToast({ type: 'error', message: 'Terjadi kesalahan sistem' });
    } finally {
      setIsSubmitting(false);
      setItemToDelete(null);
    }
  };

  // Helper function to render a nice icon based on the title
  const getIconForTitle = (judul: string) => {
    const title = judul.toLowerCase();
    if (title.includes('instagram')) return <Instagram className="w-5 h-5 text-pink-500" />;
    if (title.includes('facebook')) return <Facebook className="w-5 h-5 text-blue-600" />;
    if (title.includes('twitter') || title.includes('x.com')) return <Twitter className="w-5 h-5 text-slate-800" />;
    if (title.includes('linkedin')) return <Linkedin className="w-5 h-5 text-indigo-700" />;
    return <Share2 className="w-5 h-5 text-indigo-500" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1600px] mx-auto space-y-8 pb-20"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Manajemen Sosial Media</h1>
          <p className="text-slate-500 font-medium mt-2">Kelola tautan dan banner sosial media perusahaan Anda.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Tambah Baru
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : data.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] p-12 text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Share2 className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-black text-slate-800 tracking-tight">Belum ada data</h3>
          <p className="text-slate-500 mt-2">Silakan tambahkan tautan sosial media pertama Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {data.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ y: -8 }}
              className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col group"
            >
              <div className="relative h-56 overflow-hidden bg-slate-50">
                {item.berita_file_path ? (
                  <img src={item.berita_file_path} alt={item.judul} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Share2 className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent  transition-opacity"></div>
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-lg">
                  {getIconForTitle(item.judul)}
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col space-y-4">
                <div className="flex-1">
                  <h3 className="text-xl font-black text-slate-800 tracking-tight leading-tight">{item.judul}</h3>
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-bold text-indigo-500 mt-2 hover:text-indigo-600 transition-colors w-max">
                    <LinkIcon className="w-4 h-4" />
                    Kunjungi Tautan
                  </a>
                </div>

                <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>Ditambahkan: {new Date(item.created_at).toLocaleDateString('id-ID')}</span>
                </div>

                <div className="pt-4 flex gap-2">
                  <button
                    onClick={() => openEditModal(item)}
                    className="flex-1 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-100 transition-all flex justify-center items-center gap-2"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(item.id)}
                    className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-all shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
              onClick={() => !isSubmitting && setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-lg h-fit bg-white rounded-[40px] shadow-2xl z-50 p-8 border border-white"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                    {selectedId ? 'Edit Sosial Media' : 'Tambah Sosial Media'}
                  </h3>
                  <p className="text-slate-500 text-sm font-medium mt-1">Isi formulir di bawah untuk menyimpan data tautan.</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-10 h-10 bg-slate-100 hover:bg-rose-100 hover:text-rose-500 text-slate-500 flex items-center justify-center rounded-2xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipe</label>
                  <select
                    required
                    value={formData.tipe}
                    onChange={(e) => setFormData({ ...formData, tipe: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none"
                  >
                    <option value="">-- Pilih Tipe --</option>
                    <option value="Sosial Media">Sosial Media</option>
                    <option value="Berita">Berita</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Judul</label>
                  <input
                    type="text"
                    required
                    value={formData.judul}
                    onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                    placeholder="Contoh: Instagram OZTHETIQUE"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Link Tujuan</label>
                  <input
                    type="url"
                    required
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    placeholder="Masukkan URL lengkap (contoh: https://example.com/)"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gambar</label>

                  {gambarPreview && (
                    <div className="relative w-full h-40 bg-slate-100 rounded-2xl mb-4 overflow-hidden border border-slate-200">
                      <img src={gambarPreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setGambarFile(null);
                          setGambarPreview(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="absolute top-2 right-2 w-8 h-8 bg-black/50 backdrop-blur-md rounded-xl flex items-center justify-center text-white hover:bg-rose-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    required={!selectedId && !gambarPreview}
                    onChange={handleGambarChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:tracking-widest file:bg-indigo-100 file:text-indigo-600 hover:file:bg-indigo-200 cursor-pointer"
                  />
                  <p className="text-[10px] font-bold text-slate-400 px-1 mt-1">Upload gambar untuk ditampilkan di kartu (Wajib jika baru).</p>
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-sm font-black hover:bg-slate-200 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Simpan Data
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
              onClick={() => !isSubmitting && setIsDeleteModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-md h-fit bg-white rounded-[40px] shadow-2xl z-50 p-8 border border-white text-center"
            >
              <div className="w-20 h-20 bg-rose-50 rounded-[24px] flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Trash2 className="w-10 h-10 text-rose-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Hapus Data?</h3>
              <p className="text-slate-500 font-medium mb-8">
                Data sosial media ini akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-sm font-black hover:bg-slate-200 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-rose-500 text-white rounded-2xl text-sm font-black shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

