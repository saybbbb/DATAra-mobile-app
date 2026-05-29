import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
  Platform,
  ActivityIndicator,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

export default function WelcomePermissionScreen() {
  const [loading, setLoading] = useState(true);
  const [pulseAnim] = useState(new Animated.Value(1));

  // Check if permissions have already been walkthrough'd
  useEffect(() => {
    const checkPermissionState = async () => {
      try {
        const granted = await AsyncStorage.getItem("permissionsGranted");
        if (granted === "true") {
          // If already set, immediately skip to login
          router.replace("/login");
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("AsyncStorage error checking permissions:", err);
        setLoading(false);
      }
    };
    checkPermissionState();
  }, []);

  // Soft pulse animation for the logo area
  useEffect(() => {
    if (!loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [loading]);

  const handleGrantPermission = async () => {
    if (Platform.OS === "android") {
      try {
        // android.settings.USAGE_ACCESS_SETTINGS triggers the Usage Access settings intent directly!
        await Linking.sendIntent("android.settings.USAGE_ACCESS_SETTINGS");
      } catch (err) {
        // Fallback to standard settings if custom intent fails
        Linking.openSettings();
      }
    } else {
      // On Web/iOS, mock allow
      alert("Permission settings opened! (Simulated for Web/iOS)");
    }
  };

  const handleProceed = async () => {
    try {
      // Save state locally in AsyncStorage
      await AsyncStorage.setItem("permissionsGranted", "true");
      router.replace("/login");
    } catch (err) {
      console.error("Failed to save permission state:", err);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#135bec" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#101622" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.mainContainer}>
          {/* Logo & Welcome Header */}
          <View style={styles.headerSection}>
            <Animated.View style={[styles.logoOutline, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.logoPulseInner} />
            </Animated.View>
            <View style={styles.logoContainer}>
              <Image
                source={require("../assets/images/public/DATAraNoText.png")}
                style={styles.logoImage}
              />
            </View>
            <Text style={styles.title}>Welcome to DATAra</Text>
            <Text style={styles.subtitle}>
              Your intelligent, local-first data depletion predictor and bandwidth diagnostics dashboard.
            </Text>
          </View>

          {/* Core Feature Requirements (Explanation of native stats usage) */}
          <View style={styles.permissionsCard}>
            <Text style={styles.cardTitle}>Data Access Requirements</Text>
            <Text style={styles.cardDescription}>
              To analyze your data usage dynamically, train the ML model, and warn you before depletion occurs, DATAra requires access to two native Android APIs:
            </Text>

            {/* TrafficStats Info */}
            <View style={styles.permissionItem}>
              <View style={[styles.iconBox, { backgroundColor: "rgba(16, 185, 129, 0.15)" }]}>
                <Ionicons name="speedometer-outline" size={24} color="#10b981" />
              </View>
              <View style={styles.itemTextContent}>
                <Text style={styles.itemTitle}>Real-time Speeds (TrafficStats)</Text>
                <Text style={styles.itemDescription}>
                  Reads live network interface statistics (download/upload rates) to feed the diagnostic dashboard metrics.
                </Text>
              </View>
            </View>

            {/* NetworkStatsManager Info */}
            <View style={styles.permissionItem}>
              <View style={[styles.iconBox, { backgroundColor: "rgba(19, 91, 236, 0.15)" }]}>
                <Ionicons name="stats-chart-outline" size={24} color="#135bec" />
              </View>
              <View style={styles.itemTextContent}>
                <Text style={styles.itemTitle}>Usage History (NetworkStatsManager)</Text>
                <Text style={styles.itemDescription}>
                  Queries system-wide data metrics to build historical datasets, sync records locally/globally, and train ML predictor engines.
                </Text>
                <View style={styles.alertBadge}>
                  <MaterialIcons name="info-outline" size={12} color="#fbbf24" style={{ marginRight: 4 }} />
                  <Text style={styles.alertText}>Requires Android 'Usage Access' Permission</Text>
                </View>
              </View>
            </View>
          </View>

          {/* How to Allow Guide */}
          <View style={styles.guideCard}>
            <Text style={styles.guideTitle}>How to Enable Access:</Text>
            <View style={styles.stepRow}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
              <Text style={styles.stepText}>Tap the <Text style={styles.boldText}>"Allow Settings Access"</Text> button below.</Text>
            </View>
            <View style={styles.stepRow}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
              <Text style={styles.stepText}>Find <Text style={styles.boldText}>"DATAra-mobile-app"</Text> in the settings list.</Text>
            </View>
            <View style={styles.stepRow}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>3</Text></View>
              <Text style={styles.stepText}>Toggle on <Text style={styles.boldText}>"Permit usage access"</Text>, then return to the app.</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleGrantPermission}>
              <Ionicons name="settings-outline" size={20} color="white" />
              <Text style={styles.primaryButtonText}>Allow Settings Access</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleProceed}>
              <Text style={styles.secondaryButtonText}>I have enabled it, Continue</Text>
              <MaterialIcons name="arrow-forward" size={18} color="#135bec" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#101622",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#101622",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  mainContainer: {
    paddingVertical: 36,
    alignItems: "center",
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  logoOutline: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "rgba(19, 91, 236, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  logoPulseInner: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
    backgroundColor: "rgba(19, 91, 236, 0.05)",
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "rgba(19, 91, 236, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(19, 91, 236, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#135bec",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  logoImage: {
    width: 65,
    height: 62,
    borderRadius: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "white",
    letterSpacing: 0.5,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  permissionsCard: {
    width: "100%",
    backgroundColor: "rgba(28, 34, 46, 0.6)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(51, 65, 85, 0.4)",
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 13,
    color: "#cbd5e1",
    lineHeight: 18,
    marginBottom: 16,
  },
  permissionItem: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  itemTextContent: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
  itemDescription: {
    fontSize: 12,
    color: "#94a3b8",
    lineHeight: 16,
  },
  alertBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(251, 191, 36, 0.1)",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 6,
    borderWidth: 0.5,
    borderColor: "rgba(251, 191, 36, 0.3)",
  },
  alertText: {
    fontSize: 10,
    color: "#fbbf24",
    fontWeight: "500",
  },
  guideCard: {
    width: "100%",
    backgroundColor: "rgba(20, 26, 38, 0.4)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(51, 65, 85, 0.2)",
    padding: 16,
    marginBottom: 28,
  },
  guideTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#cbd5e1",
    marginBottom: 10,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  stepNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(19, 91, 236, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "rgba(19, 91, 236, 0.5)",
  },
  stepNumText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#135bec",
  },
  stepText: {
    flex: 1,
    fontSize: 12,
    color: "#94a3b8",
  },
  boldText: {
    fontWeight: "bold",
    color: "white",
  },
  actionContainer: {
    width: "100%",
    gap: 12,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#135bec",
    height: 56,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#1e3a8a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    height: 48,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(19, 91, 236, 0.3)",
  },
  secondaryButtonText: {
    color: "#135bec",
    fontWeight: "600",
    fontSize: 14,
  },
});
