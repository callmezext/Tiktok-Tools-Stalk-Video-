import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import LinkToken from "@/models/LinkToken";

// POST — Link Discord via token from bot /link command
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await req.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ success: false, error: "Token is required" }, { status: 400 });
    }

    await connectDB();

    // Find valid token
    const linkToken = await LinkToken.findOne({
      token: token.trim(),
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!linkToken) {
      return NextResponse.json({ success: false, error: "Invalid or expired token. Generate a new one with /link in Discord." }, { status: 400 });
    }

    // Check if Discord account already linked to another user
    const existingUser = await User.findOne({ discordId: linkToken.discordId });
    if (existingUser && existingUser._id.toString() !== session.userId) {
      return NextResponse.json({ success: false, error: "This Discord account is already linked to another user." }, { status: 400 });
    }

    // Link the Discord account
    await User.updateOne(
      { _id: session.userId },
      { $set: { discordId: linkToken.discordId, discordUsername: linkToken.discordUsername } }
    );

    // Mark token as used
    linkToken.used = true;
    await linkToken.save();

    return NextResponse.json({
      success: true,
      discordUsername: linkToken.discordUsername,
      message: "Discord account linked successfully!",
    });
  } catch (error) {
    console.error("Link Discord error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
