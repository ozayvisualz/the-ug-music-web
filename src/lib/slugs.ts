import { db } from "./db";
import { slugify } from "./seo";

export type SlugKind = "artist" | "song" | "album";

async function slugExists(kind: SlugKind, slug: string, excludeId?: string) {
  const found =
    kind === "artist"
      ? await db.artist.findUnique({ where: { slug }, select: { id: true } })
      : kind === "song"
        ? await db.song.findUnique({ where: { slug }, select: { id: true } })
        : await db.album.findUnique({ where: { slug }, select: { id: true } });
  if (!found) return null;
  return excludeId && found.id === excludeId ? null : found;
}

/**
 * Derive a unique slug for an entity, de-duplicating against existing rows.
 * Falls back to a short id suffix on collision so slugs are always stable.
 */
export async function ensureSlug(kind: SlugKind, id: string, name: string): Promise<string> {
  const base = slugify(name) || kind;
  let slug = base;
  if (await slugExists(kind, slug, id)) {
    slug = `${base}-${id.slice(0, 8)}`;
    if (await slugExists(kind, slug, id)) slug = `${base}-${id}`;
  }
  return slug;
}
