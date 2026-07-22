/**
 * Palette from the design system in first_draft_screens.html:
 * near-white greens, Phthalo green primary, warm honey for ratings/highlights.
 */
export const colors = {
  // Core
  primary: '#0F1D1B', // Phthalo green — dark screens + primary buttons
  background: '#EFF1EE', // soft green-grey — light screens; white cards sit on top of it
  surface: '#FFFFFF',
  accent: '#C08B2E', // warm honey — ratings, highlights

  // Text
  text: '#122B1C', // body text on light backgrounds
  textMuted: '#5C6F62',
  textOnPrimary: '#F2F6F1', // text on the dark green

  // Accents used on the dark green
  mint: '#7FD6A0', // logo, "up next" dots, success states

  // Light-theme surfaces, lines, and status — for white screens like the
  // owner/manager home dashboard (2A). Distinct from the translucent whites
  // below, which only read against the dark green.
  border: '#E3E7E2', // hairline dividers, card/pill borders on light
  danger: '#C0392B', // cancelled, destructive, alert (red)
  link: '#2E6B45', // "All requests"-style text links on a light background —
  // brighter than `primary` so a link reads as tappable next to plain body text
  accentChipBg: '#FBF0E0', // light honey fill for a small urgency chip ("18 min")
  accentChipText: '#8A6A1F', // dark honey text on that chip — `accent` itself
  // is calibrated for borders/large fills, not small-text contrast on white
  accentBannerText: '#7A6027', // passive message copy on a honey banner (e.g.
  // "N accepted jobs still need a sitter") — deliberately a shade darker/quieter
  // than `accentChipText`, which is reserved for the banner's own tappable link,
  // so the two don't compete for attention on the same background
  textSecondary: '#3C5244', // label on an outlined secondary button (e.g. "Decline") —
  // between `text` and `textMuted`: legible, but visibly less emphasized than
  // the filled primary action next to it
  onDutyStatus: '#1E7A43', // "Walking Biscuit · 12 min in" on an On Duty row —
  // a distinct mid-green for "happening right now", not reused from mint/primary
  onDutyDot: '#2FA45E', // the small live-indicator dot on that same row

  // Translucent whites, for layering on the dark green. React Native has no
  // color-mix, so these are written out rather than derived.
  onPrimary80: 'rgba(242, 246, 241, 0.8)',
  onPrimary65: 'rgba(242, 246, 241, 0.65)',
  onPrimary45: 'rgba(242, 246, 241, 0.45)',
  overlay10: 'rgba(255, 255, 255, 0.1)',
  overlay20: 'rgba(255, 255, 255, 0.2)',

  // OLD PRIMARY GREENS — kept here for reference, but not used in the app. The
  // primary: '#123524', // Old Primary Green
  // primary: '#172927', // Old Primary Green
  // primary: '#0F1D1C', // Old Primary Green
  // primary: '#0F1D19', // Old Primary Green
} as const;
