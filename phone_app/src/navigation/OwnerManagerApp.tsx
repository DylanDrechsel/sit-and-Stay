import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { AssignSitterScreen } from '../screens/owner/AssignSitterScreen';
import { OwnerManagerTabs } from './OwnerManagerTabs';
import type { OwnerManagerStackParamList } from './ownerManagerTypes';

const Stack = createNativeStackNavigator<OwnerManagerStackParamList>();

/**
 * The owner/manager app: a stack whose first route is the whole tab bar.
 *
 * Detail screens belong here rather than as tabs — pushing `AssignSitter` over
 * the tabs gives it the full screen and a back button, instead of adding a tab
 * nobody navigates to directly. Param lists live in `ownerManagerTypes.ts` so
 * screens can type `useNavigation()` without importing this module back.
 */
export function OwnerManagerApp() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Tabs" component={OwnerManagerTabs} />
            <Stack.Screen name="AssignSitter" component={AssignSitterScreen} />
        </Stack.Navigator>
    );
}
