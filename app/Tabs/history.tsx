import { MaterialIcons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import { BottomNavItem } from '../../components/BottomNavItem';
import { BarEntry, DetailsCard, TimeFilter } from '../../components/DetailsCard';
import { StatItem } from '../../components/StatItem';
import { useUser } from '../../context/UserContext';

export default function HistoryScreen() {
    const { phone } = useUser();
    const [activeTab, setActiveTab] = useState('History');
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('HOURS');
    const [paceIndex, setPaceIndex] = useState(0);

    const paces = ['normal', 'warning', 'extreme'];
    const currentPace = paces[paceIndex];

    const togglePace = () => {
        setPaceIndex((prev) => (prev + 1) % paces.length);
    };
        // Stats
        let paceConfig = {
        text: "USAGE: NORMAL PACE",
        percent: "70%",
        buttonColor: "#16a34a", // Green
        chartColor: "#2563eb", // Blue
    };

    if (currentPace === 'warning') {
        paceConfig = {
        text: "USAGE: WARNING PACE",
        percent: "80%",
        buttonColor: "#ea580c", // Orange
        chartColor: "#ea580c", // Orange
        };
    } else if (currentPace === 'extreme') {
        paceConfig = {
        text: "USAGE: EXTREME PACE",
        percent: "85%",
        buttonColor: "#dc2626", // Red
        chartColor: "#dc2626", // Red
        };
    }

    // When your database is ready, replace this with fetched data
    const barData: BarEntry[] = [
        { label: '0:00-1:00', height: 80, value: '400mb' },
        { label: '1:00-2:00', height: 40, value: '200mb' },
        { label: '2:00-3:00', height: 60, value: '300mb' },
        { label: '3:00-4:00', height: 30, value: '100mb' },
        { label: '4:00-5:00', height: 70, value: '350mb' },
        { label: '5:00-6:00', height: 50, value: '250mb' },
        { label: '6:00-7:00', height: 40, value: '200mb' },
    ]
    
    const handleSettings =()=>
        router.push('/Tabs/settings')
    
    const handleHome =()=>
        router.push('/Tabs/dashboard')
    

    
    const handleHistory =()=>
        router.replace('/Tabs/history')

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#101622" />
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Header Area Background */}
            <View style={styles.headerBackground}>
                {/* Top Navigation */}
                <View style={styles.topNav}>
                    <View style={styles.esimBadge}>
                        <Text style={styles.esimText}>E-SIM</Text>
                        <Text style={styles.phoneNumber}>{phone ? `+${phone}` : '+63 08312035'}</Text>
                        <MaterialIcons name="keyboard-arrow-down" size={20} color="white" />
                    </View>
                    <View style={styles.profileSection}>
                        <MaterialIcons name="notifications-none" size={28} color="white" style={{ marginRight: 12 }} />
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>C</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Greeting */}
                <View style={styles.greetingContainer}>
                    <Text style={styles.greetingText}>
                        Hi <Text style={styles.greetingName}>Malunggay Pandesal!</Text>
                    </Text>
                    <Text style={styles.subtitleText}>This is your usage history</Text>
                </View>
            </View>

                {/* Main Usage Card - same size as dashboard */}
                <View style={styles.mainCard}>

                    {/* Circular Chart Placeholder */}
                    <View style={styles.chartContainer}>
                        <View style={[styles.circleOuter, { borderColor: paceConfig.chartColor }]}>
                            <View style={styles.circleInner}>
                                <Text style={styles.circleTextMain}>{paceConfig.percent}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <StatItem
                            icon="keyboard-double-arrow-up"
                            iconColor="white"
                            iconBgColor="#16a34a"
                            label="Total Used"
                            value="7 GB"
                            subValue="OUT OF 14 GB"
                        />
                        <StatItem
                            icon="schedule"
                            iconColor="white"
                            iconBgColor="#2563eb"
                            label="Predicted"
                            value="8hrs"
                            subValue="LEFT"
                        />
                        <StatItem
                            icon="trending-up"
                            iconColor="white"
                            iconBgColor="#2563eb"
                            label="Daily Avg"
                            value="1.5 GB"
                            subValue="PER DAY"
                        />
                    </View>

                    {/* Usage Pace Button */}
                    <TouchableOpacity
                        style={[styles.paceButton, { backgroundColor: paceConfig.buttonColor, shadowColor: paceConfig.buttonColor }]}
                        onPress={togglePace}
                    >
                        <MaterialIcons name="calendar-today" size={20} color="white" />
                        <Text style={styles.paceButtonText}>
                            {paceConfig.text}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Details Card — reusable component, swap barData from DB when ready */}
                <DetailsCard
                    barData={barData}
                    timeFilter={timeFilter}
                    onTimeFilterChange={setTimeFilter}
                />
            </ScrollView>

            {/* Bottom Navigation Wrapper fixed at bottom */}
            <View style={styles.bottomNavContainer}>
                <View style={styles.bottomNavWrapper}>
                    <BottomNavItem
                        iconName="home"
                        label="HOME"
                        isActive={activeTab === 'Home'}
                        onPress={handleHome}
                    />
                    <BottomNavItem
                        iconName="history"
                        label="HISTORY"
                        isActive={activeTab === 'History'}
                        onPress={handleHistory}
                    />
                    <BottomNavItem
                        iconName="settings"
                        label="SETTINGS"
                        isActive={activeTab === 'Settings'}
                        onPress={handleSettings}
                    />

                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#101622',
    },
    scrollContent: {
        paddingTop: 190,
        paddingHorizontal: 20,
        paddingBottom: 110,
    },
    headerBackground: {
        backgroundColor: '#101622',
        paddingTop: 50, // accommodate status bar roughly
        paddingHorizontal: 20,
        paddingBottom: 80,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 300,
    },
    topNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    esimBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    esimText: {
        color: '#9ca3af',
        fontSize: 12,
        fontWeight: 'bold',
        backgroundColor: '#4b5563',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginRight: 8,
    },
    phoneNumber: {
        color: 'white',
        fontSize: 14,
        marginRight: 4,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#bfdbfe',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'white',
    },
    avatarPlaceholder: {
        backgroundColor: '#f8cda5', // dummy generic skin color tone block
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#d97706',
        fontWeight: 'bold',
        fontSize: 18,
    },
    greetingContainer: {
        marginTop: 10,
    },
    greetingText: {
        color: 'white',
        fontSize: 18,
    },
    greetingName: {
        fontWeight: 'bold',
    },
    subtitleText: {
        color: '#cbd5e1',
        fontSize: 14,
        marginTop: 4,
    },
    mainCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
        marginBottom: 20,
    },

    chartContainer: {
        marginTop: 20,
        marginBottom: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    circleOuter: {
        width: 180,
        height: 180,
        borderRadius: 90,
        borderWidth: 16,
        borderColor: '#2563eb', // Blue
        borderTopColor: '#c7d2fe',
        borderRightColor: '#c7d2fe',
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ rotate: '-45deg' }],
    },
    circleInner: {
        transform: [{ rotate: '45deg' }],
        alignItems: 'center',
        justifyContent: 'center',
    },
    circleTextMain: {
        fontSize: 32,
        fontWeight: '900',
        color: '#1e1b4b',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 24,
        paddingHorizontal: 10,
    },
    paceButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#16a34a', // Green
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        width: '100%',
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    paceButtonText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 8,
        fontSize: 14,
    },
    detailsCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
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
