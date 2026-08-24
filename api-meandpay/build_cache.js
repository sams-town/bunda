import { PrismaClient } from '@prisma/client';
import faceService from './src/services/FaceRecognitionService.js';

const prisma = new PrismaClient();

async function buildCache() {
    console.log("Mulai membangun disk cache...");
    const users = await prisma.users.findMany({
        where: { foto_face_recognition: { not: null } }
    });
    console.log(`Ditemukan ${users.length} user dengan foto wajah.`);
    
    for (const user of users) {
        if (!user.foto_face_recognition) continue;
        console.log(`Memproses user ${user.name}...`);
        await faceService.getUserDescriptor(user);
    }
    
    // Tunggu saveDiskCache (ada setTimeout 100ms di kode)
    setTimeout(() => {
        console.log("SELESAI! Cache berhasil dibangun dan disimpan ke disk.");
        process.exit(0);
    }, 2000);
}

buildCache().catch(console.error);
