import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Search, Users, Calendar, Loader2, ChevronRight,
  Upload, FileSpreadsheet, Download, X, Check, Clock
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { cn, formatPhotoUrl } from '../lib/utils';
import { MappingShift } from './MappingShift';
import { generateJadwalDinas, parseDinasExcel } from './jadwalDinasExcel';

const BASE_URL = import.meta.env.VITE_API_MEANDPAY;

/* ─── Types ─────────────────────────────────────────────── */
interface Shift {
  id: string;
  nama_shift: string;
  jam_masuk: string;
  jam_keluar: string;
}

interface ImportMappingRow {
  rowIndex: number;
  user_id: string;
  user_name?: string;
  shift_id: string;
  shift_name?: string;
  tanggal_mulai: string;
  tanggal_akhir: string;
  lock_location: number;
  status: 'pending' | 'success' | 'error';
  message?: string;
}

interface Employee {
  id: string;
  name: string;
  username: string;
  foto_karyawan?: string | null;
  jabatan?: { id: string; nama_jabatan: string } | null;
  lokasi?: { id: string; nama_lokasi: string } | null;
}

interface MobileKoordinatorShiftPageProps {
  onBack: () => void;
}

/* ─── Helpers ────────────────────────────────────────────── */
function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

const avatarGradients = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-indigo-600',
  'from-sky-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-fuchsia-500 to-pink-600',
  'from-teal-500 to-cyan-600',
];

function avatarGradient(id: string) {
  return avatarGradients[parseInt(id) % avatarGradients.length];
}

