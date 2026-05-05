import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// Discord OAuth Step 1: Redirect to Discord's consent screen
export async function GET(req: NextRequest) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/auth/discord/callback`;

  if (!clientId) {
    return NextResponse.json({ error: "Discord OAuth not configured" }, { status: 500 });
  }

  // Check if this is a "bind" action (user already logged in)
  const session = await getSession();
  const state = session.isLoggedIn ? "bind" : "login";

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify email",
    state,
    prompt: "consent",
  });

  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`;

  return NextResponse.redirect(discordAuthUrl);
}
