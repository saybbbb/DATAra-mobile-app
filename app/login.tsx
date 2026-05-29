import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Platform,
} from "react-native";
import { useUser } from "../context/UserContext";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from "../constants/Config";

// Get screen dimensions for background positioning
const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { setPhone } = useUser();

  const handleLogin = async () => {
    // 1. Validation Logic
    if (!phoneNumber.trim() || !password.trim()) {
      if (Platform.OS === 'web') window.alert("Please fill in all fields.");
      else Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (phoneNumber.length !== 11) {
      if (Platform.OS === 'web') window.alert("Please enter a valid 11-digit phone number.");
      else Alert.alert("Error", "Please enter a valid 11-digit phone number.");
      return;
    }

    try {
      // 2. API Call
      const response = await fetch(`${API_BASE_URL}/api/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: phoneNumber,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // 3. Success Handling
        setPhone(phoneNumber); // Set global state
        await AsyncStorage.setItem('userToken', data.token);

        // Ensure the path matches your app/Tabs/dashboard.tsx structure
        router.replace("/Tabs/dashboard");
      } else {
        // 4. Handle 401 Unauthorized
        const errorMsg = data.error || "Invalid phone number or password.";
        if (Platform.OS === 'web') window.alert(errorMsg);
        else Alert.alert("Login Failed", errorMsg);
      }
    } catch (error: any) {
      // 5. Network Error
      console.error("Login Error:", error);
      if (Platform.OS === 'web') window.alert("Cannot reach server. Verify your IP in .env.");
      else Alert.alert("Network Error", "Cannot reach server. Verify your IP in .env.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#101622" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main Content */}
        <View style={styles.contentContainer}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Image
                source={require("../assets/images/public/DATAraNoText.png")}
                style={styles.logoImage}
              />
            </View>
            <Text style={styles.screenTitle}>LOGIN</Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            {/* Phone Number Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconContainer}>
                  <MaterialIcons name="phone" size={20} color="#64748b" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="+63 912 345 6789"
                  placeholderTextColor="#64748b"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  maxLength={11}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <View style={styles.passwordHeader}>
                <Text style={styles.label}>Password</Text>
                <TouchableOpacity onPress={() => router.push("/Auth/forgot-password" as any)}>
                  <Text style={styles.forgotPassword}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconContainer}>
                  <MaterialIcons
                    name="lock-outline"
                    size={20}
                    color="#64748b"
                  />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#64748b"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIconContainer}
                >
                  <MaterialIcons
                    name={showPassword ? "visibility" : "visibility-off"}
                    size={20}
                    color="#64748b"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionContainer}>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
              >
                <Text style={styles.loginButtonText}>Log In</Text>
                <MaterialIcons name="arrow-forward" size={18} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don't have an account? {" "}
              <Link href="/register" asChild>
                <Text style={styles.signUpText}>Sign Up</Text>
              </Link>
            </Text>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  contentContainer: {
    paddingVertical: 32,
  },
  logoImage: {
    width: 167,
    height: 160,
    borderRadius: 50,
    shadowColor: "#1e3a8a",
    shadowOffset: { width: 5, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 10,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 40,
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
    marginBottom: 16,
    shadowColor: "#135bec",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
    marginTop: 40,
    letterSpacing: 1,
  },
  formContainer: {
    width: "100%",
    gap: 20,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#cbd5e1",
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(28, 34, 46, 0.6)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(51, 65, 85, 0.5)",
    height: 56,
  },
  inputIconContainer: {
    paddingLeft: 16,
    paddingRight: 12,
  },
  input: {
    flex: 1,
    color: "white",
    fontSize: 16,
    height: "100%",
  },
  eyeIconContainer: {
    paddingRight: 16,
    paddingLeft: 8,
  },
  passwordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginLeft: 4,
  },
  forgotPassword: {
    fontSize: 12,
    color: "#135bec",
    fontWeight: "600",
  },
  actionContainer: {
    paddingTop: 16,
    gap: 16,
  },
  loginButton: {
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
  loginButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  footer: {
    marginTop: 24,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#94a3b8",
  },
  signUpText: {
    color: "#135bec",
    fontWeight: "600",
  },
});
