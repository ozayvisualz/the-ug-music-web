import { create } from "zustand";

type LikedState = {
  likedIds: Set<string>;
  setLikedIds: (ids: string[]) => void;
  toggleLiked: (songId: string) => void;
  clearLiked: () => void;
};

export const useLikedStore = create<LikedState>((set) => ({
  likedIds: new Set<string>(),

  setLikedIds: (ids) => set({ likedIds: new Set(ids) }),

  toggleLiked: (songId) =>
    set((state) => {
      const next = new Set(state.likedIds);
      if (next.has(songId)) next.delete(songId);
      else next.add(songId);
      return { likedIds: next };
    }),

  clearLiked: () => set({ likedIds: new Set<string>() }),
}));

export function isLiked(songId: string): boolean {
  return useLikedStore.getState().likedIds.has(songId);
}
