const { PrismaClient } = require("@prisma/client");
const { randomBytes } = require("crypto");
const db = new PrismaClient();

function generateUserId(role) {
  const prefix = role === "ARTIST" ? "ART" : "LST";
  const hex = randomBytes(6).toString("hex").toUpperCase();
  return `${prefix}-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
}

async function main() {
  const users = await db.user.findMany({
    where: { userId: null },
    select: { id: true, role: true },
  });

  for (const user of users) {
    await db.user.update({
      where: { id: user.id },
      data: {
        userId: generateUserId(user.role),
        accountType: user.role === "ARTIST" ? "artist" : "listener",
      },
    });
  }

  console.log(`Migrated ${users.length} users with permanent IDs.`);
  await db.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
