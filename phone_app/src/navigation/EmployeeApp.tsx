import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { EmployeeHomeScreen } from '../screens/employee/EmployeeHomeScreen';

/**
 * Employee/sitter screens.
 *
 * Tabs (Today · Schedule · Earnings · Profile) come later — see
 * AI_MANIFEST_FRONTEND.md §9. A sitter's job list is `getMyJobs`, never
 * `getBusinessJobs`, which the API refuses to an EMPLOYEE.
 */
export type EmployeeStackParamList = {
    Today: undefined;
};

const Stack = createNativeStackNavigator<EmployeeStackParamList>();

export function EmployeeApp() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Today" component={EmployeeHomeScreen} />
        </Stack.Navigator>
    );
}
