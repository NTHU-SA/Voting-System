import mongoose, { Schema, Model } from "mongoose";
import { IActivity } from "@/types";

const ActivitySchema = new Schema<IActivity>({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  rule: {
    type: String,
    enum: ["choose_all", "choose_one"],
    required: true,
  },
  users: [
    {
      type: String,
    },
  ],
  options: [
    {
      type: Schema.Types.ObjectId,
      ref: "Option",
    },
  ],
  open_from: {
    type: Date,
    required: true,
  },
  open_to: {
    type: Date,
    required: true,
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

export const Activity: Model<IActivity> =
  mongoose.models.Activity ||
  mongoose.model<IActivity>("Activity", ActivitySchema);
