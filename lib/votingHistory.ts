// Voting history management utilities

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

/**
 * Load voting history from localStorage
 */
export function loadVotingHistory(): VotingHistory {
  try {
    const history = localStorage.getItem("voting_history");
    if (history) {
      return JSON.parse(history);
    }
  } catch (err) {
    console.error("Error loading voting history:", err);
  }
  return { votedActivityIds: [], votes: [] };
}

/**
 * Save a new vote record to voting history
 */
export function saveVotingRecord(
  activityId: string,
  token: string,
  activityName: string,
  studentId: string,
): VotingHistory {
  try {
    const history = loadVotingHistory();

    // Add activity ID if not already present
    if (!history.votedActivityIds.includes(activityId)) {
      history.votedActivityIds.push(activityId);
    }

    // Add vote record
    history.votes.push({
      studentId,
      activityId,
      activityName,
      token,
      timestamp: new Date().toISOString(),
    });

    localStorage.setItem("voting_history", JSON.stringify(history));
    return history;
  } catch (err) {
    console.error("Error saving voting record:", err);
    return { votedActivityIds: [], votes: [] };
  }
}

/**
 * Check if user has voted for a specific activity
 */
export function hasVoted(activityId: string, studentId?: string): boolean {
  const history = loadVotingHistory();

  // If studentId is provided, check if this specific student has voted
  if (studentId) {
    return history.votes.some(
      (vote) => vote.activityId === activityId && vote.studentId === studentId,
    );
  }

  // Otherwise, fall back to checking if any vote exists for this activity
  return history.votedActivityIds.includes(activityId);
}

/**
 * Get all voted activity IDs
 */
export function getVotedActivityIds(): string[] {
  const history = loadVotingHistory();
  return history.votedActivityIds;
}
