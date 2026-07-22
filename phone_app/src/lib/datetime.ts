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

/** An ISO timestamp -> "Tue Jul 15" — for "starts <date>" copy on a request card. */
export const formatShortDate = (iso: string): string =>
    new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

/**
 * How long ago an ISO timestamp was -> "18 min" or "3 hr". Computed once at
 * render, not a live ticker — same call the rest of this file makes for
 * "today", acceptable for an at-a-glance screen. `Job.respondBy` is advisory
 * and nothing auto-expires a PENDING request (AI_MANIFEST.md), so a request
 * can genuinely sit for hours or days — this must degrade past "min" rather
 * than assume it never will.
 */
export const formatElapsedMinutes = (iso: string): string => {
    const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
    if (minutes < 60) return `${minutes} min`;
    return `${Math.round(minutes / 60)} hr`;
};
