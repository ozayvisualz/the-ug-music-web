export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(" ");
}

export function formatUGX(amount: number): string {
  return `UGX ${Math.round(amount).toLocaleString("en-UG")}`;
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function generateRef(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
    }
  }
  return "just now";
}

export function getArtistName(artist: any): string {
  if (!artist) return "Unknown Artist";
  return artist.artistName || artist.user?.name || "Unknown Artist";
}

export function getDisplayArtist(song: any): string {
  const primary = getArtistName(song?.artist);
  const featured = song?.featuredArtist ? getArtistName(song.featuredArtist) : null;
  return featured ? `${primary} feat. ${featured}` : primary;
}

export function artistHref(artist: any, fallbackId?: string): string {
  const slug = artist?.slug;
  const id = artist?.id || fallbackId;
  return `/artist/${slug || id || ""}`;
}

export const GENRES = [
  "Afrobeat",
  "Dancehall",
  "Reggae",
  "Kadongo Kamu",
  "Kidandali",
  "Gospel",
  "Bongo Flava",
  "Lugaflow",
  "R&B",
  "Pop",
  "Traditional",
  "Instrumental",
  "Other",
] as const;
