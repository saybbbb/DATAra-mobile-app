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
  Modal,
} from "react-native";
import { useUser } from "../context/UserContext";
import { API_BASE_URL } from "../constants/Config";

// Get screen dimensions for background positioning
const { width, height } = Dimensions.get("window");

export default function RegisterScreen() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const { setPhone } = useUser();

  const handleRegister = async () => {
    if (!termsAccepted) {
      Alert.alert("Error", "You must agree to the Terms and Conditions to register.");
      return;
    }

    if (!phoneNumber.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (phoneNumber.trim().length !== 11 || !/^\d+$/.test(phoneNumber.trim())) {
      Alert.alert("Error", "Phone number must be exactly 11 digits.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: phoneNumber,
          password: password,
          phone_number: phoneNumber,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (Platform.OS === "web") {
          window.alert("Registration successful!");
          setPhone(phoneNumber);
          window.location.href = "/";
        } else {
          Alert.alert("Success", "Registration successful!", [
            {
              text: "OK",
              onPress: () => {
                setPhone(phoneNumber);
                router.replace("/");
              },
            },
          ]);
        }
      } else {
        let errorMessage = "Please try again.";
        if (data.username) errorMessage = "Number already exists";
        else if (data.password) errorMessage = data.password[0];
        else if (data.phone_number) errorMessage = data.phone_number[0];
        Alert.alert("Registration Failed", errorMessage);
      }
    } catch (error: any) {
      Alert.alert("Network Error", "Cannot reach server: " + error.message);
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
            <Text style={styles.screenTitle}>REGISTER</Text>
          </View>

          {/* Register Form */}
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
                  autoCapitalize="none"
                  maxLength={11}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <View style={styles.passwordHeader}>
                <Text style={styles.label}>Password</Text>
              </View>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconContainer}>
                  <MaterialIcons name="lock-outline" size={20} color="#64748b" />
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

            {/* Confirm Password Input */}
            <View style={styles.inputGroup}>
              <View style={styles.passwordHeader}>
                <Text style={styles.label}>Confirm Password</Text>
              </View>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconContainer}>
                  <MaterialIcons name="lock-outline" size={20} color="#64748b" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#64748b"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIconContainer}
                >
                  <MaterialIcons
                    name={showConfirmPassword ? "visibility" : "visibility-off"}
                    size={20}
                    color="#64748b"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms and Conditions Checkbox */}
            <View style={styles.termsRow}>
              <TouchableOpacity onPress={() => setShowTermsModal(true)} style={styles.checkboxArea}>
                {termsAccepted ? (
                  <View style={styles.checkboxChecked} />
                ) : (
                  <View style={styles.checkboxUnchecked} />
                )}
              </TouchableOpacity>
              <Text style={styles.termsText}>
                Agree to{" "}
                <Text style={styles.termsLink} onPress={() => setShowTermsModal(true)}>
                  Terms and Conditions
                </Text>
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actionContainer}>
              <TouchableOpacity 
                style={[styles.loginButton, !termsAccepted && { opacity: 0.5 }]} 
                onPress={handleRegister}
                disabled={!termsAccepted}
              >
                <Text style={styles.loginButtonText}>Register</Text>
              </TouchableOpacity>
            </View>

          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account?{" "}
              <Link href="../../" asChild>
                <Text style={styles.signUpText}>Log In</Text>
              </Link>
            </Text>
          </View>

        </View>
      </ScrollView>

      <Modal visible={showTermsModal} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalContainer}>
           <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalTitle}>DATAra Terms and Conditions</Text>
              <Text style={styles.modalDate}>Last Updated: May 06, 2026</Text>
              
              <Text style={styles.modalText}>
                Welcome to DATAra. By accessing or using the DATAra mobile application ("App"), you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the App.{"\n\n"}
                <Text style={styles.modalSectionTitle}>1. Overview of the Service</Text>{"\n"}
                DATAra is a mobile application designed to help users monitor and predict mobile data consumption using machine learning. The App analyzes aggregated usage patterns to provide insights and predictions regarding data usage.{"\n\n"}
                <Text style={styles.modalSectionTitle}>2. Data Collection and Usage</Text>{"\n"}
                DATAra collects only the following types of data:{"\n"}
                • Mobile data usage (e.g., total data consumed){"\n"}
                • Timestamp information (e.g., when data is used){"\n"}
                • Phone number (for OTP verification){"\n"}
                DATAra does not collect or monitor specific applications used on your device. All data collected is aggregated and used solely for analysis and prediction purposes.{"\n\n"}
                <Text style={styles.modalSectionTitle}>3. Machine Learning and Predictions</Text>{"\n"}
                DATAra uses machine learning models to estimate and predict user data consumption.{"\n"}
                These models:{"\n"}
                • Operate primarily on-device{"\n"}
                • May utilize the user local data to enhance globally trained model for improved accuracy{"\n"}
                Predictions are estimation only and may not always be accurate. DATAra does not guarantee the correctness of predictions.{"\n\n"}
                <Text style={styles.modalSectionTitle}>4. User Accounts and Security</Text>{"\n"}
                Users are required to register using their phone number. This information is used for:{"\n"}
                • Account verification{"\n"}
                • Security purposes{"\n"}
                Users are responsible for maintaining the confidentiality of their account information.{"\n\n"}
                <Text style={styles.modalSectionTitle}>5. Data Storage and User Control</Text>{"\n"}
                • User data is primarily stored locally on the device{"\n"}
                • Users have the right to delete their account and associated data at any time{"\n"}
                Users has the option to share their data usage with DATAra. The app will always ask for permission before anything is sent. Only usage data is shared—users phone number and name are never included. This is:{"\n"}
                • Optional{"\n"}
                • Done only with explicit user consent{"\n\n"}
                <Text style={styles.modalSectionTitle}>6. Privacy Commitment</Text>{"\n"}
                DATAra respects user privacy. Specifically:{"\n"}
                • The App does not track specific app usage{"\n"}
                • The App does not access personal content or files{"\n"}
                • Only aggregated data usage is analyzed{"\n\n"}
                <Text style={styles.modalSectionTitle}>7. Free Service Disclaimer</Text>{"\n"}
                DATAra is currently provided as a free application for helping User's budget and save their Mobile data. Features and availability may change without notice.{"\n\n"}
                <Text style={styles.modalSectionTitle}>8. Limitation of Liability</Text>{"\n"}
                DATAra is provided "as is" without warranties of any kind. The developers are not liable for:{"\n"}
                • Inaccurate predictions{"\n"}
                • Data loss{"\n"}
                • Any damages arising from use of the App{"\n\n"}
                <Text style={styles.modalSectionTitle}>9. Geographic Use</Text>{"\n"}
                DATAra is currently intended for users in Cagayan De oro City Phillipines. Usage outside this region may not be fully supported.{"\n\n"}
                <Text style={styles.modalSectionTitle}>10. Changes to Terms</Text>{"\n"}
                These Terms and Conditions may be updated at any time with or without notice. Continued use of the App after changes constitutes acceptance of the updated terms.{"\n\n"}
                <Text style={styles.modalSectionTitle}>11. Contact</Text>{"\n"}
                For questions or concerns regarding these Terms, please contact the development team.{"\n"}
                By using DATAra, you acknowledge that you have read and understood these Terms and Conditions.
              </Text>
           </ScrollView>
           <View style={styles.modalFooterRow}>
             <TouchableOpacity style={styles.modalDeclineButton} onPress={() => { setTermsAccepted(false); setShowTermsModal(false); }}>
               <Text style={styles.modalButtonText}>Cancel</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.modalAcceptButton} onPress={() => { setTermsAccepted(true); setShowTermsModal(false); }}>
               <Text style={styles.modalButtonText}>Accept Terms{"\n"}and Conditions</Text>
             </TouchableOpacity>
           </View>
        </SafeAreaView>
      </Modal>

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
    justifyContent: 'center',
    zIndex: 1,
  },
  contentContainer: {
    paddingVertical: 32,
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
    elevation: 8, // Android shadow approximation
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
  logoPulse: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#135bec",
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
    marginTop: 40,
    letterSpacing: 1,
  },
  appName: {
    fontSize: 36,
    fontWeight: "bold",
    color: "white",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 14,
    color: "#94a3b8", // slate-400
    letterSpacing: 0.5,
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
    color: "#cbd5e1", // slate-300
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(28, 34, 46, 0.6)", // #1c222e + opacity
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(51, 65, 85, 0.5)", // slate-700/50
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
    shadowColor: "#1e3a8a", // blue-900
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
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#1e293b", // slate-800
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#64748b", // slate-500
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  socialGrid: {
    flexDirection: "row",
    gap: 12,
    justifyContent: 'center', // Or distribute? HTML used grid-cols-2
  },
  socialButton: {
    flex: 1,
    height: 48,
    backgroundColor: "#1c222e",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1e293b", // slate-800
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    marginTop: 24,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#94a3b8", // slate-400
  },
  signUpText: {
    color: "#135bec",
    fontWeight: "600",
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 10,
    marginBottom: 5,
    marginLeft: 4,
  },
  checkboxArea: {
    paddingRight: 10,
  },
  checkboxUnchecked: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#cbd5e1",
  },
  checkboxChecked: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#16a34a",
  },
  termsText: {
    color: "#94a3b8",
    fontSize: 12,
  },
  termsLink: {
    color: "#94a3b8",
    textDecorationLine: "underline",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  modalScroll: {
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "black",
    marginBottom: 4,
  },
  modalDate: {
    fontSize: 12,
    color: "gray",
    marginBottom: 16,
  },
  modalSectionTitle: {
    fontWeight: "bold",
    fontSize: 14,
    color: "black",
  },
  modalText: {
    fontSize: 12,
    color: "#333",
    lineHeight: 18,
    marginBottom: 40,
  },
  modalFooterRow: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "white",
    justifyContent: "space-between",
  },
  modalDeclineButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    flex: 0.45,
  },
  modalAcceptButton: {
    backgroundColor: "#16a34a",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    flex: 0.5,
  },
  modalButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
    textAlign: "center",
  },
});
