import { create } from "zustand";

export type Track = {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration: number;
  coverUrl?: string;
  artistId?: string;
  albumId?: string;
};

type QueueState = {
  queue: Track[];
  currentIndex: number;
  shuffle: boolean;
  repeat: number; // 0 = off, 1 = all, 2 = one
  setQueue: (tracks: Track[]) => void;
  addToQueue: (tracks: Track[]) => void;
  playNext: (track: Track) => void;
  next: () => Track | null;
  prev: () => Track | null;
  clear: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => number;
  removeFromQueue: (index: number) => void;
  reorderQueue: (from: number, to: number) => void;
  jumpTo: (index: number) => void;
};

export const useQueueStore = create<QueueState>((set, get) => ({
  queue: [],
  currentIndex: -1,
  shuffle: false,
  repeat: 0,

  setQueue: (tracks) => set({ queue: tracks, currentIndex: 0 }),

  addToQueue: (tracks) =>
    set((state) => ({ queue: [...state.queue, ...tracks] })),

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
    const { queue, currentIndex, shuffle, repeat } = get();
    if (queue.length === 0) return null;
    if (shuffle && repeat !== 2) {
      const remaining = queue.map((_, i) => i).filter((i) => i !== currentIndex);
      if (remaining.length === 0) return null;
      const randomIdx = remaining[Math.floor(Math.random() * remaining.length)];
      set({ currentIndex: randomIdx });
      return queue[randomIdx];
    }
    if (repeat === 2) return queue[currentIndex];
    if (currentIndex < queue.length - 1) {
      set({ currentIndex: currentIndex + 1 });
      return queue[currentIndex + 1];
    }
    if (repeat === 1) {
      set({ currentIndex: 0 });
      return queue[0];
    }
    return null;
  },

  prev: () => {
    const { queue, currentIndex } = get();
    if (queue.length === 0) return null;
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1 });
      return queue[currentIndex - 1];
    }
    return null;
  },

  clear: () => set({ queue: [], currentIndex: -1 }),

  toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),

  cycleRepeat: () => {
    const nextRepeat = (get().repeat + 1) % 3;
    set({ repeat: nextRepeat });
    return nextRepeat;
  },

  removeFromQueue: (index) =>
    set((state) => {
      const queue = state.queue.filter((_, i) => i !== index);
      let currentIndex = state.currentIndex;
      if (index < state.currentIndex) currentIndex--;
      else if (index === state.currentIndex) currentIndex = Math.min(currentIndex, queue.length - 1);
      return { queue, currentIndex };
    }),

  reorderQueue: (from, to) =>
    set((state) => {
      const queue = [...state.queue];
      const [moved] = queue.splice(from, 1);
      queue.splice(to, 0, moved);
      return { queue };
    }),

  jumpTo: (index) => set({ currentIndex: index }),
}));
