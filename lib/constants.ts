// API Constants
export const API_CONSTANTS = {
  // Pagination
  DEFAULT_LIMIT: 100,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
  DEFAULT_SKIP: 0,
  MIN_SKIP: 0,

  // Cache durations (in milliseconds)
  ADMIN_CACHE_DURATION: 60000, // 1 minute
  VOTER_CACHE_DURATION: 300000, // 5 minutes

  // Token expiration
  JWT_EXPIRATION: "1d", // 1 day
  COOKIE_MAX_AGE: 86400, // 1 day in seconds

  // Voting rules
  VOTING_RULES: ["choose_all", "choose_one"] as const,
  VOTE_REMARKS: ["我要投給他", "我不投給他", "我沒有意見"] as const,

  // Error messages
  ERRORS: {
    AUTH_NO_TOKEN: "Authentication failed: No token provided",
    AUTH_INVALID_TOKEN: "Authentication failed: Invalid token",
    ADMIN_REQUIRED: "Authorization failed: Admin access required",
    ACTIVITY_NOT_FOUND: "Activity not found",
    OPTION_NOT_FOUND: "Option not found",
    VOTE_NOT_ELIGIBLE: "Student is not eligible to vote",
    VOTE_ALREADY_VOTED: "User has already voted",
    VOTE_NOT_STARTED: "Voting has not started yet",
    VOTE_ENDED: "Voting has ended",
    INVALID_RULE: "Invalid voting rule",
    INVALID_REMARK: "Invalid remark in choose_all",
    INVALID_OPTIONS: "Invalid options",
    RULE_MISMATCH: "Rule does not match activity rule",
    MISSING_FIELD: "Missing required field",
    INVALID_DATE_FORMAT: "Invalid date format",
    INVALID_DATE_RANGE: "open_from must be before open_to",
    INVALID_OBJECT_ID: "Invalid MongoDB ObjectId format",
  },

  // User-facing messages
  MESSAGES: {
    VOTE_ALREADY_VOTED_NO_TOKEN: [
      "錯誤！你已經投過票了，但本地沒有投票憑證。可能的原因是：",
      "1. 清除了瀏覽器的 Cookie 或本地儲存",
      "2. 使用無痕模式或不同的瀏覽器投票",
      "3. 手動刪除了投票記錄",
      "",
      "如需查看投票記錄，請聯繫管理員。",
    ],
    VOTE_LOCAL_MULTIPLE_TOKENS: [
      "本地有多個投票憑證對應此活動，無法獲取投票記錄。",
      "可能的原因：使用不同瀏覽器或設備多次投票。",
      "請聯繫管理員查詢投票記錄。",
    ],
    VOTE_ALREADY_SUBMITTED: "您已經完成投票，投票已送出無法修改。以下顯示您之前的選擇。",
    CONFIRM_CLEAR_ALL_HISTORY: "確定要清除所有投票記錄嗎？\n\n注意：此操作將移除瀏覽器中保存的所有投票 UUID 憑證，無法復原。清除後將無法透過 UUID 查詢投票記錄，但不會影響伺服器上的投票結果。",
    CONFIRM_REMOVE_VOTE: (activityName: string) => `確定要清除「${activityName}」的投票記錄嗎？\n\n此操作將移除此 UUID 憑證，無法復原。`,
  },
} as const;

// Type for voting rules
export type VotingRule = (typeof API_CONSTANTS.VOTING_RULES)[number];
export type VoteRemark = (typeof API_CONSTANTS.VOTE_REMARKS)[number];
