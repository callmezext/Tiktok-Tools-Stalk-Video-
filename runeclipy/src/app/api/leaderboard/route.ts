import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import Submission from "@/models/Submission";
import User from "@/models/User";
import { censorUsername } from "@/lib/utils";
import { BADGE_DEFINITIONS } from "@/lib/tier-system";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    const currentUserId = session.isLoggedIn ? session.userId : null;

    await connectDB();

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "month";
    const sort = searchParams.get("sort") || "views";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 50;

    // Date filter
    const now = new Date();
    let dateFilter: Record<string, unknown> = {};
    if (period === "week") {
      dateFilter = { createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
    } else if (period === "month") {
      dateFilter = { createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } };
    }
    // "all" = no date filter

    // Sort field
    const sortField = sort === "earnings" ? "totalEarned" : sort === "videos" ? "totalVideos" : "totalViews";

    // Aggregate leaderboard
    const leaderboard = await Submission.aggregate([
      { $match: { status: "approved", ...dateFilter } },
      {
        $group: {
          _id: "$userId",
          totalViews: { $sum: "$views" },
          totalEarned: { $sum: "$earned" },
          totalVideos: { $sum: 1 },
        },
      },
      { $sort: { [sortField]: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          username: "$user.username",
          tier: "$user.tier",
          badges: "$user.badges",
          totalViews: 1,
          totalEarned: { $round: ["$totalEarned", 2] },
          totalVideos: 1,
        },
      },
    ]);

    // Map badges to emoji + censor usernames
    const badgeMap = Object.fromEntries(BADGE_DEFINITIONS.map((b) => [b.id, b]));
    const TIER_EMOJI: Record<string, string> = {
      bronze: "🥉",
      silver: "🥈",
      gold: "🥇",
      diamond: "💎",
    };

    const results = leaderboard.map((entry, index) => ({
      rank: (page - 1) * limit + index + 1,
      username: censorUsername(entry.username),
      tier: entry.tier || "bronze",
      tierEmoji: TIER_EMOJI[entry.tier || "bronze"] || "🥉",
      badges: (entry.badges || []).slice(0, 5).map((id: string) => ({
        id,
        emoji: badgeMap[id]?.emoji || "🏅",
        label: badgeMap[id]?.label || id,
      })),
      totalViews: entry.totalViews,
      totalEarned: entry.totalEarned,
      totalVideos: entry.totalVideos,
      isCurrentUser: currentUserId ? entry.userId.toString() === currentUserId : false,
    }));

    // Find current user's rank if logged in
    let currentUserRank = null;
    if (currentUserId && !results.some((r) => r.isCurrentUser)) {
      const userRankAgg = await Submission.aggregate([
        { $match: { status: "approved", ...dateFilter } },
        {
          $group: {
            _id: "$userId",
            totalViews: { $sum: "$views" },
            totalEarned: { $sum: "$earned" },
            totalVideos: { $sum: 1 },
          },
        },
        { $sort: { [sortField]: -1 } },
        {
          $group: {
            _id: null,
            entries: { $push: { userId: "$_id", value: `$${sortField}` } },
          },
        },
      ]);

      if (userRankAgg.length > 0) {
        const entries = userRankAgg[0].entries;
        const idx = entries.findIndex((e: { userId: { toString: () => string } }) => e.userId.toString() === currentUserId);
        if (idx >= 0) currentUserRank = idx + 1;
      }
    }

    // Count total participants
    const totalCount = await Submission.aggregate([
      { $match: { status: "approved", ...dateFilter } },
      { $group: { _id: "$userId" } },
      { $count: "total" },
    ]);

    return NextResponse.json({
      success: true,
      leaderboard: results,
      currentUserRank: results.find((r) => r.isCurrentUser)?.rank || currentUserRank,
      totalParticipants: totalCount[0]?.total || 0,
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
