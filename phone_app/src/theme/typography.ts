/**
 * Sora for headings, Manrope for body — per the design system.
 *
 * IMPORTANT: unlike the web, React Native does NOT synthesize weights for a
 * custom font. `fontWeight: '800'` on a loaded custom family is ignored on iOS
 * and fakes a smeared bold on Android. Each weight is its own family, so pick
 * the right constant here and do not also set `fontWeight`.
 *
 * Every family listed must be registered in the `useFonts` call in App.tsx.
 */
export const fonts = {
  headingBold: 'Sora_700Bold',
  headingExtraBold: 'Sora_800ExtraBold',

  bodyMedium: 'Manrope_500Medium',
  bodySemiBold: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
  bodyExtraBold: 'Manrope_800ExtraBold',
} as const;
