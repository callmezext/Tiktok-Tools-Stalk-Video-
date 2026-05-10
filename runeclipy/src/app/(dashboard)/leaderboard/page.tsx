"use client";

import { useState, useEffect } from "react";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";

interface LeaderboardEntry {
  rank: number;
  username: string;
  tier: string;
  tierEmoji: string;
  badges: { id: string; emoji: string; label: string }[];
  totalViews: number;
  totalEarned: number;
  totalVideos: number;
  isCurrentUser: boolean;
}

const PERIODS = [
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "all", label: "All Time" },
];

const SORT_OPTIONS = [
  { value: "views", label: "Views" },
  { value: "earnings", label: "Earnings" },
  { value: "videos", label: "Videos" },
];

const TROPHY_COLORS = ["trophy-gold", "trophy-silver", "trophy-bronze"];
const TROPHY_ICONS = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const [period, setPeriod] = useState("month");
  const [sort, setSort] = useState("views");
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [totalParticipants, setTotalParticipants] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?period=${period}&sort=${sort}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setEntries(data.leaderboard);
          setCurrentUserRank(data.currentUserRank);
          setTotalParticipants(data.totalParticipants);
        }
      })
      .finally(() => setLoading(false));
  }, [period, sort]);

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  // Reorder top 3 for podium display: [2nd, 1st, 3rd]
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;

  const getSortValue = (e: LeaderboardEntry) => {
    if (sort === "earnings") return formatCurrency(e.totalEarned);
    if (sort === "videos") return `${e.totalVideos} videos`;
    return formatNumber(e.totalViews) + " views";
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">🏆 LEADERBOARD</h1>
          <p className="text-text-muted text-sm mt-1">{totalParticipants} creators competing</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="input-field !w-auto !py-2 !px-3 text-sm"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Period Tabs */}
      <div className="flex gap-1 p-1 bg-bg-secondary rounded-xl border border-border w-fit mb-8">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              period === p.value
                ? "bg-accent/20 text-accent-light"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="flex justify-center gap-4 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass-card w-40 h-52 animate-pulse" />
            ))}
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-card h-16 animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon">🏆</div>
          <p className="admin-empty-text">No participants yet for this period.</p>
        </div>
      ) : (
        <>
          {/* Podium — Top 3 */}
          {top3.length >= 3 && (
            <div className="flex justify-center items-end gap-3 sm:gap-5 mb-10 px-2">
              {podiumOrder.map((entry, i) => {
                const isFirst = i === 1; // center = rank 1
                const rankIndex = isFirst ? 0 : i === 0 ? 1 : 2;
                return (
                  <div
                    key={entry.rank}
                    className={cn(
                      "glass-card text-center transition-all admin-grid-item flex flex-col items-center",
                      isFirst
                        ? "p-5 sm:p-6 w-36 sm:w-44 border-warning/30 animate-pulse-glow"
                        : "p-4 sm:p-5 w-28 sm:w-36"
                    )}
                    style={{ animationDelay: `${rankIndex * 100}ms` }}
                  >
                    {/* Trophy */}
                    <span className={cn("text-3xl sm:text-4xl mb-2", isFirst && "text-5xl sm:text-5xl")}>
                      {TROPHY_ICONS[rankIndex]}
                    </span>

                    {/* Avatar */}
                    <div className={cn(
                      "rounded-full bg-gradient-to-br from-accent to-pink flex items-center justify-center font-bold text-white mx-auto mb-2",
                      isFirst ? "w-14 h-14 text-lg" : "w-10 h-10 text-sm"
                    )}>
                      {entry.username.charAt(0).toUpperCase()}
                    </div>

                    {/* Username */}
                    <p className={cn(
                      "font-bold truncate w-full",
                      isFirst ? "text-sm" : "text-xs",
                      entry.isCurrentUser && "text-accent-light"
                    )}>
                      {entry.username}
                      {entry.isCurrentUser && <span className="text-[9px] ml-1 text-accent-light">(You)</span>}
                    </p>

                    {/* Tier */}
                    <p className="text-xs text-text-muted mt-0.5">
                      {entry.tierEmoji} {entry.tier.charAt(0).toUpperCase() + entry.tier.slice(1)}
                    </p>

                    {/* Value */}
                    <p className={cn(
                      "font-extrabold font-mono mt-2 gradient-text",
                      isFirst ? "text-lg" : "text-sm"
                    )}>
                      {getSortValue(entry)}
                    </p>

                    {/* Badges */}
                    {entry.badges.length > 0 && (
                      <div className="flex gap-0.5 mt-2 justify-center flex-wrap">
                        {entry.badges.slice(0, 3).map((b) => (
                          <span key={b.id} className="text-sm" title={b.label}>{b.emoji}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Current User Rank Banner */}
          {currentUserRank && currentUserRank > 3 && (
            <div className="glass-card !border-accent/20 p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">📍</span>
                <span className="text-sm font-medium">Your rank:</span>
                <span className="text-lg font-extrabold gradient-text">#{currentUserRank}</span>
              </div>
              <span className="text-xs text-text-muted">out of {totalParticipants} creators</span>
            </div>
          )}

          {/* Table — Rank 4+ */}
          {rest.length > 0 && (
            <div className="glass-card p-0 overflow-hidden">
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th className="w-16">Rank</th>
                      <th>Creator</th>
                      <th>Tier</th>
                      <th>Views</th>
                      <th>Earned</th>
                      <th>Videos</th>
                      <th>Badges</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rest.map((entry) => (
                      <tr
                        key={entry.rank}
                        className={cn(entry.isCurrentUser && "!bg-accent/5")}
                      >
                        <td>
                          <span className="font-mono font-bold text-text-muted">#{entry.rank}</span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-pink flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                              {entry.username.charAt(0).toUpperCase()}
                            </div>
                            <span className={cn("font-medium text-sm", entry.isCurrentUser && "text-accent-light")}>
                              {entry.username}
                              {entry.isCurrentUser && <span className="text-[9px] ml-1 text-accent-light">(You)</span>}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="text-sm">{entry.tierEmoji} {entry.tier.charAt(0).toUpperCase() + entry.tier.slice(1)}</span>
                        </td>
                        <td className="font-mono text-text-secondary">{formatNumber(entry.totalViews)}</td>
                        <td className="font-mono font-bold text-success">{formatCurrency(entry.totalEarned)}</td>
                        <td className="font-mono text-text-secondary">{entry.totalVideos}</td>
                        <td>
                          <div className="flex gap-0.5">
                            {entry.badges.slice(0, 4).map((b) => (
                              <span key={b.id} className="text-sm" title={b.label}>{b.emoji}</span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
