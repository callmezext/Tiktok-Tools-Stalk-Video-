import mongoose, { Schema, Document, Model } from "mongoose";

export interface IActivityLog extends Document {
  actor: string;        // admin username
  actorId: string;      // admin user _id
  action: string;       // e.g. "approve_submission", "ban_user", "create_campaign"
  target?: string;      // e.g. user id, submission id, campaign id
  targetType?: string;  // "user" | "submission" | "campaign" | "payout"
  details?: string;     // human-readable description
  metadata?: Record<string, unknown>; // extra data
  ip?: string;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    actor: { type: String, required: true },
    actorId: { type: String, required: true },
    action: { type: String, required: true, index: true },
    target: { type: String },
    targetType: { type: String, enum: ["user", "submission", "campaign", "payout", "account", "setting", "settings", "bot", "task"] },
    details: { type: String },
    metadata: { type: Schema.Types.Mixed },
    ip: { type: String },
  },
  { timestamps: true }
);

ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ actorId: 1, createdAt: -1 });

const ActivityLog: Model<IActivityLog> =
  mongoose.models.ActivityLog || mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);
export default ActivityLog;
