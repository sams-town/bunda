import { PrismaClient } from '@prisma/client'
// Force restart after prisma generate

// Global BigInt serialization fix
BigInt.prototype.toJSON = function() {
  return this.toString();
};

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
    log: ['query', 'info', 'warn', 'error'],
})

process.on('beforeExit', async () => {
    await prisma.$disconnect()
})

export default prisma