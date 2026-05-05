/**
 * ═══════════════════════════════════════════════
 *  RuneClipy — Creator Tier & Badge System
 * ═══════════════════════════════════════════════
 */

export type Tier = "bronze" | "silver" | "gold" | "diamond";

export interface TierInfo {
  tier: Tier;
  label: string;
  emoji: string;
  color: string;
  rateBonus: number; // percentage bonus on earnings
  minApproved: number;
  nextTier?: { tier: Tier; required: number };
}

const TIER_THRESHOLDS: { tier: Tier; min: number; label: string; emoji: string; color: string; rateBonus: number }[] = [
  { tier: "diamond", min: 50, label: "Diamond", emoji: "💎", color: "text-cyan-400", rateBonus: 40 },
  { tier: "gold",    min: 20, label: "Gold",    emoji: "🥇", color: "text-yellow-400", rateBonus: 25 },
  { tier: "silver",  min: 5,  label: "Silver",  emoji: "🥈", color: "text-gray-300", rateBonus: 10 },
  { tier: "bronze",  min: 0,  label: "Bronze",  emoji: "🥉", color: "text-amber-600", rateBonus: 0 },
];

export function calculateTier(totalApproved: number): TierInfo {
  for (let i = 0; i < TIER_THRESHOLDS.length; i++) {
    const t = TIER_THRESHOLDS[i];
    if (totalApproved >= t.min) {
      const nextTierData = i > 0 ? TIER_THRESHOLDS[i - 1] : undefined;
      return {
        tier: t.tier,
        label: t.label,
        emoji: t.emoji,
        color: t.color,
        rateBonus: t.rateBonus,
        minApproved: t.min,
        nextTier: nextTierData ? { tier: nextTierData.tier, required: nextTierData.min } : undefined,
      };
    }
  }
  return { ...TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1], minApproved: 0 };
}

// ═══ Badge Definitions ═══
export interface BadgeDef {
  id: string;
  label: string;
  emoji: string;
  description: string;
}

export const BADGE_DEFINITIONS: BadgeDef[] = [
  { id: "first_blood",    label: "First Blood",    emoji: "🎯", description: "First approved submission" },
  { id: "on_fire",        label: "On Fire",        emoji: "🔥", description: "5 approved submissions" },
  { id: "ten_streak",     label: "Veteran",        emoji: "⚡", description: "10 approved submissions" },
  { id: "fifty_club",     label: "50 Club",        emoji: "🏅", description: "50 approved submissions" },
  { id: "hundred_legend", label: "Legend",          emoji: "🏆", description: "100 approved submissions" },
  { id: "money_maker",    label: "Money Maker",    emoji: "💰", description: "Earned $50+" },
  { id: "big_earner",     label: "Big Earner",     emoji: "💎", description: "Earned $500+" },
  { id: "viral_king",     label: "Viral King",     emoji: "👑", description: "100K+ total views" },
  { id: "million_views",  label: "Million Views",  emoji: "🌟", description: "1M+ total views" },
  { id: "referral_pro",   label: "Referral Pro",   emoji: "🤝", description: "Referred 5+ users" },
];

export function calculateBadges(stats: {
  totalVideos: number;
  totalEarned: number;
  totalViews: number;
  referralCount?: number;
}): string[] {
  const badges: string[] = [];
  
  if (stats.totalVideos >= 1)   badges.push("first_blood");
  if (stats.totalVideos >= 5)   badges.push("on_fire");
  if (stats.totalVideos >= 10)  badges.push("ten_streak");
  if (stats.totalVideos >= 50)  badges.push("fifty_club");
  if (stats.totalVideos >= 100) badges.push("hundred_legend");
  if (stats.totalEarned >= 50)  badges.push("money_maker");
  if (stats.totalEarned >= 500) badges.push("big_earner");
  if (stats.totalViews >= 100000)  badges.push("viral_king");
  if (stats.totalViews >= 1000000) badges.push("million_views");
  if ((stats.referralCount || 0) >= 5) badges.push("referral_pro");

  return badges;
}

export function getTierForApproved(totalApproved: number): Tier {
  if (totalApproved >= 50) return "diamond";
  if (totalApproved >= 20) return "gold";
  if (totalApproved >= 5) return "silver";
  return "bronze";
}
