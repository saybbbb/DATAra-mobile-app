import { MaterialIcons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import React, { useState } from 'react';
import {
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { BottomNavItem } from '../../components/BottomNavItem';

export default function SettingsScreen() {
    const [pushEnabled, setPushEnabled] = useState(true);

    const handleHistory =()=>
        router.push('/Tabs/history')
    
    const handleHome =()=>
        router.push('/Tabs/dashboard')
    
    const handleSetting =()=>
            router.push('/Tabs/profile')

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0d1320" />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Settings List */}
            <View style={styles.listContainer}>
                {/* Manage Profile */}
                <TouchableOpacity style={styles.row} onPress={handleSetting}>
                    <MaterialIcons name="person-outline" size={28} color="white" style={styles.rowIcon} />
                    <Text style={styles.rowText}>Manage Profile</Text>
                </TouchableOpacity>

                {/* Password and Security */}
                <TouchableOpacity style={styles.row}>
                    <MaterialIcons name="lock-outline" size={28} color="white" style={styles.rowIcon} />
                    <Text style={styles.rowText}>Password and Security</Text>
                </TouchableOpacity>

                {/* Push Notification */}
                <View style={styles.row}>
                    <MaterialIcons name="notifications-none" size={28} color="white" style={styles.rowIcon} />
                    <Text style={[styles.rowText, { flex: 1 }]}>Push Notification</Text>
                    <Switch
                        value={pushEnabled}
                        onValueChange={setPushEnabled}
                        trackColor={{ false: '#475569', true: '#22c55e' }}
                        thumbColor="white"
                    />
                </View>

                {/* Log Out */}
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={() => router.replace('/')}
                >
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>
            </View>

            {/* Bottom Navigation */}
            <View style={styles.bottomNavContainer}>
                <View style={styles.bottomNavWrapper}>
                    <BottomNavItem iconName="home" label="HOME" isActive={false}
                        onPress={handleHome} />
                    <BottomNavItem iconName="history" label="HISTORY" isActive={false}
                        onPress={handleHistory} />
                    <BottomNavItem iconName="settings" label="SETTINGS" isActive={true}
                        onPress={} />
                    <BottomNavItem iconName="person-outline" label="PROFILE" isActive={false}
                        onPress={handleSetting} />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0d1320',
    },
    listContainer: {
        flex: 1,
        paddingTop: 80,
        paddingHorizontal: 32,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 22,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    rowIcon: {
        marginRight: 20,
    },
    rowText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    logoutButton: {
        marginTop: 60,
        alignSelf: 'center',
        backgroundColor: '#dc2626',
        paddingVertical: 14,
        paddingHorizontal: 48,
        borderRadius: 30,
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    logoutText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    bottomNavContainer: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        alignItems: 'center',
    },
    bottomNavWrapper: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 30,
        paddingVertical: 12,
        paddingHorizontal: 20,
        justifyContent: 'space-between',
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
});
