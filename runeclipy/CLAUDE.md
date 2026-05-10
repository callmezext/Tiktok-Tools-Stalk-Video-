# RuneClipy — AI Agent Project Guide

> **Read this ENTIRE file before writing ANY code.** Failure to follow these rules will result in broken builds, runtime errors, and wasted time.

---

## 🔮 Project Overview

**RuneClipy** is a TikTok creator monetization platform where brands create campaigns and creators earn money by submitting videos using campaign sounds. Built with:

- **Web App:** Next.js 16 (App Router) + TypeScript + TailwindCSS v4 + MongoDB (Mongoose)
- **Discord Bot:** Standalone Node.js service in `/bot/bot.js` (discord.js v14)
- **TikTok Scraper:** Puppeteer-based profile/video scraper in root `/modules/` and `/server.js`
- **Deployment:** Web → Vercel | Bot → Railway | DB → MongoDB Atlas

---

## ⚠️ CRITICAL: Next.js 16 Breaking Changes

> **This is NOT the Next.js you know from your training data.**

1. **Dynamic Route Params are now async `Promise`:**
   ```typescript
   // ✅ CORRECT — Next.js 16
   export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
     const { id } = await params;
   }

   // ❌ WRONG — This will CRASH
   export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
     const { id } = params; // ERROR: params is a Promise
   }
   ```

2. **`cookies()` is async:**
   ```typescript
   // ✅ CORRECT
   const cookieStore = await cookies();

   // ❌ WRONG
   const cookieStore = cookies();
   ```

3. **Always check `node_modules/next/dist/docs/` for the latest API docs** before using any Next.js API.

---

## 📁 Project Structure

```
runeclipy/
├── bot/                    # Standalone Discord bot (Node.js, NOT TypeScript)
│   ├── bot.js              # Main bot file — runs independently via Railway
│   ├── .env                # Bot-specific env vars
│   └── package.json        # Bot-specific deps (discord.js, mongoose, dotenv)
│
├── src/
│   ├── app/
│   │   ├── (admin)/        # Admin panel — route group, has own layout
│   │   │   ├── admin/      # All admin pages (dashboard, campaigns, users, etc.)
│   │   │   └── layout.tsx  # Admin sidebar layout (checks role === "admin")
│   │   ├── (auth)/         # Auth pages — route group (login, register, forgot-password)
│   │   │   └── layout.tsx  # Centered auth layout
│   │   ├── (dashboard)/    # User dashboard — route group
│   │   │   ├── dashboard/  # Campaign listing
│   │   │   ├── campaigns/  # User submissions
│   │   │   ├── accounts/   # TikTok account management
│   │   │   ├── balance/    # Balance & withdrawals
│   │   │   ├── profile/    # User profile
│   │   │   └── layout.tsx  # Dashboard sidebar + notification bell
│   │   ├── api/            # API routes (15+ route groups)
│   │   ├── campaign/       # Public campaign detail page
│   │   ├── globals.css     # ALL styles (design tokens, components, admin, responsive)
│   │   ├── layout.tsx      # Root layout (Inter font, metadata)
│   │   └── page.tsx        # Landing page (server component with real DB stats)
│   │
│   ├── components/
│   │   └── landing/        # Landing page components (HeroScene 3D, GlitchText)
│   │
│   ├── lib/                # Shared utilities and helpers
│   │   ├── auth.ts         # iron-session config + getSession()
│   │   ├── mongodb.ts      # Mongoose connection with global cache
│   │   ├── utils.ts        # formatCurrency, formatNumber, cn(), slugify, etc.
│   │   ├── rate-limit.ts   # In-memory rate limiter with pre-built configs
│   │   ├── notifications.ts # In-app notification creator
│   │   ├── discord.ts      # Discord webhook notification helpers
│   │   ├── email.ts        # Nodemailer email templates (OTP, welcome, etc.)
│   │   ├── activity-log.ts # Admin action audit logging
│   │   ├── tier-system.ts  # Creator tier (bronze→diamond) + badges
│   │   └── tiktok-*.ts     # TikTok profile/video scraping
│   │
│   └── models/             # Mongoose models (10 models)
│       ├── User.ts         # Users (auth, stats, tier, badges, payment methods)
│       ├── Campaign.ts     # Campaigns (budget, rates, sounds, leaderboard bonuses)
│       ├── Submission.ts   # Video submissions (views, earned, status, review)
│       ├── Transaction.ts  # Financial transactions (payouts, earnings)
│       ├── ConnectedAccount.ts  # TikTok account verifications
│       ├── Notification.ts # In-app notifications
│       ├── ActivityLog.ts  # Admin audit trail
│       ├── BotStatus.ts    # Discord bot remote control state
│       ├── SiteSetting.ts  # Platform-wide settings
│       └── Referral.ts     # Referral tracking
│
├── next.config.ts          # Next.js config (images, three.js transpile)
├── vercel.json             # Vercel cron jobs config
└── .env.local              # Environment variables (NEVER commit to git)
```

