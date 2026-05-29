import { Stack } from "expo-router";
import { UserProvider } from "../context/UserContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { View, StyleSheet, Platform } from "react-native";

function AppContent() {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: Platform.OS === "web" ? (isDarkMode ? "#101622" : "#f1f5f9") : undefined }]}>
      <View style={[styles.mobileContainer, { backgroundColor: colors.background }]}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: Platform.OS === "web" ? "center" : undefined,
    paddingVertical: Platform.OS === "web" ? 20 : 0,
  },
  mobileContainer: {
    flex: 1,
    width: "100%",
    maxWidth: Platform.OS === "web" ? 480 : "100%",
    boxShadow: Platform.OS === "web" ? "0 0 30px rgba(0,0,0,0.2)" : undefined,
    borderRadius: Platform.OS === "web" ? 24 : 0,
    overflow: "hidden",
  },
});
