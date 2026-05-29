import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { BottomNavItem } from '../../components/BottomNavItem';
import { SmallCard } from '../../components/SmallCard';
import { StatItem } from '../../components/StatItem';
import { useUser } from '../../context/UserContext';
import { API_URL, WS_URL } from '../../context/ApiConfig';

export default function DashboardScreen() {
  const { phone } = useUser();
  const wsRef = useRef<WebSocket | null>(null);

  // Dynamic prediction inputs
  const [remainingMb, setRemainingMb] = useState(5000.0);
  const [screenOnHours, setScreenOnHours] = useState(4.0);
  const [batteryLevel, setBatteryLevel] = useState(80.0);

  useEffect(() => {
    if (!phone) {
      router.replace("/"); // Redirect to login if phone is missing
    }
  }, [phone]);

  const [activeTab, setActiveTab] = useState('Home');
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
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isMounted = true;

    const fetchSummaryAndConnect = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) return;

        // Fetch dashboard summary statistics
        const res = await fetch(`${API_URL}/api/usage/summary/`, {
          headers: { 'Authorization': `Token ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setSummary(data);
            setRemainingMb(Math.max(0.0, data.total_limit_mb - data.total_used_mb));
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
                screen_on: screenOnHours,
                battery_level: batteryLevel
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

  // Handle live simulation input changes
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const expiryTime = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      wsRef.current.send(JSON.stringify({
        remaining_mb: remainingMb,
        expiry_time: expiryTime,
        screen_on: screenOnHours,
        battery_level: batteryLevel
      }));
    }
  }, [remainingMb, screenOnHours, batteryLevel]);

  const currentPace = prediction.usage_pace || 'normal';
  const percentUsed = summary.total_limit_mb > 0
    ? Math.min(100, Math.round((summary.total_used_mb / summary.total_limit_mb) * 100))
    : 0;

  const togglePace = () => {
    // This is now bound to the WebSocket, button click sends manual trigger or logs status
    console.log("Pace details requested. Current mode:", currentPace);
  };

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
  
  const handleHistory =()=>
    router.push('/Tabs/history')
  
  const handleSettings =()=>
    router.push('/Tabs/settings')
  
    const handleSetting =()=>
        router.push('/Tabs/settings')


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
                  {/* Dummy avatar representation */}
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{summary.full_name ? summary.full_name[0].toUpperCase() : 'C'}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Greeting */}
            <View style={styles.greetingContainer}>
              <Text style={styles.greetingText}>
                Hi <Text style={styles.greetingName}>{summary.full_name || 'User'}!</Text>
              </Text>
              <Text style={styles.subtitleText}>This is your current Usage</Text>
            </View>
          </View>

          {/* Real-time Warning Banner */}
          {prediction.runs_out_before_expiry && (
            <View style={styles.alertBanner}>
              <MaterialIcons name="warning" size={24} color="white" />
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>DATA DEPLETING FAST</Text>
                <Text style={styles.alertText}>
                  Your data is projected to run out in {prediction.hours_remaining} hrs (around {prediction.depletion_time ? new Date(prediction.depletion_time).toLocaleDateString() : 'soon'}), which is BEFORE your dedicated expiry!
                </Text>
              </View>
            </View>
          )}

          {/* Main Usage Card */}
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
                iconColor="#16a34a"
                iconBgColor="#dcfce7"
                label="Total Used"
                value={summary.total_used_mb >= 1024 
                  ? `${(summary.total_used_mb / 1024).toFixed(1)} GB`
                  : `${Math.round(summary.total_used_mb)} MB`}
                subValue={`OUT OF ${Math.round(summary.total_limit_mb / 1024)} GB`}
              />
              <StatItem
                icon="schedule"
                iconColor="#1d4ed8"
                iconBgColor="#dbeafe"
                label="Predicted"
                value={prediction.hours_remaining >= 24 
                  ? `${Math.round(prediction.hours_remaining / 24)} days`
                  : `${Math.round(prediction.hours_remaining)} hrs`}
                subValue="LEFT"
              />
              <StatItem
                icon="trending-up"
                iconColor="#1d4ed8"
                iconBgColor="#dbeafe"
                label="Daily Avg"
                value={summary.daily_average_mb >= 1024 
                  ? `${(summary.daily_average_mb / 1024).toFixed(1)} GB`
                  : `${Math.round(summary.daily_average_mb)} MB`}
                subValue="PER DAY"
              />
            </View>

            {/* Usage Pace Button - Interactive */}
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

          {/* Interactive Simulation Controls */}
          <View style={styles.simulationCard}>
            <Text style={styles.simulationTitle}>Interactive Prediction Simulator</Text>
            <Text style={styles.simulationSubtitle}>Adjust variables to see real-time dynamic ML projections:</Text>
            
            {/* Control 1: Remaining Data */}
            <View style={styles.controlRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.controlLabel}>Remaining Data</Text>
                <Text style={styles.controlValue}>{remainingMb.toFixed(0)} MB</Text>
              </View>
              <View style={styles.stepperContainer}>
                <TouchableOpacity 
                  style={styles.stepperButton} 
                  onPress={() => setRemainingMb(prev => Math.max(0.0, prev - 500))}
                >
                  <Text style={styles.stepperText}>-</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.stepperButton} 
                  onPress={() => setRemainingMb(prev => Math.min(summary.total_limit_mb, prev + 500))}
                >
                  <Text style={styles.stepperText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Control 2: Screen-on Time */}
            <View style={styles.controlRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.controlLabel}>Est. Screen On Time</Text>
                <Text style={styles.controlValue}>{screenOnHours.toFixed(1)} hrs/day</Text>
              </View>
              <View style={styles.stepperContainer}>
                <TouchableOpacity 
                  style={styles.stepperButton} 
                  onPress={() => setScreenOnHours(prev => Math.max(0.0, prev - 0.5))}
                >
                  <Text style={styles.stepperText}>-</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.stepperButton} 
                  onPress={() => setScreenOnHours(prev => Math.min(24.0, prev + 0.5))}
                >
                  <Text style={styles.stepperText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Control 3: Battery Level */}
            <View style={styles.controlRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.controlLabel}>Battery Level</Text>
                <Text style={styles.controlValue}>{batteryLevel.toFixed(0)}%</Text>
              </View>
              <View style={styles.stepperContainer}>
                <TouchableOpacity 
                  style={styles.stepperButton} 
                  onPress={() => setBatteryLevel(prev => Math.max(0.0, prev - 5))}
                >
                  <Text style={styles.stepperText}>-</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.stepperButton} 
                  onPress={() => setBatteryLevel(prev => Math.min(100.0, prev + 5))}
                >
                  <Text style={styles.stepperText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Bottom Small Cards */}
          <View style={styles.smallCardsRow}>
            <SmallCard title={`Top Usage: ${summary.top_app || 'App'}`}>
              <View style={styles.topUsageContent}>
                <View style={styles.facebookIcon}>
                  <FontAwesome5 
                    name={summary.top_app?.toLowerCase() === 'facebook' ? 'facebook-f' : 'mobile-alt'} 
                    size={24} 
                    color="white" 
                  />
                </View>
                <View>
                  <Text style={styles.facebookText}>{summary.top_app || 'Facebook'}</Text>
                  <Text style={styles.facebookSubText}>Total Used</Text>
                  <Text style={styles.facebookSubTextInfo}>
                    {summary.top_app_usage_mb >= 1024 
                      ? `${(summary.top_app_usage_mb / 1024).toFixed(1)} GB`
                      : `${Math.round(summary.top_app_usage_mb)} MB`}
                  </Text>
                </View>
              </View>
            </SmallCard>

            <SmallCard title="Consumption:">
              <View style={styles.consumptionContent}>
                {/* Simple Bar Chart UI Mockup */}
                <View style={styles.barsContainer}>
                  <View style={[styles.bar, { height: currentPace === 'extreme' ? 45 : 20 }]} />
                  <View style={[styles.bar, { height: currentPace === 'extreme' ? 50 : 35 }]} />
                  <View style={[styles.bar, { height: currentPace === 'extreme' ? 48 : 25 }]} />
                  <View style={[styles.bar, { height: currentPace === 'extreme' ? 50 : 50 }]} />
                  <View style={[styles.bar, { height: currentPace === 'extreme' ? 49 : 30 }]} />
                </View>
                <View style={styles.consumptionInfo}>
                  <Text style={styles.consumptionRate}>
                    {currentPace === 'extreme' ? '450mb' : currentPace === 'warning' ? '280mb' : '120mb'}
                  </Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#cbd5e1', // Light slate blue/gray background match
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
  // Circular gauge approximation using borders
  circleOuter: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 16,
    borderColor: '#2563eb', // Blue
    borderTopColor: '#c7d2fe', // Lighter shade for the "unfilled" portion
    borderRightColor: '#c7d2fe',
    justifyContent: 'center',
    alignItems: 'center',
    // Rotate so light blue starts from roughly the top right
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
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '600',
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
  alertBanner: {
    backgroundColor: '#dc2626', // Red
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
});
