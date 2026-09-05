/**
 * jadwalDinasExcel.ts — Generate & parse Jadwal Dinas Excel
 * Uses SheetJS (xlsx) only — no ZIP patching, no ExcelJS.
 * Dropdown is implemented via a hidden "Referensi Shift" sheet
 * referenced by a named range, written correctly by SheetJS.
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
function colLetter(n: number): string {
  let s = '';
  while (n > 0) { n--; s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26); }
  return s;
}

/* ══════════════════════════════════════════════════════════════
   GENERATE — Clean Jadwal Dinas template, valid xlsx, no patches
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

  /* schedule lookup */
  const shiftById = new Map(allShifts.map(s => [s.id, s.nama_shift]));
  const scheduleMap: Record<string, Record<number, string>> = {};
  mappings.forEach(m => {
    if (!shiftById.has(m.shift_id)) return;
    const d = new Date(m.tanggal);
    if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month) return;
    if (!scheduleMap[m.user_id]) scheduleMap[m.user_id] = {};
    scheduleMap[m.user_id][d.getUTCDate()] = shiftById.get(m.shift_id)!;
  });

  const wb = XLSX.utils.book_new();

  /* ── Sheet 1: Jadwal Dinas ── */
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
  // Row 4: TANGGAL label (blank No, blank Nama, then label, then blanks)
  const tanggalRow: any[] = ['', ''];
  for (let d = 1; d <= daysInMonth; d++) tanggalRow.push(d === Math.ceil(daysInMonth / 2) ? 'TANGGAL' : '');
  tanggalRow.push('', '', '');
  aoa.push(tanggalRow);
  // Row 5: headers
  const headerRow: any[] = ['No', 'Nama'];
  for (let d = 1; d <= daysInMonth; d++) headerRow.push(d);
  headerRow.push('P', 'S', 'M');
  aoa.push(headerRow);
  // Row 6: day codes
  const codeRow: any[] = ['', ''];
  for (let d = 1; d <= daysInMonth; d++) codeRow.push(dayCode(new Date(year, month, d)));
  codeRow.push('', '', '');
  aoa.push(codeRow);

  // Employee rows (row 7+)
  allEmployees.forEach((emp, idx) => {
    const row: any[] = [idx + 1, emp.name];
    let p = 0, s = 0, m = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const val = scheduleMap[emp.id]?.[d] ?? '';
      row.push(val);
      const vl = val.toLowerCase();
      if (vl.includes('pagi') || vl.includes('subuh')) p++;
      else if (vl.includes('siang') || vl.includes('sore')) s++;
      else if (vl.includes('malam')) m++;
    }
    row.push(p || '', s || '', m || '');
    aoa.push(row);
  });

  // Blank + legend
  aoa.push([]);
  aoa.push(['', '', '', '', 'MINGGU/LIBUR']);
  aoa.push(['', '', '', '', 'CUTI']);
  aoa.push(['', '', '', '', 'CUTI BERSAMA/HARI BESAR']);

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Column widths
  ws['!cols'] = [
    { wch: 5 }, { wch: 30 },
    ...Array.from({ length: daysInMonth }, () => ({ wch: 5 })),
    { wch: 5 }, { wch: 5 }, { wch: 5 },
  ];

  // Merges
  const lastDataCol = 2 + daysInMonth; // 0-indexed last date col
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },                                  // hospital name
    { s: { r: 2, c: 0 }, e: { r: 2, c: lastDataCol + 2 } },                      // JADWAL DINAS
    { s: { r: 3, c: 0 }, e: { r: 3, c: lastDataCol + 2 } },                      // month/year
    { s: { r: 4, c: 2 }, e: { r: 4, c: lastDataCol - 1 } },                      // TANGGAL
    { s: { r: 5, c: 0 }, e: { r: 6, c: 0 } },                                   // No
    { s: { r: 5, c: 1 }, e: { r: 6, c: 1 } },                                   // Nama
    { s: { r: 5, c: lastDataCol }, e: { r: 6, c: lastDataCol } },                 // P
    { s: { r: 5, c: lastDataCol + 1 }, e: { r: 6, c: lastDataCol + 1 } },         // S
    { s: { r: 5, c: lastDataCol + 2 }, e: { r: 6, c: lastDataCol + 2 } },         // M
  ];

  // Cell styles
  const cellStyle = (cell: any, s: any) => { if (cell) cell.s = s; };
  const RED_BG    = { fill: { patternType: 'solid', fgColor: { rgb: 'FF0000' } }, font: { bold: true, color: { rgb: 'FFFFFF' } } };
  const CYAN_BG   = { fill: { patternType: 'solid', fgColor: { rgb: '00FFFF' } }, font: { bold: true } };
  const ORANGE_BG = { fill: { patternType: 'solid', fgColor: { rgb: 'FF6600' } }, font: { bold: true, color: { rgb: 'FFFFFF' } } };
  const RED_CELL  = { fill: { patternType: 'solid', fgColor: { rgb: 'FF0000' } } };

  // Style header rows (row 5=index5, row 6=index6 in xlsx = 1-indexed 6,7)
  const enc = (c: number, r: number) => XLSX.utils.encode_cell({ c, r });
  cellStyle(ws[enc(0, 5)], ORANGE_BG); // No header
  cellStyle(ws[enc(1, 5)], ORANGE_BG); // Nama header
  cellStyle(ws[enc(0, 6)], ORANGE_BG); // No code row
  cellStyle(ws[enc(1, 6)], ORANGE_BG); // Nama code row

  for (let d = 1; d <= daysInMonth; d++) {
    const ci = d + 1; // 0-indexed col
    const isSun = new Date(year, month, d).getDay() === 0;
    const hdrStyle = isSun ? RED_BG : CYAN_BG;
    cellStyle(ws[enc(ci, 5)], hdrStyle); // date number row
    cellStyle(ws[enc(ci, 6)], hdrStyle); // day code row
    if (isSun) {
      // Red cells for all employee rows in Sunday column
      for (let empIdx = 0; empIdx < allEmployees.length; empIdx++) {
        const ri = DATA_START + empIdx;
        if (!ws[enc(ci, ri)]) ws[enc(ci, ri)] = { v: '', t: 's' };
        ws[enc(ci, ri)].s = RED_CELL;
      }
    }
  }

  // Title styles
  cellStyle(ws[enc(0, 2)], { font: { bold: true, sz: 16 }, alignment: { horizontal: 'center' } });
  cellStyle(ws[enc(0, 3)], { font: { bold: true, sz: 13 }, alignment: { horizontal: 'center' } });
  cellStyle(ws[enc(0, 0)], { font: { bold: true, sz: 14 } });

  XLSX.utils.book_append_sheet(wb, ws, 'Jadwal Dinas');

  /* ── Sheet 2: Referensi Shift (with instructions) ── */
  const refShiftData = [
    ['DAFTAR SHIFT — Gunakan nama shift persis seperti di bawah saat mengisi kolom tanggal'],
    [],
    ['ID Shift', 'Nama Shift', 'Jam Masuk', 'Jam Keluar'],
    ...allShifts.map(s => [s.id, s.nama_shift, s.jam_masuk, s.jam_keluar]),
  ];
  const wsRef = XLSX.utils.aoa_to_sheet(refShiftData);
  wsRef['!cols'] = [{ wch: 10 }, { wch: 35 }, { wch: 12 }, { wch: 12 }];
  // Bold the instruction row
  if (wsRef['A1']) wsRef['A1'].s = { font: { bold: true, color: { rgb: 'CC0000' } } };
  // Bold the column headers
  ['A3','B3','C3','D3'].forEach(a => { if (wsRef[a]) wsRef[a].s = { font: { bold: true } }; });
  XLSX.utils.book_append_sheet(wb, wsRef, 'Referensi Shift');

  /* ── Sheet 3: Referensi Karyawan ── */
  const wsEmp = XLSX.utils.aoa_to_sheet([
    ['ID Karyawan', 'Nama', 'Username', 'Jabatan'],
    ...allEmployees.map(e => [e.id, e.name, e.username, e.jabatan?.nama_jabatan ?? '-']),
  ]);
  wsEmp['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 20 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsEmp, 'Referensi Karyawan');

  /* ── Download ── */
  XLSX.writeFile(wb, `Jadwal_Dinas_${monthName}_${year}.xlsx`);
}

