"use client";
import { trpc } from "@/trpc/client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/client-auth";
import { User, Save } from "lucide-react";
import toast from "react-hot-toast";
import { GENRES } from "@/lib/utils";

export default function ArtistProfilePage() {
  const { user } = useAuth();
  const { data: me } = trpc.auth.me.useQuery();
  const updateMut = trpc.artist.updateArtistProfile.useMutation({ onSuccess: () => toast.success("Profile updated") });
  const [bio, setBio] = useState("");
  const [genre, setGenre] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => { if (me?.artist) { setBio(me.artist.bio || ""); setGenre(me.artist.genre || ""); setLocation(me.artist.location || ""); } }, [me]);

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-white">Profile</h1>
      <div className="flex items-center gap-4 p-6 bg-[#18181D] border border-zinc-800/60 rounded-xl">
        <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center text-2xl font-bold text-yellow-500">{user?.name?.charAt(0) || "?"}</div>
        <div><p className="text-lg font-bold text-white">{user?.name}</p><p className="text-sm text-zinc-400">{user?.email}</p></div>
      </div>
      <div className="space-y-4 bg-[#18181D] border border-zinc-800/60 rounded-xl p-6">
        <div><label className="block text-sm text-zinc-400 mb-1">Bio</label><textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50 resize-none" placeholder="Tell listeners about yourself..."/></div>
        <div><label className="block text-sm text-zinc-400 mb-1">Genre</label><select value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/50"><option value="">Select genre</option>{GENRES.map(g=><option key={g} value={g}>{g}</option>)}</select></div>
        <div><label className="block text-sm text-zinc-400 mb-1">Location</label><input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Kampala, Uganda" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50"/></div>
        <button onClick={() => updateMut.mutate({ bio: bio || undefined, genre: genre || undefined, location: location || undefined })} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-yellow-500 text-black font-semibold text-sm hover:bg-yellow-400"><Save className="w-4 h-4"/> Save Changes</button>
      </div>
    </div>
  );
}
