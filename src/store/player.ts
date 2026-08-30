import { create } from "zustand";

interface Song {
  id: string;
  title: string;
  artist: string;
  coverUrl?: string;
  hlsUrl?: string;
  fileUrl?: string;
  duration: number;
}

export interface RadioContext {
  stationId: string;
  title: string;
}

interface PlayerState {
  currentSong: Song | null;
  queue: Song[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isPremium: boolean;
  radioContext: RadioContext | null;

  setCurrentSong: (song: Song) => void;
  setQueue: (songs: Song[]) => void;
  addToQueue: (song: Song) => void;
  playNext: () => void;
  playPrevious: () => void;
  togglePlay: () => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setIsPremium: (premium: boolean) => void;
  setRadioContext: (ctx: RadioContext | null) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  queue: [],
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,
  isPremium: false,
  radioContext: null,

  setCurrentSong: (song) => set({ currentSong: song, isPlaying: true, currentTime: 0 }),
  setQueue: (songs) => set({ queue: songs }),
  addToQueue: (song) => set((s) => ({ queue: [...s.queue, song] })),
  playNext: () => {
    const { queue, currentSong } = get();
    const idx = queue.findIndex((s) => s.id === currentSong?.id);
    if (idx < queue.length - 1) {
      set({ currentSong: queue[idx + 1], isPlaying: true, currentTime: 0 });
    }
  },
  playPrevious: () => {
    const { queue, currentSong } = get();
    const idx = queue.findIndex((s) => s.id === currentSong?.id);
    if (idx > 0) {
      set({ currentSong: queue[idx - 1], isPlaying: true, currentTime: 0 });
    } else if (get().currentTime > 3) {
      set({ currentTime: 0 });
    }
  },
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume, isMuted: false }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  setIsPremium: (premium) => set({ isPremium: premium }),
  setRadioContext: (ctx) => set({ radioContext: ctx }),
}));
