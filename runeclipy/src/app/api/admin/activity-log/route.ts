import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import ActivityLog from "@/models/ActivityLog";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 50;
  const action = searchParams.get("action") || "";

  await connectDB();

  const filter: Record<string, unknown> = {};
  if (action) filter.action = action;

  const [logs, total] = await Promise.all([
    ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ActivityLog.countDocuments(filter),
  ]);

  return NextResponse.json({
    success: true,
    logs,
    total,
    pages: Math.ceil(total / limit),
    page,
  });
}
