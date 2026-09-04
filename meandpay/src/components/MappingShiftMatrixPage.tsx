import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save, Loader2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from './Toast';
import Swal from 'sweetalert2';

export function MappingShiftMatrixPage() {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [employees, setEmployees] = useState<any[]>([]);
    const [shifts, setShifts] = useState<any[]>([]);
    const [matrix, setMatrix] = useState<Record<string, Record<string, string>>>({}); // { userId: { dateStr: shiftId } }
    
    // State for Month/Year selection
    const [currentDate, setCurrentDate] = useState(new Date());
    const { addToast, updateToast } = useToast();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-11
    
    // Get all days in month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    useEffect(() => {
        fetchData();
    }, [currentDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, shiftsRes, mappingRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_MEANDPAY}/users?limit=1000`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
                fetch(`${import.meta.env.VITE_API_MEANDPAY}/shifts`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
                fetch(`${import.meta.env.VITE_API_MEANDPAY}/mapping-shifts?start_date=${year}-${String(month+1).padStart(2, '0')}-01&end_date=${year}-${String(month+1).padStart(2, '0')}-${daysInMonth}&limit=10000`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
            ]);

            const usersJson = await usersRes.json();
            const shiftsJson = await shiftsRes.json();
            const mappingJson = await mappingRes.json();

            if (usersJson.success) setEmployees(usersJson.data);
            if (shiftsJson.success) setShifts(shiftsJson.data);

            // Populate initial matrix
            if (mappingJson.success) {
                const newMatrix: Record<string, Record<string, string>> = {};
                mappingJson.data.forEach((m: any) => {
                    const uid = String(m.user_id);
                    // Format m.tanggal to YYYY-MM-DD
                    const d = new Date(m.tanggal);
                    const day = d.getDate(); // 1-31
                    if (!newMatrix[uid]) newMatrix[uid] = {};
                    newMatrix[uid][day.toString()] = String(m.shift_id);
                });
                setMatrix(newMatrix);
            }
        } catch (error) {
            console.error("Error fetching matrix data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCellChange = (userId: string, day: number, shiftId: string) => {
        setMatrix(prev => ({
            ...prev,
            [userId]: {
                ...(prev[userId] || {}),
                [day.toString()]: shiftId
            }
        }));
    };

    const handleSave = async () => {
        // Collect all changes into an array
        const payload: any[] = [];
        
        Object.entries(matrix).forEach(([userId, daysRecord]) => {
            Object.entries(daysRecord).forEach(([dayStr, shiftId]) => {
                const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(dayStr).padStart(2, '0')}`;
                payload.push({
                    user_id: userId,
                    tanggal: dateStr,
                    shift_id: shiftId || null
                });
            });
        });

        if (payload.length === 0) {
            Swal.fire('Info', 'Belum ada jadwal yang diisi', 'info');
            return;
        }

        setSaving(true);
        const toastId = addToast({ type: 'loading', title: 'Menyimpan Matrix', message: 'Sedang menyimpan jadwal...' });
        try {
            const res = await fetch(`${import.meta.env.VITE_API_MEANDPAY}/mapping-shifts/matrix`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ matrix: payload })
            });
            const json = await res.json();
            if (json.success) {
                updateToast(toastId, { type: 'success', title: 'Berhasil', message: 'Matrix Jadwal berhasil disimpan!' });
                fetchData();
            } else {
                updateToast(toastId, { type: 'error', title: 'Gagal', message: json.message });
            }
        } catch (error: any) {
            updateToast(toastId, { type: 'error', title: 'Error', message: error.message });
        } finally {
            setSaving(false);
        }
    };

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    // Get short code for shift name (e.g., Pagi -> P)
    const getShiftCode = (shiftId: string) => {
        const s = shifts.find(x => String(x.id) === String(shiftId));
        if (!s) return '';
        const name = s.nama_shift.toLowerCase();
        if (name.includes('pagi')) return 'P';
        if (name.includes('sore')) return 'S';
        if (name.includes('malam')) return 'M';
        if (name.includes('libur')) return 'L';
        return name.charAt(0).toUpperCase();
    };

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-full mx-auto space-y-6 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Matrix Jadwal Shift</h1>
                    <p className="text-sm text-slate-400 mt-1">Kelola jadwal shift pegawai secara massal bulanan</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleSave} disabled={saving || loading} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Simpan Semua
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col h-[calc(100vh-200px)]">
                {/* Toolbar */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <button onClick={prevMonth} className="p-2 hover:bg-slate-200 rounded-xl transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                        <h2 className="text-lg font-black text-slate-800 w-48 text-center uppercase tracking-widest">
                            {currentDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
                        </h2>
                        <button onClick={nextMonth} className="p-2 hover:bg-slate-200 rounded-xl transition-colors"><ChevronRight className="w-5 h-5" /></button>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                        <div className="flex gap-3">
                            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-indigo-100 border border-indigo-300 rounded"></div> = Pagi</span>
                            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-100 border border-amber-300 rounded"></div> = Sore</span>
                            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-800 border border-slate-600 rounded"></div> = Malam</span>
                            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-rose-100 border border-rose-300 rounded"></div> = Libur</span>
                        </div>
                        <button onClick={fetchData} className="p-2 hover:bg-slate-200 rounded-xl transition-colors"><RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /></button>
                    </div>
                </div>

                {/* Table container */}
                <div className="flex-1 overflow-auto custom-scrollbar relative bg-slate-50">
                    {loading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/80 backdrop-blur-sm z-50">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                            <span className="text-sm font-bold text-slate-400">Memuat Matrix...</span>
                        </div>
                    ) : null}
                    
                    <table className="w-max min-w-full border-collapse bg-white">
                        <thead className="sticky top-0 z-40">
                            <tr className="bg-slate-100 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                <th className="sticky left-0 bg-slate-100 px-4 py-3 border border-slate-200 w-12 text-center shadow-[2px_0_5px_rgba(0,0,0,0.05)] z-20">No</th>
                                <th className="sticky left-12 bg-slate-100 px-4 py-3 border border-slate-200 w-64 text-left shadow-[2px_0_5px_rgba(0,0,0,0.05)] z-20">Nama Pegawai</th>
                                {days.map(d => (
                                    <th key={d} className={cn("px-2 py-3 border border-slate-200 w-10 text-center", (new Date(year, month, d).getDay() === 0) && "bg-rose-100 text-rose-600")}>
                                        {d}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="text-xs">
                            {employees.map((emp, idx) => (
                                <tr key={emp.id} className="hover:bg-indigo-50/30 transition-colors">
                                    <td className="sticky left-0 bg-white px-4 py-2 border border-slate-200 text-center font-bold text-slate-400 shadow-[2px_0_5px_rgba(0,0,0,0.02)] z-10">{idx + 1}</td>
                                    <td className="sticky left-12 bg-white px-4 py-2 border border-slate-200 font-bold text-slate-700 shadow-[2px_0_5px_rgba(0,0,0,0.02)] z-10 truncate max-w-[16rem]">
                                        <div className="flex flex-col">
                                            <span>{emp.name}</span>
                                            <span className="text-[9px] text-slate-400">{emp.jabatan?.nama_jabatan || '-'}</span>
                                        </div>
                                    </td>
                                    {days.map(day => {
                                        const isSunday = new Date(year, month, day).getDay() === 0;
                                        const val = matrix[emp.id]?.[day.toString()] || '';
                                        const code = getShiftCode(val);
                                        
                                        // Styling based on shift
                                        let cellClass = "bg-transparent";
                                        if (code === 'P') cellClass = "bg-indigo-50 text-indigo-700 font-black";
                                        else if (code === 'S') cellClass = "bg-amber-50 text-amber-700 font-black";
                                        else if (code === 'M') cellClass = "bg-slate-800 text-white font-black";
                                        else if (code === 'L') cellClass = "bg-rose-50 text-rose-700 font-black";
                                        else if (isSunday && !val) cellClass = "bg-rose-50/50";

                                        return (
                                            <td key={day} className={cn("border border-slate-200 p-0 text-center relative w-10 min-w-[2.5rem]", cellClass)}>
                                                <select
                                                    value={val}
                                                    onChange={e => handleCellChange(emp.id, day, e.target.value)}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    title="Pilih Shift"
                                                >
                                                    <option value="">-</option>
                                                    {shifts.map(s => (
                                                        <option key={s.id} value={s.id}>{s.nama_shift}</option>
                                                    ))}
                                                </select>
                                                <div className="w-full h-full min-h-[2.5rem] flex items-center justify-center pointer-events-none">
                                                    {code || (val ? '?' : '-')}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
}
