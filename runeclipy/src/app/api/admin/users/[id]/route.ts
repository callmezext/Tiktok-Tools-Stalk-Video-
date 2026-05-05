import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { getSession } from "@/lib/auth";
import { logAdminAction } from "@/lib/activity-log";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const allowed = ["role", "isBanned"];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }
    const user = await User.findByIdAndUpdate(id, update, { new: true });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Log activity
    if ("isBanned" in body) {
      await logAdminAction({
        actor: session.username || "admin", actorId: session.userId as string,
        action: body.isBanned ? "ban_user" : "unban_user",
        target: id, targetType: "user",
        details: `${body.isBanned ? "Banned" : "Unbanned"} user @${user.username}`,
      });
    }
    if ("role" in body) {
      await logAdminAction({
        actor: session.username || "admin", actorId: session.userId as string,
        action: "change_role",
        target: id, targetType: "user",
        details: `Changed role of @${user.username} to "${body.role}"`,
      });
    }

    return NextResponse.json({ success: true, user: { _id: user._id, role: user.role, isBanned: user.isBanned } });
  } catch (error) {
    console.error("Admin user update error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    await connectDB();
    const { id } = await params;

    // Don't allow deleting yourself
    if (id === session.userId) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    // Soft delete
    const user = await User.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    console.log(`[Admin] Soft-deleted user @${user.username} by admin @${session.username}`);

    await logAdminAction({
      actor: session.username || "admin", actorId: session.userId as string,
      action: "delete_user",
      target: id, targetType: "user",
      details: `Soft-deleted user @${user.username} (${user.email})`,
    });

    return NextResponse.json({ success: true, message: `User @${user.username} deleted` });
  } catch (error) {
    console.error("Admin user delete error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
