import * as FileSystem from "expo-file-system/legacy";

const DOWNLOAD_DIR = FileSystem.documentDirectory + "downloads/";

export type DownloadMeta = {
  songId: string;
  title: string;
  artist: string;
  coverUrl?: string;
  duration: number;
  size: number;
  downloadedAt: string;
};

function filePath(songId: string) {
  return DOWNLOAD_DIR + songId + ".mp3";
}

function metaPath(songId: string) {
  return DOWNLOAD_DIR + songId + ".json";
}

async function ensureDir() {
  try { await FileSystem.makeDirectoryAsync(DOWNLOAD_DIR, { intermediates: true }); } catch {}
}

/** Returns the local file URI for a downloaded song, or null if not downloaded. */
export async function getLocalUri(songId: string): Promise<string | null> {
  try {
    const info = await FileSystem.getInfoAsync(filePath(songId));
    return info.exists ? filePath(songId) : null;
  } catch { return null; }
}

export async function hasDownload(songId: string): Promise<boolean> {
  return (await getLocalUri(songId)) != null;
}

/** Download a song's audio to local storage (resumable + progress). */
export async function downloadSong(
  songId: string,
  url: string,
  meta: DownloadMeta,
  onProgress?: (pct: number) => void
): Promise<string> {
  await ensureDir();
  const dest = filePath(songId);

  // Remove any partial previous file.
  await FileSystem.deleteAsync(dest, { idempotent: true });

  const resumable = FileSystem.createDownloadResumable(
    url,
    dest,
    {},
    (p) => {
      const total = p.totalBytesExpectedToWrite;
      if (total > 0) onProgress?.(p.totalBytesWritten / total);
    }
  );

  const result = await resumable.downloadAsync();
  if (!result || result.status !== 200) {
    throw new Error("Download failed (HTTP " + (result?.status ?? "unknown") + ")");
  }

  // Persist metadata alongside the audio file.
  await FileSystem.writeAsStringAsync(metaPath(songId), JSON.stringify(meta));
  return dest;
}

/** Remove a local download (does not touch the platform song/analytics). */
export async function removeDownload(songId: string) {
  await FileSystem.deleteAsync(filePath(songId), { idempotent: true });
  await FileSystem.deleteAsync(metaPath(songId), { idempotent: true });
}

export async function removeAllDownloads() {
  await FileSystem.deleteAsync(DOWNLOAD_DIR, { idempotent: true });
}

/** List all locally downloaded songs (from persisted metadata). */
export async function listDownloads(): Promise<DownloadMeta[]> {
  await ensureDir();
  let files: string[] = [];
  try { files = await FileSystem.readDirectoryAsync(DOWNLOAD_DIR); } catch { return []; }

  const metas: DownloadMeta[] = [];
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    try {
      const content = await FileSystem.readAsStringAsync(DOWNLOAD_DIR + f);
      const m = JSON.parse(content);
      if (m?.songId) metas.push(m);
    } catch {}
  }
  return metas;
}

/** Total bytes used by downloaded audio. */
export async function totalDownloadSize(): Promise<number> {
  const metas = await listDownloads();
  return metas.reduce((s, m) => s + (m.size || 0), 0);
}
