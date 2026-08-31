"use client";

import { trpc } from "@/trpc/client";
import { Crown, Check, Music2, Download, Radio } from "lucide-react";
import { formatUGX } from "@/lib/utils";

const features = ["Ad-free listening", "HD audio quality", "Unlimited skips", "Offline downloads", "Background play", "Exclusive content", "Early access to new releases", "Artist radio stations"];

export default function PremiumPage() {
  const { data: plans } = trpc.payments.getSubscriptionPlans.useQuery();

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <div className="text-center">
        <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-4xl font-bold">TheUgMusic Premium</h1>
        <p className="text-zinc-400 mt-2 max-w-md mx-auto">Unlock the full experience with ad-free listening, HD audio, and more.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[{ icon: <Music2 className="w-6 h-6" />, label: "HD Audio" }, { icon: <Download className="w-6 h-6" />, label: "Offline" }, { icon: <Radio className="w-6 h-6" />, label: "Radio" }, { icon: <Check className="w-6 h-6" />, label: "No Ads" }].map((f, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
            <div className="text-yellow-500 flex justify-center mb-2">{f.icon}</div>
            <p className="text-sm font-semibold">{f.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans?.map((plan: any, i: number) => (
          <div key={i} className={`bg-zinc-900 border rounded-2xl p-6 text-center ${i === 1 ? "border-yellow-500/50 ring-1 ring-yellow-500/20" : "border-zinc-800"}`}>
            {i === 1 && <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-full">Most Popular</span>}
            <h3 className="text-lg font-bold mt-2">{plan.name}</h3>
            <p className="text-3xl font-bold mt-2">{formatUGX(plan.price)}<span className="text-sm text-zinc-500 font-normal">/{i===0?"mo":i===1?"3mo":"yr"}</span></p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-400">
              {features.slice(0, 4 + i).map((f, j) => (
                <li key={j} className="flex items-center gap-2"><Check className="w-4 h-4 text-yellow-500"/>{f}</li>
              ))}
            </ul>
            <button className="w-full mt-6 py-2.5 rounded-full bg-yellow-500 text-black font-semibold text-sm hover:bg-yellow-400 transition">
              Get {plan.name}
            </button>
          </div>
        )) || (
          <div className="col-span-3 text-center py-8 text-zinc-500">Premium plans loading...</div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-center">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-2 text-sm text-zinc-400"><Check className="w-4 h-4 text-yellow-500" />{f}</div>
        ))}
      </div>
    </div>
  );
}
