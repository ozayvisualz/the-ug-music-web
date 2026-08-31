import type { Metadata } from "next";

// ---------------------------------------------------------------------------
// Site configuration (single source of truth for SEO identity)
// ---------------------------------------------------------------------------

export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://theugmusic.com").replace(/\/+$/, "");
export const SITE_NAME = "TheUgMusic";
export const SITE_DESCRIPTION =
  "Discover, stream and download the best Ugandan music. Support local artists on TheUgMusic.";
export const DEFAULT_SOCIAL_IMAGE = `${SITE_URL}/icon.svg`;

export function absoluteUrl(path = ""): string {
  if (!path) return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

// ---------------------------------------------------------------------------
// Slug generation (reliable, Unicode-safe, keeps existing IDs intact)
// ---------------------------------------------------------------------------

/**
 * Convert an arbitrary name into a clean, URL-safe slug.
 * Handles spaces, apostrophes, special characters, Luganda/Ugandan names,
 * diacritics and repeated separators. Never throws.
 */
export function slugify(input: string | null | undefined): string {
  return String(input ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining diacritics
    .toLowerCase()
    .trim()
    .replace(/['’`´]/g, "") // remove apostrophes
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---------------------------------------------------------------------------
// Title helpers (used with the root title template "%s | TheUgMusic")
// ---------------------------------------------------------------------------

export function artistTitle(name: string): string {
  return `${name} – Songs, Music & Artist Profile`;
}

export function songTitle(title: string, artist: string): string {
  return `${title} – ${artist} | Listen on TheUgMusic`;
}

export function albumTitle(title: string, artist: string): string {
  return `${title} – ${artist} | Album on TheUgMusic`;
}

// ---------------------------------------------------------------------------
// JSON-LD structured data builders (real database content only)
// ---------------------------------------------------------------------------

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/icon.svg"),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function musicGroupJsonLd(artist: {
  id: string;
  artistName?: string | null;
  user?: { name?: string | null } | null;
  genre?: string | null;
  photoUrl?: string | null;
  location?: string | null;
}) {
  const name = artist.artistName || artist.user?.name || "Artist";
  const url = absoluteUrl(`/artist/${artist.id}`);
  return {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    "@id": url,
    name,
    url,
    ...(artist.genre ? { genre: artist.genre } : {}),
    ...(artist.photoUrl ? { image: artist.photoUrl } : {}),
    ...(artist.location ? { location: { "@type": "Place", name: artist.location } } : {}),
  };
}

export function musicRecordingJsonLd(song: {
  id: string;
  title: string;
  artistName: string;
  artistId?: string | null;
  coverUrl?: string | null;
  duration?: number | null;
  albumTitle?: string | null;
}) {
  const url = absoluteUrl(`/song/${song.id}`);
  return {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    "@id": url,
    name: song.title,
    url,
    byArtist: {
      "@type": "MusicGroup",
      name: song.artistName,
      ...(song.artistId
        ? { "@id": absoluteUrl(`/artist/${song.artistId}`), url: absoluteUrl(`/artist/${song.artistId}`) }
        : {}),
    },
    ...(song.coverUrl ? { image: song.coverUrl } : {}),
    ...(song.duration ? { duration: `PT${song.duration}S` } : {}),
    ...(song.albumTitle ? { inAlbum: { "@type": "MusicAlbum", name: song.albumTitle } } : {}),
  };
}

export function musicAlbumJsonLd(album: {
  id: string;
  title: string;
  artistName: string;
  artistId?: string | null;
  coverUrl?: string | null;
  releaseDate?: Date | null;
}) {
  const url = absoluteUrl(`/album/${album.id}`);
  return {
    "@context": "https://schema.org",
    "@type": "MusicAlbum",
    "@id": url,
    name: album.title,
    url,
    byArtist: {
      "@type": "MusicGroup",
      name: album.artistName,
      ...(album.artistId
        ? { "@id": absoluteUrl(`/artist/${album.artistId}`), url: absoluteUrl(`/artist/${album.artistId}`) }
        : {}),
    },
    ...(album.coverUrl ? { image: album.coverUrl } : {}),
    ...(album.releaseDate ? { datePublished: new Date(album.releaseDate).toISOString() } : {}),
  };
}

// ---------------------------------------------------------------------------
// JSON-LD render helper (server components only)
// ---------------------------------------------------------------------------

export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

// ---------------------------------------------------------------------------
// Shared default metadata for public listing pages
// ---------------------------------------------------------------------------

export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
}): Metadata {
  const url = absoluteUrl(opts.path);
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    robots: opts.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: SITE_NAME,
      type: "website",
      images: [DEFAULT_SOCIAL_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      images: [DEFAULT_SOCIAL_IMAGE],
    },
  };
}
