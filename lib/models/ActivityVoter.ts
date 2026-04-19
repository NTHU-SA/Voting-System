import mongoose, { Schema, Model } from "mongoose";
import { IActivityVoter } from "@/types";

const ActivityVoterSchema = new Schema<IActivityVoter>({
  activity_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Activity",
  },
  student_id: {
    type: String,
    required: true,
    trim: true,
  },
  created_at: {
    type: Date,
    required: true,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    required: true,
    default: Date.now,
  },
} as const);

ActivityVoterSchema.index({ activity_id: 1, student_id: 1 }, { unique: true });
ActivityVoterSchema.index({ activity_id: 1 });

export const ActivityVoter: Model<IActivityVoter> =
  mongoose.models.ActivityVoter ||
  mongoose.model<IActivityVoter>("ActivityVoter", ActivityVoterSchema);
