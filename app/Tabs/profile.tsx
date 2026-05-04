import { MaterialIcons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { BottomNavItem } from '../../components/BottomNavItem';
import { useUser } from '../../context/UserContext';

export default function ProfileScreen() {
    const { phone } = useUser();
    const [activeTab, setActiveTab] = useState('Profile');
    
    // Auth Token
    const [token, setToken] = useState<string | null>(null);

    // Profile State
    const [profile, setProfile] = useState<any>(null);
    const [loadingName, setLoadingName] = useState(false);
    const [loadingAddress, setLoadingAddress] = useState(false);

    // Modals visibility
    const [isNameModalVisible, setNameModalVisible] = useState(false);
    const [isAddressModalVisible, setAddressModalVisible] = useState(false);

    // Edit states
    const [editName, setEditName] = useState('');

    // Address Dropdown States
    const [regions, setRegions] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [barangays, setBarangays] = useState<any[]>([]);

    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedBarangay, setSelectedBarangay] = useState('');
    const [streetAddress, setStreetAddress] = useState('');

    const handleHistory = () => router.push('/Tabs/history');
    const handleSettings = () => router.push('/Tabs/settings');
    const handleHome = () => router.push('/Tabs/dashboard');


    useEffect(() => {
        const loadTokenAndProfile = async () => {
            const storedToken = await AsyncStorage.getItem('userToken');
            if (storedToken) {
                setToken(storedToken);
                try {
                    const res = await fetch('http://127.0.0.1:8000/api/profile/', {
                        headers: { 'Authorization': `Token ${storedToken}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setProfile(data);
                        setEditName(data.username || '');
                    }
                } catch (e) {
                    console.error("Failed to load profile", e);
                }
            }
        };
        loadTokenAndProfile();
        fetchRegions();
    }, []);

    const fetchRegions = async () => {
        try {
            const res = await fetch('https://psgc.gitlab.io/api/regions/');
            const data = await res.json();
            setRegions(data);
        } catch (error) {
            console.error("Error fetching regions", error);
        }
    };

    const fetchCities = async (regionCode: string) => {
        try {
            const res = await fetch(`https://psgc.gitlab.io/api/regions/${regionCode}/cities-municipalities/`);
            const data = await res.json();
            setCities(data);
            setBarangays([]);
        } catch (error) {
            console.error("Error fetching cities", error);
        }
    };

    const fetchBarangays = async (cityCode: string) => {
        try {
            const res = await fetch(`https://psgc.gitlab.io/api/cities-municipalities/${cityCode}/barangays/`);
            const data = await res.json();
            setBarangays(data);
        } catch (error) {
            console.error("Error fetching barangays", error);
        }
    };

    const onRegionChange = (itemValue: string) => {
        setSelectedRegion(itemValue);
        setSelectedCity('');
        setSelectedBarangay('');
        if (itemValue) {
            fetchCities(itemValue);
        } else {
            setCities([]);
            setBarangays([]);
        }
    };

    const onCityChange = (itemValue: string) => {
        setSelectedCity(itemValue);
        setSelectedBarangay('');
        if (itemValue) {
            fetchBarangays(itemValue);
        } else {
            setBarangays([]);
        }
    };

    const updateBackendProfile = async (payload: any, setLoading: (b: boolean) => void, onSuccess: () => void) => {
        setLoading(true);
        try {
            const headers: any = {
                'Content-Type': 'application/json',
            };
            if (token) {
                headers['Authorization'] = `Token ${token}`;
            }

            const response = await fetch('http://127.0.0.1:8000/api/profile/', {
                method: 'PUT',
                headers,
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            
            if (response.ok) {
                setProfile(data); // Reflect changes immediately
                onSuccess();
            } else {
                alert("Failed to update profile.");
                console.error(data);
            }
        } catch (error) {
            console.error("Error saving profile:", error);
            alert("Network error.");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveName = () => {
        if (!editName.trim()) {
            alert("Name cannot be empty.");
            return;
        }
        updateBackendProfile(
            { username: editName },
            setLoadingName,
            () => setNameModalVisible(false)
        );
    };

    const handleSaveAddress = () => {
        const regionName = regions.find(r => r.code === selectedRegion)?.name || '';
        const cityName = cities.find(c => c.code === selectedCity)?.name || '';
        const brgyName = barangays.find(b => b.code === selectedBarangay)?.name || '';
        
        const fullAddress = `${streetAddress}, ${brgyName}, ${cityName}, ${regionName}`.replace(/^, | ,/g, '').trim();
        
        updateBackendProfile(
            { address: fullAddress },
            setLoadingAddress,
            () => setAddressModalVisible(false)
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0d1320" />
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Avatar */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarCircle}>
                        <View style={styles.avatarInner}>
                            <MaterialIcons name="person" size={72} color="#94a3b8" />
                        </View>
                    </View>
                </View>

                {/* E-SIM Badge */}
                <View style={styles.esimRow}>
                    <View style={styles.esimBadge}>
                        <Text style={styles.esimText}>E-SIM</Text>
                    </View>
                    <Text style={styles.phoneNumber}>{profile?.phone_number || phone ? `+${profile?.phone_number || phone}` : '+63 08312035'}</Text>
                    <MaterialIcons name="keyboard-arrow-down" size={20} color="white" />
                </View>

                {/* Info Boxes */}
                <View style={styles.infoContainer}>
                    <TouchableOpacity style={styles.infoBox} onPress={() => setNameModalVisible(true)}>
                        <Text style={styles.infoText}>{profile?.username || 'Charlie C. Omongos'}</Text>
                        <MaterialIcons name="edit" size={20} color="#64748b" style={styles.editIcon} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.infoBox} onPress={() => setAddressModalVisible(true)}>
                        <Text style={styles.infoText}>{profile?.address || 'Zone 13 B, Puli, Carmen, CDO'}</Text>
                        <MaterialIcons name="edit" size={20} color="#64748b" style={styles.editIcon} />
                    </TouchableOpacity>

                    <View style={styles.infoBox}>
                        <Text style={styles.infoText}>{profile?.provider || 'DESU'}</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Navigation */}
            <View style={styles.bottomNavContainer}>
                <View style={styles.bottomNavWrapper}>
                    <BottomNavItem iconName="home" label="HOME" isActive={activeTab === 'Home'} onPress={handleHome}/>
                    <BottomNavItem iconName="history" label="HISTORY" isActive={activeTab === 'History'} onPress={handleHistory} />
                    <BottomNavItem iconName="settings" label="SETTINGS" isActive={activeTab === 'Settings'} onPress={handleSettings} />

                </View>
            </View>

            {/* Name Edit Modal */}
            <Modal visible={isNameModalVisible} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Name</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={editName}
                            onChangeText={setEditName}
                            placeholder="Enter your name"
                            placeholderTextColor="#94a3b8"
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setNameModalVisible(false)}>
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSaveName} disabled={loadingName}>
                                {loadingName ? <ActivityIndicator color="white" /> : <Text style={styles.modalButtonText}>Save</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Address Edit Modal */}
            <Modal visible={isAddressModalVisible} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, styles.addressModal]}>
                        <Text style={styles.modalTitle}>Update Address</Text>
                        
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.label}>Region</Text>
                            <View style={styles.pickerContainer}>
                                <Picker selectedValue={selectedRegion} onValueChange={onRegionChange} style={styles.picker} dropdownIconColor="#0f172a">
                                    <Picker.Item label="Select Region" value="" color="#94a3b8" />
                                    {regions.map((region) => (
                                        <Picker.Item key={region.code} label={region.name} value={region.code} color="#0f172a" />
                                    ))}
                                </Picker>
                            </View>

                            <Text style={styles.label}>City/Municipality</Text>
                            <View style={styles.pickerContainer}>
                                <Picker selectedValue={selectedCity} onValueChange={onCityChange} style={styles.picker} enabled={cities.length > 0} dropdownIconColor="#0f172a">
                                    <Picker.Item label="Select City/Municipality" value="" color="#94a3b8" />
                                    {cities.map((city) => (
                                        <Picker.Item key={city.code} label={city.name} value={city.code} color="#0f172a" />
                                    ))}
                                </Picker>
                            </View>

                            <Text style={styles.label}>Barangay</Text>
                            <View style={styles.pickerContainer}>
                                <Picker selectedValue={selectedBarangay} onValueChange={(val) => setSelectedBarangay(val)} style={styles.picker} enabled={barangays.length > 0} dropdownIconColor="#0f172a">
                                    <Picker.Item label="Select Barangay" value="" color="#94a3b8" />
                                    {barangays.map((brgy) => (
                                        <Picker.Item key={brgy.code} label={brgy.name} value={brgy.code} color="#0f172a" />
                                    ))}
                                </Picker>
                            </View>

                            <Text style={styles.label}>Street Address</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="House/Unit No., Street Name"
                                placeholderTextColor="#94a3b8"
                                value={streetAddress}
                                onChangeText={setStreetAddress}
                            />
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setAddressModalVisible(false)}>
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSaveAddress} disabled={loadingAddress}>
                                {loadingAddress ? <ActivityIndicator color="white" /> : <Text style={styles.modalButtonText}>Save</Text>}
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
    scrollContent: {
        paddingTop: 40,
        paddingHorizontal: 28,
        paddingBottom: 110,
        alignItems: 'center',
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    avatarCircle: {
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: '#dbeafe',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInner: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e2e8f0',
    },
    esimRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
    },
    esimBadge: {
        backgroundColor: '#334155',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginRight: 8,
    },
    esimText: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: 'bold',
    },
    phoneNumber: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
        marginRight: 4,
    },
    infoContainer: {
        width: '100%',
        gap: 12,
        marginBottom: 40,
    },
    infoBox: {
        backgroundColor: '#e2e8f0',
        borderRadius: 12,
        paddingVertical: 18,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    infoText: {
        color: '#0f172a',
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
    },
    editIcon: {
        marginLeft: 10,
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
    addressModal: {
        maxHeight: '80%',
    },
    modalTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalInput: {
        backgroundColor: '#e2e8f0',
        color: '#0f172a',
        height: 50,
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 24,
        fontSize: 15,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
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
    saveButton: {
        backgroundColor: '#3b82f6',
    },
    modalButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    label: {
        color: '#cbd5e1',
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '500',
    },
    pickerContainer: {
        backgroundColor: '#e2e8f0',
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
    },
    picker: {
        height: 50,
        width: '100%',
        color: '#0f172a',
    },
});
