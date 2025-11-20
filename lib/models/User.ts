import mongoose, { Schema, Model } from "mongoose";
import { IUser } from "@/types";

const UserSchema = new Schema<IUser>(
  {
    student_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    remark: {
      type: String,
      required: false,
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
  },
  {
    strict: "throw",
  },
);

UserSchema.index({ student_id: 1 });

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
