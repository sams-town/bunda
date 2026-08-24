import absensiService from "../services/AbsensiService.js";
import userService from "../services/UserService.js";
import faceRecognitionService, { FACE_FAIL_REASON } from "../services/FaceRecognitionService.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../../");

// ─── RACE CONDITION LOCK ─────────────────────────────────────────────────────
// Mencegah double-tap absen: jika user_id sedang diproses, tolak request duplikat.
// Key: user_id (string), Value: true
const processingUsers = new Set();
// ─────────────────────────────────────────────────────────────────────────────

class AbsensiController {
    async index(req, res) {
        try {
            const result = await absensiService.getAll(req.query);
            return res.status(200).json({ success: true, message: "Data absensi berhasil diambil", ...result });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Gagal mengambil data absensi", error: error.message });
        }
    }

    async show(req, res) {
        try {
            const data = await absensiService.getById(req.params.id);
            if (!data) return res.status(404).json({ success: false, message: "Absensi tidak ditemukan" });
            return res.status(200).json({ success: true, message: "Data absensi berhasil diambil", data });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Gagal mengambil data absensi", error: error.message });
        }
    }

    async showUser(req, res) {
        try {
            const data = await absensiService.getByIdUsers(req.params.id);
            if (!data) return res.status(404).json({ success: false, message: "Absensi tidak ditemukan" });
            return res.status(200).json({ success: true, message: "Data absensi berhasil diambil", data });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Gagal mengambil data absensi", error: error.message });
        }
    }
    async showUserHistory(req, res) {
        try {
            const data = await absensiService.getByIdUsersHistory(req.params.id, req.params.tanggal_mulai, req.params.tanggal_akhir);
            if (!data) return res.status(404).json({ success: false, message: "Absensi tidak ditemukan" });
            return res.status(200).json({ success: true, message: "Data absensi berhasil diambil", data });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Gagal mengambil data absensi", error: error.message });
        }
    }

    async store(req, res) {
        try {
            const payload = { ...req.body };
            if (req.files) {
                if (req.files.foto_jam_absen && req.files.foto_jam_absen.length > 0) {
                    payload.foto_jam_absen = `/uploads/absensi/${req.files.foto_jam_absen[0].filename}`;
                }
                if (req.files.foto_jam_pulang && req.files.foto_jam_pulang.length > 0) {
                    payload.foto_jam_pulang = `/uploads/absensi/${req.files.foto_jam_pulang[0].filename}`;
                }
            }

            const data = await absensiService.create(payload);
            return res.status(201).json({ success: true, message: "Absensi berhasil dibuat", data });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Gagal membuat absensi", error: error.message });
        }
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // radius bumi dalam meter
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // jarak dalam meter
    }

