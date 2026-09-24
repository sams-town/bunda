/**
 * jadwalDinasExcel.ts
 * Template: No | Nama Lengkap | Jabatan | Departemen | tanggal 1-31
 * Baris karyawan: KOSONG (koordinator isi sendiri)
 * Kolom Minggu (Min): background MERAH
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
   GENERATE – Template KOSONG sesuai format pengguna
====================================================== */
export function generateJadwalDinas(
  _allEmployees: Employee[],
  allShifts: Shift[],
  _mappings: MappingData[],
  year: number,
  month: number,
): void {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName   = new Date(year, month, 1).toLocaleString('id-ID', { month: 'long' });

  // Kolom: 0=No, 1=Nama Lengkap, 2=Jabatan, 3=Departemen, 4..=tanggal
  const COL_FIRST  = 4;
  const TOTAL_COLS = COL_FIRST + daysInMonth;
  const EMPTY_ROWS = 30;

  const aoa: any[][] = [];

  // Row 0: Judul
  const titleRow: any[] = new Array(TOTAL_COLS).fill('');
  titleRow[0] = `JADWAL DINAS - ${monthName.toUpperCase()} ${year}`;
  aoa.push(titleRow);

  // Row 1: kosong
  aoa.push(new Array(TOTAL_COLS).fill(''));

  // Row 2: Header - nama hari
  const dayRow: any[] = ['No', 'Nama Lengkap', 'Jabatan', 'Departemen'];
  for (let d = 1; d <= daysInMonth; d++) {
    dayRow.push(dayCode(new Date(year, month, d)));
  }
  aoa.push(dayRow);

  // Row 3: Header - angka tanggal
  const dateRow: any[] = ['', '', '', ''];
  for (let d = 1; d <= daysInMonth; d++) dateRow.push(d);
  aoa.push(dateRow);

  // Row 4+: Baris KOSONG (30 baris)
  for (let i = 0; i < EMPTY_ROWS; i++) {
    const row: any[] = [i + 1, '', '', ''];
    for (let d = 0; d < daysInMonth; d++) row.push('');
    aoa.push(row);
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa, { cellStyles: true });

  // Merges
  const merges: XLSX.Range[] = [
    // Judul: merge semua kolom
    { s: { r: 0, c: 0 }, e: { r: 0, c: TOTAL_COLS - 1 } },
    // Baris kosong: merge semua
    { s: { r: 1, c: 0 }, e: { r: 1, c: TOTAL_COLS - 1 } },
    // Header tetap: merge hari & tanggal (rows 2-3)
    { s: { r: 2, c: 0 }, e: { r: 3, c: 0 } },   // No
    { s: { r: 2, c: 1 }, e: { r: 3, c: 1 } },   // Nama Lengkap
    { s: { r: 2, c: 2 }, e: { r: 3, c: 2 } },   // Jabatan
    { s: { r: 2, c: 3 }, e: { r: 3, c: 3 } },   // Departemen
  ];
  ws['!merges'] = merges;

  // Lebar kolom
  const colWidths: XLSX.ColInfo[] = [
    { wch: 4 },   // No
    { wch: 22 },  // Nama Lengkap
    { wch: 14 },  // Jabatan
    { wch: 14 },  // Departemen
  ];
  for (let d = 0; d < daysInMonth; d++) colWidths.push({ wch: 3.5 });
  ws['!cols'] = colWidths;

  // Tinggi baris
  ws['!rows'] = [
    { hpt: 24 }, // judul
    { hpt: 6 },  // kosong
    { hpt: 16 }, // hari
    { hpt: 14 }, // tanggal
  ];

  // ── Style setiap sel ──────────────────────────────────
  const borderThin = {
    top:    { style: 'thin', color: { rgb: 'BBBBBB' } },
    bottom: { style: 'thin', color: { rgb: 'BBBBBB' } },
    left:   { style: 'thin', color: { rgb: 'BBBBBB' } },
    right:  { style: 'thin', color: { rgb: 'BBBBBB' } },
  };
  const borderBold = {
    top:    { style: 'thin', color: { rgb: '000000' } },
    bottom: { style: 'thin', color: { rgb: '000000' } },
    left:   { style: 'thin', color: { rgb: '000000' } },
    right:  { style: 'thin', color: { rgb: '000000' } },
  };

  // Helper: apakah kolom c adalah hari Minggu?
  const isSunday = (c: number) => {
    if (c < COL_FIRST) return false;
    const day = c - COL_FIRST + 1;
    return new Date(year, month, day).getDay() === 0;
  };

  const sunFill  = { fgColor: { rgb: 'FF0000' }, patternType: 'solid' as const };
  const whtFill  = { fgColor: { rgb: 'FFFFFF' }, patternType: 'solid' as const };
  const grayFill = { fgColor: { rgb: 'D9E1F2' }, patternType: 'solid' as const };

  // Row 0: judul
  const a1 = ws['A1'];
  if (a1) a1.s = {
    font: { bold: true, sz: 13, color: { rgb: '0070C0' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    fill: { fgColor: { rgb: 'FFFFFF' }, patternType: 'solid' },
  };

  // Rows 2-3: header
  for (let r = 2; r <= 3; r++) {
    for (let c = 0; c < TOTAL_COLS; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (!ws[addr]) ws[addr] = { t: 's', v: '' };
      const sun = isSunday(c);
      ws[addr].s = {
        font: { bold: true, sz: 8, color: { rgb: sun ? 'FFFFFF' : '000000' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        fill: sun ? sunFill : (c < COL_FIRST ? grayFill : whtFill),
        border: borderBold,
      };
    }
  }

  // Rows 4+: data kosong
  const DATA_START = 4;
  const DATA_END   = DATA_START + EMPTY_ROWS;
  for (let r = DATA_START; r < DATA_END; r++) {
    for (let c = 0; c < TOTAL_COLS; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (!ws[addr]) ws[addr] = { t: 's', v: '' };
      const sun = isSunday(c);
      ws[addr].s = {
        font: { sz: 9 },
        alignment: { horizontal: c < COL_FIRST ? 'left' : 'center', vertical: 'center' },
        fill: sun ? { fgColor: { rgb: 'FFCCCC' }, patternType: 'solid' } : whtFill,
        border: borderThin,
      };
    }
  }

  const sheetName = `${monthName.toUpperCase()} ${year}`.substring(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Sheet referensi shift
  const shiftAoa: any[][] = [['ID Shift', 'Nama Shift', 'Jam Masuk', 'Jam Keluar']];
  allShifts.forEach(s => shiftAoa.push([s.id, s.nama_shift, s.jam_masuk, s.jam_keluar]));
  const wsShift = XLSX.utils.aoa_to_sheet(shiftAoa);
  wsShift['!cols'] = [{ wch: 10 }, { wch: 25 }, { wch: 12 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsShift, 'Referensi Shift');

  XLSX.writeFile(wb, `Jadwal_Dinas_${monthName}_${year}.xlsx`);
}

/* ======================================================
   PARSE – Baca file Excel yang sudah diisi koordinator
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

        // Peta nama karyawan → ID
        const nameToId = new Map(allEmployees.map(emp => [emp.name.toLowerCase().trim(), emp.id]));
        const nameToShift = new Map(availableShifts.map(s => [s.nama_shift.toLowerCase().trim(), s]));

        // Enrich dari sheet referensi
        const refShiftWs = wb.Sheets['Referensi Shift'];
        if (refShiftWs) {
          XLSX.utils.sheet_to_json<any>(refShiftWs, { defval: '' }).forEach((row: any) => {
            const id   = String(row['ID Shift'] ?? '').trim();
            const name = String(row['Nama Shift'] ?? '').toLowerCase().trim();
            if (id && name && !nameToShift.has(name)) {
              nameToShift.set(name, {
                id, nama_shift: String(row['Nama Shift']),
                jam_masuk:  String(row['Jam Masuk']  ?? ''),
                jam_keluar: String(row['Jam Keluar'] ?? ''),
              });
            }
          });
        }

        const ws  = wb.Sheets[wb.SheetNames[0]];
        const aoa = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: '' }) as any[][];

        // Cari baris dengan angka tanggal 1-31 (>=20 angka di kolom 2+)
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

        // Peta kolom → hari
        const colToDay: Record<number, number> = {};
        aoa[dateRowIdx].forEach((v: any, ci: number) => {
          const n = Number(v);
          if (ci >= 2 && Number.isInteger(n) && n >= 1 && n <= 31) colToDay[ci] = n;
        });
        const dayCols = Object.keys(colToDay).map(Number).sort((a, b) => a - b);

        // Ambil tahun & bulan dari judul
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

        if (!rows.length) throw new Error('Tidak ada data yang berhasil dibaca. Pastikan nama karyawan sudah diisi dan shift sudah sesuai.');
        resolve(rows);
      } catch (err: any) {
        reject(new Error(err.message ?? 'Gagal membaca file'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsArrayBuffer(file);
  });
}