---

## 🔒 Authentication Pattern

All API routes use **iron-session** (cookie-based, stateless sessions).

```typescript
import { getSession } from "@/lib/auth";

// Check auth in API routes:
const session = await getSession();
if (!session.isLoggedIn) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// Check admin role:
if (session.role !== "admin") {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// Available session fields:
// session.userId, session.username, session.email, session.role, session.isLoggedIn
```

**Session type definition:**
```typescript
interface SessionData {
  userId: string;
  username: string;
  email: string;
  role: "user" | "admin";
  isLoggedIn: boolean;
}
```

---

## 🗄️ Database Patterns

### Connection
Always call `connectDB()` before any database operation in API routes:
```typescript
import connectDB from "@/lib/mongodb";
await connectDB();
```

### Model Pattern
All models follow this pattern. **NEVER redefine schemas** — always import from `@/models/`:
```typescript
// ✅ CORRECT — import existing model
import User from "@/models/User";
import Campaign from "@/models/Campaign";

// ❌ WRONG — do NOT create inline schemas
const UserSchema = new Schema({...}); // NEVER do this in API routes
```

### Model Registration Pattern
Models use safe re-registration:
```typescript
const User = mongoose.models.User || mongoose.model("User", UserSchema);
```

### Important Model Fields to Know

**User:** `username`, `email`, `role` ("user"|"admin"), `tier` (bronze/silver/gold/diamond), `badges[]`, `stats.totalVideos`, `stats.totalEarned`, `stats.totalViews`, `campaignBalance`, `referralBalance`, `isBanned`, `discordId`, `paymentMethods[]`

**Campaign:** `title`, `slug`, `status` (active/paused/ended), `type` (music/clipping/logo/ugc), `totalBudget`, `budgetUsed`, `ratePerMillionViews`, `earningType` (per_view/per_post/both), `sounds[]`, `leaderboardBonuses[]`, `autoApprove`, `maxSubmissionsPerAccount`

**Submission:** `campaignId`, `userId`, `videoUrl`, `views`, `likes`, `earned`, `status` (pending/approved/rejected/paid_out), `rejectReason`, `reviewedBy`, `reviewedAt`, `soundId`, `tiktokVideoId`

---

## 🎨 Styling Rules

### TailwindCSS v4 — Use `@theme` block
Design tokens are defined in `globals.css` using `@theme {}`, NOT `tailwind.config.js`:
```css
@import "tailwindcss";

@theme {
  --color-bg-primary: #0B0E14;
  --color-accent: #8B5CF6;
  /* etc. */
}
```

### Use Existing CSS Classes
Before creating new styles, check `globals.css` for existing utility classes:

