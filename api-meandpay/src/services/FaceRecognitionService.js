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

class FaceRecognitionService {
    userDescriptorsCache = {};

    async loadModels() {
        if (modelsLoaded) return;
        
        await faceapi.tf.setBackend('wasm');
        await faceapi.tf.ready();

        const MODEL_URL = path.join(ROOT_DIR, 'node_modules', '@vladmandic/face-api', 'model');
        console.log("Loading faceapi models from:", MODEL_URL);
        await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_URL);
        modelsLoaded = true;
    }

    async getFaceDescriptor(imagePath) {
        await this.loadModels();
        if (!fs.existsSync(imagePath)) {
            console.error("Image not found at path:", imagePath);
            return null;
        }
        try {
            const img = await canvas.loadImage(imagePath);
            // Use detectAllFaces to check for multiple people
            const detections = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors();
            
            if (detections.length === 0) {
                console.warn("No face detected in:", imagePath);
                return null;
            }
            
            if (detections.length > 1) {
                console.warn("Multiple faces detected in:", imagePath);
                // Return a special object or throw error to indicate multiple faces
                return { error: "Terdeteksi lebih dari satu wajah. Pastikan hanya ada satu orang di dalam foto." };
            }

            const detection = detections[0];
            
            // Optional: Check if face is too small (e.g., less than 20% of image width)
            const faceWidth = detection.detection.box.width;
            const imgWidth = img.width;
            if (faceWidth < imgWidth * 0.15) {
                console.warn("Face too small in:", imagePath);
                return { error: "Wajah terlalu jauh atau terlalu kecil. Silakan ambil foto lebih dekat." };
            }

            return detection.descriptor;
        } catch (e) {
            console.error("Error getFaceDescriptor for", imagePath, e.message);
            return null;
        }
    }

    async findMatchingUser(incomingPath, users) {
        await this.loadModels();
        const incomingDesc = await this.getFaceDescriptor(incomingPath);
        if (!incomingDesc) {
            return { user: null, error: "Tidak ditemukan wajah pada foto absensi yang di-upload." };
        }
        
        if (incomingDesc.error) {
            return { user: null, error: incomingDesc.error };
        }

        let bestMatch = null;
        let bestDistance = 0.45; // tightened threshold from 0.55 to 0.45

        for (const user of users) {
            if (!user.foto_face_recognition) continue;

            const userIdStr = user.id.toString();
            let userDesc = this.userDescriptorsCache[userIdStr];
            
            if (!userDesc) {
                let referencePath = "";
                try {
                    const url = new URL(user.foto_face_recognition);
                    // Ensure pathname doesn't have leading slash when joining if we want it to be relative to ROOT_DIR/public
                    // url.pathname usually stars with /
                    const cleanPath = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
                    referencePath = path.join(ROOT_DIR, "public", cleanPath);
                } catch (e) {
                    const cleanRelativePath = user.foto_face_recognition.startsWith('/') ? user.foto_face_recognition.substring(1) : user.foto_face_recognition;
                    referencePath = path.join(ROOT_DIR, "public", cleanRelativePath);
                }
                
                userDesc = await this.getFaceDescriptor(referencePath);
                if (userDesc) {
                    this.userDescriptorsCache[userIdStr] = userDesc;
                }
            }

            if (userDesc && !userDesc.error) {
                try {
                    const distance = faceapi.euclideanDistance(incomingDesc, userDesc);
                    if (distance < bestDistance) {
                        bestDistance = distance;
                        bestMatch = user;
                    }
                } catch (err) {
                    console.error(`Error comparing faces for user ${user.name}:`, err.message);
                }
            }
        }

        if (bestMatch) {
            return { user: bestMatch, distance: bestDistance };
        }
        return { user: null, error: "Wajah tidak cocok dengan data referensi karyawan mana pun." };
    }

    async verifyUserFace(incomingPath, user) {
        await this.loadModels();
        const incomingDesc = await this.getFaceDescriptor(incomingPath);
        if (!incomingDesc) {
            return { isMatch: false, error: "Tidak ditemukan wajah pada foto absensi." };
        }

        if (incomingDesc.error) {
            return { isMatch: false, error: incomingDesc.error };
        }

        if (!user.foto_face_recognition) {
            return { isMatch: false, error: "User tidak memiliki foto referensi wajah." };
        }

        const userIdStr = user.id.toString();
        let userDesc = this.userDescriptorsCache[userIdStr];

        if (!userDesc) {
            let referencePath = "";
            try {
                const url = new URL(user.foto_face_recognition);
                const cleanPath = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
                referencePath = path.join(ROOT_DIR, "public", cleanPath);
            } catch (e) {
                const cleanRelativePath = user.foto_face_recognition.startsWith('/') ? user.foto_face_recognition.substring(1) : user.foto_face_recognition;
                referencePath = path.join(ROOT_DIR, "public", cleanRelativePath);
            }

            userDesc = await this.getFaceDescriptor(referencePath);
            if (userDesc) {
                this.userDescriptorsCache[userIdStr] = userDesc;
            }
        }

        if (!userDesc || userDesc.error) {
            return { isMatch: false, error: userDesc?.error || "Gagal memproses foto referensi wajah user." };
        }

        try {
            const distance = faceapi.euclideanDistance(incomingDesc, userDesc);
            const threshold = 0.45; // tightened threshold
            
            if (distance < threshold) {
                return { isMatch: true, distance };
            }
            return { isMatch: false, distance, error: "Wajah tidak cocok dengan data referensi." };
        } catch (err) {
            console.error(`Error comparing face for user ${user.name}:`, err.message);
            return { isMatch: false, error: "Terjadi kesalahan teknis saat membandingkan wajah." };
        }
    }

    // fallback kept for compatibility
    async compareFaces(referencePath, incomingPath) {
        try {
            const desc1 = await this.getFaceDescriptor(referencePath);
            if (!desc1) return { isMatch: false, error: "Tidak ditemukan wajah referensi" };
            const desc2 = await this.getFaceDescriptor(incomingPath);
            if (!desc2) return { isMatch: false, error: "Tidak ditemukan wajah pada input" };

            const distance = faceapi.euclideanDistance(desc1, desc2);
            return { isMatch: distance < 0.45, distance };
        } catch (error) {
            return { isMatch: false, error: error.message };
        }
    }
}

export default new FaceRecognitionService();
