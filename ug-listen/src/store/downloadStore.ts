import { create } from "zustand";
import * as downloadService from "../lib/downloads";
import type { DownloadMeta } from "../lib/downloads";

type DownloadStatus = "not_downloaded" | "downloading" | "downloaded" | "failed";

type DownloadStore = {
  downloaded: Record<string, DownloadMeta>;
  statuses: Record<string, DownloadStatus>;
  progress: Record<string, number>;
  loaded: boolean;
  load: () => Promise<void>;
  download: (songId: string, url: string, meta: DownloadMeta, onProgress?: (pct: number) => void) => Promise<void>;
  remove: (songId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  status: (songId: string) => DownloadStatus;
  localUri: (songId: string) => Promise<string | null>;
};

export const useDownloadStore = create<DownloadStore>((set, get) => ({
  downloaded: {},
  statuses: {},
  progress: {},
  loaded: false,

  load: async () => {
    const metas = await downloadService.listDownloads();
    const downloaded: Record<string, DownloadMeta> = {};
    const statuses: Record<string, DownloadStatus> = {};
    for (const m of metas) {
      downloaded[m.songId] = m;
      statuses[m.songId] = "downloaded";
    }
    set({ downloaded, statuses, loaded: true });
  },

  download: async (songId, url, meta, onProgress) => {
    set((s) => ({ statuses: { ...s.statuses, [songId]: "downloading" }, progress: { ...s.progress, [songId]: 0 } }));
    try {
      await downloadService.downloadSong(songId, url, meta, (pct) => {
        set((s) => ({ progress: { ...s.progress, [songId]: pct } }));
        onProgress?.(pct);
      });
      set((s) => ({
        statuses: { ...s.statuses, [songId]: "downloaded" },
        downloaded: { ...s.downloaded, [songId]: meta },
        progress: { ...s.progress, [songId]: 1 },
      }));
    } catch (e) {
      set((s) => ({ statuses: { ...s.statuses, [songId]: "failed" } }));
      throw e;
    }
  },

  remove: async (songId) => {
    set((s) => ({ statuses: { ...s.statuses, [songId]: "not_downloaded" } }));
    await downloadService.removeDownload(songId);
    const d = { ...get().downloaded };
    delete d[songId];
    set({ downloaded: d });
  },

  clearAll: async () => {
    await downloadService.removeAllDownloads();
    set({ downloaded: {}, statuses: {}, progress: {} });
  },

  status: (songId) => get().statuses[songId] || "not_downloaded",

  localUri: (songId) => downloadService.getLocalUri(songId),
}));
