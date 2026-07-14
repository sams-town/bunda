import prisma from "./src/config/prisma.js";

async function main() {
  const permissions = await prisma.permissions.findMany({
    orderBy: { name: 'asc' }
  });
  console.log(JSON.stringify(permissions.map(p => p.name), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
