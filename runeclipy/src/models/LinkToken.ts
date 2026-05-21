import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILinkToken extends Document {
  token: string;
  discordId: string;
  discordUsername: string;
  used: boolean;
  expiresAt: Date;
  createdAt: Date;
}

const LinkTokenSchema = new Schema<ILinkToken>(
  {
    token: { type: String, required: true, unique: true },
    discordId: { type: String, required: true },
    discordUsername: { type: String, required: true },
    used: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

LinkTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const LinkToken: Model<ILinkToken> = mongoose.models.LinkToken || mongoose.model<ILinkToken>("LinkToken", LinkTokenSchema);
export default LinkToken;
