import { MaterialIcons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { BottomNavItem } from '../../components/BottomNavItem';
import { useUser } from '../../context/UserContext';

export default function ProfileScreen() {
    const { phone } = useUser();

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0d1320" />
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Avatar */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarCircle}>
                        {/* Placeholder avatar — swap with real image when ready */}
                        <View style={styles.avatarInner}>
                            <MaterialIcons name="person" size={72} color="#94a3b8" />
                        </View>
                    </View>
                </View>

                {/* E-SIM Badge */}
                <View style={styles.esimRow}>
                    <View style={styles.esimBadge}>
                        <Text style={styles.esimText}>E-SIM</Text>
                    </View>
                    <Text style={styles.phoneNumber}>{phone ? `+${phone}` : '+63 08312035'}</Text>
                    <MaterialIcons name="keyboard-arrow-down" size={20} color="white" />
                </View>

                {/* Info Boxes */}
                <View style={styles.infoContainer}>
                    <View style={styles.infoBox}>
                        <Text style={styles.infoText}>Charlie C. Omongos</Text>
                    </View>

                    <View style={styles.infoBox}>
                        <Text style={styles.infoText}>Zone 13 B, Puli, Carmen, CDO</Text>
                    </View>

                    <View style={styles.infoBox}>
                        <Text style={styles.infoText}>DESU</Text>
                    </View>
                </View>

                {/* Log Out */}
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={() => router.replace('/')}
                >
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Bottom Navigation */}
            <View style={styles.bottomNavContainer}>
                <View style={styles.bottomNavWrapper}>
                    <BottomNavItem iconName="home" label="HOME" isActive={false}
                        onPress={() => router.push('/Tabs/dashboard')} />
                    <BottomNavItem iconName="history" label="HISTORY" isActive={false}
                        onPress={() => router.push('/Tabs/history')} />
                    <BottomNavItem iconName="settings" label="SETTINGS" isActive={false}
                        onPress={() => router.push('/Tabs/settings')} />
                    <BottomNavItem iconName="person-outline" label="PROFILE" isActive={true}
                        onPress={() => { }} />
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
    scrollContent: {
        paddingTop: 40,
        paddingHorizontal: 28,
        paddingBottom: 110,
        alignItems: 'center',
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    avatarCircle: {
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: '#dbeafe',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInner: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e2e8f0',
    },
    esimRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
    },
    esimBadge: {
        backgroundColor: '#334155',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginRight: 8,
    },
    esimText: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: 'bold',
    },
    phoneNumber: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
        marginRight: 4,
    },
    infoContainer: {
        width: '100%',
        gap: 12,
        marginBottom: 40,
    },
    infoBox: {
        backgroundColor: '#e2e8f0',
        borderRadius: 12,
        paddingVertical: 18,
        paddingHorizontal: 20,
    },
    infoText: {
        color: '#0f172a',
        fontSize: 15,
        fontWeight: '600',
    },
    logoutButton: {
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
