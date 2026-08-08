"use client";
import { trpc } from "@/trpc/client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Trash2, Shield, UserCheck, UserX } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/client-auth";

export default function UsersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data, refetch, isLoading } = trpc.admin.getUsers.useQuery({ search: search || undefined, role: roleFilter || undefined, limit, offset: page * limit });
  const promoteMut = trpc.admin.promoteUser.useMutation({ onSuccess: () => refetch() });
  const deleteMut = trpc.admin.deleteUser.useMutation({ onSuccess: () => refetch() });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"/></div>;
  if (!user) { router.push("/login"); return null; }

  const users = data?.users || [];
  const total = data?.total || 0;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-sm text-zinc-500">{total} total users</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} placeholder="Search users..." className="w-full bg-[#18181D] border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50" />
        </div>
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }} className="bg-[#18181D] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/50">
          <option value="">All Roles</option>
          <option value="LISTENER">Listeners</option>
          <option value="ARTIST">Artists</option>
          <option value="ADMIN">Admins</option>
        </select>
      </div>

      <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800/60">
              <th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase">User</th>
              <th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase">Role</th>
              <th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase hidden md:table-cell">Joined</th>
              <th className="text-right p-4 text-xs font-medium text-zinc-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user: any) => (
              <tr key={user.id} className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center text-xs font-bold text-yellow-500">{user.name?.charAt(0) || "?"}</div>
                    <div>
                      <p className="text-sm font-medium text-white">{user.name || "Unnamed"}</p>
                      <p className="text-xs text-zinc-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${user.role === "ADMIN" ? "bg-purple-500/20 text-purple-400" : user.role === "ARTIST" ? "bg-yellow-500/20 text-yellow-500" : "bg-zinc-500/20 text-zinc-400"}`}>{user.role}</span>
                </td>
                <td className="p-4 text-sm text-zinc-400 hidden md:table-cell">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    {user.role !== "ADMIN" && (
                      <button onClick={() => promoteMut.mutate({ id: user.id, role: "ADMIN" })} className="p-1.5 rounded-lg hover:bg-purple-500/20 text-zinc-400 hover:text-purple-400 transition" title="Promote"><Shield className="w-4 h-4" /></button>
                    )}
                    {user.role !== "ARTIST" && (
                      <button onClick={() => promoteMut.mutate({ id: user.id, role: "ARTIST" })} className="p-1.5 rounded-lg hover:bg-yellow-500/20 text-zinc-400 hover:text-yellow-500 transition" title="Make Artist"><UserCheck className="w-4 h-4" /></button>
                    )}
                    {user.role !== "LISTENER" && (
                      <button onClick={() => promoteMut.mutate({ id: user.id, role: "LISTENER" })} className="p-1.5 rounded-lg hover:bg-zinc-500/20 text-zinc-400 hover:text-zinc-300 transition" title="Demote"><UserX className="w-4 h-4" /></button>
                    )}
                    <button onClick={() => { if (confirm("Delete this user?")) deleteMut.mutate(user.id); }} className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={4} className="p-12 text-center text-zinc-600 text-sm">No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {total > limit && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="px-3 py-1.5 rounded-lg bg-[#18181D] border border-zinc-800 text-sm text-zinc-400 hover:text-white disabled:opacity-30">Previous</button>
          <span className="text-sm text-zinc-500">Page {page + 1} of {Math.ceil(total / limit)}</span>
          <button onClick={() => setPage(page + 1)} disabled={(page + 1) * limit >= total} className="px-3 py-1.5 rounded-lg bg-[#18181D] border border-zinc-800 text-sm text-zinc-400 hover:text-white disabled:opacity-30">Next</button>
        </div>
      )}
    </div>
  );
}
