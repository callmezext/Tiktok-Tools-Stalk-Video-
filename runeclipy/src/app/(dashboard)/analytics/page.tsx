"use client";

import { useState, useEffect } from "react";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface Summary {
  totalEarned: number;
  totalViews: number;
  totalVideos: number;
  pendingEarnings: number;
  balance: number;
}

interface ChartPoint {
  date: string;
  earned: number;
  views: number;
  count: number;
}

interface CampaignBreakdown {
  campaignId: string;
  title: string;
  type: string;
  earned: number;
  views: number;
  count: number;
  percentage: number;
}

interface RecentSubmission {
  _id: string;
  campaignTitle: string;
  campaignType: string;
  videoUrl: string;
  views: number;
  earned: number;
  status: string;
  createdAt: string;
}

const PERIODS = [
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "all", label: "All Time" },
];

const PIE_COLORS = ["#8B5CF6", "#EC4899", "#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#6366F1", "#14B8A6", "#F97316", "#A855F7"];

const statusConfig: Record<string, { label: string; class: string }> = {
  pending: { label: "Pending", class: "bg-warning/15 text-warning" },
  approved: { label: "Approved", class: "bg-success/15 text-success" },
  rejected: { label: "Rejected", class: "bg-error/15 text-error" },
  paid_out: { label: "Paid Out", class: "bg-info/15 text-info" },
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card !p-3 !rounded-lg text-xs !border-border-hover">
      <p className="font-semibold text-text-primary mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {entry.name === "Earned" ? formatCurrency(entry.value) : formatNumber(entry.value)}
        </p>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [campaignBreakdown, setCampaignBreakdown] = useState<CampaignBreakdown[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics/earnings?period=${period}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setSummary(data.summary);
          setChartData(data.chartData);
          setCampaignBreakdown(data.campaignBreakdown);
          setRecentSubmissions(data.recentSubmissions);
        }
      })
      .finally(() => setLoading(false));
  }, [period]);

  if (loading && !summary) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">ANALYTICS</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="admin-stat-card animate-pulse">
              <div className="h-4 bg-bg-tertiary rounded w-1/2 mb-3" />
              <div className="h-8 bg-bg-tertiary rounded w-3/4" />
            </div>
          ))}
        </div>
        <div className="glass-card h-80 animate-pulse" />
      </div>
    );
  }

  const statCards = [
    { label: "Total Earned", value: formatCurrency(summary?.totalEarned || 0), icon: "💰", color: "text-success" },
    { label: "Total Views", value: formatNumber(summary?.totalViews || 0), icon: "👁️", color: "text-info" },
    { label: "Total Videos", value: String(summary?.totalVideos || 0), icon: "🎬", color: "text-accent-light" },
    { label: "Pending", value: formatCurrency(summary?.pendingEarnings || 0), icon: "⏳", color: "text-warning" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">ANALYTICS</h1>
        <div className="flex gap-1 p-1 bg-bg-secondary rounded-xl border border-border">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                period === p.value
                  ? "bg-accent/20 text-accent-light"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card, i) => (
          <div key={card.label} className="admin-stat-card admin-grid-item" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">{card.label}</span>
              <span className="text-lg">{card.icon}</span>
            </div>
            <div className={cn("text-2xl font-extrabold font-mono", card.color)}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {/* Earnings Area Chart */}
        <div className="glass-card p-5 lg:col-span-2">
          <h3 className="text-sm font-bold mb-4">📈 Earnings Over Time</h3>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-text-muted text-sm">
              No earnings data for this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="earnGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#6B7280", fontSize: 10 }}
                  tickFormatter={(v) => v.slice(5)}
                  axisLine={{ stroke: "#1E293B" }}
                />
                <YAxis
                  tick={{ fill: "#6B7280", fontSize: 10 }}
                  tickFormatter={(v) => `$${v}`}
                  axisLine={{ stroke: "#1E293B" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="earned"
                  name="Earned"
                  stroke="#A78BFA"
                  fill="url(#earnGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Campaign Breakdown Pie */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold mb-4">🎯 By Campaign</h3>
          {campaignBreakdown.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-text-muted text-sm">
              No campaign data yet
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={campaignBreakdown}
                    dataKey="earned"
                    nameKey="title"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {campaignBreakdown.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value || 0))}
                    contentStyle={{
                      background: "#111827",
                      border: "1px solid #1E293B",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {campaignBreakdown.slice(0, 5).map((c, i) => (
                  <div key={c.campaignId} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-text-secondary truncate flex-1">{c.title}</span>
                    <span className="text-text-muted font-mono">{c.percentage}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Views Bar Chart */}
      {chartData.length > 0 && (
        <div className="glass-card p-5 mb-6">
          <h3 className="text-sm font-bold mb-4">👁️ Views Over Time</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#6B7280", fontSize: 10 }}
                tickFormatter={(v) => v.slice(5)}
                axisLine={{ stroke: "#1E293B" }}
              />
              <YAxis
                tick={{ fill: "#6B7280", fontSize: 10 }}
                tickFormatter={(v) => formatNumber(v)}
                axisLine={{ stroke: "#1E293B" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="views" name="Views" radius={[4, 4, 0, 0]} fill="#EC4899" fillOpacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Submissions Table */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-bold mb-4">📋 Recent Submissions</h3>
        {recentSubmissions.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">📤</div>
            <p className="admin-empty-text">No submissions yet. Start by submitting a video!</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Views</th>
                  <th>Earned</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentSubmissions.map((sub) => {
                  const st = statusConfig[sub.status] || { label: sub.status, class: "" };
                  return (
                    <tr key={sub._id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className={`badge badge-${sub.campaignType} !py-0.5 !px-1.5 !text-[9px]`}>
                            {sub.campaignType}
                          </span>
                          <span className="font-medium text-sm truncate max-w-[200px]">{sub.campaignTitle}</span>
                        </div>
                      </td>
                      <td className="font-mono text-text-secondary">{formatNumber(sub.views)}</td>
                      <td className="font-mono font-bold text-success">{formatCurrency(sub.earned)}</td>
                      <td>
                        <span className={cn("badge !text-[10px]", st.class)}>{st.label}</span>
                      </td>
                      <td className="text-text-muted text-xs">
                        {new Date(sub.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
