import { create } from "zustand";

export type Track = {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration: number;
  coverUrl?: string;
};

type QueueState = {
  queue: Track[];
  currentIndex: number;
  addToQueue: (tracks: Track[]) => void;
  setQueue: (tracks: Track[]) => void;
  playNext: (track: Track) => void;
  next: () => Track | null;
  prev: () => Track | null;
  clear: () => void;
};

export const useQueueStore = create<QueueState>((set, get) => ({
  queue: [],
  currentIndex: -1,

  addToQueue: (tracks) =>
    set((state) => ({ queue: [...state.queue, ...tracks] })),

  setQueue: (tracks) =>
    set({ queue: tracks, currentIndex: 0 }),

  playNext: (track) =>
    set((state) => {
      const before = state.queue.slice(0, state.currentIndex + 1);
      const after = state.queue.slice(state.currentIndex + 1);
      return {
        queue: [...before, track, ...after],
        currentIndex: state.currentIndex + 1,
      };
    }),

  next: () => {
    const { queue, currentIndex } = get();
    if (currentIndex < queue.length - 1) {
      set({ currentIndex: currentIndex + 1 });
      return queue[currentIndex + 1];
    }
    return null;
  },

  prev: () => {
    const { queue, currentIndex } = get();
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1 });
      return queue[currentIndex - 1];
    }
    return null;
  },

  clear: () => set({ queue: [], currentIndex: -1 }),
}));
