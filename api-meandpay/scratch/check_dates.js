import prisma from "./src/config/prisma.js";

async function check() {
  const user = await prisma.users.findFirst({
    where: { NOT: { tgl_lahir: null } }
  });
  console.log("User tgl_lahir:", user ? user.tgl_lahir : "None found");
  console.log("User tgl_join:", user ? user.tgl_join : "None found");
  process.exit(0);
}

check();
