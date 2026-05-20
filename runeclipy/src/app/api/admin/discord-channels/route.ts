import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import SiteSetting from "@/models/SiteSetting";

// GET — list text channels from Discord guild
export async function GET() {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const settings: any = await SiteSetting.findOne().lean();
    const token = settings?.discordBotToken || process.env.DISCORD_BOT_TOKEN || "";
    const guildId = settings?.discordGuildId || process.env.DISCORD_GUILD_ID || "";

    if (!token) {
      console.warn("[Discord Channels] No bot token found in DB or env");
      return NextResponse.json({ success: false, error: "DISCORD_BOT_TOKEN not configured. Add it in Vercel environment variables.", channels: [] }, { status: 200 });
    }
    if (!guildId) {
      console.warn("[Discord Channels] No guild ID found in DB or env");
      return NextResponse.json({ success: false, error: "DISCORD_GUILD_ID not configured. Add it in Vercel environment variables.", channels: [] }, { status: 200 });
    }

    const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
      headers: { Authorization: `Bot ${token}` },
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Discord API: ${err}` }, { status: res.status });
    }

    const channels = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const textChannels = (channels as any[])
      .filter((c) => c.type === 0)
      .sort((a, b) => a.position - b.position)
      .map((c) => ({ id: c.id, name: c.name, position: c.position }));

    return NextResponse.json({ success: true, channels: textChannels });
  } catch (error) {
    console.error("[Discord Channels]", error);
    return NextResponse.json({ error: "Failed to fetch channels" }, { status: 500 });
  }
}
