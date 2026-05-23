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
  tier: "bronze" | "silver" | "gold" | "diamond";
  badges: string[];
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

  // Modal states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Form states (Create/Edit)
  const [editFormTab, setEditFormTab] = useState<"profile" | "balances" | "stats" | "badges">("profile");
  const [formData, setFormData] = useState({
    nickname: "",
    username: "",
    email: "",
    password: "",
    role: "user",
    tier: "bronze",
    campaignBalance: 0,
    referralBalance: 0,
    stats: {
      totalVideos: 0,
      totalViews: 0,
      totalEarned: 0,
    },
    badges: [] as string[],
  });
  const [badgeInput, setBadgeInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadUsers = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setUsers(d.users);
      })
      .catch((err) => {
        console.error(err);
        showToast("Failed to load users", "error");
      })
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Open Edit Modal
  const openEditModal = (user: AdminUser) => {
    setSelectedUser(user);
    setFormData({
      nickname: user.nickname || "",
      username: user.username || "",
      email: user.email || "",
      password: "", // Always blank initial password in edit
      role: user.role || "user",
      tier: user.tier || "bronze",
      campaignBalance: user.campaignBalance || 0,
      referralBalance: user.referralBalance || 0,
      stats: {
        totalVideos: user.stats?.totalVideos || 0,
        totalViews: user.stats?.totalViews || 0,
        totalEarned: user.stats?.totalEarned || 0,
      },
      badges: user.badges ? [...user.badges] : [],
    });
    setEditFormTab("profile");
    setFormError(null);
    setIsEditOpen(true);
  };

  // Open Create Modal
  const openCreateModal = () => {
    setFormData({
      nickname: "",
      username: "",
      email: "",
      password: "",
      role: "user",
      tier: "bronze",
      campaignBalance: 0,
      referralBalance: 0,
      stats: {
        totalVideos: 0,
        totalViews: 0,
        totalEarned: 0,
      },
      badges: [],
    });
    setFormError(null);
    setIsCreateOpen(true);
  };

  // Quick Ban/Unban Toggle
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

  // Delete User (Soft Delete)
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

  // Form field change handlers
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: Number(value) }));
  };

  const handleStatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      stats: { ...prev.stats, [name]: Number(value) },
    }));
  };

  // Badges Management
  const addBadge = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanBadge = badgeInput.trim().toLowerCase();
    if (!cleanBadge) return;
    if (formData.badges.includes(cleanBadge)) {
      setFormError("Badge already exists");
      return;
    }
    setFormData((prev) => ({ ...prev, badges: [...prev.badges, cleanBadge] }));
    setBadgeInput("");
    setFormError(null);
  };

  const removeBadge = (badgeToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      badges: prev.badges.filter((b) => b !== badgeToRemove),
    }));
  };

  // Submit Create Form
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers((prev) => [data.user, ...prev]);
        showToast("User created successfully");
        setIsCreateOpen(false);
      } else {
        setFormError(data.error || "Failed to create user");
      }
    } catch (err) {
      console.error("Create user error:", err);
      setFormError("Network error occurred");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Submit Edit Form
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setFormSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/admin/users/${selectedUser._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers((prev) => prev.map((u) => u._id === selectedUser._id ? data.user : u));
        showToast("User updated successfully");
        setIsEditOpen(false);
      } else {
        setFormError(data.error || "Failed to update user");
      }
    } catch (err) {
      console.error("Edit user error:", err);
      setFormError("Network error occurred");
    } finally {
      setFormSubmitting(false);
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
    <div className="animate-fadeIn pb-12 relative z-10">
      {/* Header */}
      <div className="admin-page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white mb-2">Users Directory</h1>
          <div className="flex items-center gap-3 flex-wrap text-xs text-text-secondary">
            <span>👥 {users.length} total</span>
            {bannedCount > 0 && (
              <span className="badge bg-error/20 text-error text-[10px] font-bold">🚫 {bannedCount} banned</span>
            )}
            <span className="badge bg-accent/20 text-accent-light text-[10px] font-bold">👑 {adminCount} admins</span>
            {modCount > 0 && <span className="badge bg-info/20 text-info text-[10px] font-bold">🛡️ {modCount} mods</span>}
            <span className="text-text-muted">• Balance: {formatCurrency(totalBalance)}</span>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="admin-btn admin-btn--accent !py-2.5 !px-5 self-start md:self-auto font-extrabold flex items-center gap-2 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 hover:scale-102 transition-all duration-300"
        >
          ➕ Add New User
        </button>
      </div>

      {/* Search Input */}
      <div className="mb-6 max-w-md">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field"
          placeholder="🔍 Search by username, email, or name..."
        />
      </div>

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
          <div className="space-y-4 md:hidden">
            {filtered.map((u) => {
              const isDisabled = actionLoading === u._id;
              return (
                <div key={u._id} className={cn("glass-card p-5 relative overflow-hidden", u.isBanned && "opacity-60")}>
                  {u.isBanned && (
                    <div className="absolute top-0 right-0 bg-error/25 text-error text-[9px] font-black uppercase tracking-wider py-1 px-3.5 rounded-bl-xl border-l border-b border-error/20">
                      Banned
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-4">
                    <div className="min-w-0 pr-6">
                      <div className="font-extrabold text-base text-white truncate">{u.nickname || u.username}</div>
                      <div className="text-[12px] text-accent-light font-semibold font-mono mt-0.5">@{u.username}</div>
                      <div className="text-[11.5px] text-text-secondary truncate mt-0.5">{u.email}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className={cn(
                        "badge text-[9px] font-extrabold px-3 py-1",
                        u.role === "admin" ? "bg-error/15 text-error" : u.role === "moderator" ? "bg-info/15 text-info" : "badge-music"
                      )}>
                        {u.role}
                      </span>
                      <span className="badge badge-clipping text-[9px] font-bold px-2 py-0.5">
                        {u.tier || "bronze"}
                      </span>
                    </div>
                  </div>

                  {/* Stats & Finance */}
                  <div className="grid grid-cols-3 gap-2.5 mb-4.5 text-center">
                    <div className="bg-[#0b081a]/60 border border-white/[0.03] rounded-xl p-2.5">
                      <div className="text-[9px] text-text-muted uppercase tracking-widest font-bold mb-1">Videos</div>
                      <div className="font-black text-sm font-mono text-gray-200">{u.stats?.totalVideos || 0}</div>
                    </div>
                    <div className="bg-[#0b081a]/60 border border-white/[0.03] rounded-xl p-2.5">
                      <div className="text-[9px] text-text-muted uppercase tracking-widest font-bold mb-1">Earned</div>
                      <div className="font-black text-sm text-success">{formatCurrency(u.stats?.totalEarned || 0)}</div>
                    </div>
                    <div className="bg-[#0b081a]/60 border border-white/[0.03] rounded-xl p-2.5">
                      <div className="text-[9px] text-text-muted uppercase tracking-widest font-bold mb-1">Wallet</div>
                      <div className="font-black text-sm font-mono text-cyan-400">{formatCurrency((u.campaignBalance || 0) + (u.referralBalance || 0))}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(u)}
                      disabled={isDisabled}
                      className="admin-btn admin-btn--accent flex-1 !text-[11px] font-bold !py-2"
                    >
                      ✏️ Edit Detail
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleBan(u._id, u.isBanned)}
                      disabled={isDisabled}
                      className={cn(
                        "admin-btn flex-1 !text-[11px] font-bold !py-2",
                        u.isBanned ? "admin-btn--success" : "admin-btn--danger"
                      )}
                    >
                      {isDisabled ? "⏳" : u.isBanned ? "✅ Unban" : "🚫 Ban"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteUser(u._id, u.username)}
                      disabled={isDisabled}
                      className="admin-btn admin-btn--danger !px-3.5 !py-2 flex-shrink-0"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ═══ Desktop Table Layout ═══ */}
          <div className="glass-card overflow-hidden hidden md:block border border-white/[0.04] shadow-2xl">
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User Profile</th>
                    <th>Email Address</th>
                    <th className="text-center">Role / Tier</th>
                    <th className="text-center">Total Videos</th>
                    <th className="text-right">Total Earned</th>
                    <th className="text-right">Wallet Balance</th>
                    <th className="text-center">Manage Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => {
                    const isDisabled = actionLoading === u._id;
                    return (
                      <tr key={u._id} className={cn("hover:bg-white/[0.015] transition-colors duration-200", u.isBanned && "opacity-50")}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-sm font-black text-black">
                              {(u.nickname || u.username).charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-extrabold text-sm text-white">{u.nickname || u.username}</div>
                              <div className="text-[11px] text-accent-light font-semibold font-mono">@{u.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-text-secondary text-xs">{u.email}</td>
                        <td className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex gap-1 items-center justify-center">
                              <span className={cn(
                                "badge text-[9.5px] font-extrabold px-2.5 py-0.5",
                                u.role === "admin" ? "bg-error/15 text-error" : u.role === "moderator" ? "bg-info/15 text-info" : "badge-music"
                              )}>
                                {u.role}
                              </span>
                              {u.isBanned && <span className="badge bg-error/15 text-error text-[9.5px] font-bold">banned</span>}
                            </div>
                            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                              🎖️ {u.tier || "bronze"}
                            </span>
                          </div>
                        </td>
                        <td className="text-center font-mono text-sm text-gray-200">{u.stats?.totalVideos || 0}</td>
                        <td className="text-right text-success font-bold text-sm">{formatCurrency(u.stats?.totalEarned || 0)}</td>
                        <td className="text-right font-mono text-sm text-cyan-400 font-semibold">{formatCurrency((u.campaignBalance || 0) + (u.referralBalance || 0))}</td>
                        <td className="text-center">
                          <div className="flex gap-1.5 justify-center">
                            <button
                              type="button"
                              onClick={() => openEditModal(u)}
                              disabled={isDisabled}
                              className="admin-btn admin-btn--accent !py-1.5 !px-3 !text-[11px] font-bold"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleBan(u._id, u.isBanned)}
                              disabled={isDisabled}
                              className={cn(
                                "admin-btn !py-1.5 !px-3 !text-[11px] font-bold",
                                u.isBanned ? "admin-btn--success" : "admin-btn--danger"
                              )}
                            >
                              {isDisabled ? "⏳" : u.isBanned ? "Unban" : "Ban"}
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteUser(u._id, u.username)}
                              disabled={isDisabled}
                              className="admin-btn admin-btn--danger !py-1.5 !px-2.5"
                            >
                              🗑️
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

      {/* ═══ CREATE USER GLASS MODAL ═══ */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#000]/70 backdrop-blur-sm" onClick={() => setIsCreateOpen(false)} />
          <div className="relative z-10 glass-card w-full max-w-lg p-7 border border-purple-500/25 bg-[#0f0b24]/95 animate-fadeIn">
            <h2 className="text-xl font-black text-white mb-1">Add New Creator</h2>
            <p className="text-xs text-text-secondary mb-6">Manually initialize a new user profile inside database</p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group flex flex-col gap-1.5">
                  <label className="text-xs text-text-secondary font-bold">Nickname/Name</label>
                  <input
                    type="text"
                    name="nickname"
                    value={formData.nickname}
                    onChange={handleTextChange}
                    required
                    placeholder="E.g. Jhon Doe"
                    className="input-field !py-2.5 !px-3.5 !text-sm"
                  />
                </div>
                <div className="form-group flex flex-col gap-1.5">
                  <label className="text-xs text-text-secondary font-bold">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleTextChange}
                    required
                    placeholder="jhondoe"
                    className="input-field !py-2.5 !px-3.5 !text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group flex flex-col gap-1.5">
                  <label className="text-xs text-text-secondary font-bold">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleTextChange}
                    required
                    placeholder="jhon@gmail.com"
                    className="input-field !py-2.5 !px-3.5 !text-sm"
                  />
                </div>
                <div className="form-group flex flex-col gap-1.5">
                  <label className="text-xs text-text-secondary font-bold">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleTextChange}
                    required
                    placeholder="******"
                    className="input-field !py-2.5 !px-3.5 !text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group flex flex-col gap-1.5">
                  <label className="text-xs text-text-secondary font-bold">System Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleTextChange}
                    className="input-field !py-2.5 !px-3.5 !text-sm"
                  >
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group flex flex-col gap-1.5">
                  <label className="text-xs text-text-secondary font-bold">Creator Tier</label>
                  <select
                    name="tier"
                    value={formData.tier}
                    onChange={handleTextChange}
                    className="input-field !py-2.5 !px-3.5 !text-sm"
                  >
                    <option value="bronze">🥉 Bronze</option>
                    <option value="silver">🥈 Silver</option>
                    <option value="gold">🥇 Gold</option>
                    <option value="diamond">💎 Diamond</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/[0.04]">
                <div className="form-group flex flex-col gap-1.5">
                  <label className="text-xs text-text-secondary font-bold">Initial Campaign Balance ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="campaignBalance"
                    value={formData.campaignBalance}
                    onChange={handleNumChange}
                    className="input-field !py-2.5 !px-3.5 !text-sm"
                  />
                </div>
                <div className="form-group flex flex-col gap-1.5">
                  <label className="text-xs text-text-secondary font-bold">Initial Referral Balance ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="referralBalance"
                    value={formData.referralBalance}
                    onChange={handleNumChange}
                    className="input-field !py-2.5 !px-3.5 !text-sm"
                  />
                </div>
              </div>

              {formError && (
                <div className="error-message">
                  <span>❌</span>
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t border-white/[0.04]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="admin-btn admin-btn--ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="admin-btn admin-btn--accent !py-2.5 !px-6"
                >
                  {formSubmitting ? "⏳ Creating..." : "🚀 Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ DETAILED EDIT USER GLASS MODAL ═══ */}
      {isEditOpen && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fadeIn">
          <div className="fixed inset-0 bg-[#000]/70 backdrop-blur-sm" onClick={() => setIsEditOpen(false)} />
          <div className="relative z-10 glass-card w-full max-w-lg border border-purple-500/25 bg-[#0f0b24]/95 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-white/[0.04]">
              <h2 className="text-xl font-black text-white">Edit Creator Profile</h2>
              <p className="text-xs text-text-secondary mt-0.5">Editing: <span className="text-accent-light font-mono">@{selectedUser.username}</span></p>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-white/[0.04] bg-[#07050f]/30 px-6 py-1">
              {[
                { id: "profile", label: "Profile" },
                { id: "balances", label: "Balances" },
                { id: "stats", label: "Metrics" },
                { id: "badges", label: "Badges" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setEditFormTab(tab.id as any)}
                  className={cn(
                    "py-3 px-4 text-xs font-bold transition-all border-b-2 border-transparent text-text-secondary hover:text-white",
                    editFormTab === tab.id && "border-purple-500 text-purple-400"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Content */}
            <form onSubmit={handleEditSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                
                {/* ─ TAB 1: Profile ─ */}
                {editFormTab === "profile" && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="form-group flex flex-col gap-1">
                        <label className="text-xs text-text-secondary font-bold">Nickname</label>
                        <input
                          type="text"
                          name="nickname"
                          value={formData.nickname}
                          onChange={handleTextChange}
                          required
                          className="input-field"
                        />
                      </div>
                      <div className="form-group flex flex-col gap-1">
                        <label className="text-xs text-text-secondary font-bold">Username</label>
                        <input
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleTextChange}
                          required
                          className="input-field font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="form-group flex flex-col gap-1">
                        <label className="text-xs text-text-secondary font-bold">Email Address</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleTextChange}
                          required
                          className="input-field"
                        />
                      </div>
                      <div className="form-group flex flex-col gap-1">
                        <label className="text-xs text-text-secondary font-bold">New Password</label>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleTextChange}
                          placeholder="Leave blank to keep same"
                          className="input-field"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="form-group flex flex-col gap-1">
                        <label className="text-xs text-text-secondary font-bold">System Role</label>
                        <select
                          name="role"
                          value={formData.role}
                          onChange={handleTextChange}
                          className="input-field"
                        >
                          <option value="user">User</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div className="form-group flex flex-col gap-1">
                        <label className="text-xs text-text-secondary font-bold">Creator Tier</label>
                        <select
                          name="tier"
                          value={formData.tier}
                          onChange={handleTextChange}
                          className="input-field"
                        >
                          <option value="bronze">Bronze</option>
                          <option value="silver">Silver</option>
                          <option value="gold">Gold</option>
                          <option value="diamond">Diamond</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─ TAB 2: Balances ─ */}
                {editFormTab === "balances" && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="form-group flex flex-col gap-1">
                      <label className="text-xs text-text-secondary font-bold">Campaign Wallet Balance ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="campaignBalance"
                        value={formData.campaignBalance}
                        onChange={handleNumChange}
                        className="input-field font-mono"
                      />
                    </div>
                    <div className="form-group flex flex-col gap-1">
                      <label className="text-xs text-text-secondary font-bold">Referral Wallet Balance ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="referralBalance"
                        value={formData.referralBalance}
                        onChange={handleNumChange}
                        className="input-field font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* ─ TAB 3: TikTok Stats ─ */}
                {editFormTab === "stats" && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="form-group flex flex-col gap-1">
                        <label className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Total Videos</label>
                        <input
                          type="number"
                          name="totalVideos"
                          value={formData.stats.totalVideos}
                          onChange={handleStatChange}
                          className="input-field font-mono"
                        />
                      </div>
                      <div className="form-group flex flex-col gap-1">
                        <label className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Total Views</label>
                        <input
                          type="number"
                          name="totalViews"
                          value={formData.stats.totalViews}
                          onChange={handleStatChange}
                          className="input-field font-mono"
                        />
                      </div>
                      <div className="form-group flex flex-col gap-1">
                        <label className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Total Earned ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          name="totalEarned"
                          value={formData.stats.totalEarned}
                          onChange={handleStatChange}
                          className="input-field font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ─ TAB 4: Badges ─ */}
                {editFormTab === "badges" && (
                  <div className="space-y-4 animate-fadeIn">
                    <label className="text-xs text-text-secondary font-bold">Creator Badges</label>
                    <div className="flex flex-wrap gap-2 p-3 bg-[#07050f]/50 border border-white/[0.04] rounded-xl min-h-[60px] items-center">
                      {formData.badges.length === 0 ? (
                        <span className="text-xs text-text-muted">No custom badges assigned.</span>
                      ) : (
                        formData.badges.map((b) => (
                          <span key={b} className="badge badge-music gap-1 text-[10px] font-bold">
                            {b}
                            <button
                              type="button"
                              onClick={() => removeBadge(b)}
                              className="text-error font-bold hover:text-white ml-0.5"
                            >
                              ×
                            </button>
                          </span>
                        ))
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={badgeInput}
                        onChange={(e) => setBadgeInput(e.target.value)}
                        placeholder="new-badge-name"
                        className="input-field !py-2"
                      />
                      <button
                        type="button"
                        onClick={addBadge}
                        className="admin-btn admin-btn--accent !py-2 !px-4"
                      >
                        Add Badge
                      </button>
                    </div>
                  </div>
                )}

                {formError && (
                  <div className="error-message">
                    <span>❌</span>
                    <span>{formError}</span>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="p-6 border-t border-white/[0.04] flex gap-3 justify-end bg-[#07050f]/20">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="admin-btn admin-btn--ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="admin-btn admin-btn--accent !py-2.5 !px-6"
                >
                  {formSubmitting ? "⏳ Saving..." : "💾 Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toast && (
        <div className={cn("admin-toast", toast.type === "success" ? "admin-toast--success" : "admin-toast--error")}>
          <span>{toast.type === "success" ? "✅" : "❌"}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
