import { db } from "./db";
import { SITE_DESCRIPTION, DEFAULT_SOCIAL_IMAGE } from "./seo";

export type SeoSettings = {
  title: string;
  description: string;
  keywords: string[];
  socialImage: string;
  noindex: boolean;
};

const DEFAULTS: SeoSettings = {
  title: "TheUgMusic – Stream & Download Ugandan Music",
  description: SITE_DESCRIPTION,
  keywords: [
    "Ugandan music",
    "Uganda music",
    "Ugandan artists",
    "stream Ugandan music",
    "download Ugandan songs",
    "Afrobeats",
    "Dancehall",
    "Lugaflow",
    "Gospel music",
    "Made in Uganda",
  ],
  socialImage: DEFAULT_SOCIAL_IMAGE,
  noindex: false,
};

const KEYS = {
  title: "seo_title",
  description: "seo_description",
  keywords: "seo_keywords",
  socialImage: "seo_social_image",
  noindex: "seo_noindex",
} as const;

let cache: { data: SeoSettings; at: number } | null = null;
const TTL_MS = 60_000;

export async function getSeoSettings(): Promise<SeoSettings> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data;
  try {
    const rows = await db.siteSetting.findMany();
    const map = new Map(rows.map((r) => [r.key, r.value]));
    const keywords = (map.get(KEYS.keywords) || "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    const data: SeoSettings = {
      title: map.get(KEYS.title)?.trim() || DEFAULTS.title,
      description: map.get(KEYS.description)?.trim() || DEFAULTS.description,
      keywords: keywords.length ? keywords : DEFAULTS.keywords,
      socialImage: map.get(KEYS.socialImage)?.trim() || DEFAULTS.socialImage,
      noindex: (map.get(KEYS.noindex) || "").toLowerCase() === "true",
    };
    cache = { data, at: Date.now() };
    return data;
  } catch {
    return cache?.data ?? DEFAULTS;
  }
}

export async function updateSeoSettings(input: Partial<SeoSettings>): Promise<SeoSettings> {
  const entries: [string, string][] = [];
  if (typeof input.title === "string") entries.push([KEYS.title, input.title]);
  if (typeof input.description === "string") entries.push([KEYS.description, input.description]);
  if (Array.isArray(input.keywords)) entries.push([KEYS.keywords, input.keywords.join(",")]);
  if (typeof input.socialImage === "string") entries.push([KEYS.socialImage, input.socialImage]);
  if (typeof input.noindex === "boolean") entries.push([KEYS.noindex, String(input.noindex)]);

  for (const [key, value] of entries) {
    await db.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }
  cache = null;
  return getSeoSettings();
}
