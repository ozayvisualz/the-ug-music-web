import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ensureSlug } from "@/lib/slugs";
import {
  songTitle,
  absoluteUrl,
  DEFAULT_SOCIAL_IMAGE,
  breadcrumbJsonLd,
  musicRecordingJsonLd,
  jsonLdScript,
} from "@/lib/seo";

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

const getSong = cache(async (handle: string) => {
  const include = {
    artist: { include: { user: { select: { name: true } } } },
    album: { select: { title: true } },
  };
  const bySlug = await db.song.findUnique({ where: { slug: handle }, include });
  if (bySlug) return bySlug;
  const byId = await db.song.findUnique({ where: { id: handle }, include });
  if (!byId) return null;
  if (!byId.slug) {
    const slug = await ensureSlug("song", byId.id, byId.title);
    await db.song.update({ where: { id: byId.id }, data: { slug } }).catch(() => {});
    return { ...byId, slug };
  }
  return byId;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const song = await getSong(id);
  if (!song) return {};

  const artistName = song.artist?.artistName || song.artist?.user?.name || "Unknown Artist";
  const approved = song.approved && song.published;
  const description = song.description || `Listen to ${song.title} by ${artistName} on TheUgMusic.`;
  const image = song.coverUrl || DEFAULT_SOCIAL_IMAGE;
  const url = absoluteUrl(`/song/${song.slug || song.id}`);

  return {
    title: { absolute: songTitle(song.title, artistName) },
    description,
    alternates: { canonical: url },
    robots: approved ? undefined : { index: false, follow: false },
    openGraph: {
      type: "music.song",
      url,
      siteName: "TheUgMusic",
      title: `${song.title} – ${artistName}`,
      description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: `${song.title} – ${artistName}`,
      description,
      images: [image],
    },
  };
}

export default async function SongLayout({ children, params }: Props) {
  const { id } = await params;
  const song = await getSong(id);
  if (!song) notFound();

  const artistName = song.artist?.artistName || song.artist?.user?.name || "Unknown Artist";
  const approved = song.approved && song.published;
  const url = absoluteUrl(`/song/${song.slug || song.id}`);

  const jsonLd = approved
    ? [
        breadcrumbJsonLd([
          { name: "Home", url: absoluteUrl("/") },
          { name: artistName, url: absoluteUrl(`/artist/${song.artistId}`) },
          { name: song.title, url },
        ]),
        musicRecordingJsonLd({
          id: song.id,
          title: song.title,
          artistName,
          artistId: song.artistId,
          coverUrl: song.coverUrl,
          duration: song.duration,
          albumTitle: song.album?.title,
        }),
      ]
    : null;

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      )}
      {children}
    </>
  );
}
