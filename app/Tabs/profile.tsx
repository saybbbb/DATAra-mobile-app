import { MaterialIcons, Feather } from '@expo/vector-icons';
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
    Platform,
    Image,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useUser } from '../../context/UserContext';
import { API_BASE_URL } from '../../constants/Config';
import { ProfileCard } from '../../components/ProfileCard';

// Default cartoon character matching the user's style
const DEFAULT_AVATAR_URI = 'https://api.dicebear.com/7.x/adventurer/png?seed=Charlie';
import { API_URL } from '../../context/ApiConfig';

export default function ProfileScreen() {
    const { phone } = useUser();
    
    // Auth Token
    const [token, setToken] = useState<string | null>(null);

    // Profile State
    const [profile, setProfile] = useState<any>(null);
    const [loadingName, setLoadingName] = useState(false);
    const [loadingEmail, setLoadingEmail] = useState(false);
    const [loadingAddress, setLoadingAddress] = useState(false);

    // Modals visibility
    const [isNameModalVisible, setNameModalVisible] = useState(false);
    const [isEmailModalVisible, setEmailModalVisible] = useState(false);
    const [isAddressModalVisible, setAddressModalVisible] = useState(false);

    // Edit states
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');

    // Address Dropdown States
    const [regions, setRegions] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [barangays, setBarangays] = useState<any[]>([]);

    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedBarangay, setSelectedBarangay] = useState('');
    const [streetAddress, setStreetAddress] = useState('');

    useEffect(() => {
        const loadTokenAndProfile = async () => {
            const storedToken = await AsyncStorage.getItem('userToken');
            if (storedToken) {
                setToken(storedToken);
                try {
                    const res = await fetch(`${API_URL}/api/profile/`, {
                    const res = await fetch(`${API_BASE_URL}/api/profile/`, {
                        headers: { 'Authorization': `Token ${storedToken}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setProfile(data);
                        setEditName(data.full_name || '');
                        setSelectedRegion(data.region_code || '');
                        setSelectedCity(data.city_code || '');
                        setSelectedBarangay(data.barangay_code || '');
                        setStreetAddress(data.street_address || '');
                        
                        if (data.region_code) fetchCities(data.region_code);
                        if (data.city_code) fetchBarangays(data.city_code);
                        setEditName(data.full_name || '');
                        setEditEmail(data.email || '');
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

            const response = await fetch(`${API_URL}/api/profile/`, {
            const response = await fetch(`${API_BASE_URL}/api/profile/`, {
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
            { full_name: editName },
            setLoadingName,
            () => setNameModalVisible(false)
        );
    };

    const handleSaveEmail = () => {
        if (!editEmail.trim()) {
            alert("Email cannot be empty.");
            return;
        }
        updateBackendProfile(
            { email: editEmail },
            setLoadingEmail,
            () => setEmailModalVisible(false)
        );
    };

    const handleSaveAddress = () => {
        const regionName = regions.find(r => r.code === selectedRegion)?.name || '';
        const cityName = cities.find(c => c.code === selectedCity)?.name || '';
        const brgyName = barangays.find(b => b.code === selectedBarangay)?.name || '';
        
        const fullAddress = `${streetAddress}, ${brgyName}, ${cityName}, ${regionName}`.replace(/^, | ,/g, '').trim();
        
        updateBackendProfile(
            { 
                address: fullAddress,
                region_code: selectedRegion,
                city_code: selectedCity,
                barangay_code: selectedBarangay,
                street_address: streetAddress
            },
            setLoadingAddress,
            () => setAddressModalVisible(false)
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#101622" />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header Section (Dark Blue Background) */}
            <View style={styles.header}>
                {/* Back button (Top Left) */}
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <MaterialIcons name="keyboard-arrow-left" size={28} color="white" />
                </TouchableOpacity>

                {/* Edit icon (Top Right) */}
                <TouchableOpacity style={styles.editIcon}>
                    <Feather name="edit" size={20} color="white" />
                </TouchableOpacity>

                {/* Circular Profile Avatar */}
                <View style={styles.avatarCircle}>
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>
                            {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
                        </Text>
                    </View>
                </View>

                {/* Subtitle */}
                <Text style={styles.profilePhotoText}>PROFILE PHOTO</Text>
            </View>

                {/* Info Boxes */}
                <View style={styles.infoContainer}>
                    <TouchableOpacity style={styles.infoBox} onPress={() => setNameModalVisible(true)}>
                        <Text style={styles.infoText}>{profile?.full_name || 'Charlie C. Omongos'}</Text>
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
            {/* Content Area (Light Gray Background) */}
            <ScrollView 
                style={styles.contentScroll} 
                contentContainerStyle={styles.contentContainer} 
                showsVerticalScrollIndicator={false}
            >
                {/* Phone Number (Non-clickable) */}
                <ProfileCard 
                    label="PHONE NUMBER" 
                    value={profile?.phone_number || phone || '+6308312035'} 
                />

                {/* Name (Clickable) */}
                <ProfileCard 
                    label="NAME" 
                    value={profile?.full_name || 'Charlie C. Omongos'} 
                    onPress={() => setNameModalVisible(true)} 
                />

                {/* Email (Clickable) */}
                <ProfileCard 
                    label="EMAIL" 
                    value={profile?.email || 'Omongos.charlie@example.com'} 
                    onPress={() => setEmailModalVisible(true)} 
                />

                {/* Address (Clickable) */}
                <ProfileCard 
                    label="ADDRESS" 
                    value={profile?.address || 'California Cogon City'} 
                    onPress={() => setAddressModalVisible(true)} 
                />
            </ScrollView>

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

            {/* Email Edit Modal */}
            <Modal visible={isEmailModalVisible} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Email</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={editEmail}
                            onChangeText={setEditEmail}
                            placeholder="Enter your email"
                            placeholderTextColor="#94a3b8"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setEmailModalVisible(false)}>
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSaveEmail} disabled={loadingEmail}>
                                {loadingEmail ? <ActivityIndicator color="white" /> : <Text style={styles.modalButtonText}>Save</Text>}
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
        backgroundColor: '#0d1320', // Matches header background for clean safe area integration
    },
    header: {
        backgroundColor: '#0d1320',
        paddingTop: 50,
        paddingBottom: 25,
        alignItems: 'center',
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        left: 20,
        top: 40,
        padding: 5,
    },
    editIcon: {
        position: 'absolute',
        right: 20,
        top: 40,
        padding: 5,
    },
    avatarCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        marginBottom: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarPlaceholder: {
        backgroundColor: '#f8cda5',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#d97706',
        fontWeight: 'bold',
        fontSize: 64,
    },
    profilePhotoText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1.5,
    },
    blueDivider: {
        height: 4,
        backgroundColor: '#0084ff',
    },
    contentScroll: {
        flex: 1,
        backgroundColor: '#dbdbdb',
    },
    contentContainer: {
        paddingTop: 20,
        paddingBottom: 40,
        paddingHorizontal: 20,
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
