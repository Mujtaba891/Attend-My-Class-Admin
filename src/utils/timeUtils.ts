/**
 * Utility functions for 12-hour time parsing and duration calculations
 */

export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hours < 12) {
    hours += 12;
  }
  if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

export function calculateDurationMinutes(startTimeStr: string, endTimeStr: string): number {
  const startMin = parseTimeToMinutes(startTimeStr);
  const endMin = parseTimeToMinutes(endTimeStr);

  if (startMin === 0 && endMin === 0) return 40; // fallback

  let diff = endMin - startMin;
  if (diff < 0) {
    diff += 24 * 60; // wrap over midnight
  }
  return diff;
}
