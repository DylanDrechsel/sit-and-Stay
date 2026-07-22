import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

/**
 * Owner/Manager navigation types, kept in their own module so screens and
 * components can import them without pulling in the navigators themselves —
 * `OwnerManagerApp` imports the screens, so a screen importing back from it
 * would be a cycle.
 */

/** The bottom tab bar. */
export type OwnerManagerTabParamList = {
    Today: undefined;
    Requests: undefined;
    Schedule: undefined;
    Team: undefined;
    Business: undefined;
    Account: undefined;
};

/**
 * The stack wrapping those tabs. Detail screens live here rather than as tabs
 * so they push over the tab bar full-screen instead of appearing in it.
 */
export type OwnerManagerStackParamList = {
    Tabs: undefined;
    AssignSitter: { jobId: string };
};

/**
 * What `useNavigation()` should be typed as anywhere inside the owner app.
 *
 * Composite because a screen inside the tabs legitimately navigates to both:
 * sibling tabs (`Requests`) and parent-stack routes (`AssignSitter`). Typing it
 * as only one of the two makes half those calls a type error even though
 * React Navigation resolves both fine at runtime by bubbling up.
 */
export type OwnerManagerNavigation = CompositeNavigationProp<
    BottomTabNavigationProp<OwnerManagerTabParamList>,
    NativeStackNavigationProp<OwnerManagerStackParamList>
>;
