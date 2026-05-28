import { MaterialIcons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../constants/Config';
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Modal,
    Image,
} from 'react-native';

import { BottomNavItem } from '../../components/BottomNavItem';
import { BarEntry, DetailsCard, TimeFilter } from '../../components/DetailsCard';
import { StatItem } from '../../components/StatItem';
import { useUser } from '../../context/UserContext';

export default function HistoryScreen() {
    const { phone, readNotifIds, setReadNotifIds } = useUser();
    const [activeTab, setActiveTab] = useState('History');
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('HOURS');
    const [summaryData, setSummaryData] = useState<any>(null);
    const [barData, setBarData] = useState<BarEntry[]>([]);
    const [allUsage, setAllUsage] = useState<any[]>([]);
    const [isNotifVisible, setNotifVisible] = useState(false);

    // Stats
    let percent = 0;
    if (summaryData && summaryData.total_limit_mb > 0) {
        percent = Math.round((summaryData.total_used_mb / summaryData.total_limit_mb) * 100);
    }

    let paceConfig = {
        text: "USAGE: NORMAL PACE",
        buttonColor: "#16a34a", // Green
        chartColor: "#2563eb", // Blue
    };

    if (percent >= 90) {
        paceConfig = {
            text: "USAGE: EXTREME PACE",
            buttonColor: "#dc2626", // Red
            chartColor: "#dc2626", // Red
        };
    } else if (percent >= 75) {
        paceConfig = {
            text: "USAGE: WARNING PACE",
            buttonColor: "#ea580c", // Orange
            chartColor: "#ea580c", // Orange
        };
    }

    const notifications: { id: number; title: string; message: string; time: string; type: string }[] = [];
    if (percent >= 90) {
        notifications.push({ id: 1, title: 'Extreme Usage Alert', message: `You have consumed ${percent}% of your limit. Please slow down.`, time: 'Just now', type: 'extreme' });
    } else if (percent >= 75) {
        notifications.push({ id: 1, title: 'Data Limit Warning', message: `You have consumed ${percent}% of your limit.`, time: 'Just now', type: 'warning' });
    }
    notifications.push({ id: 2, title: 'Welcome to DATAra', message: 'Keep tracking your data efficiently!', time: '1 day ago', type: 'info' });

    const handleMarkAllRead = () => {
        setReadNotifIds(notifications.map(n => n.id));
    };

    const unreadCount = notifications.filter(n => !readNotifIds.includes(n.id)).length;

    useEffect(() => {
        fetchHistoryData();
    }, []);

    useEffect(() => {
        updateBarData(allUsage, timeFilter);
    }, [allUsage, timeFilter]);

    const updateBarData = (data: any[], filter: TimeFilter) => {
        if (!data || data.length === 0) {
            setBarData([{ label: 'No Data', height: 10, value: '0mb' }]);
            return;
        }

        let formatted: BarEntry[] = [];

        if (filter === 'HOURS') {
            const todayStr = new Date().toISOString().split('T')[0];
            const todayRecords = data.filter(d => d.date === todayStr);
            
            formatted = todayRecords.slice(0, 7).map((item: any) => {
                const heightVal = Math.min((item.data_used_mb / 200) * 100, 100);
                return {
                    label: item.time_slot.split('-')[0], 
                    height: heightVal > 10 ? heightVal : 10,
                    value: `${Math.round(item.data_used_mb)}mb`
                };
            }).reverse();
        } else if (filter === 'DAYS') {
            const dailyData: Record<string, number> = {};
            data.forEach(item => {
                dailyData[item.date] = (dailyData[item.date] || 0) + item.data_used_mb;
            });
            const sortedDates = Object.keys(dailyData).sort().reverse().slice(0, 7);
            formatted = sortedDates.map(date => {
                const total = dailyData[date];
                const heightVal = Math.min((total / 1000) * 100, 100); 
                const dateObj = new Date(date);
                const dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                return {
                    label: dayLabel,
                    height: heightVal > 10 ? heightVal : 10,
                    value: `${Math.round(total)}mb`
                };
            }).reverse();
        } else if (filter === 'WEEKS') {
            const weeklyData: Record<string, number> = {};
            const dates = data.map(d => new Date(d.date).getTime());
            const latest = Math.max(...dates);
            
            data.forEach(item => {
                const itemTime = new Date(item.date).getTime();
                const diffDays = Math.floor((latest - itemTime) / (1000 * 60 * 60 * 24));
                const weekIdx = Math.floor(diffDays / 7);
                if (weekIdx < 4) { 
                    weeklyData[`Wk ${4 - weekIdx}`] = (weeklyData[`Wk ${4 - weekIdx}`] || 0) + item.data_used_mb;
                }
            });
            
            formatted = Object.keys(weeklyData).sort().map(weekLabel => {
                const total = weeklyData[weekLabel];
                const heightVal = Math.min((total / 5000) * 100, 100); 
                return {
                    label: weekLabel,
                    height: heightVal > 10 ? heightVal : 10,
                    value: `${Math.round(total)}mb`
                };
            });
        }

        if (formatted.length === 0) {
            formatted = [{ label: 'No Data', height: 10, value: '0mb' }];
        }
        setBarData(formatted);
    };

    const fetchHistoryData = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) return;
            
            const headers = { 'Authorization': `Token ${token}` };
            
            const summaryRes = await fetch(`${API_BASE_URL}/api/usage/summary/`, { headers });
            if (summaryRes.ok) {
                setSummaryData(await summaryRes.json());
            }

            const usageRes = await fetch(`${API_BASE_URL}/api/usage/`, { headers });
            if (usageRes.ok) {
                const data = await usageRes.json();
                setAllUsage(data);
            }
        } catch (error) {
            console.error("Failed to fetch history data:", error);
        }
    };
    
    const handleSettings =()=>
        router.push('/Tabs/settings')
    
    const handleHome =()=>
        router.push('/Tabs/dashboard')
    

    
    const handleHistory =()=>
        router.replace('/Tabs/history')

    const getRingStyles = () => {
        const unfilledColor = '#e0e7ff';
        const filledColor = paceConfig.chartColor;
        if (percent >= 90) {
            return { borderColor: filledColor };
        } else if (percent >= 75) {
            return {
                borderColor: filledColor,
                borderRightColor: unfilledColor,
            };
        }
        return {
            borderColor: filledColor,
            borderTopColor: unfilledColor,
            borderRightColor: unfilledColor,
        };
    };

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
                        <Text style={styles.phoneNumber}>{phone ? `${phone}` : '63 08312035'}</Text>
                        <MaterialIcons name="keyboard-arrow-down" size={20} color="white" />
                    </View>
                    <View style={styles.profileSection}>
                        <TouchableOpacity onPress={() => setNotifVisible(true)} style={{ position: 'relative' }}>
                            <MaterialIcons name="notifications-none" size={28} color="white" style={{ marginRight: 12 }} />
                            {unreadCount > 0 && (
                                <View style={styles.badgeContainer}>
                                    <Text style={styles.badgeText}>{unreadCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>{summaryData?.full_name ? summaryData.full_name.charAt(0).toUpperCase() : 'U'}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Greeting */}
                <View style={styles.greetingContainer}>
                    <Text style={styles.greetingText}>
                        Hi <Text style={styles.greetingName}>{summaryData?.full_name || 'User'}!</Text>
                    </Text>
                    <Text style={styles.subtitleText}>This is your usage history</Text>
                </View>
            </View>

                {/* Main Usage Card - same size as dashboard */}
                <View style={styles.mainCard}>

                    {/* Circular Chart Placeholder */}
                    <View style={styles.chartContainer}>
                        <View style={[styles.circleOuter, getRingStyles()]}>
                            <View style={styles.circleInner}>
                                <Text style={styles.circleTextMain}>
                                    {percent}%
                                </Text>
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
                            value={summaryData ? `${(summaryData.total_used_mb / 1024).toFixed(2)} GB` : "0 GB"}
                            subValue={`OUT OF ${summaryData ? Math.round(summaryData.total_limit_mb / 1024) : 0} GB`}
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
                            value={summaryData ? `${(summaryData.daily_average_mb / 1024).toFixed(2)} GB` : "0 GB"}
                            subValue="PER DAY"
                        />
                    </View>

                    <View
                        style={[styles.paceButton, { backgroundColor: paceConfig.buttonColor, shadowColor: paceConfig.buttonColor }]}
                    >
                        <MaterialIcons name="calendar-today" size={20} color="white" />
                        <Text style={styles.paceButtonText}>
                            {paceConfig.text}
                        </Text>
                    </View>
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
            
            {/* Notifications Modal */}
            <Modal visible={isNotifVisible} transparent={true} animationType="fade">
                <View style={styles.notifOverlay}>
                <View style={styles.notifContent}>
                    <View style={styles.notifHeader}>
                    <View>
                        <Text style={styles.notifTitle}>Notifications</Text>
                        {unreadCount > 0 && (
                            <TouchableOpacity onPress={handleMarkAllRead}>
                                <Text style={{ color: '#3b82f6', fontSize: 13, marginTop: 4, fontWeight: '600' }}>Mark all as read</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity onPress={() => setNotifVisible(false)}>
                        <MaterialIcons name="close" size={24} color="#94a3b8" />
                    </TouchableOpacity>
                    </View>
                    <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                    {notifications.map(n => (
                        <View key={n.id} style={[styles.notifItem, readNotifIds.includes(n.id) && { opacity: 0.5 }]}>
                        <MaterialIcons 
                            name={n.type === 'extreme' ? 'error' : n.type === 'warning' ? 'warning' : 'info'} 
                            size={28} 
                            color={n.type === 'extreme' ? '#dc2626' : n.type === 'warning' ? '#ea580c' : '#3b82f6'} 
                            style={{ marginRight: 14 }} 
                        />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.notifItemTitle}>{n.title}</Text>
                            <Text style={styles.notifItemMsg}>{n.message}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.notifItemTime}>{n.time}</Text>
                            {!readNotifIds.includes(n.id) && <View style={styles.unreadDot} />}
                        </View>
                        </View>
                    ))}
                    </ScrollView>
                </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e2e8f0',
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
    notifOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    notifContent: {
        backgroundColor: '#1e293b',
        borderRadius: 20,
        padding: 20,
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    notifHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
        paddingBottom: 15,
    },
    notifTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    notifItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    notifItemTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    notifItemMsg: {
        color: '#94a3b8',
        fontSize: 13,
    },
    notifItemTime: {
        color: '#64748b',
        fontSize: 11,
        marginTop: 4,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#3b82f6',
        marginTop: 6,
    },
    badgeContainer: {
        position: 'absolute',
        top: -4,
        right: 8,
        backgroundColor: '#ef4444',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#101622',
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
});
