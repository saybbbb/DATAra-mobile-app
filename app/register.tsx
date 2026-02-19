import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Dimensions,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

// Get screen dimensions for background positioning
const { width, height } = Dimensions.get("window");

export default function RegisterScreen() {
    const router = useRouter();
    const [phoneNumber, setPhoneNumber] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#101622" />

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Main Content */}
                <View style={styles.contentContainer}>

                    {/* Logo Section */}
                    <View style={styles.logoSection}>
                        <View style={styles.logoContainer}>
                            <MaterialIcons name="equalizer" size={48} color="#135bec" />
                            <View style={styles.logoPulse} />
                        </View>
                        <Text style={styles.appName}>DATAra</Text>
                        <Text style={styles.appTagline}>Create your account.</Text>
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
                                    placeholder="+1 (555) 000-0000"
                                    placeholderTextColor="#64748b"
                                    value={phoneNumber}
                                    onChangeText={setPhoneNumber}
                                    keyboardType="phone-pad"
                                    autoCapitalize="none"
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

                        {/* Actions */}
                        <View style={styles.actionContainer}>
                            <TouchableOpacity style={styles.loginButton}>
                                <Text style={styles.loginButtonText}>Sign Up</Text>
                                <MaterialIcons name="arrow-forward" size={18} color="white" />
                            </TouchableOpacity>

                            <View style={styles.dividerContainer}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>OR SIGN UP WITH</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            <View style={styles.socialGrid}>
                                <TouchableOpacity style={styles.socialButton}>
                                    <FontAwesome name="github" size={20} color="white" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.socialButton}>
                                    <FontAwesome name="apple" size={20} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>

                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            Already have an account?{" "}
                            <Link href="/" asChild>
                                <Text style={styles.signUpText}>Log In</Text>
                            </Link>
                        </Text>
                    </View>

                </View>
            </ScrollView>

            {/* Background Mesh Gradient Simulation - Moved to bottom to stay behind but zIndex control in RN is order-based usually, or explicit zIndex */}
            <View style={styles.backgroundMesh}>
                <View style={styles.gradientOrb1} />
                <View style={styles.gradientOrb2} />
                <View style={styles.gradientOrb3} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#101622",
    },
    backgroundMesh: {
        ...StyleSheet.absoluteFillObject,
        overflow: "hidden",
        zIndex: -1,
    },
    gradientOrb1: {
        position: "absolute",
        top: -100,
        left: -100,
        width: width * 0.8,
        height: width * 0.8,
        borderRadius: 999,
        backgroundColor: "rgba(19, 91, 236, 0.15)", // Primary with low opacity
        transform: [{ scale: 1.5 }],
    },
    gradientOrb2: {
        position: "absolute",
        top: 0,
        right: -100,
        width: width * 0.7,
        height: width * 0.7,
        borderRadius: 999,
        backgroundColor: "rgba(19, 91, 236, 0.1)",
    },
    gradientOrb3: {
        position: "absolute",
        bottom: -50,
        right: -50,
        width: width,
        height: width,
        borderRadius: 999,
        backgroundColor: "rgba(19, 91, 236, 0.05)",
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
    logoPulse: {
        position: "absolute",
        top: -4,
        right: -4,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: "#135bec",
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
});
