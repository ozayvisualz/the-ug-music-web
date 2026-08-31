import { db } from "../db";

export const SearchEngine = {
  async searchAll(query: string, limit = 20) {
    if (!query || query.length < 2) return { songs: [], artists: [], albums: [] };

    const [songs, artists, albums] = await Promise.all([
      db.song.findMany({
        where: {
          approved: true,
          OR: [{ title: { contains: query, mode: "insensitive" } }],
        },
        include: { artist: { include: { user: { select: { name: true, image: true } } } } },
        take: limit,
        orderBy: { playCount: "desc" },
      }),
      db.artist.findMany({
        where: {
          user: { name: { contains: query, mode: "insensitive" } },
        },
        include: { user: { select: { name: true, image: true } } },
        take: limit,
      }),
      db.album.findMany({
        where: { approved: true, title: { contains: query, mode: "insensitive" } },
        include: { artist: { include: { user: { select: { name: true } } } } },
        take: limit,
      }),
    ]);

    return { songs, artists, albums };
  },

  async autocomplete(query: string): Promise<string[]> {
    if (!query || query.length < 2) return [];

    const songs = await db.song.findMany({
      where: { approved: true, title: { contains: query, mode: "insensitive" } },
      select: { title: true },
      take: 8,
    });
    const artists = await db.artist.findMany({
      where: {
        OR: [
          { artistName: { contains: query, mode: "insensitive" } },
          { user: { name: { contains: query, mode: "insensitive" } } },
        ],
      },
      select: { artistName: true, user: { select: { name: true } } },
      take: 4,
    });

    const results = new Set<string>();
    songs.forEach((s) => results.add(s.title));
    artists.forEach((a) => results.add(a.artistName || a.user?.name || ""));
    return Array.from(results).slice(0, 10);
  },

  async getTrendingSearches(): Promise<string[]> {
    const [topArtists, topSongs] = await Promise.all([
      db.artist.findMany({
        orderBy: { totalStreams: "desc" },
        take: 5,
        include: { user: { select: { name: true } } },
      }),
      db.song.findMany({
        where: { approved: true },
        orderBy: { playCount: "desc" },
        take: 5,
        select: { title: true },
      }),
    ]);
    const names = new Set<string>();
    topArtists.forEach((a) => { if (a.artistName || a.user?.name) names.add(a.artistName || a.user?.name || ""); });
    topSongs.forEach((s) => { if (s.title) names.add(s.title); });
    return Array.from(names).slice(0, 8);
  },

  async searchByGenre(genre: string, limit = 50) {
    return db.song.findMany({
      where: { approved: true, genre: { contains: genre, mode: "insensitive" } },
      include: { artist: { include: { user: { select: { name: true, image: true } } } } },
      orderBy: { playCount: "desc" },
      take: limit,
    });
  },
};
