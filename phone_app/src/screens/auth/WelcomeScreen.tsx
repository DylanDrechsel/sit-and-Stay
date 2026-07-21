import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { PawMark } from '../../components/PawMark';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';

type Props = {
  onContinueWithEmail?: () => void;
};

export function WelcomeScreen({ onContinueWithEmail }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <View style={[styles.hero, { paddingTop: insets.top }]}>
        <PawMark size={52} />
        <View>
          <Text style={styles.headline}>Care they'll love,{'\n'}from people{'\n'}you trust.</Text>
          <Text style={styles.subhead}>
            Book trusted local pet-care businesses for walks, boarding, visits and more.
          </Text>
        </View>
      </View>

      {/* 44px of breathing room in the mockup; on a device the home indicator
          eats into that, so the inset is added rather than replacing it. */}
      <View style={[styles.actions, { paddingBottom: 44 + insets.bottom }]}>
        {/* Apple and Google are rendered to match the design, but deliberately
            inert: the API has no OAuth mutation. `login` only accepts
            email + password, and rejects accounts whose passwordHash is null
            (which is exactly what an OAuth-only account would be). Wire these
            up once a social-auth flow exists server-side. */}
        <View style={[styles.button, styles.appleButton]}>
          <AppleLogo />
          <Text style={[styles.buttonLabel, styles.appleLabel]}>Continue with Apple</Text>
        </View>

        <View style={[styles.button, styles.googleButton]}>
          <View style={styles.googleBadge}>
            <Text style={styles.googleBadgeLetter}>G</Text>
          </View>
          <Text style={[styles.buttonLabel, styles.googleLabel]}>Continue with Google</Text>
        </View>

        <Pressable onPress={onContinueWithEmail} style={styles.emailButton}>
          <Text style={styles.emailLabel}>Continue with email</Text>
        </Pressable>

        <Text style={styles.terms}>By continuing you agree to our Terms &amp; Privacy Policy</Text>
      </View>
    </View>
  );
}

function AppleLogo() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path
        d="M16.6 12.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 3-0.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3.1 2.4 1.2-.1 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.6-1-2.7-3.9zM14.2 5.3c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.2-.6 2.8-1.4z"
        fill={colors.text}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 20,
  },
  headline: {
    fontFamily: fonts.headingBold,
    fontSize: 34,
    // The web values are unitless/em; RN needs absolute points.
    // 34 × 1.15 line-height, 34 × -0.015em tracking.
    lineHeight: 39,
    letterSpacing: -0.51,
    color: colors.textOnPrimary,
  },
  subhead: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    lineHeight: 22.5,
    color: colors.onPrimary65,
    marginTop: 12,
  },
  actions: {
    paddingHorizontal: 24,
    gap: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: 999,
    paddingVertical: 15,
  },
  buttonLabel: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 14.5,
  },
  appleButton: {
    backgroundColor: colors.textOnPrimary,
  },
  appleLabel: {
    color: colors.text,
  },
  googleButton: {
    backgroundColor: colors.overlay10,
    borderWidth: 1,
    borderColor: colors.overlay20,
  },
  googleLabel: {
    color: colors.textOnPrimary,
  },
  googleBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleBadgeLetter: {
    fontFamily: fonts.headingExtraBold,
    fontSize: 10,
    color: colors.primary,
  },
  emailButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  emailLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.onPrimary80,
  },
  terms: {
    textAlign: 'center',
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.onPrimary45,
    marginTop: 4,
  },
});
