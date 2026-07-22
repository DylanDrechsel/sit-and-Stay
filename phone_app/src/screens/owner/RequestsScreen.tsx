import React from 'react';
import { PlaceholderScreen } from '../../components/PlaceholderScreen';

/**
 * The requests inbox: pending job requests to accept or decline.
 *
 * Not built. The data is `getBusinessJobs(statuses: ["PENDING"])`, and the two
 * actions are the `acceptJob` / `declineJob` mutations — all three exist and are
 * tested server-side.
 */
export function RequestsScreen() {
    return (
        <PlaceholderScreen
            title="Requests"
            note="Not built yet. This is where pending job requests will go — getBusinessJobs filtered to PENDING, with accept and decline on each one."
        />
    );
}
