import { MaterialIcons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import React, { useState } from 'react';
import {
    SafeAreaView,
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

export default function SettingsScreen() {
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
                const data = await res.json();
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

    const handleHistory =()=> router.push('/Tabs/history');
    const handleHome =()=> router.push('/Tabs/dashboard');
    const handleSetting =()=> router.replace('/Tabs/settings');
    const handleProfile =()=> router.push('/Tabs/profile');

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
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0d1320" />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Settings List */}
            <View style={styles.listContainer}>
                {/* Manage Profile */}
                <TouchableOpacity style={styles.row} onPress={handleProfile}>
                    <MaterialIcons name="person-outline" size={28} color="white" style={styles.rowIcon} />
                    <Text style={styles.rowText}>Manage Profile</Text>
                </TouchableOpacity>

                {/* Password and Security */}
                <TouchableOpacity style={styles.row}>
                    <MaterialIcons name="lock-outline" size={28} color="white" style={styles.rowIcon} />
                    <Text style={styles.rowText}>Password and Security</Text>
                </TouchableOpacity>

                {/* Push Notification */}
                <View style={styles.row}>
                    <MaterialIcons name="notifications-none" size={28} color="white" style={styles.rowIcon} />
                    <Text style={[styles.rowText, { flex: 1 }]}>Push Notification</Text>
                    <Switch
                        value={pushEnabled}
                        onValueChange={setPushEnabled}
                        trackColor={{ false: '#475569', true: '#22c55e' }}
                        thumbColor="white"
                    />
                </View>

                {/* ML Model Performance */}
                <TouchableOpacity style={styles.row} onPress={openMLModal}>
                    <MaterialIcons name="analytics" size={28} color="#3b82f6" style={styles.rowIcon} />
                    <Text style={styles.rowText}>ML Model Performance</Text>
                </TouchableOpacity>

                {/* Data Sync & Portability */}
                <TouchableOpacity style={styles.row} onPress={openSyncModal}>
                    <MaterialIcons name="sync" size={28} color="#22c55e" style={styles.rowIcon} />
                    <Text style={styles.rowText}>Data Sync & Portability</Text>
                </TouchableOpacity>

                {/* Delete Account */}
                <TouchableOpacity style={styles.row} onPress={() => setDeleteModalVisible(true)}>
                    <MaterialIcons name="delete-outline" size={28} color="#f87171" style={styles.rowIcon} />
                    <Text style={[styles.rowText, { color: '#f87171' }]}>Delete Account</Text>
                </TouchableOpacity>

                {/* Log Out */}
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogOut}
                >
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>
            </View>

            {/* Bottom Navigation */}
            <View style={styles.bottomNavContainer}>
                <View style={styles.bottomNavWrapper}>
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
                    <View style={styles.modalContent}>
                        <MaterialIcons name="warning" size={48} color="#f87171" style={{ alignSelf: 'center', marginBottom: 16 }} />
                        <Text style={styles.modalTitle}>Delete Account?</Text>
                        <Text style={styles.modalMessage}>
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
                    <View style={styles.modalContent}>
                        <MaterialIcons name="analytics" size={48} color="#3b82f6" style={{ alignSelf: 'center', marginBottom: 16 }} />
                        <Text style={styles.modalTitle}>ML Diagnostics</Text>
                        
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
                                <View style={styles.mlMetricRow}>
                                    <Text style={styles.mlMetricLabel}>Model Type</Text>
                                    <Text style={styles.mlMetricValue}>Random Forest</Text>
                                </View>
                                <View style={styles.mlMetricRow}>
                                    <Text style={styles.mlMetricLabel}>Mean Absolute Error</Text>
                                    <Text style={styles.mlMetricValue}>
                                        {mlMetrics.mae_mb ? `${mlMetrics.mae_mb.toFixed(2)} MB` : 'N/A'}
                                    </Text>
                                </View>
                                <View style={styles.mlMetricRow}>
                                    <Text style={styles.mlMetricLabel}>RMSE</Text>
                                    <Text style={styles.mlMetricValue}>
                                        {mlMetrics.rmse_mb ? `${mlMetrics.rmse_mb.toFixed(2)} MB` : 'N/A'}
                                    </Text>
                                </View>
                                <View style={styles.mlMetricRow}>
                                    <Text style={styles.mlMetricLabel}>R² Score (Accuracy)</Text>
                                    <Text style={styles.mlMetricValue}>
                                        {mlMetrics.r2_score ? `${(mlMetrics.r2_score * 100).toFixed(1)}%` : 'N/A'}
                                    </Text>
                                </View>
                                <View style={styles.mlMetricRow}>
                                    <Text style={styles.mlMetricLabel}>Dataset Size</Text>
                                    <Text style={styles.mlMetricValue}>
                                        {mlMetrics.dataset_size_records ? `${mlMetrics.dataset_size_records.toLocaleString()} rows` : 'N/A'}
                                    </Text>
                                </View>
                                <Text style={[styles.mlMetricLabel, { marginTop: 12, marginBottom: 4 }]}>Active Features:</Text>
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

            {/* Data Sync & Portability Modal */}
            <Modal visible={isSyncModalVisible} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <MaterialIcons name="sync" size={48} color="#22c55e" style={{ alignSelf: 'center', marginBottom: 16 }} />
                        <Text style={styles.modalTitle}>Data Sync & Portability</Text>
                        
                        <Text style={styles.modalMessage}>
                            DATAra utilizes a dual-system architecture. You can sync local records to the global database to improve overall prediction models, or download a local backup.
                        </Text>
                        
                        {isSyncing ? (
                            <ActivityIndicator size="large" color="#22c55e" style={{ marginVertical: 20 }} />
                        ) : (
                            <View style={styles.mlMetricsContainer}>
                                <View style={styles.mlMetricRow}>
                                    <Text style={styles.mlMetricLabel}>Local Network Stats</Text>
                                    <Text style={styles.mlMetricValue}>{syncStatus.network_records_count} records</Text>
                                </View>
                                <View style={styles.mlMetricRow}>
                                    <Text style={styles.mlMetricLabel}>Local App Usage Stats</Text>
                                    <Text style={styles.mlMetricValue}>{syncStatus.traffic_records_count} records</Text>
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0d1320',
    },
    listContainer: {
        flex: 1,
        paddingTop: 25,
        paddingHorizontal: 32,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 22,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    rowIcon: {
        marginRight: 20,
    },
    rowText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    logoutButton: {
        marginTop: 60,
        alignSelf: 'center',
        backgroundColor: '#475569',
        paddingVertical: 14,
        paddingHorizontal: 48,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    logoutText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
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
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        width: '100%',
        maxWidth: Platform.OS === 'web' ? 480 : '100%',
        alignSelf: 'center',
    },
    modalContent: {
        width: '100%',
        backgroundColor: '#1e293b',
        borderRadius: 16,
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
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 24,
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
        fontSize: 16,
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
        borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    mlMetricLabel: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '500',
    },
    mlMetricValue: {
        color: 'white',
        fontSize: 14,
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
});
