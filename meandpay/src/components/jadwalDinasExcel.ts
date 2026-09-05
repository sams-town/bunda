/**
 * jadwalDinasExcel.ts — Jadwal Dinas Excel generator & parser
 * Uses SheetJS only. Valid xlsx, no patching.
 *
 * Template layout (0-indexed rows):
 *   0: Hospital name
 *   1: blank
 *   2: JADWAL DINAS
 *   3: Month Year
 *   4: TANGGAL label row
 *   5: No | Nama | 1..31 | P | S | M | LOCK
 *   6: ''  | ''   | S..M  | ''| ''| ''| ''
 *   7+: employee data rows
 *
 * Lock Location column is the last date col + 4 (after P, S, M).
 * Parser reads it: if value === 1 or "1" → lock_location = 1.
 */
import * as XLSX from 'xlsx';

/* ── Types ─────────────────────────────────────────────────── */
export interface Shift {
  id: string;
  nama_shift: string;
  jam_masuk: string;
  jam_keluar: string;
}
export interface Employee {
  id: string;
  name: string;
  username: string;
  jabatan?: { id: string; nama_jabatan: string } | null;
}
export interface MappingData {
  id: string;
  user_id: string;
  shift_id: string;
  tanggal: string;
  lock_location?: string | number;
}
export interface ImportRow {
  rowIndex: number;
  user_id: string;
  user_name: string;
  shift_id: string;
  shift_name: string;
  tanggal_mulai: string;
  tanggal_akhir: string;
  lock_location: number;
  status: 'pending' | 'success' | 'error';
  message?: string;
}

function dayCode(date: Date): string {
  return ['M', 'S', 'S', 'R', 'K', 'J', 'S'][date.getDay()];
}
function pad(n: number) { return String(n).padStart(2, '0'); }

