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

let modelsLoaded = false;

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
    // Cache in-memory descriptor per user ID (string).
    // PENTING: Harus di-invalidate setiap kali foto referensi user diperbarui.
    userDescriptorsCache = {};

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
            const img = await canvas.loadImage(imagePath);
            const detections = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors();

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

        const cached = this.userDescriptorsCache[userIdStr];
        if (cached) {
            console.log(`[FaceRecognition][${userName}] Menggunakan cached descriptor.`);
            return { desc: cached, failReason: null, referencePath: 'cached' };
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

        this.userDescriptorsCache[userIdStr] = userDesc;
        console.log(`[FaceRecognition][${userName}] Descriptor disimpan ke cache.`);

        return { desc: userDesc, failReason: null, referencePath };
    }

    /**
     * Identifikasi user dari foto absensi (mode publik tanpa user_id).
     */
    async findMatchingUser(incomingPath, users) {
        await this.loadModels();

        console.log(`[FaceRecognition][findMatchingUser] Foto: ${incomingPath}, Kandidat: ${users.length}`);

        const incomingDesc = await this.getFaceDescriptor(incomingPath, 'incoming');

        if (!incomingDesc) {
            return { user: null, error: "Tidak ditemukan wajah pada foto absensi.", failReason: FACE_FAIL_REASON.FACE_NOT_DETECTED };
        }
        
        if (incomingDesc.error) {
            return { user: null, error: incomingDesc.error, failReason: incomingDesc.failReason };
        }

        const THRESHOLD = 0.45;
        let bestMatch = null;
        let bestDistance = THRESHOLD;

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
                    bestDistance = distance;
                    bestMatch = user;
                }
            } catch (err) {
                console.error(`[FaceRecognition] Error comparing ${user.name}:`, err.message);
            }
        }

        if (bestMatch) {
            console.log(`[FaceRecognition][findMatchingUser] ✅ Match: ${bestMatch.name} | Distance: ${bestDistance.toFixed(4)}`);
            return { user: bestMatch, distance: bestDistance };
        }

        return { user: null, error: "Wajah tidak cocok dengan data referensi karyawan mana pun.", failReason: FACE_FAIL_REASON.FACE_NO_MATCH };
    }

    /**
     * Verifikasi wajah untuk user tertentu (diketahui dari user_id).
     */
    async verifyUserFace(incomingPath, user) {
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
