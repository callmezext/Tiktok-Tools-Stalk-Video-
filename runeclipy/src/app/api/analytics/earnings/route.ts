import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import Submission from "@/models/Submission";
import Campaign from "@/models/Campaign";
import User from "@/models/User";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const userId = new mongoose.Types.ObjectId(session.userId);

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "30d";

    // Calculate date range
    const now = new Date();
    let dateFrom: Date;
    switch (period) {
      case "7d":
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "all":
        dateFrom = new Date(0);
        break;
      default: // 30d
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get user stats
    const user = await User.findById(session.userId).select("stats campaignBalance").lean();

    // Pending earnings
    const pendingAgg = await Submission.aggregate([
      { $match: { userId, status: "pending" } },
      { $group: { _id: null, total: { $sum: "$earned" } } },
    ]);
    const pendingEarnings = pendingAgg[0]?.total || 0;

    // Chart data — earnings grouped by day
    const chartData = await Submission.aggregate([
      {
        $match: {
          userId,
          status: "approved",
          createdAt: { $gte: dateFrom },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          earned: { $sum: "$earned" },
          views: { $sum: "$views" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: "$_id",
          earned: { $round: ["$earned", 2] },
          views: 1,
          count: 1,
        },
      },
    ]);

    // Campaign breakdown — earnings per campaign
    const campaignBreakdown = await Submission.aggregate([
      { $match: { userId, status: "approved" } },
      {
        $group: {
          _id: "$campaignId",
          earned: { $sum: "$earned" },
          views: { $sum: "$views" },
          count: { $sum: 1 },
        },
      },
      { $sort: { earned: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "campaigns",
          localField: "_id",
          foreignField: "_id",
          as: "campaign",
        },
      },
      { $unwind: { path: "$campaign", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          campaignId: "$_id",
          title: { $ifNull: ["$campaign.title", "Unknown Campaign"] },
          type: { $ifNull: ["$campaign.type", "music"] },
          earned: { $round: ["$earned", 2] },
          views: 1,
          count: 1,
        },
      },
    ]);

    // Calculate percentages for breakdown
    const totalEarnedFromBreakdown = campaignBreakdown.reduce((a, b) => a + b.earned, 0);
    const breakdownWithPercent = campaignBreakdown.map((c) => ({
      ...c,
      percentage: totalEarnedFromBreakdown > 0
        ? Math.round((c.earned / totalEarnedFromBreakdown) * 100)
        : 0,
    }));

    // Recent submissions
    const recentSubmissions = await Submission.aggregate([
      { $match: { userId } },
      { $sort: { createdAt: -1 } },
      { $limit: 10 },
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
          _id: 1,
          campaignTitle: { $ifNull: ["$campaign.title", "Unknown"] },
          campaignType: { $ifNull: ["$campaign.type", "music"] },
          videoUrl: 1,
          views: 1,
          earned: { $round: ["$earned", 2] },
          status: 1,
          createdAt: 1,
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      summary: {
        totalEarned: user?.stats?.totalEarned || 0,
        totalViews: user?.stats?.totalViews || 0,
        totalVideos: user?.stats?.totalVideos || 0,
        pendingEarnings: Math.round(pendingEarnings * 100) / 100,
        balance: user?.campaignBalance || 0,
      },
      chartData,
      campaignBreakdown: breakdownWithPercent,
      recentSubmissions,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
