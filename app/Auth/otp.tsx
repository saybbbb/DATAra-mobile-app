import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
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

export default function OtpScreen() {
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const inputs = useRef<Array<TextInput | null>>([]);

    const handleChange = (text: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);
        if (text && index < 5) {
            inputs.current[index + 1]?.focus();
        }
    };

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

                    {/* OTP */}
                    <View style={styles.formContainer}>
                        <Text style={styles.label}>Enter OTP code</Text>
                        <View style={styles.otpRow}>
                            {otp.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={(ref) => { inputs.current[index] = ref; }}
                                    style={styles.otpBox}
                                    value={digit}
                                    onChangeText={(text) => handleChange(text.slice(-1), index)}
                                    keyboardType="number-pad"
                                    maxLength={1}
                                    selectionColor="#135bec"
                                />
                            ))}
                        </View>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => router.push("/Auth/reset-password")}
                        >
                            <Text style={styles.actionButtonText}>Continue</Text>
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
    label: {
        fontSize: 14,
        fontWeight: "500",
        color: "#cbd5e1",
        marginLeft: 4,
    },
    otpRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
    },
    otpBox: {
        flex: 1,
        height: 56,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(51, 65, 85, 0.6)",
        backgroundColor: "rgba(28, 34, 46, 0.6)",
        color: "white",
        fontSize: 20,
        fontWeight: "bold",
        textAlign: "center",
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
