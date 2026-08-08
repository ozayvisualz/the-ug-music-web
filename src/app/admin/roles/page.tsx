"use client";
import { trpc } from "@/trpc/client";
import { Shield, UserCog, Search } from "lucide-react";
import { useState } from "react";

export default function AdminRolesPage() {
  const [search, setSearch] = useState("");
  const { data: users } = trpc.admin.getUsers.useQuery({ limit: 50 });
  const utils = trpc.useUtils();
  const promoteMut = trpc.admin.promoteUser.useMutation({ onSuccess: () => utils.admin.getUsers.invalidate() });

  const filtered = users?.filter((u: any) =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const ROLES = ["LISTENER", "ARTIST", "ADMIN"] as const;

  return (
    <div className="p-6 space-y-4">
      <div><h1 className="text-2xl font-bold text-white">Roles & Permissions</h1><p className="text-sm text-zinc-500 mt-1">Manage user roles and access levels</p></div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        {ROLES.map((role) => (
          <div key={role} className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{users?.filter((u: any) => u.role === role).length || 0}</p>
            <p className="text-xs text-zinc-500 mt-1">{role === "LISTENER" ? "Listeners" : role === "ARTIST" ? "Artists" : "Admins"}</p>
          </div>
        ))}
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 pl-10 pr-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50" />
      </div>
      <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-zinc-800/60"><th className="text-left p-4 text-xs text-zinc-500">User</th><th className="text-left p-4 text-xs text-zinc-500">Email</th><th className="text-left p-4 text-xs text-zinc-500">Role</th><th className="text-right p-4 text-xs text-zinc-500">Change</th></tr></thead>
          <tbody>
            {filtered.map((u: any) => (
              <tr key={u.id} className="border-b border-zinc-800/30 hover:bg-zinc-800/20">
                <td className="p-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs">{u.name?.charAt(0)}</div><p className="text-sm text-white">{u.name}</p></div></td>
                <td className="p-4"><p className="text-sm text-zinc-400">{u.email}</p></td>
                <td className="p-4"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.role === "ADMIN" ? "bg-purple-500/20 text-purple-400" : u.role === "ARTIST" ? "bg-yellow-500/20 text-yellow-500" : "bg-zinc-500/20 text-zinc-400"}`}>{u.role}</span></td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-1">
                    {ROLES.filter((r) => r !== u.role).map((role) => (
                      <button key={role} onClick={() => promoteMut.mutate({ userId: u.id, role })} className="px-2 py-1 bg-zinc-800 text-zinc-400 rounded text-[10px] hover:bg-yellow-500/20 hover:text-yellow-500">
                        Make {role === "ARTIST" ? "Artist" : role === "ADMIN" ? "Admin" : "Listener"}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={4} className="p-12 text-center text-zinc-600">No users found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
