import React from 'react';
import { PlaceholderScreen } from '../../components/PlaceholderScreen';

/**
 * The day/week schedule.
 *
 * Not built. Same `getBusinessJobs` query the Today screen uses, just with a
 * wider `from`/`to` window than a single local day.
 */
export function ScheduleScreen() {
    return (
        <PlaceholderScreen
            title="Schedule"
            note="Not built yet. This is the day and week view — the same getBusinessJobs query as Today, over a wider date window."
        />
    );
}