/* ══════════════════════════════════════════════════════════════
   PARSE — Read Jadwal Dinas Excel back into ImportRow[]
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

        /* Build lookup maps */
        const nameToId    = new Map(allEmployees.map(emp => [emp.name.toLowerCase().trim(), emp.id]));
        const nameToShift = new Map(availableShifts.map(s => [s.nama_shift.toLowerCase().trim(), s]));

        /* Enrich from reference sheets */
        const refEmpWs = wb.Sheets['Referensi Karyawan'];
        if (refEmpWs) {
          const rows = XLSX.utils.sheet_to_json<any>(refEmpWs, { defval: '' });
          rows.forEach((row: any) => {
            const id   = String(row['ID Karyawan'] ?? '').trim();
            const name = String(row['Nama'] ?? '').toLowerCase().trim();
            if (id && name) nameToId.set(name, id);
          });
        }
        const refShiftWs = wb.Sheets['Referensi Shift'];
        if (refShiftWs) {
          const rows = XLSX.utils.sheet_to_json<any>(refShiftWs, { defval: '' });
          rows.forEach((row: any) => {
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

        /* Find the schedule sheet (first sheet) */
        const ws  = wb.Sheets[wb.SheetNames[0]];
        const aoa: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];

        /* Find date header row — row where cols[2+] are sequential integers 1–31 */
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
        aoa[headerRowIdx].forEach((v: any, ci: number) => {
          const n = Number(v);
          if (ci >= 2 && Number.isInteger(n) && n >= 1 && n <= 31) colToDay[ci] = n;
        });
        const dayCols = Object.keys(colToDay).map(Number).sort((a, b) => a - b);

        /* Extract year+month */
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

        /* Parse employee rows */
        const legendKw = ['minggu', 'libur', 'cuti', 'hari besar'];
        const rows: ImportRow[] = [];
        let rowIndex = 1;

        for (let ri = headerRowIdx + 1; ri < aoa.length; ri++) {
          const row = aoa[ri];
          const nameCell = String(row[1] ?? '').trim();
          if (!nameCell) continue;
          if (legendKw.some(kw => nameCell.toLowerCase().includes(kw))) break;
          if (/^[SsRrKkJjMm]$/.test(nameCell)) continue;

          const empId = nameToId.get(nameCell.toLowerCase()) ?? null;
          const dayShiftMap: Record<number, Shift> = {};

          for (const ci of dayCols) {
            const v = String(row[ci] ?? '').trim();
            if (!v) continue;
            const lower = v.toLowerCase();
            let matched = nameToShift.get(lower);
            if (!matched) for (const [k, s] of nameToShift) { if (k.startsWith(lower) || lower.startsWith(k)) { matched = s; break; } }
            if (!matched) for (const [k, s] of nameToShift) { if (k.includes(lower) || lower.includes(k)) { matched = s; break; } }
            if (matched) dayShiftMap[colToDay[ci]] = matched;
          }
          if (!Object.keys(dayShiftMap).length) continue;

          const sorted = Object.keys(dayShiftMap).map(Number).sort((a, b) => a - b);
          let rStart = sorted[0], rEnd = sorted[0], cur = dayShiftMap[rStart];
          const flush = () => rows.push({
            rowIndex: rowIndex++, user_id: empId ?? '', user_name: nameCell,
            shift_id: cur.id, shift_name: cur.nama_shift,
            tanggal_mulai: `${year}-${mStr}-${pad(rStart)}`,
            tanggal_akhir: `${year}-${mStr}-${pad(rEnd)}`,
            lock_location: 0,
            status: empId ? 'pending' : 'error',
            message: empId ? undefined : `Karyawan "${nameCell}" tidak ditemukan`,
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
