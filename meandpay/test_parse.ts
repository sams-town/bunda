import { parseDinasExcel } from './src/components/jadwalDinasExcel.ts';
import * as fs from 'fs';

const employees: any[] = [
  { id: '1', name: 'Irsad', username: 'irsad', jabatan: { id: '1', nama_jabatan: 'Koordinator' }, departemen: { id: '1', nama_departemen: 'IT' } },
  { id: '2', name: 'Natsir', username: 'natsir', jabatan: { id: '2', nama_jabatan: 'PJ Shift' } }
];

const shifts: any[] = [
  { id: '1', nama_shift: 'Pagi', jam_masuk: '08:00', jam_keluar: '16:00' },
  { id: '2', nama_shift: 'Sore', jam_masuk: '16:00', jam_keluar: '00:00' }
];

async function test() {
  try {
    const buffer = fs.readFileSync('Jadwal_Dinas_Oktober_2026.xlsx');
    const file = new File([buffer], 'Jadwal_Dinas_Oktober_2026.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const rows = await parseDinasExcel(file, shifts, employees);
    console.log("Success parsing", rows);
  } catch(e) {
    console.error("Error parsing:", e);
  }
}
test();
