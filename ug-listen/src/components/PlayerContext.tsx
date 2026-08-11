import { createContext, useContext, ReactNode } from "react";
import { useAudioPlayer } from "../hooks/useAudioPlayer";

const PlayerContext = createContext<ReturnType<typeof useAudioPlayer> | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audio = useAudioPlayer();
  return <PlayerContext.Provider value={audio}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
