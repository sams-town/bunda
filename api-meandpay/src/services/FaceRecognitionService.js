import path from 'path';
import fs from 'fs';
import * as canvas from 'canvas';
import * as faceapi from '@vladmandic/face-api/dist/face-api.node-wasm.js';

const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../../");

// Pastikan folder cache tersedia
const CACHE_DIR = path.join(__dirname, '..', '..', '.cache');
if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
}
const DESCRIPTORS_CACHE_FILE = path.join(CACHE_DIR, 'face_descriptors.json');

let modelsLoaded = false;

// ─── FACE RECOGNITION QUEUE ────────────────────────────────────────────────
// Batasi maksimal 2 proses face recognition berjalan bersamaan.
// Ini mencegah CPU spike ke 99% saat ratusan orang absen bersamaan.
const MAX_CONCURRENT = 2;

// Timeout menunggu slot (ms). Jika slot tidak tersedia dalam waktu ini,
// request ditolak dengan error — mencegah 504 Gateway Timeout dari Nginx.
// Nginx default timeout = 60s. Kita pakai 25s agar ada waktu untuk response error.
const QUEUE_WAIT_TIMEOUT_MS = 25000; // 25 detik

// Timeout per operasi face recognition (ms).
// WASM bisa hang pada gambar rusak. Batasi maksimal 20 detik per operasi.
const FACE_OP_TIMEOUT_MS = 20000; // 20 detik

let activeCount = 0;
const waitQueue = [];

function acquireSlot() {
    return new Promise((resolve, reject) => {
        if (activeCount < MAX_CONCURRENT) {
            activeCount++;
            resolve();
        } else {
            // Timer: jika menunggu > 25 detik, tolak request
            // sehingga server bisa kirim error 503 dan tidak diam sampai Nginx 504
            const timeoutId = setTimeout(() => {
                // Hapus diri dari antrian jika masih di sana
                const idx = waitQueue.findIndex(item => item.resolve === resolve);
                if (idx !== -1) waitQueue.splice(idx, 1);
                reject(new Error('QUEUE_TIMEOUT: Sistem face recognition sedang sangat sibuk. Silakan coba lagi dalam beberapa detik.'));
            }, QUEUE_WAIT_TIMEOUT_MS);

            // Simpan resolve + timeoutId agar bisa dibersihkan saat slot tersedia
            waitQueue.push({
                resolve: () => {
                    clearTimeout(timeoutId); // Batalkan timeout karena slot sudah dapat
                    resolve();
                }
            });
        }
    });
}

function releaseSlot() {
    if (waitQueue.length > 0) {
        const next = waitQueue.shift();
        next.resolve(); // slot langsung diberikan ke yang menunggu
    } else {
        activeCount--;
    }
}

/**
 * Wrapper timeout untuk operasi async face recognition.
 * Mencegah WASM hang selamanya pada gambar rusak atau sangat besar.
 * @param {Promise} promise - operasi yang ingin di-timeout
 * @param {number} ms - batas waktu dalam milidetik
 * @param {string} label - label untuk logging
 */
function withTimeout(promise, ms, label) {
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`FACE_TIMEOUT: Operasi '${label}' melebihi batas ${ms / 1000}s. Gambar mungkin terlalu besar atau rusak.`)), ms)
    );
    return Promise.race([promise, timeoutPromise]);
}
// ────────────────────────────────────────────────────────────────────────────


/**
 * Enum-like constants untuk reason kegagalan verifikasi wajah.
 * Digunakan untuk membedakan jenis kegagalan di response API.
 */
export const FACE_FAIL_REASON = {
    FACE_NOT_DETECTED:       'FACE_NOT_DETECTED',       // Tidak ada wajah di foto absensi
    FACE_TOO_SMALL:          'FACE_TOO_SMALL',           // Wajah terlalu kecil / jauh
    MULTIPLE_FACES:          'MULTIPLE_FACES',            // Lebih dari satu wajah
    REFERENCE_NO_URL:        'REFERENCE_NO_URL',          // User tidak punya foto referensi
    REFERENCE_FILE_NOT_FOUND:'REFERENCE_FILE_NOT_FOUND',  // File foto referensi tidak ada di disk
    REFERENCE_FACE_INVALID:  'REFERENCE_FACE_INVALID',    // Foto referensi ada tapi wajah tidak terdeteksi
    FACE_NO_MATCH:           'FACE_NO_MATCH',             // Wajah terdeteksi tapi tidak cocok
    SYSTEM_ERROR:            'SYSTEM_ERROR',              // Error teknis tak terduga
};

