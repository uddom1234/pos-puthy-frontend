/**
 * Utility functions for time formatting in Cambodian timezone
 */

// Cambodian timezone is UTC+7
const CAMBODIA_TIMEZONE = 'Asia/Phnom_Penh';

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
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('en-GB', {
    ...options,
    timeZone: CAMBODIA_TIMEZONE
  }).format(dateObj);
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
  const input = typeof date === 'string' ? new Date(date) : date;
  // Normalize both to Cambodia timezone to avoid UTC± offset confusion
  const dateObj = new Date(input.toLocaleString('en-US', { timeZone: CAMBODIA_TIMEZONE }));
  const now = getCurrentCambodianTime();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
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
    return formatCambodianDateOnly(dateObj);
  }
};

/**
 * Get current time in Cambodian timezone
 * @returns Current date in Cambodian timezone
 */
export const getCurrentCambodianTime = (): Date => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: CAMBODIA_TIMEZONE }));
};

