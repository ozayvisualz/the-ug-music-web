"use client";
import { trpc } from "@/trpc/client";
import { useState } from "react";
import { useAuth } from "@/lib/client-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { TrendingUp, Download, DollarSign, Music2, Clock, ArrowUpRight, Play, Mic2, Disc3 } from "lucide-react";
import { StatCard, RevenueCard } from "@/components/admin/ui";
import { formatUGX, formatNumber } from "@/lib/utils";
import toast from "react-hot-toast";

export default function ArtistDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [days, setDays] = useState(30);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedMethodId, setSelectedMethodId] = useState("");
  const [showWithdraw, setShowWithdraw] = useState(false);
  const utils = trpc.useUtils();
  const { data: analytics } = trpc.artist.getMyAnalytics.useQuery({ days });
  const { data: earnings } = trpc.artist.getMyEarnings.useQuery();
  const { data: songs } = trpc.artist.getMySongs.useQuery();
  const { data: withdrawalStatus } = trpc.artist.getWithdrawalStatus.useQuery();
  const { data: paymentMethods } = trpc.artist.getMyPaymentMethods.useQuery();
  const requestPayoutMut = trpc.artist.requestPayout.useMutation({
    onSuccess: () => {
      toast.success("Withdrawal requested");
      setShowWithdraw(false);
      setWithdrawAmount("");
      setSelectedMethodId("");
      utils.artist.getMyEarnings.invalidate();
      utils.artist.getWithdrawalStatus.invalidate();
    },
    onError: (e) => {
      toast.error(e.message);
      utils.artist.getWithdrawalStatus.invalidate();
    },
  });

  const availableBalance = earnings?.wallet?.availableBalance || 0;
  const threshold = withdrawalStatus?.threshold || 50000;
  const eligible = withdrawalStatus?.eligible || false;
  const canWithdraw = availableBalance >= threshold && eligible && (paymentMethods?.length || 0) > 0;
  const alreadyWithdrawn = withdrawalStatus?.alreadyWithdrawn || false;
  const meetsThreshold = availableBalance >= threshold;
  const daysRemaining = withdrawalStatus?.daysRemaining || 0;
  const nextDate = withdrawalStatus?.nextWithdrawalDate
    ? new Date(withdrawalStatus.nextWithdrawalDate).toLocaleDateString("en-US", { month: "long", day: "numeric" })
    : "";
  const lastDate = withdrawalStatus?.lastWithdrawalDate
    ? new Date(withdrawalStatus.lastWithdrawalDate).toLocaleDateString("en-US", { month: "long", day: "numeric" })
    : null;
  const noPaymentMethod = meetsThreshold && !alreadyWithdrawn && (paymentMethods?.length || 0) === 0;

  useEffect(() => { if (!loading && !user) router.push("/login?redirect=/artist/dashboard"); }, [user, loading]);
  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user || user.role === "LISTENER") return <div className="flex flex-col items-center justify-center h-full gap-4 p-8"><Mic2 className="w-16 h-16 text-zinc-700" /><h1 className="text-xl font-bold text-white">Artist Access Required</h1><p className="text-zinc-500">You need an artist account.</p></div>;

  const topSong = songs?.sort((a: any, b: any) => b.playCount - a.playCount)[0];

  const getBlockedReason = () => {
    if (!meetsThreshold) return `Need ${formatUGX(threshold)} to withdraw. Current: ${formatUGX(availableBalance)}`;
    if (alreadyWithdrawn) return `Already withdrawn this month. Next: ${nextDate} (${daysRemaining}d)`;
    if (noPaymentMethod) return "No payment method added. Add one in Settings.";
    return "";
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-white">Artist Dashboard</h1><p className="text-sm text-zinc-500">Welcome back, {user.name}</p></div>
        <div className="flex gap-2">{[7, 30, 90, 365].map(d => (<button key={d} onClick={() => setDays(d)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${days === d ? "bg-yellow-500 text-black" : "bg-[#18181D] text-zinc-400 border border-zinc-800 hover:text-white"}`}>{d}d</button>))}</div></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label={`Streams (${days}d)`} value={formatNumber(analytics?.totalStreams || 0)} icon={<Play className="w-4 h-4 text-zinc-500" />} />
        <StatCard label="Downloads" value={formatNumber(analytics?.totalDownloads || 0)} icon={<Download className="w-4 h-4 text-zinc-500" />} />
        <StatCard label="Total Songs" value={formatNumber(analytics?.totalSongs || 0)} icon={<Music2 className="w-4 h-4 text-zinc-500" />} />
        <StatCard label="Albums" value={formatNumber(analytics?.totalAlbums || 0)} icon={<Disc3 className="w-4 h-4 text-zinc-500" />} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <RevenueCard label="Total Revenue" value={formatUGX(analytics?.totalRevenue || 0)} change={days + " days"} icon={<DollarSign className="w-5 h-5 text-yellow-500" />} />
        <RevenueCard label="Your Earnings" value={formatUGX(analytics?.artistEarnings || 0)} icon={<TrendingUp className="w-5 h-5 text-emerald-500" />} />
        <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-5 shadow-sm shadow-black/20 hover:border-yellow-500/20 transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><DollarSign className="w-5 h-5 text-blue-400" /></div>
              <div><p className="text-xs text-zinc-500">Available</p><p className="text-lg font-bold text-white">{formatUGX(availableBalance)}</p></div>
            </div>
            <button
              onClick={() => canWithdraw ? setShowWithdraw(true) : toast.error(getBlockedReason())}
              disabled={!canWithdraw}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${canWithdraw ? "bg-yellow-500 text-black hover:bg-yellow-400" : "bg-yellow-500/20 text-yellow-500/50 cursor-not-allowed"}`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" /> Withdraw
            </button>
          </div>
          {!meetsThreshold && (
            <p className="text-[10px] text-zinc-600 mt-3 leading-relaxed">Reach {formatUGX(threshold)} to withdraw. Current: {formatUGX(availableBalance)} of {formatUGX(threshold)}</p>
          )}
          {meetsThreshold && alreadyWithdrawn && (
            <p className="text-[10px] text-yellow-500/60 mt-3 leading-relaxed">{lastDate && <>Last withdrawal: {lastDate}. </>}Next available: {nextDate} ({daysRemaining}d).</p>
          )}
          {noPaymentMethod && (
            <p className="text-[10px] text-yellow-500/60 mt-3 leading-relaxed">Add a payment method in the Withdrawals page to request payouts.</p>
          )}
          {canWithdraw && (
            <p className="text-[10px] text-emerald-500/60 mt-3 leading-relaxed">Eligible to withdraw. Tap Withdraw to choose amount and method.</p>
          )}
        </div>
        <RevenueCard label="Pending" value={formatUGX(earnings?.wallet?.pendingBalance || 0)} icon={<Clock className="w-5 h-5 text-purple-400" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Top Song</h3>
          {topSong ? (
            <div className="flex items-center gap-4"><div className="w-16 h-16 rounded-xl bg-yellow-500/10 flex items-center justify-center text-2xl">🎵</div><div><p className="text-lg font-bold text-white">{topSong.title}</p><p className="text-sm text-zinc-400">{formatNumber(topSong.playCount)} plays</p></div></div>
          ) : <p className="text-sm text-zinc-500">No songs yet</p>}
        </div>
        <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Recent Songs</h3>
          <div className="space-y-3">
            {songs?.slice(0, 5).map((s: any) => (<div key={s.id} className="flex items-center justify-between py-1"><span className="text-sm text-zinc-300">{s.title}</span><div className="flex gap-4"><span className="text-xs text-zinc-500">{s.playCount} plays</span><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.published ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-500"}`}>{s.published ? "Live" : "Hidden"}</span></div></div>))}
            {!songs?.length && <p className="text-sm text-zinc-500">No songs uploaded</p>}
          </div>
        </div>
      </div>

      {showWithdraw && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowWithdraw(false)}>
          <div className="bg-[#18181D] border border-zinc-700 rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-1">Withdraw Earnings</h3>
            <p className="text-sm text-zinc-400 mb-4">Available: <span className="text-yellow-500 font-bold">{formatUGX(availableBalance)}</span></p>
            <div className="mb-4">
              <label className="block text-xs text-zinc-500 mb-1.5 uppercase tracking-wider">Amount (min UGX 50,000)</label>
              <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="Enter amount" className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50" autoFocus />
              <div className="flex gap-2 mt-2">
                {[50000, 100000, 200000].map(amt => (
                  <button key={amt} onClick={() => setWithdrawAmount(String(amt))} className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${withdrawAmount === String(amt) ? "bg-yellow-500 text-black" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}>{formatUGX(amt)}</button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs text-zinc-500 mb-1.5 uppercase tracking-wider">Payment Method</label>
              {paymentMethods && paymentMethods.length > 0 ? (
                <div className="space-y-2">
                  {paymentMethods.map((pm: any) => (
                    <button key={pm.id} onClick={() => setSelectedMethodId(pm.id)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${selectedMethodId === pm.id ? "bg-yellow-500/20 border border-yellow-500/40" : "bg-zinc-800 border border-zinc-700 hover:border-zinc-600"}`}>
                      <span className="text-white font-medium">{pm.provider}</span>
                      <span className="text-zinc-500 ml-2">{pm.accountNumber}</span>
                      <span className="text-zinc-600 text-xs ml-2">({pm.accountName})</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-red-400">No payment methods. <a href="/artist/withdrawals" className="underline">Add one first</a></p>
              )}
            </div>
            <button
              onClick={() => {
                const amt = parseInt(withdrawAmount);
                if (!amt || amt < 50000 || amt > availableBalance || !selectedMethodId) return;
                requestPayoutMut.mutate({ amount: amt, methodId: selectedMethodId });
              }}
              disabled={!withdrawAmount || parseInt(withdrawAmount) < 50000 || parseInt(withdrawAmount) > availableBalance || !selectedMethodId || requestPayoutMut.isPending}
              className="w-full py-3 rounded-xl bg-yellow-500 text-black font-bold text-sm hover:bg-yellow-400 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {requestPayoutMut.isPending ? "Processing..." : `Withdraw ${withdrawAmount ? formatUGX(parseInt(withdrawAmount)) : ""}`}
            </button>
            <button onClick={() => setShowWithdraw(false)} className="w-full mt-2 py-2 text-sm text-zinc-500 hover:text-white transition">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
