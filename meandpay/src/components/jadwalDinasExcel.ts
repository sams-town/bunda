/**
 * jadwalDinasExcel.ts – Jadwal Dinas Excel generator & parser
 *
 * Layout (0-indexed rows):
 *   0 : JADWAL DINAS – <BULAN> <TAHUN>   (merge across all columns)
 *   1 : No | Nama Lengkap | Jabatan | Departemen | Kam | Jum | Sab | ...  (day abbreviations)
 *   2 :    |              |         |            |  1  |  2  |  3  | ...  (date numbers)
 *   3+: employee data rows
 *
 * Columns (0-indexed):
 *   0 = No
 *   1 = Nama Lengkap
 *   2 = Jabatan
 *   3 = Departemen
 *   4 .. 4+daysInMonth-1 = tanggal 1..31
 */
import * as XLSX from 'xlsx';

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
  divisi?: { id: string; nama_divisi: string } | null;
  departemen?: { id: string; nama_departemen: string } | null;
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
  return ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][date.getDay()];
}
function pad(n: number) { return String(n).padStart(2, '0'); }

/* ======================================================
   GENERATE
====================================================== */
export function generateJadwalDinas(
  allEmployees: Employee[],
  allShifts: Shift[],
  mappings: MappingData[],
  year: number,
  month: number,
): void {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName   = new Date(year, month, 1).toLocaleString('id-ID', { month: 'long' });

  const shiftById = new Map(allShifts.map(s => [s.id, s.nama_shift]));
  const scheduleMap: Record<string, Record<number, string>> = {};
  mappings.forEach(m => {
    if (!shiftById.has(m.shift_id)) return;
    const d = new Date(m.tanggal);
    if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month) return;
    const day = d.getUTCDate();
    if (!scheduleMap[m.user_id]) scheduleMap[m.user_id] = {};
    scheduleMap[m.user_id][day] = shiftById.get(m.shift_id)!;
  });

  // Col 0=No, 1=Nama Lengkap, 2=Jabatan, 3=Departemen, 4..4+days-1=tanggal
  const COL_FIRST_DATE = 4;
  const COL_LAST_DATE  = COL_FIRST_DATE + daysInMonth - 1;
  const TOTAL_COLS     = COL_LAST_DATE + 1;

  const aoa: any[][] = [];

  // Row 0: Title
  const titleRow: any[] = [`JADWAL DINAS - ${monthName.toUpperCase()} ${year}`];
  aoa.push(titleRow);

  // Row 1: day abbreviations
  const dayRow: any[] = ['No', 'Nama Lengkap', 'Jabatan', 'Departemen'];
  for (let d = 1; d <= daysInMonth; d++) dayRow.push(dayCode(new Date(year, month, d)));
  aoa.push(dayRow);

  // Row 2: date numbers
  const dateRow: any[] = ['', '', '', ''];
  for (let d = 1; d <= daysInMonth; d++) dateRow.push(d);
  aoa.push(dateRow);

  // Employee rows (min 30 rows)
  const minRows = Math.max(allEmployees.length, 30);
  for (let idx = 0; idx < minRows; idx++) {
    const emp = allEmployees[idx];
    if (!emp) {
      const emptyRow: any[] = [idx + 1, '', '', ''];
      for (let d = 1; d <= daysInMonth; d++) emptyRow.push('');
      aoa.push(emptyRow);
      continue;
    }
    const jabatan    = emp.jabatan?.nama_jabatan ?? '';
    const departemen = emp.departemen?.nama_departemen ?? emp.divisi?.nama_divisi ?? '';
    const row: any[] = [idx + 1, emp.name, jabatan, departemen];
    for (let d = 1; d <= daysInMonth; d++) row.push(scheduleMap[emp.id]?.[d] ?? '');
    aoa.push(row);
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Merge title row
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: TOTAL_COLS - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 2, c: 0 } },
    { s: { r: 1, c: 1 }, e: { r: 2, c: 1 } },
    { s: { r: 1, c: 2 }, e: { r: 2, c: 2 } },
    { s: { r: 1, c: 3 }, e: { r: 2, c: 3 } },
  ];

  // Column widths
  const colWidths: XLSX.ColInfo[] = [{ wch: 4 }, { wch: 22 }, { wch: 14 }, { wch: 16 }];
  for (let d = 0; d < daysInMonth; d++) colWidths.push({ wch: 4 });
  ws['!cols'] = colWidths;

  ws['!rows'] = [{ hpt: 22 }, { hpt: 16 }, { hpt: 14 }];

  const sheetName = `${monthName.toUpperCase()} ${year}`;
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));

  // Reference: Daftar Shift
  const shiftAoa = [['ID Shift', 'Nama Shift', 'Jam Masuk', 'Jam Keluar']];
  allShifts.forEach(s => shiftAoa.push([s.id, s.nama_shift, s.jam_masuk, s.jam_keluar]));
  const wsShift = XLSX.utils.aoa_to_sheet(shiftAoa);
  wsShift['!cols'] = [{ wch: 10 }, { wch: 25 }, { wch: 12 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsShift, 'Referensi Shift');

  // Reference: Daftar Karyawan
  const empAoa = [['ID Karyawan', 'Nama', 'Username', 'Jabatan', 'Departemen']];
  allEmployees.forEach(e => empAoa.push([
    e.id, e.name, e.username,
    e.jabatan?.nama_jabatan ?? '',
    e.departemen?.nama_departemen ?? e.divisi?.nama_divisi ?? '',
  ]));
  const wsEmp = XLSX.utils.aoa_to_sheet(empAoa);
  wsEmp['!cols'] = [{ wch: 12 }, { wch: 28 }, { wch: 18 }, { wch: 22 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsEmp, 'Referensi Karyawan');

  XLSX.writeFile(wb, `Jadwal_Dinas_${monthName}_${year}.xlsx`);
}

/* ======================================================
   PARSE
====================================================== */
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

        const nameToId    = new Map(allEmployees.map(emp => [emp.name.toLowerCase().trim(), emp.id]));
        const nameToShift = new Map(availableShifts.map(s => [s.nama_shift.toLowerCase().trim(), s]));

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

        // Find row with date numbers 1-31 (>=20 integers in cols 2+)
        let dateRowIdx = -1;
        for (let ri = 0; ri < Math.min(aoa.length, 10); ri++) {
          let cnt = 0;
          for (let ci = 2; ci < aoa[ri].length; ci++) {
            const v = Number(aoa[ri][ci]);
            if (Number.isInteger(v) && v >= 1 && v <= 31) cnt++;
          }
          if (cnt >= 20) { dateRowIdx = ri; break; }
        }
        if (dateRowIdx === -1) throw new Error('Format tidak dikenali: baris tanggal 1-31 tidak ditemukan');

        const colToDay: Record<number, number> = {};
        aoa[dateRowIdx].forEach((v: any, ci: number) => {
          const n = Number(v);
          if (ci >= 2 && Number.isInteger(n) && n >= 1 && n <= 31) colToDay[ci] = n;
        });
        const dayCols = Object.keys(colToDay).map(Number).sort((a, b) => a - b);

        let year = new Date().getFullYear(), month = new Date().getMonth();
        for (let ri = 0; ri < dateRowIdx; ri++) {
          const str = aoa[ri].join(' ');
          const mx  = str.match(/([A-Za-z]+)\s+(20\d{2})/);
          if (mx) {
            const mn = ['januari','februari','maret','april','mei','juni','juli','agustus','september','oktober','november','desember'];
            const mi = mn.indexOf(mx[1].toLowerCase());
            if (mi !== -1) { month = mi; year = parseInt(mx[2]); break; }
          }
        }
        const mStr = pad(month + 1);

        const rows: ImportRow[] = [];
        let rowIndex = 1;

        for (let ri = dateRowIdx + 1; ri < aoa.length; ri++) {
          const row = aoa[ri];
          // col 1 = Nama Lengkap
          const nameCell = String(row[1] ?? '').trim();
          if (!nameCell) continue;
          if (/^(No|Nama|Nama Lengkap|Nama Karyawan)$/i.test(nameCell)) continue;
          if (/^(Sen|Sel|Rab|Kam|Jum|Sab|Min)$/i.test(nameCell)) continue;
          if (['daftar shift', 'referensi'].some(kw => nameCell.toLowerCase().includes(kw))) break;

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
            rowIndex: rowIndex++,
            user_id:       empId ?? '',
            user_name:     nameCell,
            shift_id:      cur.id,
            shift_name:    cur.nama_shift,
            tanggal_mulai: `${year}-${mStr}-${pad(rStart)}`,
            tanggal_akhir: `${year}-${mStr}-${pad(rEnd)}`,
            lock_location: 0,
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