class FaceRecognitionService {
    // ─── CACHE DESCRIPTOR WAJAH (MEMORY & DISK) ────────────────────────────
    // Cache descriptor foto REFERENSI per user.
    // Memory Cache: Map()
    userDescriptorsCache = new Map();
    static REFERENCE_CACHE_TTL_MS = 60 * 60 * 1000; // 60 menit di memory

    // Cache descriptor foto CHECK-IN (foto saat absen masuk).
    checkInDescriptorCache = new Map();
    static CHECKIN_CACHE_TTL_MS = 16 * 60 * 60 * 1000; // 16 jam

    constructor() {
        this.loadDiskCache();
    }

    /**
     * Muat cache descriptor dari disk saat service diinisialisasi.
     * Mencegah proses ulang WASM yang lama saat PM2 restart.
     */
    loadDiskCache() {
        try {
            if (fs.existsSync(DESCRIPTORS_CACHE_FILE)) {
                const data = fs.readFileSync(DESCRIPTORS_CACHE_FILE, 'utf8');
                const parsed = JSON.parse(data);
                const now = Date.now();
                
                let loadedCount = 0;
                for (const [userId, entry] of Object.entries(parsed)) {
                    if (entry.descriptor && Array.isArray(entry.descriptor)) {
                        // Ubah array biasa kembali ke Float32Array
                        const floatArray = new Float32Array(entry.descriptor);
                        this.userDescriptorsCache.set(userId, { descriptor: floatArray, cachedAt: now });
                        loadedCount++;
                    }
                }
                console.log(`[FaceRecognition] 🚀 Berhasil memuat ${loadedCount} descriptor dari disk cache.`);
            }
        } catch (error) {
            console.error(`[FaceRecognition] Gagal memuat disk cache:`, error.message);
        }
    }

    /**
     * Simpan memory cache ke disk agar persisten.
     */
    saveDiskCache() {
        try {
            const dataToSave = {};
            for (const [userId, entry] of this.userDescriptorsCache.entries()) {
                // Ubah Float32Array ke Array biasa agar bisa di stringify
                dataToSave[userId] = {
                    descriptor: Array.from(entry.descriptor),
                    cachedAt: entry.cachedAt
                };
            }
            fs.writeFileSync(DESCRIPTORS_CACHE_FILE, JSON.stringify(dataToSave), 'utf8');
        } catch (error) {
            console.error(`[FaceRecognition] Gagal menyimpan disk cache:`, error.message);
        }
    }
    // ─────────────────────────────────────────────────────────────────────────────

