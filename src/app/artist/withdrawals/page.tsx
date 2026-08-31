"use client";
import { trpc } from "@/trpc/client";
import { useState } from "react";
import { Banknote, Plus, Trash2, AlertCircle, CheckCircle, Clock, X } from "lucide-react";
import { formatUGX } from "@/lib/utils";
import toast from "react-hot-toast";

export default function ArtistWithdrawalsPage() {
  const utils = trpc.useUtils();
  const { data: earnings } = trpc.artist.getMyEarnings.useQuery();
  const { data: withdrawalStatus } = trpc.artist.getWithdrawalStatus.useQuery();
  const { data: paymentMethods } = trpc.artist.getMyPaymentMethods.useQuery();
  const { data: payouts } = trpc.artist.getMyPayouts.useQuery();
  const [amount, setAmount] = useState("");
  const [selectedMethodId, setSelectedMethodId] = useState("");
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [newMethod, setNewMethod] = useState({ type: "mobile_money", accountName: "", accountNumber: "", provider: "MTN" });

  const requestMut = trpc.artist.requestPayout.useMutation({ onSuccess: () => { toast.success("Withdrawal requested"); setAmount(""); setSelectedMethodId(""); utils.artist.getMyEarnings.invalidate(); utils.artist.getWithdrawalStatus.invalidate(); utils.artist.getMyPayouts.invalidate(); }, onError: (e) => toast.error(e.message) });
  const addMethodMut = trpc.artist.addPaymentMethod.useMutation({ onSuccess: () => { toast.success("Payment method added"); setShowAddMethod(false); setNewMethod({ type: "mobile_money", accountName: "", accountNumber: "", provider: "MTN" }); utils.artist.getMyPaymentMethods.invalidate(); }, onError: (e) => toast.error(e.message) });
  const deleteMethodMut = trpc.artist.deletePaymentMethod.useMutation({ onSuccess: () => { toast.success("Removed"); utils.artist.getMyPaymentMethods.invalidate(); }, onError: (e) => toast.error(e.message) });

  const wallet = earnings?.wallet;
  const meetsThreshold = (wallet?.availableBalance || 0) >= 50000;
  const eligible = withdrawalStatus?.eligible;
  const alreadyWithdrawn = withdrawalStatus?.alreadyWithdrawn;

  return (
    <div className="p-6 space-y-4 max-w-3xl">
      <h1 className="text-2xl font-bold text-white">Withdrawals</h1>

      {wallet && (
        <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3"><Banknote className="w-5 h-5 text-yellow-500" /><span className="text-lg font-bold text-white">Available: {formatUGX(wallet.availableBalance)}</span></div>

          {!meetsThreshold ? (
            <div className="flex items-center gap-2 text-sm text-yellow-500"><AlertCircle className="w-4 h-4" /> Minimum withdrawal is UGX 50,000. You have {formatUGX(wallet.availableBalance)}.</div>
          ) : alreadyWithdrawn ? (
            <div className="flex items-center gap-2 text-sm text-yellow-500"><Clock className="w-4 h-4" /> You have already requested a withdrawal this month. Try again next month.</div>
          ) : !(paymentMethods?.length) ? (
            <div className="flex items-center gap-2 text-sm text-yellow-500"><AlertCircle className="w-4 h-4" /> Add a payment method below before withdrawing.</div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-3">
                <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="Amount (min 50,000)" className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50" />
                <button
                  onClick={() => requestMut.mutate({ amount: parseInt(amount), methodId: selectedMethodId })}
                  disabled={!amount || parseInt(amount) < 50000 || parseInt(amount) > wallet.availableBalance || !selectedMethodId}
                  className="px-6 py-2.5 rounded-xl bg-yellow-500 text-black font-semibold text-sm hover:bg-yellow-400 disabled:opacity-50"
                >Request</button>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-500">Select Payment Method:</label>
                {paymentMethods.map((pm: any) => (
                  <button
                    key={pm.id}
                    onClick={() => setSelectedMethodId(pm.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition ${
                      selectedMethodId === pm.id ? "bg-yellow-500/20 border border-yellow-500/40" : "bg-zinc-800 border border-zinc-700 hover:border-zinc-600"
                    }`}
                  >
                    <div>
                      <span className="text-white font-medium">{pm.provider}</span>
                      <span className="text-zinc-500 ml-2">{pm.accountNumber}</span>
                      <span className="text-zinc-600 text-xs ml-1">({pm.accountName})</span>
                    </div>
                    {selectedMethodId === pm.id && <CheckCircle className="w-4 h-4 text-yellow-500" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Payment Methods</h3>
          <button onClick={() => setShowAddMethod(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 text-xs text-zinc-300 hover:text-white hover:bg-zinc-700 transition">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
        {paymentMethods && paymentMethods.length > 0 ? (
          <div className="space-y-2">
            {paymentMethods.map((pm: any) => (
              <div key={pm.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-800/50">
                <div>
                  <p className="text-sm text-white font-medium">{pm.provider}</p>
                  <p className="text-xs text-zinc-500">{pm.accountNumber} · {pm.accountName} · {pm.type}</p>
                </div>
                <button onClick={() => { if (confirm("Remove this payment method?")) deleteMethodMut.mutate({ methodId: pm.id }); }} className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No payment methods added yet. Add one to withdraw your earnings.</p>
        )}
      </div>

      <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Payout History</h3>
        {payouts && payouts.length > 0 ? (
          <div className="space-y-2">
            {payouts.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-800/30">
                <div>
                  <p className="text-sm text-white font-medium">{formatUGX(p.amount)}</p>
                  <p className="text-xs text-zinc-500">{p.method} · {new Date(p.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  p.status === "PAID" ? "bg-emerald-500/20 text-emerald-400" :
                  p.status === "PENDING" ? "bg-yellow-500/20 text-yellow-500" :
                  p.status === "REJECTED" ? "bg-red-500/20 text-red-400" :
                  "bg-zinc-500/20 text-zinc-400"
                }`}>{p.status}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No withdrawal history yet.</p>
        )}
      </div>

      {showAddMethod && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowAddMethod(false)}>
          <div className="bg-[#18181D] border border-zinc-700 rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Add Payment Method</h3>
              <button onClick={() => setShowAddMethod(false)}><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Provider</label>
                <select value={newMethod.provider} onChange={(e) => setNewMethod({ ...newMethod, provider: e.target.value })} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/50">
                  <option value="MTN">MTN Mobile Money</option>
                  <option value="Airtel">Airtel Money</option>
                  <option value="Bank">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Account Name</label>
                <input type="text" value={newMethod.accountName} onChange={(e) => setNewMethod({ ...newMethod, accountName: e.target.value })} placeholder="Full name on account" className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50" />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Account Number</label>
                <input type="text" value={newMethod.accountNumber} onChange={(e) => setNewMethod({ ...newMethod, accountNumber: e.target.value })} placeholder="Phone number or account number" className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50" />
              </div>
            </div>
            <button
              onClick={() => {
                if (!newMethod.accountName || !newMethod.accountNumber) { toast.error("Fill all fields"); return; }
                addMethodMut.mutate(newMethod);
              }}
              disabled={!newMethod.accountName || !newMethod.accountNumber || addMethodMut.isPending}
              className="w-full mt-4 py-2.5 rounded-xl bg-yellow-500 text-black font-bold text-sm hover:bg-yellow-400 disabled:opacity-50"
            >
              {addMethodMut.isPending ? "Adding..." : "Add Payment Method"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
