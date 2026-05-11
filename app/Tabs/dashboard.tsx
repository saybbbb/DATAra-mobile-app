import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import React, { useState, useEffect } from 'react';
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
import { SmallCard } from '../../components/SmallCard';
import { StatItem } from '../../components/StatItem';
import { useUser } from '../../context/UserContext';

export default function DashboardScreen() {
  const { phone } = useUser();

  useEffect(() => {
  if (!phone) {
    router.replace("/"); // Redirect to login if phone is missing
  }
}, [phone]);

  const [activeTab, setActiveTab] = useState('Home');
  const [paceIndex, setPaceIndex] = useState(0);

  const paces = ['normal', 'warning', 'extreme'];
  const currentPace = paces[paceIndex];

  const togglePace = () => {
    setPaceIndex((prev) => (prev + 1) % paces.length);
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
              <Text style={styles.subtitleText}>This is your current Usage</Text>
            </View>
          </View>

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
                value="7 GB"
                subValue="OUT OF 14 GB"
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
                value="1.5 GB"
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

          {/* Bottom Small Cards */}
          <View style={styles.smallCardsRow}>
            <SmallCard title="Top Usage:">
              <View style={styles.topUsageContent}>
                <View style={styles.facebookIcon}>
                  <FontAwesome5 name="facebook-f" size={24} color="white" />
                </View>
                <View>
                  <Text style={styles.facebookText}>Facebook</Text>
                  <Text style={styles.facebookSubText}>Total Used</Text>
                  <Text style={styles.facebookSubTextInfo}>5GB</Text>
                </View>
              </View>
            </SmallCard>

            <SmallCard title="Consumption:">
              <View style={styles.consumptionContent}>
                {/* Simple Bar Chart UI Mockup */}
                <View style={styles.barsContainer}>
                  <View style={[styles.bar, { height: 20 }]} />
                  <View style={[styles.bar, { height: 35 }]} />
                  <View style={[styles.bar, { height: 25 }]} />
                  <View style={[styles.bar, { height: 50 }]} />
                  <View style={[styles.bar, { height: 30 }]} />
                </View>
                <View style={styles.consumptionInfo}>
                  <Text style={styles.consumptionRate}>250mb</Text>
                  <Text style={styles.consumptionRateLabel}>per min</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.seeDetailsBtn}>
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

});
