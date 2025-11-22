// Voting history management utilities
import { VotingHistory, VoteRecord } from "@/types";

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

/**
 * Clear all voting history from localStorage
 * This removes all UUID tokens and voting records from browser storage
 * @returns {void}
 */
export function clearVotingHistory(): void {
  try {
    localStorage.removeItem("voting_history");
  } catch (err) {
    console.error("Error clearing voting history:", err);
  }
}

/**
 * Remove a specific vote record by UUID token
 * This removes the vote record with the matching token
 * @param {string} token - The UUID token to remove
 * @returns {VotingHistory} The updated voting history after removal
 */
export function removeVoteRecordByToken(token: string): VotingHistory {
  try {
    const history = loadVotingHistory();

    // Find the vote to remove
    const voteToRemove = history.votes.find((vote) => vote.token === token);
    
    if (voteToRemove) {
      // Remove the vote record
      history.votes = history.votes.filter((vote) => vote.token !== token);

      // Check if there are any remaining votes for this activity
      const hasOtherVotesForActivity = history.votes.some(
        (vote) => vote.activityId === voteToRemove.activityId
      );

      // If no other votes exist for this activity, remove it from votedActivityIds
      if (!hasOtherVotesForActivity) {
        history.votedActivityIds = history.votedActivityIds.filter(
          (id) => id !== voteToRemove.activityId
        );
      }

      localStorage.setItem("voting_history", JSON.stringify(history));
    }

    return history;
  } catch (err) {
    console.error("Error removing vote record:", err);
    return { votedActivityIds: [], votes: [] };
  }
}

/**
 * Get vote records for a specific activity
 * @param {string} activityId - The activity ID
 * @returns {VoteRecord[]} Array of vote records for the activity
 */
export function getVotesByActivityId(activityId: string): VoteRecord[] {
  const history = loadVotingHistory();
  return history.votes.filter((vote) => vote.activityId === activityId);
}

/**
 * Get a vote record by token
 * @param {string} token - The UUID token
 * @returns {VoteRecord | undefined} The vote record or undefined if not found
 */
export function getVoteByToken(token: string): VoteRecord | undefined {
  const history = loadVotingHistory();
  return history.votes.find((vote) => vote.token === token);
}
