export {};
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  const artists = await db.artist.findMany({
    where: { artistName: null },
    include: { user: { select: { name: true } } },
  });

  const usedNames = new Set<string>();

  for (const artist of artists) {
    let name = (artist.user?.name || `Artist_${artist.id.slice(0, 8)}`).trim();
    let finalName = name;
    let counter = 1;
    while (usedNames.has(finalName.toLowerCase())) {
      finalName = `${name} ${counter}`;
      counter++;
    }
    usedNames.add(finalName.toLowerCase());

    await db.artist.update({
      where: { id: artist.id },
      data: { artistName: finalName },
    });
  }

  console.log(`Migrated ${artists.length} artists.`);
  await db.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
