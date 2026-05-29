import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function ResetPasswordScreen() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#101622" />


            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.contentContainer}>

                    {/* Logo */}
                    <View style={styles.logoSection}>
                        <View style={styles.logoContainer}>
                            <Image
                                source={require("../../assets/images/public/DATAraNoText.png")}
                                style={styles.logoImage}
                            />
                        </View>
                        <Text style={styles.title}>ACCOUNT RECOVERY</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.formContainer}>

                        {/* New Password */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Reset Password</Text>
                            <View style={styles.inputWrapper}>
                                <View style={styles.inputIconContainer}>
                                    <MaterialIcons name="lock-outline" size={20} color="#64748b" />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="•••••••••"
                                    placeholderTextColor="#64748b"
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

                        {/* Confirm Password */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Confirm Password</Text>
                            <View style={styles.inputWrapper}>
                                <View style={styles.inputIconContainer}>
                                    <MaterialIcons name="lock-outline" size={20} color="#64748b" />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="•••••••••"
                                    placeholderTextColor="#64748b"
                                    secureTextEntry={!showConfirm}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowConfirm(!showConfirm)}
                                    style={styles.eyeIconContainer}
                                >
                                    <MaterialIcons
                                        name={showConfirm ? "visibility" : "visibility-off"}
                                        size={20}
                                        color="#64748b"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Reset Button → back to login */}
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => router.replace("/")}
                        >
                            <Text style={styles.actionButtonText}>Reset</Text>
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
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        justifyContent: "center",
    },
    contentContainer: {
        paddingVertical: 40,
    },
    logoSection: {
        alignItems: "center",
        marginBottom: 48,
    },
    logoContainer: {
        width: 120,
        height: 120,
        borderRadius: 28,
        backgroundColor: "rgba(19, 91, 236, 0.15)",
        borderWidth: 1,
        borderColor: "rgba(19, 91, 236, 0.3)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
        shadowColor: "#135bec",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 8,
        overflow: "hidden",
    },
    logoImage: {
        width: 120,
        height: 120,
        resizeMode: "cover",
    },
    title: {
        fontSize: 26,
        fontWeight: "bold",
        color: "white",
        letterSpacing: 0.3,
    },
    formContainer: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
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
    actionButton: {
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
        marginTop: 8,
    },
    actionButtonText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 16,
    },
});
