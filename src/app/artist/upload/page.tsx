"use client";

import { trpc } from "@/trpc/client";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Music2, Image, Loader2, Check, X } from "lucide-react";
import { GENRES } from "@/lib/utils";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function UploadMusicPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    genre: "",
    description: "",
    price: 1000,
    coverUrl: "",
    story: "",
    releaseDate: "",
    songwriters: "",
    producer: "",
    beatProducer: "",
    videoUrl: "",
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [uploading, setUploading] = useState(false);

  const uploadSongMut = trpc.artist.uploadSong.useMutation({
    onSuccess: () => {
      toast.success("Song uploaded successfully!");
      router.push("/artist/dashboard");
    },
    onError: (e) => toast.error(e.message),
  });

  const onDropAudio = useCallback((accepted: File[]) => {
    const file = accepted[0];
    setAudioFile(file);
    setAudioPreview(URL.createObjectURL(file));
  }, []);

  const onDropCover = useCallback((accepted: File[]) => {
    const file = accepted[0];
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }, []);

  const { getRootProps: getAudioProps, getInputProps: getAudioInput } = useDropzone({
    onDrop: onDropAudio,
    accept: { "audio/*": [".mp3", ".wav", ".m4a", ".flac"] },
    maxFiles: 1,
  });

  const { getRootProps: getCoverProps, getInputProps: getCoverInput } = useDropzone({
    onDrop: onDropCover,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: 1,
  });

  const uploadFile = async (file: File): Promise<{ url: string; key: string; hlsUrl?: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile) { toast.error("Please select an audio file"); return; }
    setUploading(true);

    try {
      let coverUrl = "";
      if (coverFile) {
        const cover = await uploadFile(coverFile);
        coverUrl = cover.url;
      }

      const audio = await uploadFile(audioFile);

      const audioEl = document.createElement("audio");
      audioEl.src = URL.createObjectURL(audioFile);
      await new Promise<void>((resolve) => {
        audioEl.onloadedmetadata = () => resolve();
        audioEl.onerror = () => resolve();
      });

      const duration = Math.round(audioEl.duration || 0);

      await uploadSongMut.mutateAsync({
        title: form.title,
        genre: form.genre || undefined,
        description: form.description || undefined,
        duration,
        fileUrl: audio.url,
        hlsUrl: audio.hlsUrl || undefined,
        coverUrl: coverUrl || undefined,
        price: form.price,
        story: form.story || undefined,
        releaseDate: form.releaseDate || undefined,
        songwriters: form.songwriters || undefined,
        producer: form.producer || undefined,
        beatProducer: form.beatProducer || undefined,
        videoUrl: form.videoUrl || undefined,
      });
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upload Music</h1>
        <p className="text-sm text-zinc-400">Share your music with the world</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Audio Upload */}
        <div {...getAudioProps()} className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
          audioFile ? "border-green-500/50 bg-green-500/5" : "border-zinc-700 hover:border-yellow-500/50"
        }`}>
          <input {...getAudioInput()} />
          {audioFile ? (
            <div className="space-y-2">
              <Check className="w-10 h-10 text-green-500 mx-auto" />
              <p className="font-medium">{audioFile.name}</p>
              <p className="text-sm text-zinc-500">{(audioFile.size / (1024 * 1024)).toFixed(2)} MB</p>
              {audioPreview && <audio controls src={audioPreview} className="mx-auto mt-2" />}
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-10 h-10 text-zinc-600 mx-auto" />
              <p className="font-medium">Drop audio file here</p>
              <p className="text-sm text-zinc-500">MP3, WAV, M4A, FLAC up to 50MB</p>
            </div>
          )}
        </div>

        {/* Cover Image */}
        <div {...getCoverProps()} className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
          coverFile ? "border-green-500/50 bg-green-500/5" : "border-zinc-700 hover:border-yellow-500/50"
        }`}>
          <input {...getCoverInput()} />
          {coverFile ? (
            <div className="flex items-center gap-4">
              <img src={coverPreview} alt="" className="w-20 h-20 rounded-lg object-cover" />
              <div className="text-left">
                <p className="font-medium">{coverFile.name}</p>
                <p className="text-sm text-zinc-500">Cover art uploaded</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <Image className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-sm text-zinc-500">Drop cover art (optional)</p>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm text-zinc-400 mb-1.5">Title</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition"
              placeholder="Song title" required />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Genre</label>
            <select value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500">
              <option value="">Select genre</option>
              {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Price (UGX)</label>
            <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
              min={0} step={500}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-zinc-400 mb-1.5">Description (optional)</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition resize-none"
              placeholder="Tell listeners about this song..." />
          </div>

          {/* --- Behind the Song Fields --- */}
          <div className="md:col-span-2 border-t border-zinc-800 pt-4 mt-2">
            <h3 className="text-sm font-semibold text-yellow-500 mb-3">🎤 Behind the Song</h3>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-zinc-400 mb-1.5">Story</label>
            <textarea value={form.story} onChange={(e) => setForm({ ...form, story: e.target.value })}
              rows={3} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition resize-none"
              placeholder="The story behind this song — inspiration, recording process, meaning..." />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Release Date</label>
            <input type="text" value={form.releaseDate} onChange={(e) => setForm({ ...form, releaseDate: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition"
              placeholder="e.g. March 2025" />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Beat Producer</label>
            <input type="text" value={form.beatProducer} onChange={(e) => setForm({ ...form, beatProducer: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition"
              placeholder="e.g. T.O.N (The Order of Names)" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-zinc-400 mb-1.5">Songwriters & Producers</label>
            <input type="text" value={form.songwriters} onChange={(e) => setForm({ ...form, songwriters: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition"
              placeholder="Name the songwriters, e.g. Eddy Kenzo, Daddy Andre, Yesse Oman Rafiki" />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Music Producer</label>
            <input type="text" value={form.producer} onChange={(e) => setForm({ ...form, producer: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition"
              placeholder="e.g. Aethan Music" />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Music Video URL</label>
            <input type="text" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition"
              placeholder="YouTube link (optional)" />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => router.back()} className="px-6 py-2.5 rounded-xl border border-zinc-700 hover:bg-zinc-800 transition text-sm">
            Cancel
          </button>
          <button type="submit" disabled={uploading || !audioFile || !form.title} className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 disabled:opacity-50 transition text-sm">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? "Uploading..." : "Publish Song"}
          </button>
        </div>
      </form>
    </div>
  );
}
