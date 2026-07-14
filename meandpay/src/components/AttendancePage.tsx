import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import * as XLSX from 'xlsx';
import { Clock, Search, Download, MapPin, User, Calendar, ArrowUpRight, ArrowDownLeft, ExternalLink, Loader2, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { Card, SectionTitle, FormInput, FormSelect, FormSearchSelect, Toast } from './common/FormUI';

interface AbsensiData { id: string; tanggal: string; jam_absen: string | null; telat: string; foto_jam_absen: string | null; jam_pulang: string | null; pulang_cepat: string; foto_jam_pulang: string | null; keterangan_masuk: string | null; keterangan_pulang: string | null; status_absen: string; users: { name: string; foto_karyawan?: string | null; lokasi?: { nama_lokasi: string } | null } | null; }

const fmtPhoto = (u: any) => u ? (u.startsWith('http') ? u : `${import.meta.env.VITE_API_MEANDPAY.replace('/api', '')}${u.startsWith('/') ? '' : '/'}${u}`) : '';

export function AttendancePage() {
    const [data, setData] = useState<AbsensiData[]>([]);
    const [loading, setLoading] = useState(true);
    const [locations, setLocations] = useState<{ id: string; nama_lokasi: string }[]>([]);
    const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit] = useState(20);
    
    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [lokasiId, setLokasiId] = useState('');
    const [tanggal, setTanggal] = useState('');

    const fetchData = async (pageNum = page) => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: pageNum.toString(),
                limit: limit.toString(),
                user_id: searchTerm,
                lokasi_id: lokasiId,
                tanggal: tanggal // Input date is already YYYY-MM-DD
            });

            const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/absensi?${queryParams.toString()}`, { 
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } 
            });
            const json = await res.json();
            if (json.success) {
                setData(json.data);
                setTotalPages(json.pagination?.totalPages || 1);
            }
        } catch (err) {
            console.error('Error fetching attendance:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchLocations = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/lokasi`, { 
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } 
            });
            const json = await res.json();
            if (json.success) setLocations(json.data);
        } catch (err) {
            console.error('Error fetching locations:', err);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/users?limit=1000`, { 
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } 
            });
            const json = await res.json();
            if (json.success) setEmployees(json.data);
        } catch (err) {
            console.error('Error fetching employees:', err);
        }
    };

    useEffect(() => {
        fetchLocations();
        fetchEmployees();
        fetchData(1);
    }, []);

    const handleFilter = () => {
        setPage(1);
        fetchData(1);
    };

    const logs = data.flatMap(i => {
        const events = [
            i.jam_absen && { id: `${i.id}-in`, name: i.users?.name, photoUser: i.users?.foto_karyawan, loc: i.users?.lokasi?.nama_lokasi, type: 'Masuk', date: i.tanggal, time: i.jam_absen, photo: i.foto_jam_absen, ket: i.keterangan_masuk, status: i.status_absen === 'Libur' ? 'Libur' : (Number(i.telat) > 0 ? 'Terlambat' : 'Hadir') },
            i.jam_pulang && { id: `${i.id}-out`, name: i.users?.name, photoUser: i.users?.foto_karyawan, loc: i.users?.lokasi?.nama_lokasi, type: 'Pulang', date: i.tanggal, time: i.jam_pulang, photo: i.foto_jam_pulang, ket: i.keterangan_pulang, status: i.status_absen === 'Libur' ? 'Libur' : (Number(i.pulang_cepat) > 0 ? 'Pulang Cepat' : 'Hadir') }
        ].filter(Boolean);

        if (events.length === 0) {
            return [{ 
                id: i.id, 
                name: i.users?.name, 
                photoUser: i.users?.foto_karyawan, 
                loc: i.users?.lokasi?.nama_lokasi, 
                type: 'Belum Absen', 
                date: i.tanggal, 
                time: '-', 
                photo: null, 
                ket: null, 
                status: i.status_absen || 'Belum Absen' 
            }];
        }
        return events;
    }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const exportEx = () => {
        const ws = XLSX.utils.json_to_sheet(logs.map((l: any, i) => ({ No: i + 1, Nama: l.name, Lokasi: l.loc, Tipe: l.type, Tanggal: l.date, Jam: l.time, Status: l.status })));
        const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Absensi');
        XLSX.writeFile(wb, `Absensi_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto space-y-6 pb-20">
            <div className="flex justify-between items-end">
                <div><h1 className="text-3xl font-black">Log Absensi</h1><p className="text-slate-500">Monitoring kehadiran pegawai secara real-time</p></div>
                <button onClick={exportEx} className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-100 transition-all active:scale-95"><Download size={18}/> Export Excel</button>
            </div>

            <Card className="p-0 overflow-hidden">
                <div className="p-6 bg-slate-50/50 grid grid-cols-4 gap-4">
                    <FormSearchSelect 
                        placeholder="Cari nama..." 
                        options={employees.map(e => ({ label: e.name, value: e.id }))}
                        icon={Search} 
                        value={searchTerm}
                        onChange={(_: any, val: string) => setSearchTerm(val)} 
                    />
                    <FormSearchSelect 
                        placeholder="Semua Lokasi" 
                        options={locations.map(l => ({ label: l.nama_lokasi, value: l.id }))} 
                        icon={MapPin} 
                        value={lokasiId}
                        onChange={(_: any, val: string) => setLokasiId(val)} 
                    />
                    <FormInput 
                        type="date" 
                        icon={Calendar} 
                        value={tanggal}
                        onChange={(_: any, val: string) => setTanggal(val)} 
                    />
                    <div className="flex gap-2">
                        <button 
                            onClick={handleFilter}
                            className="flex-1 bg-slate-900 text-white rounded-xl font-bold transition-all active:scale-95 hover:bg-slate-800 shadow-lg shadow-slate-200"
                        >
                            Filter
                        </button>
                        <button 
                            onClick={() => {
                                setSearchTerm('');
                                setLokasiId('');
                                setTanggal('');
                                setPage(1);
                                fetchData(1);
                            }}
                            className="px-4 bg-slate-100 text-slate-600 rounded-xl font-bold transition-all active:scale-95 hover:bg-slate-200 border border-slate-200"
                            title="Reset Filter"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="py-3.5 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-10 text-left">#</th>
                                <th className="py-3.5 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-left">Pegawai</th>
                                <th className="py-3.5 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-left">Lokasi</th>
                                <th className="py-3.5 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-left">Tipe</th>
                                <th className="py-3.5 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-left">Waktu</th>
                                <th className="py-3.5 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-left">Status</th>
                                <th className="py-3.5 px-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? <tr><td colSpan={7} className="py-20 text-center"><Loader2 className="animate-spin inline text-indigo-600" /></td></tr> : (
                                logs.length === 0 ? <tr><td colSpan={7} className="py-20 text-center text-slate-400 font-medium">Tidak ada data absensi ditemukan</td></tr> : logs.map((l: any, i) => (
                                    <tr key={l.id} className="group hover:bg-slate-50/60 transition-colors">
                                        <td className="py-4 px-6 text-xs font-semibold text-slate-300 group-hover:text-slate-500 transition-colors">
                                            {String((page - 1) * limit + i + 1).padStart(2, '0')}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="size-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center overflow-hidden shadow-sm">
                                                    {l.photoUser ? <img src={fmtPhoto(l.photoUser)} className="size-full object-cover" /> : <User size={14} className="text-slate-400"/>}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800 leading-tight">{l.name}</p>
                                                    <p className="text-[11px] text-slate-400">ID Absen: {l.id.split('-')[0]}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-1.5 text-slate-500 whitespace-nowrap">
                                                <MapPin className="w-3 h-3 shrink-0" />
                                                <span className="text-xs">{l.loc || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={cn(
                                                "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border", 
                                                l.type === 'Masuk' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                                                l.type === 'Pulang' ? "bg-rose-50 text-rose-600 border-rose-100" :
                                                "bg-slate-50 text-slate-500 border-slate-100"
                                            )}>
                                                {l.type === 'Masuk' ? <ArrowDownLeft size={10}/> : 
                                                 l.type === 'Pulang' ? <ArrowUpRight size={10}/> : 
                                                 <Clock size={10}/>} {l.type}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="text-xs font-semibold text-slate-600">{l.date ? new Date(l.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">{l.time}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={cn("inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border", l.status === 'Hadir' ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600")}>
                                                {l.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                                                <ExternalLink size={14}/>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="p-4 border-t bg-slate-50/30 flex justify-between items-center">
                        <span className="text-xs text-slate-500 font-medium">Halaman {page} dari {totalPages}</span>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => { setPage(p => Math.max(1, p - 1)); fetchData(Math.max(1, page - 1)); }}
                                disabled={page === 1}
                                className="px-4 py-2 bg-white border rounded-xl text-xs font-bold disabled:opacity-50 transition-all active:scale-95 shadow-sm"
                            >
                                Sebelumnya
                            </button>
                            <button 
                                onClick={() => { setPage(p => Math.min(totalPages, p + 1)); fetchData(Math.min(totalPages, page + 1)); }}
                                disabled={page === totalPages}
                                className="px-4 py-2 bg-white border rounded-xl text-xs font-bold disabled:opacity-50 transition-all active:scale-95 shadow-sm"
                            >
                                Berikutnya
                            </button>
                        </div>
                    </div>
                )}
            </Card>
        </motion.div>
    );
}
