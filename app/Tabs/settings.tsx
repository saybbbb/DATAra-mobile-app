import { MaterialIcons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
    Modal,
    ActivityIndicator,
    Alert,
    Platform,
    Linking
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { BottomNavItem } from '../../components/BottomNavItem';
import { API_BASE_URL } from '../../constants/Config';
import { WS_URL } from '../../context/ApiConfig';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';

export default function SettingsScreen() {
    const { phone } = useUser();
    const { isDarkMode, setIsDarkMode, colors } = useTheme();
    const [strictDataSaver, setStrictDataSaver] = useState(false);

    // Simulator states
    const [isSimModalVisible, setSimModalVisible] = useState(false);
    const [simRemainingMb, setSimRemainingMb] = useState(5000.0);
    const [simScreenOnHours, setSimScreenOnHours] = useState(4.0);
    const [simBatteryLevel, setSimBatteryLevel] = useState(80.0);
    const [simPrediction, setSimPrediction] = useState<any>({
        hours_remaining: 8.0,
        depletion_time: '',
        runs_out_before_expiry: false,
        usage_pace: 'normal',
        hours_to_expiry: 72.0
    });
    const simWsRef = useRef<WebSocket | null>(null);

    const openSimModal = async () => {
        setSimModalVisible(true);
        try {
            const storedToken = await AsyncStorage.getItem('userToken');
            if (!storedToken) return;

            const res = await fetch(`${API_BASE_URL}/api/usage/summary/`, {
                headers: { 'Authorization': `Token ${storedToken}` }
            });
            let initialRemaining = 5000.0;
            if (res.ok) {
                const data = await res.json();
                initialRemaining = Math.max(0.0, data.total_limit_mb - data.total_used_mb);
                setSimRemainingMb(initialRemaining);
            }

            console.log("Simulator connecting to WebSocket: ", `${WS_URL}/ws/predictions/?token=${storedToken}`);
            const ws = new WebSocket(`${WS_URL}/ws/predictions/?token=${storedToken}`);
            simWsRef.current = ws;

            ws.onopen = () => {
                const expiryTime = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
                ws.send(JSON.stringify({
                    remaining_mb: initialRemaining,
                    expiry_time: expiryTime,
                    screen_on: simScreenOnHours,
                    battery_level: simBatteryLevel
                }));
            };

            ws.onmessage = (event) => {
                try {
                    const response = JSON.parse(event.data);
                    if (response.status === 'prediction_updated') {
                        setSimPrediction({
                            hours_remaining: response.hours_remaining,
                            depletion_time: response.depletion_time,
                            runs_out_before_expiry: response.runs_out_before_expiry,
                            usage_pace: response.usage_pace,
                            hours_to_expiry: response.hours_to_expiry
                        });
                    }
                } catch (err) {
                    console.error("Error parsing simulator WebSocket payload:", err);
                }
            };

            ws.onerror = (error) => {
                console.error("Simulator WebSocket error:", error);
            };

            ws.onclose = () => {
                console.log("Simulator WebSocket closed.");
            };
        } catch (e) {
            console.error("Error setting up simulator WebSocket:", e);
        }
    };

    const closeSimModal = () => {
        setSimModalVisible(false);
        if (simWsRef.current) {
            simWsRef.current.close();
            simWsRef.current = null;
        }
    };

    useEffect(() => {
        if (isSimModalVisible && simWsRef.current && simWsRef.current.readyState === WebSocket.OPEN) {
            const expiryTime = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
            simWsRef.current.send(JSON.stringify({
                remaining_mb: simRemainingMb,
                expiry_time: expiryTime,
                screen_on: simScreenOnHours,
                battery_level: simBatteryLevel
            }));
        }
    }, [simRemainingMb, simScreenOnHours, simBatteryLevel, isSimModalVisible]);
    const [pushEnabled, setPushEnabled] = useState(true);
    const [activeTab, setActiveTab] = useState('Settings');

    // Delete Modal State
    const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // ML Diagnostics Modal State
    const [isMLModalVisible, setMLModalVisible] = useState(false);
    const [mlMetrics, setMLMetrics] = useState<any>(null);
    const [isFetchingML, setIsFetchingML] = useState(false);
    const [mlError, setMLError] = useState<string | null>(null);

    // ML/AI Prediction Report State
    const [isPredReportVisible, setPredReportVisible] = useState(false);
    const [predReport, setPredReport] = useState<any>(null);
    const [isFetchingPred, setIsFetchingPred] = useState(false);
    const [predError, setPredError] = useState<string | null>(null);

    // Data Sync Modal State
    const [isSyncModalVisible, setSyncModalVisible] = useState(false);
    const [syncStatus, setSyncStatus] = useState<any>({ network_records_count: 0, traffic_records_count: 0 });
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);
    const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);

    const handleFetchSyncStatus = async () => {
        setIsSyncing(true);
        setSyncError(null);
        setSyncSuccessMessage(null);
        try {
            const storedToken = await AsyncStorage.getItem('userToken');
            if (!storedToken) return;

            const res = await fetch(`${API_BASE_URL}/api/sync/status/`, {
                headers: { 'Authorization': `Token ${storedToken}` }
            });

            if (res.ok) {
                const data = await res.json();
                setSyncStatus(data);
            } else {
                setSyncError("Failed to load sync status.");
            }
        } catch (e) {
            setSyncError("Network error loading status.");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleGenerateMockData = async () => {
        setIsSyncing(true);
        setSyncError(null);
        setSyncSuccessMessage(null);
        try {
            const storedToken = await AsyncStorage.getItem('userToken');
            if (!storedToken) return;

            const res = await fetch(`${API_BASE_URL}/api/sync/generate-mock/`, {
                method: 'POST',
                headers: { 'Authorization': `Token ${storedToken}` }
            });

            if (res.ok) {
                const data = await res.json();
                setSyncStatus({
                    network_records_count: data.total_local_network_records,
                    traffic_records_count: data.total_local_traffic_records
                });
                setSyncSuccessMessage("Synthetic local datasets generated successfully!");
            } else {
                setSyncError("Failed to generate synthetic datasets.");
            }
        } catch (e) {
            setSyncError("Network error generating datasets.");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleUploadToGlobal = async () => {
        setIsSyncing(true);
        setSyncError(null);
        setSyncSuccessMessage(null);
        try {
            const storedToken = await AsyncStorage.getItem('userToken');
            if (!storedToken) return;

            const res = await fetch(`${API_BASE_URL}/api/sync/upload-global/`, {
                method: 'POST',
                headers: { 'Authorization': `Token ${storedToken}` }
            });

            if (res.ok) {
                setSyncSuccessMessage("Local datasets uploaded to global pool!");
            } else {
                const errData = await res.json();
                setSyncError(errData.error || "Failed to upload datasets.");
            }
        } catch (e) {
            setSyncError("Network error uploading datasets.");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleDownloadLocalData = async () => {
        try {
            const storedToken = await AsyncStorage.getItem('userToken');
            if (!storedToken) return;
            const downloadUrl = `${API_BASE_URL}/api/sync/download-local/?token=${storedToken}`;
            Linking.openURL(downloadUrl);
        } catch (e) {
            setSyncError("Failed to initiate download.");
        }
    };

    const openSyncModal = () => {
        setSyncModalVisible(true);
        handleFetchSyncStatus();
    };

    const handleFetchMLMetrics = async () => {
        setIsFetchingML(true);
        setMLError(null);
        try {
            const storedToken = await AsyncStorage.getItem('userToken');
            if (!storedToken) {
                setMLError("Authentication token not found. Please log in again.");
                return;
            }
            const res = await fetch(`${API_BASE_URL}/api/ml/metrics/`, {
                headers: {
                    'Authorization': `Token ${storedToken}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                setMLMetrics(data);
            } else if (res.status === 404) {
                setMLError("ML metrics not found. Ensure the backend model has been trained.");
            } else {
                setMLError(`Server error: status ${res.status}`);
            }
        } catch (e) {
            setMLError("Network error. Verify the backend server is running.");
        } finally {
            setIsFetchingML(false);
        }
    };

    const openMLModal = () => {
        setMLModalVisible(true);
        handleFetchMLMetrics();
    };

    // Fetch ML/AI Prediction Report (dynamic from prediction endpoint)
    const handleFetchPredReport = async () => {
        setIsFetchingPred(true);
        setPredError(null);
        try {
            const storedToken = await AsyncStorage.getItem('userToken');
            if (!storedToken) {
                setPredError("Authentication token not found.");
                return;
            }

            // Fetch summary for context
            const summaryRes = await fetch(`${API_BASE_URL}/api/usage/summary/`, {
                headers: { 'Authorization': `Token ${storedToken}` }
            });

            // Fetch ML metrics
            const metricsRes = await fetch(`${API_BASE_URL}/api/ml/metrics/`, {
                headers: { 'Authorization': `Token ${storedToken}` }
            });

            let summaryData = null;
            let metricsData = null;

            if (summaryRes.ok) summaryData = await summaryRes.json();
            if (metricsRes.ok) metricsData = await metricsRes.json();

            // Build dynamic prediction report
            const totalUsed = summaryData?.total_used_mb || 0;
            const totalLimit = summaryData?.total_limit_mb || 14336;
            const dailyAvg = summaryData?.daily_average_mb || 0;
            const percentUsed = totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0;
            const daysRemaining = dailyAvg > 0 ? Math.round((totalLimit - totalUsed) / dailyAvg) : 0;

            let usagePace = 'Normal';
            let paceColor = '#22c55e';
            if (percentUsed >= 90) { usagePace = 'Extreme'; paceColor = '#ef4444'; }
            else if (percentUsed >= 75) { usagePace = 'Warning'; paceColor = '#f59e0b'; }
            else if (percentUsed >= 50) { usagePace = 'Moderate'; paceColor = '#3b82f6'; }

            setPredReport({
                totalUsed,
                totalLimit,
                dailyAvg,
                percentUsed,
                daysRemaining,
                usagePace,
                paceColor,
                topApp: summaryData?.top_app || 'Unknown',
                topAppUsage: summaryData?.top_app_usage_mb || 0,
                modelAccuracy: metricsData?.r2_score ? `${(metricsData.r2_score * 100).toFixed(1)}%` : 'N/A',
                mae: metricsData?.mae_mb ? `${metricsData.mae_mb.toFixed(2)} MB` : 'N/A',
                datasetSize: metricsData?.dataset_size_records || 0,
            });
        } catch (e) {
            setPredError("Failed to generate prediction report.");
        } finally {
            setIsFetchingPred(false);
        }
    };

    const openPredReport = () => {
        setPredReportVisible(true);
        handleFetchPredReport();
    };

    const handleHistory = () => router.push('/Tabs/history');
    const handleHome = () => router.push('/Tabs/dashboard');
    const handleSetting = () => router.replace('/Tabs/settings');
    const handleProfile = () => router.push('/Tabs/profile');

    const handleLogOut = async () => {
        await AsyncStorage.removeItem('userToken');
        router.replace('/');
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            const storedToken = await AsyncStorage.getItem('userToken');
            const res = await fetch(`${API_BASE_URL}/api/profile/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Token ${storedToken}`
                }
            });

            if (res.ok) {
                await AsyncStorage.removeItem('userToken');
                setDeleteModalVisible(false);
                if (Platform.OS === 'web') {
                    window.alert("Account deleted successfully");
                    router.replace('/');
                } else {
                    Alert.alert("Success", "Account deleted successfully", [
                        { text: "OK", onPress: () => router.replace('/') }
                    ]);
                }
            } else if (res.status === 401) {
                await AsyncStorage.removeItem('userToken');
                setDeleteModalVisible(false);
                if (Platform.OS === 'web') {
                    window.alert("Session Expired. Please log in again.");
                    router.replace('/');
                } else {
                    Alert.alert("Session Expired", "Please log in again.", [
                        { text: "OK", onPress: () => router.replace('/') }
                    ]);
                }
            } else {
                if (Platform.OS === 'web') window.alert("Failed to delete account");
                else Alert.alert("Error", "Failed to delete account");
            }
        } catch (e) {
            if (Platform.OS === 'web') window.alert("Network error. Make sure the backend is running.");
            else Alert.alert("Error", "Network error. Make sure the backend is running.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* SETTINGS Title */}
                <Text style={[styles.pageTitle, { color: colors.text }]}>SETTINGS</Text>

                {/* DISPLAY AND APPEARANCE Section */}
                <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>DISPLAY AND APPEARANCE</Text>
                <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
                    {/* Dark Mode Toggle */}
                    <View style={[styles.row, { borderBottomColor: colors.border }]}>
                        <View style={[styles.rowIconContainer, { backgroundColor: '#312e81' }]}>
                            <MaterialIcons name="dark-mode" size={22} color="#a78bfa" />
                        </View>
                        <Text style={[styles.rowText, { color: colors.text }]}>Dark Mode</Text>
                        <Switch
                            value={isDarkMode}
                            onValueChange={setIsDarkMode}
                            trackColor={{ false: '#334155', true: '#22c55e' }}
                            thumbColor="white"
                        />
                    </View>

                    {/* Push Notification */}
                    <View style={[styles.row, { borderBottomColor: colors.border }]}>
                        <View style={[styles.rowIconContainer, { backgroundColor: '#1e3a5f' }]}>
                            <MaterialIcons name="notifications-none" size={22} color="#60a5fa" />
                        </View>
                        <Text style={[styles.rowText, { color: colors.text }]}>Push Notification</Text>
                        <Switch
                            value={pushEnabled}
                            onValueChange={setPushEnabled}
                            trackColor={{ false: '#334155', true: '#22c55e' }}
                            thumbColor="white"
                        />
                    </View>

                    {/* Strict Data Saver */}
                    <View style={[styles.row, { borderBottomWidth: 0 }]}>
                        <View style={[styles.rowIconContainer, { backgroundColor: '#1a3a1a' }]}>
                            <MaterialIcons name="shield" size={22} color="#4ade80" />
                        </View>
                        <Text style={[styles.rowText, { color: colors.text }]}>Strict Data Saver</Text>
                        <Switch
                            value={strictDataSaver}
                            onValueChange={setStrictDataSaver}
                            trackColor={{ false: '#334155', true: '#22c55e' }}
                            thumbColor="white"
                        />
                    </View>
                </View>

                {/* DATA MANAGEMENT Section */}
                <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>DATA MANAGEMENT</Text>
                <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
                    {/* Manage Profile */}
                    <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} onPress={handleProfile}>
                        <View style={[styles.rowIconContainer, { backgroundColor: '#1e293b' }]}>
                            <MaterialIcons name="person-outline" size={22} color="#94a3b8" />
                        </View>
                        <Text style={[styles.rowText, { color: colors.text }]}>Manage Profile</Text>
                        <MaterialIcons name="chevron-right" size={24} color="#64748b" />
                    </TouchableOpacity>

                    {/* ML Model Performance */}
                    <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} onPress={openMLModal}>
                        <View style={[styles.rowIconContainer, { backgroundColor: '#1e3a5f' }]}>
                            <MaterialIcons name="analytics" size={22} color="#3b82f6" />
                        </View>
                        <Text style={[styles.rowText, { color: colors.text }]}>ML Model Performance</Text>
                        <MaterialIcons name="chevron-right" size={24} color="#64748b" />
                    </TouchableOpacity>

                    {/* ML/AI Prediction Report */}
                    <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} onPress={openPredReport}>
                        <View style={[styles.rowIconContainer, { backgroundColor: '#2e1065' }]}>
                            <MaterialIcons name="auto-graph" size={22} color="#a78bfa" />
                        </View>
                        <Text style={[styles.rowText, { color: colors.text }]}>AI Prediction Report</Text>
                        <MaterialIcons name="chevron-right" size={24} color="#64748b" />
                    </TouchableOpacity>

                    {/* Data Sync & Portability */}
                    <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} onPress={openSyncModal}>
                        <View style={[styles.rowIconContainer, { backgroundColor: '#052e16' }]}>
                            <MaterialIcons name="sync" size={22} color="#22c55e" />
                        </View>
                        <Text style={[styles.rowText, { color: colors.text }]}>Data Sync & Portability</Text>
                        <MaterialIcons name="chevron-right" size={24} color="#64748b" />
                    </TouchableOpacity>

                    {/* Interactive Prediction Simulator */}
                    <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} onPress={openSimModal}>
                        <View style={[styles.rowIconContainer, { backgroundColor: '#1e1b4b' }]}>
                            <MaterialIcons name="online-prediction" size={22} color="#a5b4fc" />
                        </View>
                        <Text style={[styles.rowText, { color: colors.text }]}>Prediction Simulator</Text>
                        <MaterialIcons name="chevron-right" size={24} color="#64748b" />
                    </TouchableOpacity>

                    {/* Delete Account */}
                    <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]} onPress={() => setDeleteModalVisible(true)}>
                        <View style={[styles.rowIconContainer, { backgroundColor: '#3b0f0f' }]}>
                            <MaterialIcons name="delete-outline" size={22} color="#ef4444" />
                        </View>
                        <Text style={[styles.rowText, { color: '#ef4444' }]}>Delete Account</Text>
                        <MaterialIcons name="chevron-right" size={24} color="#64748b" />
                    </TouchableOpacity>
                </View>

                {/* LOG OUT Button — Red matching Figma */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogOut}>
                    <MaterialIcons name="logout" size={20} color="white" />
                    <Text style={styles.logoutText}>LOG OUT</Text>
                </TouchableOpacity>

            </ScrollView>

            {/* Bottom Navigation */}
            <View style={styles.bottomNavContainer}>
                <View style={[styles.bottomNavWrapper, { backgroundColor: colors.card, borderColor: colors.navBorder }]}>
                    <BottomNavItem 
                        iconName="home" 
                        label="HOME" 
                        isActive={activeTab === 'Home'}
                        onPress={handleHome}
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
                        onPress={handleSetting} 
                    />
                </View>
            </View>

            {/* Delete Account Confirmation Modal */}
            <Modal visible={isDeleteModalVisible} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.cardAlt }]}>
                        <MaterialIcons name="warning" size={48} color="#f87171" style={{ alignSelf: 'center', marginBottom: 16 }} />
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Delete Account?</Text>
                        <Text style={[styles.modalMessage, { color: colors.textMuted }]}>
                            This action will permanently disable your account. You will no longer have access and cannot create a new account with the same phone number.
                        </Text>
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setDeleteModalVisible(false)} disabled={isDeleting}>
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.deleteButton]} onPress={handleDeleteAccount} disabled={isDeleting}>
                                {isDeleting ? <ActivityIndicator color="white" /> : <Text style={styles.modalButtonText}>Confirm</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ML Diagnostics Modal */}
            <Modal visible={isMLModalVisible} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.cardAlt }]}>
                        <MaterialIcons name="analytics" size={48} color="#3b82f6" style={{ alignSelf: 'center', marginBottom: 16 }} />
                        <Text style={[styles.modalTitle, { color: colors.text }]}>ML Diagnostics</Text>
                        
                        {isFetchingML ? (
                            <ActivityIndicator size="large" color="#3b82f6" style={{ marginVertical: 30 }} />
                        ) : mlError ? (
                            <View>
                                <Text style={styles.mlErrorText}>{mlError}</Text>
                                <TouchableOpacity style={styles.refreshButton} onPress={handleFetchMLMetrics}>
                                    <Text style={styles.refreshButtonText}>Retry</Text>
                                </TouchableOpacity>
                            </View>
                        ) : mlMetrics ? (
                            <View style={styles.mlMetricsContainer}>
                                <View style={[styles.mlMetricRow, { borderBottomColor: colors.border }]}>
                                    <Text style={[styles.mlMetricLabel, { color: colors.textMuted }]}>Model Type</Text>
                                    <Text style={[styles.mlMetricValue, { color: colors.text }]}>Random Forest</Text>
                                </View>
                                <View style={[styles.mlMetricRow, { borderBottomColor: colors.border }]}>
                                    <Text style={[styles.mlMetricLabel, { color: colors.textMuted }]}>Mean Absolute Error</Text>
                                    <Text style={[styles.mlMetricValue, { color: colors.text }]}>
                                        {mlMetrics.mae_mb ? `${mlMetrics.mae_mb.toFixed(2)} MB` : 'N/A'}
                                    </Text>
                                </View>
                                <View style={[styles.mlMetricRow, { borderBottomColor: colors.border }]}>
                                    <Text style={[styles.mlMetricLabel, { color: colors.textMuted }]}>RMSE</Text>
                                    <Text style={[styles.mlMetricValue, { color: colors.text }]}>
                                        {mlMetrics.rmse_mb ? `${mlMetrics.rmse_mb.toFixed(2)} MB` : 'N/A'}
                                    </Text>
                                </View>
                                <View style={[styles.mlMetricRow, { borderBottomColor: colors.border }]}>
                                    <Text style={[styles.mlMetricLabel, { color: colors.textMuted }]}>R² Score (Accuracy)</Text>
                                    <Text style={[styles.mlMetricValue, { color: colors.text }]}>
                                        {mlMetrics.r2_score ? `${(mlMetrics.r2_score * 100).toFixed(1)}%` : 'N/A'}
                                    </Text>
                                </View>
                                <View style={[styles.mlMetricRow, { borderBottomColor: colors.border }]}>
                                    <Text style={[styles.mlMetricLabel, { color: colors.textMuted }]}>Dataset Size</Text>
                                    <Text style={[styles.mlMetricValue, { color: colors.text }]}>
                                        {mlMetrics.dataset_size_records ? `${mlMetrics.dataset_size_records.toLocaleString()} rows` : 'N/A'}
                                    </Text>
                                </View>
                                <Text style={[styles.mlMetricLabel, { marginTop: 12, marginBottom: 4, color: colors.textMuted }]}>Active Features:</Text>
                                <View style={styles.featuresContainer}>
                                    {mlMetrics.features_used && mlMetrics.features_used.map((feat: string, idx: number) => (
                                        <View key={idx} style={styles.featureBadge}>
                                            <Text style={styles.featureBadgeText}>{feat}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ) : null}

                        <TouchableOpacity 
                            style={styles.mlCloseButton} 
                            onPress={() => setMLModalVisible(false)}
                        >
                            <Text style={styles.modalButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ML/AI Prediction Report Modal */}
            <Modal visible={isPredReportVisible} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.cardAlt }]}>
                        <MaterialIcons name="auto-graph" size={48} color="#a78bfa" style={{ alignSelf: 'center', marginBottom: 16 }} />
                        <Text style={[styles.modalTitle, { color: colors.text }]}>AI Prediction Report</Text>
                        
                        {isFetchingPred ? (
                            <ActivityIndicator size="large" color="#a78bfa" style={{ marginVertical: 30 }} />
                        ) : predError ? (
                            <View>
                                <Text style={styles.mlErrorText}>{predError}</Text>
                                <TouchableOpacity style={styles.refreshButton} onPress={handleFetchPredReport}>
                                    <Text style={styles.refreshButtonText}>Retry</Text>
                                </TouchableOpacity>
                            </View>
                        ) : predReport ? (
                            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                                {/* Usage Overview */}
                                <View style={styles.reportSection}>
                                    <Text style={[styles.reportSectionTitle, { color: isDarkMode ? '#60a5fa' : '#2563eb' }]}>Usage Overview</Text>
                                    <View style={styles.reportProgressContainer}>
                                        <View style={[styles.reportProgressTrack, { backgroundColor: isDarkMode ? '#334155' : '#e2e8f0' }]}>
                                            <View style={[styles.reportProgressFill, { 
                                                width: `${Math.min(predReport.percentUsed, 100)}%`, 
                                                backgroundColor: predReport.paceColor 
                                            }]} />
                                        </View>
                                        <Text style={[styles.reportBigText, { color: predReport.paceColor }]}>
                                            {predReport.percentUsed}%
                                        </Text>
                                    </View>
                                    <View style={[styles.mlMetricRow, { borderBottomColor: colors.border }]}>
                                        <Text style={[styles.mlMetricLabel, { color: colors.textMuted }]}>Total Used</Text>
                                        <Text style={[styles.mlMetricValue, { color: colors.text }]}>
                                            {predReport.totalUsed >= 1024 ? `${(predReport.totalUsed / 1024).toFixed(1)} GB` : `${Math.round(predReport.totalUsed)} MB`}
                                        </Text>
                                    </View>
                                    <View style={[styles.mlMetricRow, { borderBottomColor: colors.border }]}>
                                        <Text style={[styles.mlMetricLabel, { color: colors.textMuted }]}>Total Limit</Text>
                                        <Text style={[styles.mlMetricValue, { color: colors.text }]}>{(predReport.totalLimit / 1024).toFixed(1)} GB</Text>
                                    </View>
                                    <View style={[styles.mlMetricRow, { borderBottomColor: colors.border }]}>
                                        <Text style={[styles.mlMetricLabel, { color: colors.textMuted }]}>Daily Average</Text>
                                        <Text style={[styles.mlMetricValue, { color: colors.text }]}>
                                            {predReport.dailyAvg >= 1024 ? `${(predReport.dailyAvg / 1024).toFixed(1)} GB` : `${Math.round(predReport.dailyAvg)} MB`}
                                        </Text>
                                    </View>
                                </View>

                                {/* Prediction */}
                                <View style={styles.reportSection}>
                                    <Text style={[styles.reportSectionTitle, { color: isDarkMode ? '#60a5fa' : '#2563eb' }]}>AI Prediction</Text>
                                    <View style={[styles.mlMetricRow, { borderBottomColor: colors.border }]}>
                                        <Text style={[styles.mlMetricLabel, { color: colors.textMuted }]}>Usage Pace</Text>
                                        <Text style={[styles.mlMetricValue, { color: predReport.paceColor }]}>
                                            {predReport.usagePace}
                                        </Text>
                                    </View>
                                    <View style={[styles.mlMetricRow, { borderBottomColor: colors.border }]}>
                                        <Text style={[styles.mlMetricLabel, { color: colors.textMuted }]}>Days Remaining</Text>
                                        <Text style={[styles.mlMetricValue, { color: colors.text }]}>{predReport.daysRemaining} days</Text>
                                    </View>
                                    <View style={[styles.mlMetricRow, { borderBottomColor: colors.border }]}>
                                        <Text style={[styles.mlMetricLabel, { color: colors.textMuted }]}>Top App</Text>
                                        <Text style={[styles.mlMetricValue, { color: colors.text }]}>{predReport.topApp}</Text>
                                    </View>
                                    <View style={[styles.mlMetricRow, { borderBottomColor: colors.border }]}>
                                        <Text style={[styles.mlMetricLabel, { color: colors.textMuted }]}>Top App Usage</Text>
                                        <Text style={[styles.mlMetricValue, { color: colors.text }]}>
                                            {predReport.topAppUsage >= 1024 ? `${(predReport.topAppUsage / 1024).toFixed(2)} GB` : `${Math.round(predReport.topAppUsage)} MB`}
                                        </Text>
                                    </View>
                                </View>

                                {/* Model Info */}
                                <View style={styles.reportSection}>
                                    <Text style={[styles.reportSectionTitle, { color: isDarkMode ? '#60a5fa' : '#2563eb' }]}>Model Performance</Text>
                                    <View style={[styles.mlMetricRow, { borderBottomColor: colors.border }]}>
                                        <Text style={[styles.mlMetricLabel, { color: colors.textMuted }]}>Accuracy (R²)</Text>
                                        <Text style={[styles.mlMetricValue, { color: colors.text }]}>{predReport.modelAccuracy}</Text>
                                    </View>
                                    <View style={[styles.mlMetricRow, { borderBottomColor: colors.border }]}>
                                        <Text style={[styles.mlMetricLabel, { color: colors.textMuted }]}>MAE</Text>
                                        <Text style={[styles.mlMetricValue, { color: colors.text }]}>{predReport.mae}</Text>
                                    </View>
                                    <View style={[styles.mlMetricRow, { borderBottomColor: colors.border }]}>
                                        <Text style={[styles.mlMetricLabel, { color: colors.textMuted }]}>Dataset Size</Text>
                                        <Text style={[styles.mlMetricValue, { color: colors.text }]}>{predReport.datasetSize.toLocaleString()} rows</Text>
                                    </View>
                                </View>

                                {/* Dynamic Insight */}
                                <View style={[styles.reportInsight, { backgroundColor: isDarkMode ? 'rgba(251, 191, 36, 0.1)' : 'rgba(245, 158, 11, 0.15)' }]}>
                                    <MaterialIcons name="lightbulb" size={20} color="#fbbf24" />
                                    <Text style={[styles.reportInsightText, { color: isDarkMode ? '#fde68a' : '#b45309' }]}>
                                        {predReport.percentUsed >= 90
                                            ? `Critical: At your current rate of ${Math.round(predReport.dailyAvg)} MB/day, you will exhaust your data before the billing cycle ends. Immediately reduce streaming and background data.`
                                            : predReport.percentUsed >= 75
                                            ? `Warning: You've used ${predReport.percentUsed}% of your data. Consider switching to Wi-Fi for large downloads and limiting video streaming quality.`
                                            : predReport.percentUsed >= 50
                                            ? `On track: You've used ${predReport.percentUsed}% with approximately ${predReport.daysRemaining} days remaining. Your ${predReport.topApp} usage accounts for the most data consumption.`
                                            : `Healthy usage: You're at ${predReport.percentUsed}% consumption. At ${Math.round(predReport.dailyAvg)} MB/day, your data plan should last well through the billing cycle.`
                                        }
                                    </Text>
                                </View>
                             </ScrollView>
                        ) : null}

                        <TouchableOpacity 
                            style={[styles.mlCloseButton, { backgroundColor: '#7c3aed' }]} 
                            onPress={() => setPredReportVisible(false)}
                        >
                            <Text style={styles.modalButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Data Sync & Portability Modal */}
            <Modal visible={isSyncModalVisible} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.cardAlt }]}>
                        <MaterialIcons name="sync" size={48} color="#22c55e" style={{ alignSelf: 'center', marginBottom: 16 }} />
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Data Sync & Portability</Text>
                        
                        <Text style={[styles.modalMessage, { color: colors.textMuted }]}>
                            DATAra utilizes a dual-system architecture. You can sync local records to the global database to improve overall prediction models, or download a local backup.
                        </Text>
                        
                        {isSyncing ? (
                            <ActivityIndicator size="large" color="#22c55e" style={{ marginVertical: 20 }} />
                        ) : (
                            <View style={styles.mlMetricsContainer}>
                                <View style={[styles.mlMetricRow, { borderBottomColor: colors.border }]}>
                                    <Text style={[styles.mlMetricLabel, { color: colors.textMuted }]}>Local Network Stats</Text>
                                    <Text style={[styles.mlMetricValue, { color: colors.text }]}>{syncStatus.network_records_count} records</Text>
                                </View>
                                <View style={[styles.mlMetricRow, { borderBottomColor: colors.border }]}>
                                    <Text style={[styles.mlMetricLabel, { color: colors.textMuted }]}>Local App Usage Stats</Text>
                                    <Text style={[styles.mlMetricValue, { color: colors.text }]}>{syncStatus.traffic_records_count} records</Text>
                                </View>
                            </View>
                        )}

                        {syncError && <Text style={styles.mlErrorText}>{syncError}</Text>}
                        {syncSuccessMessage && <Text style={[styles.mlErrorText, { color: '#22c55e' }]}>{syncSuccessMessage}</Text>}

                        <View style={{ gap: 10, marginBottom: 10 }}>
                            <TouchableOpacity 
                                style={[styles.mlCloseButton, { backgroundColor: '#22c55e' }]} 
                                onPress={handleUploadToGlobal}
                                disabled={isSyncing}
                            >
                                <Text style={styles.modalButtonText}>Upload to Global Pool</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.mlCloseButton, { backgroundColor: '#3b82f6' }]} 
                                onPress={handleDownloadLocalData}
                                disabled={isSyncing}
                            >
                                <Text style={styles.modalButtonText}>Download Backup (ZIP)</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.refreshButton} 
                                onPress={handleGenerateMockData}
                                disabled={isSyncing}
                            >
                                <Text style={[styles.refreshButtonText, { color: '#94a3b8' }]}>Generate Synthetic Stats</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity 
                            style={[styles.mlCloseButton, { backgroundColor: '#64748b' }]} 
                            onPress={() => setSyncModalVisible(false)}
                        >
                            <Text style={styles.modalButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Interactive Prediction Simulator Modal */}
            <Modal visible={isSimModalVisible} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.cardAlt }]}>
                        <MaterialIcons name="online-prediction" size={48} color="#a5b4fc" style={{ alignSelf: 'center', marginBottom: 16 }} />
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Interactive Prediction Simulator</Text>
                        
                        <Text style={[styles.modalMessage, { color: colors.textMuted }]}>
                            Adjust variables to simulate hypothetical usage scenarios and see how the ML model projects data lifespan in real time.
                        </Text>
                        
                        <View style={{ marginBottom: 20 }}>
                            {/* Control 1: Remaining Data */}
                            <View style={[styles.controlRow, { borderBottomColor: colors.border }]}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.controlLabel, { color: colors.text }]}>Remaining Data</Text>
                                    <Text style={styles.controlValue}>{simRemainingMb.toFixed(0)} MB</Text>
                                </View>
                                <View style={styles.stepperContainer}>
                                    <TouchableOpacity 
                                        style={[styles.stepperButton, { backgroundColor: isDarkMode ? '#334155' : '#cbd5e1' }]} 
                                        onPress={() => setSimRemainingMb(prev => Math.max(0.0, prev - 500))}
                                    >
                                        <Text style={[styles.stepperText, { color: colors.text }]}>-</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.stepperButton, { backgroundColor: isDarkMode ? '#334155' : '#cbd5e1' }]} 
                                        onPress={() => setSimRemainingMb(prev => prev + 500)}
                                    >
                                        <Text style={[styles.stepperText, { color: colors.text }]}>+</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Control 2: Screen-on Time */}
                            <View style={[styles.controlRow, { borderBottomColor: colors.border }]}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.controlLabel, { color: colors.text }]}>Est. Screen On Time</Text>
                                    <Text style={styles.controlValue}>{simScreenOnHours.toFixed(1)} hrs/day</Text>
                                </View>
                                <View style={styles.stepperContainer}>
                                    <TouchableOpacity 
                                        style={[styles.stepperButton, { backgroundColor: isDarkMode ? '#334155' : '#cbd5e1' }]} 
                                        onPress={() => setSimScreenOnHours(prev => Math.max(0.0, prev - 0.5))}
                                    >
                                        <Text style={[styles.stepperText, { color: colors.text }]}>-</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.stepperButton, { backgroundColor: isDarkMode ? '#334155' : '#cbd5e1' }]} 
                                        onPress={() => setSimScreenOnHours(prev => Math.min(24.0, prev + 0.5))}
                                    >
                                        <Text style={[styles.stepperText, { color: colors.text }]}>+</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Control 3: Battery Level */}
                            <View style={[styles.controlRow, { borderBottomColor: colors.border, borderBottomWidth: 0 }]}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.controlLabel, { color: colors.text }]}>Battery Level</Text>
                                    <Text style={styles.controlValue}>{simBatteryLevel.toFixed(0)}%</Text>
                                </View>
                                <View style={styles.stepperContainer}>
                                    <TouchableOpacity 
                                        style={[styles.stepperButton, { backgroundColor: isDarkMode ? '#334155' : '#cbd5e1' }]} 
                                        onPress={() => setSimBatteryLevel(prev => Math.max(0.0, prev - 5))}
                                    >
                                        <Text style={[styles.stepperText, { color: colors.text }]}>-</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.stepperButton, { backgroundColor: isDarkMode ? '#334155' : '#cbd5e1' }]} 
                                        onPress={() => setSimBatteryLevel(prev => Math.min(100.0, prev + 5))}
                                    >
                                        <Text style={[styles.stepperText, { color: colors.text }]}>+</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {/* Simulation Results Section */}
                        <View style={[styles.reportSection, { marginTop: 10, padding: 16, backgroundColor: colors.card, borderRadius: 16 }]}>
                            <Text style={[styles.reportSectionTitle, { color: isDarkMode ? '#a5b4fc' : '#4f46e5' }]}>SIMULATION RESULTS</Text>
                            <View style={[styles.mlMetricRow, { borderBottomColor: colors.border }]}>
                                <Text style={[styles.mlMetricLabel, { color: colors.textMuted }]}>Projected Pace</Text>
                                <Text style={[styles.mlMetricValue, { 
                                    color: simPrediction.usage_pace === 'extreme' ? '#ef4444' : simPrediction.usage_pace === 'warning' ? '#f59e0b' : '#22c55e',
                                    textTransform: 'uppercase'
                                }]}>
                                    {simPrediction.usage_pace}
                                </Text>
                            </View>
                            <View style={[styles.mlMetricRow, { borderBottomColor: colors.border }]}>
                                <Text style={[styles.mlMetricLabel, { color: colors.textMuted }]}>Est. Hours Remaining</Text>
                                <Text style={[styles.mlMetricValue, { color: colors.text }]}>
                                    {simPrediction.hours_remaining.toFixed(1)} hrs
                                </Text>
                            </View>
                            <View style={[styles.mlMetricRow, { borderBottomWidth: 0 }]}>
                                <Text style={[styles.mlMetricLabel, { color: colors.textMuted }]}>Depletion Forecast</Text>
                                <Text style={[styles.mlMetricValue, { color: colors.text }]}>
                                    {simPrediction.depletion_time ? new Date(simPrediction.depletion_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={[styles.mlCloseButton, { backgroundColor: '#6366f1' }]} 
                            onPress={closeSimModal}
                        >
                            <Text style={styles.modalButtonText}>Close Simulator</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0d1117',
    },
    scrollContent: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 110,
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        letterSpacing: 1,
        marginBottom: 24,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748b',
        letterSpacing: 1.5,
        marginBottom: 12,
        marginTop: 8,
        marginLeft: 4,
    },
    settingsCard: {
        backgroundColor: '#1a1f2e',
        borderRadius: 20,
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    },
    rowIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    rowText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
    },
    // Red Logout — Figma matching
    logoutButton: {
        flexDirection: 'row',
        alignSelf: 'center',
        backgroundColor: '#dc2626',
        paddingVertical: 16,
        paddingHorizontal: 48,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 16,
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    logoutText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 1,
    },
    // Bottom Nav
    bottomNavContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        alignItems: 'center',
    },
    bottomNavWrapper: {
        flexDirection: 'row',
        backgroundColor: '#1a1f2e',
        borderRadius: 30,
        paddingVertical: 12,
        paddingHorizontal: 20,
        justifyContent: 'space-between',
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#2a2f3e',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        width: '100%',
        maxWidth: Platform.OS === 'web' ? 480 : '100%' as any,
        alignSelf: 'center',
    },
    modalContent: {
        width: '100%',
        backgroundColor: '#1e293b',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    modalTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    modalMessage: {
        color: '#cbd5e1',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 22,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 30,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    cancelButton: {
        backgroundColor: '#64748b',
    },
    deleteButton: {
        backgroundColor: '#dc2626',
    },
    modalButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 15,
    },
    mlMetricsContainer: {
        marginTop: 10,
        marginBottom: 20,
    },
    mlMetricRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    mlMetricLabel: {
        color: '#94a3b8',
        fontSize: 13,
        fontWeight: '500',
    },
    mlMetricValue: {
        color: 'white',
        fontSize: 13,
        fontWeight: 'bold',
    },
    featuresContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 6,
    },
    featureBadge: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    featureBadgeText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '600',
    },
    mlErrorText: {
        color: '#f87171',
        textAlign: 'center',
        marginVertical: 15,
        fontSize: 14,
        lineHeight: 20,
    },
    refreshButton: {
        backgroundColor: '#1e293b',
        borderWidth: 1,
        borderColor: '#3b82f6',
        paddingVertical: 10,
        borderRadius: 20,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 10,
    },
    refreshButtonText: {
        color: '#3b82f6',
        fontWeight: 'bold',
        fontSize: 14,
    },
    mlCloseButton: {
        backgroundColor: '#3b82f6',
        paddingVertical: 12,
        borderRadius: 30,
        alignItems: 'center',
        marginTop: 10,
    },
    // Report styles
    reportSection: {
        marginBottom: 16,
    },
    reportSectionTitle: {
        color: '#60a5fa',
        fontSize: 13,
        fontWeight: 'bold',
        letterSpacing: 0.5,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    reportProgressContainer: {
        alignItems: 'center',
        marginBottom: 12,
    },
    reportProgressTrack: {
        height: 10,
        backgroundColor: '#334155',
        borderRadius: 5,
        overflow: 'hidden',
        width: '100%',
        marginBottom: 8,
    },
    reportProgressFill: {
        height: '100%',
        borderRadius: 5,
    },
    reportBigText: {
        fontSize: 28,
        fontWeight: '900',
    },
    reportInsight: {
        flexDirection: 'row',
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        borderRadius: 12,
        padding: 12,
        gap: 8,
        marginTop: 8,
        marginBottom: 12,
        alignItems: 'flex-start',
    },
    reportInsightText: {
        color: '#fde68a',
        fontSize: 12,
        lineHeight: 18,
        flex: 1,
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
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepperText: {
        fontSize: 20,
        fontWeight: 'bold',
        lineHeight: 22,
    },
});
