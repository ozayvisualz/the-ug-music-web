const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  const artist = await prisma.user.findFirst({ where: { role: 'ARTIST' } });
  if (!artist) { console.log('No artist found. Register an artist user first.'); return; }

  const artistProfile = await prisma.artist.findUnique({ where: { userId: artist.id } });
  if (!artistProfile) { console.log('No artist profile found.'); return; }

  const songs = [
    { title: 'Sitya Loss', genre: 'Dancehall', duration: 235, playCount: 12500, price: 2000 },
    { title: 'Sweet Sensation', genre: 'Afrobeat', duration: 210, playCount: 9800, price: 1500 },
    { title: 'Pull Up', genre: 'Afrobeat', duration: 245, playCount: 6500, price: 2000 },
    { title: 'Bango', genre: 'Dancehall', duration: 215, playCount: 8900, price: 2000 },
    { title: 'Onkosa', genre: 'R&B', duration: 220, playCount: 5200, price: 1500 },
    { title: 'Ndi Mu Love', genre: 'Afrobeat', duration: 225, playCount: 7200, price: 2000 },
    { title: 'Yoya', genre: 'Lugaflow', duration: 240, playCount: 3100, price: 1500 },
    { title: 'Mbulira', genre: 'Lugaflow', duration: 230, playCount: 4900, price: 1500 },
  ];

  for (const s of songs) {
    await prisma.song.create({
      data: {
        ...s,
        artistId: artistProfile.id,
        approved: true,
        published: true,
      },
    });
  }
  console.log(`Seeded ${songs.length} songs for artist ${artist.name}`);
}

seed().then(() => prisma.$disconnect()).catch((e) => { console.error(e); prisma.$disconnect(); });
