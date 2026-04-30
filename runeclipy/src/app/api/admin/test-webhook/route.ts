import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import SiteSetting from "@/models/SiteSetting";
import axios from "axios";

export async function POST() {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const settings = await SiteSetting.findOne().lean();
    const webhookUrl = settings?.discordWebhookUrl || process.env.DISCORD_WEBHOOK_URL || "";

    if (!webhookUrl) {
      return NextResponse.json({ success: false, error: "No webhook URL configured" }, { status: 400 });
    }

    await axios.post(webhookUrl, {
      content: "",
      embeds: [{
        title: "🧪 Test Notification",
        description: "Webhook is working! This is a test message from **RuneClipy** admin dashboard.",
        color: 0x5865F2,
        footer: { text: "RuneClipy Webhook Test" },
        timestamp: new Date().toISOString(),
      }],
    }, {
      headers: { "Content-Type": "application/json" },
      timeout: 5000,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[TestWebhook] Error:", error);
    return NextResponse.json({ success: false, error: "Webhook test failed" }, { status: 500 });
  }
}