/* ─── Component Helpers ──────────────────────────────────── */
function generateMappingTemplate(availableShifts: Shift[], allEmployees: Employee[] = []) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Template
  const headers = [
    'ID Karyawan*', 'Nama Karyawan (Info)', 'ID Shift*', 'Nama Shift (Info)',
    'Tanggal Mulai* (DD/MM/YYYY)', 'Tanggal Akhir* (DD/MM/YYYY)', 'Lock Location (1/0)'
  ];
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const fmt = (d: Date) => {
    const day = String(d.getDate()).padStart(2, '0');
    const mon = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${mon}/${d.getFullYear()}`;
  };

  const contoh = [
    ['101', 'Budi Santoso', '1', 'Shift Pagi', fmt(firstDay), fmt(lastDay), '1'],
    ['102', 'Siti Rahayu', '2', 'Shift Siang', fmt(firstDay), fmt(lastDay), '1'],
  ];

  const ws1 = XLSX.utils.aoa_to_sheet([headers, ...contoh]);
  ws1['!cols'] = [
    { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 25 },
    { wch: 25 }, { wch: 25 }, { wch: 18 }
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'Import Mapping Shift');

  const shiftData = availableShifts.map(s => [s.id, s.nama_shift, s.jam_masuk, s.jam_keluar]);
  const ws2 = XLSX.utils.aoa_to_sheet([['ID Shift', 'Nama Shift', 'Jam Masuk', 'Jam Keluar'], ...shiftData]);
  ws2['!cols'] = [{ wch: 10 }, { wch: 25 }, { wch: 12 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'Referensi Shift');

  if (allEmployees.length > 0) {
    const empData = allEmployees.map(e => [e.id, e.name, e.username, e.jabatan?.nama_jabatan || '-']);
    const ws3 = XLSX.utils.aoa_to_sheet([['ID Karyawan', 'Nama Karyawan', 'Username', 'Jabatan'], ...empData]);
    ws3['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, ws3, 'Referensi Karyawan');
  }

  XLSX.writeFile(wb, 'Template_Import_Shift_Pegawai.xlsx');
}

function parseMappingExcel(file: File): Promise<ImportMappingRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const raw = XLSX.utils.sheet_to_json<any>(ws, { defval: '' });

        const getVal = (row: any, keys: string[]) => {
          for (const k of keys) {
            const v = row[k] ?? row[k.toLowerCase()] ?? '';
            if (v !== '') return String(v).trim();
          }
          return '';
        };

        const rows: ImportMappingRow[] = raw
          .slice(0, 1000)
          .map((row: any, i: number) => {
            const startDateRaw = getVal(row, ['Tanggal Mulai*', 'Tanggal Mulai', 'start_date', 'Tanggal Mulai* (DD/MM/YYYY)']);
            const endDateRaw = getVal(row, ['Tanggal Akhir*', 'Tanggal Akhir', 'end_date', 'Tanggal Akhir* (DD/MM/YYYY)']);
            
            const formatDate = (v: any) => {
              if (!v) return '';
              if (v instanceof Date) {
                const y = v.getUTCFullYear();
                const m = String(v.getUTCMonth() + 1).padStart(2, '0');
                const d = String(v.getUTCDate()).padStart(2, '0');
                return `${y}-${m}-${d}`;
              }
              const s = String(v).trim();
              if (s.includes('/')) {
                const parts = s.split('/');
                if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
              }
              return s;
            };

            return {
              rowIndex: 0,
              user_id: getVal(row, ['ID Karyawan*', 'id_user', 'user_id', 'id_karyawan']),
              user_name: getVal(row, ['Nama Karyawan (Info)', 'nama_karyawan', 'user_name']),
              shift_id: getVal(row, ['ID Shift*', 'id_shift', 'shift_id']),
              shift_name: getVal(row, ['Nama Shift (Info)', 'nama_shift', 'shift_name']),
              tanggal_mulai: formatDate(startDateRaw),
              tanggal_akhir: formatDate(endDateRaw),
              lock_location: 1, // ALWAYS LOCK LOCATION
              status: 'pending' as const,
            };
          })
          .filter((r: ImportMappingRow) => r.user_id && r.shift_id)
          .map((r: ImportMappingRow, i: number) => ({ ...r, rowIndex: i + 1 }));

        resolve(rows);
      } catch (err) {
        reject(new Error('File tidak valid atau format tidak sesuai template'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsArrayBuffer(file);
  });
}

function ImportMappingModal({ shifts, allEmployees, onClose, onSuccess }: { shifts: Shift[]; allEmployees: Employee[]; onClose: () => void; onSuccess: () => void; }) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'done'>('upload');
  const [rows, setRows] = useState<ImportMappingRow[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string } | null>(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ total: number; success: number; failed: number } | null>(null);
  const [filterError, setFilterError] = useState(false);
  const now = new Date();
  const [dlMonth, setDlMonth] = useState(now.getMonth());
  const [dlYear, setDlYear] = useState(now.getFullYear());
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.match(/\\.(xlsx|xls|csv)$/i)) {
      Swal.fire({ icon: 'error', title: 'Format Tidak Didukung', text: 'Gunakan .xlsx, .xls, atau .csv' });
      return;
    }
    try {
      let parsed: ImportMappingRow[] = [];
      try {
        parsed = await parseDinasExcel(file, shifts, allEmployees);
      } catch {
        parsed = await parseMappingExcel(file);
      }
      
      setRows(parsed);
      setFileInfo({
        name: file.name,
        size: file.size < 1024 * 1024
          ? `${(file.size / 1024).toFixed(1)} KB`
          : `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      });
      setStep('preview');
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Gagal Membaca File', text: err.message || 'Gagal membaca file Excel' });
    }
  };

  const handleImport = async () => {
    setStep('importing');
    setProgress(0);

    const updated = [...rows];
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const res = await fetch(`${BASE_URL}/mapping-shifts/bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            user_id: row.user_id,
            shift_id: row.shift_id,
            start_date: row.tanggal_mulai,
            end_date: row.tanggal_akhir,
            lock_location: 1 // ALWAYS LOCK LOCATION
          })
        });
        const json = await res.json();
        if (json.success) {
          updated[i] = { ...row, status: 'success', message: 'Berhasil' };
          successCount++;
        } else {
          updated[i] = { ...row, status: 'error', message: json.message || 'Gagal' };
          failedCount++;
        }
      } catch (err: any) {
        updated[i] = { ...row, status: 'error', message: err.message || 'Error Server' };
        failedCount++;
      }
      setRows([...updated]);
      setProgress(Math.round(((i + 1) / rows.length) * 100));
      if (rows.length < 50) await new Promise(r => setTimeout(r, 50));
    }

    setResult({ total: rows.length, success: successCount, failed: failedCount });
    setStep('done');
    if (successCount > 0) onSuccess();
  };

  const errorCount = rows.filter(r => r.status === 'error').length;
  const displayRows = filterError ? rows.filter(r => r.status === 'error') : rows;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Import Jadwal Shift</h3>
              <p className="text-xs text-slate-400 font-medium">Upload file Excel sesuai template</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50/30">
          {step === 'upload' && (
            <div className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl bg-teal-50 border border-teal-100 gap-4">
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-teal-600 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Download Template Import</h4>
                    <p className="text-xs text-slate-500">Isi data jadwal shift sesuai format</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={dlMonth}
                    onChange={e => setDlMonth(Number(e.target.value))}
                    className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i} value={i}>{new Date(2000, i, 1).toLocaleString('id-ID', { month: 'short' })}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={dlYear}
                    onChange={e => setDlYear(Number(e.target.value))}
                    className="w-16 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none"
                    min={2020}
                    max={2100}
                  />
                  <button onClick={() => generateJadwalDinas(allEmployees, shifts, [], dlYear, dlMonth)} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl whitespace-nowrap">
                    Unduh Template
                  </button>
                </div>
              </div>
              <div
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={e => { e.preventDefault(); setIsDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all",
                  isDragOver ? "border-teal-400 bg-teal-50" : "border-slate-200 bg-white hover:border-teal-300"
                )}
              >
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Tap atau Drag file Excel</p>
                    <p className="text-xs text-slate-400 mt-1">.xlsx, .xls, .csv</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="flex flex-col h-full">
              <div className="px-6 py-4 border-b border-slate-100 bg-white flex justify-between items-center text-sm">
                <span className="font-bold text-slate-600">{rows.length} Baris</span>
                {errorCount > 0 && (
                  <button onClick={() => setFilterError(!filterError)} className="text-rose-500 text-xs font-bold bg-rose-50 px-3 py-1.5 rounded-lg">
                    {filterError ? 'Semua' : 'Error Saja'}
                  </button>
                )}
              </div>
              <div className="overflow-auto max-h-[300px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-400 sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Baris</th>
                      <th className="px-4 py-3">Pegawai</th>
                      <th className="px-4 py-3">Shift</th>
                      <th className="px-4 py-3">Mulai</th>
                      <th className="px-4 py-3">Akhir</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-3">{r.rowIndex}</td>
                        <td className="px-4 py-3 font-bold">{r.user_name || r.user_id}</td>
                        <td className="px-4 py-3">{r.shift_name || r.shift_id}</td>
                        <td className="px-4 py-3">{r.tanggal_mulai}</td>
                        <td className="px-4 py-3">{r.tanggal_akhir}</td>
                        <td className="px-4 py-3">
                          <span className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase", r.status === 'error' ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-500")}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="p-12 text-center">
              <Loader2 className="w-10 h-10 text-teal-500 animate-spin mx-auto mb-4" />
              <h4 className="text-lg font-bold">Mengimport... {progress}%</h4>
            </div>
          )}

          {step === 'done' && result && (
            <div className="p-10 text-center space-y-6">
              <div className={cn("w-20 h-20 rounded-full mx-auto flex items-center justify-center", result.failed === 0 ? "bg-teal-500" : "bg-amber-500")}>
                <Check className="w-10 h-10 text-white" />
              </div>
              <h4 className="text-xl font-bold">Selesai!</h4>
              <div className="flex gap-4 justify-center">
                <div className="px-6 py-4 bg-teal-50 rounded-2xl text-teal-600 font-bold">{result.success} Sukses</div>
                <div className="px-6 py-4 bg-rose-50 rounded-2xl text-rose-600 font-bold">{result.failed} Gagal</div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          {step === 'preview' && (
            <button onClick={handleImport} className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm">
              Mulai Import
            </button>
          )}
          {step === 'done' && (
            <button onClick={onClose} className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm">
              Tutup
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────── */
export function MobileKoordinatorShiftPage({ onBack }: MobileKoordinatorShiftPageProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showImport, setShowImport] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [empRes, shiftRes] = await Promise.all([
        fetch(`${BASE_URL}/users?limit=1000`, { headers }),
        fetch(`${BASE_URL}/shifts`, { headers })
      ]);
      
      const empJson = await empRes.json();
      const shiftJson = await shiftRes.json();
      
      if (empJson.success) setEmployees(empJson.data || []);
      if (shiftJson.success) setShifts(shiftJson.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.jabatan?.nama_jabatan || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.lokasi?.nama_lokasi || '').toLowerCase().includes(search.toLowerCase())
  );

  // When an employee is selected, show the MappingShift component
  if (selectedEmployee) {
    return (
      <MappingShift
        employee={selectedEmployee}
        onBack={() => setSelectedEmployee(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <AnimatePresence>
        {showImport && (
          <ImportMappingModal
            shifts={shifts}
            allEmployees={employees}
            onClose={() => setShowImport(false)}
            onSuccess={() => {}}
          />
        )}
      </AnimatePresence>
      {/* ── Header ── */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={onBack} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Kelola Jadwal Shift</h1>
            <p className="text-xs text-slate-400 mt-0.5">Pilih pegawai untuk mengatur jadwal shift</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 rounded-full">
            <Users className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-bold text-teal-700">{filtered.length}</span>
          </div>
        </div>

        {/* ── Search & Actions ── */}
        <div className="px-4 pb-3 space-y-3">
          <button
            onClick={() => setShowImport(true)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-teal-100 transition-all active:scale-[0.98]"
          >
            <FileSpreadsheet className="w-4 h-4" /> Import Excel
          </button>
          
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama, jabatan, lokasi..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 transition-colors">
                <span className="text-slate-400 text-xs font-bold">✕</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Employee List ── */}
      <div className="px-4 py-4 space-y-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
            <p className="text-sm text-slate-400 font-medium">Memuat data pegawai...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Users className="w-10 h-10 text-slate-300" />
            <p className="text-sm text-slate-400 font-medium">
              {search ? 'Tidak ditemukan pegawai yang cocok' : 'Belum ada data pegawai'}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map((emp, i) => (
              <motion.button
                key={emp.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2, delay: i * 0.02 }}
                onClick={() => setSelectedEmployee(emp)}
                className="w-full flex items-center gap-3.5 p-3.5 bg-white rounded-2xl border border-slate-100 hover:border-teal-200 hover:shadow-md hover:shadow-teal-50 active:scale-[0.98] transition-all group"
              >
                {/* Avatar */}
                {emp.foto_karyawan ? (
                  <img
                    src={formatPhotoUrl(emp.foto_karyawan)}
                    alt={emp.name}
                    className="w-11 h-11 rounded-xl object-cover ring-2 ring-slate-100 group-hover:ring-teal-200 transition-all"
                  />
                ) : (
                  <div className={cn(
                    'w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-sm font-bold ring-2 ring-slate-100 group-hover:ring-teal-200 transition-all',
                    avatarGradient(emp.id)
                  )}>
                    {initials(emp.name)}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-teal-700 transition-colors">{emp.name}</p>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {emp.jabatan?.nama_jabatan || 'Belum ada jabatan'}
                    {emp.lokasi?.nama_lokasi ? ` · ${emp.lokasi.nama_lokasi}` : ''}
                  </p>
                </div>

                {/* Arrow */}
                <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                  <Calendar className="w-4 h-4 text-teal-500" />
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-500 transition-colors" />
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
