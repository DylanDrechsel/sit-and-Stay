import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatElapsedMinutes, formatShortDate } from '../lib/datetime';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import type { BusinessJob } from '../types/job';
import { PillButton } from './PillButton';

/**
 * One PENDING job awaiting an accept/decline decision — the "New request" card
 * from the prototype's "Needs your attention" section (2A).
 *
 * Purely presentational: the caller (`NeedsAttentionSection`) owns the mutations
 * and passes down what's currently happening, so this component never has to
 * know about Apollo.
 *
 * The price shown is `job.price` — the per-session rate, not a multi-session
 * booking's combined total (add-ons + service fee). The prototype's own example
 * shows a pack's full price ("$120"); this can't reproduce that number exactly
 * because `Job` has no `booking` relation in the schema to reach
 * `Booking.totalPrice` from — see the type comment on `BusinessJob.price`.
 */
export function RequestCard({
    job,
    onAccept,
    onDecline,
    isAccepting,
    isDeclining,
}: {
    job: BusinessJob;
    onAccept: () => void;
    onDecline: () => void;
    isAccepting: boolean;
    isDeclining: boolean;
}) {
    const sessionLabel =
        job.totalSessions != null && job.totalSessions > 1
            ? `${job.service.title} · session ${job.sessionNumber} of ${job.totalSessions}`
            : job.service.title;

    const customerShortName = `${job.customer.user.firstName} ${job.customer.user.lastName.charAt(0)}.`;
    const petNames = job.pets.map((pet) => pet.name).join(', ');

    return (
        <View style={styles.card}>
            <View style={styles.row}>
                <View style={styles.iconBox}>
                    <Ionicons name="paw-outline" size={20} color={colors.textMuted} />
                </View>
                <View style={styles.textBlock}>
                    <Text style={styles.title} numberOfLines={1}>
                        New request · {sessionLabel}
                    </Text>
                    <Text style={styles.subtitle} numberOfLines={2}>
                        {customerShortName} · {petNames} · starts {formatShortDate(job.scheduledStartTime)}
                        {' · $'}
                        {job.price.toFixed(2)}
                    </Text>
                </View>
                <View style={styles.elapsedPill}>
                    <Text style={styles.elapsedText}>{formatElapsedMinutes(job.createdAt)}</Text>
                </View>
            </View>

            <View style={styles.actions}>
                <PillButton
                    label="Decline"
                    variant="secondary"
                    onPress={onDecline}
                    loading={isDeclining}
                    disabled={isAccepting}
                />
                <PillButton
                    label="Accept & assign"
                    variant="primary"
                    onPress={onAccept}
                    loading={isAccepting}
                    disabled={isDeclining}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        // colors.primary (#0F1D1B = rgb(15,29,27)) at 8% opacity, same reasoning
        // as PillButton's secondary border.
        borderColor: 'rgba(15, 29, 27, 0.08)',
        borderRadius: 18,
        padding: 16,
        gap: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textBlock: {
        flex: 1,
    },
    title: {
        fontFamily: fonts.bodyExtraBold,
        fontSize: 14,
        color: colors.text,
    },
    subtitle: {
        fontFamily: fonts.bodySemiBold,
        fontSize: 12,
        lineHeight: 17,
        color: colors.textMuted,
        marginTop: 2,
    },
    elapsedPill: {
        backgroundColor: colors.accentChipBg,
        borderRadius: 999,
        paddingHorizontal: 9,
        paddingVertical: 4,
        alignSelf: 'flex-start',
    },
    elapsedText: {
        fontFamily: fonts.bodyExtraBold,
        fontSize: 10.5,
        color: colors.accentChipText,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
});
