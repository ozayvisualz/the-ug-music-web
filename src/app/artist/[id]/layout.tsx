import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
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

const getArtist = cache(async (id: string) =>
  db.artist.findUnique({
    where: { id },
    include: { user: { select: { name: true, image: true } } },
  })
);

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
  const url = absoluteUrl(`/artist/${artist.id}`);

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

  const name = artist.artistName || artist.user?.name || "Artist";
  const approved = artist.verificationStatus === "approved";

  const jsonLd = approved
    ? [
        breadcrumbJsonLd([
          { name: "Home", url: absoluteUrl("/") },
          { name: "Artists", url: absoluteUrl("/search") },
          { name, url: absoluteUrl(`/artist/${artist.id}`) },
        ]),
        musicGroupJsonLd(artist),
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
