"use client";

import { trpc } from "@/trpc/client";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Image, Loader2, Check, ShieldCheck } from "lucide-react";
import { GENRES } from "@/lib/utils";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { storage } from "@/lib/firebase";

type Step = "form" | "confirm" | "uploading" | "done";

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
    lyrics: "",
    moods: [] as string[],
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [audioProgress, setAudioProgress] = useState(0);
  const [coverProgress, setCoverProgress] = useState(0);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const uploadSongMut = trpc.artist.uploadSong.useMutation({
    onSuccess: () => {
      setStep("done");
      toast.success("Song submitted for review!");
    },
    onError: (e: any) => {
      setStep("confirm");
      toast.error("Failed to create song: " + (e?.message || "Unknown error"));
    },
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

  const uploadFile = (file: File, onProgress: (p: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
      const ext = file.name.split(".").pop() || "bin";
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const path = `uploads/${id}.${ext}`;
      const task = storage.ref().child(path).put(file);

      task.on(
        "state_changed",
        (snap: any) => {
          const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
          onProgress(pct);
        },
        (err: any) => reject(err),
        async () => {
          try {
            const url = await task.snapshot!.ref.getDownloadURL();
            resolve(url);
          } catch (e) {
            reject(e);
          }
        }
      );
    });
  };

  const handlePublish = () => {
    if (!form.title.trim()) { toast.error("Please enter a title"); return; }
    if (!audioFile) { toast.error("Please select an audio file"); return; }
    setStep("confirm");
  };

  const handleConfirm = async () => {
    setStep("uploading");
    setAudioProgress(0);
    setCoverProgress(0);

    try {
      const audioEl = document.createElement("audio");
      audioEl.src = URL.createObjectURL(audioFile!);
      await new Promise<void>((resolve) => {
        audioEl.onloadedmetadata = () => resolve();
        audioEl.onerror = () => resolve();
      });
      const duration = Math.round(audioEl.duration) || 180;

      setUploadingAudio(true);
      const fileUrl = await uploadFile(audioFile!, setAudioProgress);
      setUploadingAudio(false);

      let coverUrl = "";
      if (coverFile) {
        setUploadingCover(true);
        coverUrl = await uploadFile(coverFile!, setCoverProgress);
        setUploadingCover(false);
      }

      await uploadSongMut.mutateAsync({
        title: form.title,
        genre: form.genre || undefined,
        description: form.description || undefined,
        duration,
        fileUrl,
        coverUrl: coverUrl || undefined,
        price: form.price,
        story: form.story || undefined,
        releaseDate: form.releaseDate || undefined,
        songwriters: form.songwriters || undefined,
        producer: form.producer || undefined,
        beatProducer: form.beatProducer || undefined,
        videoUrl: form.videoUrl || undefined,
        lyrics: form.lyrics || undefined,
        moods: form.moods.length > 0 ? JSON.stringify(form.moods) : undefined,
      });
    } catch (e: any) {
      if (e?.code === "storage/canceled") return;
      setStep("confirm");
      toast.error("Upload failed: " + (e?.message || "Unknown error"));
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upload Music</h1>
        <p className="text-sm text-zinc-400">Share your music with the world</p>
      </div>

      {step === "form" && (
        <form onSubmit={(e) => { e.preventDefault(); handlePublish(); }} className="space-y-6">
          <div {...getAudioProps()} className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
            audioFile ? "border-green-500/50 bg-green-500/5" : "border-zinc-700 hover:border-yellow-500/50"
          }`}>
            <input {...getAudioInput()} />
            {audioFile ? (
              <div className="space-y-2">
                <Check className="w-10 h-10 text-green-500 mx-auto" />
                <p className="font-medium">{audioFile.name}</p>
                <p className="text-sm text-zinc-500">{(audioFile.size / 1048576).toFixed(2)} MB</p>
                {audioPreview && <audio controls src={audioPreview} className="mx-auto mt-2" />}
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-10 h-10 text-zinc-600 mx-auto" />
                <p className="font-medium">Drop audio file here</p>
                <p className="text-sm text-zinc-500">MP3, WAV, M4A, FLAC</p>
              </div>
            )}
          </div>

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
            <div className="md:col-span-2 border-t border-zinc-800 pt-4 mt-2">
              <h3 className="text-sm font-semibold text-yellow-500 mb-3">Song Moods</h3>
              <p className="text-xs text-zinc-500 mb-3">Select up to 5 moods that match this song</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "chill-relax", emoji: "😌", label: "Chill & Relax" },
                  { id: "party-time", emoji: "🎉", label: "Party Time" },
                  { id: "love-songs", emoji: "💕", label: "Love Songs" },
                  { id: "workout", emoji: "💪", label: "Workout" },
                  { id: "road-trip", emoji: "🚗", label: "Road Trip" },
                  { id: "late-night", emoji: "🌙", label: "Late Night" },
                  { id: "morning-vibes", emoji: "🌅", label: "Morning Vibes" },
                  { id: "study-focus", emoji: "📚", label: "Study & Focus" },
                  { id: "dancehall-energy", emoji: "🔥", label: "Dancehall Energy" },
                  { id: "afrobeat-vibes", emoji: "🎶", label: "Afrobeat Vibes" },
                  { id: "gospel-worship", emoji: "🙏", label: "Gospel Worship" },
                  { id: "lugaflow-heat", emoji: "🥁", label: "Lugaflow Heat" },
                  { id: "amapiano-groove", emoji: "🕺", label: "Amapiano Groove" },
                  { id: "emotional", emoji: "🥺", label: "Emotional" },
                  { id: "romantic", emoji: "🌹", label: "Romantic" },
                  { id: "inspirational", emoji: "✨", label: "Inspirational" },
                  { id: "happy", emoji: "😊", label: "Happy" },
                  { id: "sad", emoji: "💔", label: "Sad" },
                  { id: "motivational", emoji: "🚀", label: "Motivational" },
                  { id: "street-vibes", emoji: "🏙️", label: "Street Vibes" },
                  { id: "celebration", emoji: "🎊", label: "Celebration" },
                  { id: "cultural", emoji: "🏛️", label: "Cultural" },
                  { id: "acoustic", emoji: "🎸", label: "Acoustic" },
                  { id: "rnb", emoji: "🎤", label: "R&B" },
                  { id: "reggae", emoji: "🟡", label: "Reggae" },
                  { id: "soul", emoji: "🎷", label: "Soul" },
                  { id: "jazz", emoji: "🎹", label: "Jazz" },
                  { id: "instrumental", emoji: "🎻", label: "Instrumental" },
                ].map((mood) => (
                  <button
                    key={mood.id}
                    type="button"
                    onClick={() => setForm((f) => ({
                      ...f,
                      moods: f.moods.includes(mood.id) ? f.moods.filter((m) => m !== mood.id) : f.moods.length < 5 ? [...f.moods, mood.id] : f.moods,
                    }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${form.moods.includes(mood.id) ? "bg-yellow-500 text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
                  >
                    {mood.emoji} {mood.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 border-t border-zinc-800 pt-4 mt-2">
              <h3 className="text-sm font-semibold text-yellow-500 mb-3">Behind the Song</h3>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-zinc-400 mb-1.5">Story</label>
              <textarea value={form.story} onChange={(e) => setForm({ ...form, story: e.target.value })}
                rows={3} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition resize-none"
                placeholder="The story behind this song..." />
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
                placeholder="Beat producer name" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-zinc-400 mb-1.5">Songwriters / Producers</label>
              <input type="text" value={form.songwriters} onChange={(e) => setForm({ ...form, songwriters: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition"
                placeholder="Name the songwriters" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Music Producer</label>
              <input type="text" value={form.producer} onChange={(e) => setForm({ ...form, producer: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition"
                placeholder="Music producer name" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Music Video URL</label>
              <input type="text" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition"
                placeholder="YouTube link (optional)" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-zinc-400 mb-1.5">Lyrics (optional)</label>
              <textarea value={form.lyrics} onChange={(e) => setForm({ ...form, lyrics: e.target.value })}
                rows={4} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition resize-none"
                placeholder="Add song lyrics..." />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => router.back()} className="px-6 py-2.5 rounded-xl border border-zinc-700 hover:bg-zinc-800 transition text-sm">
              Cancel
            </button>
            <button type="submit" disabled={!audioFile || !form.title} className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 disabled:opacity-50 transition text-sm">
              <Upload className="w-4 h-4" />
              Publish Song
            </button>
          </div>
        </form>
      )}

      {step === "confirm" && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111115] border border-zinc-700/60 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-yellow-500" />
                Confirm Your Submission
              </h2>
              <p className="text-sm text-zinc-400">Review the details below before publishing. Your song will be reviewed by our team before going live.</p>

              <div className="space-y-2 bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-4">
                <div className="flex justify-between text-sm"><span className="text-zinc-500">Title</span><span className="text-white font-medium">{form.title}</span></div>
                {form.genre && <div className="flex justify-between text-sm"><span className="text-zinc-500">Genre</span><span className="text-white">{form.genre}</span></div>}
                <div className="flex justify-between text-sm"><span className="text-zinc-500">Price</span><span className="text-white">UGX {form.price.toLocaleString()}</span></div>
                {form.releaseDate && <div className="flex justify-between text-sm"><span className="text-zinc-500">Release Date</span><span className="text-white">{form.releaseDate}</span></div>}
                {audioFile && <div className="flex justify-between text-sm"><span className="text-zinc-500">Audio File</span><span className="text-white truncate max-w-[200px]">{audioFile.name}</span></div>}
                {coverFile && <div className="flex justify-between text-sm"><span className="text-zinc-500">Cover Art</span><span className="text-white truncate max-w-[200px]">{coverFile.name}</span></div>}
                {form.description && <div className="text-sm"><span className="text-zinc-500">Description</span><p className="text-white mt-1">{form.description}</p></div>}
                {form.songwriters && <div className="flex justify-between text-sm"><span className="text-zinc-500">Songwriters</span><span className="text-white">{form.songwriters}</span></div>}
                {form.producer && <div className="flex justify-between text-sm"><span className="text-zinc-500">Producer</span><span className="text-white">{form.producer}</span></div>}
                {form.beatProducer && <div className="flex justify-between text-sm"><span className="text-zinc-500">Beat Producer</span><span className="text-white">{form.beatProducer}</span></div>}
                {form.videoUrl && <div className="flex justify-between text-sm"><span className="text-zinc-500">Video URL</span><span className="text-white truncate max-w-[200px]">{form.videoUrl}</span></div>}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep("form")} className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition">
                  Edit
                </button>
                <button onClick={handleConfirm} className="flex-1 py-2.5 rounded-xl bg-yellow-500 text-black font-bold text-sm hover:bg-yellow-400 transition">
                  Confirm & Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === "uploading" && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111115] border border-zinc-700/60 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 space-y-5">
              <div className="text-center">
                <Loader2 className="w-10 h-10 text-yellow-500 animate-spin mx-auto mb-2" />
                <h2 className="text-lg font-bold text-white">Uploading Your Song</h2>
                <p className="text-xs text-zinc-500">Please wait while we upload your files...</p>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">{uploadingAudio ? "Uploading audio..." : audioProgress === 100 ? "Audio uploaded" : "Audio file"}</span>
                  <span className="text-zinc-500">{audioProgress}%</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full transition-all duration-300" style={{ width: `${audioProgress}%` }} />
                </div>
              </div>

              {coverFile && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">{uploadingCover ? "Uploading cover..." : coverProgress === 100 ? "Cover uploaded" : "Cover art"}</span>
                    <span className="text-zinc-500">{coverProgress}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-yellow-500 rounded-full transition-all duration-300" style={{ width: `${coverProgress}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111115] border border-zinc-700/60 rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="p-6 space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Submitted for Review!</h2>
                <p className="text-sm text-zinc-400 mt-1">Your song &quot;{form.title}&quot; has been uploaded and is pending approval. Our team will review it shortly.</p>
              </div>
              <div className="flex items-center justify-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl py-2.5 px-4">
                <ShieldCheck className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                <span className="text-xs text-yellow-500 font-medium">Pending Approval</span>
              </div>
              <button
                onClick={() => router.push("/artist/music")}
                className="w-full py-3 rounded-xl bg-yellow-500 text-black font-bold text-sm hover:bg-yellow-400 transition"
              >
                Okay — View My Music
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
