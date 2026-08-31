import { execFile } from "child_process";
import { promisify } from "util";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import { uploadFile, downloadFile, fileExists } from "../minio";
import { SITE_URL } from "../seo";

const execFileAsync = promisify(execFile);

const CACHE_PREFIX = "downloads";
const BRAND = "TheUgMusic";

export function sanitizeFilename(name: string): string {
  return (name || "")
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildDownloadFilename(title: string, artist: string): string {
  return `${sanitizeFilename(`${title} - ${artist}`) || "song"}.mp3`;
}

export type EnrichableSong = {
  id: string;
  title: string;
  genre?: string | null;
  releaseDate?: string | null;
  fileUrl?: string | null;
  coverUrl?: string | null;
  artist?: { artistName?: string | null; user?: { name?: string | null } } | null;
  album?: { title?: string | null; releaseDate?: Date | null } | null;
};

function artistName(song: EnrichableSong): string {
  return song.artist?.artistName || song.artist?.user?.name || "Unknown Artist";
}

function releaseYear(song: EnrichableSong): string {
  if (song.releaseDate) {
    const m = song.releaseDate.match(/(19|20)\d{2}/);
    if (m) return m[0];
  }
  if (song.album?.releaseDate) {
    const y = new Date(song.album.releaseDate).getFullYear();
    if (!Number.isNaN(y)) return String(y);
  }
  return "";
}

async function generateEnriched(song: EnrichableSong): Promise<Buffer> {
  if (!song.fileUrl) throw new Error("Audio file not available");

  const tmpDir = os.tmpdir();
  const inPath = path.join(tmpDir, `dl_${Date.now()}_${song.id}.mp3`);
  const outPath = path.join(tmpDir, `dl_out_${Date.now()}_${song.id}.mp3`);
  let coverPath: string | null = null;

  try {
    const audioRes = await fetch(song.fileUrl);
    if (!audioRes.ok) throw new Error("Failed to fetch audio file");
    fs.writeFileSync(inPath, Buffer.from(await audioRes.arrayBuffer()));

    if (song.coverUrl) {
      try {
        const coverRes = await fetch(song.coverUrl);
        if (coverRes.ok) {
          const ct = coverRes.headers.get("content-type") || "";
          const ext = ct.includes("png") ? ".png" : ".jpg";
          coverPath = path.join(tmpDir, `dl_cover_${Date.now()}_${song.id}${ext}`);
          fs.writeFileSync(coverPath, Buffer.from(await coverRes.arrayBuffer()));
        }
      } catch {
        coverPath = null;
      }
    }

    const artist = artistName(song);
    const year = releaseYear(song);

    const args = ["-y", "-i", inPath];
    if (coverPath) {
      args.push("-i", coverPath, "-map", "0:a", "-map", "1:v", "-c:v", "copy", "-disposition:v:0", "attached_pic");
    }
    args.push("-c:a", "copy", "-id3v2_version", "3");

    const meta: [string, string][] = [
      ["title", song.title],
      ["artist", artist],
      ["album_artist", artist],
      ["publisher", BRAND],
      ["comment", `${BRAND} - ${SITE_URL}`],
    ];
    if (song.album?.title) meta.push(["album", song.album.title]);
    if (song.genre) meta.push(["genre", song.genre]);
    if (year) meta.push(["date", year]);

    for (const [k, v] of meta) args.push("-metadata", `${k}=${v}`);

    args.push(outPath);

    await execFileAsync("ffmpeg", args, { timeout: 120000, maxBuffer: 10 * 1024 * 1024 });

    return fs.readFileSync(outPath);
  } finally {
    for (const p of [inPath, outPath, coverPath]) {
      if (p) { try { fs.rmSync(p, { force: true }); } catch {} }
    }
  }
}

/**
 * Return a metadata-enriched MP3 for a song, cached in MinIO so each song is
 * only processed once. Falls back to generating on-demand if caching fails.
 */
export async function getOrCreateEnrichedDownload(song: EnrichableSong): Promise<Buffer> {
  const cacheKey = `${CACHE_PREFIX}/${song.id}.mp3`;

  try {
    if (await fileExists(cacheKey)) {
      const cached = await downloadFile(cacheKey);
      if (cached && cached.length > 0) return cached;
    }
  } catch {}

  try {
    const buffer = await generateEnriched(song);
    if (buffer && buffer.length > 0) {
      try { await uploadFile(cacheKey, buffer, "audio/mpeg"); } catch {}
    }
    return buffer;
  } catch {
    // Fallback: metadata embedding unavailable (e.g. no ffmpeg) — return the
    // original audio unchanged so downloads still succeed.
    if (song.fileUrl) {
      const res = await fetch(song.fileUrl);
      if (res.ok) return Buffer.from(await res.arrayBuffer());
    }
    throw new Error("Audio file not available");
  }
}