/* ══════════════════════════════════════════════════════════════
   GENERATE
══════════════════════════════════════════════════════════════ */
export function generateJadwalDinas(
  allEmployees: Employee[],
  allShifts: Shift[],
  mappings: MappingData[],
  year: number,
  month: number,
): void {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName   = new Date(year, month, 1).toLocaleString('id-ID', { month: 'long' });

  /* schedule & lock lookup */
  const shiftById = new Map(allShifts.map(s => [s.id, s.nama_shift]));
  const scheduleMap: Record<string, Record<number, string>> = {};
  const lockMap: Record<string, Record<number, number>> = {};
  mappings.forEach(m => {
    if (!shiftById.has(m.shift_id)) return;
    const d = new Date(m.tanggal);
    if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month) return;
    const day = d.getUTCDate();
    if (!scheduleMap[m.user_id]) scheduleMap[m.user_id] = {};
    if (!lockMap[m.user_id]) lockMap[m.user_id] = {};
    scheduleMap[m.user_id][day] = shiftById.get(m.shift_id)!;
    lockMap[m.user_id][day] = (m.lock_location === '1' || m.lock_location === 1) ? 1 : 0;
  });

  const wb = XLSX.utils.book_new();

  /* ── col indices (0-based) ──
     0=No, 1=Nama, 2..2+days-1=dates, 2+days=P, 2+days+1=S, 2+days+2=M, 2+days+3=LOCK */
  const COL_FIRST_DATE = 2;
  const COL_LAST_DATE  = COL_FIRST_DATE + daysInMonth - 1;
  const COL_P    = COL_LAST_DATE + 1;
  const COL_S    = COL_LAST_DATE + 2;
  const COL_M    = COL_LAST_DATE + 3;
  const COL_LOCK = COL_LAST_DATE + 4;

  const DATA_START = 7; // 0-indexed aoa row for first employee

  const aoa: any[][] = [];

  // Row 0: hospital
  aoa.push(['RUMAH SAKIT HJ. BUNDA HALIMAH']);
  // Row 1: blank
  aoa.push([]);
  // Row 2: title
  aoa.push(['JADWAL  DINAS']);
  // Row 3: month/year
  aoa.push([`${monthName} ${year}`]);
  // Row 4: TANGGAL label
  const tanggalRow: any[] = ['', ''];
  for (let d = 1; d <= daysInMonth; d++) tanggalRow.push(d === Math.ceil(daysInMonth / 2) ? 'TANGGAL' : '');
  tanggalRow.push('', '', '', '');
  aoa.push(tanggalRow);
  // Row 5: headers No | Nama | 1..31 | P | S | M | LOCK
  const headerRow: any[] = ['No', 'Nama'];
  for (let d = 1; d <= daysInMonth; d++) headerRow.push(d);
  headerRow.push('P', 'S', 'M', 'LOCK\n(1/0)');
  aoa.push(headerRow);
  // Row 6: day codes
  const codeRow: any[] = ['', ''];
  for (let d = 1; d <= daysInMonth; d++) codeRow.push(dayCode(new Date(year, month, d)));
  codeRow.push('', '', '', '');
  aoa.push(codeRow);

  // Employee data rows
  allEmployees.forEach((emp, idx) => {
    const row: any[] = [idx + 1, emp.name];
    let p = 0, s = 0, m = 0;
    // Compute per-employee dominant lock value (1 if any day is locked)
    let hasLock = false;
    for (let d = 1; d <= daysInMonth; d++) {
      const val = scheduleMap[emp.id]?.[d] ?? '';
      row.push(val);
      const vl = val.toLowerCase();
      if (vl.includes('pagi') || vl.includes('subuh')) p++;
      else if (vl.includes('siang') || vl.includes('sore')) s++;
      else if (vl.includes('malam')) m++;
      if (lockMap[emp.id]?.[d] === 1) hasLock = true;
    }
    row.push(p || '', s || '', m || '', hasLock ? 1 : 0);
    aoa.push(row);
  });

  // Blank + legend
  aoa.push([]);
  aoa.push(['', '', '', '', 'MINGGU/LIBUR']);
  aoa.push(['', '', '', '', 'CUTI']);
  aoa.push(['', '', '', '', 'CUTI BERSAMA/HARI BESAR']);

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  /* ── Column widths ── */
  const colWidths: XLSX.ColInfo[] = [
    { wch: 5 },   // No
    { wch: 28 },  // Nama
    ...Array.from({ length: daysInMonth }, () => ({ wch: 5 })),
    { wch: 4 }, { wch: 4 }, { wch: 4 }, // P S M
    { wch: 7 },   // LOCK
  ];
  ws['!cols'] = colWidths;

  /* ── Merges ── */
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: COL_LOCK } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: COL_LOCK } },
    { s: { r: 4, c: COL_FIRST_DATE }, e: { r: 4, c: COL_LAST_DATE } },
    { s: { r: 5, c: 0 }, e: { r: 6, c: 0 } },
    { s: { r: 5, c: 1 }, e: { r: 6, c: 1 } },
    { s: { r: 5, c: COL_P }, e: { r: 6, c: COL_P } },
    { s: { r: 5, c: COL_S }, e: { r: 6, c: COL_S } },
    { s: { r: 5, c: COL_M }, e: { r: 6, c: COL_M } },
    { s: { r: 5, c: COL_LOCK }, e: { r: 6, c: COL_LOCK } },
  ];

  /* ── Cell styles ── */
  const ec = (c: number, r: number) => XLSX.utils.encode_cell({ c, r });
  const cs = (addr: string, style: any) => { if (ws[addr]) ws[addr].s = style; };
  const RED_BG    = { fill: { patternType: 'solid', fgColor: { rgb: 'FF0000' } }, font: { bold: true, color: { rgb: 'FFFFFF' } } };
  const CYAN_BG   = { fill: { patternType: 'solid', fgColor: { rgb: '00FFFF' } }, font: { bold: true } };
  const ORANGE_BG = { fill: { patternType: 'solid', fgColor: { rgb: 'FF6600' } }, font: { bold: true, color: { rgb: 'FFFFFF' } } };

  cs(ec(0, 0), { font: { bold: true, sz: 14 } });
  cs(ec(0, 2), { font: { bold: true, sz: 16 }, alignment: { horizontal: 'center' } });
  cs(ec(0, 3), { font: { bold: true, sz: 13 }, alignment: { horizontal: 'center' } });

  // No/Nama header (rows 5-6)
  [ec(0,5), ec(1,5), ec(0,6), ec(1,6)].forEach(a => cs(a, ORANGE_BG));

  // Date header columns
  for (let d = 1; d <= daysInMonth; d++) {
    const ci = COL_FIRST_DATE + (d - 1);
    const isSun = new Date(year, month, d).getDay() === 0;
    const style = isSun ? RED_BG : CYAN_BG;
    cs(ec(ci, 5), style);
    cs(ec(ci, 6), style);
    if (isSun) {
      for (let ri = DATA_START; ri < DATA_START + allEmployees.length; ri++) {
        if (!ws[ec(ci, ri)]) ws[ec(ci, ri)] = { v: '', t: 's' };
        ws[ec(ci, ri)].s = { fill: { patternType: 'solid', fgColor: { rgb: 'FF0000' } } };
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Jadwal Dinas');

  /* ── Sheet 2: Referensi Shift ──
     Shift names listed here — user copies name exactly into date cells */
  const refRows: any[][] = [
    ['=== DAFTAR NAMA SHIFT (salin persis ke kolom tanggal) ==='],
    [],
    ['ID Shift', 'Nama Shift', 'Jam Masuk', 'Jam Keluar'],
    ...allShifts.map(s => [s.id, s.nama_shift, s.jam_masuk, s.jam_keluar]),
  ];
  const wsRef = XLSX.utils.aoa_to_sheet(refRows);
  wsRef['!cols'] = [{ wch: 10 }, { wch: 35 }, { wch: 12 }, { wch: 12 }];
  if (wsRef['A1']) wsRef['A1'].s = { font: { bold: true, color: { rgb: 'CC0000' } } };
  XLSX.utils.book_append_sheet(wb, wsRef, 'Referensi Shift');

  /* ── Sheet 3: Referensi Karyawan ── */
  const wsEmp = XLSX.utils.aoa_to_sheet([
    ['ID Karyawan', 'Nama', 'Username', 'Jabatan'],
    ...allEmployees.map(e => [e.id, e.name, e.username, e.jabatan?.nama_jabatan ?? '-']),
  ]);
  wsEmp['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 20 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsEmp, 'Referensi Karyawan');

  XLSX.writeFile(wb, `Jadwal_Dinas_${monthName}_${year}.xlsx`);
}

/* ══════════════════════════════════════════════════════════════
   PARSE — Read Jadwal Dinas Excel → ImportRow[]
══════════════════════════════════════════════════════════════ */
export async function parseDinasExcel(
  file: File,
  availableShifts: Shift[],
  allEmployees: Employee[],
): Promise<ImportRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array', cellDates: true });

        /* Lookup maps */
        const nameToId    = new Map(allEmployees.map(emp => [emp.name.toLowerCase().trim(), emp.id]));
        const nameToShift = new Map(availableShifts.map(s => [s.nama_shift.toLowerCase().trim(), s]));

        /* Enrich from reference sheets */
        const refEmpWs = wb.Sheets['Referensi Karyawan'];
        if (refEmpWs) {
          XLSX.utils.sheet_to_json<any>(refEmpWs, { defval: '' }).forEach((row: any) => {
            const id   = String(row['ID Karyawan'] ?? '').trim();
            const name = String(row['Nama'] ?? '').toLowerCase().trim();
            if (id && name) nameToId.set(name, id);
          });
        }
        const refShiftWs = wb.Sheets['Referensi Shift'];
        if (refShiftWs) {
          XLSX.utils.sheet_to_json<any>(refShiftWs, { defval: '' }).forEach((row: any) => {
            const id   = String(row['ID Shift'] ?? '').trim();
            const name = String(row['Nama Shift'] ?? '').toLowerCase().trim();
            if (id && name && !nameToShift.has(name)) {
              nameToShift.set(name, {
                id, nama_shift: String(row['Nama Shift']),
                jam_masuk: String(row['Jam Masuk'] ?? ''),
                jam_keluar: String(row['Jam Keluar'] ?? ''),
              });
            }
          });
        }

        const ws  = wb.Sheets[wb.SheetNames[0]];
        const aoa: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];

        /* Find date header row (≥20 integers 1–31 in cols 2+) */
        let headerRowIdx = -1;
        for (let ri = 0; ri < Math.min(aoa.length, 15); ri++) {
          let cnt = 0;
          for (let ci = 2; ci < aoa[ri].length; ci++) {
            const v = Number(aoa[ri][ci]);
            if (Number.isInteger(v) && v >= 1 && v <= 31) cnt++;
          }
          if (cnt >= 20) { headerRowIdx = ri; break; }
        }
        if (headerRowIdx === -1) throw new Error('Format tidak dikenali: baris tanggal 1-31 tidak ditemukan');

        /* col index → day of month */
        const colToDay: Record<number, number> = {};
        let lockColIdx = -1; // column index of the LOCK column
        aoa[headerRowIdx].forEach((v: any, ci: number) => {
          const n = Number(v);
          if (ci >= 2 && Number.isInteger(n) && n >= 1 && n <= 31) colToDay[ci] = n;
          // Detect LOCK column by header text
          if (ci >= 2 && String(v).toLowerCase().includes('lock')) lockColIdx = ci;
        });
        const dayCols = Object.keys(colToDay).map(Number).sort((a, b) => a - b);

        /* year + month */
        let year = new Date().getFullYear(), month = new Date().getMonth();
        for (let ri = 0; ri < headerRowIdx; ri++) {
          const str = aoa[ri].join(' ');
          const mx  = str.match(/([A-Za-z]+)\s+(20\d{2})/);
          if (mx) {
            const mn = ['januari','februari','maret','april','mei','juni','juli','agustus','september','oktober','november','desember'];
            const mi = mn.indexOf(mx[1].toLowerCase());
            if (mi !== -1) { month = mi; year = parseInt(mx[2]); break; }
          }
        }
        const mStr = pad(month + 1);

        const legendKw  = ['minggu', 'libur', 'cuti', 'hari besar', 'daftar shift', '==='];
        const rows: ImportRow[] = [];
        let rowIndex = 1;

        for (let ri = headerRowIdx + 1; ri < aoa.length; ri++) {
          const row = aoa[ri];
          const nameCell = String(row[1] ?? '').trim();
          if (!nameCell) continue;
          if (legendKw.some(kw => nameCell.toLowerCase().includes(kw))) break;
          // Skip day-code sub-header row
          if (/^[SsRrKkJjMm]$/.test(nameCell)) continue;
          // Skip rows that look like numeric-only (No. column in header area)
          if (/^No$/i.test(nameCell) || /^Nama$/i.test(nameCell)) continue;

          const empId = nameToId.get(nameCell.toLowerCase()) ?? null;

          /* Read per-row lock value from LOCK column */
          let rowLock = 0;
          if (lockColIdx !== -1) {
            const lockVal = String(row[lockColIdx] ?? '').trim();
            rowLock = lockVal === '1' ? 1 : 0;
          }

          /* Build day → shift map */
          const dayShiftMap: Record<number, Shift> = {};
          for (const ci of dayCols) {
            const v = String(row[ci] ?? '').trim();
            if (!v) continue;
            const lower = v.toLowerCase();
            // Exact match first
            let matched = nameToShift.get(lower);
            // Prefix match
            if (!matched) for (const [k, s] of nameToShift) { if (k.startsWith(lower) || lower.startsWith(k)) { matched = s; break; } }
            // Contains match
            if (!matched) for (const [k, s] of nameToShift) { if (k.includes(lower) || lower.includes(k)) { matched = s; break; } }
            if (matched) dayShiftMap[colToDay[ci]] = matched;
          }
          if (!Object.keys(dayShiftMap).length) continue;

          /* Group consecutive days with same shift into ranges */
          const sorted = Object.keys(dayShiftMap).map(Number).sort((a, b) => a - b);
          let rStart = sorted[0], rEnd = sorted[0], cur = dayShiftMap[rStart];

          const flush = () => rows.push({
            rowIndex: rowIndex++,
            user_id:       empId ?? '',
            user_name:     nameCell,
            shift_id:      cur.id,
            shift_name:    cur.nama_shift,
            tanggal_mulai: `${year}-${mStr}-${pad(rStart)}`,
            tanggal_akhir: `${year}-${mStr}-${pad(rEnd)}`,
            lock_location: rowLock,
            status:        empId ? 'pending' : 'error',
            message:       empId ? undefined : `Karyawan "${nameCell}" tidak ditemukan di sistem`,
          });

          for (let di = 1; di < sorted.length; di++) {
            const day = sorted[di], sf = dayShiftMap[day];
            if (day === rEnd + 1 && sf.id === cur.id) rEnd = day;
            else { flush(); rStart = day; rEnd = day; cur = sf; }
          }
          flush();
        }

        if (!rows.length) throw new Error('Tidak ada data karyawan yang berhasil dibaca');
        resolve(rows);
      } catch (err: any) {
        reject(new Error(err.message ?? 'Gagal membaca file'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsArrayBuffer(file);
  });
}
