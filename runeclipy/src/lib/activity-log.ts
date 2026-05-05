import ActivityLog from "@/models/ActivityLog";
import connectDB from "@/lib/mongodb";

interface LogParams {
  actor: string;
  actorId: string;
  action: string;
  target?: string;
  targetType?: "user" | "submission" | "campaign" | "payout" | "account" | "setting";
  details?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
}

export async function logAdminAction(params: LogParams) {
  try {
    await connectDB();
    await ActivityLog.create(params);
  } catch (err) {
    console.error("[ActivityLog] Failed to log action:", err);
    // Don't throw — logging should never break the main flow
  }
}
