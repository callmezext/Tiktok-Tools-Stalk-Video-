import mongoose, { Schema, Document, Model } from "mongoose";

export interface IScheduledTask extends Document {
  taskType: "send_discord_message";
  payload: Record<string, any>;
  executeAt: Date;
  status: "pending" | "completed" | "failed";
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduledTaskSchema = new Schema<IScheduledTask>(
  {
    taskType: { type: String, enum: ["send_discord_message"], required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    executeAt: { type: Date, required: true, index: true },
    status: { type: String, enum: ["pending", "completed", "failed"], default: "pending", index: true },
    error: { type: String, default: "" },
  },
  { timestamps: true }
);

const ScheduledTask: Model<IScheduledTask> =
  mongoose.models.ScheduledTask || mongoose.model<IScheduledTask>("ScheduledTask", ScheduledTaskSchema);
export default ScheduledTask;
