import { create } from "zustand";

export type ActiveDownloadState = "downloading" | "completing";

export interface ActiveDownload {
  songId: string;
  title: string;
  artist?: string;
  coverUrl?: string;
  state: ActiveDownloadState;
  progress: number | null;
  receivedBytes: number;
  totalBytes: number | null;
  cancel: () => void;
}

interface DownloadStoreState {
  active: Record<string, ActiveDownload>;
  upsert: (d: ActiveDownload) => void;
  remove: (songId: string) => void;
}

export const useDownloadStore = create<DownloadStoreState>((set) => ({
  active: {},
  upsert: (d) => set((s) => ({ active: { ...s.active, [d.songId]: d } })),
  remove: (songId) =>
    set((s) => {
      if (!s.active[songId]) return s;
      const next = { ...s.active };
      delete next[songId];
      return { active: next };
    }),
}));
