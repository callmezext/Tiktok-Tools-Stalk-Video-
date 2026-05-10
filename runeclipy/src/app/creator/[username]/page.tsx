import { notFound } from "next/navigation";
import Link from "next/link";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Submission from "@/models/Submission";
import { BADGE_DEFINITIONS } from "@/lib/tier-system";
import type { Metadata } from "next";

const TIER_EMOJI: Record<string, string> = {
  bronze: "🥉", silver: "🥈", gold: "🥇", diamond: "💎",
};

const TIER_GRADIENT: Record<string, string> = {
  bronze: "from-amber-700 to-amber-500",
  silver: "from-gray-400 to-gray-300",
  gold: "from-yellow-500 to-amber-400",
  diamond: "from-cyan-400 to-blue-500",
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
}

function formatCurrency(n: number): string {
  return "$" + n.toFixed(2);
}

export async function generateMetadata(
  { params }: { params: Promise<{ username: string }> }
): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `@${username} — RuneClipy Creator`,
    description: `Check out @${username}'s creator profile on RuneClipy.`,
    openGraph: {
      title: `@${username} — RuneClipy Creator`,
      description: `View stats, tier, and badges for @${username} on RuneClipy.`,
    },
  };
}

export default async function PublicCreatorProfile(
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  await connectDB();

  const user = await User.findOne({
    username: username.toLowerCase(),
    isDeleted: { $ne: true },
    isBanned: { $ne: true },
  })
    .select("username nickname tier badges stats memberSince avatar createdAt")
    .lean();

  if (!user) notFound();

  const tier = user.tier || "bronze";
  const badgeMap = Object.fromEntries(BADGE_DEFINITIONS.map((b) => [b.id, b]));

  // Recent approved submissions
  const recentSubmissions = await Submission.aggregate([
    { $match: { userId: user._id, status: "approved" } },
    { $sort: { createdAt: -1 } },
    { $limit: 6 },
    {
      $lookup: {
        from: "campaigns",
        localField: "campaignId",
        foreignField: "_id",
        as: "campaign",
      },
    },
    { $unwind: { path: "$campaign", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        campaignTitle: { $ifNull: ["$campaign.title", "Unknown Campaign"] },
        campaignType: { $ifNull: ["$campaign.type", "music"] },
        views: 1,
        earned: { $round: ["$earned", 2] },
        createdAt: 1,
      },
    },
  ]);

  // Rank
  const allCreators = await Submission.aggregate([
    { $match: { status: "approved" } },
    { $group: { _id: "$userId", totalViews: { $sum: "$views" } } },
    { $sort: { totalViews: -1 } },
  ]);
  const rankIndex = allCreators.findIndex(
    (c) => c._id.toString() === user._id.toString()
  );
  const rank = rankIndex >= 0 ? rankIndex + 1 : null;

  const memberDate = new Date(user.memberSince || user.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const badges = (user.badges || []).map((id: string) => ({
    id,
    emoji: badgeMap[id]?.emoji || "🏅",
    label: badgeMap[id]?.label || id,
    description: badgeMap[id]?.description || "",
  }));

  const statItems = [
    { label: "Views", value: formatNumber(user.stats?.totalViews || 0), icon: "👁️" },
    { label: "Videos", value: String(user.stats?.totalVideos || 0), icon: "🎬" },
    { label: "Earned", value: formatCurrency(user.stats?.totalEarned || 0), icon: "💰" },
    ...(rank ? [{ label: "Rank", value: `#${rank}`, icon: "🏆" }] : []),
  ];

  return (
    <main className="min-h-screen bg-bg-primary relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-accent/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-pink/5 blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-5 max-w-4xl mx-auto">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl group-hover:scale-110 transition-transform">🔮</span>
          <span className="text-lg font-bold gradient-text tracking-wider">RuneClipy</span>
        </Link>
        <Link href="/register" className="btn-gradient text-sm !py-2 !px-5 !rounded-xl">
          Join Now
        </Link>
      </nav>

      {/* Profile Card */}
      <div className="relative z-10 max-w-2xl mx-auto px-6 py-10 animate-fadeInUp">
        <div className="glass-card p-8 sm:p-10 text-center">
          {/* Avatar */}
          <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${TIER_GRADIENT[tier] || TIER_GRADIENT.bronze} flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4 shadow-lg`}>
            {(user.nickname || user.username).charAt(0).toUpperCase()}
          </div>

          {/* Username */}
          <h1 className="text-2xl font-extrabold mb-1">
            {user.nickname || user.username}
          </h1>
          <p className="text-text-muted text-sm mb-3">@{user.username}</p>

          {/* Tier Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-bg-tertiary border border-border text-sm font-medium mb-2">
            <span className="text-lg">{TIER_EMOJI[tier] || "🥉"}</span>
            <span>{tier.charAt(0).toUpperCase() + tier.slice(1)} Creator</span>
          </div>

          <p className="text-text-muted text-xs mb-6">Member since {memberDate}</p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {statItems.map((s) => (
              <div key={s.label} className="bg-bg-primary/50 rounded-xl p-4 border border-border/50">
                <div className="text-lg mb-1">{s.icon}</div>
                <div className="text-xl font-extrabold font-mono gradient-text">{s.value}</div>
                <div className="text-[10px] text-text-muted uppercase tracking-wider mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Badges */}
          {badges.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs uppercase tracking-wider text-text-muted font-semibold mb-3">Badges</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {badges.map((b: { id: string; emoji: string; label: string; description: string }) => (
                  <div
                    key={b.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-tertiary border border-border text-xs font-medium hover:border-accent/30 transition-colors"
                    title={b.description}
                  >
                    <span>{b.emoji}</span>
                    <span>{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Videos */}
          {recentSubmissions.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-wider text-text-muted font-semibold mb-3">
                Recent Approved Videos
              </h3>
              <div className="space-y-2 text-left">
                {recentSubmissions.map((sub: { campaignTitle: string; campaignType: string; views: number; earned: number; createdAt: string }, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-bg-primary/50 border border-border/50 hover:border-border-hover transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`badge badge-${sub.campaignType} !py-0.5 !px-1.5 !text-[9px] flex-shrink-0`}>
                        {sub.campaignType}
                      </span>
                      <span className="text-sm font-medium truncate">{sub.campaignTitle}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs flex-shrink-0 ml-3">
                      <span className="text-text-muted">{formatNumber(sub.views)} views</span>
                      <span className="font-bold text-success font-mono">{formatCurrency(sub.earned)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="text-center mt-8">
          <p className="text-text-muted text-sm mb-3">Want to earn like {user.nickname || user.username}?</p>
          <Link href="/register" className="btn-gradient text-sm !py-3 !px-8 !rounded-xl inline-flex items-center gap-2">
            🔮 Join RuneClipy
          </Link>
        </div>
      </div>
    </main>
  );
}
