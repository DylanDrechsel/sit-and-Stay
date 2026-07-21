/**
 * Date/time formatting shared across screens and components.
 *
 * Every formatter renders in the DEVICE's local zone. The backend stores UTC and
 * has no per-business timezone, so "today" and clock times are only meaningful
 * once localised on the client — see the getBusinessJobs note in
 * AI_MANIFEST_FRONTEND.md §8.
 */

/** Today -> "Monday, July 21". */
export const formatToday = (): string =>
    new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

/** An ISO timestamp -> "9:00 AM". */
export const formatTime = (iso: string): string =>
    new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
