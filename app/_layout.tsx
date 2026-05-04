import { Stack } from "expo-router";
import { UserProvider } from "../context/UserContext";
import { View, StyleSheet, Platform } from "react-native";

export default function RootLayout() {
  return (
    <UserProvider>
      <View style={styles.container}>
        <View style={styles.mobileContainer}>
          <Stack screenOptions={{ headerShown: false }} />
        </View>
      </View>
    </UserProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Platform.OS === "web" ? "#101622" : undefined,
    alignItems: Platform.OS === "web" ? "center" : undefined,
    paddingVertical: Platform.OS === "web" ? 20 : 0,
  },
  mobileContainer: {
    flex: 1,
    width: "100%",
    maxWidth: Platform.OS === "web" ? 480 : "100%",
    backgroundColor: "#0d1320", // The app's actual background color
    boxShadow: Platform.OS === "web" ? "0 0 30px rgba(0,0,0,0.5)" : undefined,
    borderRadius: Platform.OS === "web" ? 24 : 0,
    overflow: "hidden",
  },
});
