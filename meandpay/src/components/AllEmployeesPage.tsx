import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import {
  Users, Search, Plus, Download, Upload, Edit2, Trash2,
  MapPin, Filter, ChevronLeft, ChevronRight, ChevronDown,
  Clock, TrendingUp, UserCheck, X, QrCode,
  Key, Map, FileText, ScanFace, Loader2, AlertCircle, RefreshCw,
  Eye, EyeOff, Lock, ScrollText, AlertTriangle, FileSpreadsheet,
  CheckCircle2, ImageIcon, Briefcase, ShieldCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import QRCode from 'react-qr-code';
import Swal from 'sweetalert2';
import { AddEmployeeForm } from './Addemployeeform';
import { EditEmployeeForm } from './EditEmployeeForm';
import { MappingDinasLuar } from './MappingDinasLuar';
import { MappingShift } from './MappingShift';
import { ContractsEmployeeDetail } from './ContractsEmployeeDetail';
import { ShiftEmployeesPage } from './ShiftEmployeesPage';
import { useToast } from './Toast';

const BASE_URL = import.meta.env.VITE_API_MEANDPAY;

/* ─── Types ─────────────────────────────────────────────── */
interface Employee {
  id: string;
  name: string;
  username: string;
  foto_karyawan: string | null;
  foto_face_recognition: string | null;
  email: string | null;
  telepon: string | null;
  gender: string | null;
  tgl_join: string | null;
  masa_berlaku: string | null;
  is_admin: string | null;
  jabatan: { id: string; nama_jabatan: string } | null;
  lokasi: { id: string; nama_lokasi: string } | null;
  status_pajak: { id: string; name: string } | null;
  roles: string[];
  has_dokumen: boolean;
  is_keluar: boolean;
  // Additional fields for export
  tgl_lahir?: string | null;
  alamat?: string | null;
  darurat_nama?: string | null;
  darurat_telepon?: string | null;
  darurat_hubungan?: string | null;
  ktp?: string | null;
  kartu_keluarga?: string | null;
  bpjs_kesehatan?: string | null;
  bpjs_ketenagakerjaan?: string | null;
  npwp?: string | null;
  sim?: string | null;
  no_pkwt?: string | null;
  no_kontrak?: string | null;
  tanggal_mulai_pkwt?: string | null;
  tanggal_berakhir_pkwt?: string | null;
  rekening?: string | null;
  nama_rekening?: string | null;
  izin_cuti?: number | string | null;
  izin_lainnya?: number | string | null;
  izin_telat?: number | string | null;
  izin_pulang_cepat?: number | string | null;
  gaji_pokok?: number | string | null;
  tunjangan_makan?: number | string | null;
  tunjangan_transport?: number | string | null;
  tunjangan_bpjs_kesehatan?: number | string | null;
  tunjangan_bpjs_ketenagakerjaan?: number | string | null;
  lembur?: number | string | null;
  kehadiran?: number | string | null;
  thr?: number | string | null;
  bonus_pribadi?: number | string | null;
  bonus_team?: number | string | null;
  bonus_jackpot?: number | string | null;
  izin?: number | string | null;
  terlambat?: number | string | null;
  mangkir?: number | string | null;
  saldo_kasbon?: number | string | null;
  potongan_bpjs_kesehatan?: number | string | null;
  potongan_bpjs_ketenagakerjaan?: number | string | null;
  cuti_melahirkan?: number | string | null;
  cuti_kematian?: number | string | null;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ImportRow {
  rowIndex: number;
  nama: string;
  username: string;
  password: string;
  email?: string;
  telepon?: string;
  gender?: string;
  jabatan?: string;
  lokasi?: string;
  status_pajak?: string;
  role?: string;
  is_admin?: string;
  tgl_join?: string;
  masa_berlaku?: string;
  cuti_melahirkan?: string;
  cuti_kematian?: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
}

/* ─── Helpers ────────────────────────────────────────────── */
function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

const avatarColors = [
  'bg-violet-500', 'bg-indigo-500', 'bg-sky-500', 'bg-emerald-500',
  'bg-amber-500', 'bg-rose-500', 'bg-pink-500', 'bg-teal-500',
];

function avatarColor(id: string) {
  return avatarColors[parseInt(id) % avatarColors.length];
}

function formatDate(iso: string | null) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getPhotoUrl(path: string | null) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const filename = path.includes('/') ? path.split('/').pop() : path;
  return `${BASE_URL.replace('/api', '')}/uploads/${filename}`;
}

/* ─── Template Generator ─────────────────────────────────── */
function generateImportTemplate() {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Data Pegawai
  const headers = [
    'Nama*', 'Username*', 'Password*', 'Email', 'Telepon',
    'Gender', 'Jabatan', 'Lokasi', 'Status Pajak',
    'Role', 'Dashboard', 'Tanggal Join', 'Masa Berlaku',
    'Cuti Melahirkan', 'Cuti Kematian',
  ];
  const contoh = [
    ['Budi Santoso', 'budi.santoso', 'password123', 'budi@email.com', '081234567890', 'Laki-laki', 'Staff', 'Kantor Pusat', 'TK/0', 'karyawan', 'user', '01/01/2024', '31/12/2025', '90', '3'],
    ['Siti Rahayu', 'siti.rahayu', 'password456', 'siti@email.com', '089876543210', 'Perempuan', 'Manager', 'Cabang Jakarta', 'K/1', 'karyawan', 'admin', '15/03/2023', '31/12/2026', '90', '3'],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet([headers, ...contoh]);
  ws1['!cols'] = [
    { wch: 26 }, { wch: 18 }, { wch: 15 }, { wch: 28 }, { wch: 16 },
    { wch: 14 }, { wch: 20 }, { wch: 22 }, { wch: 14 },
    { wch: 14 }, { wch: 12 }, { wch: 15 }, { wch: 15 },
  ];
  ws1['!freeze'] = { xSplit: 0, ySplit: 1 };
  XLSX.utils.book_append_sheet(wb, ws1, 'Data Pegawai');

  // Sheet 2: Petunjuk
  const petunjuk = [
    ['PETUNJUK PENGISIAN IMPORT PEGAWAI'],
    [''],
    ['Kolom', 'Keterangan', 'Wajib?', 'Contoh Nilai'],
    ['Nama*', 'Nama lengkap pegawai', 'YA', 'Budi Santoso'],
    ['Username*', 'Username unik untuk login (huruf kecil, tanpa spasi)', 'YA', 'budi.santoso'],
    ['Password*', 'Password awal (minimal 6 karakter)', 'YA', 'password123'],
    ['Email', 'Alamat email pegawai', 'Tidak', 'budi@email.com'],
    ['Telepon', 'Nomor telepon pegawai', 'Tidak', '081234567890'],
    ['Gender', 'Jenis kelamin', 'Tidak', 'Laki-laki / Perempuan'],
    ['Jabatan', 'Nama jabatan (harus terdaftar di sistem)', 'Tidak', 'Staff'],
    ['Lokasi', 'Nama lokasi kerja (harus terdaftar di sistem)', 'Tidak', 'Kantor Pusat'],
    ['Status Pajak', 'Status PTKP pegawai', 'Tidak', 'TK/0, K/0, K/1, K/2, K/3'],
    ['Role', 'Peran pegawai dalam sistem', 'Tidak', 'karyawan / supervisor / manager'],
    ['Dashboard', 'Hak akses dashboard', 'Tidak', 'user / admin'],
    ['Tanggal Join', 'Tanggal mulai bekerja (DD/MM/YYYY)', 'Tidak', '01/01/2024'],
    ['Masa Berlaku', 'Tanggal akhir kontrak (DD/MM/YYYY)', 'Tidak', '31/12/2025'],
    [''],
    ['CATATAN PENTING'],
    ['1.', 'Kolom bertanda * wajib diisi'],
    ['2.', 'Username harus unik dan belum terdaftar di sistem'],
    ['3.', 'Password minimal 6 karakter'],
    ['4.', 'Jabatan & Lokasi harus sudah terdaftar di sistem'],
    ['5.', 'Format tanggal: DD/MM/YYYY — contoh: 01/01/2024'],
    ['6.', 'Maksimal 500 baris per file import'],
    ['7.', 'Hapus baris contoh sebelum mengisi data sesungguhnya'],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(petunjuk);
  ws2['!cols'] = [{ wch: 18 }, { wch: 55 }, { wch: 10 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'Petunjuk');

  // Sheet 3: Referensi
  const referensi = [
    ['REFERENSI NILAI YANG VALID'],
    [''],
    ['Gender', '', 'Role', '', 'Dashboard', '', 'Status Pajak'],
    ['Laki-laki', '', 'karyawan', '', 'user', '', 'TK/0'],
    ['Perempuan', '', 'supervisor', '', 'admin', '', 'TK/1'],
    ['', '', 'manager', '', '', '', 'TK/2'],
    ['', '', 'admin', '', '', '', 'TK/3'],
    ['', '', '', '', '', '', 'K/0'],
    ['', '', '', '', '', '', 'K/1'],
    ['', '', '', '', '', '', 'K/2'],
    ['', '', '', '', '', '', 'K/3'],
  ];
  const ws3 = XLSX.utils.aoa_to_sheet(referensi);
  ws3['!cols'] = [{ wch: 14 }, { wch: 4 }, { wch: 14 }, { wch: 4 }, { wch: 12 }, { wch: 4 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws3, 'Referensi');

  XLSX.writeFile(wb, 'Template_Import_Pegawai.xlsx');
}

/* ─── Parse Excel ────────────────────────────────────────── */
function parseExcelFile(file: File): Promise<ImportRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = wb.SheetNames.includes('Data Pegawai') ? 'Data Pegawai' : wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const raw = XLSX.utils.sheet_to_json<any>(ws, { defval: '' });

        const getVal = (row: any, keys: string[]) => {
          for (const k of keys) {
            const v = row[k] ?? row[k.toLowerCase()] ?? '';
            if (v !== '') return String(v).trim();
          }
          return '';
        };
        const getDate = (row: any, keys: string[]) => {
          for (const k of keys) {
            const v = row[k] ?? row[k.toLowerCase()] ?? '';
            if (!v) continue;
            if (v instanceof Date) {
              return `${v.getDate().toString().padStart(2, '0')}/${(v.getMonth() + 1).toString().padStart(2, '0')}/${v.getFullYear()}`;
            }
            return String(v).trim();
          }
          return '';
        };

        const rows: ImportRow[] = raw
          .slice(0, 500)
          .map((row: any) => ({
            rowIndex: 0,
            nama: getVal(row, ['Nama*', 'Nama', 'nama', 'NAME']),
            username: getVal(row, ['Username*', 'Username', 'username']),
            password: getVal(row, ['Password*', 'Password', 'password']),
            email: getVal(row, ['Email', 'email']) || undefined,
            telepon: getVal(row, ['Telepon', 'telepon', 'Phone', 'phone']) || undefined,
            gender: getVal(row, ['Gender', 'gender']) || undefined,
            jabatan: getVal(row, ['Jabatan', 'jabatan', 'Position']) || undefined,
            lokasi: getVal(row, ['Lokasi', 'lokasi', 'Location']) || undefined,
            status_pajak: getVal(row, ['Status Pajak', 'status_pajak']) || undefined,
            role: getVal(row, ['Role', 'role']) || undefined,
            is_admin: getVal(row, ['Dashboard', 'is_admin', 'dashboard']) || undefined,
            tgl_join: getDate(row, ['Tanggal Join', 'tgl_join']) || undefined,
            masa_berlaku: getDate(row, ['Masa Berlaku', 'masa_berlaku']) || undefined,
            cuti_melahirkan: getVal(row, ['Cuti Melahirkan', 'cuti_melahirkan']) || undefined,
            cuti_kematian: getVal(row, ['Cuti Kematian', 'cuti_kematian']) || undefined,
            status: 'pending' as const,
          }))
          .filter((r: ImportRow) => r.nama || r.username)
          .map((r: ImportRow, i: number) => ({ ...r, rowIndex: i + 1 }));

        resolve(rows);
      } catch {
        reject(new Error('File tidak valid atau format tidak sesuai template'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsArrayBuffer(file);
  });
}

function validateRow(row: ImportRow): string | null {
  if (!row.nama) return 'Nama wajib diisi';
  if (!row.username) return 'Username wajib diisi';
  if (!row.password) return 'Password wajib diisi';
  if (row.password.length < 6) return 'Password minimal 6 karakter';
  if (!/^[a-zA-Z0-9._-]+$/.test(row.username)) return 'Username: hanya huruf, angka, titik, strip';
  return null;
}

/* ─── Import Modal ───────────────────────────────────────── */
function ImportModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'done'>('upload');
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string } | null>(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ total: number; success: number; failed: number } | null>(null);
  const [filterError, setFilterError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      Swal.fire({ icon: 'error', title: 'Format Tidak Didukung', text: 'Gunakan .xlsx, .xls, atau .csv' });
      return;
    }
    try {
      const parsed = await parseExcelFile(file);
      const usernames = new Set<string>();
      const emails = new Set<string>();

      const validated = parsed.map(r => {
        let err = validateRow(r);
        if (!err && r.username) {
          const lowerUsername = r.username.toLowerCase();
          if (usernames.has(lowerUsername)) err = 'Username duplikat di file';
          else usernames.add(lowerUsername);
        }
        if (!err && r.email) {
          const lowerEmail = r.email.toLowerCase();
          if (emails.has(lowerEmail)) err = 'Email duplikat di file';
          else emails.add(lowerEmail);
        }
        return { ...r, status: (err ? 'error' : 'pending') as ImportRow['status'], message: err || undefined };
      });
      setRows(validated);
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
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleImport = async () => {
    const validCount = rows.filter(r => r.status !== 'error').length;
    if (!validCount) return;
    setStep('importing');
    setProgress(0);

    const updated = [...rows];
    let successCount = 0;
    let failedCount = 0;

    const parseIso = (dateStr?: string) => {
      if (!dateStr) return undefined;
      const parts = dateStr.split('/');
      if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      return dateStr;
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.status === 'error') {
        failedCount++;
        setProgress(Math.round(((i + 1) / rows.length) * 100));
        continue;
      }
      try {
        const body: any = { name: row.nama, username: row.username.toLowerCase(), password: row.password };
        if (row.email) body.email = row.email;
        if (row.telepon) body.telepon = row.telepon;
        if (row.gender) body.gender = row.gender;
        if (row.jabatan) body.jabatan_name = row.jabatan;
        if (row.lokasi) body.lokasi_name = row.lokasi;
        if (row.status_pajak) body.status_pajak_name = row.status_pajak;
        if (row.role) body.role = row.role;
        if (row.is_admin) body.is_admin = row.is_admin;
        if (row.tgl_join) body.tgl_join = parseIso(row.tgl_join);
        if (row.masa_berlaku) body.masa_berlaku = parseIso(row.masa_berlaku);
        if (row.cuti_melahirkan) body.cuti_melahirkan = row.cuti_melahirkan;
        if (row.cuti_kematian) body.cuti_kematian = row.cuti_kematian;

        const res = await fetch(`${BASE_URL}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (res.ok && json.success) {
          updated[i] = { ...row, status: 'success', message: 'Berhasil ditambahkan' };
          successCount++;
        } else {
          updated[i] = { ...row, status: 'error', message: json.message || 'Gagal' };
          failedCount++;
        }
      } catch (err: any) {
        updated[i] = { ...row, status: 'error', message: err.message || 'Kesalahan jaringan' };
        failedCount++;
      }
      setRows([...updated]);
      setProgress(Math.round(((i + 1) / rows.length) * 100));
      if (i < rows.length - 1) await new Promise(r => setTimeout(r, 80));
    }

    setResult({ total: rows.length, success: successCount, failed: failedCount });
    setStep('done');
    if (successCount > 0) onSuccess();
  };

  const errorCount = rows.filter(r => r.status === 'error').length;
  const validCount = rows.filter(r => r.status !== 'error').length;
  const displayRows = filterError ? rows.filter(r => r.status === 'error') : rows;
  const STEPS = ['upload', 'preview', 'importing', 'done'];
  const stepLabels = ['Upload', 'Preview', 'Proses', 'Selesai'];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="px-7 pt-6 pb-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                <Upload className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Import Pegawai</p>
                <p className="text-[11px] text-slate-400">Upload Excel untuk menambahkan banyak pegawai sekaligus</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Steps */}
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all',
                    step === s ? 'bg-indigo-600 text-white' : STEPS.indexOf(step) > i ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                  )}>
                    {STEPS.indexOf(step) > i ? '✓' : i + 1}
                  </div>
                  <span className={cn('text-[11px] font-semibold', step === s ? 'text-slate-700' : 'text-slate-400')}>{stepLabels[i]}</span>
                </div>
                {i < STEPS.length - 1 && <div className="flex-1 h-px bg-slate-100 mx-1" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto min-h-0">

          {/* UPLOAD */}
          {step === 'upload' && (
            <div className="p-7 space-y-5">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-indigo-600 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-slate-800">Download Template Excel</p>
                    <p className="text-[11px] text-slate-500">Isi data pegawai sesuai format template agar import berhasil</p>
                  </div>
                </div>
                <button
                  onClick={generateImportTemplate}
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-200 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" /> Download Template
                </button>
              </div>
              <div
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition-all',
                  isDragOver ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/60'
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
                />
                <div className="flex flex-col items-center gap-3">
                  <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center transition-all', isDragOver ? 'bg-indigo-100' : 'bg-slate-100')}>
                    <Upload className={cn('w-7 h-7', isDragOver ? 'text-indigo-600' : 'text-slate-400')} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">{isDragOver ? 'Lepaskan file di sini' : 'Drag & drop file di sini'}</p>
                    <p className="text-xs text-slate-400 mt-1">atau klik untuk memilih file</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {['.xlsx', '.xls', '.csv'].map(ext => (
                      <span key={ext} className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-500">{ext}</span>
                    ))}
                    <span className="text-[11px] text-slate-400">· Max 500 baris</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PREVIEW */}
          {step === 'preview' && (
            <div className="flex flex-col min-h-0">
              <div className="px-7 py-3.5 border-b border-slate-100 bg-slate-50/50 shrink-0 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-600 truncate max-w-[180px]">{fileInfo?.name}</span>
                    <span className="text-slate-400">{fileInfo?.size}</span>
                  </div>
                  <div className="h-3 w-px bg-slate-200" />
                  <span className="text-emerald-600 font-bold">{validCount} siap import</span>
                  {errorCount > 0 && <span className="text-rose-500 font-bold">{errorCount} error</span>}
                </div>
                {errorCount > 0 && (
                  <button
                    onClick={() => setFilterError(v => !v)}
                    className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all',
                      filterError ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600'
                    )}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {filterError ? 'Tampilkan Semua' : 'Lihat Error Saja'}
                  </button>
                )}
              </div>
              <div className="overflow-auto flex-1" style={{ maxHeight: '340px' }}>
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-white border-b border-slate-100 z-10">
                    <tr>
                      {['Baris', 'Status', 'Nama', 'Username', 'Jabatan', 'Lokasi', 'Keterangan'].map((h, i) => (
                        <th key={i} className="py-2.5 px-3 text-left font-semibold text-slate-400 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayRows.map(row => (
                      <tr key={row.rowIndex} className={cn('border-b border-slate-50', row.status === 'error' ? 'bg-rose-50/50' : 'hover:bg-slate-50/40')}>
                        <td className="py-2 px-3 text-slate-300 font-mono text-[10px]">{row.rowIndex}</td>
                        <td className="py-2 px-3">
                          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold',
                            row.status === 'error' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-700'
                          )}>
                            {row.status === 'error' ? '✗ Error' : '✓ Valid'}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-700 whitespace-nowrap">
                          {row.nama || <span className="text-rose-400 italic">kosong</span>}
                        </td>
                        <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{row.username || '-'}</td>
                        <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{row.jabatan || '-'}</td>
                        <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{row.lokasi || '-'}</td>
                        <td className="py-2 px-3 text-rose-500 font-medium">{row.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* IMPORTING */}
          {step === 'importing' && (
            <div className="p-12 flex flex-col items-center gap-6">
              <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center">
                <Loader2 className="w-9 h-9 text-indigo-600 animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-slate-800">Sedang mengimport data...</p>
                <p className="text-sm text-slate-400 mt-1">Jangan tutup halaman ini</p>
              </div>
              <div className="w-full max-w-xs">
                <div className="flex justify-between text-xs text-slate-500 mb-2">
                  <span>Progress</span>
                  <span className="font-bold text-indigo-600">{progress}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-indigo-500 rounded-full"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-2 text-center">
                  {rows.filter(r => r.status === 'success').length} / {rows.length} selesai
                </p>
              </div>
            </div>
          )}

          {/* DONE */}
          {step === 'done' && result && (
            <div className="p-7 space-y-5">
              <div className={cn('flex items-center gap-4 p-5 rounded-2xl border',
                result.failed === 0 ? 'bg-emerald-50 border-emerald-100' : result.success === 0 ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'
              )}>
                <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0',
                  result.failed === 0 ? 'bg-emerald-100' : result.success === 0 ? 'bg-rose-100' : 'bg-amber-100'
                )}>
                  {result.failed === 0 ? <CheckCircle2 className="w-6 h-6 text-emerald-600" /> : result.success === 0 ? <AlertCircle className="w-6 h-6 text-rose-500" /> : <AlertTriangle className="w-6 h-6 text-amber-500" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {result.failed === 0 ? 'Semua data berhasil diimport!' : result.success === 0 ? 'Semua data gagal diimport' : 'Import selesai dengan beberapa error'}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs">
                    <span className="text-emerald-600 font-semibold">{result.success} berhasil</span>
                    {result.failed > 0 && <span className="text-rose-500 font-semibold">{result.failed} gagal</span>}
                    <span className="text-slate-400">dari {result.total} total</span>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-slate-100 overflow-auto" style={{ maxHeight: '280px' }}>
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-100 z-10">
                    <tr>
                      {['Baris', 'Nama', 'Username', 'Status', 'Keterangan'].map((h, i) => (
                        <th key={i} className="py-2.5 px-3 text-left font-semibold text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(row => (
                      <tr key={row.rowIndex} className={cn('border-b border-slate-50',
                        row.status === 'success' ? 'bg-emerald-50/30' : row.status === 'error' ? 'bg-rose-50/40' : ''
                      )}>
                        <td className="py-2 px-3 text-slate-400 font-mono text-[10px]">{row.rowIndex}</td>
                        <td className="py-2 px-3 font-semibold text-slate-700">{row.nama}</td>
                        <td className="py-2 px-3 text-slate-500">{row.username}</td>
                        <td className="py-2 px-3">
                          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold',
                            row.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'
                          )}>
                            {row.status === 'success' ? '✓ Berhasil' : '✗ Gagal'}
                          </span>
                        </td>
                        <td className={cn('py-2 px-3 text-xs font-medium', row.status === 'success' ? 'text-emerald-600' : 'text-rose-500')}>{row.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-7 py-4 border-t border-slate-100 bg-slate-50/40 shrink-0 flex items-center justify-between gap-3">
          {step === 'upload' && (
            <>
              <p className="text-[11px] text-slate-400">Format: .xlsx .xls .csv · Maks 500 baris</p>
              <button onClick={onClose} className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all">Batal</button>
            </>
          )}
          {step === 'preview' && (
            <>
              <button onClick={() => { setStep('upload'); setRows([]); setFileInfo(null); setFilterError(false); }} className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all">
                <RefreshCw className="w-3.5 h-3.5" /> Ganti File
              </button>
              <div className="flex items-center gap-3">
                {errorCount > 0 && validCount > 0 && <p className="text-xs text-amber-600 font-semibold">{errorCount} baris akan dilewati</p>}
                <button onClick={handleImport} disabled={validCount === 0} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-200">
                  <Upload className="w-4 h-4" /> Import {validCount} Pegawai <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
          {step === 'importing' && <p className="text-xs text-slate-400 mx-auto">Proses import sedang berjalan, harap tunggu...</p>}
          {step === 'done' && (
            <>
              <div />
              <button onClick={onClose} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-200">
                <CheckCircle2 className="w-4 h-4" /> Selesai
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Avatar ─────────────────────────────────────────────── */
function Avatar({ employee }: { employee: Employee }) {
  const [imgError, setImgError] = useState(false);
  const photoUrl = getPhotoUrl(employee.foto_karyawan || employee.foto_face_recognition);
  return (
    <div className="relative shrink-0">
      {photoUrl && !imgError ? (
        <img src={photoUrl} alt={employee.name} onError={() => setImgError(true)} className="w-9 h-9 rounded-xl object-cover" />
      ) : (
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold', avatarColor(employee.id))}>
          {initials(employee.name)}
        </div>
      )}
    </div>
  );
}

/* ─── QR Modal ───────────────────────────────────────────── */
function QRModal({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const handleDownload = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const size = 220;
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, size, size);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      const link = document.createElement('a');
      link.download = `kartu-${employee.username}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 16 }} transition={{ type: 'spring', damping: 20, stiffness: 300 }} onClick={e => e.stopPropagation()} className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xs overflow-hidden">
        <button onClick={onClose} className="absolute top-3 right-3 z-10 p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 transition-all"><X className="w-4 h-4" /></button>
        <div className={cn('h-1.5 w-full', avatarColor(employee.id))} />
        <div className="flex justify-center pt-7 pb-4 px-8">
          <div className="p-4 rounded-2xl bg-white border-2 border-slate-100 shadow-sm">
            <QRCode ref={svgRef} value={employee.username} size={180} bgColor="#ffffff" fgColor="#0f172a" level="M" />
          </div>
        </div>
        <div className="text-center pb-6 px-6">
          <p className="text-sm font-bold text-slate-900 uppercase tracking-widest leading-tight">{employee.name}</p>
          <p className="text-xs text-slate-400 mt-1.5">{employee.jabatan?.nama_jabatan ?? '-'}</p>
          <p className="text-[11px] text-slate-300 mt-1">@{employee.username}</p>
        </div>
        <div className="border-t border-slate-100 px-5 py-4 flex items-center justify-between gap-3 bg-slate-50/50">
          <div className="text-[11px] text-slate-400 leading-relaxed">
            <p>{employee.lokasi?.nama_lokasi ?? '-'}</p>
            <p>Berlaku s/d {formatDate(employee.masa_berlaku)}</p>
          </div>
          <button onClick={handleDownload} className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shrink-0 shadow-md shadow-indigo-200">
            <Download className="w-3.5 h-3.5" /> Download
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Change Password Modal ──────────────────────────────── */
function ChangePasswordModal({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!password) { setError('Password tidak boleh kosong'); return; }
    if (password.length < 6) { setError('Password minimal 6 karakter'); return; }
    if (password !== confirm) { setError('Konfirmasi password tidak cocok'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${BASE_URL}/users/${employee.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Gagal mengubah password');
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.93, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.93, y: 12 }} transition={{ type: 'spring', damping: 22, stiffness: 320 }} onClick={e => e.stopPropagation()} className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 pt-6 pb-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-50 flex items-center justify-center"><Key className="w-4 h-4 text-cyan-600" /></div>
              <div>
                <p className="text-sm font-bold text-slate-900">Ganti Password</p>
                <p className="text-[11px] text-slate-400">{employee.name}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="px-6 py-5 space-y-4">
          {success ? (
            <div className="flex flex-col items-center gap-3 py-6 text-emerald-600">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center"><Lock className="w-6 h-6" /></div>
              <p className="text-sm font-bold">Password berhasil diubah!</p>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Password Baru</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={e => { setPassword(e.target.value); setError(''); }} placeholder="Minimal 6 karakter" className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-50 transition-all" />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Konfirmasi Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input type={showConfirm ? 'text' : 'password'} value={confirm} onChange={e => { setConfirm(e.target.value); setError(''); }} placeholder="Ulangi password baru" className={cn('w-full pl-10 pr-10 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-4 transition-all', confirm && password !== confirm ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-50' : 'border-slate-200 focus:border-cyan-400 focus:ring-cyan-50')} />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
                {confirm && password === confirm && <p className="text-[11px] text-emerald-500 font-medium">✓ Password cocok</p>}
              </div>
              {password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={cn('h-1 flex-1 rounded-full transition-all', password.length >= i * 3 ? (password.length >= 12 ? 'bg-emerald-400' : password.length >= 8 ? 'bg-amber-400' : 'bg-rose-400') : 'bg-slate-100')} />
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400">{password.length >= 12 ? 'Kuat' : password.length >= 8 ? 'Sedang' : 'Lemah'}</p>
                </div>
              )}
              {error && <p className="text-[11px] text-rose-500 font-medium bg-rose-50 px-3 py-2 rounded-lg">{error}</p>}
            </>
          )}
        </div>
        {!success && (
          <div className="px-6 pb-6 flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">Batal</button>
            <button onClick={handleSubmit} disabled={loading} className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-md shadow-cyan-200">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ─── Face Recognition Modal ─────────────────────────────── */
function FaceRecognitionModal({ employee, onClose, onSuccess, addToast, updateToast }: { employee: Employee; onClose: () => void; onSuccess?: () => void; addToast: any; updateToast: any }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      .then(s => { streamRef.current = s; if (videoRef.current) videoRef.current.srcObject = s; })
      .catch(err => console.error('Camera error:', err));
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const base64Image = canvas.toDataURL('image/jpeg');
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    onClose();
    const toastId = addToast({ type: 'loading', title: 'Face Recognition', message: 'Sedang memproses foto...' });
    try {
      const res = await fetch(`${BASE_URL}/users/${employee.id}/face-recognition`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: employee.id, foto_face_recognition: base64Image }),
      });
      const json = await res.json();
      if (json.success) {
          updateToast(toastId, { type: 'success', title: 'Berhasil', message: json.message || 'Face recognition berhasil diperbarui' });
          onSuccess?.();
      }
      else updateToast(toastId, { type: 'error', title: 'Gagal', message: json.message || 'Gagal memproses face recognition' });
    } catch (err: any) {
      updateToast(toastId, { type: 'error', title: 'Error', message: err.message || 'Terjadi kesalahan sistem' });
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden p-10 flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Face Recognition</h3>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 transition-all active:scale-90"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama</p>
              <div className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 truncate">{employee.name}</div>
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Foto Saat Ini</p>
              <div className="size-14 rounded-2xl overflow-hidden border-2 border-slate-50 shadow-sm bg-slate-100">
                {getPhotoUrl(employee.foto_face_recognition) ? (
                  <img src={getPhotoUrl(employee.foto_face_recognition)!} className="size-full object-cover" alt="Current" />
                ) : (
                  <div className="size-full flex items-center justify-center text-slate-300"><ImageIcon size={20}/></div>
                )}
              </div>
            </div>
          </div>
          <div className="relative aspect-video rounded-[2.5rem] overflow-hidden bg-slate-900 shadow-2xl border-4 border-slate-50">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="flex justify-center pt-6">
            <button onClick={handleCapture} disabled={loading} className="px-12 py-4 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-2xl text-sm font-black tracking-widest uppercase transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50 flex items-center gap-3">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ScanFace className="w-5 h-5" />}
              {loading ? 'Processing...' : 'Capture Image'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────── */
export function AllEmployeesPage({ initialRole }: { initialRole?: string; key?: string }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 100, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [locations, setLocations] = useState<any[]>([]);
  const [jabatans, setJabatans] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  
  const [selectedLokasi, setSelectedLokasi] = useState('');
  const [selectedJabatan, setSelectedJabatan] = useState('');
  const [selectedRole, setSelectedRole] = useState(initialRole || '');
  const [selectedStatusKerja, setSelectedStatusKerja] = useState('');

  const [qrEmployee, setQrEmployee] = useState<Employee | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const pathParts = location.pathname.split('/').filter(Boolean);
  const editEmployeeId = pathParts[0] === 'all-employees' && pathParts[1] ? pathParts[1] : null;

  const [pwEmployee, setPwEmployee] = useState<Employee | null>(null);
  const [mappingEmployee, setMappingEmployee] = useState<Employee | null>(null);
  const [mappingShiftEmployee, setMappingShiftEmployee] = useState<Employee | null>(null);
  const [contractEmployee, setContractEmployee] = useState<Employee | null>(null);
  const [deleteConfirmEmployee, setDeleteConfirmEmployee] = useState<Employee | null>(null);
  const [faceRecEmployee, setFaceRecEmployee] = useState<Employee | null>(null);
  const [showShiftPage, setShowShiftPage] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const { addToast, updateToast } = useToast();
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setShowExportDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    const fetchFilters = async () => {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
      
      try {
        const [locRes, jabRes, roleRes] = await Promise.all([
          fetch(`${BASE_URL}/lokasi`, { headers }),
          fetch(`${BASE_URL}/jabatans`, { headers }),
          fetch(`${BASE_URL}/roles`, { headers })
        ]);
        
        const [locJson, jabJson, roleJson] = await Promise.all([
          locRes.json(),
          jabRes.json(),
          roleRes.json()
        ]);
        
        if (locJson.success) setLocations(locJson.data);
        if (jabJson.success) setJabatans(jabJson.data);
        if (roleJson.success) setRoles(roleJson.data);
      } catch (err) {
        console.error("Filter fetch error:", err);
      }
    };
    
    fetchFilters();
  }, []);

  const fetchEmployees = useCallback(async (currentPage: number, currentSearch: string, locId?: string, jabId?: string, roleName?: string, statusKerja?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '100',
        ...(currentSearch ? { search: currentSearch } : {}),
        ...(locId ? { lokasi_id: locId } : {}),
        ...(jabId ? { jabatan_id: jabId } : {}),
        ...(roleName ? { role: roleName } : {}),
        ...(statusKerja ? { status_kerja: statusKerja } : {}),
      });

      const res = await fetch(`${BASE_URL}/users/all?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      setEmployees(json.data);
      if (json.meta) {
        setMeta(json.meta);
      } else {
        setMeta({ total: json.data.length, page: 1, limit: 100, totalPages: 1 });
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data pegawai');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees(page, search, selectedLokasi, selectedJabatan, selectedRole, selectedStatusKerja);
  }, [page, search, selectedLokasi, selectedJabatan, selectedRole, selectedStatusKerja, fetchEmployees]);

  const handleSearchInput = (val: string) => {
    setSearchInput(val);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => { setPage(1); setSearch(val); }, 400);
  };

  const handleAddSuccess = () => { fetchEmployees(1, search, selectedLokasi, selectedJabatan, selectedRole, selectedStatusKerja); setPage(1); };

  const handleExport = async (type: 'all' | 'tetap' | 'pkwt' = 'all') => {
    const titleMap = {
      all: 'Export Semua Pegawai',
      tetap: 'Export Pegawai Tetap',
      pkwt: 'Export PKWT'
    };
    const toastId = addToast({ type: 'loading', title: titleMap[type], message: 'Sedang menyiapkan data...' });
    try {
      const paramsObj: any = {};
      if (search) paramsObj.search = search;
      if (selectedLokasi) paramsObj.lokasi_id = selectedLokasi;
      if (selectedJabatan) paramsObj.jabatan_id = selectedJabatan;
      if (selectedRole) paramsObj.role = selectedRole;
      if (type !== 'all') {
        paramsObj.status_kerja = type;
      } else if (selectedStatusKerja) {
        paramsObj.status_kerja = selectedStatusKerja;
      }
      const params = new URLSearchParams(paramsObj);
      const res = await fetch(`${BASE_URL}/users/all?${params}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      let rawData = json.data || [];
      if (type === 'tetap') {
        rawData = rawData.filter((emp: Employee) => !emp.tanggal_berakhir_pkwt);
      } else if (type === 'pkwt') {
        rawData = rawData.filter((emp: Employee) => emp.tanggal_berakhir_pkwt);
      }

      const exportData = rawData.map((emp: Employee, index: number) => ({
        'No': index + 1,
        'Nama': emp.name,
        'Username': emp.username,
        'Email': emp.email || '-',
        'Telepon': emp.telepon || '-',
        'Gender': emp.gender || '-',
        'Lokasi': emp.lokasi?.nama_lokasi || '-',
        'Tanggal Lahir': formatDate(emp.tgl_lahir),
        'Tanggal Join': formatDate(emp.tgl_join),
        'Jabatan': emp.jabatan?.nama_jabatan || '-',
        'Role': emp.roles.join(', '),
        'Dashboard': emp.is_admin || 'user',
        'Status Pajak': emp.status_pajak?.name || '-',
        'Alamat': emp.alamat || '-',
        'Kontak Darurat': emp.darurat_nama || '-',
        'Telepon Darurat': emp.darurat_telepon || '-',
        'Hubungan Darurat': emp.darurat_hubungan || '-',
        'KTP': emp.ktp || '-',
        'KK': emp.kartu_keluarga || '-',
        'BPJS Kesehatan': emp.bpjs_kesehatan || '-',
        'BPJS Ketenagakerjaan': emp.bpjs_ketenagakerjaan || '-',
        'NPWP': emp.npwp || '-',
        'SIM': emp.sim || '-',
        'Masa Berlaku': formatDate(emp.masa_berlaku),
        'No PKWT': emp.no_pkwt || '-',
        'No Kontrak': emp.no_kontrak || '-',
        'Tgl Mulai PKWT': formatDate(emp.tanggal_mulai_pkwt),
        'Tgl Berakhir PKWT': formatDate(emp.tanggal_berakhir_pkwt),
        'Rekening': emp.rekening || '-',
        'Nama Rekening': emp.nama_rekening || '-',
        'Izin Cuti': emp.izin_cuti || 0,
        'Izin Lainnya': emp.izin_lainnya || 0,
        'Izin Telat': emp.izin_telat || 0,
        'Pulang Cepat': emp.izin_pulang_cepat || 0,
        'Gaji Pokok': emp.gaji_pokok || 0,
        'Tunjangan Makan': emp.tunjangan_makan || 0,
        'Tunjangan Transport': emp.tunjangan_transport || 0,
        'Tunj. BPJS Kes': emp.tunjangan_bpjs_kesehatan || 0,
        'Tunj. BPJS Ket': emp.tunjangan_bpjs_ketenagakerjaan || 0,
        'Lembur': emp.lembur || 0,
        'Kehadiran 100%': emp.kehadiran || 0,
        'THR': emp.thr || 0,
        'Bonus Pribadi': emp.bonus_pribadi || 0,
        'Bonus Team': emp.bonus_team || 0,
        'Bonus Jackpot': emp.bonus_jackpot || 0,
        'Izin (Pot)': emp.izin || 0,
        'Terlambat (Pot)': emp.terlambat || 0,
        'Mangkir (Pot)': emp.mangkir || 0,
        'Kasbon Obat': emp.saldo_kasbon || 0,
        'Pot. BPJS Kes': emp.potongan_bpjs_kesehatan || 0,
        'Pot. BPJS Ket': emp.potongan_bpjs_ketenagakerjaan || 0,
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Pegawai');
      // Set column widths for better readability
      ws['!cols'] = [
        { wch: 5 }, { wch: 25 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 20 },
        { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
        { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 },
        { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 },
        { wch: 15 }
      ];
      XLSX.writeFile(wb, `Data_Pegawai_${type.toUpperCase()}_${new Date().toISOString().split('T')[0]}.xlsx`);
      updateToast(toastId, { type: 'success', title: 'Berhasil', message: 'Data berhasil di-export ke Excel' });
    } catch (err: any) {
      updateToast(toastId, { type: 'error', title: 'Gagal', message: err.message || 'Gagal mengekspor data' });
    }
  };

  const handleDeleteEmployee = async () => {
    if (!deleteConfirmEmployee) return;
    const emp = deleteConfirmEmployee;
    setDeleteConfirmEmployee(null);
    const toastId = addToast({ type: 'loading', title: 'Menghapus', message: `Sedang menghapus ${emp.name}...` });
    try {
      const res = await fetch(`${BASE_URL}/users/${emp.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      const json = await res.json();
      if (json.success) {
        updateToast(toastId, { type: 'success', title: 'Berhasil', message: json.message || 'Data pegawai berhasil dihapus' });
        fetchEmployees(page, search, selectedLokasi, selectedJabatan, selectedRole, selectedStatusKerja);
      } else {
        updateToast(toastId, { type: 'error', title: 'Gagal', message: json.message || 'Gagal menghapus data pegawai' });
      }
    } catch (err: any) {
      updateToast(toastId, { type: 'error', title: 'Error', message: err.message || 'Terjadi kesalahan sistem' });
    }
  };

  if (editEmployeeId) return <EditEmployeeForm employeeId={editEmployeeId} onBack={() => navigate('/all-employees')} onSuccess={handleAddSuccess} />;
  if (isAdding) return <AddEmployeeForm onBack={() => setIsAdding(false)} onSuccess={handleAddSuccess} />;
  if (mappingEmployee) return <MappingDinasLuar employee={mappingEmployee} onBack={() => setMappingEmployee(null)} />;
  if (mappingShiftEmployee) return <MappingShift employee={mappingShiftEmployee} onBack={() => setMappingShiftEmployee(null)} />;
  if (contractEmployee) return <ContractsEmployeeDetail employee={contractEmployee} onBack={() => setContractEmployee(null)} />;
  if (showShiftPage) return <ShiftEmployeesPage onBack={() => setShowShiftPage(false)} />;

  const pageNumbers = (() => {
    const total = meta.totalPages, cur = meta.page;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (cur <= 4) return [1, 2, 3, 4, 5, '...', total];
    if (cur >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '...', cur - 1, cur, cur + 1, '...', total];
  })();

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-7xl mx-auto pb-20 space-y-7">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pegawai</h1>
            <p className="text-sm text-slate-400 mt-0.5">Kelola dan pantau seluruh pegawai</p>
          </div>
          <div className="flex items-center gap-2 relative" ref={exportDropdownRef}>
            <button 
              onClick={() => setShowExportDropdown(!showExportDropdown)} 
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
            >
              <Download className="w-4 h-4 text-emerald-500" /> Export
            </button>
            <AnimatePresence>
              {showExportDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-2 divide-y divide-slate-50 overflow-hidden"
                >
                  <button
                    onClick={() => { handleExport('all'); setShowExportDropdown(false); }}
                    className="w-full text-left px-5 py-3 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors flex items-center gap-2.5"
                  >
                    <Users className="w-4 h-4 text-slate-400" /> Export Semua Pegawai
                  </button>
                  <button
                    onClick={() => { handleExport('tetap'); setShowExportDropdown(false); }}
                    className="w-full text-left px-5 py-3 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors flex items-center gap-2.5"
                  >
                    <UserCheck className="w-4 h-4 text-emerald-500" /> Export Pegawai Tetap
                  </button>
                  <button
                    onClick={() => { handleExport('pkwt'); setShowExportDropdown(false); }}
                    className="w-full text-left px-5 py-3 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors flex items-center gap-2.5"
                  >
                    <FileText className="w-4 h-4 text-indigo-500" /> Export PKWT
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Pegawai', value: meta.total, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
            { label: 'Aktif', value: meta.total, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
            { label: 'Cuti', value: '-', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
            { label: 'Baru Bulan Ini', value: '-', icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
          ].map(({ label, value, icon: Icon, color, bg, border }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border', bg, border)}>
                <Icon className={cn('w-5 h-5', color)} />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
                <p className="text-xl font-bold text-slate-900 leading-tight">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 min-w-[240px] max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama, email, atau username..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  value={searchInput}
                  onChange={(e) => handleSearchInput(e.target.value)}
                />
              </div>

              <div className="relative">
                <select 
                  value={selectedLokasi}
                  onChange={(e) => { setSelectedLokasi(e.target.value); setPage(1); }}
                  className="appearance-none pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all focus:outline-none focus:border-indigo-400 min-w-[160px]"
                >
                  <option value="">Semua Lokasi</option>
                  {locations.map((l: any) => (
                    <option key={l.id} value={l.id}>{l.nama_lokasi}</option>
                  ))}
                </select>
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select 
                  value={selectedJabatan}
                  onChange={(e) => { setSelectedJabatan(e.target.value); setPage(1); }}
                  className="appearance-none pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all focus:outline-none focus:border-indigo-400 min-w-[170px]"
                >
                  <option value="">Semua Divisi</option>
                  <option value="kosong">Tanpa Divisi</option>
                  {jabatans.map((j: any) => (
                    <option key={j.id} value={j.id}>{j.nama_jabatan}</option>
                  ))}
                </select>
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select 
                  value={selectedRole}
                  onChange={(e) => { setSelectedRole(e.target.value); setPage(1); }}
                  className="appearance-none pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all focus:outline-none focus:border-indigo-400 min-w-[160px]"
                >
                  <option value="">Semua Role</option>
                  {roles.map((r: any) => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
                <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={selectedStatusKerja}
                  onChange={(e) => { setSelectedStatusKerja(e.target.value); setPage(1); }}
                  className="appearance-none pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all focus:outline-none focus:border-indigo-400 min-w-[160px]"
                >
                  <option value="">Semua Status</option>
                  <option value="tetap">Pegawai Tetap</option>
                  <option value="pkwt">PKWT</option>
                </select>
                <ScrollText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {error ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <AlertCircle className="w-8 h-8 text-rose-400" />
                <p className="text-sm font-semibold text-slate-600">{error}</p>
                 <button onClick={() => fetchEmployees(page, search, selectedLokasi, selectedJabatan, selectedRole, selectedStatusKerja)} className="text-indigo-600 text-sm font-semibold hover:underline">Coba lagi</button>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Memuat data...</span>
              </div>
            ) : employees.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2 text-slate-400">
                <Users className="w-8 h-8" />
                <p className="text-sm font-semibold">Tidak ada pegawai ditemukan</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    {['#', 'Pegawai', 'Lokasi', 'Jabatan', 'Role', 'Dashboard', 'Dokumen', 'Status', 'Masa Berlaku', 'Kartu', ''].map((h, i) => (
                      <th key={i} className={cn('py-3.5 px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap', i === 0 ? 'w-10' : '', i === 10 ? 'text-right w-24' : 'text-left')}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp, i) => (
                    <motion.tr key={emp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="group border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-semibold text-slate-300 group-hover:text-slate-500 transition-colors">
                          {String((meta.page - 1) * meta.limit + i + 1).padStart(2, '0')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3 min-w-[180px]">
                          <Avatar employee={emp} />
                          <div>
                            <p className="text-sm font-semibold text-slate-800 leading-tight">{emp.name}</p>
                            <p className="text-[11px] text-slate-400">@{emp.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-500 whitespace-nowrap">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="text-xs">{emp.lokasi?.nama_lokasi ?? '-'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4"><span className="text-xs text-slate-600 whitespace-nowrap">{emp.jabatan?.nama_jabatan ?? '-'}</span></td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[11px] font-semibold capitalize border border-indigo-100 whitespace-nowrap">{emp.roles[0] ?? '-'}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={cn('inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize border whitespace-nowrap',
                          emp.is_admin === 'admin' ? 'bg-violet-50 text-violet-700 border-violet-100' : 'bg-slate-100 text-slate-600 border-slate-200')}>
                          {emp.is_admin ?? 'user'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={cn('inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold border whitespace-nowrap uppercase tracking-wider',
                          emp.has_dokumen ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100')}>
                          {emp.has_dokumen ? '✓ Ada' : '✗ Belum'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={cn('inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold border whitespace-nowrap uppercase tracking-wider',
                          !emp.is_keluar ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-100 text-slate-400 border-slate-200')}>
                          {!emp.is_keluar ? 'Aktif' : 'Sudah Keluar'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4"><span className="text-xs text-slate-500 whitespace-nowrap">{formatDate(emp.masa_berlaku)}</span></td>
                      <td className="py-3.5 px-4">
                        <button onClick={() => setQrEmployee(emp)} className="group/q flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all">
                          <QrCode className="w-3 h-3 text-slate-400 group-hover/q:text-indigo-500 transition-colors" />
                          <span className="text-[11px] font-semibold text-slate-600 group-hover/q:text-indigo-600 transition-colors whitespace-nowrap">Qrcode</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 z-10 relative">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => navigate(`/all-employees/${emp.id}`)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all" title="Edit"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => setPwEmployee(emp)} className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition-all" title="Edit Password"><Key className="w-4 h-4" /></button>
                          <button onClick={() => setMappingShiftEmployee(emp)} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all" title="Mapping Shift"><Map className="w-4 h-4" /></button>
                          <button onClick={() => setContractEmployee(emp)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all" title="Kontrak"><ScrollText className="w-4 h-4" /></button>
                          <button onClick={() => setMappingEmployee(emp)} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all" title="Mapping Dinas Luar"><FileText className="w-4 h-4" /></button>
                          <button onClick={() => setFaceRecEmployee(emp)} className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all" title="Face Recognition"><ScanFace className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteConfirmEmployee(emp)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!loading && !error && meta.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-400">
                Halaman <span className="font-semibold text-slate-600">{meta.page}</span> dari <span className="font-semibold text-slate-600">{meta.totalPages}</span>
              </p>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={meta.page === 1} className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {pageNumbers.map((pg, i) =>
                  pg === '...' ? (
                    <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-slate-400">…</span>
                  ) : (
                    <button key={pg} onClick={() => setPage(Number(pg))} className={cn('w-8 h-8 rounded-lg text-xs font-semibold transition-all',
                      pg === meta.page ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' : 'border border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-600')}>
                      {pg}
                    </button>
                  )
                )}
                <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={meta.page === meta.totalPages} className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {qrEmployee && <QRModal employee={qrEmployee} onClose={() => setQrEmployee(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {pwEmployee && <ChangePasswordModal employee={pwEmployee} onClose={() => setPwEmployee(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showImport && (
          <ImportModal
            onClose={() => setShowImport(false)}
            onSuccess={() => { fetchEmployees(1, search); setPage(1); }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {deleteConfirmEmployee && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteConfirmEmployee(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mb-6">
                <AlertTriangle className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Hapus Pegawai?</h3>
              <p className="text-sm text-slate-500 mb-8 font-medium">Data <span className="font-bold text-slate-700">{deleteConfirmEmployee.name}</span> akan dihapus permanen dari sistem.</p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setDeleteConfirmEmployee(null)} className="flex-1 py-3 text-slate-600 font-bold bg-slate-50 hover:bg-slate-100 rounded-xl transition-all active:scale-95">Batal</button>
                <button onClick={handleDeleteEmployee} className="flex-1 py-3 text-white font-bold bg-rose-600 hover:bg-rose-700 rounded-xl shadow-lg shadow-rose-200 transition-all active:scale-95">Hapus Data</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {faceRecEmployee && (
          <FaceRecognitionModal 
            employee={faceRecEmployee} 
            onClose={() => setFaceRecEmployee(null)} 
            onSuccess={() => fetchEmployees(page, search)}
            addToast={addToast} 
            updateToast={updateToast} 
          />
        )}
      </AnimatePresence>
    </>
  );
}