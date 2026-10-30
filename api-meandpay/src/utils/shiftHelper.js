/**
 * Helper untuk logika Shift & Hari Kerja
 */

/**
 * Memeriksa apakah nama shift termasuk shift Back Office / Office Hour / Non-Shift
 * (contoh: "Office", "Office Hour", "Back Office", "BackOffice", "Non Shift", "Kantor", dsb.)
 * @param {string|null|undefined} shiftName 
 * @returns {boolean}
 */
export function isBackOfficeShift(shiftName) {
    if (!shiftName || typeof shiftName !== 'string') return false;
    const s = shiftName.toLowerCase().trim();
    return s.includes('office') || 
           s.includes('office hour') ||
           s.includes('back office') || 
           s.includes('backoffice') || 
           s.includes('non shift') ||
           s.includes('non-shift') ||
           s.includes('non dinas') ||
           s.includes('non-dinas') ||
           s.includes('kantor');
}

/**
 * Memeriksa apakah tanggal jatuh pada akhir pekan (Sabtu atau Minggu)
 * 0 = Minggu (Sunday), 6 = Sabtu (Saturday)
 * @param {string|Date} date 
 * @returns {boolean}
 */
export function isWeekendDay(date) {
    if (!date) return false;
    let day = -1;
    if (typeof date === 'string') {
        const s = date.split('T')[0];
        const p = s.split('-').map(Number);
        if (p.length === 3 && p[0] && p[1] && p[2]) {
            // Gunakan UTC agar tanggal tidak bergeser karena zona waktu
            day = new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay();
        } else {
            day = new Date(date).getDay();
        }
    } else if (date instanceof Date) {
        // Ambil komponen tanggal kalender (YYYY-MM-DD)
        const ymd = date.toISOString ? date.toISOString().split('T')[0] : null;
        if (ymd) {
            const p = ymd.split('-').map(Number);
            if (p.length === 3 && p[0] && p[1] && p[2]) {
                day = new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay();
            }
        }
        if (day === -1) {
            day = date.getUTCDay();
        }
    } else {
        day = new Date(date).getDay();
    }
    return day === 0 || day === 6;
}

/**
 * Memeriksa apakah suatu mapping shift record terhitung sebagai Libur,
 * baik karena status_absen bernilai 'Libur' atau karena merupakan jadwal Back Office/Office Hour pada hari Sabtu/Minggu yang tidak diabsen.
 * @param {object} record 
 * @returns {boolean}
 */
export function isBackOfficeWeekendOff(record) {
    if (!record) return false;
    if (record.status_absen === 'Libur') return true;

    // Jika belum absen masuk dan pulang
    const hasAttended = Boolean(record.jam_absen || record.jam_pulang);
    if (!hasAttended) {
        const shiftName = record.shifts?.nama_shift || '';
        if (isBackOfficeShift(shiftName) && isWeekendDay(record.tanggal)) {
            return true;
        }
    }
    return false;
}