    async loadModels() {
        if (modelsLoaded) return;
        
        await faceapi.tf.setBackend('wasm');
        await faceapi.tf.ready();

        const MODEL_URL = path.join(ROOT_DIR, 'node_modules', '@vladmandic/face-api', 'model');
        console.log("[FaceRecognition] Loading faceapi models from:", MODEL_URL);
        await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_URL);
        modelsLoaded = true;
        console.log("[FaceRecognition] Models loaded successfully.");
    }

    /**
     * Invalidate cache untuk user tertentu.
     * WAJIB dipanggil setiap kali foto face recognition user diperbarui.
     * @param {string|number} userId
     */
    invalidateUserCache(userId) {
        const userIdStr = userId.toString();
        if (this.userDescriptorsCache[userIdStr]) {
            delete this.userDescriptorsCache[userIdStr];
            console.log(`[FaceRecognition] Cache invalidated for user ID: ${userIdStr}`);
        }
    }

    /**
     * Resolve path fisik dari URL atau relative path yang tersimpan di database.
     * @param {string} fotoUrl - nilai foto_face_recognition dari DB
     * @returns {string} - absolute path di filesystem server
     */
    resolveReferencePath(fotoUrl) {
        try {
            const url = new URL(fotoUrl);
            const cleanPath = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
            return path.join(ROOT_DIR, "public", cleanPath);
        } catch (_) {
            const cleanRelativePath = fotoUrl.startsWith('/') ? fotoUrl.substring(1) : fotoUrl;
            return path.join(ROOT_DIR, "public", cleanRelativePath);
        }
    }

    /**
     * Ekstrak face descriptor dari sebuah gambar di disk.
     * @param {string} imagePath - absolute path ke file gambar
     * @param {string} [context] - label untuk logging
     * @returns {Float32Array|{error: string, failReason: string}|null}
     */
    async getFaceDescriptor(imagePath, context = '') {
        await this.loadModels();

        const logPrefix = context ? `[FaceRecognition][${context}]` : '[FaceRecognition]';

        if (!fs.existsSync(imagePath)) {
            console.error(`${logPrefix} File tidak ditemukan di path: ${imagePath}`);
            return null;
        }

        try {
            const img = await withTimeout(
                canvas.loadImage(imagePath),
                FACE_OP_TIMEOUT_MS,
                `loadImage:${context}`
            );

            const detections = await withTimeout(
                faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors(),
                FACE_OP_TIMEOUT_MS,
                `detectFaces:${context}`
            );
            if (detections.length === 0) {
                console.warn(`${logPrefix} Tidak ada wajah terdeteksi di: ${imagePath}`);
                return { 
                    error: "Wajah tidak terdeteksi pada foto. Pastikan pencahayaan cukup dan wajah terlihat jelas.",
                    failReason: FACE_FAIL_REASON.FACE_NOT_DETECTED
                };
            }
            
            if (detections.length > 1) {
                console.warn(`${logPrefix} Terdeteksi ${detections.length} wajah di: ${imagePath}`);
                return { 
                    error: "Terdeteksi lebih dari satu wajah. Pastikan hanya ada satu orang di dalam foto.",
                    failReason: FACE_FAIL_REASON.MULTIPLE_FACES
                };
            }

            const detection = detections[0];
            const faceWidth = detection.detection.box.width;
            const imgWidth = img.width;

            if (faceWidth < imgWidth * 0.15) {
                console.warn(`${logPrefix} Wajah terlalu kecil (${Math.round(faceWidth)}px dari ${imgWidth}px) di: ${imagePath}`);
                return { 
                    error: "Wajah terlalu jauh atau terlalu kecil. Silakan ambil foto lebih dekat.",
                    failReason: FACE_FAIL_REASON.FACE_TOO_SMALL
                };
            }

            console.log(`${logPrefix} Face descriptor berhasil diekstrak. Face: ${Math.round(faceWidth)}px / ${imgWidth}px`);
            return detection.descriptor;

        } catch (e) {
            // Tangani timeout dan error lain secara eksplisit
            if (e.message && e.message.startsWith('FACE_TIMEOUT')) {
                console.error(`${logPrefix} ⏱️ Timeout ekstrak descriptor: ${e.message}`);
                return { error: 'Proses analisis wajah terlalu lama. Coba gunakan foto dengan ukuran lebih kecil.', failReason: FACE_FAIL_REASON.SYSTEM_ERROR };
            }
            console.error(`${logPrefix} Error saat ekstrak descriptor dari ${imagePath}:`, e.message);
            return null;
        }
    }

    /**
     * Dapatkan descriptor referensi untuk user tertentu, dari cache atau disk.
     */
    async getUserDescriptor(user) {
        const userIdStr = user.id.toString();
        const userName = user.name || `user#${userIdStr}`;
        const now = Date.now();

        // Cek cache TTL: gunakan descriptor yang tersimpan jika belum expired
        const cached = this.userDescriptorsCache.get(userIdStr);
        if (cached && (now - cached.cachedAt) < FaceRecognitionService.REFERENCE_CACHE_TTL_MS) {
            const ageMin = Math.round((now - cached.cachedAt) / 60000);
            console.log(`[FaceRecognition][${userName}] ⚡ Cache HIT descriptor referensi (usia: ${ageMin} menit).`);
            return { desc: cached.descriptor, failReason: null, referencePath: 'cached' };
        }

        if (cached) {
            console.log(`[FaceRecognition][${userName}] Cache EXPIRED, refresh dari disk.`);
        }

        if (!user.foto_face_recognition) {
            console.warn(`[FaceRecognition][${userName}] Tidak punya foto_face_recognition di database.`);
            return { desc: null, failReason: FACE_FAIL_REASON.REFERENCE_NO_URL, referencePath: '' };
        }

        const referencePath = this.resolveReferencePath(user.foto_face_recognition);
        console.log(`[FaceRecognition][${userName}] URL DB: ${user.foto_face_recognition}`);
        console.log(`[FaceRecognition][${userName}] Resolved path: ${referencePath}`);

        if (!fs.existsSync(referencePath)) {
            console.error(`[FaceRecognition][${userName}] File referensi TIDAK DITEMUKAN: ${referencePath}`);
            return { desc: null, failReason: FACE_FAIL_REASON.REFERENCE_FILE_NOT_FOUND, referencePath };
        }

        const userDesc = await this.getFaceDescriptor(referencePath, userName);

        if (!userDesc) {
            return { desc: null, failReason: FACE_FAIL_REASON.REFERENCE_FACE_INVALID, referencePath };
        }

        if (userDesc.error) {
            return { desc: null, failReason: userDesc.failReason || FACE_FAIL_REASON.REFERENCE_FACE_INVALID, referencePath };
        }

        // Simpan ke memory cache
        this.userDescriptorsCache.set(userIdStr, { descriptor: userDesc, cachedAt: now });
        console.log(`[FaceRecognition][${userName}] 💾 Descriptor referensi disimpan ke memory cache.`);
        
        // Simpan permanen ke disk cache secara asynchronous agar tidak memblokir proses
        setTimeout(() => this.saveDiskCache(), 100);

        return { desc: userDesc, failReason: null, referencePath };
    }

    /**
     * Hapus cache descriptor user tertentu (dari memory dan disk).
     * Panggil ini saat foto referensi user diperbarui (upload ulang foto wajah).
     */
    invalidateUserCache(userId) {
        const userIdStr = String(userId);
        const deleted = this.userDescriptorsCache.delete(userIdStr);
        if (deleted) {
            this.saveDiskCache();
        }
        console.log(`[FaceRecognition] Cache descriptor user ${userIdStr} ${deleted ? 'dihapus' : 'tidak ada di cache'}.`);
    }

    /**
     * Simpan descriptor foto check-in ke cache untuk digunakan crossVerify saat pulang.
     * @param {string} absensiId - ID record absensi
     * @param {Float32Array} descriptor - descriptor wajah foto check-in
     */
    cacheCheckInDescriptor(absensiId, descriptor) {
        const key = String(absensiId);
        this.checkInDescriptorCache.set(key, { descriptor, cachedAt: Date.now() });
        console.log(`[FaceRecognition] 💾 Cache check-in descriptor untuk absensi ID ${key} disimpan (TTL: 16 jam).`);
    }

    /**
     * Ambil descriptor foto check-in dari cache.
     * @param {string} absensiId - ID record absensi
     * @returns {Float32Array|null} descriptor atau null jika tidak ada/expired
     */
    getCheckInDescriptorFromCache(absensiId) {
        const key = String(absensiId);
        const cached = this.checkInDescriptorCache.get(key);
        if (!cached) return null;
        const now = Date.now();
        if ((now - cached.cachedAt) > FaceRecognitionService.CHECKIN_CACHE_TTL_MS) {
            this.checkInDescriptorCache.delete(key);
            return null;
        }
        const ageMin = Math.round((now - cached.cachedAt) / 60000);
        console.log(`[FaceRecognition] ⚡ Cache HIT check-in descriptor untuk absensi ID ${key} (usia: ${ageMin} menit).`);
        return cached.descriptor;
    }

    /**
     * Identifikasi user dari foto absensi (mode publik tanpa user_id).
     */
    async findMatchingUser(incomingPath, users) {
        await acquireSlot();
        try {
            await this.loadModels();

            console.log(`[FaceRecognition][findMatchingUser] Foto: ${incomingPath}, Kandidat: ${users.length}`);

            const incomingDesc = await this.getFaceDescriptor(incomingPath, 'incoming');

            if (!incomingDesc) {
                return { user: null, error: "Tidak ditemukan wajah pada foto absensi. Pastikan wajah terlihat jelas.", failReason: FACE_FAIL_REASON.FACE_NOT_DETECTED };
            }
            
            if (incomingDesc.error) {
                return { user: null, error: incomingDesc.error, failReason: incomingDesc.failReason };
            }

            // Gunakan threshold lebih ketat (0.38) untuk pencocokan 1:N guna mencegah salah orang
            const THRESHOLD = 0.38;
            let bestMatch = null;
            let bestDistance = THRESHOLD;
            let secondBestDistance = 1.0;

            for (const user of users) {
                if (!user.foto_face_recognition) continue;

                const { desc: userDesc, failReason } = await this.getUserDescriptor(user);
                if (!userDesc) {
                    console.warn(`[FaceRecognition][findMatchingUser] Skip ${user.name} — ${failReason}`);
                    continue;
                }

                try {
                    const distance = faceapi.euclideanDistance(incomingDesc, userDesc);
                    console.log(`[FaceRecognition] ${user.name} | Distance: ${distance.toFixed(4)}`);
                    if (distance < bestDistance) {
                        secondBestDistance = bestDistance;
                        bestDistance = distance;
                        bestMatch = user;
                    } else if (distance < secondBestDistance) {
                        secondBestDistance = distance;
                    }
                } catch (err) {
                    console.error(`[FaceRecognition] Error comparing ${user.name}:`, err.message);
                }
            }

            if (bestMatch) {
                console.log(`[FaceRecognition][findMatchingUser] ✅ Match: ${bestMatch.name} | Distance: ${bestDistance.toFixed(4)}`);
                return { user: bestMatch, distance: bestDistance };
            }

            return { 
                user: null, 
                error: "Wajah tidak cocok dengan data referensi karyawan mana pun. Silakan gunakan pencarian nama/NIP untuk absen terverifikasi.", 
                failReason: FACE_FAIL_REASON.FACE_NO_MATCH 
            };
        } finally {
            releaseSlot();
        }
    }

    /**
     * Verifikasi wajah untuk user tertentu (diketahui dari user_id).
     */
    async verifyUserFace(incomingPath, user) {
        await acquireSlot(); // Tunggu slot tersedia (max 2 paralel)
        try {
            await this.loadModels();

            const userName = user.name || `user#${user.id}`;
            const THRESHOLD = 0.45;

            console.log(`[FaceRecognition][verifyUserFace] ===== Verifikasi ${userName} (ID:${user.id}) =====`);
            console.log(`[FaceRecognition][verifyUserFace] Foto absensi: ${incomingPath}`);
            console.log(`[FaceRecognition][verifyUserFace] foto_face_recognition DB: ${user.foto_face_recognition || 'NULL'}`);

            const incomingDesc = await this.getFaceDescriptor(incomingPath, `${userName}/incoming`);

            if (!incomingDesc) {
                return { isMatch: false, error: "Tidak ditemukan wajah pada foto absensi. Pastikan wajah terlihat jelas.", failReason: FACE_FAIL_REASON.FACE_NOT_DETECTED };
            }

            if (incomingDesc.error) {
                return { isMatch: false, error: incomingDesc.error, failReason: incomingDesc.failReason };
            }

            const { desc: userDesc, failReason, referencePath } = await this.getUserDescriptor(user);

            if (!userDesc) {
                let errorMsg;
                switch (failReason) {
                    case FACE_FAIL_REASON.REFERENCE_NO_URL:
                        errorMsg = "Data wajah referensi belum diregistrasi. Silakan lakukan rekam wajah terlebih dahulu.";
                        break;
                    case FACE_FAIL_REASON.REFERENCE_FILE_NOT_FOUND:
                        errorMsg = `File foto referensi tidak ditemukan di server. Silakan lakukan rekam wajah ulang.`;
                        break;
                    case FACE_FAIL_REASON.REFERENCE_FACE_INVALID:
                        errorMsg = "Foto referensi tidak mengandung wajah yang valid. Silakan lakukan rekam wajah ulang.";
                        break;
                    default:
                        errorMsg = "Gagal memproses foto referensi wajah.";
                }
                console.error(`[FaceRecognition][verifyUserFace] ❌ Descriptor referensi gagal. FailReason: ${failReason}`);
                return { isMatch: false, error: errorMsg, failReason };
            }

            try {
                const distance = faceapi.euclideanDistance(incomingDesc, userDesc);
                console.log(`[FaceRecognition][verifyUserFace] Distance: ${distance.toFixed(4)} | Threshold: ${THRESHOLD} | Match: ${distance < THRESHOLD ? 'YES' : 'NO'}`);

                if (distance < THRESHOLD) {
                    return { isMatch: true, distance };
                }

                return {
                    isMatch: false,
                    distance,
                    error: `Wajah tidak cocok dengan data referensi (score: ${(1 - distance).toFixed(2)}).`,
                    failReason: FACE_FAIL_REASON.FACE_NO_MATCH
                };
            } catch (err) {
                console.error(`[FaceRecognition][verifyUserFace] ❌ Error comparing:`, err.message);
                return { isMatch: false, error: "Terjadi kesalahan teknis saat membandingkan wajah.", failReason: FACE_FAIL_REASON.SYSTEM_ERROR };
            }
        } finally {
            releaseSlot(); // Kembalikan slot ke queue — selalu dijalankan
        }
    }

    /**
     * Validasi foto untuk registrasi — cek wajah terdeteksi sebelum simpan ke DB.
     */
    async validateFaceForRegistration(imagePath) {
        console.log(`[FaceRecognition][validateForRegistration] Memvalidasi: ${imagePath}`);
        
        const descriptor = await this.getFaceDescriptor(imagePath, 'registration-check');

        if (!descriptor) {
            return { valid: false, error: "Gagal memproses gambar. Pastikan format foto valid (JPEG/PNG).", failReason: FACE_FAIL_REASON.SYSTEM_ERROR };
        }

        if (descriptor.error) {
            return { valid: false, error: descriptor.error, failReason: descriptor.failReason };
        }

        console.log(`[FaceRecognition][validateForRegistration] ✅ Foto valid untuk registrasi.`);
        return { valid: true };
    }

    /**
     * Cross-verify dua foto absensi (check-in vs check-out) untuk memastikan
     * wajah yang sama. Digunakan saat absen pulang untuk memvalidasi bahwa
     * orang yang check-out adalah orang yang sama yang check-in.
     * @param {string} checkInPhotoPath - absolute path ke foto check-in
     * @param {string} checkOutPhotoPath - absolute path ke foto check-out
     * @param {string|null} absensiId - ID record absensi (opsional, untuk cache check-in descriptor)
     * @returns {{ isMatch: boolean, distance?: number, error?: string, failReason?: string }}
     */
    async crossVerifyFaces(checkInPhotoPath, checkOutPhotoPath, absensiId = null) {
        // crossVerify WAJIB masuk ke queue yang sama dengan verifyUserFace
        await acquireSlot();
        try {
            await this.loadModels();

            const THRESHOLD = 0.65;
            const WARNING_ZONE = 0.55;
            const logPrefix = '[FaceRecognition][crossVerify]';

            console.log(`${logPrefix} Membandingkan foto check-in vs check-out`);
            console.log(`${logPrefix} Check-in : ${checkInPhotoPath}`);
            console.log(`${logPrefix} Check-out: ${checkOutPhotoPath}`);
            console.log(`${logPrefix} Threshold: ${THRESHOLD} (zona warning: ${WARNING_ZONE}-${THRESHOLD})`);

            // ── Coba ambil descriptor check-in dari cache dulu (hemat 15-20 detik) ──
            let checkInDesc = absensiId ? this.getCheckInDescriptorFromCache(absensiId) : null;

            if (!checkInDesc) {
                // Cache miss: validasi file dan ekstrak descriptor
                if (!fs.existsSync(checkInPhotoPath)) {
                    console.error(`${logPrefix} File foto check-in tidak ditemukan: ${checkInPhotoPath}`);
                    console.warn(`${logPrefix} Skipping cross-verify karena file check-in tidak ditemukan di disk.`);
                    return { isMatch: true, distance: null, skipped: true };
                }

                checkInDesc = await this.getFaceDescriptor(checkInPhotoPath, 'crossVerify/checkIn');
                if (!checkInDesc) {
                    console.warn(`${logPrefix} Wajah tidak terdeteksi di foto check-in. Skipping cross-verify.`);
                    return { isMatch: true, distance: null, skipped: true };
                }
                if (checkInDesc.error) {
                    console.warn(`${logPrefix} Foto check-in gagal diproses: ${checkInDesc.error}. Skipping cross-verify.`);
                    return { isMatch: true, distance: null, skipped: true };
                }

                // Simpan ke cache untuk request berikutnya (misal: double-check)
                if (absensiId) {
                    this.cacheCheckInDescriptor(absensiId, checkInDesc);
                }
            }

            // Ekstrak descriptor dari foto check-out (foto yang baru diambil)
            const checkOutDesc = await this.getFaceDescriptor(checkOutPhotoPath, 'crossVerify/checkOut');
            if (!checkOutDesc) {
                return {
                    isMatch: false,
                    error: "Wajah tidak terdeteksi pada foto absensi pulang. Pastikan pencahayaan cukup dan wajah terlihat jelas.",
                    failReason: FACE_FAIL_REASON.FACE_NOT_DETECTED
                };
            }
            if (checkOutDesc.error) {
                return {
                    isMatch: false,
                    error: checkOutDesc.error,
                    failReason: checkOutDesc.failReason
                };
            }

            const distance = faceapi.euclideanDistance(checkInDesc, checkOutDesc);
            const similarityScore = Math.max(0, (1 - distance) * 100).toFixed(1);
            const matchStatus = distance < THRESHOLD ? 'MATCH' : 'NO_MATCH';

            console.log(`${logPrefix} ===== HASIL CROSS-VERIFY =====`);
            console.log(`${logPrefix} Distance      : ${distance.toFixed(4)}`);
            console.log(`${logPrefix} Threshold     : ${THRESHOLD}`);
            console.log(`${logPrefix} Warning Zone  : ${WARNING_ZONE}`);
            console.log(`${logPrefix} Similarity    : ${similarityScore}%`);
            console.log(`${logPrefix} Status        : ${matchStatus}`);

            if (distance < WARNING_ZONE) {
                console.log(`${logPrefix} ✅ Match confidence TINGGI (distance ${distance.toFixed(4)} < ${WARNING_ZONE})`);
                return { isMatch: true, distance };
            }

            if (distance < THRESHOLD) {
                // Zona abu-abu — kemungkinan sama tapi kondisi foto berbeda (pencahayaan, ekspresi)
                // Tetap izinkan karena Layer 1 (verifikasi foto profil) sudah berhasil
                console.warn(`${logPrefix} ⚠️ Match di ZONA ABU-ABU (distance ${distance.toFixed(4)}, antara ${WARNING_ZONE}-${THRESHOLD}). Diizinkan karena Layer 1 sudah lolos.`);
                return { isMatch: true, distance, warningZone: true };
            }

            // Distance >= 0.65 → kemungkinan orang berbeda (fraud)
            console.error(`${logPrefix} ❌ NO MATCH — distance ${distance.toFixed(4)} >= threshold ${THRESHOLD}. Kemungkinan orang yang berbeda.`);
            return {
                isMatch: false,
                distance,
                error: `Wajah saat pulang tidak cocok dengan wajah saat masuk (kemiripan: ${similarityScore}%). Pastikan yang absen pulang adalah orang yang sama yang absen masuk.`,
                failReason: FACE_FAIL_REASON.FACE_NO_MATCH
            };

        } catch (err) {
            console.error(`[FaceRecognition][crossVerify] Error saat cross-verify:`, err.message);
            // Jika terjadi error teknis (termasuk QUEUE_TIMEOUT), skip cross-verify
            console.warn(`[FaceRecognition][crossVerify] Skipping cross-verify karena error. Layer 1 sudah berhasil.`);
            return { isMatch: true, distance: null, skipped: true };
        } finally {
            // WAJIB: kembalikan slot ke queue, apapun yang terjadi
            releaseSlot();
        }
    }


    // Backward compatibility
    async compareFaces(referencePath, incomingPath) {
        try {
            const desc1 = await this.getFaceDescriptor(referencePath, 'reference');
            if (!desc1 || desc1.error) return { isMatch: false, error: "Tidak ditemukan wajah referensi" };
            const desc2 = await this.getFaceDescriptor(incomingPath, 'incoming');
            if (!desc2 || desc2.error) return { isMatch: false, error: "Tidak ditemukan wajah pada input" };
            const distance = faceapi.euclideanDistance(desc1, desc2);
            return { isMatch: distance < 0.45, distance };
        } catch (error) {
            return { isMatch: false, error: error.message, failReason: FACE_FAIL_REASON.SYSTEM_ERROR };
        }
    }
}

export default new FaceRecognitionService();