| Class | Purpose |
|-------|---------|
| `.glass-card` | Card with glass morphism effect |
| `.gradient-text` | Purple→pink gradient text |
| `.btn-gradient` | Primary action button |
| `.btn-pink` | Secondary accent button |
| `.input-field` | Form input styling |
| `.badge` + `.badge-*` | Status badges |
| `.progress-bar` + `.progress-fill` | Progress bars |
| `.admin-stat-card` | Admin dashboard stat cards |
| `.admin-table` | Admin data tables |
| `.admin-btn` + `.admin-btn--*` | Admin action buttons (success/danger/warning/accent/ghost) |
| `.admin-nav-item` | Admin sidebar nav items |
| `.admin-filter-tabs` + `.admin-filter-tab` | Tab filter UI |
| `.admin-shimmer` | Skeleton loading |
| `.admin-empty` | Empty state |
| `.admin-toast` + `.admin-toast--*` | Toast notifications |

### Color Palette — Use Tailwind Classes
```
bg-bg-primary (#0B0E14)    bg-bg-secondary (#111827)    bg-bg-tertiary (#1F2937)
text-text-primary (#F9FAFB) text-text-secondary (#9CA3AF)  text-text-muted (#6B7280)
border-border (#1E293B)      border-border-hover (#374151)
text-accent (#8B5CF6)        text-accent-light (#A78BFA)
text-pink (#EC4899)          text-success (#10B981)
text-warning (#F59E0B)       text-error (#EF4444)           text-info (#3B82F6)
```

### Fonts
```
font-sans = Inter (primary)
font-mono = JetBrains Mono (code/numbers)
```

### Animation Classes
```
animate-fadeInUp    animate-fadeIn    animate-slideInLeft    animate-pulse-glow
```

---

## 🛡️ API Route Pattern

