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
  startPosition?: number;
};

export type RadioContext = {
  stationId: string;
  title: string;
};

const HISTORY_LIMIT = 10;

type QueueState = {
  queue: Track[];
  currentIndex: number;
  shuffle: boolean;
  repeat: number; // 0 = off, 1 = all, 2 = one
  history: string[]; // recently played song IDs (most recent first)
  radioContext: RadioContext | null;
  setQueue: (tracks: Track[], index?: number) => void;
  setRadioContext: (ctx: RadioContext | null) => void;
  addToQueue: (tracks: Track[]) => void;
  playNext: (track: Track) => void;
  next: () => Track | null;
  prev: () => Track | null;
  clear: () => void;
  toggleShuffle: () => void;
  setShuffle: (shuffle: boolean) => void;
  cycleRepeat: () => number;
  setRepeat: (repeat: number) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (from: number, to: number) => void;
  jumpTo: (index: number) => void;
};

export const useQueueStore = create<QueueState>((set, get) => ({
  queue: [],
  currentIndex: -1,
  shuffle: false,
  repeat: 0,
  history: [],
  radioContext: null,

  setQueue: (tracks, index = 0) => {
    const i = Math.max(-1, Math.min(index, tracks.length - 1));
    set({
      queue: tracks,
      currentIndex: i,
      history: i >= 0 && tracks[i] ? [tracks[i].id] : [],
      radioContext: null,
    });
  },

  addToQueue: (tracks) =>
    set((state) => ({ queue: [...state.queue, ...tracks] })),

  playNext: (track) =>
    set((state) => {
      const before = state.queue.slice(0, state.currentIndex + 1);
      const after = state.queue.slice(state.currentIndex + 1);
      return {
        queue: [...before, track, ...after],
        currentIndex: state.currentIndex + 1,
        history: [track.id, ...state.history].slice(0, HISTORY_LIMIT),
      };
    }),

  next: () => {
    const { queue, currentIndex, shuffle, repeat, history } = get();
    if (queue.length === 0) return null;

    if (shuffle && repeat !== 2) {
      // Avoid immediately replaying the most recent songs.
      const recent = history.slice(0, 3);
      let remaining = queue
        .map((_, i) => i)
        .filter((i) => i !== currentIndex && !recent.includes(queue[i].id));
      if (remaining.length === 0) {
        remaining = queue.map((_, i) => i).filter((i) => i !== currentIndex);
      }
      if (remaining.length === 0) return null;
      const randomIdx = remaining[Math.floor(Math.random() * remaining.length)];
      set({ currentIndex: randomIdx, history: [queue[randomIdx].id, ...history].slice(0, HISTORY_LIMIT) });
      return queue[randomIdx];
    }

    if (currentIndex < queue.length - 1) {
      const nextIdx = currentIndex + 1;
      set({ currentIndex: nextIdx, history: [queue[nextIdx].id, ...history].slice(0, HISTORY_LIMIT) });
      return queue[nextIdx];
    }

    if (repeat === 1) {
      set({ currentIndex: 0, history: [queue[0].id, ...history].slice(0, HISTORY_LIMIT) });
      return queue[0];
    }

    return null;
  },

  prev: () => {
    const { queue, currentIndex, history } = get();
    if (queue.length === 0) return null;
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      set({ currentIndex: prevIdx, history: [queue[prevIdx].id, ...history].slice(0, HISTORY_LIMIT) });
      return queue[prevIdx];
    }
    return null;
  },

  clear: () => set({ queue: [], currentIndex: -1, history: [] }),

  toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),

  setShuffle: (shuffle) => set({ shuffle }),

  cycleRepeat: () => {
    const nextRepeat = (get().repeat + 1) % 3;
    set({ repeat: nextRepeat });
    return nextRepeat;
  },

  setRepeat: (repeat) => set({ repeat: Math.max(0, Math.min(2, repeat)) }),

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

  jumpTo: (index) =>
    set((state) => {
      const id = state.queue[index]?.id;
      return {
        currentIndex: index,
        history: id ? [id, ...state.history].slice(0, HISTORY_LIMIT) : state.history,
      };
    }),

  setRadioContext: (ctx) => set({ radioContext: ctx }),
}));
