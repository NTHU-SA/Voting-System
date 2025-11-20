import { Types } from "mongoose";

// Database Models
export interface IUser {
  _id: Types.ObjectId | string;
  student_id: string;
  remark?: string;
  created_at: Date;
  updated_at: Date;
}

export interface IActivity {
  _id: Types.ObjectId | string;
  name: string;
  type: string; // Kept for backward compatibility
  description?: string; // New field for activity description
  rule: "choose_all" | "choose_one";
  users: string[]; // Student IDs who have voted
  options: (Types.ObjectId | string)[]; // Option IDs
  open_from: Date;
  open_to: Date;
  created_at: Date;
  updated_at: Date;
}

export interface IOption {
  _id: Types.ObjectId | string;
  activity_id: Types.ObjectId | string;
  label?: string; // Optional label for the candidate
  candidate?: ICandidate;
  vice?: ICandidate[];
  created_at: Date;
  updated_at: Date;
}

export interface ICandidate {
  name: string;
  department?: string; // Optional
  college?: string; // Optional
  avatar_url?: string;
  personal_experiences?: string[];
  political_opinions?: string[];
}

export interface IVote {
  _id: Types.ObjectId | string;
  activity_id: Types.ObjectId | string;
  rule: "choose_all" | "choose_one";
  choose_all?: IChoiceAll[];
  choose_one?: Types.ObjectId | string;
  token: string; // UUID for anonymity
  created_at: Date;
  updated_at: Date;
}

export interface IChoiceAll {
  option_id: Types.ObjectId | string;
  remark: "我要投給他" | "我不投給他" | "我沒有意見";
}

// API Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthUser {
  _id: string;
  student_id: string;
  remark?: string;
  name?: string;
}

export interface JWTPayload extends AuthUser {
  account: string;
  iat?: number;
  exp?: number;
}

// Request Types
export interface CreateActivityRequest {
  name: string;
  type: string;
  description?: string;
  rule: "choose_all" | "choose_one";
  open_from: string;
  open_to: string;
}

export interface CreateOptionRequest {
  activity_id: string;
  label?: string;
  candidate?: ICandidate;
  vice?: ICandidate[];
}

export interface CreateVoteRequest {
  activity_id: string;
  rule: "choose_all" | "choose_one";
  choose_all?: IChoiceAll[];
  choose_one?: string;
}

// Frontend Types
export interface UserData {
  student_id: string;
  name: string;
  isAdmin?: boolean;
}

export interface AdminActivity extends Omit<IActivity, "_id" | "options" | "open_from" | "open_to" | "created_at" | "updated_at"> {
  _id: string;
  open_from: string;
  open_to: string;
  options: string[]; // Array of option IDs
}

// Client-side Activity type (serialized from database)
export interface Activity extends Omit<IActivity, "_id" | "options" | "open_from" | "open_to" | "created_at" | "updated_at"> {
  _id: string;
  subtitle?: string; // Additional client field
  open_from: string;
  open_to: string;
  options?: string[]; // Array of option IDs (serialized)
}

export interface ActivityWithOptions extends Omit<Activity, "options"> {
  options: Option[];
}

// Client-side Option type (serialized from database)
export type Option = Omit<IOption, "_id" | "activity_id" | "created_at" | "updated_at"> & {
  _id: string;
};

// Candidate type (re-export for convenience)
export type Candidate = ICandidate;

// Voting History Types
export interface VoteRecord {
  studentId: string;
  activityId: string;
  activityName: string;
  token: string;
  timestamp: string;
}

export interface VotingHistory {
  votedActivityIds: string[];
  votes: VoteRecord[];
}

// OAuth Types
export interface OAuthTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token?: string;
}

export interface OAuthUserInfo {
  Userid: string; // Maps to student_id in our system
  name?: string;
  inschool?: string;
  uuid?: string; // Used for anonymous voting
}

// Middleware Types
import { NextRequest } from "next/server";

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}
