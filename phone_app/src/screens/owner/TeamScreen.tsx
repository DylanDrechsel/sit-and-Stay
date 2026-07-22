import React from 'react';
import { PlaceholderScreen } from '../../components/PlaceholderScreen';

/**
 * The staff list: members, roles, availability, invitations.
 *
 * Not built. Reads are `getBusinessMembers` / `getInactiveBusinessMembers`;
 * writes are `inviteEmployee`, `removeMember`, `setAvailability`, and
 * `setMemberPayRate` (OWNER only).
 */
export function TeamScreen() {
    return (
        <PlaceholderScreen
            title="Team"
            note="Not built yet. This is the staff list — getBusinessMembers, plus inviting, removing, and setting availability and pay rates."
        />
    );
}
