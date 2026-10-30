-- ==============================================================================
-- Script SQL: Update mapping_shifts untuk Jadwal Back Office & Office Hour (Sabtu & Minggu)
-- Otomatis terhitung Libur jika belum absen masuk/pulang
-- ==============================================================================

-- 1. Cek berapa baris yang akan terpengaruh
SELECT 
    ms.id,
    ms.user_id,
    u.name AS nama_pegawai,
    s.nama_shift,
    ms.tanggal,
    DAYNAME(ms.tanggal) AS hari,
    ms.status_absen
FROM mapping_shifts ms
JOIN shifts s ON ms.shift_id = s.id
JOIN users u ON ms.user_id = u.id
WHERE (
    LOWER(s.nama_shift) LIKE '%office%'
    OR LOWER(s.nama_shift) LIKE '%office hour%'
    OR LOWER(s.nama_shift) LIKE '%back office%'
    OR LOWER(s.nama_shift) LIKE '%backoffice%'
    OR LOWER(s.nama_shift) LIKE '%non shift%'
    OR LOWER(s.nama_shift) LIKE '%non-shift%'
    OR LOWER(s.nama_shift) LIKE '%non dinas%'
    OR LOWER(s.nama_shift) LIKE '%kantor%'
)
AND DAYOFWEEK(ms.tanggal) IN (1, 7) -- 1 = Minggu (Sunday), 7 = Sabtu (Saturday)
AND ms.jam_absen IS NULL
AND ms.jam_pulang IS NULL
AND (ms.status_absen IS NULL OR ms.status_absen = '' OR ms.status_absen = 'Belum Absen' OR ms.status_absen = 'Alfa');

-- 2. Update status_absen menjadi 'Libur'
UPDATE mapping_shifts ms
JOIN shifts s ON ms.shift_id = s.id
SET ms.status_absen = 'Libur',
    ms.updated_at = NOW()
WHERE (
    LOWER(s.nama_shift) LIKE '%office%'
    OR LOWER(s.nama_shift) LIKE '%office hour%'
    OR LOWER(s.nama_shift) LIKE '%back office%'
    OR LOWER(s.nama_shift) LIKE '%backoffice%'
    OR LOWER(s.nama_shift) LIKE '%non shift%'
    OR LOWER(s.nama_shift) LIKE '%non-shift%'
    OR LOWER(s.nama_shift) LIKE '%non dinas%'
    OR LOWER(s.nama_shift) LIKE '%kantor%'
)
AND DAYOFWEEK(ms.tanggal) IN (1, 7) -- 1 = Minggu (Sunday), 7 = Sabtu (Saturday)
AND ms.jam_absen IS NULL
AND ms.jam_pulang IS NULL
AND (ms.status_absen IS NULL OR ms.status_absen = '' OR ms.status_absen = 'Belum Absen' OR ms.status_absen = 'Alfa');
