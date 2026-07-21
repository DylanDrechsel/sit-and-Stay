/**
 * Palette from the design system in first_draft_screens.html:
 * near-white greens, Phthalo green primary, warm honey for ratings/highlights.
 */
export const colors = {
  // Core
  primary: '#123524', // Phthalo green — dark screens + primary buttons
  background: '#F7F8F6', // near-white green — light screens
  surface: '#FFFFFF',
  accent: '#C08B2E', // warm honey — ratings, highlights

  // Text
  text: '#122B1C', // body text on light backgrounds
  textMuted: '#5C6F62',
  textOnPrimary: '#F2F6F1', // text on the dark green

  // Accents used on the dark green
  mint: '#7FD6A0', // logo, "up next" dots, success states

  // Translucent whites, for layering on the dark green. React Native has no
  // color-mix, so these are written out rather than derived.
  onPrimary80: 'rgba(242, 246, 241, 0.8)',
  onPrimary65: 'rgba(242, 246, 241, 0.65)',
  onPrimary45: 'rgba(242, 246, 241, 0.45)',
  overlay10: 'rgba(255, 255, 255, 0.1)',
  overlay20: 'rgba(255, 255, 255, 0.2)',
} as const;
