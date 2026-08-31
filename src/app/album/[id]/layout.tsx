import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import {
  albumTitle,
  absoluteUrl,
  DEFAULT_SOCIAL_IMAGE,
  breadcrumbJsonLd,
  musicAlbumJsonLd,
  jsonLdScript,
} from "@/lib/seo";

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

const getAlbum = cache(async (id: string) =>
  db.album.findUnique({
    where: { id },
    include: { artist: { include: { user: { select: { name: true } } } } },
  })
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const album = await getAlbum(id);
  if (!album) return {};

  const artistName = album.artist?.artistName || album.artist?.user?.name || "Unknown Artist";
  const approved = album.approved && album.published;
  const description = album.description || `${album.title} by ${artistName} — stream on TheUgMusic.`;
  const image = album.coverUrl || DEFAULT_SOCIAL_IMAGE;
  const url = absoluteUrl(`/album/${album.id}`);

  return {
    title: { absolute: albumTitle(album.title, artistName) },
    description,
    alternates: { canonical: url },
    robots: approved ? undefined : { index: false, follow: false },
    openGraph: {
      type: "music.album",
      url,
      siteName: "TheUgMusic",
      title: `${album.title} – ${artistName}`,
      description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: `${album.title} – ${artistName}`,
      description,
      images: [image],
    },
  };
}

export default async function AlbumLayout({ children, params }: Props) {
  const { id } = await params;
  const album = await getAlbum(id);
  if (!album) notFound();

  const artistName = album.artist?.artistName || album.artist?.user?.name || "Unknown Artist";
  const approved = album.approved && album.published;

  const jsonLd = approved
    ? [
        breadcrumbJsonLd([
          { name: "Home", url: absoluteUrl("/") },
          { name: artistName, url: absoluteUrl(`/artist/${album.artistId}`) },
          { name: album.title, url: absoluteUrl(`/album/${album.id}`) },
        ]),
        musicAlbumJsonLd({
          id: album.id,
          title: album.title,
          artistName,
          artistId: album.artistId,
          coverUrl: album.coverUrl,
          releaseDate: album.releaseDate,
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
