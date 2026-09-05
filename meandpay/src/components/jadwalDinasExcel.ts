/**
 * jadwalDinasExcel.ts
 * Generate & parse "Jadwal Dinas" Excel using ExcelJS.
 * ExcelJS fully supports Data Validation dropdowns natively.
 */
import ExcelJS from 'exceljs';

/* ── Types (mirrored from ShiftEmployeesPage) ──────────────── */
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

/* ── Day-of-week code (Indonesian) ────────────────────────── */
function dayCode(date: Date): string {
  return ['M', 'S', 'S', 'R', 'K', 'J', 'S'][date.getDay()];
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

/* ── Color helpers ─────────────────────────────────────────── */
const RED    = { argb: 'FFFF0000' };
const CYAN   = { argb: 'FF00FFFF' };
const ORANGE = { argb: 'FFFF6600' };
const YELLOW = { argb: 'FFFFFF00' };
const WHITE  = { argb: 'FFFFFFFF' };
const BLACK  = { argb: 'FF000000' };

function solidFill(color: ExcelJS.Color): Partial<ExcelJS.Fill> {
  return { type: 'pattern', pattern: 'solid', fgColor: color };
}

/* ══════════════════════════════════════════════════════════════
   GENERATE — Download Jadwal Dinas template with DV dropdowns
═══════════════════════════════════════════════════════════════ */
export async function generateJadwalDinas(
  allEmployees: Employee[],
  allShifts: Shift[],
  mappings: MappingData[],
  year: number,
  month: number  // 0-indexed
): Promise<void> {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName   = new Date(year, month, 1).toLocaleString('id-ID', { month: 'long' });

  /* --- Schedule lookup: userId → { day: shiftName } --- */
  const shiftById = new Map(allShifts.map(s => [s.id, s.nama_shift]));
  const scheduleMap: Record<string, Record<number, string>> = {};
  mappings.forEach(m => {
    if (!shiftById.has(m.shift_id)) return;
    const d = new Date(m.tanggal);
    if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month) return;
    if (!scheduleMap[m.user_id]) scheduleMap[m.user_id] = {};
    scheduleMap[m.user_id][d.getUTCDate()] = shiftById.get(m.shift_id)!;
  });

  /* --- Dropdown list string for DV --- */
  const shiftDropdown = '"' + allShifts.map(s => s.nama_shift).join(',') + '"';

  /* ── Build workbook ── */
  const wb = new ExcelJS.Workbook();

  /* ══ Sheet 1: Jadwal Dinas ══ */
  const ws = wb.addWorksheet('Jadwal Dinas');

  // Column widths: No(5), Nama(30), day cols(14 each), P/S/M(6 each)
  const cols: Partial<ExcelJS.Column>[] = [
    { width: 5 },   // A = No
    { width: 30 },  // B = Nama
  ];
  for (let d = 1; d <= daysInMonth; d++) cols.push({ width: 14 });
  cols.push({ width: 6 }, { width: 6 }, { width: 6 });
  ws.columns = cols;

  /* --- Row 1: Hospital name --- */
  ws.mergeCells(1, 1, 1, 6);
  const r1 = ws.getRow(1);
  r1.getCell(1).value = 'RUMAH SAKIT HJ. BUNDA HALIMAH';
  r1.getCell(1).font = { bold: true, size: 14 };

  /* --- Row 2: blank --- */

  /* --- Row 3: JADWAL DINAS --- */
  ws.mergeCells(3, 1, 3, daysInMonth + 5);
  const r3 = ws.getRow(3);
  r3.getCell(1).value = 'JADWAL  DINAS';
  r3.getCell(1).font = { bold: true, size: 16 };
  r3.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  r3.height = 24;

  /* --- Row 4: month/year --- */
  ws.mergeCells(4, 1, 4, daysInMonth + 5);
  const r4 = ws.getRow(4);
  r4.getCell(1).value = `${monthName} ${year}`;
  r4.getCell(1).font = { bold: true, size: 13 };
  r4.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

  /* --- Row 5: "TANGGAL" label spanning date cols --- */
  ws.mergeCells(5, 3, 5, daysInMonth + 2);
  const r5 = ws.getRow(5);
  r5.getCell(3).value = 'TANGGAL';
  r5.getCell(3).font = { bold: true };
  r5.getCell(3).alignment = { horizontal: 'center' };

  /* --- Row 6: column headers No | Nama | 1..31 | P | S | M --- */
  // Merge No and Nama across rows 6-7
  ws.mergeCells(6, 1, 7, 1); // No
  ws.mergeCells(6, 2, 7, 2); // Nama
  // Merge P/S/M across rows 6-7
  ws.mergeCells(6, daysInMonth + 3, 7, daysInMonth + 3); // P
  ws.mergeCells(6, daysInMonth + 4, 7, daysInMonth + 4); // S
  ws.mergeCells(6, daysInMonth + 5, 7, daysInMonth + 5); // M

  const r6 = ws.getRow(6);
  r6.height = 18;
  r6.getCell(1).value = 'No';
  r6.getCell(2).value = 'Nama';

  for (let d = 1; d <= daysInMonth; d++) {
    const cell = r6.getCell(d + 2);
    cell.value = d;
    const isSun = new Date(year, month, d).getDay() === 0;
    cell.fill = solidFill(isSun ? RED : CYAN);
    cell.font = { bold: true, color: isSun ? WHITE : BLACK };
    cell.alignment = { horizontal: 'center' };
    cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  }

  // Style No/Nama headers
  [r6.getCell(1), r6.getCell(2)].forEach(c => {
    c.fill = solidFill(ORANGE);
    c.font = { bold: true, color: WHITE };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
    c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  });

  // P/S/M header
  ['P', 'S', 'M'].forEach((lbl, i) => {
    const c = r6.getCell(daysInMonth + 3 + i);
    c.value = lbl;
    c.font = { bold: true };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
    c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  });

  /* --- Row 7: day-of-week codes --- */
  const r7 = ws.getRow(7);
  r7.height = 15;
  for (let d = 1; d <= daysInMonth; d++) {
    const cell = r7.getCell(d + 2);
    cell.value = dayCode(new Date(year, month, d));
    const isSun = new Date(year, month, d).getDay() === 0;
    cell.fill = solidFill(isSun ? RED : CYAN);
    cell.font = { bold: true, color: isSun ? WHITE : BLACK };
    cell.alignment = { horizontal: 'center' };
    cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  }
  // Style No/Nama in row 7 (part of merge)
  [r7.getCell(1), r7.getCell(2)].forEach(c => {
    c.fill = solidFill(ORANGE);
    c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  });

  /* --- Data rows (row 8+): employee data --- */
  const DATA_START_XLSX_ROW = 8; // 1-indexed Excel row
  allEmployees.forEach((emp, idx) => {
    const rowNum = DATA_START_XLSX_ROW + idx;
    const row = ws.getRow(rowNum);
    row.height = 18;

    row.getCell(1).value = idx + 1;
    row.getCell(1).alignment = { horizontal: 'center' };
    row.getCell(1).border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

    row.getCell(2).value = emp.name;
    row.getCell(2).border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

    let pCount = 0, sCount = 0, mCount = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const cell = row.getCell(d + 2);
      const val = scheduleMap[emp.id]?.[d] ?? '';
      cell.value = val || null;
      cell.alignment = { horizontal: 'center', wrapText: false };
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

      const isSun = new Date(year, month, d).getDay() === 0;
      if (isSun) cell.fill = solidFill(RED);

      /* ── DATA VALIDATION DROPDOWN ── */
      cell.dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [shiftDropdown],
        showErrorMessage: true,
        error: 'Pilih nama shift dari daftar',
        errorTitle: 'Nilai tidak valid',
        showInputMessage: true,
        promptTitle: 'Pilih Shift',
        prompt: allShifts.map(s => s.nama_shift).join(', '),
      };

      const vl = val.toLowerCase();
      if (vl.includes('pagi') || vl.includes('subuh')) pCount++;
      else if (vl.includes('siang') || vl.includes('sore')) sCount++;
      else if (vl.includes('malam')) mCount++;
    }

    // P/S/M totals
    row.getCell(daysInMonth + 3).value = pCount || null;
    row.getCell(daysInMonth + 4).value = sCount || null;
    row.getCell(daysInMonth + 5).value = mCount || null;
    [daysInMonth + 3, daysInMonth + 4, daysInMonth + 5].forEach(ci => {
      const c = row.getCell(ci);
      c.alignment = { horizontal: 'center' };
      c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    });
  });

  /* --- Legend rows --- */
  const legRow = DATA_START_XLSX_ROW + allEmployees.length + 1;
  const legends: [string, ExcelJS.Color][] = [
    ['MINGGU/LIBUR', RED],
    ['CUTI', YELLOW],
    ['CUTI BERSAMA/HARI BESAR', YELLOW],
  ];
  legends.forEach(([label, color], i) => {
    const row = ws.getRow(legRow + i);
    const colorCell = row.getCell(4);
    const labelCell = row.getCell(5);
    colorCell.fill = solidFill(color);
    colorCell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    labelCell.value = label;
  });

  /* ══ Sheet 2: Referensi Shift ══ */
  const wsRef = wb.addWorksheet('Referensi Shift');
  wsRef.columns = [{ width: 10 }, { width: 30 }, { width: 14 }, { width: 14 }];
  wsRef.addRow(['ID Shift', 'Nama Shift', 'Jam Masuk', 'Jam Keluar']).font = { bold: true };
  allShifts.forEach(s => wsRef.addRow([s.id, s.nama_shift, s.jam_masuk, s.jam_keluar]));

  /* ══ Sheet 3: Referensi Karyawan ══ */
  const wsEmp = wb.addWorksheet('Referensi Karyawan');
  wsEmp.columns = [{ width: 12 }, { width: 30 }, { width: 20 }, { width: 25 }];
  wsEmp.addRow(['ID Karyawan', 'Nama', 'Username', 'Jabatan']).font = { bold: true };
  allEmployees.forEach(e =>
    wsEmp.addRow([e.id, e.name, e.username, e.jabatan?.nama_jabatan ?? '-'])
  );

  /* ── Download ── */
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = `Jadwal_Dinas_${monthName}_${year}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ══════════════════════════════════════════════════════════════
   PARSE — Read Jadwal Dinas Excel back into ImportRow[]
═══════════════════════════════════════════════════════════════ */
export async function parseDinasExcel(
  file: File,
  availableShifts: Shift[],
  allEmployees: Employee[]
): Promise<ImportRow[]> {
  /* --- Lookup maps --- */
  const nameToId  = new Map(allEmployees.map(e => [e.name.toLowerCase().trim(), e.id]));
  const nameToShift = new Map(availableShifts.map(s => [s.nama_shift.toLowerCase().trim(), s]));

  /* --- Read file --- */
  const buf = await file.arrayBuffer();
  const wb  = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);

  // Enrich nameToId from "Referensi Karyawan" sheet if present
  const refEmpWs = wb.getWorksheet('Referensi Karyawan');
  if (refEmpWs) {
    refEmpWs.eachRow((row, ri) => {
      if (ri < 2) return;
      const id   = String(row.getCell(1).value ?? '').trim();
      const name = String(row.getCell(2).value ?? '').toLowerCase().trim();
      if (id && name) nameToId.set(name, id);
    });
  }

  // Enrich nameToShift from "Referensi Shift" sheet
  const refShiftWs = wb.getWorksheet('Referensi Shift');
  if (refShiftWs) {
    refShiftWs.eachRow((row, ri) => {
      if (ri < 2) return;
      const id   = String(row.getCell(1).value ?? '').trim();
      const name = String(row.getCell(2).value ?? '').toLowerCase().trim();
      const jam_masuk  = String(row.getCell(3).value ?? '');
      const jam_keluar = String(row.getCell(4).value ?? '');
      if (id && name && !nameToShift.has(name)) {
        nameToShift.set(name, { id, nama_shift: row.getCell(2).value as string, jam_masuk, jam_keluar });
      }
    });
  }

  /* --- Find the schedule sheet (first sheet) --- */
  const ws = wb.worksheets[0];
  if (!ws) throw new Error('Tidak ada sheet ditemukan');

  /* --- Find date header row (row where cols 3+ contain integers 1–31) --- */
  let headerRowNum = -1;
  ws.eachRow((row, ri) => {
    if (headerRowNum !== -1) return;
    let dateCount = 0;
    row.eachCell({ includeEmpty: false }, (cell, ci) => {
      if (ci >= 3) {
        const v = Number(cell.value);
        if (Number.isInteger(v) && v >= 1 && v <= 31) dateCount++;
      }
    });
    if (dateCount >= 20) headerRowNum = ri;
  });
  if (headerRowNum === -1) throw new Error('Format tidak dikenali: baris tanggal 1-31 tidak ditemukan');

  /* --- Build colIndex → dayOfMonth map --- */
  const headerRow = ws.getRow(headerRowNum);
  const colToDay: Record<number, number> = {};
  headerRow.eachCell({ includeEmpty: false }, (cell, ci) => {
    const v = Number(cell.value);
    if (ci >= 3 && Number.isInteger(v) && v >= 1 && v <= 31) colToDay[ci] = v;
  });
  const dayCols = Object.keys(colToDay).map(Number).sort((a, b) => a - b);

  /* --- Extract year+month from header rows --- */
  let year = new Date().getFullYear();
  let month = new Date().getMonth();
  for (let ri = 1; ri < headerRowNum; ri++) {
    const rowStr = ws.getRow(ri).values?.join(' ') ?? '';
    const match = rowStr.match(/([A-Za-z]+)\s+(20\d{2})/);
    if (match) {
      const monthNames = ['januari','februari','maret','april','mei','juni','juli','agustus','september','oktober','november','desember'];
      const mIdx = monthNames.indexOf(match[1].toLowerCase());
      if (mIdx !== -1) { month = mIdx; year = parseInt(match[2]); break; }
    }
  }
  const monthStr = pad(month + 1);

  /* --- Parse employee rows --- */
  const legendKeywords = ['minggu', 'libur', 'cuti', 'hari besar'];
  const rows: ImportRow[] = [];
  let rowIndex = 1;

  for (let ri = headerRowNum + 1; ri <= ws.rowCount; ri++) {
    const row = ws.getRow(ri);
    const nameCell = String(row.getCell(2).value ?? '').trim();
    if (!nameCell) continue;
    if (legendKeywords.some(kw => nameCell.toLowerCase().includes(kw))) break;
    if (/^[SsRrKkJjMm]$/.test(nameCell)) continue; // day-code sub-header

    const employeeId = nameToId.get(nameCell.toLowerCase()) ?? null;

    /* Build day → shift map for this row */
    const dayShiftMap: Record<number, Shift> = {};
    for (const ci of dayCols) {
      const cellVal = String(row.getCell(ci).value ?? '').trim();
      if (!cellVal) continue;
      const lower = cellVal.toLowerCase();
      let matched = nameToShift.get(lower);
      if (!matched) {
        for (const [key, s] of nameToShift) {
          if (key.startsWith(lower) || lower.startsWith(key)) { matched = s; break; }
        }
      }
      if (!matched) {
        for (const [key, s] of nameToShift) {
          if (key.includes(lower) || lower.includes(key)) { matched = s; break; }
        }
      }
      if (matched) dayShiftMap[colToDay[ci]] = matched;
    }

    if (Object.keys(dayShiftMap).length === 0) continue;

    /* Group consecutive days with same shift into ranges */
    const sortedDays = Object.keys(dayShiftMap).map(Number).sort((a, b) => a - b);
    let rangeStart = sortedDays[0];
    let rangeEnd   = sortedDays[0];
    let curShift   = dayShiftMap[rangeStart];

    const flush = () => {
      rows.push({
        rowIndex: rowIndex++,
        user_id:       employeeId ?? '',
        user_name:     nameCell,
        shift_id:      curShift.id,
        shift_name:    curShift.nama_shift,
        tanggal_mulai: `${year}-${monthStr}-${pad(rangeStart)}`,
        tanggal_akhir: `${year}-${monthStr}-${pad(rangeEnd)}`,
        lock_location: 0,
        status:        employeeId ? 'pending' : 'error',
        message:       employeeId ? undefined : `Karyawan "${nameCell}" tidak ditemukan di sistem`,
      });
    };

    for (let di = 1; di < sortedDays.length; di++) {
      const day = sortedDays[di];
      const shiftForDay = dayShiftMap[day];
      if (day === rangeEnd + 1 && shiftForDay.id === curShift.id) {
        rangeEnd = day;
      } else {
        flush();
        rangeStart = day; rangeEnd = day; curShift = shiftForDay;
      }
    }
    flush();
  }

  if (rows.length === 0) throw new Error('Tidak ada data karyawan yang berhasil dibaca dari file');
  return rows;
}
