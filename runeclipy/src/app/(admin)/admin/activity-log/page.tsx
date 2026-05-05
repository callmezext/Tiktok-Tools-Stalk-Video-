"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface LogEntry {
  _id: string;
  actor: string;
  action: string;
  targetType?: string;
  details?: string;
  createdAt: string;
}

const actionIcons: Record<string, string> = {
  approve_submission: "✅",
  reject_submission: "❌",
  ban_user: "🚫",
  unban_user: "🔓",
  change_role: "👑",
  delete_user: "🗑️",
  create_campaign: "🎵",
  edit_campaign: "✏️",
  delete_campaign: "🗑️",
  duplicate_campaign: "📋",
  process_payout: "💸",
  reject_payout: "❌",
  update_settings: "⚙️",
  approve_account: "🔗",
  reject_account: "🔗",
  bulk_approve: "⚡",
  bulk_reject: "⚡",
  login: "🔐",
};

const actionColors: Record<string, string> = {
  approve_submission: "text-success",
  reject_submission: "text-error",
  ban_user: "text-error",
  unban_user: "text-success",
  delete_user: "text-error",
  create_campaign: "text-accent-light",
  process_payout: "text-success",
  reject_payout: "text-error",
  bulk_approve: "text-success",
  bulk_reject: "text-error",
};

function timeAgo(date: Date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("id-ID");
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/activity-log?page=${page}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setLogs(d.logs);
          setTotalPages(d.pages);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="animate-fadeIn">
      <div className="admin-page-header">
        <h1>📋 Activity Log</h1>
        <p>Audit trail of all admin actions</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="admin-shimmer h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon">📋</div>
          <p className="admin-empty-text">No activity recorded yet</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log._id} className="glass-card p-3 sm:p-4 flex items-start gap-3">
                <span className="text-lg sm:text-xl flex-shrink-0 mt-0.5">
                  {actionIcons[log.action] || "📌"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="text-sm font-semibold">@{log.actor}</span>
                    <span className={cn(
                      "text-xs font-medium",
                      actionColors[log.action] || "text-text-secondary"
                    )}>
                      {log.action.replace(/_/g, " ")}
                    </span>
                    {log.targetType && (
                      <span className="badge text-[9px] bg-bg-tertiary text-text-muted">{log.targetType}</span>
                    )}
                  </div>
                  {log.details && (
                    <p className="text-xs text-text-muted mt-1 truncate">{log.details}</p>
                  )}
                </div>
                <span className="text-[10px] text-text-muted flex-shrink-0 whitespace-nowrap">
                  {timeAgo(new Date(log.createdAt))}
                </span>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="admin-btn admin-btn--ghost"
              >
                ← Prev
              </button>
              <span className="text-sm text-text-muted">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="admin-btn admin-btn--ghost"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
