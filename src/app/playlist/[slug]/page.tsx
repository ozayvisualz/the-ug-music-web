import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { ensureSlug } from "@/lib/slugs";
import {
  absoluteUrl,
  SITE_NAME,
  DEFAULT_SOCIAL_IMAGE,
  breadcrumbJsonLd,
  musicPlaylistJsonLd,
  jsonLdScript,
} from "@/lib/seo";
import { getArtistName } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

const include = {
  songs: {
    orderBy: { position: "asc" as const },
    include: {
      song: {
        include: {
          artist: { include: { user: { select: { name: true } } } },
          album: { select: { id: true, title: true, coverUrl: true } },
        },
      },
    },
  },
};

const getPlaylist = cache(async (handle: string) => {
  const bySlug = await db.playlist.findUnique({ where: { slug: handle }, include });
  if (bySlug) return bySlug;
  const byId = await db.playlist.findUnique({ where: { id: handle }, include });
  if (!byId) return null;
  if (!byId.slug) {
    const slug = await ensureSlug("playlist", byId.id, byId.title);
    await db.playlist.update({ where: { id: byId.id }, data: { slug } }).catch(() => {});
    return { ...byId, slug };
  }
  return byId;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const playlist = await getPlaylist(slug);
  if (!playlist || !playlist.isPublic) return {};

  const url = absoluteUrl(`/playlist/${playlist.slug || playlist.id}`);
  const description = `Listen to the "${playlist.title}" playlist on TheUgMusic.`;
  const image = playlist.coverUrl || DEFAULT_SOCIAL_IMAGE;

  return {
    title: { absolute: `${playlist.title} | Playlist on TheUgMusic` },
    description,
    alternates: { canonical: url },
    openGraph: {
      title: playlist.title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      images: [image],
    },
    twitter: { card: "summary_large_image", title: playlist.title, description, images: [image] },
  };
}

export default async function PlaylistPage({ params }: Props) {
  const { slug } = await params;
  const playlist = await getPlaylist(slug);
  if (!playlist || !playlist.isPublic) notFound();

  const songs = playlist.songs.map((ps: any) => ps.song).filter(Boolean);
  const url = absoluteUrl(`/playlist/${playlist.slug || playlist.id}`);

  const jsonLd = [
    breadcrumbJsonLd([
      { name: "Home", url: absoluteUrl("/") },
      { name: playlist.title, url },
    ]),
    musicPlaylistJsonLd({
      id: playlist.id,
      title: playlist.title,
      numTracks: songs.length,
      trackIds: songs.map((s: any) => s.id),
    }),
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 pt-8 pb-24 space-y-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <div>
        <p className="text-xs font-bold text-zinc-500 uppercase">Playlist</p>
        <h1 className="text-2xl sm:text-3xl font-bold mt-1 break-words">{playlist.title}</h1>
        <p className="text-sm text-zinc-400 mt-1">{songs.length} songs</p>
      </div>
      <div className="space-y-1">
        {songs.map((s: any, i: number) => (
          <Link
            key={s.id}
            href={`/song/${s.slug || s.id}`}
            className="flex items-center gap-4 p-3 hover:bg-zinc-800/50 rounded-xl transition"
          >
            <span className="text-xs text-zinc-600 w-6 text-center">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{s.title}</p>
              <p className="text-xs text-zinc-500 truncate">{getArtistName(s.artist)}</p>
            </div>
            <span className="text-xs text-zinc-600">
              {s.duration ? `${Math.floor(s.duration / 60)}:${(s.duration % 60).toString().padStart(2, "0")}` : ""}
            </span>
          </Link>
        ))}
        {songs.length === 0 && <p className="text-zinc-600 text-sm py-8 text-center">This playlist is empty.</p>}
      </div>
    </div>
  );
}
