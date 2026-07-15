import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Plus, 
  Calendar, 
  Loader2,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Edit2,
  X,
  UploadCloud,
  Save,
  Download,
  User
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from './Toast';

const BASE_URL = import.meta.env.VITE_API_MEANDPAY;

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
  id_manager: string | null;
  created_at: string;
}

export function MobileLeavePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  
  const [viewState, setViewState] = useState<'list' | 'add' | 'edit'>('list');
  const [editItem, setEditItem] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    nama_cuti: '',
    id_manager: '',
    tanggal_mulai: '',
    tanggal_akhir: '',
    alasan_cuti: ''
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [templateUrl, setTemplateUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [managers, setManagers] = useState<{ id: string; name: string }[]>([]);

  // Approver states
  const [isApprover, setIsApprover] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'my' | 'approval'>('my');
  const [managedDivisions, setManagedDivisions] = useState<string[]>([]);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [allJabatans, setAllJabatans] = useState<any[]>([]);
  
  // Approval/Rejection states
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);

  const getFileUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('blob:')) return path;
    let cleanPath = path.replace(/^\//, '');
    if (cleanPath.startsWith('uploads/')) cleanPath = cleanPath.slice(8);
    const apiData = import.meta.env.VITE_API_MEANDPAY_DATA;
    const apiBase = import.meta.env.VITE_API_MEANDPAY;
    const base = (apiData || apiBase || 'https://rsthb.id/apihris').replace(/\/api$/, '').replace(/\/$/, '');
    return `${base}/uploads/${cleanPath}`;
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setUserData(user);
        
        if (user.id) {
          fetchTemplate();
          
          const resUser = await fetch(`${BASE_URL}/users/${user.id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          const jsonUser = await resUser.json();
          const me = jsonUser.data;
          
          const isMasterUser = me?.id?.toString() === '1' || Number(me?.id) === 1 || me?.is_admin === 'superadmin' || me?.is_admin === 'admin' || me?.role === 'superadmin' || me?.role === 'admin';
          
          let isManager = false;
          let managed: string[] = [];
          let emps: any[] = [];
          let jabs: any[] = [];
          
          // Fetch jabatans
          const resJab = await fetch(`${BASE_URL}/jabatans`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          const jsonJab = await resJab.json();
          
          if (jsonJab.success) {
            jabs = jsonJab.data || [];
            setAllJabatans(jabs);
            managed = jabs.filter((j: any) => j.manager?.toString() === user.id.toString()).map((j: any) => j.id.toString());
            isManager = managed.length > 0;
            
            if (me?.jabatan_id) {
              const myJab = jabs.find((j: any) => j.id.toString() === me.jabatan_id.toString());
              if (myJab && myJab.manager) {
                setManagers([{ id: String(myJab.manager), name: `${myJab.manager_name} (${myJab.nama_jabatan})` }]);
                setFormData(prev => ({ ...prev, id_manager: String(myJab.manager) }));
              }
            }
          }
          
          if (isMasterUser || isManager) {
            setIsApprover(true);
            setManagedDivisions(managed);
            
            const resUsers = await fetch(`${BASE_URL}/users`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const jsonUsers = await resUsers.json();
            if (jsonUsers.success) {
              emps = jsonUsers.data;
              setAllEmployees(emps);
            }
          }
          
          let targetTab: 'my' | 'approval' = 'my';
          if (location.state?.userId && (isMasterUser || isManager)) {
            targetTab = 'approval';
            setActiveSubTab('approval');
          }
          
          await fetchLeavesData(user.id, targetTab, isMasterUser, managed, emps);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    init();
  }, []);

  const fetchTemplate = async () => {
    try {
      const res = await fetch(`${BASE_URL}/settings/1`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();
      const item = Array.isArray(json.data) ? json.data[0] : json.data;
      if (item?.file_form_cuti) setTemplateUrl(getFileUrl(item.file_form_cuti));
    } catch (err) {
      console.error('Failed to fetch template:', err);
    }
  };

  const fetchLeavesData = async (
    userId: string, 
    tab: 'my' | 'approval', 
    isMasterUser: boolean, 
    mDivs: string[], 
    emps: any[]
  ) => {
    try {
      if (tab === 'my') {
        const res = await fetch(`${BASE_URL}/cutis/user/${userId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const json = await res.json();
        if (json.success) {
          const result = json.data.filter((item: any) => item.user_id.toString() === userId.toString());
          setLeaves(result.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        }
      } else {
        const res = await fetch(`${BASE_URL}/cutis`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const json = await res.json();
        if (json.success) {
          let result = json.data;
          
          if (!isMasterUser) {
            const validEmpIds = emps
              .filter((e: any) => mDivs.includes(e.jabatan_id?.toString()) || mDivs.includes(e.jabatan?.id?.toString()))
              .map((e: any) => e.id.toString());
              
            result = result.filter((item: any) => validEmpIds.includes(item.user_id?.toString()));
          }
          
          const filterUser = location.state?.userId || '';
          if (filterUser) {
            result = result.filter((item: any) => item.user_id?.toString() === filterUser.toString());
          }
          
          setLeaves(result.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        }
      }
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: 'Gagal memuat data cuti.' });
    }
  };

  const handleTabChange = async (tab: 'my' | 'approval') => {
    setActiveSubTab(tab);
    setLoading(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isMasterUser = user?.id?.toString() === '1' || Number(user?.id) === 1 || user?.is_admin === 'superadmin' || user?.is_admin === 'admin' || user?.role === 'superadmin' || user?.role === 'admin';
    await fetchLeavesData(user.id, tab, isMasterUser, managedDivisions, allEmployees);
    setLoading(false);
  };

  const handleApprove = async () => {
    if (!approvingId) return;
    try {
      setIsApproving(true);
      const approverId = userData.id ? String(userData.id) : '1';

      const fd = new FormData();
      fd.append('user_approval', String(approverId));

      const res = await fetch(`${BASE_URL}/cutis/${approvingId}/approve`, {
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
        const isMasterUser = userData?.id?.toString() === '1' || Number(userData?.id) === 1 || userData?.is_admin === 'superadmin' || userData?.is_admin === 'admin' || userData?.role === 'superadmin' || userData?.role === 'admin';
        await fetchLeavesData(userData.id, activeSubTab, isMasterUser, managedDivisions, allEmployees);
      } else {
        addToast({ type: 'error', message: json.message || 'Gagal menyetujui cuti' });
      }
    } catch (err) {
      addToast({ type: 'error', message: 'Terdapat masalah pada server' });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingId) return;
    try {
      setIsRejecting(true);

      const fd = new FormData();
      fd.append('status_cuti', 'Ditolak');

      const res = await fetch(`${BASE_URL}/cutis/${rejectingId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: fd
      });
      const json = await res.json();
      if (json.success) {
        addToast({ type: 'success', message: 'Cuti berhasil ditolak!' });
        setRejectingId(null);
        const isMasterUser = userData?.id?.toString() === '1' || Number(userData?.id) === 1 || userData?.is_admin === 'superadmin' || userData?.is_admin === 'admin' || userData?.role === 'superadmin' || userData?.role === 'admin';
        await fetchLeavesData(userData.id, activeSubTab, isMasterUser, managedDivisions, allEmployees);
      } else {
        addToast({ type: 'error', message: json.message || 'Gagal menolak cuti' });
      }
    } catch (err) {
      addToast({ type: 'error', message: 'Terdapat masalah pada server' });
    } finally {
      setIsRejecting(false);
    }
  };

  const getManagerForUser = (userId: string) => {
    const employee = allEmployees.find(e => e.id?.toString() === userId?.toString());
    if (!employee || !employee.jabatan_id) return null;
    const jabatan = allJabatans.find(j => j.id?.toString() === employee.jabatan_id?.toString());
    return jabatan?.manager;
  };

  const canApprove = (leave: any) => {
    if (!userData) return false;
    
    const isCurrentUserAdmin = userData.is_admin === 'admin' || userData.is_admin === 'superadmin' || userData.id?.toString() === '1' || userData.role === 'admin' || userData.role === 'superadmin';
    const managerId = getManagerForUser(leave.user_id);
    const isCurrentUserManager = managerId?.toString() === userData.id?.toString();
    const status = leave.status_cuti?.toLowerCase();

    if (isCurrentUserManager) {
      return status === 'pending' || status === 'menunggu';
    }

    if (isCurrentUserAdmin) {
      return status === 'pending' || status === 'menunggu' || status === 'disetujui manager';
    }

    return false;
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({ nama_cuti: '', id_manager: managers.length > 0 ? managers[0].id : '', tanggal_mulai: '', tanggal_akhir: '', alasan_cuti: '' });
    setPhotoFile(null);
    setPhotoPreview(null);
    setEditItem(null);
  };

  const openAdd = () => {
    resetForm();
    setViewState('add');
  };

  const openEdit = (item: Leave) => {
    const start = item.tanggal?.split(' - ')[0] || '';
    const end = item.tanggal?.split(' - ')[1] || start;
    setFormData({
      nama_cuti: item.nama_cuti,
      id_manager: item.id_manager || (managers.length > 0 ? managers[0].id : ''),
      tanggal_mulai: start,
      tanggal_akhir: end,
      alasan_cuti: item.alasan_cuti || ''
    });
    setPhotoPreview(item.foto_cuti || null);
    setPhotoFile(null);
    setEditItem(item);
    setViewState('edit');
  };

  const handleSubmit = async () => {
    if (!formData.nama_cuti || !formData.tanggal_mulai || !formData.tanggal_akhir || !formData.alasan_cuti || !formData.id_manager) {
      return addToast({ type: 'error', message: 'Semua field wajib diisi' });
    }

    try {
      setIsSubmitting(true);
      
      // Ambil lokasi_id dari user localStorage atau default 1 (harus ada dari API sebenernya)
      // fetch /users/:id untuk dapet detail user jika butuh lokasi_id
      const resUser = await fetch(`${BASE_URL}/users/${userData.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const jsonUser = await resUser.json();
      const currentUser = jsonUser.data;
      
      const lokasi_id = currentUser?.lokasi_id || userData?.lokasi_id || '1';

      const fd = new FormData();
      fd.append('user_id', userData.id);
      fd.append('lokasi_id', lokasi_id);
      fd.append('nama_cuti', formData.nama_cuti);
      fd.append('tanggal_mulai', formData.tanggal_mulai);
      fd.append('tanggal_akhir', formData.tanggal_akhir);
      fd.append('alasan_cuti', formData.alasan_cuti);
      fd.append('id_manager', formData.id_manager);

      if (photoFile) fd.append('foto_cuti', photoFile);

      const url = viewState === 'edit' && editItem ? `${BASE_URL}/cutis/${editItem.id}` : `${BASE_URL}/cutis`;
      const method = viewState === 'edit' ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: fd
      });

      const json = await res.json();
      if (json.success) {
        addToast({ type: 'success', message: viewState === 'edit' ? 'Cuti diperbarui.' : 'Cuti diajukan.' });
        setViewState('list');
        const isMasterUser = userData?.id?.toString() === '1' || Number(userData?.id) === 1 || userData?.is_admin === 'superadmin' || userData?.is_admin === 'admin' || userData?.role === 'superadmin' || userData?.role === 'admin';
        fetchLeavesData(userData.id, activeSubTab, isMasterUser, managedDivisions, allEmployees);
      } else {
        addToast({ type: 'error', message: json.message || 'Gagal menyimpan cuti.' });
      }
    } catch (err) {
      addToast({ type: 'error', message: 'Terjadi kesalahan sistem.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDelete = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`${BASE_URL}/cutis/${deletingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();
      if (json.success) {
        addToast({ type: 'success', message: 'Data cuti berhasil dihapus' });
        const isMasterUser = userData?.id?.toString() === '1' || Number(userData?.id) === 1 || userData?.is_admin === 'superadmin' || userData?.is_admin === 'admin' || userData?.role === 'superadmin' || userData?.role === 'admin';
        fetchLeavesData(userData.id, activeSubTab, isMasterUser, managedDivisions, allEmployees);
      } else {
        addToast({ type: 'error', message: 'Gagal menghapus cuti' });
      }
    } catch (err) {
      addToast({ type: 'error', message: 'Terdapat masalah pada server' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      {/* ─── HEADER ─── */}
      <div className="bg-gradient-to-br from-indigo-700 to-indigo-600 pt-14 pb-24 px-6 rounded-b-[3.5rem] relative shadow-2xl shadow-indigo-500/20">
        <div className="flex items-center justify-between relative z-10 text-white">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => viewState === 'list' ? navigate('/beranda') : setViewState('list')} 
              className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 active:scale-95 transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-black tracking-tight">
              {viewState === 'list' ? 'Cuti & Izin' : viewState === 'add' ? 'Pengajuan Baru' : 'Edit Pengajuan'}
            </h1>
          </div>
          {viewState === 'list' && (
            <button 
              onClick={openAdd}
              className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all border border-emerald-400"
            >
              <Plus className="w-6 h-6 text-white" />
            </button>
          )}
        </div>
      </div>

      <div className="px-6 -mt-12 relative z-20 space-y-4">
        
        {isApprover && viewState === 'list' && (
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-4">
            <button
              onClick={() => handleTabChange('my')}
              className={cn(
                "flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
                activeSubTab === 'my' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
              )}
            >
              Pengajuan Saya
            </button>
            <button
              onClick={() => handleTabChange('approval')}
              className={cn(
                "flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
                activeSubTab === 'approval' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
              )}
            >
              Persetujuan Cuti
            </button>
          </div>
        )}

        {activeSubTab === 'approval' && location.state?.userId && viewState === 'list' && (
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-3xl flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-indigo-900 leading-tight">
              Menampilkan pengajuan untuk karyawan tertentu
            </span>
            <button
              onClick={() => {
                navigate('/leave', { replace: true, state: {} });
                handleTabChange('approval');
              }}
              className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
            >
              Tampilkan Semua
            </button>
          </div>
        )}
        
        {/* ─── LIST VIEW ─── */}
        {viewState === 'list' && (
          <>
            {loading ? (
              <div className="flex flex-col items-center py-20 gap-3">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Memuat data...</p>
              </div>
            ) : leaves.length === 0 ? (
              <div className="flex flex-col items-center py-20 bg-white rounded-[2.5rem] shadow-xl border border-slate-100">
                <div className="w-20 h-20 bg-indigo-50 rounded-[1.5rem] flex items-center justify-center mb-5">
                  <Calendar className="w-10 h-10 text-indigo-300" />
                </div>
                <p className="text-sm font-black text-slate-800">Belum ada pengajuan</p>
                <button onClick={openAdd} className="mt-4 text-[10px] text-indigo-600 font-black uppercase tracking-widest px-6 py-2 bg-indigo-50 rounded-full border border-indigo-100 active:scale-95 transition-all">Ajukan Sekarang</button>
              </div>
            ) : (
              <div className="space-y-4">
                {leaves.map((item, i) => {
                  const isPending = item.status_cuti?.toLowerCase() === 'pending' || item.status_cuti?.toLowerCase() === 'menunggu' || item.status_cuti?.toLowerCase() === 'disetujui manager';
                  const isApproved = item.status_cuti?.toLowerCase() === 'approved' || item.status_cuti?.toLowerCase() === 'diterima';

                  return (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/50 border border-slate-100"
                    >
                      <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm border",
                            isApproved ? "bg-emerald-50 border-emerald-100" : isPending ? "bg-amber-50 border-amber-100" : "bg-rose-50 border-rose-100"
                          )}>
                             <FileText className={cn(
                               "w-5 h-5",
                               isApproved ? "text-emerald-500" : isPending ? "text-amber-500" : "text-rose-500"
                             )} />
                          </div>
                          <div>
                            {activeSubTab === 'approval' && (
                              <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-0.5 leading-none">
                                {item.pemohon?.name || item.users?.name || 'Karyawan'}
                              </p>
                            )}
                            <h3 className="text-base font-black text-slate-800 tracking-tight">{item.nama_cuti}</h3>
                            <p className="text-[10px] font-bold text-slate-400 mt-0.5">{new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          </div>
                        </div>
                        <span className={cn(
                          "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                          isApproved ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                          isPending ? "bg-amber-50 text-amber-600 border-amber-100" :
                          "bg-rose-50 text-rose-600 border-rose-100"
                        )}>
                          {item.status_cuti}
                        </span>
                      </div>

                      <div className="p-6">
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{item.tanggal}</span>
                          </div>
                          <p className="text-xs text-slate-500 font-bold leading-relaxed italic">"{item.alasan_cuti}"</p>
                        </div>
                        
                        {item.foto_cuti && (
                          <div className="mt-4 flex items-center gap-2 pt-4 border-t border-slate-100">
                             <ImageIcon className="w-4 h-4 text-indigo-400" />
                             <a href={item.foto_cuti} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest underline decoration-indigo-200 underline-offset-4">
                               Lihat Lampiran Bukti
                             </a>
                          </div>
                        )}

                        {item.catatan && (
                          <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                             <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Catatan Admin:</p>
                             <p className="text-xs font-bold text-indigo-900">{item.catatan}</p>
                          </div>
                        )}

                        {activeSubTab === 'my' ? (
                          isPending && (
                            <div className="mt-5 flex items-center gap-3">
                              <button 
                                onClick={() => openEdit(item)}
                                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                Edit
                              </button>
                              <button 
                                onClick={() => setDeletingId(item.id)}
                                className="w-12 h-12 flex items-center justify-center bg-rose-50 text-rose-500 rounded-xl border border-rose-100 hover:bg-rose-100 transition-all active:scale-95 shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )
                        ) : (
                          canApprove(item) && (
                            <div className="mt-5 flex items-center gap-3">
                              <button 
                                onClick={() => setApprovingId(item.id)}
                                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                              >
                                Setujui
                              </button>
                              <button 
                                onClick={() => setRejectingId(item.id)}
                                className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-rose-500/20"
                              >
                                Tolak
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ─── FORM VIEW (ADD / EDIT) ─── */}
        {(viewState === 'add' || viewState === 'edit') && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-slate-100 space-y-5"
          >
            <div className="space-y-4">
              {templateUrl && (
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-3xl flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest leading-none">Unduh Formulir Cuti</p>
                      <p className="text-[9px] font-bold text-indigo-400 mt-1 leading-tight">Silakan unduh, isi, dan tanda tangani formulir sebelum dikirim.</p>
                    </div>
                  </div>
                  <a 
                    href={templateUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-white border border-indigo-200 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-[0.1em] shadow-sm active:scale-95 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Unduh File Template
                  </a>
                </div>
              )}

              {/* Jenis Cuti */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jenis Izin/Cuti</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select 
                    value={formData.nama_cuti}
                    onChange={(e) => setFormData({...formData, nama_cuti: e.target.value})}
                    className="w-full pl-11 pr-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none"
                  >
                    <option value="">Pilih Jenis</option>
                    <option value="Cuti Tahunan">Cuti Tahunan</option>
                    <option value="Cuti Melahirkan">Cuti Melahirkan</option>
                    <option value="Cuti Keluarga Meninggal">Cuti Keluarga Meninggal</option>
                    <option value="Cuti Menikah">Cuti Menikah</option>
                    <option value="Off Dengan Surat Dokter">Off Dengan Surat Dokter</option>
                    <option value="Lain-Lain (Unpaid Leave)">Lain-Lain (Unpaid Leave)</option>
                    <option value="Izin Datang Terlambat">Izin Datang Terlambat</option>
                    <option value="Izin Pulang Cepat">Izin Pulang Cepat</option>
                  </select>
                </div>
              </div>

              {/* Pilih Manager */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Manager (Divisi)</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select 
                    value={formData.id_manager}
                    onChange={(e) => setFormData({...formData, id_manager: e.target.value})}
                    className="w-full pl-11 pr-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none"
                  >
                    <option value="">Pilih Manager</option>
                    {managers.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tanggal Mulai */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal Mulai</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="date"
                    value={formData.tanggal_mulai}
                    onChange={(e) => setFormData({...formData, tanggal_mulai: e.target.value})}
                    className="w-full pl-11 pr-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Tanggal Akhir */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal Akhir</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="date"
                    value={formData.tanggal_akhir}
                    onChange={(e) => setFormData({...formData, tanggal_akhir: e.target.value})}
                    min={formData.tanggal_mulai}
                    className="w-full pl-11 pr-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Alasan */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alasan Terperinci</label>
                <textarea 
                  value={formData.alasan_cuti}
                  onChange={(e) => setFormData({...formData, alasan_cuti: e.target.value})}
                  placeholder="Mengapa Anda mengajukan izin ini?"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all min-h-[100px] resize-none"
                />
              </div>

              {/* Upload Foto */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Upload Bukti (Opsional)</label>
                <div className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-all text-center">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handlePhotoChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  {photoPreview ? (
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden shadow-sm border border-slate-200">
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <UploadCloud className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-3">
                      <UploadCloud className="w-6 h-6 text-indigo-400" />
                    </div>
                  )}
                  <p className="text-xs font-bold text-slate-600 mt-2">{photoFile ? photoFile.name : 'Pilih Foto / Dokumen'}</p>
                  <p className="text-[9px] font-black uppercase text-slate-400 mt-0.5 tracking-widest">Max 5MB</p>
                </div>
              </div>
            </div>

            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-5 rounded-[1.5rem] bg-indigo-600 text-white font-black uppercase tracking-[0.15em] shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 transition-all active:scale-95 border-b-4 border-indigo-800 active:border-b-0 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <Save className="w-5 h-5" />
                  {viewState === 'edit' ? 'Simpan Perubahan' : 'Kirim Pengajuan'}
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* ─── DELETE MODAL ─── */}
        <AnimatePresence>
          {deletingId && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl text-center"
              >
                <div className="w-16 h-16 bg-rose-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 border border-rose-100">
                  <AlertCircle className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-lg font-black text-slate-800">Batalkan Pengajuan?</h3>
                <p className="text-xs font-bold text-slate-500 mt-2 leading-relaxed">Pengajuan cuti/izin ini akan dihapus secara permanen dari sistem.</p>
                
                <div className="flex gap-3 mt-8">
                  <button 
                    onClick={() => setDeletingId(null)}
                    className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all"
                  >
                    Kembali
                  </button>
                  <button 
                    onClick={executeDelete}
                    className="flex-1 py-3.5 bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-500/30 active:scale-95 transition-all"
                  >
                    Ya, Batalkan
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── APPROVE CONFIRM MODAL ─── */}
        <AnimatePresence>
          {approvingId && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl text-center"
              >
                <div className="w-16 h-16 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-lg font-black text-slate-800">Setujui Cuti?</h3>
                <p className="text-xs font-bold text-slate-500 mt-2 leading-relaxed">Pengajuan cuti/izin ini akan disetujui dan sisa cuti pegawai akan dikurangi sesuai ketentuan.</p>
                
                <div className="flex gap-3 mt-8">
                  <button 
                    onClick={() => setApprovingId(null)}
                    disabled={isApproving}
                    className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="flex-1 py-3.5 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ya, Setujui'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── REJECT CONFIRM MODAL ─── */}
        <AnimatePresence>
          {rejectingId && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl text-center"
              >
                <div className="w-16 h-16 bg-rose-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 border border-rose-100">
                  <AlertCircle className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-lg font-black text-slate-800">Tolak Cuti?</h3>
                <p className="text-xs font-bold text-slate-500 mt-2 leading-relaxed">Pengajuan cuti/izin ini akan ditolak.</p>
                
                <div className="flex gap-3 mt-8">
                  <button 
                    onClick={() => setRejectingId(null)}
                    disabled={isRejecting}
                    className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleReject}
                    disabled={isRejecting}
                    className="flex-1 py-3.5 bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isRejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ya, Tolak'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
