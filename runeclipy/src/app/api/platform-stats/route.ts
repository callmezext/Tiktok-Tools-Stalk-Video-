import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Campaign from "@/models/Campaign";
import Submission from "@/models/Submission";

// Public API — no auth required
// Returns aggregated platform stats for landing page social proof
export async function GET() {
  try {
    await connectDB();

    const [totalCreators, totalCampaigns, totalPaidOut] = await Promise.all([
      User.countDocuments({ isDeleted: { $ne: true } }),
      Campaign.countDocuments(),
      Submission.aggregate([
        { $match: { status: "approved" } },
        { $group: { _id: null, total: { $sum: "$earned" } } },
      ]),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalCreators,
        totalCampaigns,
        totalPaidOut: totalPaidOut[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error("Platform stats error:", error);
    return NextResponse.json({
      success: true,
      stats: { totalCreators: 0, totalCampaigns: 0, totalPaidOut: 0 },
    });
  }
}
