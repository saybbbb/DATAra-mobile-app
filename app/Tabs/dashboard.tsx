import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
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
  Image,
} from 'react-native';

import { BottomNavItem } from '../../components/BottomNavItem';
import { SmallCard } from '../../components/SmallCard';
import { StatItem } from '../../components/StatItem';
import { useUser } from '../../context/UserContext';
import NotificationPanel, { Notification } from '../../components/NotificationPanel';

export default function DashboardScreen() {
  const { phone, readNotifIds, setReadNotifIds } = useUser();

  useEffect(() => {
    if (!phone) {
      router.replace("/"); // Redirect to login if phone is missing
    }
    fetchSummary();
  }, [phone]);

  const [summaryData, setSummaryData] = useState<any>(null);
  const [usageList, setUsageList] = useState<any[]>([]);

  const fetchSummary = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;
      
      const headers = { 'Authorization': `Token ${token}` };
      
      const sumRes = await fetch(`${API_BASE_URL}/api/usage/summary/`, { headers });
      if (sumRes.ok) {
        setSummaryData(await sumRes.json());
      }
      
      const usageRes = await fetch(`${API_BASE_URL}/api/usage/`, { headers });
      if (usageRes.ok) {
        setUsageList(await usageRes.json());
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    }
  };

  const [activeTab, setActiveTab] = useState('Home');
  const [isNotifVisible, setNotifVisible] = useState(false);

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

  // Dynamic Top App Icon
  const getAppIconInfo = (appName: string) => {
    switch (appName) {
      case 'Facebook': return { name: 'facebook-f', color: '#1877f2' };
      case 'YouTube': return { name: 'youtube', color: '#ff0000' };
      case 'TikTok': return { name: 'tiktok', color: '#000000' };
      case 'Instagram': return { name: 'instagram', color: '#e1306c' };
      case 'Chrome': return { name: 'chrome', color: '#4285f4' };
      case 'Netflix': return { name: 'play', color: '#e50914' };
      case 'Spotify': return { name: 'spotify', color: '#1db954' };
      case 'Roblox': return { name: 'gamepad', color: '#000000' };
      default: return { name: 'mobile-alt', color: '#64748b' };
    }
  };

  const topAppIcon = getAppIconInfo(summaryData?.top_app);

  // Dynamic Mini Chart heights
  const recentUsage = usageList.slice(0, 5);
  const getBarHeight = (index: number) => {
    if (recentUsage[index]) {
      // Max height 50, assume 500mb is around max
      return Math.max(10, Math.min(50, (recentUsage[index].data_used_mb / 500) * 50));
    }
    return 10;
  };
  // Build local / client-generated notifications (backend-ready shape)
  const notifications: Notification[] = [];
  if (percent >= 90) {
    notifications.push({ id: 1, title: 'Extreme Usage Alert', message: `You have consumed ${percent}% of your limit. Please slow down.`, created_at: 'Just now', type: 'extreme', is_read: readNotifIds.includes(1) });
  } else if (percent >= 75) {
    notifications.push({ id: 1, title: 'Data Limit Warning', message: `You have consumed ${percent}% of your limit.`, created_at: 'Just now', type: 'warning', is_read: readNotifIds.includes(1) });
  }
  notifications.push({ id: 2, title: 'Welcome to DATAra', message: 'Keep tracking your data efficiently!', created_at: '1 day ago', type: 'info', is_read: readNotifIds.includes(2) });

  const handleMarkAllRead = () => {
    setReadNotifIds(notifications.map(n => n.id));
  };

  const unreadCount = notifications.filter(n => !readNotifIds.includes(n.id)).length;

  const handleHistory =()=>
    router.push('/Tabs/history')
  
  const handleSettings =()=>
    router.push('/Tabs/settings')
  
    const handleSetting =()=>
        router.push('/Tabs/settings')


  const getRingStyles = () => {
    const unfilledColor = '#e0e7ff';
    const filledColor = paceConfig.chartColor;
    if (percent >= 90) {
      // Extreme pace - mostly full
      return {
        borderColor: filledColor,
      };
    } else if (percent >= 75) {
      // Warning pace - 3 quarters full
      return {
        borderColor: filledColor,
        borderRightColor: unfilledColor,
      };
    }
    // Normal pace - half full
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
              <Text style={styles.subtitleText}>This is your current Usage</Text>
            </View>
          </View>

          {/* Main Usage Card */}
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
                iconColor="#16a34a"
                iconBgColor="#dcfce7"
                label="Total Used"
                value={summaryData ? `${(summaryData.total_used_mb / 1024).toFixed(2)} GB` : "0 GB"}
                subValue={`OUT OF ${summaryData ? Math.round(summaryData.total_limit_mb / 1024) : 0} GB`}
              />
              <StatItem
                icon="schedule"
                iconColor="#1d4ed8"
                iconBgColor="#dbeafe"
                label="Predicted"
                value="8hrs"
                subValue="LEFT"
              />
              <StatItem
                icon="trending-up"
                iconColor="#1d4ed8"
                iconBgColor="#dbeafe"
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

          {/* Bottom Small Cards */}
          <View style={styles.smallCardsRow}>
            <SmallCard title="Top Usage:">
              <View style={styles.topUsageContent}>
                <View style={[styles.facebookIcon, { backgroundColor: topAppIcon.color }]}>
                  <FontAwesome5 name={topAppIcon.name as any} size={24} color="white" />
                </View>
                <View>
                  <Text style={styles.facebookText}>{summaryData?.top_app || "N/A"}</Text>
                  <Text style={styles.facebookSubText}>Total Used</Text>
                  <Text style={styles.facebookSubTextInfo}>{summaryData?.top_app_usage_mb ? `${(summaryData.top_app_usage_mb / 1024).toFixed(2)} GB` : "0 GB"}</Text>
                </View>
              </View>
            </SmallCard>

            <SmallCard title="Consumption:">
              <View style={styles.consumptionContent}>
                <View style={styles.barsContainer}>
                  <View style={[styles.bar, { height: getBarHeight(0) }]} />
                  <View style={[styles.bar, { height: getBarHeight(1) }]} />
                  <View style={[styles.bar, { height: getBarHeight(2) }]} />
                  <View style={[styles.bar, { height: getBarHeight(3) }]} />
                  <View style={[styles.bar, { height: getBarHeight(4) }]} />
                </View>
                <View style={styles.consumptionInfo}>
                  <Text style={styles.consumptionRate}>{summaryData ? Math.round(summaryData.daily_average_mb / 24) : 0}mb</Text>
                  <Text style={styles.consumptionRateLabel}>per hour</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.seeDetailsBtn} onPress={handleHistory}>
                <Text style={styles.seeDetailsText}>SEE DETAILS</Text>
              </TouchableOpacity>
            </SmallCard>
          </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNavWrapper}>
          <BottomNavItem
            iconName="home"
            label="HOME"
            isActive={activeTab === 'Home'}
            onPress={() => setActiveTab('Home')}
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

      {/* Notifications Panel – slides in from right */}
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
    backgroundColor: '#e2e8f0', // Light slate blue/gray background match
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
  scrollContent: {
    paddingTop: 190, // push down past the static header text to prevent overlap
    paddingHorizontal: 20,
    paddingBottom: 100, // accommodate bottom nav
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
    marginVertical: 20,
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
    // Un-rotate the text
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
  smallCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  topUsageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  facebookIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1877f2', // Facebook blue
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  facebookText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  facebookSubText: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  facebookSubTextInfo: {
    fontSize: 10,
    color: '#cbd5e1',
  },
  consumptionContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 50,
    width: '50%',
    justifyContent: 'space-between',
  },
  bar: {
    width: 6,
    backgroundColor: '#3b00ff', // main theme blue
    borderRadius: 3,
  },
  consumptionInfo: {
    alignItems: 'flex-start',
    width: '45%',
  },
  consumptionRate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  consumptionRateLabel: {
    fontSize: 10,
    color: '#0f172a',
    fontWeight: '500',
  },
  seeDetailsBtn: {
    alignSelf: 'center',
    marginTop: 16,
  },
  seeDetailsText: {
    fontSize: 10,
    color: '#3b00ff',
    fontWeight: 'bold',
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
