import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL;

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/trending`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/discover`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/made-in-uganda`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/radio`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/premium`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  const [artists, songs, albums] = await Promise.all([
    db.artist.findMany({
      where: { verificationStatus: "approved" },
      select: { id: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    db.song.findMany({
      where: { approved: true, published: true },
      select: { id: true, updatedAt: true },
      orderBy: { createdAt: "desc" },
    }),
    db.album.findMany({
      where: { approved: true, published: true },
      select: { id: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const artistEntries: MetadataRoute.Sitemap = artists.map((a) => ({
    url: `${base}/artist/${a.id}`,
    lastModified: a.createdAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const songEntries: MetadataRoute.Sitemap = songs.map((s) => ({
    url: `${base}/song/${s.id}`,
    lastModified: s.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const albumEntries: MetadataRoute.Sitemap = albums.map((a) => ({
    url: `${base}/album/${a.id}`,
    lastModified: a.createdAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticPages, ...artistEntries, ...songEntries, ...albumEntries];
}
