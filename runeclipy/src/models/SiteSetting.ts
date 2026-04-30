import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISiteSetting extends Document {
  // Financial
  platformFeePercent: number;
  minCampaignWithdrawal: number;
  minReferralWithdrawal: number;
  referralCommissionPercent: number;

  // Discord
  discordWebhookUrl: string;
  discordBotToken: string;
  discordGuildId: string;
  discordInviteUrl: string;

  // General
  siteName: string;
  supportEmail: string;

  updatedAt: Date;
}

const SiteSettingSchema = new Schema<ISiteSetting>(
  {
    // Financial
    platformFeePercent: { type: Number, default: 3 },
    minCampaignWithdrawal: { type: Number, default: 10 },
    minReferralWithdrawal: { type: Number, default: 30 },
    referralCommissionPercent: { type: Number, default: 5 },

    // Discord
    discordWebhookUrl: { type: String, default: "" },
    discordBotToken: { type: String, default: "" },
    discordGuildId: { type: String, default: "" },
    discordInviteUrl: { type: String, default: "https://discord.gg/runeclipy" },

    // General
    siteName: { type: String, default: "RuneClipy" },
    supportEmail: { type: String, default: "" },
  },
  { timestamps: true }
);

const SiteSetting: Model<ISiteSetting> =
  mongoose.models.SiteSetting || mongoose.model<ISiteSetting>("SiteSetting", SiteSettingSchema);
export default SiteSetting;
