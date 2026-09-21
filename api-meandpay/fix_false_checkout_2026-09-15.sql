-- =====================================================================
-- DATA CORRECTION: Revert false check-outs on 2026-09-15
-- Targets records where jam_pulang is within 5 minutes of jam_absen
-- during peak morning hours (06:00–10:00 WIB).
-- REVIEW BEFORE RUNNING. Run in a transaction.
-- =====================================================================
START TRANSACTION;

-- 1. Preview affected records first
SELECT
    id,
    user_id,
    tanggal,
    jam_absen,
    jam_pulang,
    status_absen,
    TIMESTAMPDIFF(MINUTE,
        STR_TO_DATE(CONCAT(DATE(tanggal), ' ', jam_absen), '%Y-%m-%d %H:%i'),
        STR_TO_DATE(CONCAT(DATE(tanggal), ' ', jam_pulang), '%Y-%m-%d %H:%i')
    ) AS menit_selisih
FROM mapping_shifts
WHERE
    DATE(tanggal) = '2026-09-15'
    AND jam_absen IS NOT NULL
    AND jam_pulang IS NOT NULL
    AND jam_absen BETWEEN '06:00' AND '10:00'
    AND TIMESTAMPDIFF(MINUTE,
        STR_TO_DATE(CONCAT(DATE(tanggal), ' ', jam_absen), '%Y-%m-%d %H:%i'),
        STR_TO_DATE(CONCAT(DATE(tanggal), ' ', jam_pulang), '%Y-%m-%d %H:%i')
    ) BETWEEN 0 AND 5;

-- 2. Fix: Reset jam_pulang, foto_jam_pulang, lat/long_pulang, and revert status to 'Masuk'
UPDATE mapping_shifts
SET
    jam_pulang        = NULL,
    foto_jam_pulang   = NULL,
    lat_pulang        = NULL,
    long_pulang       = NULL,
    jarak_pulang      = NULL,
    status_absen      = 'Masuk',
    updated_at        = NOW()
WHERE
    DATE(tanggal) = '2026-09-15'
    AND jam_absen IS NOT NULL
    AND jam_pulang IS NOT NULL
    AND jam_absen BETWEEN '06:00' AND '10:00'
    AND TIMESTAMPDIFF(MINUTE,
        STR_TO_DATE(CONCAT(DATE(tanggal), ' ', jam_absen), '%Y-%m-%d %H:%i'),
        STR_TO_DATE(CONCAT(DATE(tanggal), ' ', jam_pulang), '%Y-%m-%d %H:%i')
    ) BETWEEN 0 AND 5;

-- ROLLBACK; -- Uncomment to test without committing
COMMIT;
