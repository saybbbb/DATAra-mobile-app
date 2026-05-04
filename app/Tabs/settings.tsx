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
    Platform
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
});
