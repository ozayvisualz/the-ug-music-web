const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const db = new PrismaClient();
const hash = bcrypt.hashSync('test123', 12);
async function seed() {
  await db.user.upsert({ where: { email: 'ovcwrld@gmail.com' }, update: { role: 'ARTIST' }, create: { name: 'OVCWRLD', email: 'ovcwrld@gmail.com', password: hash, role: 'ARTIST', artist: { create: {} } } });
  const a = await db.artist.findFirst({ where: { user: { email: 'ovcwrld@gmail.com' } } });
  if (a) await db.artistWallet.upsert({ where: { artistId: a.id }, update: {}, create: { artistId: a.id, availableBalance: 50000, lifetimeEarnings: 50000 } });
  console.log('Done');
  process.exit(0);
}
seed().catch(e => { console.error(e.message); process.exit(1); });
