import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { CustomerHomeScreen } from '../screens/customer/CustomerHomeScreen';

/**
 * Customer (pet owner) screens.
 *
 * Tabs (Home · Bookings · Inbox · Pets · Account) come later — see
 * AI_MANIFEST_FRONTEND.md §9. A customer's own jobs come from
 * `getMyUpcomingJobs`/`getMyBookings`; discovery from `getNearbyBusinesses`.
 */
export type CustomerStackParamList = {
    Home: undefined;
};

const Stack = createNativeStackNavigator<CustomerStackParamList>();

export function CustomerApp() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={CustomerHomeScreen} />
        </Stack.Navigator>
    );
}
