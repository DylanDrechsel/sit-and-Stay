import React from 'react';
import { PlaceholderScreen } from '../../components/PlaceholderScreen';

/**
 * The business profile: details, service catalog, and the money side.
 *
 * Not built. Details are `updateBusiness` / `setBusinessLocation`; the catalog is
 * the `service` domain's full CRUD; the books are `getBusinessLedger`,
 * `getBusinessFinancialSummary`, and the earnings/payout queries.
 */
export function BusinessScreen() {
    return (
        <PlaceholderScreen
            title="Business"
            note="Not built yet. This is the business profile, the service catalog, and the finance summary — updateBusiness, the service CRUD, and getBusinessFinancialSummary."
        />
    );
}
