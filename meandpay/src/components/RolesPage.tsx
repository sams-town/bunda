import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  Search,
  Plus,
  Edit2,
  Trash2,
  Shield,
  Lock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { AddRole } from './AddRole';
import { EditRole } from './EditRole';
import Swal from 'sweetalert2';
import { useToast } from './Toast';

interface Role {
  id: string;
  name: string;
  guard_name: string;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: Role[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const { addToast, updateToast } = useToast();

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/roles`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const json: ApiResponse = await res.json();
      if (json.success) {
        setRoles(json.data);
      } else {
        setError(json.message || 'Gagal mengambil data roles');
      }
    } catch (err) {
      setError('Tidak dapat terhubung ke server');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: 'Hapus Role?',
      text: `Apakah Anda yakin ingin menghapus role "${name}"? Tindakan ini tidak dapat dibatalkan.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#475569',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      const toastId = addToast({
        type: 'loading',
        title: 'Menghapus Role',
        message: `Sedang menghapus role ${name}...`
      });

      try {
        const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/roles/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const json = await res.json();
        if (json.success) {
          updateToast(toastId, {
            type: 'success',
            title: 'Berhasil',
            message: `Role ${name} berhasil dihapus.`
          });
          fetchRoles();
        } else {
          updateToast(toastId, {
            type: 'error',
            title: 'Gagal',
            message: json.message || 'Gagal menghapus role'
          });
        }
      } catch (err: any) {
        updateToast(toastId, {
          type: 'error',
          title: 'Error',
          message: err.message || 'Terjadi kesalahan sistem'
        });
      }
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (isAdding) {
    return <AddRole onBack={() => { setIsAdding(false); fetchRoles(); }} />;
  }

  if (editingRole) {
    return <EditRole roleId={editingRole.id} onBack={() => { setEditingRole(null); fetchRoles(); }} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-8 pb-20"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Role Management</h1>
          <p className="text-slate-500 font-medium">Define and manage access levels for your organization.</p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black transition-all shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Tambah Role
        </button>
      </div>

      {/* Stats Cards for Roles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RoleStatCard label="Total Roles" value={loading ? '...' : String(roles.length)} icon={ShieldCheck} color="text-indigo-600" bg="bg-indigo-50" />
        <RoleStatCard label="Active Guards" value="1" icon={Lock} color="text-emerald-600" bg="bg-emerald-50" />
        <RoleStatCard label="System Roles" value={loading ? '...' : String(roles.length)} icon={Shield} color="text-amber-600" bg="bg-amber-50" />
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/30 overflow-hidden">
        {/* Table Controls */}
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search roles..."
              className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {loading ? 'Loading...' : `Showing ${roles.length} Roles`}
            </p>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto scrollbar-hide">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-sm font-bold text-slate-400">Memuat data roles...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-rose-500" />
              </div>
              <p className="text-sm font-bold text-slate-600">{error}</p>
              <button
                onClick={fetchRoles}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all active:scale-95"
              >
                Coba Lagi
              </button>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">No.</th>
                  <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">Nama Role</th>
                  <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left border-b border-slate-100">Guard</th>
                  <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right border-b border-slate-100">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {roles.map((role, index) => (
                  <tr key={role.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-6 px-8">
                      <span className="text-sm font-black text-slate-300 group-hover:text-slate-900 transition-colors">
                        {(index + 1).toString().padStart(2, '0')}
                      </span>
                    </td>
                    <td className="py-6 px-8">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <Shield className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-black text-slate-900">{role.name}</span>
                      </div>
                    </td>
                    <td className="py-6 px-8">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        {role.guard_name}
                      </span>
                    </td>
                    <td className="py-6 px-8">
                      <div className="flex items-center justify-end gap-2  transition-opacity">
                        <button onClick={() => setEditingRole(role)} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-90 shadow-sm">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(role.id, role.name)}
                          className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all active:scale-90 shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="p-8 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-400">Page 1 of 1</p>
          <div className="flex items-center gap-2">
            <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 cursor-not-allowed opacity-50" disabled>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 rounded-xl text-xs font-black bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
              1
            </button>
            <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 cursor-not-allowed opacity-50" disabled>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function RoleStatCard({ label, value, icon: Icon, color, bg }: { label: string, value: string, icon: any, color: string, bg: string }) {
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