    async storeWajah(req, res) {
        let userId = null; // Diisi setelah user teridentifikasi, untuk release lock
        try {
            const payload = { ...req.body };

            let incomingPath = null;
            if (req.files) {
                let uploadedFiles = Array.isArray(req.files) ? req.files : [];
                if (!Array.isArray(req.files)) {
                    if (req.files.foto_wajah) uploadedFiles.push(...req.files.foto_wajah);
                    if (req.files.foto_jam_absen) uploadedFiles.push(...req.files.foto_jam_absen);
                    if (req.files.foto_jam_pulang) uploadedFiles.push(...req.files.foto_jam_pulang);
                }

                if (uploadedFiles.length > 0) {
                    const theFile = uploadedFiles[0];
                    incomingPath = path.join(ROOT_DIR, "public", "uploads", "absensi", theFile.filename);
                }
            }

            if (!incomingPath) {
                return res.status(400).json({ success: false, message: "Foto absen wajib disertakan untuk absensi wajah." });
            }

            // ── RACE CONDITION GUARD (tahap awal, sebelum identifikasi user) ────────
            // Jika payload.user_id sudah ada, kita bisa lock lebih awal
            if (payload.user_id) {
                const userIdKey = String(payload.user_id);
                if (processingUsers.has(userIdKey)) {
                    console.warn(`[AbsenWajah] ⚠️ Double-tap ditolak untuk user_id=${userIdKey}`);
                    return res.status(429).json({
                        success: false,
                        message: "Absensi sedang diproses. Mohon tunggu sebentar sebelum mencoba lagi."
                    });
                }
                processingUsers.add(userIdKey);
                userId = userIdKey; // Simpan untuk release di finally
            }

            let user = null;
            let matchResult = { user: null, distance: null };

            // 2. Identify User (either by payload.user_id or by face matching)
            if (payload.user_id) {
                user = await userService.getById(payload.user_id);
                if (!user) {
                    return res.status(404).json({ success: false, message: "User tidak ditemukan." });
                }

                // ── LOCK untuk user yang diidentifikasi via user_id ──────────────────
                // (Jika belum di-lock di atas, lock sekarang setelah user dikonfirmasi ada)
                if (!userId) {
                    const userIdKey = String(user.id);
                    if (processingUsers.has(userIdKey)) {
                        console.warn(`[AbsenWajah] ⚠️ Double-tap ditolak untuk ${user.name} (ID:${userIdKey})`);
                        return res.status(429).json({
                            success: false,
                            message: "Absensi sedang diproses. Mohon tunggu sebentar sebelum mencoba lagi."
                        });
                    }
                    processingUsers.add(userIdKey);
                    userId = userIdKey;
                }
                console.log(`[AbsenWajah] User ditemukan: ${user.name} (ID:${user.id}), foto_face_recognition: ${user.foto_face_recognition || 'NULL'}`);

                // Verifikasi wajah SELALU dijalankan di endpoint storeWajah
                // (lock_face hanya berlaku untuk mode absen non-wajah seperti QR/manual)
                const verifyResult = await faceRecognitionService.verifyUserFace(incomingPath, user);

                if (!verifyResult.isMatch) {
                    // Pesan yang berbeda berdasarkan PENYEBAB kegagalan — bukan generik
                    let userMessage;
                    switch (verifyResult.failReason) {
                        case FACE_FAIL_REASON.FACE_NOT_DETECTED:
                            userMessage = `Absensi gagal: Wajah tidak terdeteksi pada foto yang diambil. Pastikan pencahayaan cukup dan wajah Anda terlihat jelas.`;
                            break;
                        case FACE_FAIL_REASON.FACE_TOO_SMALL:
                            userMessage = `Absensi gagal: Wajah terlalu jauh dari kamera. Silakan mendekat dan coba lagi.`;
                            break;
                        case FACE_FAIL_REASON.MULTIPLE_FACES:
                            userMessage = `Absensi gagal: Terdeteksi lebih dari satu wajah. Pastikan hanya Anda yang berada di depan kamera.`;
                            break;
                        case FACE_FAIL_REASON.REFERENCE_NO_URL:
                            userMessage = `Absensi gagal: Data wajah ${user.name} belum diregistrasi. Silakan hubungi admin untuk melakukan rekam wajah.`;
                            break;
                        case FACE_FAIL_REASON.REFERENCE_FILE_NOT_FOUND:
                            userMessage = `Absensi gagal: File foto referensi wajah ${user.name} tidak ditemukan di server. Silakan hubungi admin untuk melakukan rekam wajah ulang.`;
                            break;
                        case FACE_FAIL_REASON.REFERENCE_FACE_INVALID:
                            userMessage = `Absensi gagal: Foto referensi wajah ${user.name} tidak valid (wajah tidak terdeteksi di foto referensi). Silakan hubungi admin untuk melakukan rekam wajah ulang.`;
                            break;
                        case FACE_FAIL_REASON.FACE_NO_MATCH:
                            userMessage = `Absensi gagal: Wajah yang terdeteksi tidak cocok dengan data referensi ${user.name}.`;
                            break;
                        case FACE_FAIL_REASON.SYSTEM_ERROR:
                            userMessage = `Absensi gagal: Terjadi kesalahan sistem saat memverifikasi wajah. Silakan coba lagi.`;
                            break;
                        default:
                            userMessage = verifyResult.error || `Absensi gagal. Verifikasi wajah tidak berhasil untuk ${user.name}.`;
                    }

                    console.error(`[AbsenWajah] ❌ Verifikasi gagal untuk ${user.name}: failReason=${verifyResult.failReason}, distance=${verifyResult.distance}`);

                    return res.status(400).json({ 
                        success: false, 
                        message: userMessage,
                        failReason: verifyResult.failReason,
                        distance: verifyResult.distance,
                        detail: verifyResult.error
                    });
                }

                console.log(`[AbsenWajah] ✅ Verifikasi wajah berhasil untuk ${user.name}. Distance: ${verifyResult.distance?.toFixed(4)}`);
                matchResult.distance = verifyResult.distance;
            } else {
                console.log("[AbsenWajah] Identifikasi user via face matching (mode publik)...");
                const allUsers = await userService.getAllForFaceRecognition();
                console.log(`[AbsenWajah] Total kandidat user: ${allUsers.length}`);
                matchResult = await faceRecognitionService.findMatchingUser(incomingPath, allUsers);
                if (!matchResult.user) {
                    let pubMessage;
                    switch (matchResult.failReason) {
                        case FACE_FAIL_REASON.FACE_NOT_DETECTED:
                            pubMessage = "Absensi gagal: Wajah tidak terdeteksi pada foto. Pastikan pencahayaan cukup dan wajah terlihat jelas.";
                            break;
                        case FACE_FAIL_REASON.FACE_TOO_SMALL:
                            pubMessage = "Absensi gagal: Wajah terlalu kecil atau jauh dari kamera.";
                            break;
                        case FACE_FAIL_REASON.FACE_NO_MATCH:
                            pubMessage = "Absensi gagal: Wajah tidak dikenali. Pastikan wajah Anda sudah terdaftar di sistem.";
                            break;
                        default:
                            pubMessage = matchResult.error || "Absensi gagal. Wajah tidak dikenali.";
                    }
                    console.error(`[AbsenWajah] ❌ Match tidak ditemukan. FailReason: ${matchResult.failReason}`);
                    return res.status(400).json({ 
                        success: false, 
                        message: pubMessage,
                        failReason: matchResult.failReason,
                        detail: matchResult.error
                    });
                }
                user = matchResult.user;
                console.log(`[AbsenWajah] ✅ User teridentifikasi: ${user.name} (ID:${user.id}). Distance: ${matchResult.distance?.toFixed(4)}`);
            }

            // 3. Determine Shift and Attendance Type (Check shift AFTER identification)
            const getJakartaDateString = (d) => {
                const shifted = new Date(d.getTime() + (3600000 * 7));
                const year = shifted.getUTCFullYear();
                const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
                const day = String(shifted.getUTCDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            const now = new Date();
            const yesterday = new Date(now.getTime() - (24 * 3600 * 1000));
            
            const tStr = payload.tanggal || getJakartaDateString(now);
            const yStr = getJakartaDateString(yesterday);

            const isSameDay = (dateInput, targetStr) => {
                if (!dateInput) return false;
                return getJakartaDateString(new Date(dateInput)) === targetStr;
            };

            const parseJakartaTime = (dateInput, timeStr) => {
                const dStr = getJakartaDateString(new Date(dateInput));
                const [year, month, day] = dStr.split('-').map(Number);
                const [h, m, sec] = timeStr.split(':').map(Number);
                return new Date(Date.UTC(year, month - 1, day, h - 7, m, sec || 0));
            };

            console.log(`Checking shifts for user ${user.name} targeting ${tStr}`);
            
            // Fetch a range to handle yesterday's shifts that might still be open
            const recentShifts = await absensiService.getByIdUsersHistory(user.id.toString(), yStr, tStr);
            const activeShifts = recentShifts.filter(s => s.shift_id);

            if (!activeShifts || activeShifts.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Absensi gagal. ${user.name} tidak memiliki jadwal shift (Mapping Shift) yang aktif untuk hari ini.` 
                });
            }

            let shiftRecord = null;
            let tipe_absen = payload.tipe_absen; // 'masuk' or 'pulang'

            // Deteksi shift malam yang belum selesai (check-in kemarin, belum check-out)
            // Toleransi maksimal 14 jam: shift 8 jam + lembur max 4 jam + buffer 2 jam
            // 18 jam terlalu lebar dan bisa overlap dengan shift hari berikutnya
            const NIGHT_SHIFT_TOLERANCE_HOURS = 14;
            const openNightShift = activeShifts.find(s => {
                if (s.jam_absen && !s.jam_pulang) {
                    const checkInTime = parseJakartaTime(s.tanggal, s.jam_absen);
                    const elapsedHours = (now - checkInTime) / (1000 * 60 * 60);
                    return elapsedHours > 0 && elapsedHours < NIGHT_SHIFT_TOLERANCE_HOURS;
                }
                return false;
            });

            if (openNightShift) {
                shiftRecord = openNightShift;
                tipe_absen = 'pulang';
            } else {
                // SMART LOGIC: Find the best shift record among ACTIVE shifts
                if (tipe_absen === 'pulang' || tipe_absen === 'keluar') {
                    shiftRecord = activeShifts.find(s => s.jam_absen && !s.jam_pulang);
                    if (!shiftRecord) {
                        shiftRecord = activeShifts.find(s => isSameDay(s.tanggal, tStr));
                    }
                    tipe_absen = 'pulang';
                } else if (tipe_absen === 'masuk') {
                    shiftRecord = activeShifts.find(s => isSameDay(s.tanggal, tStr) && !s.jam_absen);
                    if (!shiftRecord) {
                        const alreadyIn = activeShifts.find(s => isSameDay(s.tanggal, tStr) && s.jam_absen);
                        if (alreadyIn) {
                            return res.status(400).json({ success: false, message: `Absensi gagal. ${user.name} sudah melakukan absensi masuk untuk shift hari ini.` });
                        }
                    }
                } else {
                    const openShift = activeShifts.find(s => s.jam_absen && !s.jam_pulang);
                    if (openShift) {
                        shiftRecord = openShift;
                        tipe_absen = 'pulang';
                    } else {
                        const todayShift = activeShifts.find(s => isSameDay(s.tanggal, tStr));
                        if (todayShift) {
                            if (todayShift.jam_absen && todayShift.jam_pulang) {
                                return res.status(400).json({ success: false, message: `Absensi gagal. Jadwal shift hari ini untuk ${user.name} sudah selesai.` });
                            }
                            shiftRecord = todayShift;
                            tipe_absen = todayShift.jam_absen ? 'pulang' : 'masuk';
                        }
                    }
                }
            }

            if (!shiftRecord) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Absensi gagal. Tidak ditemukan jadwal shift aktif yang sesuai untuk melakukan absensi saat ini." 
                });
            }

            if (tipe_absen === 'pulang' && shiftRecord.jam_pulang) {
                return res.status(400).json({ success: false, message: "Absensi gagal. Anda sudah mengisi jam pulang untuk shift ini." });
            }

            // 3. Location and Radius Check
            const isLocked = shiftRecord.lock_location === "1" || shiftRecord.lock_location === 1;
            let distanceValue = null;

            if (payload.lat && payload.long) {
                if (user.lokasi) {
                    const officeLat = parseFloat(user.lokasi.lat_kantor);
                    const officeLong = parseFloat(user.lokasi.long_kantor);
                    
                    // Validate office coordinates
                    if (isNaN(officeLat) || isNaN(officeLong) || (Math.abs(officeLat) < 0.0001 && Math.abs(officeLong) < 0.0001)) {
                        console.warn(`User ${user.name} has invalid office coordinates: ${officeLat}, ${officeLong}`);
                        if (isLocked) {
                            return res.status(400).json({ 
                                success: false, 
                                message: "Absensi gagal. Koordinat kantor tidak valid atau belum diatur dengan benar." 
                            });
                        }
                    } else {
                        const distance = this.calculateDistance(
                            parseFloat(payload.lat), parseFloat(payload.long),
                            officeLat, officeLong
                        );
                        const radius = parseFloat(user.lokasi.radius || 0);
                        distanceValue = Math.round(distance);

                        console.log(`[ABSEN] User: ${user.name}, Jarak: ${distanceValue}m, Radius: ${radius}m, Locked: ${isLocked}`);

                        if (isLocked && radius > 0 && distance > radius) {
                            return res.status(400).json({ 
                                success: false, 
                                message: `Absensi gagal. Anda berada di luar radius kantor.\nJarak Anda: ${distanceValue}m\nBatas Izin: ${radius}m\n\nSilakan mendekat ke lokasi kantor.` 
                            });
                        }
                    }
                } else if (isLocked) {
                    return res.status(400).json({ success: false, message: "Absensi gagal. Anda belum memiliki lokasi kantor yang ditugaskan (Shift Terkunci)." });
                }
            } else if (isLocked) {
                return res.status(400).json({ success: false, message: "Absensi gagal. Izin lokasi (GPS) wajib aktif untuk melakukan absensi pada shift ini." });
            }

            // 4. Cross-verify: Saat pulang, pastikan wajah sama dengan saat masuk
            if (tipe_absen === 'pulang' && shiftRecord.foto_jam_absen) {
                // PENTING: foto_jam_absen dari DB sudah di-serialize menjadi URL penuh
                // (misal: "http://103.178.175.109/api/uploads/absensi/foto.jpg")
                // JANGAN gunakan path.join() manual — gunakan resolveReferencePath()
                // yang sudah menangani URL penuh maupun relative path dengan benar.
                const checkInPhotoPath = faceRecognitionService.resolveReferencePath(shiftRecord.foto_jam_absen);
                console.log(`[AbsenWajah] 🔄 Cross-verify wajah check-in vs check-out untuk ${user.name}`);
                console.log(`[AbsenWajah] 📸 Path foto masuk (resolved): ${checkInPhotoPath}`);

                const crossResult = await faceRecognitionService.crossVerifyFaces(checkInPhotoPath, incomingPath);

                if (!crossResult.isMatch) {
                    console.error(`[AbsenWajah] ❌ Cross-verify GAGAL untuk ${user.name}: ${crossResult.error}`);
                    return res.status(400).json({
                        success: false,
                        message: `Absensi pulang gagal: Wajah saat pulang tidak cocok dengan wajah saat masuk. Pastikan yang absen pulang adalah orang yang sama yang absen masuk.`,
                        failReason: crossResult.failReason,
                        distance: crossResult.distance,
                        detail: crossResult.error
                    });
                }

                if (crossResult.skipped) {
                    console.warn(`[AbsenWajah] ⚠️ Cross-verify di-skip (foto check-in tidak bisa diproses). Lanjut berdasarkan verifikasi referensi.`);
                } else {
                    console.log(`[AbsenWajah] ✅ Cross-verify berhasil untuk ${user.name}. Distance: ${crossResult.distance?.toFixed(4)}`);
                }
            }

            // 5. Update Database
            const updatePayload = {
                user_id: user.id.toString()
            };

            const filename = path.basename(incomingPath);
            const nowJakarta = new Date(now.getTime() + (3600000 * 7));
            const timeStr = `${String(nowJakarta.getUTCHours()).padStart(2, '0')}:${String(nowJakarta.getUTCMinutes()).padStart(2, '0')}`;

            if (tipe_absen === 'masuk') {
                updatePayload.jam_absen = timeStr;
                updatePayload.foto_jam_absen = `/uploads/absensi/${filename}`;
                if (payload.lat) updatePayload.lat_absen = String(payload.lat);
                if (payload.long) updatePayload.long_absen = String(payload.long);
                if (distanceValue !== null) updatePayload.jarak_masuk = String(distanceValue);
                updatePayload.status_absen = 'Masuk';
            } else {
                updatePayload.jam_pulang = timeStr;
                updatePayload.foto_jam_pulang = `/uploads/absensi/${filename}`;
                if (payload.lat) updatePayload.lat_pulang = String(payload.lat);
                if (payload.long) updatePayload.long_pulang = String(payload.long);
                if (distanceValue !== null) updatePayload.jarak_pulang = String(distanceValue);
                updatePayload.status_absen = 'Pulang';
            }

            console.log(`Finalizing attendance for ${user.name} on shift ${shiftRecord.id}. Payload:`, JSON.stringify(updatePayload));
            const data = await absensiService.update(shiftRecord.id, updatePayload);

            return res.status(201).json({ 
                success: true, 
                message: `Absensi ${tipe_absen} wajah berhasil: ${user.name}`, 
                data, 
                distance: matchResult.distance,
                user: user
            });

        } catch (error) {
            console.error("AbsensiController.storeWajah FATAL ERROR:", error.message);

            // Jika error adalah QUEUE_TIMEOUT: antrian face recognition penuh
            // Kirim 503 (Service Unavailable) agar Nginx tidak override dengan 504
            if (error.message && error.message.startsWith('QUEUE_TIMEOUT')) {
                return res.status(503).json({
                    success: false,
                    message: "Sistem absensi sedang sangat sibuk (banyak karyawan absen bersamaan). Silakan coba lagi dalam 10-15 detik.",
                    error: error.message
                });
            }

            return res.status(500).json({ 
                success: false, 
                message: "Gagal memproses absensi wajah di server.", 
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });

        } finally {
            // ── RELEASE LOCK — selalu dijalankan, apapun yang terjadi ────────────
            // Pastikan lock dilepas meski terjadi error, agar user bisa absen ulang
            if (userId) {
                processingUsers.delete(userId);
                console.log(`[AbsenWajah] 🔓 Lock dilepas untuk user_id=${userId}`);
            }
        }
    }


    async update(req, res) {
        try {
            // Check if req.body is defined, if not fallback to empty object
            const payload = req.body ? { ...req.body } : {};

            if (req.files) {
                if (req.files.foto_jam_absen && req.files.foto_jam_absen.length > 0) {
                    payload.foto_jam_absen = `/uploads/absensi/${req.files.foto_jam_absen[0].filename}`;
                }
                if (req.files.foto_jam_pulang && req.files.foto_jam_pulang.length > 0) {
                    payload.foto_jam_pulang = `/uploads/absensi/${req.files.foto_jam_pulang[0].filename}`;
                }
            }

            const data = await absensiService.update(req.params.id, payload);
            if (!data) return res.status(404).json({ success: false, message: "Absensi tidak ditemukan" });
            return res.status(200).json({ success: true, message: "Absensi berhasil diupdate", data });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Gagal mengupdate absensi", error: error.message });
        }
    }

    async destroy(req, res) {
        try {
            const ok = await absensiService.delete(req.params.id);
            if (!ok) return res.status(404).json({ success: false, message: "Absensi tidak ditemukan" });
            return res.status(200).json({ success: true, message: "Absensi berhasil dihapus" });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Gagal menghapus absensi", error: error.message });
        }
    }

    async recap(req, res) {
        try {
            const { start_date, end_date } = req.query;
            const result = await absensiService.getRecap(start_date, end_date);
            return res.status(200).json({ success: true, message: "Data rekap berhasil diambil", data: result });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: "Gagal mengambil data rekap", error: error.message });
        }
    }
}

export default new AbsensiController();