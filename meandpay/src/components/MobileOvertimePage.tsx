import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Clock, 
  Calendar, 
  Zap, 
  Loader2,
  History,
  TrendingUp,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  MessageSquare
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from './Toast';

const BASE_URL = import.meta.env.VITE_API_MEANDPAY;

interface Overtime {
  id: string;
  user_id: string;
  tanggal: string;
  jam_masuk: string | null;
  jam_keluar: string | null;
  total_lembur: string | null;
  status: string;
  notes: string | null;
  file_lembur: string | null;
  lokasi?: { nama_lokasi: string };
  karyawan?: { name: string };
  created_at: string | null;
}

export function MobileOvertimePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  
  const [data, setData] = useState<Overtime[]>([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  // Tab & authorization states
  const [isApprover, setIsApprover] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'my' | 'approval'>('my');
  const [managedDivisions, setManagedDivisions] = useState<string[]>([]);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [allJabatans, setAllJabatans] = useState<any[]>([]);

  // Modals for approval/rejection
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [notes, setNotes] = useState('');

  const fetchOvertime = async (
    userId: string, 
    tab: 'my' | 'approval', 
    isMasterUser: boolean, 
    mDivs: string[], 
    emps: any[]
  ) => {
    try {
      setLoading(true);
      if (tab === 'my') {
        const res = await fetch(`${BASE_URL}/lemburs-user/${userId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const json = await res.json();
        if (json.success) {
          setData(json.data.sort((a: any, b: any) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()));
        }
      } else {
        const res = await fetch(`${BASE_URL}/lemburs`, {
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

          setData(result.sort((a: any, b: any) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()));
        }
      }
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', title: 'Error', message: 'Gagal memuat data lembur.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setUserData(user);

        if (user.id) {
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
          }

          const approverStatus = isMasterUser || isManager;
          setIsApprover(approverStatus);
          setManagedDivisions(managed);

          if (approverStatus) {
            const resUsers = await fetch(`${BASE_URL}/users`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const jsonUsers = await resUsers.json();
            if (jsonUsers.success) {
              emps = jsonUsers.data || [];
              setAllEmployees(emps);
            }
          }

          const targetTab = location.state?.userId && approverStatus ? 'approval' : 'my';
          setActiveSubTab(targetTab);

          await fetchOvertime(user.id, targetTab, isMasterUser, managed, emps);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [location.state?.userId]);

  const handleTabChange = async (tab: 'my' | 'approval') => {
    setActiveSubTab(tab);
    setLoading(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isMasterUser = user?.id?.toString() === '1' || Number(user?.id) === 1 || user?.is_admin === 'superadmin' || user?.is_admin === 'admin' || user?.role === 'superadmin' || user?.role === 'admin';
    await fetchOvertime(user.id, tab, isMasterUser, managedDivisions, allEmployees);
    setLoading(false);
  };

  const canApprove = (row: Overtime) => {
    if (!userData) return false;

    const isCurrentUserAdmin = userData.is_admin === 'admin' || userData.is_admin === 'superadmin' || userData.id?.toString() === '1' || userData.role === 'admin' || userData.role === 'superadmin';
    const pemohon = allEmployees.find(e => e.id?.toString() === row.user_id?.toString());
    const managerId = pemohon && pemohon.jabatan_id 
      ? allJabatans.find(j => j.id?.toString() === pemohon.jabatan_id?.toString())?.manager 
      : null;
    const isCurrentUserManager = managerId?.toString() === userData.id?.toString();
    const status = row.status?.toLowerCase();

    if (isCurrentUserManager) {
      return status === 'pending' || status === 'menunggu';
    }

    if (isCurrentUserAdmin) {
      return status === 'pending' || status === 'menunggu' || status === 'disetujui manager';
    }

    return false;
  };

  const handleApprove = async () => {
    if (!approvingId) return;
    try {
      setIsApproving(true);
      const approverId = userData.id ? String(userData.id) : '1';

      const res = await fetch(`${BASE_URL}/lemburs/${approvingId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes, approved_by: approverId })
      });
      const json = await res.json();
      if (json.success) {
        addToast({ type: 'success', title: 'Berhasil', message: 'Lembur berhasil disetujui!' });
        setApprovingId(null);
        setNotes('');
        const isMasterUser = userData?.id?.toString() === '1' || Number(userData?.id) === 1 || userData?.is_admin === 'superadmin' || userData?.is_admin === 'admin' || userData?.role === 'superadmin' || userData?.role === 'admin';
        await fetchOvertime(userData.id, activeSubTab, isMasterUser, managedDivisions, allEmployees);
      } else {
        addToast({ type: 'error', title: 'Gagal', message: json.message || 'Gagal menyetujui lembur' });
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: 'Terdapat masalah pada server' });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingId) return;
    try {
      setIsRejecting(true);
      const approverId = userData.id ? String(userData.id) : '1';

      const res = await fetch(`${BASE_URL}/lemburs/${rejectingId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'Rejected', notes, approved_by: approverId })
      });
      const json = await res.json();
      if (json.success) {
        addToast({ type: 'success', title: 'Berhasil', message: 'Lembur berhasil ditolak!' });
        setRejectingId(null);
        setNotes('');
        const isMasterUser = userData?.id?.toString() === '1' || Number(userData?.id) === 1 || userData?.is_admin === 'superadmin' || userData?.is_admin === 'admin' || userData?.role === 'superadmin' || userData?.role === 'admin';
        await fetchOvertime(userData.id, activeSubTab, isMasterUser, managedDivisions, allEmployees);
      } else {
        addToast({ type: 'error', title: 'Gagal', message: json.message || 'Gagal menolak lembur' });
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: 'Terdapat masalah pada server' });
    } finally {
      setIsRejecting(false);
    }
  };

  const handleClockOut = async (id: string, officeLoc: any) => {
    if (!navigator.geolocation) return addToast({ type: 'error', title: 'Error', message: 'Geolocation tidak didukung' });
    
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const now = new Date();
          const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

          let distance = 0;
          if (officeLoc?.lat_kantor && officeLoc?.long_kantor) {
             const R = 6371e3;
             const p1 = lat * Math.PI/180;
             const p2 = parseFloat(officeLoc.lat_kantor) * Math.PI/180;
             const dp = (parseFloat(officeLoc.lat_kantor)-lat) * Math.PI/180;
             const dl = (parseFloat(officeLoc.long_kantor)-lng) * Math.PI/180;
             const a = Math.sin(dp/2)**2 + Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
             distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          }

          const res = await fetch(`${BASE_URL}/lemburs/${id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              jam_keluar: timeStr,
              lat_keluar: String(lat),
              long_keluar: String(lng),
              jarak_keluar: distance.toFixed(2),
              status: 'Approved'
            })
          });

          const json = await res.json();
          if (json.success) {
            addToast({ type: 'success', title: 'Berhasil', message: 'Lembur telah diselesaikan.' });
            const isMasterUser = userData?.id?.toString() === '1' || Number(userData?.id) === 1 || userData?.is_admin === 'superadmin' || userData?.is_admin === 'admin' || userData?.role === 'superadmin' || userData?.role === 'admin';
            fetchOvertime(userData.id, activeSubTab, isMasterUser, managedDivisions, allEmployees);
          } else {
            addToast({ type: 'error', title: 'Gagal', message: json.message || 'Gagal menyelesaikan lembur.' });
          }
        } catch (err) {
          addToast({ type: 'error', title: 'Error', message: 'Gagal menghubungi server.' });
        } finally {
          setLoading(false);
        }
      },
      () => {
        addToast({ type: 'error', title: 'Gagal', message: 'Gagal mendapatkan lokasi.' });
        setLoading(false);
      }
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      {/* Header */}
      <div className="bg-indigo-700 pt-12 pb-20 px-6 rounded-b-[3rem] relative shadow-xl shadow-indigo-500/20">
        <div className="flex items-center gap-4 relative z-10 text-white">
          <button onClick={() => navigate('/beranda')} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-black tracking-tight">Riwayat Lembur</h1>
        </div>
      </div>

      {/* Hero Stats / Navigation */}
      <div className="px-6 -mt-10 relative z-20 space-y-4">
        <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-slate-100 flex justify-between items-center">
           <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Lembur</p>
              <p className="text-2xl font-black text-slate-900">{data.length} <span className="text-sm text-slate-400">Hari</span></p>
           </div>
           <div className="w-14 h-14 bg-yellow-50 rounded-2xl flex items-center justify-center border border-yellow-100 shadow-sm">
              <Zap className="w-8 h-8 text-yellow-500" />
           </div>
        </div>

        {/* Manager/Admin Tabs */}
        {isApprover && (
          <div className="flex bg-slate-100 p-1 rounded-2xl">
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
              Persetujuan Lembur
            </button>
          </div>
        )}

        {activeSubTab === 'approval' && location.state?.userId && (
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-3xl flex items-center justify-between">
            <span className="text-[10px] font-bold text-indigo-900 leading-tight">
              Menampilkan pengajuan untuk karyawan tertentu
            </span>
            <button
              onClick={() => {
                navigate('/overtime-data', { replace: true, state: {} });
                handleTabChange('approval');
              }}
              className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
            >
              Tampilkan Semua
            </button>
          </div>
        )}
      </div>

      {/* List */}
      <div className="mt-8 px-6 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Memproses riwayat...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-lg">
             <History className="w-12 h-12 text-slate-200 mb-2" />
             <p className="text-xs font-bold text-slate-400">Belum ada aktivitas lembur</p>
          </div>
        ) : (
          data.map((item, i) => {
            const isPending = item.status?.toLowerCase() === 'pending' || item.status?.toLowerCase() === 'menunggu' || item.status?.toLowerCase() === 'disetujui manager';
            const isApproved = item.status?.toLowerCase() === 'approved' || item.status?.toLowerCase() === 'diterima';

            return (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-[2rem] p-6 shadow-lg shadow-slate-200/40 border border-slate-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      {activeSubTab === 'approval' && (
                        <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-0.5 leading-none">
                          {item.karyawan?.name || 'Karyawan'}
                        </p>
                      )}
                      <h3 className="text-sm font-black text-slate-800">{new Date(item.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}</h3>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                        {item.jam_masuk?.split(' ')[1] || '00:00'} — {item.jam_keluar?.split(' ')[1] || 'Active'}
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    "px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2",
                    isApproved ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                    item.status?.toLowerCase() === 'rejected' ? "bg-rose-50 text-rose-600 border-rose-100" :
                    "bg-amber-50 text-amber-600 border-amber-100"
                  )}>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      isApproved ? "bg-emerald-500 animate-pulse" : 
                      item.status?.toLowerCase() === 'rejected' ? "bg-rose-500" :
                      "bg-amber-500 animate-bounce"
                    )} />
                    {item.status || 'Pending'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Durasi</p>
                      <p className="text-xs font-black text-slate-700">{item.total_lembur || '0'} Jam</p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Lokasi</p>
                      <p className="text-xs font-black text-slate-700 truncate">{item.lokasi?.nama_lokasi || '-'}</p>
                    </div>
                </div>

                {activeSubTab === 'my' && isApproved && !item.jam_keluar && (
                  <button
                    onClick={() => handleClockOut(item.id, (item as any).lokasi)}
                    className="w-full py-4 mb-4 bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-rose-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <TrendingUp className="w-4 h-4" />
                    Selesaikan Lembur
                  </button>
                )}

                <div className="flex items-center justify-between gap-3 bg-indigo-50/50 p-3 rounded-xl mb-4">
                   <div className="flex items-start gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] font-bold text-slate-600 leading-relaxed italic truncate">
                          {item.notes || 'Belum ada catatan...'}
                      </p>
                   </div>
                   {item.file_lembur && (
                      <a 
                        href={item.file_lembur} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-white border border-indigo-100 rounded-lg text-[9px] font-black text-indigo-600 uppercase tracking-widest shrink-0"
                      >
                        Berkas
                      </a>
                   )}
                </div>

                {activeSubTab === 'approval' && canApprove(item) && (
                  <div className="flex items-center gap-3 mt-4">
                    <button 
                      onClick={() => setApprovingId(item.id)}
                      className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                    >
                      Setujui
                    </button>
                    <button 
                      onClick={() => setRejectingId(item.id)}
                      className="flex-1 py-3.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-rose-500/20"
                    >
                      Tolak
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* ─── APPROVE CONFIRM MODAL ─── */}
      <AnimatePresence>
        {approvingId && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-end justify-center p-6"
          >
            <motion.div 
              initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl text-center mb-6"
            >
              <div className="w-16 h-16 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-lg font-black text-slate-800">Setujui Lembur?</h3>
              <p className="text-xs font-bold text-slate-500 mt-2 leading-relaxed">Pengajuan lembur ini akan disetujui.</p>
              
              <div className="mt-6 text-left space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Catatan (Opsional)</label>
                <div className="relative">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Masukkan catatan persetujuan..."
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-xs font-semibold focus:outline-none focus:border-indigo-400 focus:bg-white transition-all h-24 resize-none"
                  />
                  <MessageSquare className="absolute right-4 top-4 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => { setApprovingId(null); setNotes(''); }}
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
            className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-end justify-center p-6"
          >
            <motion.div 
              initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl text-center mb-6"
            >
              <div className="w-16 h-16 bg-rose-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 border border-rose-100">
                <AlertCircle className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-lg font-black text-slate-800">Tolak Lembur?</h3>
              <p className="text-xs font-bold text-slate-500 mt-2 leading-relaxed">Pengajuan lembur ini akan ditolak.</p>
              
              <div className="mt-6 text-left space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Catatan Penolakan (Opsional)</label>
                <div className="relative">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Masukkan alasan penolakan..."
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-xs font-semibold focus:outline-none focus:border-indigo-400 focus:bg-white transition-all h-24 resize-none"
                  />
                  <MessageSquare className="absolute right-4 top-4 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => { setRejectingId(null); setNotes(''); }}
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
  );
}
