import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ProfileCardProps {
    label: string;
    value: string;
    onPress?: () => void;
}

export const ProfileCard = ({ label, value, onPress }: ProfileCardProps) => {
    const isEditable = !!onPress;
    const CardContainer = isEditable ? TouchableOpacity : View;

    return (
        <CardContainer 
            style={styles.card} 
            onPress={onPress} 
            activeOpacity={isEditable ? 0.6 : 1}
        >
            <View style={styles.cardTextContainer}>
                <Text style={styles.cardLabel}>{label}</Text>
                <Text style={styles.cardValue}>{value}</Text>
            </View>
            {isEditable && (
                <MaterialIcons name="keyboard-arrow-right" size={32} color="black" />
            )}
        </CardContainer>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#ffffff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 20,
        paddingHorizontal: 20,
        marginBottom: 16,
        borderRadius: 0,
    },
    cardTextContainer: {
        flex: 1,
    },
    cardLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 8,
    },
    cardValue: {
        fontSize: 14,
        color: '#4b5563',
    },
});
