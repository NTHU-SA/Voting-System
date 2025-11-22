import { API_CONSTANTS } from "@/lib/constants";

// Firestore document ID constraints
const FIRESTORE_MAX_DOCUMENT_ID_LENGTH = 1500;

/**
 * Validates if a string is a valid Firestore document ID
 */
export function isValidObjectId(id: string): boolean {
  // Firestore document IDs can be any non-empty string
  // but typically should not contain certain characters
  if (!id || typeof id !== "string") {
    return false;
  }
  
  // Check if it's a reasonable length (Firestore allows up to 1,500 bytes)
  // and doesn't contain invalid characters
  return id.length > 0 && id.length <= FIRESTORE_MAX_DOCUMENT_ID_LENGTH && !id.includes("/");
}

/**
 * Validates date range for activities
 */
export function validateDateRange(
  openFrom: Date,
  openTo: Date,
): { valid: boolean; error?: string } {
  if (isNaN(openFrom.getTime())) {
    return { valid: false, error: API_CONSTANTS.ERRORS.INVALID_DATE_FORMAT };
  }

  if (isNaN(openTo.getTime())) {
    return { valid: false, error: API_CONSTANTS.ERRORS.INVALID_DATE_FORMAT };
  }

  if (openFrom >= openTo) {
    return { valid: false, error: API_CONSTANTS.ERRORS.INVALID_DATE_RANGE };
  }

  return { valid: true };
}

/**
 * Validates and parses pagination parameters
 */
export function validatePagination(params: {
  limit?: string | null;
  skip?: string | null;
}): { limit: number; skip: number } {
  const limit = Math.min(
    Math.max(
      parseInt(params.limit || String(API_CONSTANTS.DEFAULT_LIMIT)),
      API_CONSTANTS.MIN_LIMIT,
    ),
    API_CONSTANTS.MAX_LIMIT,
  );
  const skip = Math.max(
    parseInt(params.skip || String(API_CONSTANTS.DEFAULT_SKIP)),
    API_CONSTANTS.MIN_SKIP,
  );

  return { limit, skip };
}

/**
 * Validates voting rule type
 */
export function isValidRule(rule: string): rule is "choose_all" | "choose_one" {
  return API_CONSTANTS.VOTING_RULES.includes(
    rule as "choose_all" | "choose_one",
  );
}

/**
 * Validates vote remark for choose_all
 */
export function isValidRemark(remark: string): boolean {
  return API_CONSTANTS.VOTE_REMARKS.includes(
    remark as "我要投給他" | "我不投給他" | "我沒有意見",
  );
}

/**
 * Validates required fields in an object
 */
export function validateRequiredFields(
  obj: Record<string, unknown>,
  requiredFields: string[],
): { valid: boolean; missingFields?: string[] } {
  const missingFields = requiredFields.filter(
    (field) =>
      obj[field] === undefined || obj[field] === null || obj[field] === "",
  );

  if (missingFields.length > 0) {
    return { valid: false, missingFields };
  }

  return { valid: true };
}
