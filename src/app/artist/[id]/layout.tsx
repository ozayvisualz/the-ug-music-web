import { cache } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ensureSlug } from "@/lib/slugs";
import {
  artistTitle,
  absoluteUrl,
  DEFAULT_SOCIAL_IMAGE,
  breadcrumbJsonLd,
  musicGroupJsonLd,
  jsonLdScript,
} from "@/lib/seo";

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

const getArtist = cache(async (handle: string) => {
  const include = { user: { select: { name: true, image: true } } };
  const bySlug = await db.artist.findUnique({ where: { slug: handle }, include });
  if (bySlug) return bySlug;
  const byId = await db.artist.findUnique({ where: { id: handle }, include });
  if (!byId) return null;
  if (!byId.slug) {
    const name = byId.artistName || byId.user?.name || "Artist";
    const slug = await ensureSlug("artist", byId.id, name);
    await db.artist.update({ where: { id: byId.id }, data: { slug } }).catch(() => {});
    return { ...byId, slug };
  }
  return byId;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const artist = await getArtist(id);
  if (!artist) return {};

  const name = artist.artistName || artist.user?.name || "Artist";
  const approved = artist.verificationStatus === "approved";
  const description =
    artist.bio ||
    `${name} is a Ugandan artist on TheUgMusic. Stream, download and discover their music.`;
  const image = artist.photoUrl || artist.user?.image || DEFAULT_SOCIAL_IMAGE;
  const url = absoluteUrl(`/artist/${artist.slug || artist.id}`);

  return {
    title: artistTitle(name),
    description,
    alternates: { canonical: url },
    robots: approved ? undefined : { index: false, follow: false },
    openGraph: {
      type: "profile",
      url,
      siteName: "TheUgMusic",
      title: artistTitle(name),
      description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: artistTitle(name),
      description,
      images: [image],
    },
  };
}

export default async function ArtistLayout({ children, params }: Props) {
  const { id } = await params;
  const artist = await getArtist(id);
  if (!artist) notFound();

  // Redirect legacy ID-based URLs to the canonical slug URL.
  if (artist.slug && id !== artist.slug) {
    permanentRedirect(`/artist/${artist.slug}`);
  }

  const name = artist.artistName || artist.user?.name || "Artist";
  const approved = artist.verificationStatus === "approved";
  const url = absoluteUrl(`/artist/${artist.slug || artist.id}`);

  const jsonLd = approved
    ? [
        breadcrumbJsonLd([
          { name: "Home", url: absoluteUrl("/") },
          { name: "Artists", url: absoluteUrl("/search") },
          { name, url },
        ]),
        musicGroupJsonLd({ ...artist, id: artist.slug || artist.id }),
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
