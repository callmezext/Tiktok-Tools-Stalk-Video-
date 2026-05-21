"use client";

import { useState, useEffect, useCallback } from "react";
import { formatCurrency, cn } from "@/lib/utils";

interface AdminUser {
  _id: string;
  nickname: string;
  username: string;
  email: string;
  role: string;
  isBanned: boolean;
  campaignBalance: number;
  referralBalance: number;
  stats: { totalVideos: number; totalEarned: number; totalViews: number };
  memberSince: string;
}

type Toast = { message: string; type: "success" | "error" } | null;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => { if (d.success) setUsers(d.users); })
      .catch((err) => {
        console.error(err);
        showToast("Failed to load users", "error");
      })
      .finally(() => setLoading(false));
  }, [showToast]);

  const toggleBan = async (userId: string, isBanned: boolean) => {
    const action = isBanned ? "unban" : "ban";
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} this user?`)) return;

    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBanned: !isBanned }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, isBanned: !isBanned } : u));
        showToast(`User ${action}ned successfully`);
      } else {
        showToast(data.error || `Failed to ${action} user`, "error");
      }
    } catch (err) {
      console.error("Toggle ban error:", err);
      showToast("Request failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const toggleRole = async (userId: string, role: string) => {
    const cycle: Record<string, string> = { user: "moderator", moderator: "admin", admin: "user" };
    const newRole = cycle[role] || "user";
    const warn = newRole === "admin" ? " ⚠️ They will have full admin access!" : newRole === "moderator" ? " They will be able to review submissions." : "";
    if (!confirm(`Change this user's role to "${newRole}"?${warn}`)) return;

    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, role: newRole } : u));
        showToast(`User role changed to ${newRole}`);
      } else {
        showToast(data.error || "Failed to change role", "error");
      }
    } catch (err) {
      console.error("Toggle role error:", err);
      showToast("Request failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (userId: string, username: string) => {
    if (!confirm(`Delete user @${username}? This will soft-delete the account.`)) return;

    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers((prev) => prev.filter((u) => u._id !== userId));
        showToast(`User @${username} deleted`);
      } else {
        showToast(data.error || "Failed to delete user", "error");
      }
    } catch (err) {
      console.error("Delete user error:", err);
      showToast("Request failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = users.filter((u) =>
    !search ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.nickname || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalBalance = users.reduce((sum, u) => sum + (u.campaignBalance || 0) + (u.referralBalance || 0), 0);
  const bannedCount = users.filter((u) => u.isBanned).length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const modCount = users.filter((u) => u.role === "moderator").length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="admin-shimmer h-8 w-48 mb-6" />
        <div className="admin-shimmer h-12 w-full max-w-md mb-6" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="admin-shimmer h-14 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="admin-page-header">
        <h1>Users</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <p>{users.length} total users</p>
          {bannedCount > 0 && (
            <span className="badge bg-error/20 text-error text-[10px]">🚫 {bannedCount} banned</span>
          )}
          <span className="badge bg-accent/20 text-accent-light text-[10px]">👑 {adminCount} admins</span>
          {modCount > 0 && <span className="badge bg-info/20 text-info text-[10px]">🛡️ {modCount} mods</span>}
          <span className="text-xs text-text-muted">• Balance: {formatCurrency(totalBalance)}</span>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input-field mb-6 max-w-md"
        placeholder="🔍 Search by username, email, or name..."
      />

      {filtered.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon">👥</div>
          <p className="admin-empty-text">
            {search ? `No users matching "${search}"` : "No users yet"}
          </p>
        </div>
      ) : (
        <>
        {/* ═══ Mobile Card Layout ═══ */}
        <div className="space-y-3 md:hidden">
          {filtered.map((u) => {
            const isDisabled = actionLoading === u._id;
            return (
              <div key={u._id} className={cn("glass-card p-4", u.isBanned && "opacity-60")}>
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <div className="font-bold text-sm truncate">{u.nickname || u.username}</div>
                    <div className="text-[11px] text-text-muted font-mono">@{u.username}</div>
                    <div className="text-[11px] text-text-muted truncate mt-0.5">{u.email}</div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <span className={`badge text-[9px] ${u.role === "admin" ? "bg-error/20 text-error" : u.role === "moderator" ? "bg-info/20 text-info" : "badge-active"}`}>{u.role}</span>
                    {u.isBanned && <span className="badge bg-error/20 text-error text-[9px]">banned</span>}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                  <div className="bg-bg-primary/50 rounded-lg p-2">
                    <div className="text-[10px] text-text-muted uppercase">Videos</div>
                    <div className="font-bold text-sm font-mono">{u.stats?.totalVideos || 0}</div>
                  </div>
                  <div className="bg-bg-primary/50 rounded-lg p-2">
                    <div className="text-[10px] text-text-muted uppercase">Earned</div>
                    <div className="font-bold text-sm text-success">{formatCurrency(u.stats?.totalEarned || 0)}</div>
                  </div>
                  <div className="bg-bg-primary/50 rounded-lg p-2">
                    <div className="text-[10px] text-text-muted uppercase">Balance</div>
                    <div className="font-bold text-sm font-mono">{formatCurrency((u.campaignBalance || 0) + (u.referralBalance || 0))}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button"
                    onClick={() => toggleRole(u._id, u.role)}
                    disabled={isDisabled}
                    className="admin-btn admin-btn--accent flex-1 !text-[10px]"
                  >
                    {isDisabled ? "⏳" : `→ ${({user:"Mod",moderator:"Admin",admin:"User"} as Record<string,string>)[u.role] || "Mod"}`}
                  </button>
                  <button type="button"
                    onClick={() => toggleBan(u._id, u.isBanned)}
                    disabled={isDisabled}
                    className={cn("admin-btn flex-1 !text-[10px]",
                      u.isBanned ? "admin-btn--success" : "admin-btn--danger"
                    )}
                  >
                    {isDisabled ? "⏳" : u.isBanned ? "Unban" : "Ban"}
                  </button>
                  <button type="button"
                    onClick={() => deleteUser(u._id, u.username)}
                    disabled={isDisabled}
                    className="admin-btn admin-btn--danger !text-[10px]"
                  >
                    {isDisabled ? "⏳" : "🗑️"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ═══ Desktop Table Layout ═══ */}
        <div className="glass-card overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th className="text-center">Role</th>
                  <th className="text-center">Videos</th>
                  <th className="text-right">Earned</th>
                  <th className="text-right">Balance</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const isDisabled = actionLoading === u._id;
                  return (
                    <tr key={u._id} className={cn(u.isBanned && "opacity-50")}>
                      <td>
                        <div className="font-bold text-sm">{u.nickname || u.username}</div>
                        <div className="text-[11px] text-text-muted font-mono">@{u.username}</div>
                      </td>
                      <td className="text-text-muted text-xs">{u.email}</td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className={`badge text-[10px] ${u.role === "admin" ? "bg-error/20 text-error" : u.role === "moderator" ? "bg-info/20 text-info" : "badge-active"}`}>{u.role}</span>
                          {u.isBanned && <span className="badge bg-error/20 text-error text-[10px]">banned</span>}
                        </div>
                      </td>
                      <td className="text-center font-mono text-sm">{u.stats?.totalVideos || 0}</td>
                      <td className="text-right text-success font-semibold text-sm">{formatCurrency(u.stats?.totalEarned || 0)}</td>
                      <td className="text-right font-mono text-sm">{formatCurrency((u.campaignBalance || 0) + (u.referralBalance || 0))}</td>
                      <td className="text-center">
                        <div className="flex gap-1.5 justify-center">
                          <button type="button"
                            onClick={() => toggleRole(u._id, u.role)}
                            disabled={isDisabled}
                            className="admin-btn admin-btn--accent !py-1.5 !px-2.5 !text-[10px]"
                          >
                            {isDisabled ? "⏳" : `→ ${({user:"Mod",moderator:"Admin",admin:"User"} as Record<string,string>)[u.role] || "Mod"}`}
                          </button>
                          <button type="button"
                            onClick={() => toggleBan(u._id, u.isBanned)}
                            disabled={isDisabled}
                            className={cn("admin-btn !py-1.5 !px-2.5 !text-[10px]",
                              u.isBanned ? "admin-btn--success" : "admin-btn--danger"
                            )}
                          >
                            {isDisabled ? "⏳" : u.isBanned ? "Unban" : "Ban"}
                          </button>
                          <button type="button"
                            onClick={() => deleteUser(u._id, u.username)}
                            disabled={isDisabled}
                            className="admin-btn admin-btn--danger !py-1.5 !px-2.5 !text-[10px]"
                          >
                            {isDisabled ? "⏳" : "🗑️"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}

      {/* Toast */}
      {toast && (
        <div className={cn("admin-toast", toast.type === "success" ? "admin-toast--success" : "admin-toast--error")}>
          <span>{toast.type === "success" ? "✅" : "❌"}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
