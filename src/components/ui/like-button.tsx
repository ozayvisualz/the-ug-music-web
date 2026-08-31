"use client";

import { useEffect } from "react";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";
import { useAuth } from "@/lib/client-auth";
import { useLikedStore } from "@/store/likedStore";

let likedLoadStarted = false;

export function LikeButton({ songId, className, iconClassName = "w-4 h-4" }: { songId: string; className?: string; iconClassName?: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const liked = useLikedStore((s) => s.likedIds.has(songId));
  const likeMutation = trpc.social.likeSong.useMutation();

  useEffect(() => {
    if (!user) {
      likedLoadStarted = false;
      return;
    }
    if (likedLoadStarted) return;
    likedLoadStarted = true;
    utils.social.getLikedIds
      .fetch()
      .then((ids) => useLikedStore.getState().setLikedIds(ids))
      .catch(() => {
        likedLoadStarted = false;
      });
  }, [user, utils]);

  const handleToggle = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    useLikedStore.getState().toggleLiked(songId);
    likeMutation
      .mutateAsync(songId)
      .then((result: any) => {
        if (result && typeof result.liked === "boolean") {
          const next = new Set(useLikedStore.getState().likedIds);
          if (result.liked) next.add(songId);
          else next.delete(songId);
          useLikedStore.setState({ likedIds: next, loaded: true });
        }
      })
      .catch(() => {
        useLikedStore.getState().toggleLiked(songId);
      });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={liked ? "Unlike" : "Like"}
      aria-label={liked ? "Unlike" : "Like"}
      className={className || "p-2 rounded-md text-zinc-500 hover:text-yellow-500 hover:bg-zinc-800/70 transition"}
    >
      <Heart className={liked ? `${iconClassName} text-yellow-500` : iconClassName} fill={liked ? "currentColor" : "none"} />
    </button>
  );
}
