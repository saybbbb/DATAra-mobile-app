import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { API_BASE_URL } from '../../constants/Config';

import { BottomNavItem } from '../../components/BottomNavItem';
import { DataInsightCard } from '../../components/DataInsightCard';
import NotificationPanel, { Notification } from '../../components/NotificationPanel';
import { SmallCard } from '../../components/SmallCard';
import { StatItem } from '../../components/StatItem';
import { useUser } from '../../context/UserContext';
import { WS_URL } from '../../context/ApiConfig';
import { useTheme } from '../../context/ThemeContext';

export default function DashboardScreen() {
  const { phone, readNotifIds, setReadNotifIds } = useUser();
  const { isDarkMode, colors } = useTheme();
  const wsRef = useRef<WebSocket | null>(null);

  // Data budget
  const [dataLimit, setDataLimit] = useState('350');
  const [isTracking, setIsTracking] = useState(false);

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
        const data = await sumRes.json();
        setSummaryData(data);
        setSummary(data);
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
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    full_name: '',
    total_used_mb: 0.0,
    total_limit_mb: 14336.0, // 14 GB default
    daily_average_mb: 0.0,
    top_app: 'Facebook',
    top_app_usage_mb: 0.0
  });

  const [prediction, setPrediction] = useState({
    hours_remaining: 8.0,
    depletion_time: '',
    runs_out_before_expiry: false,
    usage_pace: 'normal',
    hours_to_expiry: 72.0
  });

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;
    let isMounted = true;

    const fetchSummaryAndConnect = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) return;

        // Fetch dashboard summary statistics
        const res = await fetch(`${API_BASE_URL}/api/usage/summary/`, {
          headers: { 'Authorization': `Token ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setSummary(data);
          }

          // Establish real-time WebSocket prediction connection
          const initialRemaining = Math.max(0.0, data.total_limit_mb - data.total_used_mb);
          
          const connectWS = () => {
            if (!isMounted) return;
            
            console.log("Connecting to Live Prediction WebSocket: ", `${WS_URL}/ws/predictions/?token=${token}`);
            ws = new WebSocket(`${WS_URL}/ws/predictions/?token=${token}`);
            wsRef.current = ws;

            ws.onopen = () => {
              console.log("WebSocket prediction connection opened.");
              // Send current stats with a mock package expiry (e.g. 3 days from now)
              const expiryTime = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
              ws?.send(JSON.stringify({
                remaining_mb: initialRemaining,
                expiry_time: expiryTime,
                screen_on: 4.0,
                battery_level: 80.0
              }));
            };

            ws.onmessage = (event) => {
              try {
                const response = JSON.parse(event.data);
                if (response.status === 'prediction_updated' && isMounted) {
                  setPrediction({
                    hours_remaining: response.hours_remaining,
                    depletion_time: response.depletion_time,
                    runs_out_before_expiry: response.runs_out_before_expiry,
                    usage_pace: response.usage_pace,
                    hours_to_expiry: response.hours_to_expiry
                  });
                  setLoading(false);
                }
              } catch (err) {
                console.error("Error parsing WebSocket prediction payload:", err);
              }
            };

            ws.onerror = (error) => {
              console.error("WebSocket connection error:", error);
            };

            ws.onclose = () => {
              console.log("WebSocket closed. Attempting reconnect in 3 seconds...");
              if (isMounted) {
                reconnectTimeout = setTimeout(connectWS, 3000);
              }
            };
          };

          connectWS();
        }
      } catch (err) {
        console.error("Error in dashboard initialization:", err);
      }
    };

    if (phone) {
      fetchSummaryAndConnect();
    }

    return () => {
      isMounted = false;
      if (ws) ws.close();
      wsRef.current = null;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [phone]);

  const currentPace = prediction.usage_pace || 'normal';
  const percentUsed = summary.total_limit_mb > 0
    ? Math.min(100, Math.round((summary.total_used_mb / summary.total_limit_mb) * 100))
    : 0;

  let paceConfig = {
    text: "USAGE: NORMAL PACE",
    buttonColor: "#16a34a", // Green
    progressColor: "#16a34a",
  };

  if (percent >= 90) {
    paceConfig = {
      text: "USAGE: EXTREME PACE",
      buttonColor: "#dc2626", // Red
      progressColor: "#dc2626",
    };
  } else if (percent >= 75) {
    paceConfig = {
      text: "USAGE: WARNING PACE",
      buttonColor: "#ea580c", // Orange
      progressColor: "#ea580c",
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
      return Math.max(10, Math.min(50, (recentUsage[index].data_used_mb / 500) * 50));
    }
    return 10;
  };

  // Build local / client-generated notifications
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

  const handleHistory = () =>
    router.push('/Tabs/history')

  const handleSettings = () =>
    router.push('/Tabs/settings')

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Navigation Bar */}
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

        {/* Real-time Warning Banner */}
        {prediction.runs_out_before_expiry && (
          <View style={styles.alertBanner}>
            <MaterialIcons name="warning" size={24} color="white" />
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>DATA DEPLETING FAST</Text>
              <Text style={styles.alertText}>
                Your data is projected to run out in {Math.round(prediction.hours_remaining)} hrs, which is BEFORE your plan expiry!
              </Text>
            </View>
          </View>
        )}

        {/* Main Usage Card — Figma-aligned with progress bar */}
        <View style={[styles.mainCard, { backgroundColor: colors.card }]}>
          {/* Stats Row */}
          <View style={styles.statsRow}>
            <StatItem
              icon="keyboard-double-arrow-up"
              iconColor="white"
              iconBgColor="#16a34a"
              label="Total Used"
              value={summary.total_used_mb >= 1024 
                ? `${(summary.total_used_mb / 1024).toFixed(1)} GB`
                : `${Math.round(summary.total_used_mb)} MB`}
              subValue={`OUT OF ${Math.round(summary.total_limit_mb / 1024)} GB`}
            />
            <StatItem
              icon="schedule"
              iconColor="white"
              iconBgColor="#2563eb"
              label="Predicted"
              value={prediction.hours_remaining >= 24 
                ? `${Math.round(prediction.hours_remaining / 24)}days`
                : `${Math.round(prediction.hours_remaining)}hrs`}
              subValue="LEFT"
            />
            <StatItem
              icon="trending-up"
              iconColor="white"
              iconBgColor="#2563eb"
              label="Daily Avg"
              value={summary.daily_average_mb >= 1024 
                ? `${(summary.daily_average_mb / 1024).toFixed(1)} GB`
                : `${Math.round(summary.daily_average_mb)} MB`}
              subValue="PER DAY"
            />
          </View>

          {/* Horizontal Progress Bar — Figma-matching */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { 
                width: `${Math.min(percentUsed, 100)}%`, 
                backgroundColor: paceConfig.progressColor 
              }]} />
            </View>
          </View>

          {/* Consumption Rate */}
          <Text style={[styles.consumptionPercent, { color: colors.text }]}>{percentUsed}%</Text>
          <Text style={[styles.consumptionLabel, { color: colors.textMuted }]}>Consumption Rate</Text>

          {/* Usage Pace Badge */}
          <View style={[styles.paceButton, { backgroundColor: paceConfig.buttonColor }]}>
            <Text style={styles.paceButtonText}>{paceConfig.text}</Text>
          </View>
        </View>

        {/* SET DATA BUDGET Section — Figma-matching */}
        <View style={[styles.budgetCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.budgetTitle, { color: colors.text }]}>SET DATA BUDGET</Text>
          <View style={styles.budgetRow}>
            <TouchableOpacity 
              style={[styles.startButton, isTracking && styles.startButtonActive]}
              onPress={() => setIsTracking(!isTracking)}
            >
              <MaterialIcons name="play-arrow" size={28} color="white" />
              <Text style={styles.startButtonText}>{isTracking ? 'TRACKING' : 'START'}</Text>
            </TouchableOpacity>
            <View style={[styles.limitBox, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
              <Text style={[styles.limitLabel, { color: colors.textMuted }]}>SET LIMIT</Text>
              <Text style={[styles.limitValue, { color: colors.text }]}>{dataLimit}mb</Text>
            </View>
          </View>
        </View>

        {/* Data Consumption Card — Figma-matching */}
        <View style={[styles.consumptionCard, { backgroundColor: colors.card }]}>
          <View style={styles.consumptionHeader}>
            <MaterialIcons name="bar-chart" size={22} color="#3b82f6" />
            <Text style={[styles.consumptionCardTitle, { color: colors.text }]}>Data Consumption</Text>
          </View>
          <View style={styles.consumptionBody}>
            <View style={styles.consumptionLeft}>
              <Text style={[styles.consumptionBigNumber, { color: colors.text }]}>
                {summaryData ? Math.round(summaryData.daily_average_mb / 24) : 0}
                <Text style={[styles.consumptionUnit, { color: colors.textMuted }]}> MB</Text>
                <Text style={[styles.consumptionPerMin, { color: colors.textMuted }]}> /min</Text>
              </Text>
              <TouchableOpacity style={styles.seeDetailsBtn} onPress={handleHistory}>
                <Text style={styles.seeDetailsText}>SEE DETAILS</Text>
                <MaterialIcons name="arrow-forward" size={14} color="#3b82f6" />
              </TouchableOpacity>
            </View>
            <View style={styles.barsContainer}>
              <View style={[styles.bar, { height: getBarHeight(0) }]} />
              <View style={[styles.bar, { height: getBarHeight(1) }]} />
              <View style={[styles.bar, { height: getBarHeight(2) }]} />
              <View style={[styles.bar, { height: getBarHeight(3) }]} />
              <View style={[styles.bar, { height: getBarHeight(4) }]} />
            </View>
          </View>
        </View>

        {/* Data Insight Card — Dynamic ML-powered */}
        <DataInsightCard
          prediction={prediction}
          percentUsed={percentUsed}
          dailyAvgMb={summary.daily_average_mb}
        />

      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavContainer}>
        <View style={[styles.bottomNavWrapper, { backgroundColor: colors.card, borderColor: colors.navBorder }]}>
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
    backgroundColor: '#0d1117',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 100,
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
  alertBanner: {
    backgroundColor: '#dc2626',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  alertTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  alertText: {
    color: '#fecaca',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  // Main Usage Card — dark card matching Figma
  mainCard: {
    backgroundColor: '#1a1f2e',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  // Horizontal Progress Bar — Figma-matching
  progressBarContainer: {
    width: '100%',
    marginBottom: 12,
  },
  progressBarTrack: {
    height: 14,
    backgroundColor: '#334155',
    borderRadius: 7,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 7,
  },
  consumptionPercent: {
    fontSize: 32,
    fontWeight: '900',
    color: 'white',
    marginTop: 8,
  },
  consumptionLabel: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 16,
  },
  paceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    width: '100%',
  },
  paceButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1,
  },
  // SET DATA BUDGET Section
  budgetCard: {
    backgroundColor: '#1a1f2e',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  budgetTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1,
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
  },
  startButtonActive: {
    backgroundColor: '#dc2626',
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  limitBox: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  limitLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  limitValue: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
  },
  // Data Consumption Card
  consumptionCard: {
    backgroundColor: '#1a1f2e',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  consumptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  consumptionCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'white',
  },
  consumptionBody: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  consumptionLeft: {
    flex: 1,
  },
  consumptionBigNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: 'white',
  },
  consumptionUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
  },
  consumptionPerMin: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  seeDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  seeDetailsText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 60,
    gap: 6,
  },
  bar: {
    width: 14,
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  // Simulation Card
  simulationCard: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  simulationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  simulationSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 16,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  controlLabel: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '500',
  },
  controlValue: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 22,
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
});
