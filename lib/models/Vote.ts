import mongoose, { Schema, Model } from "mongoose";
import { IVote, IChoiceAll } from "@/types";

const ChoiceAllSchema = new Schema<IChoiceAll>(
  {
    option_id: {
      type: String,
      required: true,
    },
    remark: {
      type: String,
      enum: ["我要投給他", "我不投給他", "我沒有意見"],
      required: true,
    },
  },
  {
    _id: false,
  },
);

const VoteSchema = new Schema<IVote>({
  activity_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Activity",
  },
  rule: {
    type: String,
    enum: ["choose_all", "choose_one"],
    required: true,
  },
  choose_all: {
    type: [ChoiceAllSchema],
    required: false,
  },
  choose_one: {
    type: String,
    required: false,
  },
  token: {
    type: String,
    required: true,
    unique: true,
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

// Add indexes (without duplicate)
VoteSchema.index({ activity_id: 1 });
VoteSchema.index({ token: 1 });

export const Vote: Model<IVote> =
  mongoose.models.Vote || mongoose.model<IVote>("Vote", VoteSchema);
