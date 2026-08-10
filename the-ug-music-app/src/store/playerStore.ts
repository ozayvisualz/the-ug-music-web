import { create } from "zustand";

export interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration: number;
  coverUrl?: string;
}

interface QueueState {
  queue: Track[];
  currentIndex: number;
  addToQueue: (tracks: Track[]) => void;
  setQueue: (tracks: Track[]) => void;
  playNext: (track: Track) => void;
  next: () => Track | null;
  prev: () => Track | null;
  clear: () => void;
}

export const useQueueStore = create<QueueState>((set, get) => ({
  queue: [],
  currentIndex: -1,
  addToQueue: (tracks) =>
    set((s) => ({ queue: [...s.queue, ...tracks] })),
  setQueue: (tracks) => set({ queue: tracks, currentIndex: 0 }),
  playNext: (track) =>
    set((s) => {
      const newQueue = [...s.queue];
      newQueue.splice(s.currentIndex + 1, 0, track);
      return { queue: newQueue };
    }),
  next: () => {
    const { queue, currentIndex } = get();
    const nextIdx = currentIndex + 1;
    if (nextIdx >= queue.length) return null;
    set({ currentIndex: nextIdx });
    return queue[nextIdx];
  },
  prev: () => {
    const { queue, currentIndex } = get();
    const prevIdx = currentIndex - 1;
    if (prevIdx < 0) return null;
    set({ currentIndex: prevIdx });
    return queue[prevIdx];
  },
  clear: () => set({ queue: [], currentIndex: -1 }),
}));
