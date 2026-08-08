import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: "up" | "down";
  icon?: React.ReactNode;
  color?: string;
}

export function StatCard({ label, value, change, changeType, icon, color }: StatCardProps) {
  return (
    <div className={cn(
      "bg-[#18181D] border border-zinc-800/60 rounded-xl p-5 hover:border-zinc-700/60 transition-all",
      "shadow-sm shadow-black/20"
    )}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</p>
        {icon && <div className="text-zinc-500">{icon}</div>}
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      {change && (
        <div className="flex items-center gap-1">
          {changeType === "up" ? (
            <TrendingUp className="w-3 h-3 text-emerald-500" />
          ) : changeType === "down" ? (
            <TrendingDown className="w-3 h-3 text-red-500" />
          ) : null}
          <span className={cn(
            "text-xs font-medium",
            changeType === "up" && "text-emerald-500",
            changeType === "down" && "text-red-500",
            !changeType && "text-zinc-500"
          )}>
            {change}
          </span>
        </div>
      )}
    </div>
  );
}

export function RevenueCard({ label, value, change, icon }: { label: string; value: string; change?: string; icon: React.ReactNode }) {
  return (
    <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-5 shadow-sm shadow-black/20 hover:border-yellow-500/20 transition-all">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className="text-xs text-zinc-500">{label}</p>
          <p className="text-lg font-bold text-white">{value}</p>
        </div>
      </div>
      {change && <p className="text-xs text-emerald-500">{change}</p>}
    </div>
  );
}

export function ChartCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-[#18181D] border border-zinc-800/60 rounded-xl p-6 shadow-sm shadow-black/20", className)}>
      <h3 className="text-sm font-semibold text-white mb-4">{title}</h3>
      <div className="flex items-center justify-center min-h-[200px]">
        {children}
      </div>
    </div>
  );
}

export function ActivityItem({ title, description, time, icon }: { title: string; description: string; time: string; icon: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-3 border-b border-zinc-800/40 last:border-0">
      <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium">{title}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
      </div>
      <span className="text-xs text-zinc-600 whitespace-nowrap">{time}</span>
    </div>
  );
}

export function QuickAction({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#18181D] border border-zinc-800/60 hover:border-yellow-500/30 hover:bg-yellow-500/5 transition-all text-sm text-zinc-300 hover:text-white"
    >
      <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
        {icon}
      </div>
      {label}
    </button>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      {action}
    </div>
  );
}