### Standard API Route Template
```typescript
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    // ... your logic ...

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### Dynamic Route with Params (CRITICAL — Next.js 16)
```typescript
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;  // MUST await!
}
```

### Admin-Only Route
```typescript
const session = await getSession();
if (!session.isLoggedIn || session.role !== "admin") {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

### Rate Limiting
```typescript
import { rateLimit, getClientIP, RATE_LIMITS } from "@/lib/rate-limit";

const ip = getClientIP(req);
const { limited } = rateLimit(`submit:${ip}`, RATE_LIMITS.submit.max, RATE_LIMITS.submit.window);
if (limited) {
  return NextResponse.json({ error: "Rate limited" }, { status: 429 });
}
```

### With Notifications + Activity Log
```typescript
import { createNotification } from "@/lib/notifications";
import { logAdminAction } from "@/lib/activity-log";

// After action:
await createNotification({
  userId: user._id.toString(),
  type: "submission_approved",
  title: "Approved! 🎉",
  message: "Your video was approved.",
  link: "/campaigns",
});

await logAdminAction({
  actor: session.username,
  actorId: session.userId,
  action: "approve_submission",
  target: submissionId,
  targetType: "submission",
  details: "Description of what happened",
});
```

---

## 🖥️ Frontend Component Patterns

### Page Component (Dashboard — Client)
```typescript
"use client";
import { useState, useEffect } from "react";

export default function SomePage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/some-endpoint")
      .then(r => r.json())
      .then(d => { if (d.success) setData(d.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton />;
  return <div>...</div>;
}
```

### Page Component (Landing — Server)
```typescript
// NO "use client" directive — server component
import connectDB from "@/lib/mongodb";
import SomeModel from "@/models/SomeModel";

export default async function LandingPage() {
  await connectDB();
  const data = await SomeModel.find().lean();
  return <div>...</div>;
}
```

### `cn()` Utility for Conditional Classes
```typescript
import { cn } from "@/lib/utils";

<div className={cn(
  "base-class",
  isActive && "active-class",
  variant === "danger" && "text-error"
)} />
```

---

## 🤖 Discord Bot Architecture

The bot is a **standalone service** that communicates with the web app via **MongoDB**:

```
Web Dashboard (Vercel)  ←→  MongoDB (BotStatus collection)  ←→  Bot (Railway)
                                                                   ↓
                                                              Discord API
```

### Control Flow
1. Admin clicks "Start/Stop/Restart" in web panel
2. Web API writes `command: "start"|"stop"|"restart"` to `BotStatus` collection
3. Bot polls `BotStatus` every 5 seconds and executes commands
4. Bot writes heartbeat (ping, status, guildCount) every 10 seconds

### Bot File: `/bot/bot.js`
- Pure JavaScript (NOT TypeScript)
- Has its own `package.json` and `node_modules`
- Defines its own Mongoose schemas (duplicated from web, intentionally — different runtime)
- Uses slash commands (7 commands: /help, /stats, /info, /campaigns, /submit, /campaign-stats, /profile)

### ⚠️ Bot Rules
1. **NEVER** import web app files (`@/lib/*`, `@/models/*`) into the bot — they run in different runtimes
2. Bot schemas in `bot.js` must stay **compatible** with web schemas in `src/models/`
3. The bot uses **guild commands** (not global) for instant registration
4. When adding new bot commands, add to the `commands` array AND create a handler in `handleCommand()`

---

## 📊 Utility Functions Available

From `@/lib/utils.ts`:
```typescript
formatCurrency(123.45)          // "$123.45"
formatNumber(1500000)           // "1.5M"
censorUsername("johndoe")       // "j***e"
generateVerificationCode()      // "AB3K9X" (6 chars)
generateOTP()                   // "847291" (6 digits)
slugify("My Campaign Title")   // "my-campaign-title"
calculateEarning(50000, 1000)  // 0.05 (views / 1M * rate)
timeAgo(new Date("2024-01-01")) // "5 months ago"
cn("a", false && "b", "c")     // "a c"
```

From `@/lib/tier-system.ts`:
```typescript
calculateTier(25)  // { tier: "gold", label: "Gold", emoji: "🥇", rateBonus: 25, ... }
calculateBadges({ totalVideos: 10, totalEarned: 60, totalViews: 150000 })
// → ["first_blood", "on_fire", "ten_streak", "money_maker", "viral_king"]
getTierForApproved(25)  // "gold"
```

---

## 📧 Notification Channels

The platform has 3 notification channels. **Use the appropriate one:**

| Channel | When to Use | Import |
|---------|-------------|--------|
| **In-App** | Always — user sees in bell icon | `createNotification()` from `@/lib/notifications` |
| **Discord Webhook** | For admin alerts (new submissions, payouts, etc.) | `notify*()` from `@/lib/discord` |
| **Email** | OTP, welcome, approval, payout | `send*Email()` from `@/lib/email` |

---

## 🚫 Common Mistakes to AVOID

### 1. Forgetting `await connectDB()`
```typescript
// ❌ Will cause "buffering timed out" errors
const users = await User.find();

// ✅ Always connect first
await connectDB();
const users = await User.find();
```

### 2. Not awaiting `params` in dynamic routes
```typescript
// ❌ CRASH — params is Promise in Next.js 16
const { id } = params;

// ✅ Always await
const { id } = await params;
```

### 3. Using `"use client"` on pages that don't need it
```typescript
// ❌ Don't make server-side pages client components
"use client"; // Remove this if you're only fetching data server-side
```

### 4. Creating duplicate Mongoose models
```typescript
// ❌ Will cause "OverwriteModelError"
const User = mongoose.model("User", schema);

// ✅ Safe pattern (already used in all models)
const User = mongoose.models.User || mongoose.model("User", schema);
```

### 5. Hardcoding colors instead of using design tokens
```typescript
// ❌ Random colors
<div className="bg-[#1a1a2e] text-[#e94560]">

// ✅ Use the design system
<div className="bg-bg-secondary text-error">
```

### 6. Not handling loading/error states in client components
```typescript
// ❌ No loading state — blank screen while fetching
export default function Page() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch(...).then(...) }, []);
  return <div>{data.map(...)}</div>; // Crashes if data is null
}

// ✅ Handle loading + null check
if (loading) return <div className="admin-shimmer h-40" />;
if (!data) return <div className="admin-empty">No data</div>;
```

### 7. Not returning `{ success: true }` in API responses
```typescript
// ❌ Inconsistent response format
return NextResponse.json({ users });

// ✅ Consistent format used across the app
return NextResponse.json({ success: true, users });
// Error:
return NextResponse.json({ error: "Message" }, { status: 400 });
```

### 8. Using wrong import paths
```typescript
// ❌ Relative imports for lib/models
import connectDB from "../../lib/mongodb";

// ✅ Use path alias
import connectDB from "@/lib/mongodb";
```

### 9. Forgetting to add admin role check on admin endpoints
```typescript
// ❌ Anyone can access admin data
export async function GET() {
  await connectDB();
  const users = await User.find(); // Leaked!
}

// ✅ Always check
const session = await getSession();
if (!session.isLoggedIn || session.role !== "admin") {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

### 10. Modifying bot.js schemas without updating web models
If you change a field in `/bot/bot.js` schemas, make sure the corresponding model in `/src/models/` stays compatible, and vice versa.

---

## 📦 Installed but Underutilized Packages

These are already installed — use them instead of reinventing:

| Package | Status | Use For |
|---------|--------|---------|
| `recharts` | ✅ Installed | Charts & analytics (user dashboard, admin) |
| `sonner` | ✅ Installed | Toast notifications |
| `xlsx` | ✅ Installed | CSV/Excel export |
| `zod` | ✅ Installed | Request validation |
| `date-fns` | ✅ Installed | Date formatting |
| `@react-three/fiber` + `drei` | ✅ Installed | 3D elements (landing hero) |
| `axios` | ✅ Installed | HTTP requests |

---

## 🧪 Testing Checklist Before Submitting Code

- [ ] `npm run build` passes without errors
- [ ] All dynamic route params use `await params`
- [ ] All API routes call `await connectDB()` before DB operations
- [ ] Auth checks are in place (session + role)
- [ ] Loading states are handled in client components
- [ ] Colors use design tokens, not hardcoded hex values
- [ ] API responses follow `{ success: true, data }` or `{ error: "msg" }` format
- [ ] New models use the `mongoose.models.X || mongoose.model()` pattern
- [ ] No `console.log` left in production code (use `console.error` for actual errors)

---

## 🌐 Environment Variables

Required env vars (defined in `.env.local`):
```
MONGODB_URI          # MongoDB Atlas connection string
SESSION_SECRET       # iron-session secret (min 32 chars)
SMTP_HOST            # Email server
SMTP_PORT            # Email port (587 for Gmail)
SMTP_USER            # Email address
SMTP_PASS            # Email app password
GOOGLE_CLIENT_ID     # Google OAuth
GOOGLE_CLIENT_SECRET # Google OAuth
DISCORD_CLIENT_ID    # Discord bot application ID
DISCORD_CLIENT_SECRET # Discord OAuth
DISCORD_BOT_TOKEN    # Discord bot token
DISCORD_GUILD_ID     # Primary Discord server ID
NEXT_PUBLIC_APP_URL  # Public app URL (http://localhost:3000 for dev)
```

---

## 🗂️ Route Groups Explained

| Group | Layout | Purpose |
|-------|--------|---------|
| `(auth)` | Centered card layout | Login, Register, Forgot Password |
| `(dashboard)` | Sidebar + top bar + notifications | User-facing pages |
| `(admin)` | Admin sidebar + role check | Admin panel (all admin/* pages) |

These are Next.js **route groups** — the parentheses `()` mean they don't affect the URL path. `/admin/users` maps to `src/app/(admin)/admin/users/page.tsx`.

---

*Last updated: 2026-05-10*
