import { DateTime } from 'luxon';

export const COLLEGE_TIMEZONE = 'Asia/Kolkata';

/**
 * Returns today's date key formatted as YYYY-MM-DD in the college timezone (Asia/Kolkata)
 */
export const getCollegeDateKey = (date = new Date()) => {
  return DateTime.fromJSDate(date).setZone(COLLEGE_TIMEZONE).toFormat('yyyy-MM-dd');
};

/**
 * Formats token string, e.g. prefix 'ADM' and seq 7 => 'ADM007'
 */
export const formatTokenNumber = (prefix, sequence, padLength = 3) => {
  const cleanPrefix = (prefix || 'TKN').trim().toUpperCase();
  const paddedSeq = String(sequence).padStart(padLength, '0');
  return `${cleanPrefix}${paddedSeq}`;
};
