/**
 * Utility functions for time formatting in Cambodian timezone
 */

// Cambodian timezone is UTC+7
const CAMBODIA_TIMEZONE = 'Asia/Phnom_Penh';

/**
 * Normalize different date input shapes into a Date object while assuming
 * server-provided timestamps without an explicit timezone are UTC.
 */
const normalizeToDate = (date: Date | string): Date | null => {
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? null : date;
  }

  if (typeof date !== 'string') {
    return null;
  }

  const trimmed = date.trim();
  if (!trimmed) {
    return null;
  }

  // Detect ISO-like strings missing timezone information and assume UTC
  const isoLike = trimmed.replace(' ', 'T');
  const hasExplicitTimezone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(isoLike);
  const isoWithoutTzPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,6})?)?$/;

  let candidate = trimmed;
  if (!hasExplicitTimezone && isoWithoutTzPattern.test(isoLike)) {
    candidate = `${isoLike}Z`;
  }

  const parsed = new Date(candidate);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
};

/**
 * Format a date to Cambodian time with proper locale
 * @param date - Date object or ISO string
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string in Cambodian time
 */
export const formatCambodianTime = (
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }
): string => {
  const dateObj = normalizeToDate(date);

  // Ensure we have a valid date
  if (!dateObj) {
    return 'Invalid Date';
  }

  try {
    // Use Intl.DateTimeFormat with Cambodia timezone
    const formatter = new Intl.DateTimeFormat('en-GB', {
      ...options,
      timeZone: CAMBODIA_TIMEZONE
    });

    return formatter.format(dateObj);
  } catch (error) {
    console.error('Error formatting Cambodia time:', error);
    // Fallback: manually add 7 hours to UTC
    const cambodiaTime = new Date(dateObj.getTime() + (7 * 60 * 60 * 1000));
    return cambodiaTime.toISOString().replace('T', ' ').substring(0, 19);
  }
};

/**
 * Format a date to show only time in Cambodian timezone
 * @param date - Date object or ISO string
 * @returns Formatted time string (HH:MM:SS)
 */
export const formatCambodianTimeOnly = (date: Date | string): string => {
  return formatCambodianTime(date, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

/**
 * Format a date to show only date in Cambodian timezone
 * @param date - Date object or ISO string
 * @returns Formatted date string (DD/MM/YYYY)
 */
export const formatCambodianDateOnly = (date: Date | string): string => {
  return formatCambodianTime(date, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

/**
 * Format a date to show relative time (e.g., "2 hours ago", "yesterday")
 * @param date - Date object or ISO string
 * @returns Relative time string
 */
export const formatRelativeTime = (date: Date | string): string => {
  // Convert input to Date object if it's a string (UTC from server)
  const inputDate = normalizeToDate(date);

  if (!inputDate) {
    return 'Invalid Date';
  }

  // Get current time in UTC (since server stores in UTC)
  const now = new Date();

  // Calculate difference in milliseconds, then convert to seconds
  const diffInSeconds = Math.floor((now.getTime() - inputDate.getTime()) / 1000);

  // Handle negative differences (future dates) - should show as "Just now"
  if (diffInSeconds <= 0) {
    return 'Just now';
  }

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return formatCambodianDateOnly(inputDate);
  }
};

/**
 * Get current time in Cambodian timezone
 * @returns Current date in Cambodian timezone
 */
export const getCurrentCambodianTime = (): Date => {
  const now = new Date();
  // Get Cambodia time by creating a new date with the offset applied
  const cambodiaOffset = 0; // UTC+7 in minutes
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utcTime + (cambodiaOffset * 60000));
};
