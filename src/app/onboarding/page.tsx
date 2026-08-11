"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";

const MOODS = [
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
];

export default function MoodOnboarding() {
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const saveMut = trpc.auth.updateProfile.useMutation();

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleContinue = async () => {
    setSaving(true);
    try {
      await saveMut.mutateAsync({ preferredMoods: JSON.stringify(selected) } as any);
    } catch {}
    router.push("/");
  };

  const handleSkip = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-3xl font-bold text-white mb-2">What are you in the mood for?</h1>
        <p className="text-zinc-400 text-sm mb-8 max-w-lg mx-auto">
          Choose the vibes you love most. We&apos;ll use them to personalize your music, radio stations, autoplay, and recommendations.
        </p>

        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {MOODS.map((mood) => {
            const isSelected = selected.includes(mood.id);
            return (
              <button
                key={mood.id}
                onClick={() => toggle(mood.id)}
                className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                  isSelected
                    ? "bg-yellow-500 text-black scale-105 shadow-lg shadow-yellow-500/20"
                    : "bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 border border-zinc-700"
                }`}
              >
                <span className="mr-1.5">{mood.emoji}</span>
                {mood.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleContinue}
            disabled={saving}
            className="px-8 py-3 bg-yellow-500 text-black font-bold rounded-full hover:bg-yellow-400 transition disabled:opacity-50"
          >
            {saving ? "Saving..." : selected.length > 0 ? `Continue (${selected.length} selected)` : "Continue"}
          </button>
          <button
            onClick={handleSkip}
            className="px-6 py-3 text-zinc-500 hover:text-zinc-300 transition text-sm"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
