"use client";

import { trpc } from "@/trpc/client";
import { useState } from "react";
import { Crown, Check, Loader2 } from "lucide-react";
import { formatUGX } from "@/lib/utils";
import { useSession } from "next-auth/react";

export default function SubscriptionsPage() {
  const { data: session } = useSession();
  const { data: plans } = trpc.payments.getSubscriptionPlans.useQuery();
  const { data: activeSub } = trpc.payments.checkSubscription.useQuery(undefined, { enabled: !!session });
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [txRef, setTxRef] = useState("");
  const [showFlutterwave, setShowFlutterwave] = useState(false);

  const initiateMut = trpc.payments.initiateSubscription.useMutation({
    onSuccess: (data) => {
      setTxRef(data.txRef);
      setShowFlutterwave(true);
      setLoading(false);
    },
    onError: () => setLoading(false),
  });

  const confirmMut = trpc.payments.confirmSubscription.useMutation({
    onSuccess: () => {
      window.location.reload();
    },
  });

  const handleSubscribe = () => {
    if (!selected) return;
    setLoading(true);
    initiateMut.mutate({ plan: selected as "MONTHLY" | "QUARTERLY" | "ANNUAL" });
  };

  // Simulate Flutterwave payment
  const handleFlutterwaveSuccess = () => {
    if (txRef) {
      confirmMut.mutate({ transactionRef: txRef, plan: selected as "MONTHLY" | "QUARTERLY" | "ANNUAL" });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
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

          <div className="flex justify-center">
            <button
              onClick={handleSubscribe}
              disabled={!selected || loading}
              className="px-8 py-3 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? "Processing..." : "Subscribe Now"}
            </button>
          </div>

          {/* Flutterwave Payment Modal */}
          {showFlutterwave && (
            <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
              <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-md space-y-4">
                <h3 className="text-lg font-bold">Complete Payment</h3>
                <p className="text-sm text-zinc-400">
                  Select your payment method to complete the subscription. In production, this would integrate with Flutterwave.
                </p>
                <div className="space-y-2">
                  <button onClick={handleFlutterwaveSuccess} className="w-full p-3 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-left text-sm transition">
                    MTN Mobile Money
                  </button>
                  <button onClick={handleFlutterwaveSuccess} className="w-full p-3 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-left text-sm transition">
                    Airtel Money
                  </button>
                  <button onClick={handleFlutterwaveSuccess} className="w-full p-3 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-left text-sm transition">
                    Visa / Mastercard
                  </button>
                </div>
                <button onClick={() => setShowFlutterwave(false)} className="w-full p-2.5 rounded-xl text-sm text-zinc-500 hover:text-white transition">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
