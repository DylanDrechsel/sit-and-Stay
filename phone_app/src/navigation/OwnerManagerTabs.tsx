import { useQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { useActiveMembership } from '../context/SessionContext';
import { GET_BUSINESS_JOBS } from '../graphql/job';
import { AccountScreen } from '../screens/owner/AccountScreen';
import { BusinessScreen } from '../screens/owner/BusinessScreen';
import { OwnerHomeScreen } from '../screens/owner/OwnerHomeScreen';
import { RequestsScreen } from '../screens/owner/RequestsScreen';
import { ScheduleScreen } from '../screens/owner/ScheduleScreen';
import { TeamScreen } from '../screens/owner/TeamScreen';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import type { OwnerManagerTabParamList } from './ownerManagerTypes';

/**
 * Owner/Manager tabs. OWNER and MANAGER share one app: the API gives them the
 * same reads and differs only on a few mutations (`setMemberPayRate` and
 * `recordPayout` are OWNER-only), which is a per-action check rather than a
 * different set of tabs.
 *
 * Only `Today` is built — the other five are placeholders that name the query
 * behind them. See each screen.
 */

/**
 * Icons live next to the param list so adding a tab is one edit in one place —
 * TypeScript flags a missing entry here the moment a route is added.
 */
const ICONS: Record<keyof OwnerManagerTabParamList, keyof typeof Ionicons.glyphMap> = {
    Today: 'today-outline',
    Requests: 'mail-outline',
    Schedule: 'calendar-outline',
    Team: 'people-outline',
    Business: 'briefcase-outline',
    Account: 'person-outline',
};

// Six tabs is a tight bar, so the icon and label both run a little small.
const ICON_SIZE = 22;

const Tab = createBottomTabNavigator<OwnerManagerTabParamList>();

export function OwnerManagerTabs() {
    // Real count, not decorative: same PENDING query NeedsAttentionSection runs.
    // A second independent useQuery for the identical document + variables is
    // fine here — Apollo's normalized cache serves it, it doesn't double the
    // network request. Kept separate rather than sharing state with that
    // component so the tab bar doesn't depend on the Today tab having mounted.
    const membership = useActiveMembership();
    const { data } = useQuery(GET_BUSINESS_JOBS, {
        variables: { businessId: membership.business.id, statuses: ['PENDING'] },
    });
    const pendingCount = data?.getBusinessJobs.length ?? 0;

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textMuted,
                // White bar over the tinted page background, with a hairline to
                // separate the two. Height and the bottom safe-area inset are
                // left to React Navigation — overriding them is what usually
                // causes a double-padded bar on devices with a home indicator.
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                },
                tabBarLabelStyle: {
                    fontFamily: fonts.bodySemiBold,
                    fontSize: 10,
                },
                tabBarIcon: ({ color }) => (
                    <Ionicons name={ICONS[route.name]} size={ICON_SIZE} color={color} />
                ),
            })}
        >
            <Tab.Screen name="Today" component={OwnerHomeScreen} />
            <Tab.Screen
                name="Requests"
                component={RequestsScreen}
                options={{
                    tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
                    tabBarBadgeStyle: { backgroundColor: colors.danger },
                }}
            />
            <Tab.Screen name="Schedule" component={ScheduleScreen} />
            <Tab.Screen name="Team" component={TeamScreen} />
            <Tab.Screen name="Business" component={BusinessScreen} />
            <Tab.Screen name="Account" component={AccountScreen} />
        </Tab.Navigator>
    );
}
