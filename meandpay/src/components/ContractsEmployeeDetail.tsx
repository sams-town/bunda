import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
    Search, FileText, Download, ArrowLeft, Loader2, Calendar, FileSpreadsheet
} from 'lucide-react';
import { cn } from '../lib/utils';

/* ─── Types ─────────────────────────────────────────────── */
interface Kontrak {
    id: string;
    tanggal: string | null;
    jenis_kontrak: string | null;
    tanggal_mulai: string | null;
    tanggal_selesai: string | null;
    keterangan: string | null;
    kontrak_file_path: string | null;
    kontrak_file_name: string | null;
}

interface Employee {
    id: string;
    name: string;
}

interface ContractsEmployeeDetailProps {
    employee: Employee;
    onBack: () => void;
}

/* ─── Helpers ────────────────────────────────────────────── */
function fmtDate(d: string | null) {
    if (!d) return '-';
    try {
        const date = new Date(d);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
        return '-';
    }
}

function calculatePeriode(start: string | null, end: string | null) {
    if (!start || !end) return '-';
    try {
        const s = new Date(start);
        const e = new Date(end);
        if (isNaN(s.getTime()) || isNaN(e.getTime())) return '-';
        const diffTime = Math.abs(e.getTime() - s.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 365) {
            const years = Math.floor(diffDays / 365);
            return `${years} Tahun`;
        }
        if (diffDays >= 30) {
            const months = Math.floor(diffDays / 30);
            return `${months} Bulan`;
        }
        return `${diffDays} Hari`;
    } catch {
        return '-';
    }
}

function getFileUrl(path: string | null) {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const base = import.meta.env.VITE_API_MEANDPAY.replace('/api', '');
    return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

/* ─── Component ─────────────────────────────────────────── */
export function ContractsEmployeeDetail({ employee, onBack }: ContractsEmployeeDetailProps) {
    const [contracts, setContracts] = useState<Kontrak[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchContracts = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/kontraks/user/${employee.id}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                const json = await res.json();
                if (json.success) {
                    setContracts(json.data);
                }
            } catch (err) {
                console.error('Error fetching contracts:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchContracts();
    }, [employee.id]);

    const filtered = contracts.filter(c =>
        (c.jenis_kontrak || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.tanggal || '').includes(search)
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto space-y-6 pb-20"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black text-slate-800 tracking-tight text-center flex-1 ml-24">List Kontrak</h1>
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#F43F5E] hover:bg-rose-600 text-white rounded-xl text-xs font-black tracking-widest uppercase transition-all shadow-lg shadow-rose-500/20 active:scale-95"
                >
                    Back
                </button>
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden min-h-[600px] flex flex-col">
                <div className="px-10 py-12 border-b border-slate-50">
                    <h2 className="text-4xl font-black text-slate-800 text-center tracking-tight uppercase">{employee.name}</h2>
                </div>

                {/* Table Section */}
                <div className="flex-1 px-10 py-8">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-100/80">
                                    <th className="py-4 px-4 text-[11px] font-black text-slate-900 uppercase tracking-widest text-left border-r border-slate-200 w-16">No.</th>
                                    <th className="py-4 px-6 text-[11px] font-black text-slate-900 uppercase tracking-widest text-left border-r border-slate-200">Tanggal</th>
                                    <th className="py-4 px-6 text-[11px] font-black text-slate-900 uppercase tracking-widest text-left border-r border-slate-200">Jenis Kontrak</th>
                                    <th className="py-4 px-6 text-[11px] font-black text-slate-900 uppercase tracking-widest text-left border-r border-slate-200">Tanggal Mulai</th>
                                    <th className="py-4 px-6 text-[11px] font-black text-slate-900 uppercase tracking-widest text-left border-r border-slate-200">Tanggal Selesai</th>
                                    <th className="py-4 px-6 text-[11px] font-black text-slate-900 uppercase tracking-widest text-left border-r border-slate-200">Periode</th>
                                    <th className="py-4 px-6 text-[11px] font-black text-slate-900 uppercase tracking-widest text-left">File</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 border-b border-slate-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="py-32">
                                            <div className="flex flex-col items-center justify-center gap-4">
                                                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                                                <p className="text-sm font-bold text-slate-400 tracking-widest uppercase">Memuat data...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-32 text-center text-sm font-bold text-slate-300 tracking-widest uppercase">
                                            Tidak Ada Data
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((row, idx) => (
                                        <tr key={row.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="py-5 px-4 text-xs font-bold text-slate-900 border-r border-slate-100">{idx + 1}.</td>
                                            <td className="py-5 px-6 text-xs font-bold text-slate-900 border-r border-slate-100">{fmtDate(row.tanggal)}</td>
                                            <td className="py-5 px-6 text-xs font-bold text-slate-900 border-r border-slate-100">{row.jenis_kontrak || '-'}</td>
                                            <td className="py-5 px-6 text-xs font-bold text-slate-900 border-r border-slate-100">{fmtDate(row.tanggal_mulai)}</td>
                                            <td className="py-5 px-6 text-xs font-bold text-slate-900 border-r border-slate-100">{fmtDate(row.tanggal_selesai)}</td>
                                            <td className="py-5 px-6 text-xs font-bold text-slate-900 border-r border-slate-100">{calculatePeriode(row.tanggal_mulai, row.tanggal_selesai)}</td>
                                            <td className="py-5 px-6">
                                                {row.kontrak_file_path ? (
                                                    <a
                                                        href={getFileUrl(row.kontrak_file_path)!}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95"
                                                    >
                                                        <FileText className="w-3.5 h-3.5" />
                                                        Buka File
                                                    </a>
                                                ) : '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
