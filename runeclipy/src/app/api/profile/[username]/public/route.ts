import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Submission from "@/models/Submission";
import { BADGE_DEFINITIONS } from "@/lib/tier-system";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    await connectDB();
    const { username } = await params;

    const user = await User.findOne({
      username: username.toLowerCase(),
      isDeleted: { $ne: true },
      isBanned: { $ne: true },
    })
      .select("username nickname tier badges stats memberSince avatar createdAt")
      .lean();

    if (!user) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    const TIER_EMOJI: Record<string, string> = {
      bronze: "🥉",
      silver: "🥈",
      gold: "🥇",
      diamond: "💎",
    };

    const badgeMap = Object.fromEntries(BADGE_DEFINITIONS.map((b) => [b.id, b]));

    // Get recent approved submissions
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

    // Get rank
    const allCreators = await Submission.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: "$userId", totalViews: { $sum: "$views" } } },
      { $sort: { totalViews: -1 } },
    ]);
    const rankIndex = allCreators.findIndex(
      (c) => c._id.toString() === user._id.toString()
    );
    const rank = rankIndex >= 0 ? rankIndex + 1 : null;

    return NextResponse.json({
      success: true,
      profile: {
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar || "",
        tier: user.tier || "bronze",
        tierLabel: (user.tier || "bronze").charAt(0).toUpperCase() + (user.tier || "bronze").slice(1),
        tierEmoji: TIER_EMOJI[user.tier || "bronze"] || "🥉",
        badges: (user.badges || []).map((id: string) => ({
          id,
          emoji: badgeMap[id]?.emoji || "🏅",
          label: badgeMap[id]?.label || id,
          description: badgeMap[id]?.description || "",
        })),
        memberSince: user.memberSince || user.createdAt,
        stats: {
          totalViews: user.stats?.totalViews || 0,
          totalVideos: user.stats?.totalVideos || 0,
          totalEarned: user.stats?.totalEarned || 0,
        },
        rank,
        totalCreators: allCreators.length,
        recentSubmissions,
      },
    });
  } catch (error) {
    console.error("Public profile error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
