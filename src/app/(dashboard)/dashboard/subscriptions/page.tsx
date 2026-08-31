"use client";

import { trpc } from "@/trpc/client";
import { useState } from "react";
import { Crown, Check } from "lucide-react";
import { formatUGX } from "@/lib/utils";
import { useSession } from "next-auth/react";

export default function SubscriptionsPage() {
  const { data: session } = useSession();
  const { data: plans } = trpc.payments.getSubscriptionPlans.useQuery();
  const { data: activeSub } = trpc.payments.checkSubscription.useQuery(undefined, { enabled: !!session });
  const [selected, setSelected] = useState<string>("");
  const [notice, setNotice] = useState("");

  const handleSubscribe = () => {
    if (!selected) return;
    setNotice("Online payment is currently unavailable. Please try again later.");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <div className="text-center">
        <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
        <h1 className="text-3xl font-bold">Premium Plans</h1>
        <p className="text-zinc-400 mt-1">Ad-free streaming, high quality audio, and more</p>
      </div>

      {activeSub && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 text-center">
          <p className="text-yellow-500 font-semibold">Premium Active</p>
          <p className="text-sm text-zinc-400 mt-1">
            Your {activeSub.plan.toLowerCase()} plan expires on{" "}
            {new Date(activeSub.endDate).toLocaleDateString()}
          </p>
        </div>
      )}

      {!activeSub && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans?.map((plan: any) => (
              <button
                key={plan.id}
                onClick={() => setSelected(plan.id)}
                className={`p-6 rounded-xl border-2 transition text-left ${
                  selected === plan.id
                    ? "border-yellow-500 bg-yellow-500/5"
                    : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                }`}
              >
                <p className="text-lg font-bold">{plan.name}</p>
                <p className="text-2xl font-bold mt-2">{formatUGX(plan.price)}</p>
                <p className="text-sm text-zinc-500 mt-1">{plan.duration} days</p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((f: string) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-zinc-400">
                      <Check className="w-4 h-4 text-yellow-500" /> {f}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>

          {notice && (
            <p className="text-center text-sm text-yellow-500 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3">
              {notice}
            </p>
          )}

          <div className="flex justify-center">
            <button
              onClick={handleSubscribe}
              disabled={!selected}
              className="px-8 py-3 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition disabled:opacity-50"
            >
              Subscribe Now
            </button>
          </div>
        </>
      )}
    </div>
  );
}
