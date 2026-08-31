import { create } from "zustand";

interface LikedState {
  likedIds: Set<string>;
  loaded: boolean;
  setLikedIds: (ids: string[]) => void;
  toggleLiked: (id: string) => void;
}

export const useLikedStore = create<LikedState>((set) => ({
  likedIds: new Set<string>(),
  loaded: false,
  setLikedIds: (ids) => set({ likedIds: new Set(ids), loaded: true }),
  toggleLiked: (id) =>
    set((s) => {
      const next = new Set(s.likedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { likedIds: next };
    }),
}));
