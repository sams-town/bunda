import { generateJadwalDinas, parseDinasExcel } from './src/components/jadwalDinasExcel.ts';
import * as fs from 'fs';

const employees: any[] = [
  { id: '1', name: 'Irsad', username: 'irsad', jabatan: { id: '1', nama_jabatan: 'Koordinator' }, departemen: { id: '1', nama_departemen: 'IT' } },
  { id: '2', name: 'Natsir', username: 'natsir', jabatan: { id: '2', nama_jabatan: 'PJ Shift' } }
];

const shifts: any[] = [
  { id: '1', nama_shift: 'Pagi', jam_masuk: '08:00', jam_keluar: '16:00' },
  { id: '2', nama_shift: 'Sore', jam_masuk: '16:00', jam_keluar: '00:00' }
];

const mappings: any[] = [
  { id: '1', user_id: '1', shift_id: '1', tanggal: '2026-10-01T00:00:00.000Z' }
];

try {
  generateJadwalDinas(employees, shifts, mappings, 2026, 9); // October
  console.log("Success generating");
} catch(e) {
  console.error("Error generating:", e);
}
