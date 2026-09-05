/**
 * jadwalDinasExcel.ts
 * Generate "Jadwal Dinas" Excel template with working Data Validation dropdowns.
 *
 * Strategy:
 *   1. Build the workbook with ExcelJS (layout, styles, data).
 *   2. Write it to an ArrayBuffer via ExcelJS (valid xlsx).
 *   3. Use fflate to unzip the xlsx, patch xl/worksheets/sheet1.xml to inject
 *      a single <dataValidations> block, then re-zip.
 *   4. Trigger download.
 *
 * Why patch instead of using ExcelJS dataValidations API?
 *   ExcelJS generates non-standard DV XML that Excel strips on open.
 *   Hand-written OOXML <dataValidations> is the only reliable approach
 *   without a server-side library.
 */
import ExcelJS from 'exceljs';
import { unzipSync, zipSync } from 'fflate';

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

/* ── Helpers ────────────────────────────────────────────────── */
function dayCode(date: Date): string {
  return ['M', 'S', 'S', 'R', 'K', 'J', 'S'][date.getDay()];
}
function pad(n: number) { return String(n).padStart(2, '0'); }

// Escape characters that are invalid inside XML text content / attribute values
function xmlEscape(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const solidFill = (argb: string): Partial<ExcelJS.Fill> => ({
  type: 'pattern', pattern: 'solid', fgColor: { argb },
});
const border: Partial<ExcelJS.Border> = { style: 'thin' };
const allBorders = { top: border, bottom: border, left: border, right: border };

/* ══════════════════════════════════════════════════════════════
   GENERATE
══════════════════════════════════════════════════════════════ */
export async function generateJadwalDinas(
  allEmployees: Employee[],
  allShifts: Shift[],
  mappings: MappingData[],
  year: number,
  month: number,
): Promise<void> {
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

  /* ── Build workbook with ExcelJS (NO dataValidations here) ── */
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Jadwal Dinas');

  // Column widths
  ws.columns = [
    { width: 5 }, { width: 30 },
    ...Array.from({ length: daysInMonth }, () => ({ width: 14 })),
    { width: 6 }, { width: 6 }, { width: 6 },
  ];

  // Row 1: hospital name
  ws.mergeCells(1, 1, 1, 6);
  ws.getCell('A1').value = 'RUMAH SAKIT HJ. BUNDA HALIMAH';
  ws.getCell('A1').font = { bold: true, size: 14 };

  // Row 3: title
  ws.mergeCells(3, 1, 3, daysInMonth + 5);
  ws.getRow(3).height = 24;
  ws.getCell('A3').value = 'JADWAL  DINAS';
  ws.getCell('A3').font = { bold: true, size: 16 };
  ws.getCell('A3').alignment = { horizontal: 'center', vertical: 'middle' };

  // Row 4: month/year
  ws.mergeCells(4, 1, 4, daysInMonth + 5);
  ws.getCell('A4').value = `${monthName} ${year}`;
  ws.getCell('A4').font = { bold: true, size: 13 };
  ws.getCell('A4').alignment = { horizontal: 'center', vertical: 'middle' };

  // Row 5: TANGGAL label
  ws.mergeCells(5, 3, 5, daysInMonth + 2);
  ws.getCell(5, 3).value = 'TANGGAL';
  ws.getCell(5, 3).font = { bold: true };
  ws.getCell(5, 3).alignment = { horizontal: 'center' };

  // Rows 6–7: header + day codes
  ws.mergeCells(6, 1, 7, 1);
  ws.mergeCells(6, 2, 7, 2);
  ws.mergeCells(6, daysInMonth + 3, 7, daysInMonth + 3);
  ws.mergeCells(6, daysInMonth + 4, 7, daysInMonth + 4);
  ws.mergeCells(6, daysInMonth + 5, 7, daysInMonth + 5);

  const r6 = ws.getRow(6); r6.height = 18;
  const r7 = ws.getRow(7); r7.height = 15;

  // No / Nama
  [r6.getCell(1), r6.getCell(2), r7.getCell(1), r7.getCell(2)].forEach(c => {
    c.fill = solidFill('FFFF6600');
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
    c.border = allBorders;
  });
  r6.getCell(1).value = 'No';
  r6.getCell(2).value = 'Nama';

  // Date number + day code columns
  for (let d = 1; d <= daysInMonth; d++) {
    const isSun = new Date(year, month, d).getDay() === 0;
    const fill  = solidFill(isSun ? 'FFFF0000' : 'FF00FFFF');
    const font  = { bold: true, color: { argb: isSun ? 'FFFFFFFF' : 'FF000000' } };
    const ci    = d + 2;
    const c6 = r6.getCell(ci);
    const c7 = r7.getCell(ci);
    c6.value = d; c6.fill = fill; c6.font = font;
    c6.alignment = { horizontal: 'center' }; c6.border = allBorders;
    c7.value = dayCode(new Date(year, month, d));
    c7.fill = fill; c7.font = font;
    c7.alignment = { horizontal: 'center' }; c7.border = allBorders;
  }

  // P/S/M headers
  ['P', 'S', 'M'].forEach((lbl, i) => {
    const c = r6.getCell(daysInMonth + 3 + i);
    c.value = lbl; c.font = { bold: true };
    c.alignment = { horizontal: 'center', vertical: 'middle' }; c.border = allBorders;
  });

  // Employee data rows (row 8+)
  const DATA_START = 8;
  allEmployees.forEach((emp, idx) => {
    const row = ws.getRow(DATA_START + idx);
    row.height = 18;
    row.getCell(1).value = idx + 1;
    row.getCell(1).alignment = { horizontal: 'center' }; row.getCell(1).border = allBorders;
    row.getCell(2).value = emp.name; row.getCell(2).border = allBorders;

    let p = 0, s = 0, m = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const cell = row.getCell(d + 2);
      const val  = scheduleMap[emp.id]?.[d] ?? '';
      cell.value = val || null;
      cell.alignment = { horizontal: 'center', wrapText: false }; cell.border = allBorders;
      if (new Date(year, month, d).getDay() === 0) cell.fill = solidFill('FFFF0000');
      const vl = val.toLowerCase();
      if (vl.includes('pagi') || vl.includes('subuh')) p++;
      else if (vl.includes('siang') || vl.includes('sore')) s++;
      else if (vl.includes('malam')) m++;
    }
    [daysInMonth + 3, daysInMonth + 4, daysInMonth + 5].forEach((ci, i) => {
      const c = row.getCell(ci);
      c.value = [p, s, m][i] || null;
      c.alignment = { horizontal: 'center' }; c.border = allBorders;
    });
  });

  // Legend
  const legRow = DATA_START + allEmployees.length + 1;
  [['MINGGU/LIBUR', 'FFFF0000'], ['CUTI', 'FFFFFF00'], ['CUTI BERSAMA/HARI BESAR', 'FFFFFF00']].forEach(([lbl, clr], i) => {
    ws.getCell(legRow + i, 4).fill = solidFill(clr); ws.getCell(legRow + i, 4).border = allBorders;
    ws.getCell(legRow + i, 5).value = lbl;
  });

  // Reference sheets
  const wsRef = wb.addWorksheet('Referensi Shift');
  wsRef.columns = [{ width: 10 }, { width: 30 }, { width: 14 }, { width: 14 }];
  wsRef.addRow(['ID Shift', 'Nama Shift', 'Jam Masuk', 'Jam Keluar']).font = { bold: true };
  allShifts.forEach(s => wsRef.addRow([s.id, s.nama_shift, s.jam_masuk, s.jam_keluar]));

  const wsEmp = wb.addWorksheet('Referensi Karyawan');
  wsEmp.columns = [{ width: 12 }, { width: 30 }, { width: 20 }, { width: 25 }];
  wsEmp.addRow(['ID Karyawan', 'Nama', 'Username', 'Jabatan']).font = { bold: true };
  allEmployees.forEach(e => wsEmp.addRow([e.id, e.name, e.username, e.jabatan?.nama_jabatan ?? '-']));

  /* ── Write to buffer ── */
  const rawBuf = await wb.xlsx.writeBuffer();

  /* ── Patch Data Validation XML via fflate ── */
  if (allEmployees.length > 0 && allShifts.length > 0) {
    try {
      const zipped = unzipSync(new Uint8Array(rawBuf));
      const sheetKey = 'xl/worksheets/sheet1.xml';

      if (zipped[sheetKey]) {
        const enc = new TextEncoder();
        const dec = new TextDecoder();
        let xml = dec.decode(zipped[sheetKey]);

        // Build sqref: one block covering all date columns × all employee rows
        // e.g. "C8:AG348" for September (30 days) with 341 employees
        const firstColIdx = 3;  // col C (1-indexed)
        const lastColIdx  = 2 + daysInMonth;
        const firstRow    = DATA_START;
        const lastRow     = DATA_START + allEmployees.length - 1;

        // Convert 1-based column index to Excel letter (A, B, ..., Z, AA, ...)
        const colLetter = (n: number): string => {
          let s = '';
          while (n > 0) {
            n--;
            s = String.fromCharCode(65 + (n % 26)) + s;
            n = Math.floor(n / 26);
          }
          return s;
        };

        const firstCol = colLetter(firstColIdx);
        const lastCol  = colLetter(lastColIdx);
        const sqref    = `${firstCol}${firstRow}:${lastCol}${lastRow}`;

        // Build formula1: quoted comma-separated shift names with XML escaping
        // Each shift name is XML-escaped; the whole string is wrapped in double quotes
        const shiftListXml = xmlEscape(
          '"' + allShifts.map(s => s.nama_shift).join(',') + '"'
        );

        // Build the dataValidations XML block
        const dvXml = [
          '<dataValidations count="1">',
          `<dataValidation type="list" allowBlank="1" showDropDown="0" showInputMessage="0" showErrorMessage="1" sqref="${sqref}">`,
          `<formula1>${shiftListXml}</formula1>`,
          '</dataValidation>',
          '</dataValidations>',
        ].join('');

        // Remove any existing dataValidations block, then inject before </worksheet>
        xml = xml.replace(/<dataValidations[^>]*>[\s\S]*?<\/dataValidations>/g, '');
        xml = xml.replace(/<\/worksheet>/, dvXml + '</worksheet>');

        zipped[sheetKey] = enc.encode(xml);
      }

      const patched = zipSync(zipped, { level: 0 });
      const blob = new Blob([patched], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      triggerDownload(blob, `Jadwal_Dinas_${monthName}_${year}.xlsx`);
      return;
    } catch (err) {
      console.error('DV patch failed, downloading without dropdown:', err);
    }
  }

  // Fallback: download without DV (still valid xlsx)
  const fallbackBuf = await wb.xlsx.writeBuffer();
  triggerDownload(
    new Blob([fallbackBuf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `Jadwal_Dinas_${monthName}_${year}.xlsx`,
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

/* ══════════════════════════════════════════════════════════════
   PARSE — Read Jadwal Dinas Excel back into ImportRow[]
══════════════════════════════════════════════════════════════ */
export async function parseDinasExcel(
  file: File,
  availableShifts: Shift[],
  allEmployees: Employee[],
): Promise<ImportRow[]> {
  const nameToId    = new Map(allEmployees.map(e => [e.name.toLowerCase().trim(), e.id]));
  const nameToShift = new Map(availableShifts.map(s => [s.nama_shift.toLowerCase().trim(), s]));

  const buf = await file.arrayBuffer();
  const wb  = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);

  // Enrich from reference sheets
  const refEmp = wb.getWorksheet('Referensi Karyawan');
  if (refEmp) {
    refEmp.eachRow((row, ri) => {
      if (ri < 2) return;
      const id   = String(row.getCell(1).value ?? '').trim();
      const name = String(row.getCell(2).value ?? '').toLowerCase().trim();
      if (id && name) nameToId.set(name, id);
    });
  }
  const refShift = wb.getWorksheet('Referensi Shift');
  if (refShift) {
    refShift.eachRow((row, ri) => {
      if (ri < 2) return;
      const id   = String(row.getCell(1).value ?? '').trim();
      const name = String(row.getCell(2).value ?? '').toLowerCase().trim();
      if (id && name && !nameToShift.has(name)) {
        nameToShift.set(name, {
          id, nama_shift: String(row.getCell(2).value),
          jam_masuk: String(row.getCell(3).value ?? ''),
          jam_keluar: String(row.getCell(4).value ?? ''),
        });
      }
    });
  }

  const ws = wb.worksheets[0];
  if (!ws) throw new Error('Tidak ada sheet ditemukan');

  // Find date header row
  let headerRowNum = -1;
  ws.eachRow((row, ri) => {
    if (headerRowNum !== -1) return;
    let cnt = 0;
    row.eachCell({ includeEmpty: false }, (cell, ci) => {
      if (ci >= 3) { const v = Number(cell.value); if (Number.isInteger(v) && v >= 1 && v <= 31) cnt++; }
    });
    if (cnt >= 20) headerRowNum = ri;
  });
  if (headerRowNum === -1) throw new Error('Format tidak dikenali: baris tanggal 1-31 tidak ditemukan');

  const colToDay: Record<number, number> = {};
  ws.getRow(headerRowNum).eachCell({ includeEmpty: false }, (cell, ci) => {
    const v = Number(cell.value);
    if (ci >= 3 && Number.isInteger(v) && v >= 1 && v <= 31) colToDay[ci] = v;
  });
  const dayCols = Object.keys(colToDay).map(Number).sort((a, b) => a - b);

  // Extract year+month
  let year = new Date().getFullYear(), month = new Date().getMonth();
  for (let ri = 1; ri < headerRowNum; ri++) {
    const rowStr = (ws.getRow(ri).values as any[])?.join(' ') ?? '';
    const m = rowStr.match(/([A-Za-z]+)\s+(20\d{2})/);
    if (m) {
      const mIdx = ['januari','februari','maret','april','mei','juni','juli','agustus','september','oktober','november','desember'].indexOf(m[1].toLowerCase());
      if (mIdx !== -1) { month = mIdx; year = parseInt(m[2]); break; }
    }
  }
  const monthStr = pad(month + 1);

  const legendKw = ['minggu', 'libur', 'cuti', 'hari besar'];
  const rows: ImportRow[] = [];
  let rowIndex = 1;

  for (let ri = headerRowNum + 1; ri <= ws.rowCount; ri++) {
    const row = ws.getRow(ri);
    const nameCell = String(row.getCell(2).value ?? '').trim();
    if (!nameCell) continue;
    if (legendKw.some(kw => nameCell.toLowerCase().includes(kw))) break;
    if (/^[SsRrKkJjMm]$/.test(nameCell)) continue;

    const employeeId = nameToId.get(nameCell.toLowerCase()) ?? null;
    const dayShiftMap: Record<number, Shift> = {};

    for (const ci of dayCols) {
      const v = String(row.getCell(ci).value ?? '').trim();
      if (!v) continue;
      const lower = v.toLowerCase();
      let matched = nameToShift.get(lower);
      if (!matched) for (const [k, s] of nameToShift) { if (k.startsWith(lower) || lower.startsWith(k)) { matched = s; break; } }
      if (!matched) for (const [k, s] of nameToShift) { if (k.includes(lower) || lower.includes(k)) { matched = s; break; } }
      if (matched) dayShiftMap[colToDay[ci]] = matched;
    }
    if (Object.keys(dayShiftMap).length === 0) continue;

    const sortedDays = Object.keys(dayShiftMap).map(Number).sort((a, b) => a - b);
    let rStart = sortedDays[0], rEnd = sortedDays[0], curShift = dayShiftMap[rStart];
    const flush = () => rows.push({
      rowIndex: rowIndex++, user_id: employeeId ?? '', user_name: nameCell,
      shift_id: curShift.id, shift_name: curShift.nama_shift,
      tanggal_mulai: `${year}-${monthStr}-${pad(rStart)}`,
      tanggal_akhir: `${year}-${monthStr}-${pad(rEnd)}`,
      lock_location: 0,
      status: employeeId ? 'pending' : 'error',
      message: employeeId ? undefined : `Karyawan "${nameCell}" tidak ditemukan di sistem`,
    });

    for (let di = 1; di < sortedDays.length; di++) {
      const day = sortedDays[di], sf = dayShiftMap[day];
      if (day === rEnd + 1 && sf.id === curShift.id) { rEnd = day; }
      else { flush(); rStart = day; rEnd = day; curShift = sf; }
    }
    flush();
  }

  if (rows.length === 0) throw new Error('Tidak ada data karyawan yang berhasil dibaca dari file');
  return rows;
}
