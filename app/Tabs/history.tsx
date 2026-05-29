import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Linking,
    ActivityIndicator,
    Alert,
    Platform,
} from 'react-native';
import { API_BASE_URL } from '../../constants/Config';

import { BottomNavItem } from '../../components/BottomNavItem';
import { BarEntry, TimeFilter } from '../../components/DetailsCard';
import NotificationPanel, { Notification } from '../../components/NotificationPanel';
import { UsageTable } from '../../components/UsageTable';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';

export default function HistoryScreen() {
    const { phone, readNotifIds, setReadNotifIds } = useUser();
    const { isDarkMode, colors } = useTheme();
    const [activeTab, setActiveTab] = useState('History');
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('HOURS');
    const [summaryData, setSummaryData] = useState<any>(null);
    const [barData, setBarData] = useState<BarEntry[]>([]);
    const [allUsage, setAllUsage] = useState<any[]>([]);
    const [isNotifVisible, setNotifVisible] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Stats
    let percent = 0;
    if (summaryData && summaryData.total_limit_mb > 0) {
        percent = Math.round((summaryData.total_used_mb / summaryData.total_limit_mb) * 100);
    }

    const notifications: Notification[] = [];
    if (percent >= 90) {
        notifications.push({ id: 1, title: 'Extreme Usage Alert', message: `You have consumed ${percent}% of your limit. Please slow down.`, created_at: 'Just now', type: 'extreme', is_read: readNotifIds.includes(1) });
    } else if (percent >= 75) {
        notifications.push({ id: 1, title: 'Data Limit Warning', message: `You have consumed ${percent}% of your limit.`, created_at: 'Just now', type: 'warning', is_read: readNotifIds.includes(1) });
    }
    notifications.push({ id: 2, title: 'Welcome to DATAra', message: 'Keep tracking your data efficiently!', created_at: '1 day ago', type: 'info', is_read: readNotifIds.includes(2) });

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

    // Upload CSV to global pool (connected to sync endpoint)
    const handleUploadCSV = async () => {
        setIsUploading(true);
        try {
            const storedToken = await AsyncStorage.getItem('userToken');
            if (!storedToken) return;

            const res = await fetch(`${API_BASE_URL}/api/sync/upload-global/`, {
                method: 'POST',
                headers: { 'Authorization': `Token ${storedToken}` }
            });

            if (res.ok) {
                if (Platform.OS === 'web') window.alert("CSV uploaded to global pool successfully!");
                else Alert.alert("Success", "CSV uploaded to global pool successfully!");
            } else {
                const errData = await res.json();
                const msg = errData.error || "Failed to upload CSV.";
                if (Platform.OS === 'web') window.alert(msg);
                else Alert.alert("Error", msg);
            }
        } catch (e) {
            if (Platform.OS === 'web') window.alert("Network error uploading CSV.");
            else Alert.alert("Error", "Network error uploading CSV.");
        } finally {
            setIsUploading(false);
        }
    };

    // Download CSV (connected to sync endpoint)
    const handleDownloadCSV = async () => {
        try {
            const storedToken = await AsyncStorage.getItem('userToken');
            if (!storedToken) return;
            const downloadUrl = `${API_BASE_URL}/api/sync/download-local/?token=${storedToken}`;
            Linking.openURL(downloadUrl);
        } catch (e) {
            if (Platform.OS === 'web') window.alert("Failed to initiate download.");
            else Alert.alert("Error", "Failed to initiate download.");
        }
    };

    // Build usage table data from allUsage
    const buildUsageTableData = () => {
        if (!allUsage || allUsage.length === 0) return [];

        // Group by date
        const dailyData: Record<string, { totalMb: number; count: number }> = {};
        allUsage.forEach(item => {
            if (!dailyData[item.date]) {
                dailyData[item.date] = { totalMb: 0, count: 0 };
            }
            dailyData[item.date].totalMb += item.data_used_mb;
            dailyData[item.date].count += 1;
        });

        const sortedDates = Object.keys(dailyData).sort().reverse();
        const totalDays = sortedDates.length;
        const overallAvg = totalDays > 0
            ? Object.values(dailyData).reduce((sum, d) => sum + d.totalMb, 0) / totalDays
            : 0;

        return sortedDates.map(date => {
            const d = dailyData[date];
            const dateObj = new Date(date);
            const formatted = `${dateObj.toLocaleDateString('en-US', { month: 'short' })} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;

            let status: 'HEAVY' | 'MODERATE' | 'NORMAL' = 'NORMAL';
            if (d.totalMb > overallAvg * 1.3) status = 'HEAVY';
            else if (d.totalMb > overallAvg * 0.8) status = 'MODERATE';

            return {
                date: formatted,
                totalUsed: d.totalMb >= 1024 ? `${(d.totalMb / 1024).toFixed(1)}gb` : `${Math.round(d.totalMb)}mb`,
                dailyAvg: overallAvg >= 1024 ? `${(overallAvg / 1024).toFixed(1)}gb` : `${Math.round(overallAvg)}mb`,
                duration: '12 hr',
                status,
            };
        });
    };

    const handleSettings = () => router.push('/Tabs/settings');
    const handleHome = () => router.push('/Tabs/dashboard');
    const handleHistory = () => router.replace('/Tabs/history');

    // Calculate total this month
    const getTotalThisMonth = () => {
        if (!allUsage || allUsage.length === 0) return '0.00';
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        let total = 0;
        allUsage.forEach(item => {
            const d = new Date(item.date);
            if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
                total += item.data_used_mb;
            }
        });
        return (total / 1024).toFixed(2);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Top Nav */}
                <View style={styles.topNav}>
                    <View style={[styles.esimBadge, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]}>
                        <Text style={[styles.esimText, { color: isDarkMode ? '#9ca3af' : '#475569', backgroundColor: isDarkMode ? '#4b5563' : '#cbd5e1' }]}>TM</Text>
                        <Text style={[styles.phoneNumber, { color: colors.text }]}>{phone ? `+${phone}` : '+6308312035'}</Text>
                    </View>
                    <View style={styles.profileSection}>
                        <TouchableOpacity onPress={() => setNotifVisible(true)} style={{ position: 'relative' }}>
                            <MaterialIcons name="notifications-none" size={28} color={colors.text} style={{ marginRight: 12 }} />
                            {unreadCount > 0 && (
                                <View style={[styles.badgeContainer, { borderColor: colors.background }]}>
                                    <Text style={styles.badgeText}>{unreadCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <View style={[styles.avatarContainer, { borderColor: colors.border }]}>
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>{summaryData?.full_name ? summaryData.full_name.charAt(0).toUpperCase() : 'U'}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* HISTORY Header */}
                <View style={styles.historyHeader}>
                    <Text style={[styles.historyTitle, { color: colors.text }]}>HISTORY</Text>
                    <View style={styles.historyIcons}>
                        <TouchableOpacity style={styles.historyIconBtn}>
                            <MaterialIcons name="search" size={26} color={colors.text} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.historyIconBtn} onPress={handleDownloadCSV}>
                            <MaterialIcons name="file-download" size={26} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* TOTAL THIS MONTH Card with Chart */}
                <View style={[styles.totalCard, { backgroundColor: colors.card }]}>
                    <View style={styles.totalCardHeader}>
                        <View>
                            <Text style={[styles.totalLabel, { color: colors.textMuted }]}>TOTAL THIS MONTH</Text>
                            <Text style={[styles.totalValue, { color: colors.text }]}>{getTotalThisMonth()} <Text style={[styles.totalUnit, { color: colors.textMuted }]}>GB</Text></Text>
                        </View>
                        {/* Time Filter Tabs */}
                        <View style={[styles.filterTabs, { backgroundColor: colors.background }]}>
                            {(['HOURS', 'DAYS', 'WEEKS'] as TimeFilter[]).map(f => (
                                <TouchableOpacity
                                    key={f}
                                    style={[styles.filterTab, timeFilter === f && { backgroundColor: isDarkMode ? '#334155' : '#cbd5e1' }]}
                                    onPress={() => setTimeFilter(f)}
                                >
                                    <Text style={[styles.filterTabText, { color: colors.textMuted }, timeFilter === f && { color: colors.text }]}>
                                        {f === 'HOURS' ? 'Daily' : f === 'DAYS' ? 'Weekly' : 'Monthly'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Bar Chart */}
                    <View style={styles.chartArea}>
                        {barData.map((entry, index) => (
                            <View key={index} style={styles.chartColumn}>
                                <Text style={[styles.chartValue, { color: colors.textMuted }]}>{entry.value}</Text>
                                <View style={[styles.chartBar, { height: entry.height }]} />
                                <Text style={[styles.chartLabel, { color: colors.textMuted }]}>{entry.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* DETAIL LOGS */}
                <View style={styles.detailLogsHeader}>
                    <Text style={[styles.detailLogsTitle, { color: colors.text }]}>DETAIL LOGS</Text>
                    <TouchableOpacity style={[styles.filterBtn, { backgroundColor: colors.card }]}>
                        <MaterialIcons name="filter-list" size={18} color={colors.text} />
                        <Text style={[styles.filterBtnText, { color: colors.text }]}>Filter</Text>
                    </TouchableOpacity>
                </View>

                {/* Detail Log Cards */}
                {allUsage.slice(0, 5).map((item, index) => (
                    <View key={index} style={[styles.logCard, { backgroundColor: colors.card }]}>
                        <View style={styles.logCardRow}>
                            <View style={styles.logCardCol}>
                                <Text style={[styles.logCardDate, { color: colors.text }]}>{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</Text>
                                <Text style={[styles.logCardTime, { color: colors.textMuted }]}>{item.time_slot?.split('-')[0] || '12:00pm'}</Text>
                            </View>
                            <View style={styles.logCardCol}>
                                <Text style={[styles.logCardLabel, { color: colors.textMuted }]}>Data consumed</Text>
                                <Text style={[styles.logCardValue, { color: colors.text }]}>{item.data_used_mb >= 1024 ? `${(item.data_used_mb / 1024).toFixed(1)}gb` : `${Math.round(item.data_used_mb)}mb`}</Text>
                            </View>
                            <View style={styles.logCardCol}>
                                <Text style={[styles.logCardLabel, { color: colors.textMuted }]}>Session Duration</Text>
                                <Text style={[styles.logCardValue, { color: colors.text }]}>2h 15m</Text>
                            </View>
                            <View style={styles.logCardCol}>
                                <Text style={[styles.logCardLabel, { color: colors.textMuted }]}>Peak Speed</Text>
                                <Text style={[styles.logCardValue, { color: colors.text }]}>4.2mb/s</Text>
                            </View>
                        </View>
                    </View>
                ))}

                {/* Usage Table with Upload/Download CSV */}
                <UsageTable
                    data={buildUsageTableData()}
                    onUploadCSV={handleUploadCSV}
                    onDownloadCSV={handleDownloadCSV}
                />

                {isUploading && (
                    <View style={styles.uploadingOverlay}>
                        <ActivityIndicator size="large" color="#22c55e" />
                        <Text style={styles.uploadingText}>Uploading...</Text>
                    </View>
                )}

            </ScrollView>

            {/* Bottom Navigation */}
            <View style={styles.bottomNavContainer}>
                <View style={[styles.bottomNavWrapper, { backgroundColor: colors.card, borderColor: colors.navBorder }]}>
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

            {/* Notifications Panel */}
            <NotificationPanel
                visible={isNotifVisible}
                onClose={() => setNotifVisible(false)}
                localNotifications={notifications}
                readNotifIds={readNotifIds}
                onMarkAllRead={setReadNotifIds}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0d1117',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 110,
    },
    topNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
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
        overflow: 'hidden',
    },
    phoneNumber: {
        color: 'white',
        fontSize: 14,
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
        backgroundColor: '#f8cda5',
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
        borderColor: '#0d1117',
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    // HISTORY Header
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    historyTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        letterSpacing: 1,
    },
    historyIcons: {
        flexDirection: 'row',
        gap: 12,
    },
    historyIconBtn: {
        padding: 4,
    },
    // Total This Month Card
    totalCard: {
        backgroundColor: '#1a1f2e',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
    },
    totalCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    totalLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#94a3b8',
        letterSpacing: 0.5,
    },
    totalValue: {
        fontSize: 28,
        fontWeight: '900',
        color: 'white',
        marginTop: 4,
    },
    totalUnit: {
        fontSize: 16,
        fontWeight: '600',
        color: '#94a3b8',
    },
    filterTabs: {
        flexDirection: 'row',
        backgroundColor: '#0d1117',
        borderRadius: 10,
        padding: 3,
    },
    filterTab: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    filterTabActive: {
        backgroundColor: '#334155',
    },
    filterTabText: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '600',
    },
    filterTabTextActive: {
        color: 'white',
    },
    // Chart Area
    chartArea: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 120,
        paddingTop: 10,
    },
    chartColumn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    chartValue: {
        fontSize: 9,
        color: '#64748b',
        marginBottom: 4,
    },
    chartBar: {
        width: 12,
        backgroundColor: '#3b82f6',
        borderRadius: 4,
        minHeight: 6,
    },
    chartLabel: {
        fontSize: 10,
        color: '#94a3b8',
        marginTop: 6,
        fontWeight: '500',
    },
    // Detail Logs
    detailLogsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    detailLogsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        letterSpacing: 0.5,
    },
    filterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1f2e',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    filterBtnText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    // Log Cards
    logCard: {
        backgroundColor: '#1a1f2e',
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
    },
    logCardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    logCardCol: {
        alignItems: 'center',
    },
    logCardDate: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '600',
    },
    logCardTime: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 2,
    },
    logCardLabel: {
        fontSize: 10,
        color: '#64748b',
        fontWeight: '500',
    },
    logCardValue: {
        fontSize: 12,
        color: 'white',
        fontWeight: 'bold',
        marginTop: 2,
    },
    // Upload indicator
    uploadingOverlay: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    uploadingText: {
        color: '#22c55e',
        marginTop: 8,
        fontSize: 14,
        fontWeight: '600',
    },
    // Bottom Navigation
    bottomNavContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        alignItems: 'center',
    },
    bottomNavWrapper: {
        flexDirection: 'row',
        backgroundColor: '#1a1f2e',
        borderRadius: 30,
        paddingVertical: 12,
        paddingHorizontal: 20,
        justifyContent: 'space-between',
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#2a2f3e',
    },
});
