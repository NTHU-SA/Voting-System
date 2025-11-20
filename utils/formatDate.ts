/**
 * Date formatting utilities for timezone handling
 * Converts between UTC (stored in DB) and GMT+8 (Taipei timezone for display)
 */

const TAIPEI_TIMEZONE = "Asia/Taipei";

/**
 * Format a Date object or ISO string to GMT+8 (Taipei) timezone
 * @param date - Date object or ISO string
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted date string in Taipei timezone
 */
export function formatToTaipeiTime(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TAIPEI_TIMEZONE,
    ...options,
  };

  return new Intl.DateTimeFormat("zh-TW", defaultOptions).format(dateObj);
}

/**
 * Convert a Date object to datetime-local input format in GMT+8
 * Needed for HTML datetime-local inputs which expect local time
 * @param date - Date object or ISO string (UTC from DB)
 * @returns String in format "YYYY-MM-DDTHH:mm" in Taipei timezone
 */
export function toDateTimeLocalString(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  // Get components directly in Taipei timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TAIPEI_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(dateObj);
  const get = (type: string) => parts.find(p => p.type === type)?.value || '';

  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

/**
 * Convert datetime-local input string to UTC Date object
 * The datetime-local input is in user's local time (Taipei)
 * @param dateTimeLocal - String in format "YYYY-MM-DDTHH:mm" (local time)
 * @returns Date object in UTC
 */
export function fromDateTimeLocalString(dateTimeLocal: string): Date {
  // Parse as local time in Taipei timezone
  // datetime-local format: "2024-12-25T14:30"
  const [datePart, timePart] = dateTimeLocal.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);
  
  // Create date string in Taipei timezone
  const taipeiDateString = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
  
  // Create a date object and adjust for timezone
  // We need to create the date as if it's in Taipei time, then convert to UTC
  const date = new Date(taipeiDateString);
  
  // Get the offset between Taipei and UTC (Taipei is UTC+8, so offset is -480 minutes)
  const taipeiOffset = 8 * 60; // minutes
  const localOffset = date.getTimezoneOffset(); // minutes from UTC for local system time
  const offsetDiff = taipeiOffset + localOffset;
  
  // Adjust the date by the offset difference
  const utcDate = new Date(date.getTime() - offsetDiff * 60 * 1000);
  
  return utcDate;
}

/**
 * Format a date for display with full date and time
 * @param date - Date object or ISO string
 * @returns Formatted string like "2024/12/25 14:30"
 */
export function formatDateTime(date: Date | string): string {
  return formatToTaipeiTime(date, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Format a date for display with date only
 * @param date - Date object or ISO string
 * @returns Formatted string like "2024/12/25"
 */
export function formatDate(date: Date | string): string {
  return formatToTaipeiTime(date, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
