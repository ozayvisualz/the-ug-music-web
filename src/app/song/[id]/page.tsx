"use client";

import { trpc } from "@/trpc/client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Download, Send, Loader2 } from "lucide-react";
import { formatDuration, getArtistName, getDisplayArtist, artistHref, formatBytes } from "@/lib/utils";
import { slugify } from "@/lib/seo";
import { usePlayerStore } from "@/store/player";
import { useDownload } from "@/lib/use-download";
import { WebPlayer } from "@/components/layout/player";

export default function SongPage() {
  const params = useParams<{ id: string }>();
  const songId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { data: song, isLoading } = trpc.music.getById.useQuery(songId);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const { setCurrentSong, setQueue, setRadioContext, currentSong, isPlaying, togglePlay } = usePlayerStore();
  const { state: dlState, download: handleDownload, progress, receivedBytes, totalBytes, cancel } = useDownload(songId || "", song?.title, { artist: song ? getDisplayArtist(song) : undefined, coverUrl: (song as any)?.coverUrl || (song as any)?.album?.coverUrl });

  const handlePlay = () => {
    if (!song) return;
    const isActive = currentSong?.id === song.id;
    if (isActive) {
      togglePlay();
      return;
    }
    setRadioContext(null);
    const track = {
      id: song.id,
      title: song.title,
      artist: getDisplayArtist(song),
      coverUrl: song.coverUrl || song.album?.coverUrl || undefined,
      hlsUrl: song.hlsUrl || undefined,
      fileUrl: song.fileUrl || undefined,
      duration: song.duration,
      artistId: (song as any).artistId,
    };
    setCurrentSong(track);
    setQueue([track]);
  };

  useEffect(() => {
    if (!songId) return;
    fetch(`/api/mobile/comments?songId=${encodeURIComponent(songId)}`)
      .then((r) => r.json())
      .then((d) => setComments(Array.isArray(d) ? d : []))
      .catch(() => setComments([]));
  }, [songId]);

  const handlePost = async () => {
    if (!commentText.trim() || posting) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/mobile/comments?action=add&songId=${encodeURIComponent(songId)}&content=${encodeURIComponent(commentText.trim())}`, { credentials: "include" });
      const data = await res.json();
      if (res.ok && data.comment) {
        setComments((c) => [data.comment, ...c]);
        setCommentText("");
      }
    } catch {} finally { setPosting(false); }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!song) return <div className="text-center py-20 text-zinc-500">Song not found</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 pt-8 pb-20 space-y-4">
      <nav aria-label="Breadcrumb" className="text-xs text-zinc-500">
        <ol className="flex items-center gap-1.5 flex-wrap">
          <li><Link href="/" className="hover:text-yellow-500">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href={artistHref(song.artist, (song as any).artistId)} className="hover:text-yellow-500">{getArtistName(song.artist)}</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-zinc-300">{song.title}</li>
        </ol>
      </nav>
      <div className="text-center space-y-4">
        <div className="w-48 h-48 mx-auto rounded-2xl bg-yellow-500/10 flex items-center justify-center text-6xl overflow-hidden">
          {(song as any).coverUrl ? <img src={(song as any).coverUrl} alt={`${song.title} by ${getArtistName(song.artist)} cover artwork`} className="w-full h-full object-cover" /> : <span>🎵</span>}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold break-words px-2">{song.title}</h1>
        <div className="text-zinc-400">
          <Link href={artistHref(song.artist, (song as any).artistId)} className="hover:text-yellow-500 transition">{getArtistName(song.artist)}</Link>
          {song.featuredArtist && (
            <span className="text-zinc-500"> feat. <Link href={artistHref(song.featuredArtist, (song as any).featuredArtistId)} className="hover:text-yellow-500 transition">{getArtistName(song.featuredArtist)}</Link></span>
          )}
        </div>
        <div className="flex items-center justify-center gap-4 text-sm text-zinc-500">
          {(song as any).genre ? (
            <Link href={`/genre/${slugify((song as any).genre)}`} className="hover:text-yellow-500 transition">{(song as any).genre}</Link>
          ) : null}
          <span>{formatDuration((song as any).duration || 0)}</span>
          <span>{(song as any).playCount || 0} plays</span>
        </div>
        <div className="flex justify-center gap-3">
          <button onClick={handlePlay} className="px-6 py-2.5 rounded-full bg-yellow-500 text-black font-semibold text-sm hover:bg-yellow-400">{currentSong?.id === song.id && isPlaying ? "Pause" : "Play"}</button>
          <button
            onClick={dlState === "downloading" ? cancel : handleDownload}
            disabled={dlState === "completing"}
            className="px-6 py-2.5 rounded-full bg-zinc-800 text-white font-semibold text-sm hover:bg-zinc-700 disabled:opacity-50"
          >
            {dlState === "downloading" ? (
              <><Loader2 className="w-4 h-4 inline mr-1 animate-spin"/>Downloading… {progress != null ? `${progress}%` : ""}{totalBytes != null ? ` · ${formatBytes(receivedBytes)} / ${formatBytes(totalBytes)}` : ""}</>
            ) : dlState === "completing" ? (
              <><Loader2 className="w-4 h-4 inline mr-1 animate-spin"/>Finalizing…</>
            ) : dlState === "downloaded" ? (
              "Downloaded ✓"
            ) : dlState === "error" ? (
              <><Download className="w-4 h-4 inline mr-1"/>Download failed · Retry</>
            ) : (
              <><Download className="w-4 h-4 inline mr-1"/>Download</>
            )}
          </button>
        </div>
      </div>

      {(song as any).lyrics && (
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="font-bold mb-3">Lyrics</h2>
          <p className="text-zinc-400 text-sm whitespace-pre-line">{(song as any).lyrics}</p>
        </section>
      )}

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="font-bold mb-4">Comments ({comments.length})</h2>
        <div className="space-y-3 mb-4">
          {comments.length ? comments.map((c: any) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center text-xs font-bold text-yellow-500 flex-shrink-0">{(c.userName || "U").charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><span className="text-sm font-semibold">{c.userName || "Unknown"}</span><span className="text-xs text-zinc-600">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ""}</span></div>
                <p className="text-sm text-zinc-400">{c.content}</p>
              </div>
            </div>
          )) : <p className="text-zinc-600 text-sm">No comments yet. Be the first to comment!</p>}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePost()}
            placeholder="Add a comment..."
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-full px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50"
          />
          <button onClick={handlePost} disabled={posting || !commentText.trim()} className="px-4 py-2.5 rounded-full bg-yellow-500 text-black font-semibold text-sm hover:bg-yellow-400 disabled:opacity-50 flex items-center gap-1">
            {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </section>
      <WebPlayer />
    </div>
  );
}
