import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatTime } from '../lib/datetime';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import type { BusinessJob } from '../types/job';

/**
 * One job in a list: number + service and a status pill on the first line, then
 * the scheduled window and customer, then the assigned sitter (or "Unassigned").
 *
 * Purely presentational — it takes a BusinessJob and renders it, with no data
 * fetching of its own, so any job list can reuse it (today's dashboard now; the
 * schedule and requests screens later).
 */
export function JobListItem({ job }: { job: BusinessJob }) {
    return (
        <View style={styles.row}>
            <View style={styles.header}>
                <Text style={styles.title}>
                    #{job.jobNumber} · {job.service.title}
                </Text>
                <View style={styles.statusPill}>
                    <Text style={styles.statusText}>{job.status}</Text>
                </View>
            </View>
            <Text style={styles.meta}>
                {formatTime(job.scheduledStartTime)}–{formatTime(job.scheduledEndTime)}
                {' · '}
                {job.customer.user.firstName} {job.customer.user.lastName}
            </Text>
            <Text style={styles.meta}>
                {job.assignee != null
                    ? `Sitter: ${job.assignee.user.firstName} ${job.assignee.user.lastName}`
                    : 'Unassigned'}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        marginTop: 14,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    title: {
        flex: 1,
        fontFamily: fonts.bodyBold,
        fontSize: 14,
        color: colors.text,
    },
    statusPill: {
        // White, not a tinted fill: the page background is already the tint, so
        // anything muted would read as no fill at all.
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    statusText: {
        fontFamily: fonts.bodyExtraBold,
        fontSize: 9,
        letterSpacing: 0.4,
        color: colors.textMuted,
    },
    meta: {
        fontFamily: fonts.bodyMedium,
        fontSize: 12,
        lineHeight: 17,
        color: colors.textMuted,
        marginTop: 4,
    },
});
