import mongoose, { Schema, Model } from "mongoose";
import { IOption, ICandidate } from "@/types";

const CandidateSchema = new Schema<ICandidate>(
  {
    name: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: false,
    },
    college: {
      type: String,
      required: false,
    },
    avatar_url: {
      type: String,
      required: false,
    },
    personal_experiences: [
      {
        type: String,
      },
    ],
    political_opinions: [
      {
        type: String,
      },
    ],
  },
  { _id: false },
);

const OptionSchema = new Schema<IOption>({
  activity_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Activity",
  },
  label: {
    type: String,
    required: false,
  },
  candidate: {
    type: CandidateSchema,
    required: false,
  },
  vice: {
    type: [CandidateSchema],
    required: false,
    default: [],
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

export const Option: Model<IOption> =
  mongoose.models.Option || mongoose.model<IOption>("Option", OptionSchema);
